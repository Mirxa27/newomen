import { supabase } from "@/integrations/supabase/client";
import { newMeMemoryService } from "@/services/NewMeMemoryService";
import { aiService } from "../aiService";
import { NEWME_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import type { AIResponse } from '../aiTypes';
import type { NewMeUserContext } from "@/types/newme-memory-types";

const buildContextPrompt = (userContext: NewMeUserContext | null): string => {
    if (!userContext) return '';
    const lines: string[] = [];
    if (userContext.nickname) lines.push(`- User's preferred nickname: ${userContext.nickname}`);
    if (userContext.last_conversation_date) {
        const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(userContext.last_conversation_date);
        if (daysSince === 0) lines.push("- You spoke with them earlier today. Pick up the thread naturally as if no time has passed.");
        else if (daysSince === 1) lines.push("- It has been 1 day since your last conversation. Acknowledge the brief gap with warmth.");
        else if (daysSince < 999) lines.push(`- It has been ${daysSince} days since you last spoke. Mention this gap with affection when you greet them.`);
    }
    if (userContext.last_conversation_topic) lines.push(`- Last conversation topic: ${userContext.last_conversation_topic}. Reference it in your opening memory weave.`);
    if (userContext.emotional_patterns?.length) lines.push(`- Recurring emotional themes to keep in mind: ${userContext.emotional_patterns.slice(0, 3).join(', ')}.`);
    if (userContext.completed_assessments?.length) lines.push(`- They have completed these assessments: ${userContext.completed_assessments.join(', ')}. Use them to ground insights.`);
    if (userContext.important_memories?.length) {
        const memorySnippets = userContext.important_memories.slice(0, 3).map((memory) => `${memory.type}: ${memory.value}`);
        lines.push(`- Important memories to naturally weave into conversation: ${memorySnippets.join('; ')}.`);
    }
    
    if (lines.length === 0) return '';
    return `\n\n### CURRENT USER CONTEXT:\n${lines.join('\n')}`;
};

export async function generateNewMeResponse(
    userMessage: string,
    userId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    conversationId?: string
): Promise<AIResponse & { conversationId?: string }> {
    const startTime = Date.now();
    try {
        const config = await aiService.configService.getConfigurationForService('voice_conversation');
        if (!config) throw new Error('NewMe Voice Agent configuration not found');

        let activeConversation = conversationId ? null : await newMeMemoryService.getActiveConversation(userId);
        if (!activeConversation && !conversationId) {
            activeConversation = await newMeMemoryService.createConversation({ user_id: userId });
        }
        const currentConversationId = conversationId || activeConversation?.id;

        const userContext = await newMeMemoryService.getUserContext(userId);
        const contextPrompt = buildContextPrompt(userContext);

        let fullPrompt = (config.systemPrompt || '') + contextPrompt + '\n\n';
        if (conversationHistory.length > 0) {
            fullPrompt += '### CONVERSATION HISTORY:\n';
            conversationHistory.forEach(msg => {
                fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
            });
            fullPrompt += '\n';
        }
        fullPrompt += `### CURRENT USER MESSAGE:\nUSER: ${userMessage}\n\nRespond as NewMe, staying fully in character:`;

        const response = await aiService.callAIProvider(config, fullPrompt);
        if (!response.success) throw new Error(response.error || 'AI processing failed');

        if (currentConversationId) {
            await newMeMemoryService.addMessage({ conversation_id: currentConversationId, role: 'user', content: userMessage });
            if (response.content) {
                await newMeMemoryService.addMessage({ conversation_id: currentConversationId, role: 'assistant', content: response.content });
            }
        }

        return { ...response, conversationId: currentConversationId };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processing_time_ms: Date.now() - startTime
        };
    }
}

export async function getNewMeGreeting(userId: string, userContext: NewMeUserContext | null): Promise<string> {
    try {
        if (!userContext || !userContext.last_conversation_date) {
            const templates = NEWME_GREETING_TEMPLATES.firstTime;
            let greeting = templates[Math.floor(Math.random() * templates.length)];
            greeting = greeting.replace('[nickname]', userContext?.nickname || 'there');
            return greeting;
        }

        const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(userContext.last_conversation_date);
        const nickname = userContext.nickname;

        if (daysSince > 7) {
            const templates = NEWME_GREETING_TEMPLATES.afterLongBreak;
            let greeting = templates[Math.floor(Math.random() * templates.length)];
            if (nickname) greeting = greeting.replace('[nickname]', nickname);
            if (userContext.last_conversation_topic) {
                greeting = greeting.replace('[last topic]', userContext.last_conversation_topic);
            } else {
                greeting = greeting.replace(' about [last topic]', '');
            }
            return greeting;
        }

        const templates = NEWME_GREETING_TEMPLATES.returning;
        let greeting = templates[Math.floor(Math.random() * templates.length)];
        if (nickname) greeting = greeting.replace('[nickname]', nickname);
        return greeting;
    } catch (error) {
        console.error('Error getting NewMe greeting:', error);
        const templates = NEWME_GREETING_TEMPLATES.firstTime;
        let greeting = templates[Math.floor(Math.random() * templates.length)];
        greeting = greeting.replace('[nickname]', userContext?.nickname || 'there');
        return greeting;
    }
}
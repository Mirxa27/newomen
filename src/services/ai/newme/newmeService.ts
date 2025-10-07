import { supabase } from "@/integrations/supabase/client";
import { newMeMemoryService } from "@/services/NewMeMemoryService";
import { aiService } from "../aiService";
import { NEWME_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import type { AIResponse } from '../aiTypes';
import type { NewMeUserContext } from "@/types/newme-memory-types";

const buildContextPrompt = (userContext: NewMeUserContext | null): string => {
    if (!userContext) return '';
    let contextPrompt = `\n\n### CURRENT USER CONTEXT:\n`;
    if (userContext.nickname) contextPrompt += `- User's preferred nickname: ${userContext.nickname}\n`;
    if (userContext.last_conversation_date) {
        const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(userContext.last_conversation_date);
        contextPrompt += `- Last conversation: ${daysSince} days ago\n`;
        if (userContext.last_conversation_topic) contextPrompt += `- Last topic: ${userContext.last_conversation_topic}\n`;
    }
    if (userContext.important_memories?.length) {
        contextPrompt += `- Important memories:\n`;
        userContext.important_memories.slice(0, 5).forEach(m => {
            contextPrompt += `  * ${m.type}: ${m.key} = ${m.value}\n`;
        });
    }
    return contextPrompt;
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

export async function getNewMeGreeting(userId: string): Promise<string> {
    try {
        const userContext = await newMeMemoryService.getUserContext(userId);
        if (!userContext || !userContext.last_conversation_date) {
            const templates = NEWME_GREETING_TEMPLATES.firstTime;
            return templates[Math.floor(Math.random() * templates.length)];
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
        return NEWME_GREETING_TEMPLATES.firstTime[0];
    }
}
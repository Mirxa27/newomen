import { supabase } from "@/integrations/supabase/client";
import { newMeMemoryService } from "@/services/features/ai/NewMeMemoryService";
import { aiService } from "../aiService";
import { NEWME_GREETING_TEMPLATES, NEWME_FOUNDER_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import type { AIResponse } from '../aiTypes';
import type { NewMeUserContext } from "@/types/features/ai/newme-memory-types";

const buildContextPrompt = (userContext: NewMeUserContext | null, userId?: string): string => {
    if (!userContext) return '';
    const lines: string[] = [];
    
    // Special recognition for Super Admin
    if (userId === '62dab7d5-2c43-4838-b2d7-7e76492894cf' || userContext.nickname === 'Super Admin') {
        lines.push(`🌟 SPECIAL: This is the Super Admin, the security officer and maintainer of all platform standards. They have complete oversight of all user activities, conversations, and histories.`);
        lines.push(`- Security Role: They are the superadmin and security officer of the platform, maintaining all standards and watching over all user activities.`);
        lines.push(`- Full Access: They can view all session histories, user activities, and conversations.`);
        lines.push(`- Platform Guardian: They maintain all standards and ensure platform security.`);
    }
    
    // Special congratulations for Katerina on her first joining
    if (userId === '12072350-0c4c-4b34-a952-51555b6b02e3' || userContext.nickname === 'Katerina') {
        lines.push(`🌟 SPECIAL: This is Katerina, the wife of Abdullah who developed this Newomen platform for her. This is her first joining - congratulate her warmly!`);
        lines.push(`- First Time: This is Katerina's first time joining the platform her husband built for her.`);
        lines.push(`- Congratulations: Give her a warm welcome and congratulations for joining.`);
        lines.push(`- Special Welcome: Make her feel special as the person this platform was created for.`);
    }
    
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
        const contextPrompt = buildContextPrompt(userContext, userId);
        
        // Get advanced context for provocative conversations
        const advancedContext = await newMeMemoryService.buildAdvancedContext(userId);

        let fullPrompt = (config.systemPrompt || '') + contextPrompt + advancedContext + '\n\n';
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

export function getNewMeGreeting(userContext: NewMeUserContext | null, userId?: string): string {
    try {
        let nickname = userContext?.nickname;

        // Special greeting for Super Admin
        if (userId === '62dab7d5-2c43-4838-b2d7-7e76492894cf' || nickname === 'Super Admin') {
            return "Super Admin... *acknowledging tone* The security officer and guardian of this platform. You maintain all standards and watch over every user's journey. How may I assist you in your oversight duties today?";
        }
        
        // Special congratulations for Katerina on her first joining
        if (userId === '12072350-0c4c-4b34-a952-51555b6b02e3' || nickname === 'Katerina') {
            return "Katerina... *warm, excited tone* Welcome! Welcome to the platform your husband Abdullah built especially for you. This is such a special moment - your first time joining Newomen! I'm so excited to meet you and help you on your journey. How are you feeling about this new adventure?";
        }

        // BUG FIX: Explicitly guard against using AI's own name or generic roles.
        if (nickname && ['newme', 'newomen', 'admin', 'user'].includes(nickname.toLowerCase())) {
            nickname = undefined;
        }

        // If we don't have a valid nickname, treat it as a first-time interaction for greeting purposes.
        if (!nickname || !userContext || !userContext.last_conversation_date) {
            const templates = NEWME_GREETING_TEMPLATES.firstTime;
            let greeting = templates[Math.floor(Math.random() * templates.length)];
            // The firstTime template is designed to work with or without a nickname.
            greeting = greeting.replace('[nickname]', nickname || 'there');
            return greeting;
        }

        const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(userContext.last_conversation_date);

        if (daysSince > 7) {
            const templates = NEWME_GREETING_TEMPLATES.afterLongBreak;
            let greeting = templates[Math.floor(Math.random() * templates.length)];
            greeting = greeting.replace('[nickname]', nickname);
            if (userContext.last_conversation_topic) {
                greeting = greeting.replace('[last topic]', userContext.last_conversation_topic);
            } else {
                // Clean up the placeholder if no topic exists
                greeting = greeting.replace(' about [last topic]', '');
                greeting = greeting.replace(' dealing with [last topic]', '');
            }
            return greeting;
        }

        // Default returning user
        const templates = NEWME_GREETING_TEMPLATES.returning;
        let greeting = templates[Math.floor(Math.random() * templates.length)];
        greeting = greeting.replace('[nickname]', nickname);
        return greeting;

    } catch (error) {
        console.error('Error getting NewMe greeting:', error);
        // Fallback to a safe, generic greeting
        const templates = NEWME_GREETING_TEMPLATES.firstTime;
        let greeting = templates[Math.floor(Math.random() * templates.length)];
        greeting = greeting.replace('[nickname]', 'there');
        return greeting;
    }
}
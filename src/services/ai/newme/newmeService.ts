import { logger } from '@/lib/logging';
import { newMeMemoryService } from '@/services/NewMeMemoryService';
import { aiService } from '@/services/AIService';
import { AIMessage } from '@/services/AIService';

export class NewMeService {
  private static instance: NewMeService;

  private constructor() {}

  public static getInstance(): NewMeService {
    if (!NewMeService.instance) {
      NewMeService.instance = new NewMeService();
    }
    return NewMeService.instance;
  }

  public async processUserMessage(userId: string, conversationId: string, message: string): Promise<string> {
    try {
      await newMeMemoryService.logNewMessage({
        conversation_id: conversationId,
        sender: 'user',
        text_content: message,
      });

      const userContext = await newMeMemoryService.getUserContext(userId);
      const aiConfig = aiService.getDefaultConfiguration();

      if (!aiConfig) {
        throw new Error('Default AI configuration not found.');
      }

      const messages: AIMessage[] = [
        { role: 'system', content: `User context: ${JSON.stringify(userContext)}` },
        { role: 'user', content: message },
      ];

      const response = await aiService.callAIProvider(aiConfig, messages);

      if (response.error || !response.text) {
        throw new Error(response.error || 'AI response was empty.');
      }

      await newMeMemoryService.logNewMessage({
        conversation_id: conversationId,
        sender: 'assistant',
        text_content: response.text,
      });

      return response.text;
    } catch (e) {
      logger.error('Error processing user message in NewMeService:', e);
      return "I'm sorry, I encountered an error. Please try again.";
    }
  }
}
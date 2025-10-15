import { useState, useCallback, useRef } from 'react';
import { useToast } from './useToast';

interface AICommandParameters {
  url?: string;
  query?: string;
  selector?: string;
  direction?: 'up' | 'down';
  amount?: number;
  [key: string]: string | number | undefined;
}

interface AICommand {
  type: 'search' | 'navigate' | 'new_tab' | 'close_tab' | 'screenshot' | 'scroll' | 'click' | 'extract';
  parameters: AICommandParameters;
  context?: string;
}

interface AIResponse {
  success: boolean;
  data?: string | object | null;
  error?: string;
  suggestedActions?: AICommand[];
}

interface UseAIAgentOptions {
  onCommand?: (command: AICommand) => Promise<AIResponse>;
  onError?: (error: string) => void;
  enableLogging?: boolean;
}

export function useAIAgent(options: UseAIAgentOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<AICommand | null>(null);
  const { toast } = useToast();
  
  const commandHistory = useRef<AICommand[]>([]);

  const parseNaturalLanguage = useCallback((input: string): AICommand => {
    const lowerInput = input.toLowerCase().trim();
    
    // Search commands
    if (lowerInput.match(/^(search|find|look up|google)\s+(.+)/i)) {
      const query = input.replace(/^(search|find|look up|google)\s+/i, '');
      return {
        type: 'search',
        parameters: { query, engine: 'google' }
      };
    }
    
    // Navigation commands
    if (lowerInput.match(/^(go to|visit|open|navigate to)\s+(.+)/i)) {
      const url = input.replace(/^(go to|visit|open|navigate to)\s+/i, '');
      return {
        type: 'navigate',
        parameters: { url: url.startsWith('http') ? url : `https://${url}` }
      };
    }
    
    // Tab management
    if (lowerInput.match(/^(new tab|create tab|open tab)/i)) {
      return { type: 'new_tab', parameters: {} };
    }
    
    if (lowerInput.match(/^(close tab|close this tab)/i)) {
      return { type: 'close_tab', parameters: {} };
    }
    
    // Screenshot
    if (lowerInput.match(/^(screenshot|capture|take screenshot)/i)) {
      return { type: 'screenshot', parameters: {} };
    }
    
    // Scroll commands
    if (lowerInput.match(/^(scroll down|scroll to bottom)/i)) {
      return { type: 'scroll', parameters: { direction: 'down', amount: 'full' } };
    }
    
    if (lowerInput.match(/^(scroll up|scroll to top)/i)) {
      return { type: 'scroll', parameters: { direction: 'up', amount: 'full' } };
    }
    
    // Click commands
    if (lowerInput.match(/^(click on|click)\s+(.+)/i)) {
      const target = input.replace(/^(click on|click)\s+/i, '');
      return { type: 'click', parameters: { target } };
    }
    
    // Extract content
    if (lowerInput.match(/^(extract|get|read)\s+(.+)/i)) {
      const contentType = input.replace(/^(extract|get|read)\s+/i, '');
      return { type: 'extract', parameters: { contentType } };
    }
    
    // Default to search
    return {
      type: 'search',
      parameters: { query: input, engine: 'google' }
    };
  }, []);

  const executeCommand = useCallback(async (command: AICommand): Promise<AIResponse> => {
    setIsProcessing(true);
    setLastCommand(command);
    commandHistory.current.push(command);

    try {
      let response: AIResponse;

      if (options.onCommand) {
        response = await options.onCommand(command);
      } else {
        // Default implementation
        response = await executeDefaultCommand(command);
      }

      if (!response.success && options.onError) {
        options.onError(response.error || 'Command execution failed');
      }

      if (options.enableLogging) {
        console.log('AI Command:', command);
        console.log('AI Response:', response);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      toast({
        title: 'AI Command Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, [options, toast]);

  const executeDefaultCommand = async (command: AICommand): Promise<AIResponse> => {
    switch (command.type) {
      case 'search': {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(command.parameters.query || '')}`;
        window.open(searchUrl, '_blank');
        return {
          success: true,
          data: { url: searchUrl, query: command.parameters.query },
          suggestedActions: [
            { type: 'navigate', parameters: { url: searchUrl } },
            { type: 'extract', parameters: { contentType: 'search results' } }
          ]
        };
      }

      case 'navigate': {
        window.open(command.parameters.url, '_blank');
        return {
          success: true,
          data: { url: command.parameters.url },
          suggestedActions: [
            { type: 'screenshot', parameters: {} },
            { type: 'extract', parameters: { contentType: 'page content' } }
          ]
        };
      }

      case 'new_tab': {
        window.open('about:blank', '_blank');
        return {
          success: true,
          data: { action: 'new tab opened' },
          suggestedActions: [{ type: 'navigate', parameters: { url: 'https://google.com' } }]
        };
      }

      case 'close_tab': {
        // Note: This is limited by browser security
        return {
          success: false,
          error: 'Cannot close tabs due to browser security restrictions'
        };
      }

      case 'screenshot': {
        return {
          success: true,
          data: { action: 'screenshot requested' },
          suggestedActions: [{ type: 'extract', parameters: { contentType: 'visible content' } }]
        };
      }

      case 'scroll': {
        return {
          success: true,
          data: { direction: command.parameters.direction, amount: command.parameters.amount },
          suggestedActions: [{ type: 'extract', parameters: { contentType: 'newly visible content' } }]
        };
      }

      case 'click': {
        return {
          success: true,
          data: { target: command.parameters.target },
          suggestedActions: [
            { type: 'screenshot', parameters: {} },
            { type: 'extract', parameters: { contentType: 'interaction result' } }
          ]
        };
      }

      case 'extract': {
        return {
          success: true,
          data: { contentType: command.parameters.contentType },
          suggestedActions: [{ type: 'screenshot', parameters: {} }]
        };
      }

      default: {
        return {
          success: false,
          error: `Unknown command type: ${command.type}`
        };
      }
    }
  };

  const processNaturalLanguageCommand = useCallback(async (input: string) => {
    const command = parseNaturalLanguage(input);
    return executeCommand(command);
  }, [parseNaturalLanguage, executeCommand]);

  const getCommandHistory = useCallback(() => {
    return [...commandHistory.current];
  }, []);

  const clearHistory = useCallback(() => {
    commandHistory.current = [];
    setLastCommand(null);
  }, []);

  return {
    isProcessing,
    lastCommand,
    executeCommand,
    processNaturalLanguageCommand,
    parseNaturalLanguage,
    getCommandHistory,
    clearHistory
  };
}

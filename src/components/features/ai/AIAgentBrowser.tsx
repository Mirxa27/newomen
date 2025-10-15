import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Search, Globe, Settings, X, Plus } from 'lucide-react';
// supabase client not needed in this component currently
import { useToast } from '@/hooks/shared/ui/use-toast';
import { cn } from '@/lib/shared/utils/utils';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    searchQuery?: string;
    urls?: string[];
    action?: string;
  };
}

interface VoiceSession {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: { error: string }) => void;
  start: () => void;
  stop: () => void;
}

export function AIAgentBrowser() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: '', isActive: true }
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  // voice mode toggling not needed; using inline controls
  const [voiceSession, setVoiceSession] = useState<VoiceSession>({
    isListening: false,
    transcript: '',
    interimTranscript: ''
  });
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    voiceEnabled: true,
    autoSpeak: false,
    searchEngine: 'google'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load saved session
  useEffect(() => {
    const savedTabs = localStorage.getItem('ai-browser-tabs');
    const savedMessages = localStorage.getItem('ai-browser-messages');
    const savedSettings = localStorage.getItem('ai-browser-settings');

    if (savedTabs) setTabs(JSON.parse(savedTabs));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Save session
  useEffect(() => {
    localStorage.setItem('ai-browser-tabs', JSON.stringify(tabs));
    localStorage.setItem('ai-browser-messages', JSON.stringify(messages));
    localStorage.setItem('ai-browser-settings', JSON.stringify(settings));
  }, [tabs, messages, settings]);

  // voice init moved below handleSendMessage to avoid forward reference

  const addTab = useCallback(() => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url: '',
      isActive: true
    };
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: false })).concat(newTab));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (filtered.length === 0) {
        return [{ id: Date.now().toString(), title: 'New Tab', url: '', isActive: true }];
      }
      if (!filtered.some(tab => tab.isActive)) {
        filtered[filtered.length - 1].isActive = true;
      }
      return filtered;
    });
  }, []);

  const switchTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
  }, []);

  const navigateToUrl = useCallback((url: string) => {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    setCurrentUrl(url);
    setTabs(prev => prev.map(tab => 
      tab.isActive ? { ...tab, url, title: 'Loading...' } : tab
    ));
  }, []);

  const searchWeb = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      navigateToUrl(searchUrl);
      
      // Store search in messages
      const searchMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Searching for: ${query}`,
        timestamp: new Date(),
        metadata: { searchQuery: query, action: 'search' }
      };
      setMessages(prev => [...prev, searchMessage]);
    } catch (error) {
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigateToUrl, toast]);

  const processNaturalLanguage = useCallback(async (command: string) => {
    setIsLoading(true);
    
    // Simple NLP processing for demo
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || lowerCommand.includes('look up')) {
      const searchTerm = command.replace(/search|find|look up|for/gi, '').trim();
      await searchWeb(searchTerm);
    } else if (lowerCommand.includes('go to') || lowerCommand.includes('visit') || lowerCommand.includes('open')) {
      const url = command.replace(/go to|visit|open/gi, '').trim();
      navigateToUrl(url);
    } else if (lowerCommand.includes('new tab')) {
      addTab();
    } else if (lowerCommand.includes('close tab')) {
      const activeTab = tabs.find(tab => tab.isActive);
      if (activeTab) closeTab(activeTab.id);
    } else {
      // Default to search
      await searchWeb(command);
    }
    
    setIsLoading(false);
  }, [searchWeb, navigateToUrl, addTab, closeTab, tabs]);

  const handleSendMessage = useCallback(async (message?: string) => {
    const text = message || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setVoiceSession(prev => ({ ...prev, transcript: '', interimTranscript: '' }));

    await processNaturalLanguage(text);
  }, [inputValue, processNaturalLanguage]);

  // Initialize voice recognition (placed after handleSendMessage to avoid forward reference)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const w = window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor; SpeechRecognition?: SpeechRecognitionConstructor };
      const SpeechRecognitionCtor = (w.webkitSpeechRecognition || w.SpeechRecognition)!;
      recognitionRef.current = new SpeechRecognitionCtor() as SpeechRecognitionLike;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i] as SpeechRecognitionResult;
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setVoiceSession(prev => ({
          ...prev,
          transcript: finalTranscript,
          interimTranscript
        }));

        if (finalTranscript) {
          setInputValue(finalTranscript);
          handleSendMessage(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: { error: string }) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: 'Voice Error',
          description: 'Failed to recognize speech. Please try again.',
          variant: 'destructive'
        });
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, [handleSendMessage, toast]);

  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setVoiceSession(prev => ({ ...prev, isListening: true }));
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceSession(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!settings.autoSpeak || !synthesisRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthesisRef.current.speak(utterance);
  }, [settings.autoSpeak]);

  const activeTab = tabs.find(tab => tab.isActive);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Tab Bar */}
      <div className="flex items-center bg-white border-b border-gray-200 px-2 py-1">
        <div className="flex-1 flex items-center space-x-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-t-md cursor-pointer transition-colors',
                tab.isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              )}
              onClick={() => switchTab(tab.id)}
            >
              {tab.favicon && <img src={tab.favicon} alt="" className="w-4 h-4" />}
              <span className="text-sm truncate max-w-32">{tab.title}</span>
              <button
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                title="Close tab"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <button
          className="p-1 hover:bg-gray-200 rounded-md"
          title="New tab"
          aria-label="New tab"
          onClick={addTab}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* URL Bar */}
      <div className="flex items-center bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-2 flex-1">
          <Globe className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && navigateToUrl(currentUrl)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
            placeholder="Enter URL or search query..."
          />
          <button
            className="p-1 hover:bg-gray-200 rounded-md"
            title="Go"
            aria-label="Go"
            onClick={() => navigateToUrl(currentUrl)}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button
          className="p-1 hover:bg-gray-200 rounded-md ml-2"
          title="Open settings"
          aria-label="Open settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Browser View */}
        <div className="flex-1 flex flex-col">
          {activeTab?.url ? (
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              className="flex-1 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={activeTab.title}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">AI Browser Agent</h3>
                <p className="text-gray-500 mt-2">Enter a URL or ask me to search for something</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-sm text-gray-600">Ask me to browse, search, or navigate</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs px-4 py-2 rounded-lg',
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                className={cn(
                  'p-2 rounded-md transition-colors',
                  voiceSession.isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                )}
                title={voiceSession.isListening ? 'Stop voice' : 'Start voice'}
                aria-label={voiceSession.isListening ? 'Stop voice' : 'Start voice'}
                onClick={voiceSession.isListening ? stopVoiceRecognition : startVoiceRecognition}
              >
                {voiceSession.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={inputValue || voiceSession.interimTranscript}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Type a command or use voice..."
              />
              <button
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                title="Send"
                aria-label="Send"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() && !voiceSession.interimTranscript}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {voiceSession.interimTranscript && (
              <p className="text-xs text-gray-500 mt-2 italic">
                Listening: {voiceSession.interimTranscript}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                className="p-1 hover:bg-gray-200 rounded-md"
                title="Close settings"
                aria-label="Close settings"
                onClick={() => setIsSettingsOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="aiProviderSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  AI Provider
                </label>
                <select
                  id="aiProviderSelect"
                  value={settings.aiProvider}
                  onChange={(e) => setSettings(prev => ({ ...prev, aiProvider: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.voiceEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable voice commands</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoSpeak: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-speak responses</span>
                </label>
              </div>
              
              <div>
                <label htmlFor="searchEngineSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Engine
                </label>
                <select
                  id="searchEngineSelect"
                  value={settings.searchEngine}
                  onChange={(e) => setSettings(prev => ({ ...prev, searchEngine: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                  <option value="duckduckgo">DuckDuckGo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

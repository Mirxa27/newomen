import React, { useState, useEffect, useCallback } from 'react';
import { AIAgentBrowser } from '@/components/features/ai/AIAgentBrowser';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Settings, Bot, Mic, Globe, Shield } from 'lucide-react';

interface AIAgentBrowserPageProps {
  className?: string;
}

export default AIAgentBrowserPage;

export function AIAgentBrowserPage({ className }: AIAgentBrowserPageProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    voiceEnabled: true,
    autoSpeak: false,
    searchEngine: 'google',
    sandboxMode: true,
    sessionPersistence: true,
    realTimeTranscription: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-browser-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('ai-browser-settings', JSON.stringify(settings));
  }, [settings]);

  type Settings = typeof settings;
  const handleSettingChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings]);

  const handleWelcomeDismiss = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('ai-browser-welcome-dismissed', 'true');
  }, []);

  // Check if welcome was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('ai-browser-welcome-dismissed');
    if (dismissed === 'true') {
      setShowWelcome(false);
    }
  }, []);

  return (
    <div className={className}>
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-6 h-6" />
                <span>Welcome to AI Browser Agent</span>
              </CardTitle>
              <CardDescription>
                Your intelligent web browsing companion with voice commands and AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Mic className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Voice Commands</h4>
                    <p className="text-sm text-gray-600">
                      Use natural language to search, navigate, and control your browser
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Multi-Tab Management</h4>
                    <p className="text-sm text-gray-600">
                      Organize tabs into groups and manage multiple browsing sessions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Secure Browsing</h4>
                    <p className="text-sm text-gray-600">
                      Sandboxed environment with security indicators and safe browsing
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Bot className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">AI Assistance</h4>
                    <p className="text-sm text-gray-600">
                      Get intelligent suggestions and automated browsing actions
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleWelcomeDismiss}>
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold flex items-center space-x-2">
                <Bot className="w-6 h-6" />
                <span>AI Browser Agent</span>
              </h1>
              
              {user && (
                <div className="text-sm text-gray-600">
                  Welcome, {user.email}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mx-4 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">AI Browser Settings</CardTitle>
              <CardDescription>
                Configure your AI browsing experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select 
                    value={settings.aiProvider} 
                    onValueChange={(value) => handleSettingChange('aiProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Search Engine</Label>
                  <Select 
                    value={settings.searchEngine} 
                    onValueChange={(value) => handleSettingChange('searchEngine', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="bing">Bing</SelectItem>
                      <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable Voice Commands</Label>
                  <Switch
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked) => handleSettingChange('voiceEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Auto-Speak Responses</Label>
                  <Switch
                    checked={settings.autoSpeak}
                    onCheckedChange={(checked) => handleSettingChange('autoSpeak', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Sandbox Mode</Label>
                  <Switch
                    checked={settings.sandboxMode}
                    onCheckedChange={(checked) => handleSettingChange('sandboxMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Session Persistence</Label>
                  <Switch
                    checked={settings.sessionPersistence}
                    onCheckedChange={(checked) => handleSettingChange('sessionPersistence', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Browser Interface */}
        <div className="flex-1 overflow-hidden">
          <AIAgentBrowser />
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>AI Browser Agent v1.0</span>
              <span>•</span>
              <span>Voice Commands: {settings.voiceEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>•</span>
              <span>Sandbox: {settings.sandboxMode ? 'Enabled' : 'Disabled'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Status:</span>
              <span className="text-green-600">Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

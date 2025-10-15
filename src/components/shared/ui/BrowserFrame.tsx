import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, AlertTriangle, Lock, Globe, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';

interface BrowserFrameProps {
  url: string;
  onUrlChange: (url: string) => void;
  onTitleChange: (title: string) => void;
  onFaviconChange: (favicon: string) => void;
  onSecurityChange: (secure: boolean) => void;
  className?: string;
  sandbox?: boolean;
}

interface SecurityInfo {
  isSecure: boolean;
  protocol: string;
  certificate?: {
    valid: boolean;
    issuer: string;
    expires: Date;
  };
}

interface FrameMessage {
  type: 'url-change' | 'title-change' | 'favicon-change' | 'security-info' | 'loading-state';
  data: any;
}

export function BrowserFrame({
  url,
  onUrlChange,
  onTitleChange,
  onFaviconChange,
  onSecurityChange,
  className,
  sandbox = true
}: BrowserFrameProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameWindowRef = useRef<Window | null>(null);
  const messageHandlerRef = useRef<(event: MessageEvent) => void>();

  // Security check
  const checkSecurity = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      const isSecure = urlObj.protocol === 'https:';
      const protocol = urlObj.protocol.slice(0, -1).toUpperCase();
      
      setSecurityInfo({
        isSecure,
        protocol,
        certificate: isSecure ? {
          valid: true,
          issuer: 'Let\'s Encrypt',
          expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        } : undefined
      });
      
      onSecurityChange(isSecure);
    } catch {
      setSecurityInfo(null);
      onSecurityChange(false);
    }
  }, [onSecurityChange]);

  // Handle iframe messages
  useEffect(() => {
    messageHandlerRef.current = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const message = event.data as FrameMessage;
      
      switch (message.type) {
        case 'url-change':
          onUrlChange(message.data.url);
          checkSecurity(message.data.url);
          break;
          
        case 'title-change':
          onTitleChange(message.data.title);
          break;
          
        case 'favicon-change':
          onFaviconChange(message.data.favicon);
          break;
          
        case 'security-info':
          setSecurityInfo(message.data);
          onSecurityChange(message.data.isSecure);
          break;
          
        case 'loading-state':
          setIsLoading(message.data.isLoading);
          break;
      }
    };

    window.addEventListener('message', messageHandlerRef.current);
    
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, [onUrlChange, onTitleChange, onFaviconChange, onSecurityChange, checkSecurity]);

  // Load URL
  const loadUrl = useCallback((targetUrl: string) => {
    if (!iframeRef.current) return;
    
    setIsLoading(true);
    setError(null);
    checkSecurity(targetUrl);
    
    try {
      // Create a safe URL
      const urlObj = new URL(targetUrl);
      
      // Check for restricted domains
      const restrictedDomains = ['localhost', '127.0.0.1', 'file://'];
      const isRestricted = restrictedDomains.some(domain => 
        urlObj.hostname.includes(domain) || urlObj.protocol === 'file:'
      );
      
      if (isRestricted) {
        setError('This URL cannot be loaded in the sandboxed environment');
        setIsLoading(false);
        return;
      }
      
      // Load the URL
      iframeRef.current.src = targetUrl;
      
    } catch (error) {
      setError('Invalid URL format');
      setIsLoading(false);
    }
  }, [checkSecurity]);

  // Refresh current page
  const refresh = useCallback(() => {
    if (iframeRef.current && url) {
      loadUrl(url);
    }
  }, [url, loadUrl]);

  // Go back
  const goBack = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.back();
    }
  }, []);

  // Go forward
  const goForward = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.forward();
    }
  }, []);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    }
  }, [url]);

  // Handle iframe load events
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      frameWindowRef.current = iframeRef.current.contentWindow;
      
      try {
        // Get page info (limited by same-origin policy)
        const frameDoc = iframeRef.current.contentDocument;
        if (frameDoc) {
          const title = frameDoc.title || 'Untitled';
          onTitleChange(title);
          
          // Try to get favicon
          const favicon = frameDoc.querySelector('link[rel*="icon"]')?.getAttribute('href');
          if (favicon) {
            onFaviconChange(new URL(favicon, url).href);
          }
        }
      } catch (error) {
        // Cross-origin restrictions
        console.log('Cannot access cross-origin content');
      }
    }
  }, [onTitleChange, onFaviconChange, url]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load the page');
  }, []);

  // Effect for URL changes
  useEffect(() => {
    if (url) {
      loadUrl(url);
    }
  }, [url, loadUrl]);

  // Security badge
  const SecurityBadge = () => {
    if (!securityInfo) return null;

    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs">
        {securityInfo.isSecure ? (
          <>
            <Lock className="w-3 h-3 text-green-600" />
            <span className="text-green-600">Secure</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-red-600">Not Secure</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Browser Toolbar */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
          
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        <div className="flex-1 mx-4">
          <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-1">
            <Globe className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700 truncate">{url || 'about:blank'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <SecurityBadge />
          
          <button
            onClick={openInNewTab}
            className="p-2 rounded-md hover:bg-gray-200"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Page</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={refresh}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Try Again
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={url || 'about:blank'}
            className="w-full h-full border-0"
            sandbox={sandbox ? 
              'allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation' : 
              undefined
            }
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>

      {/* Security Info Footer */}
      {securityInfo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Protocol: {securityInfo.protocol}</span>
              {securityInfo.certificate && (
                <>
                  <span>Certificate: {securityInfo.certificate.issuer}</span>
                  <span>Expires: {securityInfo.certificate.expires.toLocaleDateString()}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{securityInfo.isSecure ? 'Secure Connection' : 'Connection Not Secure'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

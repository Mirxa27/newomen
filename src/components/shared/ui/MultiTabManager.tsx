import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Globe, RefreshCw, Star, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  lastAccessed: Date;
  history: string[];
}

interface TabGroup {
  id: string;
  name: string;
  tabs: Tab[];
  color: string;
}

interface MultiTabManagerProps {
  tabs: Tab[];
  onTabChange: (tabs: Tab[]) => void;
  onTabActivate: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  className?: string;
}

export function MultiTabManager({
  tabs,
  onTabChange,
  onTabActivate,
  onTabClose,
  onTabAdd,
  className
}: MultiTabManagerProps) {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showTabGroups, setShowTabGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Tab[]>([]);

  // Load saved data
  useEffect(() => {
    const savedGroups = localStorage.getItem('tab-groups');
    const savedBookmarks = localStorage.getItem('tab-bookmarks');
    
    if (savedGroups) setTabGroups(JSON.parse(savedGroups));
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('tab-groups', JSON.stringify(tabGroups));
    localStorage.setItem('tab-bookmarks', JSON.stringify(bookmarks));
  }, [tabGroups, bookmarks]);

  const addTabGroup = useCallback((name: string, color: string = '#3B82F6') => {
    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name,
      tabs: [],
      color
    };
    setTabGroups(prev => [...prev, newGroup]);
    setActiveGroup(newGroup.id);
  }, []);

  const addTabToGroup = useCallback((groupId: string, tab: Tab) => {
    setTabGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, tabs: [...group.tabs, tab] }
        : group
    ));
  }, []);

  const removeTabFromGroup = useCallback((groupId: string, tabId: string) => {
    setTabGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, tabs: group.tabs.filter(tab => tab.id !== tabId) }
        : group
    ));
  }, []);

  const bookmarkTab = useCallback((tab: Tab) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.url === tab.url);
      if (exists) return prev;
      return [...prev, { ...tab, id: `bookmark-${Date.now()}` }];
    });
  }, []);

  const removeBookmark = useCallback((tabId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== tabId));
  }, []);

  const duplicateTab = useCallback((tab: Tab) => {
    const newTab: Tab = {
      ...tab,
      id: Date.now().toString(),
      isActive: false,
      lastAccessed: new Date()
    };
    onTabChange([...tabs, newTab]);
  }, [tabs, onTabChange]);

  const refreshTab = useCallback((tabId: string) => {
    onTabChange(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, isLoading: true }
        : tab
    ));
    
    // Simulate refresh
    setTimeout(() => {
      onTabChange(tabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, isLoading: false }
          : tab
      ));
    }, 1000);
  }, [tabs, onTabChange]);

  const searchTabs = useCallback(() => {
    if (!searchQuery) return tabs;
    
    return tabs.filter(tab => 
      tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tabs, searchQuery]);

  const getFavicon = useCallback((url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return undefined;
    }
  }, []);

  const filteredTabs = searchTabs();

  return (
    <div className={cn('bg-white border-b border-gray-200', className)}>
      {/* Tab Bar */}
      <div className="flex items-center px-2 py-1 space-x-1 overflow-x-auto">
        {filteredTabs.map(tab => (
          <div
            key={tab.id}
            className={cn(
              'flex items-center space-x-2 px-3 py-1 rounded-t-md cursor-pointer transition-colors group',
              tab.isActive 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
              tab.isLoading && 'animate-pulse'
            )}
            onClick={() => onTabActivate(tab.id)}
          >
            {tab.favicon && (
              <img 
                src={tab.favicon} 
                alt="" 
                className="w-4 h-4 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = getFavicon(tab.url) || '';
                }}
              />
            )}
            <span className="text-sm truncate max-w-32">{tab.title}</span>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-0.5 hover:bg-gray-300 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  refreshTab(tab.id);
                }}
                title="Refresh tab"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              
              <button
                className="p-0.5 hover:bg-gray-300 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  bookmarkTab(tab);
                }}
                title="Bookmark tab"
              >
                <Star className="w-3 h-3" />
              </button>
              
              <button
                className="p-0.5 hover:bg-red-300 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        
        <button
          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          onClick={onTabAdd}
          title="New tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Management Toolbar */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-4 flex-1">
          <input
            type="text"
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md w-64"
          />
          
          <button
            onClick={() => setShowTabGroups(!showTabGroups)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Tab Groups ({tabGroups.length})
          </button>
          
          <button
            onClick={() => addTabGroup('New Group')}
            className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md"
          >
            New Group
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {tabs.length} tabs
          </span>
        </div>
      </div>

      {/* Tab Groups Panel */}
      {showTabGroups && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabGroups.map(group => (
              <div key={group.id} className="bg-white rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm" style={{ color: group.color }}>
                    {group.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {group.tabs.length} tabs
                  </span>
                </div>
                
                <div className="space-y-1">
                  {group.tabs.slice(0, 3).map(tab => (
                    <div key={tab.id} className="flex items-center space-x-2 text-xs">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{tab.title}</span>
                    </div>
                  ))}
                  {group.tabs.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{group.tabs.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks Panel */}
      {bookmarks.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <h4 className="font-medium text-sm mb-2">Bookmarks</h4>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className="flex items-center space-x-2 px-3 py-1 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50 cursor-pointer"
                onClick={() => onTabActivate(bookmark.id)}
              >
                {bookmark.favicon && (
                  <img src={bookmark.favicon} alt="" className="w-3 h-3" />
                )}
                <span className="truncate max-w-32">{bookmark.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(bookmark.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

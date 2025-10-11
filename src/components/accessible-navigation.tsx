'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  useKeyboardNavigation,
  useFocusManagement,
  useAriaLiveAnnouncer,
} from '@/hooks/use-accessibility';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AccessibleNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: AccessibleNavItem[];
  disabled?: boolean;
  current?: boolean;
  badge?: string | number;
}

interface AccessibleNavigationProps {
  items: AccessibleNavItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onItemClick?: (item: AccessibleNavItem) => void;
  announceNavigation?: boolean;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  orientation = 'vertical',
  className,
  onItemClick,
  announceNavigation = true,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { announce } = useAriaLiveAnnouncer();
  const { trapFocus, restoreFocus } = useFocusManagement();
  const navRef = useRef<HTMLElement>(null);

  const { handleKeyDown } = useKeyboardNavigation(
    () => {
      // Escape - close any open submenus
      setExpandedItems(new Set());
      setActiveItem(null);
    },
    () => {
      // Enter - activate current item
      if (activeItem) {
        const item = findItemById(items, activeItem);
        if (item && !item.disabled) {
          handleItemClick(item);
        }
      }
    },
    () => {
      // Arrow Up - navigate up
      navigateItems(-1);
    },
    () => {
      // Arrow Down - navigate down
      navigateItems(1);
    },
    () => {
      // Arrow Left - navigate left or collapse
      if (orientation === 'horizontal') {
        navigateItems(-1);
      } else {
        collapseCurrentItem();
      }
    },
    () => {
      // Arrow Right - navigate right or expand
      if (orientation === 'horizontal') {
        navigateItems(1);
      } else {
        expandCurrentItem();
      }
    }
  );

  const findItemById = (
    itemList: AccessibleNavItem[],
    id: string
  ): AccessibleNavItem | null => {
    for (const item of itemList) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllItems = (itemList: AccessibleNavItem[]): AccessibleNavItem[] => {
    const allItems: AccessibleNavItem[] = [];
    for (const item of itemList) {
      allItems.push(item);
      if (item.children && expandedItems.has(item.id)) {
        allItems.push(...getAllItems(item.children));
      }
    }
    return allItems;
  };

  const navigateItems = (direction: number) => {
    const allItems = getAllItems(items);
    const currentIndex = allItems.findIndex(item => item.id === activeItem);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < allItems.length) {
      const nextItem = allItems[nextIndex];
      if (!nextItem.disabled) {
        setActiveItem(nextItem.id);
        if (announceNavigation) {
          announce(`Navigated to ${nextItem.label}`);
        }
      }
    }
  };

  const expandCurrentItem = () => {
    if (activeItem) {
      const item = findItemById(items, activeItem);
      if (item && item.children) {
        setExpandedItems(prev => new Set(prev).add(item.id));
        if (announceNavigation) {
          announce(`Expanded ${item.label}`);
        }
      }
    }
  };

  const collapseCurrentItem = () => {
    if (activeItem) {
      const item = findItemById(items, activeItem);
      if (item && item.children && expandedItems.has(item.id)) {
        setExpandedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        if (announceNavigation) {
          announce(`Collapsed ${item.label}`);
        }
      }
    }
  };

  const handleItemClick = (item: AccessibleNavItem) => {
    if (item.children) {
      const isExpanded = expandedItems.has(item.id);
      if (isExpanded) {
        setExpandedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      } else {
        setExpandedItems(prev => new Set(prev).add(item.id));
      }
    } else {
      setActiveItem(item.id);
      if (announceNavigation) {
        announce(`Selected ${item.label}`);
      }
    }
    onItemClick?.(item);
  };

  const renderNavItem = (item: AccessibleNavItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} role='none'>
        <div
          role='menuitem'
          tabIndex={isActive ? 0 : -1}
          aria-current={item.current ? 'page' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-disabled={item.disabled}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isActive && 'bg-accent text-accent-foreground',
            item.current && 'bg-primary text-primary-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed',
            level > 0 && 'ml-4'
          )}
          onClick={() => !item.disabled && handleItemClick(item)}
          onKeyDown={e => handleKeyDown(e.nativeEvent)}
        >
          <div className='flex items-center space-x-2'>
            {item.icon && <span className='flex-shrink-0'>{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
              <span className='ml-auto px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full'>
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <span className='flex-shrink-0'>
              {isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <ul role='menu' className='mt-1 space-y-1'>
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      role='navigation'
      aria-label='Main navigation'
      className={cn(
        'space-y-1',
        orientation === 'horizontal' && 'flex space-x-1',
        className
      )}
    >
      <ul
        role='menu'
        className={cn(
          'space-y-1',
          orientation === 'horizontal' && 'flex space-x-1'
        )}
      >
        {items.map(item => renderNavItem(item))}
      </ul>
    </nav>
  );
};

interface AccessibleBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  separator?: React.ReactNode;
  className?: string;
  onItemClick?: (item: { label: string; href?: string }) => void;
}

export const AccessibleBreadcrumb: React.FC<AccessibleBreadcrumbProps> = ({
  items,
  separator = '/',
  className,
  onItemClick,
}) => {
  const { announce } = useAriaLiveAnnouncer();

  const handleItemClick = (item: { label: string; href?: string }) => {
    announce(`Navigated to ${item.label}`);
    onItemClick?.(item);
  };

  return (
    <nav
      role='navigation'
      aria-label='Breadcrumb'
      className={cn('flex items-center space-x-2', className)}
    >
      <ol className='flex items-center space-x-2'>
        {items.map((item, index) => (
          <li key={index} className='flex items-center'>
            {index > 0 && (
              <span className='mx-2 text-muted-foreground' aria-hidden='true'>
                {separator}
              </span>
            )}
            {item.current ? (
              <span
                className='text-sm font-medium text-foreground'
                aria-current='page'
              >
                {item.label}
              </span>
            ) : (
              <button
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => handleItemClick(item)}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

interface AccessibleTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
  announceTabChange?: boolean;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTab,
  className,
  onTabChange,
  announceTabChange = true,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const { announce } = useAriaLiveAnnouncer();
  const { handleKeyDown } = useKeyboardNavigation();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (announceTabChange) {
      const tab = tabs.find(t => t.id === tabId);
      announce(`Switched to ${tab?.label} tab`);
    }
    onTabChange?.(tabId);
  };

  const handleKeyDownEvent = (event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        handleKeyDown(event as any);
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab.disabled) {
      handleTabClick(nextTab.id);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn('space-y-4', className)}>
      <div role='tablist' aria-label='Tabs'>
        <div className='flex space-x-1 border-b'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              role='tab'
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={tab.disabled}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
              onKeyDown={e => handleKeyDownEvent(e, tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        role='tabpanel'
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className='space-y-4'
      >
        {activeTabContent}
      </div>
    </div>
  );
};

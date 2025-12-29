import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommandPalette.css';
import { clsx } from '../utils/clsx';
import { useTheme } from '../hooks/useTheme';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'action' | 'theme';
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme, setTheme } = useTheme();

  // Define commands
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View your financial overview',
        category: 'navigation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
        ),
        action: () => {
          navigate('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav-transactions',
        label: 'Go to Transactions',
        description: 'View all transactions',
        category: 'navigation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
          </svg>
        ),
        action: () => {
          navigate('/transactions');
          onClose();
        },
      },
      {
        id: 'nav-accounts',
        label: 'Go to Accounts',
        description: 'Manage your accounts',
        category: 'navigation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="10" rx="1" />
            <path d="M2 6h12" />
          </svg>
        ),
        action: () => {
          navigate('/accounts');
          onClose();
        },
      },
      {
        id: 'nav-insights',
        label: 'Go to Insights',
        description: 'View spending insights and analytics',
        category: 'navigation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 13V7M10 13V4M6 13V9M2 13v-2" strokeLinecap="round" />
          </svg>
        ),
        action: () => {
          navigate('/insights');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Configure your preferences',
        category: 'navigation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2" />
            <path d="M8 2v2M8 12v2M2 8h2M12 8h2" strokeLinecap="round" />
          </svg>
        ),
        action: () => {
          navigate('/settings');
          onClose();
        },
      },
      // Theme actions
      {
        id: 'theme-toggle',
        label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: `Currently using ${isDark ? 'dark' : 'light'} theme`,
        category: 'theme',
        icon: isDark ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 2v1M8 13v1M2 8h1M13 8h1M4 4l.7.7M11.3 11.3l.7.7M4 12l.7-.7M11.3 4.7l.7-.7" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 9a6 6 0 1 1-6.5-6.5 4.5 4.5 0 0 0 6.5 6.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'theme-light',
        label: 'Use Light Theme',
        category: 'theme',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 2v1M8 13v1M2 8h1M13 8h1" strokeLinecap="round" />
          </svg>
        ),
        action: () => {
          setTheme('light');
          onClose();
        },
      },
      {
        id: 'theme-dark',
        label: 'Use Dark Theme',
        category: 'theme',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 9a6 6 0 1 1-6.5-6.5 4.5 4.5 0 0 0 6.5 6.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        action: () => {
          setTheme('dark');
          onClose();
        },
      },
      {
        id: 'theme-system',
        label: 'Use System Theme',
        category: 'theme',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="9" rx="1" />
            <path d="M5 14h6M8 12v2" strokeLinecap="round" />
          </svg>
        ),
        action: () => {
          setTheme('system');
          onClose();
        },
      },
    ],
    [navigate, onClose, isDark, toggleTheme, setTheme]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector('[data-selected="true"]') as HTMLElement;
    if (selected && list) {
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      if (selectedRect.bottom > listRect.bottom) {
        selected.scrollIntoView({ block: 'nearest' });
      } else if (selectedRect.top < listRect.top) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  let currentIndex = 0;

  const categoryLabels: Record<string, string> = {
    quick: 'Quick Actions',
    navigation: 'Navigation',
    action: 'Actions',
    theme: 'Theme',
  };

  return (
    <div className="command-palette__backdrop" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="command-palette__input-wrapper">
          <svg
            className="command-palette__search-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="7" cy="7" r="4" />
            <path d="M10 10l3 3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette__input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="command-palette__esc">ESC</kbd>
        </div>

        <div className="command-palette__list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette__empty">No commands found</div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="command-palette__group">
                <div className="command-palette__group-label">
                  {categoryLabels[category] || category}
                </div>
                {items.map((cmd) => {
                  const itemIndex = currentIndex++;
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      className={clsx(
                        'command-palette__item',
                        isSelected && 'command-palette__item--selected'
                      )}
                      data-selected={isSelected}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      {cmd.icon && (
                        <span className="command-palette__item-icon">{cmd.icon}</span>
                      )}
                      <div className="command-palette__item-content">
                        <span className="command-palette__item-label">{cmd.label}</span>
                        {cmd.description && (
                          <span className="command-palette__item-description">
                            {cmd.description}
                          </span>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="command-palette__item-shortcut">{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette__footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
          </span>
          <span>
            <kbd>↵</kbd> to select
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

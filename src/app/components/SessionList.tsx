import React, { useState, useMemo, useRef } from 'react';
import { Edit2, Trash2, X, Folder, ChevronDown, ChevronRight, GripVertical, FileText, Search, Pencil, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSessionStore } from '../../store/useSessionStore';
import { sessionStorage } from '../../utils/sessionStorage';
import type { SessionData } from '../../utils/sessionStorage';
import { SessionModal } from './SessionModal';
import { GroupEditModal } from './GroupEditModal';
import { highlightCode } from '../../shared/utils/prismLoader';

interface SessionListProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (session: SessionData) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  isOpen,
  onClose,
  onLoadSession,
}) => {
  const sessionListRef = useRef<HTMLDivElement>(null);
  const sessions = useSessionStore((state) => state.sessions);
  
  const deleteSession = useSessionStore((state) => state.deleteSession);
  const loadSessions = useSessionStore((state) => state.loadSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverGroupRef = useRef<string | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [draggedGroupName, setDraggedGroupName] = useState<string | null>(null);
  const [dragOverGroupName, setDragOverGroupName] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingNotesMode, setEditingNotesMode] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Group sessions by groupName
  const groupedSessions = useMemo(() => {
    const groups: Record<string, SessionData[]> = {};
    const uncategorized: SessionData[] = [];

    sessions.forEach((session) => {
      if (session.groupName) {
        if (!groups[session.groupName]) {
          groups[session.groupName] = [];
        }
        groups[session.groupName].push(session);
      } else {
        uncategorized.push(session);
      }
    });

    // Sort sessions within each group by order (if exists), then by updatedAt (newest first)
    Object.keys(groups).forEach((groupName) => {
      groups[groupName].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only one has order, prioritize it
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Otherwise sort by updatedAt (newest first)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    uncategorized.sort((a, b) => {
      // If both have order, sort by order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // If only one has order, prioritize it
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // Otherwise sort by updatedAt (newest first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Get group order from storage
    const groupOrder = sessionStorage.getGroupOrder();
    const allGroupNames = Object.keys(groups);
    
    // Merge stored order with current groups (add new groups to end)
    const orderedGroups: string[] = [];
    const seenGroups = new Set<string>();
    
    // Add groups in stored order
    groupOrder.forEach(groupName => {
      if (allGroupNames.includes(groupName)) {
        orderedGroups.push(groupName);
        seenGroups.add(groupName);
      }
    });
    
    // Add new groups that weren't in stored order
    allGroupNames.forEach(groupName => {
      if (!seenGroups.has(groupName)) {
        orderedGroups.push(groupName);
      }
    });

    // Initialize order if it doesn't exist or is incomplete
    if (groupOrder.length === 0 && orderedGroups.length > 0) {
      sessionStorage.saveGroupOrder(orderedGroups);
    }

    return { groups, uncategorized, orderedGroups };
  }, [sessions]);

  // Filter sessions based on search query
  const filteredGroupedSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedSessions;
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredGroups: Record<string, SessionData[]> = {};
    const filteredUncategorized: SessionData[] = [];

    // Helper function to check if session matches search query
    const matchesQuery = (session: SessionData): boolean => {
      const nameMatch = session.name.toLowerCase().includes(query);
      const notesMatch = session.notes?.toLowerCase().includes(query) ?? false;
      const groupMatch = session.groupName?.toLowerCase().includes(query) ?? false;
      return nameMatch || notesMatch || groupMatch;
    };

    // Filter sessions in groups
    Object.keys(groupedSessions.groups).forEach((groupName) => {
      const filtered = groupedSessions.groups[groupName].filter(matchesQuery);
      if (filtered.length > 0) {
        filteredGroups[groupName] = filtered;
      }
    });

    // Filter uncategorized sessions
    const filteredUncat = groupedSessions.uncategorized.filter(matchesQuery);
    if (filteredUncat.length > 0) {
      filteredUncategorized.push(...filteredUncat);
    }

    // Maintain order from original groupedSessions
    const orderedFilteredGroups: string[] = [];
    groupedSessions.orderedGroups.forEach((groupName) => {
      if (filteredGroups[groupName]) {
        orderedFilteredGroups.push(groupName);
      }
    });

    return {
      groups: filteredGroups,
      uncategorized: filteredUncategorized,
      orderedGroups: orderedFilteredGroups,
    };
  }, [groupedSessions, searchQuery]);

  // Initialize all groups as expanded when sessions change
  useMemo(() => {
    const allGroupNames = Object.keys(groupedSessions.groups);
    if (allGroupNames.length > 0 || groupedSessions.uncategorized.length > 0) {
      setExpandedGroups((prev) => {
        const newSet = new Set(prev);
        allGroupNames.forEach((name) => {
          if (!newSet.has(name)) {
            newSet.add(name);
          }
        });
        // Also initialize uncategorized as expanded
        if (groupedSessions.uncategorized.length > 0 && !newSet.has('__uncategorized__')) {
          newSet.add('__uncategorized__');
        }
        return newSet;
      });
    }
  }, [groupedSessions.groups, groupedSessions.uncategorized.length]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const isGroupExpanded = (groupName: string) => expandedGroups.has(groupName);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleLoad = (session: SessionData) => {
    onLoadSession(session);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(id);
    }
  };

  const handleRename = (id: string) => {
    setEditingId(id);
    setShowRenameModal(true);
  };

  const handleEditGroup = (groupName: string) => {
    setEditingGroupName(groupName);
    setShowGroupEditModal(true);
  };

  const handleGroupRenamed = () => {
    loadSessions(); // Refresh sessions to reflect group rename
    setEditingGroupName(null);
    setShowGroupEditModal(false);
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
        // Clear editing state when collapsing
        setEditingNotes((notes) => {
          const updated = { ...notes };
          delete updated[sessionId];
          return updated;
        });
      } else {
        newSet.add(sessionId);
        // Initialize editing notes with current notes
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          setEditingNotes((notes) => ({
            ...notes,
            [sessionId]: session.notes || '',
          }));
        }
      }
      return newSet;
    });
  };

  const handleNotesChange = (sessionId: string, value: string) => {
    setEditingNotes((notes) => ({
      ...notes,
      [sessionId]: value,
    }));
  };

  const handleSaveNotes = (sessionId: string) => {
    const notes = editingNotes[sessionId] || '';
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const updatedSession: SessionData = {
        ...session,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      sessionStorage.save(updatedSession);
      loadSessions();
      // Clear editing state and exit edit mode
      setEditingNotes((notes) => {
        const updated = { ...notes };
        delete updated[sessionId];
        return updated;
      });
      setEditingNotesMode((modes) => {
        const updated = new Set(modes);
        updated.delete(sessionId);
        return updated;
      });
    }
  };

  const handleStartEditNotes = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // Initialize editingNotes with current notes if not already editing
      setEditingNotes((notes) => {
        if (notes[sessionId] === undefined) {
          return { ...notes, [sessionId]: session.notes || '' };
        }
        return notes;
      });
      setEditingNotesMode((modes) => {
        const updated = new Set(modes);
        updated.add(sessionId);
        return updated;
      });
    }
  };

  const handleCancelEditNotes = (sessionId: string) => {
    setEditingNotes((notes) => {
      const updated = { ...notes };
      delete updated[sessionId];
      return updated;
    });
    setEditingNotesMode((modes) => {
      const updated = new Set(modes);
      updated.delete(sessionId);
      return updated;
    });
  };

  const isEditingNotes = (sessionId: string) => editingNotesMode.has(sessionId);

  // Code block component with syntax highlighting and copy functionality
  const CodeBlock: React.FC<{ language?: string; children: string }> = ({ language, children }) => {
    const [copied, setCopied] = useState(false);
    const [highlightedCode, setHighlightedCode] = useState<string>('');

    React.useEffect(() => {
      const highlight = async () => {
        try {
          const lang = language || 'javascript';
          const highlighted = await highlightCode(children, lang);
          setHighlightedCode(highlighted);
        } catch {
          // Fallback to plain text if highlighting fails
          setHighlightedCode(children);
        }
      };
      highlight();
    }, [children, language]);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    };

    return (
      <div className="relative group my-2">
        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-t px-3 py-1.5">
          {language && (
            <span className="text-xs text-slate-400 font-mono">{language}</span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="bg-slate-800 border border-slate-700 border-t-0 rounded-b p-3 overflow-x-auto my-0">
          <code
            className="text-sm text-slate-200 font-mono whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightedCode || children }}
          />
        </pre>
      </div>
    );
  };

  // Markdown renderer component using react-markdown
  const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content.trim()) {
      return (
        <p className="text-sm text-slate-500 italic">No notes yet. Click Edit to add notes.</p>
      );
    }

    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            // Headers
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-slate-200 mt-4 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-slate-200 mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-slate-200 mt-4 mb-2">{children}</h3>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className="text-sm text-slate-300 leading-relaxed my-2">{children}</p>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 my-2 text-slate-200">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 my-2 text-slate-200">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm">{children}</li>
            ),
            // Inline elements
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-100">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-300">{children}</em>
            ),
            // Code blocks
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : undefined;
              const codeString = String(children).replace(/\n$/, '');

              if (language) {
                return <CodeBlock language={language}>{codeString}</CodeBlock>;
              }

              // Inline code
              return (
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-slate-200" {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              // Pre is handled by CodeBlock component
              return <>{children}</>;
            },
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-slate-600 pl-4 my-2 italic text-slate-400">
                {children}
              </blockquote>
            ),
            // Links
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const isSessionExpanded = (sessionId: string) => expandedSessions.has(sessionId);

  const handleGroupDragStart = (e: React.DragEvent, groupName: string) => {
    setDraggedGroupName(groupName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `group:${groupName}`);
    setDraggedSessionId(null);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleGroupDragEnd = (e: React.DragEvent) => {
    setDraggedGroupName(null);
    setDragOverGroupName(null);
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleGroupDragOver = (e: React.DragEvent, targetGroupName: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedGroupName && draggedGroupName !== targetGroupName) {
      setDragOverGroupName(targetGroupName);
    }
  };

  const handleGroupDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const leaving = !e.currentTarget.contains(relatedTarget);
    if (leaving) {
      setDragOverGroupName(null);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedGroupName || draggedGroupName === targetGroupName) {
      setDraggedGroupName(null);
      setDragOverGroupName(null);
      return;
    }

    const allGroups = groupedSessions.orderedGroups.length > 0
      ? groupedSessions.orderedGroups
      : Object.keys(groupedSessions.groups).sort();

    const sourceIndex = allGroups.indexOf(draggedGroupName);
    const targetIndex = allGroups.indexOf(targetGroupName);

    if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
      const reordered = [...allGroups];
      const [removed] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      sessionStorage.saveGroupOrder(reordered);
      loadSessions();
    }

    setDraggedGroupName(null);
    setDragOverGroupName(null);
  };

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent bubbling to group container so handleGroupDragStart doesn't clear draggedSessionId
    setDraggedGroupName(null);
    setDraggedSessionId(sessionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sessionId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedSessionId(null);
    setDragOverGroup(null);
    setDragOverIndex(null);
    dragOverGroupRef.current = null;
    dragOverIndexRef.current = null;
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, groupName: string | undefined, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Update drag over state (log only when target changes to avoid spam)
    const groupKey = groupName || '__uncategorized__';
    if (dragOverGroupRef.current !== groupKey || dragOverIndexRef.current !== index) {
      setDragOverGroup(groupKey);
      setDragOverIndex(index);
      dragOverGroupRef.current = groupKey;
      dragOverIndexRef.current = index;
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const leaving = !e.currentTarget.contains(relatedTarget);
    if (leaving) {
      setDragOverGroup(null);
      setDragOverIndex(null);
      dragOverGroupRef.current = null;
      dragOverIndexRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent, targetGroupName: string | undefined, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedSessionId) return;

    const draggedSession = sessions.find(s => s.id === draggedSessionId);
    if (!draggedSession) return;

    const targetGroupKey = targetGroupName || '__uncategorized__';
    const sourceGroupKey = draggedSession.groupName || '__uncategorized__';

    // Get all sessions in both groups (using current grouped data)
    const targetGroupSessions = targetGroupKey === '__uncategorized__'
      ? [...groupedSessions.uncategorized]
      : [...(groupedSessions.groups[targetGroupKey] || [])];

    const sourceGroupSessions = sourceGroupKey === '__uncategorized__'
      ? [...groupedSessions.uncategorized]
      : [...(groupedSessions.groups[sourceGroupKey] || [])];
    
    const sourceIndex = sourceGroupSessions.findIndex(s => s.id === draggedSessionId);

    if (sourceIndex === -1) return;

    // If moving within same group
    if (sourceGroupKey === targetGroupKey) {
      const reordered = [...targetGroupSessions];
      const [removed] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      
      // Update order for all sessions in the group
      reordered.forEach((session, idx) => {
        const updatedSession: SessionData = {
          ...session,
          order: idx,
          updatedAt: session.id === draggedSessionId ? new Date().toISOString() : session.updatedAt,
        };
        sessionStorage.save(updatedSession);
      });
    } else {
      // Moving between groups
      // Update source group: remove dragged session and reorder remaining
      const sourceUpdated = sourceGroupSessions
        .filter(s => s.id !== draggedSessionId)
        .map((session, idx) => ({
          ...session,
          order: idx,
        }));
      
      sourceUpdated.forEach(session => {
        sessionStorage.save(session);
      });
      
      // Update target group: insert dragged session at targetIndex
      const targetBeforeDrop = targetGroupSessions.slice(0, targetIndex);
      const targetAfterDrop = targetGroupSessions.slice(targetIndex);
      
      // Update order for sessions before drop position
      targetBeforeDrop.forEach((session, idx) => {
        const updatedSession: SessionData = {
          ...session,
          order: idx,
        };
        sessionStorage.save(updatedSession);
      });
      
      // Add dragged session with new group
      const draggedUpdated: SessionData = {
        ...draggedSession,
        groupName: targetGroupName,
        order: targetIndex,
        updatedAt: new Date().toISOString(),
      };
      sessionStorage.save(draggedUpdated);
      
      // Update order for sessions after drop position
      targetAfterDrop.forEach((session, idx) => {
        const updatedSession: SessionData = {
          ...session,
          order: targetIndex + 1 + idx,
        };
        sessionStorage.save(updatedSession);
      });
    }

    // Refresh sessions
    loadSessions();

    // Reset drag state
    setDraggedSessionId(null);
    setDragOverGroup(null);
    setDragOverIndex(null);
    dragOverGroupRef.current = null;
    dragOverIndexRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div 
          ref={sessionListRef}
          className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">Your Sessions</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions, notes, or groups..."
                className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">You have no saved sessions.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors text-sm flex items-center gap-2 mx-auto"
                >
                  <span>Create your first session</span>
                </button>
              </div>
            ) : (
              <>
                {searchQuery.trim() && 
                 filteredGroupedSessions.orderedGroups.length === 0 && 
                 Object.keys(filteredGroupedSessions.groups).length === 0 && 
                 filteredGroupedSessions.uncategorized.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 mb-2">No sessions found matching "{searchQuery}"</p>
                    <p className="text-xs text-slate-500">Try searching by session name, notes, or group name</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Render grouped sessions */}
                    {(filteredGroupedSessions.orderedGroups.length > 0 
                      ? filteredGroupedSessions.orderedGroups 
                      : Object.keys(filteredGroupedSessions.groups).sort()
                    ).map((groupName) => {
                      const groupSessions = filteredGroupedSessions.groups[groupName] || [];
                  if (groupSessions.length === 0) return null;
                    const isExpanded = isGroupExpanded(groupName);
                    const isDraggingGroup = draggedGroupName === groupName;
                    const isDragOverGroup = dragOverGroupName === groupName;
                    return (
                      <div 
                        key={groupName} 
                        className="space-y-2"
                        draggable
                        onDragStart={(e) => handleGroupDragStart(e, groupName)}
                        onDragEnd={handleGroupDragEnd}
                        onDragOver={(e) => handleGroupDragOver(e, groupName)}
                        onDragLeave={handleGroupDragLeave}
                        onDrop={(e) => handleGroupDrop(e, groupName)}
                      >
                        <div className={`flex items-center gap-2 mb-2 group cursor-move rounded px-2 py-1 transition-all ${
                          isDraggingGroup
                            ? 'opacity-50 bg-slate-700'
                            : isDragOverGroup
                            ? 'bg-slate-700 border-2 border-blue-400'
                            : 'hover:bg-slate-800/50'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(groupName);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                            title={isExpanded ? 'Collapse group' : 'Expand group'}
                            aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(groupName);
                            }}
                            className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
                          >
                            <h3 className="text-sm font-semibold text-slate-300">
                              {groupName}
                            </h3>
                            <span className="text-xs text-slate-500">
                              ({groupSessions.length})
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGroup(groupName);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Rename group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isExpanded && groupSessions.map((session, index) => {
                          const groupKey = groupName || '__uncategorized__';
                          const isDragging = draggedSessionId === session.id;
                          const isDragOver = dragOverGroup === groupKey && dragOverIndex === index;
                          const isExpandedSession = isSessionExpanded(session.id);
                          const currentNotes = editingNotes[session.id] !== undefined 
                            ? editingNotes[session.id] 
                            : (session.notes || '');
                          const hasNotes = session.notes && session.notes.trim().length > 0;
                          return (
                            <div
                              key={session.id}
                              className="ml-6 space-y-0"
                            >
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, session.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, groupName, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, groupName, index)}
                                className={`flex items-center justify-between p-4 bg-slate-900 border rounded-lg transition-all group cursor-move ${
                                  isDragging
                                    ? 'opacity-50 border-blue-500'
                                    : isDragOver
                                    ? 'border-blue-400 border-2 bg-slate-800'
                                    : 'border-slate-700 hover:bg-slate-800'
                                } ${isExpandedSession ? 'rounded-b-none border-b-0' : ''}`}
                              >
                                <GripVertical className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-medium text-slate-200 truncate">
                                      {session.name}
                                    </h4>
                                    {hasNotes && (
                                      <span className="inline-flex items-center" title="Has notes">
                                        <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    Last modified {formatTimeAgo(session.updatedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSessionExpanded(session.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                                    title={isExpandedSession ? 'Collapse notes' : 'Expand notes'}
                                  >
                                    {isExpandedSession ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLoad(session);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-200 rounded text-xs transition-colors"
                                    title="Load session"
                                  >
                                    Load
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRename(session.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                                    title="Rename session"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(session.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                    title="Delete session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {isExpandedSession && (
                                <div 
                                  className="bg-slate-900 border border-slate-700 border-t-0 rounded-b-lg p-4"
                                >
                                  {isEditingNotes(session.id) ? (
                                    <>
                                      <div className="mb-2">
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                          Notes
                                        </label>
                                        <textarea
                                          value={currentNotes}
                                          onChange={(e) => handleNotesChange(session.id, e.target.value)}
                                          placeholder="Add notes, descriptions, or documentation for this session..."
                                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 resize-y min-h-[100px] max-h-[300px] font-mono"
                                          rows={6}
                                        />
                                        <p className="text-xs text-slate-500 mt-1.5">
                                          Supports plain text. Use markdown-style formatting for better readability.
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelEditNotes(session.id);
                                          }}
                                          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveNotes(session.id);
                                          }}
                                          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-slate-200 rounded border border-green-700 transition-colors"
                                        >
                                          Save Notes
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between mb-3">
                                        <label className="block text-xs font-medium text-slate-300">
                                          Notes
                                        </label>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEditNotes(session.id);
                                          }}
                                          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors flex items-center gap-1.5"
                                        >
                                          <Pencil className="w-3 h-3" />
                                          Edit
                                        </button>
                                      </div>
                                      <div className="prose prose-invert max-w-none">
                                        <MarkdownRenderer content={session.notes || ''} />
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    );
                  })}

                    {/* Render uncategorized sessions */}
                    {filteredGroupedSessions.uncategorized.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2 group">
                      <button
                        onClick={() => toggleGroup('__uncategorized__')}
                        className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                        title={isGroupExpanded('__uncategorized__') ? 'Collapse group' : 'Expand group'}
                        aria-label={isGroupExpanded('__uncategorized__') ? 'Collapse group' : 'Expand group'}
                      >
                        {isGroupExpanded('__uncategorized__') ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <Folder className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <button
                        onClick={() => toggleGroup('__uncategorized__')}
                        className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
                      >
                        <h3 className="text-sm font-semibold text-slate-400">
                          Uncategorized
                        </h3>
                        <span className="text-xs text-slate-500">
                          ({filteredGroupedSessions.uncategorized.length})
                        </span>
                      </button>
                        </div>
                        {isGroupExpanded('__uncategorized__') && filteredGroupedSessions.uncategorized.map((session, index) => {
                      const isDragging = draggedSessionId === session.id;
                      const isDragOver = dragOverGroup === '__uncategorized__' && dragOverIndex === index;
                      const isExpandedSession = isSessionExpanded(session.id);
                      const currentNotes = editingNotes[session.id] !== undefined 
                        ? editingNotes[session.id] 
                        : (session.notes || '');
                      const hasNotes = session.notes && session.notes.trim().length > 0;
                      return (
                        <div
                          key={session.id}
                          className="ml-6 space-y-0"
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, session.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, undefined as string | undefined, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, undefined, index)}
                            className={`flex items-center justify-between p-4 bg-slate-900 border rounded-lg transition-all group cursor-move ${
                              isDragging
                                ? 'opacity-50 border-blue-500'
                                : isDragOver
                                ? 'border-blue-400 border-2 bg-slate-800'
                                : 'border-slate-700 hover:bg-slate-800'
                            } ${isExpandedSession ? 'rounded-b-none border-b-0' : ''}`}
                          >
                            <GripVertical className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-slate-200 truncate">
                                  {session.name}
                                </h4>
                                {hasNotes && (
                                  <span className="inline-flex items-center" title="Has notes">
                                    <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">
                                Last modified {formatTimeAgo(session.updatedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSessionExpanded(session.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                                title={isExpandedSession ? 'Collapse notes' : 'Expand notes'}
                              >
                                {isExpandedSession ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoad(session);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-200 rounded text-xs transition-colors"
                                title="Load session"
                              >
                                Load
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename(session.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                                title="Rename session"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(session.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                title="Delete session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {isExpandedSession && (
                            <div 
                              className="bg-slate-900 border border-slate-700 border-t-0 rounded-b-lg p-4"
                            >
                              <div className="mb-2">
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                  Notes
                                </label>
                                <textarea
                                  value={currentNotes}
                                  onChange={(e) => handleNotesChange(session.id, e.target.value)}
                                  placeholder="Add notes, descriptions, or documentation for this session..."
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 resize-y min-h-[100px] max-h-[300px] font-mono"
                                  rows={6}
                                />
                                <p className="text-xs text-slate-500 mt-1.5">
                                  Supports plain text. Use markdown-style formatting for better readability.
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSessionExpanded(session.id);
                                  }}
                                  className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveNotes(session.id);
                                  }}
                                  className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-slate-200 rounded border border-green-700 transition-colors"
                                >
                                  Save Notes
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SessionModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setEditingId(null);
        }}
        mode="rename"
        sessionId={editingId || undefined}
        onSuccess={() => {
          setShowRenameModal(false);
          setEditingId(null);
        }}
      />

      {editingGroupName && (
        <GroupEditModal
          isOpen={showGroupEditModal}
          onClose={() => {
            setShowGroupEditModal(false);
            setEditingGroupName(null);
          }}
          groupName={editingGroupName}
          onSuccess={handleGroupRenamed}
        />
      )}
    </>
  );
};

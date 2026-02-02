import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { sessionStorage } from '../../utils/sessionStorage';
import { GroupModal } from './GroupModal';
interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'rename';
  sessionId?: string;
  onSuccess?: (sessionId: string, sessionName: string) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  mode,
  sessionId,
  onSuccess,
}) => {
  const sessionModalRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [error, setError] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const createSession = useSessionStore((state) => state.createSession);
  const renameSession = useSessionStore((state) => state.renameSession);
  const loadSessions = useSessionStore((state) => state.loadSessions);

  // Refresh groups list
  const refreshGroups = () => {
    setGroups(sessionStorage.getAllGroups());
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'rename' && sessionId) {
        const session = sessionStorage.get(sessionId);
        setName(session?.name || '');
        setSelectedGroup(session?.groupName || '');
      } else {
        setName('');
        setSelectedGroup('');
      }
      setError('');
      loadSessions(); // Refresh sessions list
      refreshGroups(); // Refresh groups list
    }
  }, [isOpen, mode, sessionId, loadSessions]);

  // Refresh groups when GroupModal closes
  useEffect(() => {
    if (!showGroupModal && isOpen) {
      refreshGroups();
    }
  }, [showGroupModal, isOpen]);

  const handleGroupCreated = (groupName: string) => {
    setShowGroupModal(false);
    // Refresh groups immediately after group is created
    refreshGroups();
    // Set selected group after a brief delay to ensure groups list is updated
    setTimeout(() => {
      setSelectedGroup(groupName);
    }, 10);
    loadSessions(); // Refresh sessions list
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Session name cannot be empty');
      return;
    }

    if (sessionStorage.nameExists(trimmedName, mode === 'rename' ? sessionId : undefined)) {
      setError('A session with this name already exists');
      return;
    }

    const groupName = selectedGroup || undefined;

    if (mode === 'create') {
      const newSessionId = createSession(trimmedName, groupName);
      onSuccess?.(newSessionId, trimmedName);
    } else if (sessionId) {
      const success = renameSession(sessionId, trimmedName, groupName);
      if (success) {
        onSuccess?.(sessionId, trimmedName);
      } else {
        setError('Failed to rename session');
        return;
      }
    }

    onClose();
    setName('');
    setSelectedGroup('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={sessionModalRef} className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">
            {mode === 'create' ? 'Create New Session' : 'Rename Session'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="session-group" className="block text-sm font-medium text-slate-300 mb-2">
              Group (Optional)
            </label>
            <div className="flex gap-2">
              <select
                id="session-group"
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setError('');
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              >
                <option value="">No Group</option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowGroupModal(true)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors text-sm flex items-center gap-1.5"
                title="Create new group"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="session-name" className="block text-sm font-medium text-slate-300 mb-2">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter session name..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-200 rounded border border-blue-700 transition-colors text-sm"
            >
              {mode === 'create' ? 'Create' : 'Rename'}
            </button>
          </div>
        </form>
      </div>

      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};

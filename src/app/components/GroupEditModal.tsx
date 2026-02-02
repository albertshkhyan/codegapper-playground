import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { sessionStorage } from '../../utils/sessionStorage';

interface GroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onSuccess: (newGroupName: string) => void;
}

export const GroupEditModal: React.FC<GroupEditModalProps> = ({
  isOpen,
  onClose,
  groupName,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(groupName);
      setError('');
    }
  }, [isOpen, groupName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Group name cannot be empty');
      return;
    }

    if (trimmedName === groupName) {
      // No change, just close
      onClose();
      return;
    }

    // Check if group already exists
    const existingGroups = sessionStorage.getAllGroups();
    if (existingGroups.includes(trimmedName)) {
      setError('A group with this name already exists');
      return;
    }

    // Rename the group (updates storage and all sessions)
    sessionStorage.renameGroup(groupName, trimmedName);

    onSuccess(trimmedName);
    onClose();
    setName('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Rename Group</h2>
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
            <label htmlFor="group-name" className="block text-sm font-medium text-slate-300 mb-2">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter group name"
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

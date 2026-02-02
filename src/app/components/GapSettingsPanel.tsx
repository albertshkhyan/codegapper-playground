import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import type { GapSettings } from '../../shared/lib/gapEngine/settings';
import { defaultGapSettings, applyDifficultyPreset } from '../../shared/lib/gapEngine/settings';
interface GapSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const GapSettingsPanel: React.FC<GapSettingsPanelProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const gapSettingsRef = useRef<HTMLDivElement>(null);
  const gapSettings = useGapStore((state) => state.gapSettings);
  const setGapSettings = useGapStore((state) => state.setGapSettings);
  const resetGapSettings = useGapStore((state) => state.resetGapSettings);

  // Local form state (initialized from store)
  const [localSettings, setLocalSettings] = useState<GapSettings>(gapSettings);
  const [customExclusionInput, setCustomExclusionInput] = useState('');
  const customExclusionInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when modal opens or store changes
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(gapSettings);
    }
  }, [isOpen, gapSettings]);

  // Handle difficulty change (applies preset)
  const handleDifficultyChange = (difficulty: GapSettings['difficulty']) => {
    const updated = { ...localSettings, difficulty };
    const withPreset = applyDifficultyPreset(difficulty, updated);
    setLocalSettings(withPreset);
  };

  // Handle gap count mode change
  const handleCountModeChange = (mode: GapSettings['countMode']) => {
    setLocalSettings({
      ...localSettings,
      countMode: mode,
      difficulty: mode === 'auto' && localSettings.difficulty !== 'custom' ? 'medium' : localSettings.difficulty,
    });
  };

  // Handle fixed count change
  const handleFixedCountChange = (value: number) => {
    setLocalSettings({
      ...localSettings,
      fixedCount: value > 0 ? value : undefined,
      difficulty: 'custom',
    });
  };

  // Handle range count change
  const handleRangeCountChange = (min: number, max: number) => {
    setLocalSettings({
      ...localSettings,
      minCount: min > 0 ? min : undefined,
      maxCount: max > 0 ? max : undefined,
      difficulty: 'custom',
    });
  };

  // Handle node type change
  const handleNodeTypeChange = (key: keyof GapSettings['nodeTypes'], value: boolean) => {
    if (key === 'literals') {
      // Literals is an object, handle separately
      return;
    }
    setLocalSettings({
      ...localSettings,
      nodeTypes: {
        ...localSettings.nodeTypes,
        [key]: value,
      },
      difficulty: 'custom',
    });
  };

  // Handle literal type change
  const handleLiteralTypeChange = (key: keyof GapSettings['nodeTypes']['literals'], value: boolean) => {
    setLocalSettings({
      ...localSettings,
      nodeTypes: {
        ...localSettings.nodeTypes,
        literals: {
          ...localSettings.nodeTypes.literals,
          [key]: value,
        },
      },
      difficulty: 'custom',
    });
  };

  // Handle exclusion change
  const handleExclusionChange = (key: keyof GapSettings['exclusions'], value: boolean | string[]) => {
    setLocalSettings({
      ...localSettings,
      exclusions: {
        ...localSettings.exclusions,
        [key]: value,
      },
      difficulty: 'custom',
    });
  };

  // Handle adding a chip to custom exclusion list
  const handleAddCustomExclusion = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    
    // Prevent duplicates (case-insensitive)
    const lowerTrimmed = trimmed.toLowerCase();
    const isDuplicate = localSettings.exclusions.customList.some(
      (item) => item.toLowerCase() === lowerTrimmed
    );
    
    if (isDuplicate) return;
    
    setLocalSettings((prev) => ({
      ...prev,
      exclusions: {
        ...prev.exclusions,
        customList: [...prev.exclusions.customList, trimmed],
      },
      difficulty: 'custom',
    }));
    
    setCustomExclusionInput('');
  };

  // Handle removing a chip from custom exclusion list
  const handleRemoveCustomExclusion = (indexToRemove: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      exclusions: {
        ...prev.exclusions,
        customList: prev.exclusions.customList.filter((_, index) => index !== indexToRemove),
      },
      difficulty: 'custom',
    }));
  };

  // Handle custom exclusion input keydown
  const handleCustomExclusionInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCustomExclusion(customExclusionInput);
    }
  };

  // Handle apply
  const handleApply = () => {
    setGapSettings(localSettings);
    onApply();
  };

  // Handle reset
  const handleReset = () => {
    setLocalSettings(defaultGapSettings);
    resetGapSettings();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={gapSettingsRef} className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Gap Generation Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Gap Count */}
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-3">Gap Count</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="gapCount"
                      value="auto"
                      checked={localSettings.countMode === 'auto'}
                      onChange={() => handleCountModeChange('auto')}
                      className="text-slate-400"
                    />
                    Auto (50-80%)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="gapCount"
                      value="fixed"
                      checked={localSettings.countMode === 'fixed'}
                      onChange={() => handleCountModeChange('fixed')}
                      className="text-slate-400"
                    />
                    Fixed:
                    <input
                      type="number"
                      min="1"
                      value={localSettings.fixedCount || ''}
                      onChange={(e) => handleFixedCountChange(parseInt(e.target.value, 10) || 0)}
                      disabled={localSettings.countMode !== 'fixed'}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="gapCount"
                      value="range"
                      checked={localSettings.countMode === 'range'}
                      onChange={() => handleCountModeChange('range')}
                      className="text-slate-400"
                    />
                    Custom:
                    <input
                      type="number"
                      min="1"
                      value={localSettings.minCount || ''}
                      onChange={(e) => handleRangeCountChange(parseInt(e.target.value, 10) || 0, localSettings.maxCount || 8)}
                      disabled={localSettings.countMode !== 'range'}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    to
                    <input
                      type="number"
                      min="1"
                      value={localSettings.maxCount || ''}
                      onChange={(e) => handleRangeCountChange(localSettings.minCount || 5, parseInt(e.target.value, 10) || 0)}
                      disabled={localSettings.countMode !== 'range'}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
              </div>

              {/* Node Types */}
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-3">Node Types</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.nodeTypes.properties}
                      onChange={(e) => handleNodeTypeChange('properties', e.target.checked)}
                      className="text-slate-400"
                    />
                    Properties (user.isAdmin)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.nodeTypes.functions}
                      onChange={(e) => handleNodeTypeChange('functions', e.target.checked)}
                      className="text-slate-400"
                    />
                    Functions (grantAccess())
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.nodeTypes.operators}
                      onChange={(e) => handleNodeTypeChange('operators', e.target.checked)}
                      className="text-slate-400"
                    />
                    Operators (&&, ||, ==, etc.)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={Object.values(localSettings.nodeTypes.literals).some(v => v)}
                      onChange={(e) => {
                        const value = e.target.checked;
                        handleLiteralTypeChange('strings', value);
                        handleLiteralTypeChange('numbers', value);
                        handleLiteralTypeChange('booleans', value);
                        handleLiteralTypeChange('nullUndefined', value);
                      }}
                      className="text-slate-400"
                    />
                    Literals (strings, numbers, booleans)
                  </label>
                  <div className="ml-6 space-y-1 text-xs text-slate-400">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localSettings.nodeTypes.literals.strings}
                        onChange={(e) => handleLiteralTypeChange('strings', e.target.checked)}
                        className="text-slate-400"
                      />
                      Strings
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localSettings.nodeTypes.literals.numbers}
                        onChange={(e) => handleLiteralTypeChange('numbers', e.target.checked)}
                        className="text-slate-400"
                      />
                      Numbers
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localSettings.nodeTypes.literals.booleans}
                        onChange={(e) => handleLiteralTypeChange('booleans', e.target.checked)}
                        className="text-slate-400"
                      />
                      Booleans
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.nodeTypes.variables}
                      onChange={(e) => handleNodeTypeChange('variables', e.target.checked)}
                      className="text-slate-400"
                    />
                    Variables (let x, const y, function params)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.nodeTypes.keywords}
                      onChange={(e) => handleNodeTypeChange('keywords', e.target.checked)}
                      className="text-slate-400"
                    />
                    Keywords (if, return, async)
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Difficulty */}
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-3">Difficulty</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="difficulty"
                      value="easy"
                      checked={localSettings.difficulty === 'easy'}
                      onChange={() => handleDifficultyChange('easy')}
                      className="text-slate-400"
                    />
                    Easy
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="difficulty"
                      value="medium"
                      checked={localSettings.difficulty === 'medium'}
                      onChange={() => handleDifficultyChange('medium')}
                      className="text-slate-400"
                    />
                    Medium
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="difficulty"
                      value="hard"
                      checked={localSettings.difficulty === 'hard'}
                      onChange={() => handleDifficultyChange('hard')}
                      className="text-slate-400"
                    />
                    Hard
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="difficulty"
                      value="custom"
                      checked={localSettings.difficulty === 'custom'}
                      onChange={() => handleDifficultyChange('custom')}
                      className="text-slate-400"
                    />
                    Manual
                  </label>
                </div>
              </div>

              {/* Exclusions */}
              <div>
                <h3 className="text-sm font-medium text-slate-200 mb-3">Exclusions</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.exclusions.commonNames}
                      onChange={(e) => handleExclusionChange('commonNames', e.target.checked)}
                      className="text-slate-400"
                    />
                    Common names (length, value, index)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.exclusions.builtIns}
                      onChange={(e) => handleExclusionChange('builtIns', e.target.checked)}
                      className="text-slate-400"
                    />
                    Built-ins (Promise, Array, Object)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={localSettings.exclusions.singleLetterVars}
                      onChange={(e) => handleExclusionChange('singleLetterVars', e.target.checked)}
                      className="text-slate-400"
                    />
                    Single-letter vars (i, j, x, y)
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={localSettings.exclusions.customList.length > 0}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            handleExclusionChange('customList', []);
                          }
                        }}
                        className="text-slate-400"
                      />
                      Custom list:
                    </label>
                    <div 
                      className="flex flex-wrap items-center gap-2 px-2 py-1.5 min-h-[32px] bg-slate-900 border border-slate-600 rounded text-slate-200 text-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                    >
                      {/* Chips */}
                      {localSettings.exclusions.customList.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-100 text-xs transition-colors"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomExclusion(index)}
                            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
                            aria-label={`Remove ${item}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Input */}
                      <input
                        ref={customExclusionInputRef}
                        type="text"
                        placeholder={localSettings.exclusions.customList.length === 0 ? "Type and press Enter" : ""}
                        value={customExclusionInput}
                        onChange={(e) => {
                          // Handle comma on input change
                          const value = e.target.value;
                          if (value.includes(',')) {
                            const parts = value.split(',');
                            parts.forEach((part, idx) => {
                              if (idx < parts.length - 1) {
                                handleAddCustomExclusion(part);
                              } else {
                                setCustomExclusionInput(part);
                              }
                            });
                          } else {
                            setCustomExclusionInput(value);
                          }
                        }}
                        onKeyDown={handleCustomExclusionInputKeyDown}
                        className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-slate-200 text-xs placeholder-slate-500"
                        style={{ width: `${Math.max(120, customExclusionInput.length * 8 + 20)}px` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-slate-300 hover:text-slate-200 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Apply & Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: string[] | SelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
}

/** Normalise string[] or SelectOption[] to SelectOption[] */
function toOptions(raw: string[] | SelectOption[]): SelectOption[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === 'string') return (raw as string[]).map(s => ({ value: s, label: s }));
  return raw as SelectOption[];
}

export function SearchableSelect({ options, value, onChange, placeholder, label }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [otherValue, setOtherValue] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalised = toOptions(options);
  const baseOptions = normalised.filter(o => o.value !== 'Other');
  const allOptions = normalised.some(o => o.value === 'Other') ? [...baseOptions, { value: 'Other', label: 'Other' }] : baseOptions;
  const filtered = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const isOther = value && !normalised.some(o => o.value === value) && value !== 'Other';
  const displayValue = isOther ? `Other: ${value}` : (normalised.find(o => o.value === value)?.label ?? value);

  useEffect(() => { if (isOther) setOtherValue(value); }, []);

  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
  }, []);

  useEffect(() => {
    if (open) reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative mt-1" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Portal dropdown */}
      {open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-xl border dark:border-gray-700 max-h-72 overflow-hidden flex flex-col">
            <div className="p-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
              <input
                type="text"
                placeholder={`Search ${label ?? ''}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{filtered.length} of {allOptions.length}</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map(option => {
                const selected = value === option.value || (option.value === 'Other' && isOther);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (option.value !== 'Other') setOtherValue('');
                      onChange(option.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${selected ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
                  >
                    <span>{option.label}</span>
                    {selected && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No results found.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* "Other" free-text input */}
      {(value === 'Other' || isOther) && (
        <input
          type="text"
          placeholder="Please specify..."
          value={otherValue}
          onChange={e => {
            setOtherValue(e.target.value);
            if (e.target.value.trim()) onChange(e.target.value.trim());
          }}
          className="mt-2 w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      )}
    </div>
  );
}

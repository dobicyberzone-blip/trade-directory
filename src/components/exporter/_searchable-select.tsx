'use client';
import { useState, useEffect, useRef } from 'react';

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [otherValue, setOtherValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Guard against undefined/non-array options
  const safeOptions: string[] = Array.isArray(options) ? options : [];

  // Determine if current value is a custom "Other" entry
  const isOther = value && !safeOptions.includes(value) && value !== 'Other';

  useEffect(() => {
    if (isOther) setOtherValue(value);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure "Other" is always last
  const baseOptions = (safeOptions).filter(o => o !== 'Other');
  const allOptions = safeOptions.some(o => o === 'Other') ? [...baseOptions, 'Other'] : baseOptions;
  const filtered = allOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const displayValue = isOther ? `Other: ${value}` : value;

  return (
    <div className="relative mt-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-10 px-3 border border-input rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-xl border dark:border-gray-700 z-[100] max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{filtered.length} of {allOptions.length}</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (option === 'Other') {
                    onChange('Other');
                  } else {
                    onChange(option);
                    setOtherValue('');
                  }
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${(value === option || (option === 'Other' && isOther)) ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
              >
                <span>{option}</span>
                {(value === option || (option === 'Other' && isOther)) && <span className="text-green-600 dark:text-green-400">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No results found.</div>
            )}
          </div>
        </div>
      )}
      {(value === 'Other' || isOther) && (
        <input
          type="text"
          placeholder="Please specify..."
          value={otherValue}
          onChange={(e) => {
            setOtherValue(e.target.value);
            if (e.target.value.trim()) onChange(e.target.value.trim());
          }}
          className="mt-2 w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      )}
    </div>
  );
}

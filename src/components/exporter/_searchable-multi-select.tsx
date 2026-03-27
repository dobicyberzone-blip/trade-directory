'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  region?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
}: {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inWrapper && !inDropdown) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.region || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    const region = opt.region || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(opt);
    return acc;
  }, {});

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const remove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== value));
  };

  return (
    <div className="relative mt-1" ref={wrapperRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full min-h-10 px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-left"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          ) : selected.length <= 4 ? (
            selected.map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <span key={v} className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 rounded px-2 py-0.5 text-xs font-medium">
                  {opt?.label || v}
                  <span
                    role="button" tabIndex={0}
                    onClick={(e) => remove(v, e)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') remove(v, e as unknown as React.MouseEvent); }}
                    className="hover:text-red-500 cursor-pointer"
                    aria-label={`Remove ${opt?.label || v}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              );
            })
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">{selected.length} selected</span>
          )}
        </div>
        <svg className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={dropdownRef} style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-xl border dark:border-gray-700 max-h-72 overflow-hidden flex flex-col">
            <div className="p-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <div className="flex items-center justify-between mt-1 px-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} of {options.length}</p>
                {selected.length > 0 && (
                  <button type="button" onClick={() => onChange([])} className="text-xs text-red-500 hover:text-red-700">
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {Object.keys(grouped).length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No results found.</div>
              ) : (
                Object.entries(grouped).map(([region, opts]) => (
                  <div key={region}>
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                      {region}
                    </div>
                    {opts.map(opt => {
                      const isSelected = selected.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggle(opt.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${isSelected ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <span className="text-green-600 dark:text-green-400 text-base">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

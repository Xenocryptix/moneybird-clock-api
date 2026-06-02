'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  id: string;
  label: string;
}

interface Props {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  inputId?: string;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  inputId,
}: Props) {
  const selectedLabel = useMemo(
    () => options.find((o) => o.id === value)?.label ?? '',
    [options, value]
  );

  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reflect external value changes (e.g. the form reset after clock-in) in the text field.
  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // When the field just shows the current selection, list everything rather than
    // filtering down to the single selected row.
    if (!q || q === selectedLabel.toLowerCase()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, selectedLabel]);

  // Close on outside click and restore the selected label.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [selectedLabel]);

  const select = (id: string, optionLabel: string) => {
    onChange(id);
    setQuery(id ? optionLabel : '');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        const opt = filtered[highlight];
        if (opt) select(opt.id, opt.label);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selectedLabel);
    }
  };

  const listboxId = inputId ? `${inputId}-listbox` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="block w-full rounded-md border-gray-300 shadow-sm p-2 pr-8 border text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => {
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button
            type="button"
            onClick={() => select('', '')}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No matches</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={o.id === value}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(o.id, o.label);
                }}
                className={`cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 ${
                  i === highlight ? 'bg-blue-50' : ''
                } ${o.id === value ? 'font-medium' : ''}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

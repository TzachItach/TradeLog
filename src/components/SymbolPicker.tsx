import { useState, useRef, useEffect } from 'react';
import { FUTURES, CATEGORIES, CATEGORY_LABELS, type FuturesContract } from '../lib/futures';

interface Props {
  value: string;
  onChange: (symbol: string, contract?: FuturesContract) => void;
  lang: string;
}

export default function SymbolPicker({ value, onChange, lang }: Props) {
  const isHe = lang === 'he';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = FUTURES.filter(f => {
    const matchSearch = !search
      || f.symbol.toLowerCase().includes(search.toLowerCase())
      || f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  const selected = FUTURES.find(f => f.symbol === value.toUpperCase());

  const handleSelect = (f: FuturesContract) => {
    onChange(f.symbol, f);
    setOpen(false);
    setSearch('');
  };

  const formatPV = (pv: number) => {
    if (pv >= 1000) return `$${(pv / 1000).toFixed(pv % 1000 === 0 ? 0 : 1)}K`;
    return `$${pv}`;
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* כפתור בחירה */}
      <div
        className="form-input"
        onClick={() => setOpen(!open)}
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected ? (
            <>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selected.symbol}</span>
              <span style={{ color: 'var(--t3)', fontSize: '.78rem' }}>{selected.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--t3)' }}>
              {isHe ? 'בחר חוזה עתידי...' : 'Select futures contract...'}
            </span>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', opacity: .5, flexShrink: 0 }}>
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', insetInlineStart: 0,
          width: '100%', minWidth: 320,
          background: 'var(--s1)', border: '1px solid var(--bd2)',
          borderRadius: 10, zIndex: 400,
          boxShadow: '0 8px 24px rgba(0,0,0,.3)',
          overflow: 'hidden',
        }}>
          {/* חיפוש */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bd)' }}>
            <input
              ref={inputRef}
              type="text"
              className="form-input"
              style={{ background: 'var(--s2)' }}
              placeholder={isHe ? 'חפש סמל או שם...' : 'Search symbol or name...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* קטגוריות */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', overflowX: 'auto', borderBottom: '1px solid var(--bd)' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '3px 10px', borderRadius: 12, fontSize: '.72rem',
                border: '1px solid ' + (activeCategory === 'all' ? 'var(--b-bd)' : 'var(--bd2)'),
                background: activeCategory === 'all' ? 'var(--b-bg)' : 'transparent',
                color: activeCategory === 'all' ? 'var(--b)' : 'var(--t2)',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {isHe ? 'הכל' : 'All'}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: '.72rem',
                  border: '1px solid ' + (activeCategory === cat ? 'var(--b-bd)' : 'var(--bd2)'),
                  background: activeCategory === cat ? 'var(--b-bg)' : 'transparent',
                  color: activeCategory === cat ? 'var(--b)' : 'var(--t2)',
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}
              >
                {isHe ? CATEGORY_LABELS[cat].he : CATEGORY_LABELS[cat].en}
              </button>
            ))}
          </div>

          {/* רשימה */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: '.82rem' }}>
                {isHe ? 'לא נמצאו תוצאות' : 'No results'}
              </div>
            ) : (
              filtered.map(f => (
                <div
                  key={f.symbol}
                  onClick={() => handleSelect(f)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', cursor: 'pointer', transition: 'background .1s',
                    background: f.symbol === value ? 'var(--b-bg)' : 'transparent',
                    borderBottom: '1px solid var(--bd)',
                  }}
                  onMouseEnter={e => { if (f.symbol !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--s2)'; }}
                  onMouseLeave={e => { if (f.symbol !== value) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.9rem', minWidth: 44, color: f.symbol === value ? 'var(--b)' : 'var(--t1)' }}>
                      {f.symbol}
                    </span>
                    <div>
                      <div style={{ fontSize: '.82rem', color: 'var(--t2)' }}>{f.name}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--t3)' }}>{f.exchange}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'end', flexShrink: 0 }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--t3)' }}>
                      {isHe ? 'ערך נקודה' : 'Point value'}
                    </div>
                    <div style={{ fontSize: '.82rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--b)' }}>
                      {formatPV(f.pointValue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

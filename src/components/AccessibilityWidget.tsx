import { useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';

export default function AccessibilityWidget() {
  const {
    lang, fontSize, highContrast, grayscale, readableFont, darkMode,
    setFontSize, setHighContrast, setGrayscale, setReadableFont, setDarkMode,
  } = useStore();
  const T = useT(lang);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 6 }}>
      {open && (
        <div className="access-panel">
          <div className="access-title">{T.accessibility}</div>

          {/* בהיר / כהה */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '.78rem', color: 'var(--t2)' }}>
              {lang === 'he' ? 'מצב תצוגה' : 'Theme'}
            </span>
            <div
              onClick={() => setDarkMode(!darkMode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: 'var(--s1)', border: '1px solid var(--bd2)',
                borderRadius: 20, padding: 3, cursor: 'pointer',
              }}
            >
              {/* כהה */}
              <div style={{
                padding: '4px 10px', borderRadius: 16, fontSize: '.72rem', fontWeight: 600,
                background: darkMode ? 'var(--b)' : 'transparent',
                color: darkMode ? '#fff' : 'var(--t3)',
                transition: 'all .15s',
              }}>
                {lang === 'he' ? '🌙 כהה' : '🌙 Dark'}
              </div>
              {/* בהיר */}
              <div style={{
                padding: '4px 10px', borderRadius: 16, fontSize: '.72rem', fontWeight: 600,
                background: !darkMode ? 'var(--b)' : 'transparent',
                color: !darkMode ? '#fff' : 'var(--t3)',
                transition: 'all .15s',
              }}>
                {lang === 'he' ? '☀ בהיר' : '☀ Light'}
              </div>
            </div>
          </div>

          {/* גודל טקסט */}
          <div className="access-row">
            <div className="access-lbl">
              <span>{T.fontSize}</span>
              <span>{fontSize}%</span>
            </div>
            <input
              type="range" min={80} max={145} step={5} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          <label className="access-tog">
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
            <span>{T.highContrast}</span>
          </label>

          <label className="access-tog">
            <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
            <span>{T.grayscale}</span>
          </label>

          <label className="access-tog">
            <input type="checkbox" checked={readableFont} onChange={(e) => setReadableFont(e.target.checked)} />
            <span>{T.readableFont}</span>
          </label>
        </div>
      )}

      {/* כפתור נגישות — רוחב מלא */}
      <button
        onClick={() => setOpen(!open)}
        title={T.accessibility}
        aria-label={T.accessibility}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '8px 11px', borderRadius: 7,
          background: open ? 'var(--b-bg)' : 'transparent',
          border: '1px solid ' + (open ? 'var(--b-bd)' : 'transparent'),
          color: open ? 'var(--b)' : 'var(--t2)',
          cursor: 'pointer', transition: 'all .12s', fontSize: '.86rem',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v5" />
          <path d="M8 10l4 2 4-2" />
          <path d="M10 22l2-5 2 5" />
          <path d="M12 17v-5" />
        </svg>
        <span style={{ flex: 1, textAlign: 'inherit' }}>{T.accessibility}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: .5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
    </div>
  );
}

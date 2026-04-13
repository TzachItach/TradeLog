import { useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';

export default function AccessibilityWidget() {
  const { lang, fontSize, highContrast, grayscale, readableFont, setFontSize, setHighContrast, setGrayscale, setReadableFont, sidebarCollapsed } = useStore();
  const T = useT(lang);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 6 }}>
      {open && (
        <div className="access-panel">
          <div className="access-title">{T.accessibility}</div>

          <div className="access-row">
            <div className="access-lbl">
              <span>{T.fontSize}</span>
              <span>{fontSize}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={145}
              step={5}
              value={fontSize}
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

      <button
        className="btn-access"
        onClick={() => setOpen(!open)}
        title={T.accessibility}
        aria-label={T.accessibility}
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v5" />
          <path d="M8 10l4 2 4-2" />
          <path d="M10 22l2-5 2 5" />
          <path d="M12 17v-5" />
        </svg>
        {!sidebarCollapsed && (
          <span style={{ fontSize: '.76rem', marginInlineStart: 6, color: 'var(--t2)' }}>
            {T.accessibility}
          </span>
        )}
      </button>
    </div>
  );
}

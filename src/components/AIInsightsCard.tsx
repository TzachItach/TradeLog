import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { computeInsights, buildTradesSummary, type Insight } from '../lib/insights';

const CACHE_KEY = 'ai_insights_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  text: string;
  ts: number;
  tradeCount: number;
}

function IconPositive() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IconTip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

export default function AIInsightsCard() {
  const { trades, lang, selectedAccount } = useStore();
  const isHe = lang === 'he';

  const filteredTrades = selectedAccount === 'all'
    ? trades
    : trades.filter(t => t.account_id === selectedAccount);

  const insights = computeInsights(filteredTrades);

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // load cache on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < CACHE_TTL && entry.tradeCount === filteredTrades.length) {
        setAiText(entry.text);
      }
    } catch { /* ignore */ }
  }, []);

  async function handleAI() {
    if (filteredTrades.length < 5) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const summary = buildTradesSummary(filteredTrades, lang);
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, lang }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const text: string = data.insight ?? '';
      setAiText(text);
      const entry: CacheEntry = { text, ts: Date.now(), tradeCount: filteredTrades.length };
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      setAiError(isHe ? 'שגיאה בשליפת ניתוח AI' : 'Failed to fetch AI analysis');
    } finally {
      setAiLoading(false);
    }
  }

  if (filteredTrades.length < 5) return null;

  const iconMap = {
    positive: <IconPositive />,
    warning: <IconWarning />,
    tip: <IconTip />,
  };
  const colorMap: Record<Insight['type'], string> = {
    positive: 'var(--g)',
    warning: 'var(--o)',
    tip: 'var(--b)',
  };

  const SHOW = expanded ? insights : insights.slice(0, 3);

  return (
    <div className="ai-insights-card">
      {/* Header */}
      <div className="ai-insights-header">
        <div className="ai-insights-title">
          <IconSparkle />
          {isHe ? 'תובנות חכמות' : 'Smart Insights'}
        </div>
        <span className="ai-insights-badge">
          {isHe ? `מבוסס על ${filteredTrades.length} עסקאות` : `Based on ${filteredTrades.length} trades`}
        </span>
      </div>

      {/* Rule-based insights */}
      <div className="ai-insights-list">
        {SHOW.map((ins, i) => (
          <div key={i} className={`ai-insight-row ai-insight-${ins.type}`}>
            <span className="ai-insight-icon" style={{ color: colorMap[ins.type] }}>
              {iconMap[ins.type]}
            </span>
            <span className="ai-insight-text">
              {isHe ? ins.text_he : ins.text_en}
            </span>
          </div>
        ))}
        {insights.length > 3 && (
          <button className="ai-insights-show-more" onClick={() => setExpanded(e => !e)}>
            {expanded
              ? (isHe ? 'הצג פחות' : 'Show less')
              : (isHe ? `+ עוד ${insights.length - 3} תובנות` : `+ ${insights.length - 3} more`)}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="ai-insights-divider" />

      {/* AI section */}
      {aiText ? (
        <div className="ai-insights-result">
          <div className="ai-insights-result-label">
            <IconSparkle />
            {isHe ? 'ניתוח Claude AI' : 'Claude AI Analysis'}
          </div>
          <p className="ai-insights-result-text">{aiText}</p>
          <button
            className="ai-insights-refresh"
            onClick={() => { setAiText(null); localStorage.removeItem(CACHE_KEY); }}
          >
            {isHe ? 'רענן ניתוח' : 'Refresh analysis'}
          </button>
        </div>
      ) : (
        <div className="ai-insights-cta">
          <p className="ai-insights-cta-desc">
            {isHe
              ? 'קבל ניתוח מעמיק של דפוסי המסחר שלך מבוסס AI'
              : 'Get a deep AI-powered analysis of your trading patterns'}
          </p>
          <button
            className="btn btn-primary ai-insights-btn"
            onClick={handleAI}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <span className="ai-insights-spinner" />
                {isHe ? 'מנתח...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <IconSparkle />
                {isHe ? 'קבל ניתוח AI' : 'Get AI Analysis'}
              </>
            )}
          </button>
          {aiError && <p className="ai-insights-error">{aiError}</p>}
        </div>
      )}
    </div>
  );
}

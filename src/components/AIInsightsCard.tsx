import { useState } from 'react';
import { useStore } from '../store';
import { computeInsights, type Insight } from '../lib/insights';

function IconPositive() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IconTip() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

export default function AIInsightsCard() {
  const { trades, lang, selectedAccount } = useStore();
  const isHe = lang === 'he';
  const [expanded, setExpanded] = useState(false);

  const filteredTrades = selectedAccount === 'all'
    ? trades
    : trades.filter(t => t.account_id === selectedAccount);

  const insights = computeInsights(filteredTrades);

  if (insights.length === 0) return null;

  const SHOW = expanded ? insights : insights.slice(0, 3);

  const iconMap = {
    positive: <IconPositive />,
    warning: <IconWarning />,
    tip: <IconTip />,
  };
  const colorMap: Record<Insight['type'], string> = {
    positive: 'var(--g)',
    warning: 'var(--o)',
    tip: '#5b8fff',
  };

  return (
    <div className="ai-insights-card">
      <div className="ai-insights-header">
        <div className="ai-insights-title">
          <IconSparkle />
          {isHe ? 'תובנות חכמות' : 'Smart Insights'}
        </div>
      </div>

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
              : (isHe ? `+ עוד ${insights.length - 3}` : `+ ${insights.length - 3} more`)}
          </button>
        )}
      </div>
    </div>
  );
}

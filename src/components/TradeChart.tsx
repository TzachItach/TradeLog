import { useEffect, useRef } from 'react';
import { useStore } from '../store';

declare global {
  interface Window {
    TradingView: { widget: new (c: Record<string, unknown>) => void };
  }
}

// מיפוי סמלים מ-futures לפורמט TradingView
const TV_MAP: Record<string, string> = {
  // Equity Index
  NQ: 'CME_MINI:NQ1!',   MNQ: 'CME_MINI:MNQ1!',
  ES: 'CME_MINI:ES1!',   MES: 'CME_MINI:MES1!',
  YM: 'CBOT:YM1!',       MYM: 'CBOT:MYM1!',
  RTY: 'CME:RTY1!',      M2K: 'CME:M2K1!',
  NKD: 'CME:NKD1!',      EMD: 'CME:EMD1!',
  // Energy
  CL: 'NYMEX:CL1!',      MCL: 'NYMEX:MCL1!',
  NG: 'NYMEX:NG1!',      RB: 'NYMEX:RB1!',
  HO: 'NYMEX:HO1!',      BZ: 'NYMEX:BB1!',
  // Metals
  GC: 'COMEX:GC1!',      MGC: 'COMEX:MGC1!',
  SI: 'COMEX:SI1!',      SIL: 'COMEX:SIL1!',
  HG: 'COMEX:HG1!',      PA: 'NYMEX:PA1!',      PL: 'NYMEX:PL1!',
  // FX
  '6E': 'CME:6E1!',      M6E: 'CME:M6E1!',
  '6B': 'CME:6B1!',      '6J': 'CME:6J1!',
  '6C': 'CME:6C1!',      '6A': 'CME:6A1!',
  '6S': 'CME:6S1!',      '6N': 'CME:6N1!',
  DX: 'ICEUS:DX1!',
  // Rates
  ZB: 'CBOT:ZB1!',       ZN: 'CBOT:ZN1!',
  ZF: 'CBOT:ZF1!',       ZT: 'CBOT:ZT1!',
  GE: 'CME:GE1!',
  // Agriculture
  ZC: 'CBOT:ZC1!',       ZW: 'CBOT:ZW1!',
  ZS: 'CBOT:ZS1!',       ZL: 'CBOT:ZL1!',
  ZM: 'CBOT:ZM1!',       CT: 'ICEUS:CT1!',
  KC: 'ICEUS:KC1!',      SB: 'ICEUS:SB1!',
  // Crypto
  BTC: 'CME:BTC1!',      MBT: 'CME:MBT1!',
  ETH: 'CME:ETH1!',      MET: 'CME:MET1!',
};

interface Props {
  symbol: string;
  tradeDate: string; // "YYYY-MM-DD"
  lang: 'he' | 'en';
}

export default function TradeChart({ symbol, tradeDate, lang }: Props) {
  const { darkMode } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    // נקה widget קודם
    containerRef.current.innerHTML = '';

    const tvSymbol = TV_MAP[symbol.toUpperCase()] ?? symbol;
    const date = new Date(tradeDate + 'T12:00:00Z');
    const from = Math.floor(date.getTime() / 1000) - 86400;      // יום לפני
    const to   = Math.floor(date.getTime() / 1000) + 86400 * 2;  // יומיים אחרי

    const init = () => {
      if (!window.TradingView || !containerRef.current) return;
      // צור div פנימי עם ID ייחודי
      const id = 'tv_' + Math.random().toString(36).slice(2, 9);
      const inner = document.createElement('div');
      inner.id = id;
      inner.style.height = '100%';
      containerRef.current.appendChild(inner);

      new window.TradingView.widget({
        container_id: id,
        symbol: tvSymbol,
        interval: '5',
        from,
        to,
        theme: darkMode ? 'dark' : 'light',
        style: '1',
        locale: lang === 'he' ? 'he_IL' : 'en',
        toolbar_bg: darkMode ? '#1a1d2e' : '#ffffff',
        enable_publishing: false,
        save_image: true,
        withdateranges: true,
        allow_symbol_change: true,
        width: '100%',
        height: '100%',
      });
    };

    if (window.TradingView) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [symbol, tradeDate, darkMode, lang]);

  if (!symbol) {
    return (
      <div className="tv-empty">
        {lang === 'he' ? 'בחר סמל תחילה כדי לצפות בגרף' : 'Select a symbol to view the chart'}
      </div>
    );
  }

  return <div ref={containerRef} className="tv-container" />;
}

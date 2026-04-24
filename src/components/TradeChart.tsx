import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, ColorType, CrosshairMode, LineStyle,
  CandlestickSeries, createSeriesMarkers,
  type IChartApi, type ISeriesApi, type CandlestickData, type Time,
  type SeriesMarker,
} from 'lightweight-charts';
import type { Trade } from '../types';
import { useStore } from '../store';
import { getPointValue } from '../lib/futures';

// ── TradingView quick-link symbols ────────────────────────────────────────
const TV_SYMBOLS: Record<string, string> = {
  NQ: 'CME_MINI:NQ1!', MNQ: 'CME_MINI:MNQ1!',
  ES: 'CME_MINI:ES1!', MES: 'CME_MINI:MES1!',
  YM: 'CBOT:YM1!',    MYM: 'CBOT:MYM1!',
  RTY: 'CME:RTY1!',   M2K: 'CME:M2K1!',
  CL: 'NYMEX:CL1!',   MCL: 'NYMEX:MCL1!',
  GC: 'COMEX:GC1!',   MGC: 'COMEX:MGC1!',
  SI: 'COMEX:SI1!',   HG: 'COMEX:HG1!',
  ZN: 'CBOT:ZN1!',    ZB: 'CBOT:ZB1!',
  ZC: 'CBOT:ZC1!',    ZW: 'CBOT:ZW1!',
  ZS: 'CBOT:ZS1!',    NG: 'NYMEX:NG1!',
  '6E': 'CME:6E1!',   '6J': 'CME:6J1!',
  '6B': 'CME:6B1!',   '6C': 'CME:6C1!',
};

// ── Approximate prices per symbol (for simulation baseline) ──────────────
const APPROX_PRICES: Record<string, number> = {
  NQ: 21000, MNQ: 21000, ES: 5800, MES: 5800,
  YM: 44000, MYM: 44000, RTY: 2200, M2K: 2200,
  CL: 70,    MCL: 70,    GC: 3000,  MGC: 3000,
  SI: 34,    HG: 4.5,    PL: 1000,
  ZN: 110,   ZB: 115,    ZF: 108,   ZT: 102,
  ZC: 450,   ZW: 550,    ZS: 1000,
  NG: 3.5,   RB: 2.2,    HO: 2.5,
  '6E': 1.09, '6J': 0.0067, '6B': 1.27, '6C': 0.74,
};

// ── Polygon.io contract ticker (front-month estimation) ───────────────────
function getPolygonTicker(symbol: string, tradeDate: string): string {
  const d = new Date(tradeDate);
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const monthCodes: Record<number, string> = { 3: 'H', 6: 'M', 9: 'U', 12: 'Z' };
  const quarters = [3, 6, 9, 12];
  let cm = quarters.find(m => m > month);
  let cy = year;
  if (!cm) { cm = 3; cy = year + 1; }
  return `${symbol}${monthCodes[cm]}${String(cy).slice(-2)}`;
}

interface SimResult {
  bars: CandlestickData<Time>[];
  entryBarTime: number;
  exitBarTime: number;
}

// ── Simulated OHLC — tells the actual trade story ─────────────────────────
function generateSimBars(trade: Trade, tf: number): SimResult {
  const entryPrice = trade.entry_price ?? APPROX_PRICES[trade.symbol] ?? 1000;
  const pv   = getPointValue(trade.symbol);
  const size = trade.size ?? 1;
  const isLong = trade.direction === 'long';

  // Calculate exact exit price from entry+pnl or use stored exit_price
  let exitPrice: number;
  if (trade.exit_price) {
    exitPrice = trade.exit_price;
  } else if (pv > 0 && size > 0) {
    const pnlPts = trade.pnl / (pv * size);
    exitPrice = isLong ? entryPrice + pnlPts : entryPrice - pnlPts;
  } else {
    // Fallback: estimate 0.5% move
    const sign = (trade.pnl >= 0) ? 1 : -1;
    exitPrice = isLong
      ? entryPrice + sign * entryPrice * 0.005
      : entryPrice - sign * entryPrice * 0.005;
  }

  // SL / TP price levels
  const slPrice = trade.stop_loss_pts
    ? (isLong ? entryPrice - trade.stop_loss_pts : entryPrice + trade.stop_loss_pts)
    : null;
  const tpPrice = trade.take_profit_pts
    ? (isLong ? entryPrice + trade.take_profit_pts : entryPrice - trade.take_profit_pts)
    : null;

  const date = new Date(trade.trade_date + 'T14:30:00Z'); // 09:30 EST = 14:30 UTC
  const NUM_BARS  = 78;
  const intervalS = tf * 60;
  const ENTRY_IDX = 18;  // entry at ~25% of session
  const EXIT_IDX  = Math.min(ENTRY_IDX + Math.max(8, Math.floor(NUM_BARS * 0.35)), NUM_BARS - 5);
  const noise     = entryPrice * 0.0003; // very tight noise — chart looks clean

  // Pre-entry: price approaches entry from opposite of trade direction
  // (price was below entry for longs, above for shorts — classic breakout approach)
  const preEntryDrift = isLong ? -entryPrice * 0.002 : entryPrice * 0.002;
  const preStart = entryPrice + preEntryDrift;

  const bars: CandlestickData<Time>[] = [];
  let price = preStart;

  for (let i = 0; i < NUM_BARS; i++) {
    const t = Math.floor(date.getTime() / 1000) + i * intervalS;
    let open: number, close: number, high: number, low: number;

    if (i < ENTRY_IDX) {
      // Phase 1: pre-entry consolidation approaching entry level
      const prog = i / ENTRY_IDX;
      const target = preStart + (entryPrice - preStart) * prog;
      open  = price;
      close = target + (Math.random() - 0.5) * noise;
      high  = Math.max(open, close) + Math.random() * noise * 1.5;
      low   = Math.min(open, close) - Math.random() * noise * 1.5;
      price = close;

    } else if (i === ENTRY_IDX) {
      // Entry bar: opens exactly at entry price, small body
      open  = entryPrice;
      close = entryPrice + (isLong ? 1 : -1) * noise * 0.5;
      high  = Math.max(open, close) + noise;
      low   = Math.min(open, close) - noise * 0.8;
      price = close;

    } else if (i > ENTRY_IDX && i < EXIT_IDX) {
      // Phase 2: price trends toward exit with realistic pullbacks
      const prog = (i - ENTRY_IDX) / (EXIT_IDX - ENTRY_IDX);
      // Sigmoid-like curve: fast early, slows near exit
      const smoothProg = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
      const target = entryPrice + (exitPrice - entryPrice) * smoothProg;
      const pullback = Math.sin(i * 0.9) * noise * 1.2; // wave-like pullbacks
      open  = price;
      close = target + pullback + (Math.random() - 0.5) * noise * 0.4;
      high  = Math.max(open, close) + Math.random() * noise * 1.2;
      low   = Math.min(open, close) - Math.random() * noise * 1.2;
      // Clamp: don't breach SL on winning trades
      if (slPrice !== null && trade.pnl >= 0) {
        if (isLong) low  = Math.max(low,  slPrice + noise * 0.1);
        else        high = Math.min(high, slPrice - noise * 0.1);
      }
      price = close;

    } else if (i === EXIT_IDX) {
      // Exit bar: closes exactly at exit price
      open  = price;
      close = exitPrice;
      high  = Math.max(open, close) + noise;
      low   = Math.min(open, close) - noise;
      price = close;

    } else {
      // Phase 3: post-exit chop, no direction
      open  = price;
      close = price + (Math.random() - 0.5) * noise * 1.5;
      high  = Math.max(open, close) + Math.random() * noise;
      low   = Math.min(open, close) - Math.random() * noise;
      price = close;
    }

    bars.push({ time: t as Time, open, high, low, close });
  }

  // Suppress TS unused-var warning for slPrice/tpPrice (used for clamping above; tpPrice is reference only)
  void tpPrice;

  return {
    bars,
    entryBarTime: Math.floor(date.getTime() / 1000) + ENTRY_IDX * intervalS,
    exitBarTime:  Math.floor(date.getTime() / 1000) + EXIT_IDX  * intervalS,
  };
}

// ── Polygon.io fetch ───────────────────────────────────────────────────────
async function fetchPolygon(
  symbol: string, date: string, tf: number, apiKey: string,
): Promise<CandlestickData<Time>[] | null> {
  const ticker = getPolygonTicker(symbol, date);
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${tf}/minute/${date}/${date}?adjusted=false&sort=asc&limit=1000&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.results?.length) return null;
  return json.results.map((r: { t: number; o: number; h: number; l: number; c: number }) => ({
    time: Math.floor(r.t / 1000) as Time,
    open: r.o, high: r.h, low: r.l, close: r.c,
  }));
}

// ── Chart colours ─────────────────────────────────────────────────────────
function chartColors(dark: boolean) {
  return {
    bg:       dark ? '#181818' : '#FAFAFA',
    grid:     dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    border:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
    text:     dark ? '#B3B3B3' : '#6A6A6A',
    crosshair:dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
    upBody:   '#1DB954', upWick: '#1DB954',
    downBody: '#E91429', downWick: '#E91429',
  };
}

type Timeframe = 1 | 5 | 15;

interface Props {
  trade: Trade;
  lang: 'he' | 'en';
}

export default function TradeChart({ trade, lang }: Props) {
  const { polygonApiKey, darkMode } = useStore();
  const isHe = lang === 'he';

  const containerRef  = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<IChartApi | null>(null);
  const seriesRef     = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tf, setTf]                   = useState<Timeframe>(5);
  const [bars, setBars]               = useState<CandlestickData<Time>[]>([]);
  const [loading, setLoading]         = useState(false);
  const [dataSource, setDataSource]   = useState<'sim' | 'live' | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [replaying, setReplaying]     = useState(false);
  const [replayIdx, setReplayIdx]     = useState(0);
  // Sim marker times (always set in sim mode so markers always appear)
  const [simEntryTime, setSimEntryTime] = useState<number | null>(null);
  const [simExitTime,  setSimExitTime]  = useState<number | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReplaying(false);
    setSimEntryTime(null);
    setSimExitTime(null);
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);

    let liveBars: CandlestickData<Time>[] | null = null;

    if (polygonApiKey && trade.symbol) {
      try {
        liveBars = await fetchPolygon(trade.symbol, trade.trade_date, tf, polygonApiKey);
        if (liveBars) setDataSource('live');
      } catch {
        // fall through to simulation
      }
    }

    if (liveBars) {
      setBars(liveBars);
      setReplayIdx(liveBars.length);
    } else {
      const sim = generateSimBars(trade, tf);
      setDataSource('sim');
      setSimEntryTime(sim.entryBarTime);
      setSimExitTime(sim.exitBarTime);
      setBars(sim.bars);
      setReplayIdx(sim.bars.length);
    }

    setLoading(false);
  }, [trade.symbol, trade.trade_date, trade.pnl, trade.direction, trade.size,
      trade.entry_price, trade.exit_price, tf, polygonApiKey]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Init/update chart ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;
    const c = chartColors(darkMode);

    // Create chart on first render
    if (!chartRef.current) {
      chartRef.current = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: c.bg },
          textColor: c.text,
          fontFamily: "'Inter', 'SF Pro', system-ui, sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: c.grid },
          horzLines: { color: c.grid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: c.crosshair, labelBackgroundColor: '#1DB954' },
          horzLine: { color: c.crosshair, labelBackgroundColor: '#1DB954' },
        },
        rightPriceScale: { borderColor: c.border },
        timeScale: {
          borderColor: c.border,
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });
      seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: c.upBody, downColor: c.downBody,
        borderUpColor: c.upWick, borderDownColor: c.downWick,
        wickUpColor: c.upWick, wickDownColor: c.downWick,
      });
    } else {
      // Update colours when darkMode changes
      chartRef.current.applyOptions({
        layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
        grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
        crosshair: { vertLine: { color: c.crosshair }, horzLine: { color: c.crosshair } },
        rightPriceScale: { borderColor: c.border },
        timeScale: { borderColor: c.border },
      });
    }

    // Set bar data
    const displayed = replaying ? bars.slice(0, replayIdx) : bars;
    seriesRef.current?.setData(displayed);

    // ── Price level markers (entry / exit) ────────────────────────────
    const markers: SeriesMarker<Time>[] = [];
    const priceLinesCleanup: (() => void)[] = [];

    const addLine = (price: number, color: string, title: string) => {
      const pl = seriesRef.current?.createPriceLine({
        price, color, lineWidth: 1, lineStyle: LineStyle.Dashed,
        axisLabelVisible: true, title,
      });
      if (pl) priceLinesCleanup.push(() => seriesRef.current?.removePriceLine(pl));
    };

    // Entry price line
    if (trade.entry_price) {
      addLine(trade.entry_price, '#1DB954', isHe ? 'כניסה' : 'Entry');
    }
    // Exit price line
    if (trade.exit_price) {
      const exitColor = trade.pnl >= 0 ? '#1DB954' : '#E91429';
      addLine(trade.exit_price, exitColor, isHe ? 'יציאה' : 'Exit');
    }

    // Entry/exit candle markers — use manual times if set, otherwise fall back to sim positions
    const entryTs = trade.entry_time
      ? parseTime(trade.trade_date, trade.entry_time)
      : simEntryTime;
    const exitTs = trade.exit_time
      ? parseTime(trade.trade_date, trade.exit_time)
      : simExitTime;

    if (entryTs) {
      const bar = displayed.find(b => (b.time as number) >= entryTs);
      if (bar) markers.push({
        time: bar.time,
        position: trade.direction === 'long' ? 'belowBar' : 'aboveBar',
        color: '#1DB954',
        shape: trade.direction === 'long' ? 'arrowUp' : 'arrowDown',
        text: isHe ? 'כניסה' : 'Entry',
        size: 1.5,
      });
    }
    if (exitTs) {
      const bar = displayed.find(b => (b.time as number) >= exitTs);
      if (bar) markers.push({
        time: bar.time,
        position: trade.direction === 'long' ? 'aboveBar' : 'belowBar',
        color: trade.pnl >= 0 ? '#1DB954' : '#E91429',
        shape: trade.direction === 'long' ? 'arrowDown' : 'arrowUp',
        text: isHe ? 'יציאה' : 'Exit',
        size: 1.5,
      });
    }

    if (markers.length && seriesRef.current) createSeriesMarkers(seriesRef.current, markers);
    if (!replaying) chartRef.current?.timeScale().fitContent();

    return () => priceLinesCleanup.forEach(fn => fn());
  }, [bars, replayIdx, replaying, darkMode, trade.entry_price, trade.exit_price,
      trade.entry_time, trade.exit_time, trade.direction, trade.pnl, isHe,
      simEntryTime, simExitTime]);

  // ── ResizeObserver ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chartRef.current?.resize(width, height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [bars]);

  // ── Cleanup chart on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ── Replay ────────────────────────────────────────────────────────────
  const startReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    setReplaying(true);
    setReplayIdx(1);
    let idx = 1;
    replayTimerRef.current = setInterval(() => {
      idx++;
      setReplayIdx(idx);
      if (idx >= bars.length) {
        clearInterval(replayTimerRef.current!);
        setReplaying(false);
      }
    }, 60); // ~60ms per bar → full replay ~5s for 80 bars
  };

  const stopReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    setReplaying(false);
    setReplayIdx(bars.length);
  };

  const tvSymbol = TV_SYMBOLS[trade.symbol];
  const tvUrl = tvSymbol
    ? `https://www.tradingview.com/chart/?symbol=${tvSymbol}`
    : `https://www.tradingview.com/chart/?symbol=${trade.symbol}`;

  const pnlColor = trade.pnl >= 0 ? 'var(--g)' : 'var(--r)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 0 8px',
      }}>
        {/* Timeframe buttons */}
        <div style={{ display: 'flex', gap: 3 }}>
          {([1, 5, 15] as Timeframe[]).map(t => (
            <button key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
                border: tf === t ? '1px solid #1DB954' : '1px solid var(--bd)',
                background: tf === t ? 'rgba(29,185,84,.15)' : 'var(--s2)',
                color: tf === t ? '#1DB954' : 'var(--t2)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >{t}m</button>
          ))}
        </div>

        {/* Replay */}
        <button
          onClick={replaying ? stopReplay : startReplay}
          disabled={loading || bars.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
            border: replaying ? '1px solid #F59B23' : '1px solid var(--bd)',
            background: replaying ? 'rgba(245,155,35,.15)' : 'var(--s2)',
            color: replaying ? '#F59B23' : 'var(--t2)',
            cursor: loading ? 'default' : 'pointer', transition: 'all .15s',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {replaying
            ? <><span style={{ fontSize: '.8rem' }}>■</span> {isHe ? 'עצור' : 'Stop'}</>
            : <><span style={{ fontSize: '.8rem' }}>▶</span> {isHe ? 'ריפליי' : 'Replay'}</>
          }
        </button>

        <div style={{ flex: 1 }} />

        {/* Data source badge */}
        {dataSource && (
          <span style={{
            fontSize: '.65rem', padding: '2px 7px', borderRadius: 999,
            background: dataSource === 'live' ? 'rgba(29,185,84,.12)' : 'rgba(255,255,255,.05)',
            color: dataSource === 'live' ? '#1DB954' : 'var(--t3)',
            border: `1px solid ${dataSource === 'live' ? 'rgba(29,185,84,.3)' : 'var(--bd)'}`,
            fontWeight: 600,
          }}>
            {dataSource === 'live' ? '● Live Data' : isHe ? '◦ סימולציה' : '◦ Simulated'}
          </span>
        )}

        {/* TradingView link */}
        <a
          href={tvUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
            border: '1px solid var(--bd)', background: 'var(--s2)',
            color: 'var(--t2)', textDecoration: 'none', transition: 'all .15s',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
          </svg>
          TradingView
        </a>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--s2)', borderRadius: 10,
        }}>
          <div style={{ color: 'var(--t3)', fontSize: '.85rem' }}>
            {isHe ? 'טוען נתונים...' : 'Loading chart...'}
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      {!loading && (
        <div
          ref={containerRef}
          style={{
            width: '100%', height: 300,
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--bd)',
          }}
        />
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          fontSize: '.72rem', color: 'var(--o)', padding: '6px 10px',
          background: 'rgba(245,155,35,.08)', borderRadius: 6, marginTop: 6,
        }}>
          {error}
        </div>
      )}

      {/* ── Info strip ── */}
      {!loading && (
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap',
          padding: '8px 2px 0', fontSize: '.72rem',
        }}>
          <span style={{ color: 'var(--t3)' }}>
            {trade.symbol}
            {' · '}
            <span style={{ color: trade.direction === 'long' ? 'var(--g)' : 'var(--r)', fontWeight: 700 }}>
              {trade.direction === 'long' ? '▲ Long' : '▼ Short'}
            </span>
          </span>
          {trade.entry_price && (
            <span style={{ color: 'var(--t2)' }}>
              {isHe ? 'כניסה' : 'Entry'}{': '}
              <span style={{ color: 'var(--t1)', fontWeight: 700, fontFamily: 'monospace' }}>
                {trade.entry_price.toLocaleString()}
              </span>
            </span>
          )}
          {trade.exit_price && (
            <span style={{ color: 'var(--t2)' }}>
              {isHe ? 'יציאה' : 'Exit'}{': '}
              <span style={{ color: 'var(--t1)', fontWeight: 700, fontFamily: 'monospace' }}>
                {trade.exit_price.toLocaleString()}
              </span>
            </span>
          )}
          <span style={{ color: pnlColor, fontWeight: 700, fontFamily: 'monospace', marginInlineStart: 'auto' }}>
            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {/* ── Simulation notice + API key prompt ── */}
      {!loading && dataSource === 'sim' && (
        <div style={{
          marginTop: 10, padding: '10px 14px', borderRadius: 8,
          background: 'var(--s2)', border: '1px solid var(--bd)',
          fontSize: '.72rem', color: 'var(--t3)', lineHeight: 1.6,
        }}>
          {polygonApiKey
            ? (isHe
                ? `⚠ לא נמצאו נתונים ב-Polygon.io עבור ${trade.symbol}. ייתכן שסמל זה דורש מנוי Futures. מוצגת סימולציה.`
                : `⚠ No Polygon.io data found for ${trade.symbol}. Futures data may require a paid plan. Showing simulation.`)
            : (isHe
                ? '◦ גרף זה הוא סימולציה מבוססת על נתוני העסקה. להצגת נתוני שוק אמיתיים, הוסף Polygon.io API key בהגדרות.'
                : '◦ This chart is a simulation based on your trade data. For real market data, add a Polygon.io API key in Settings.')
          }
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function parseTime(dateStr: string, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCHours(h + 5, m); // EST offset approximation
  return Math.floor(d.getTime() / 1000);
}

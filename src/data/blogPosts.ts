export interface Block {
  type: 'p' | 'h2' | 'h3' | 'ul' | 'ol' | 'callout' | 'cta' | 'hr';
  text?: string;
  items?: string[];
  kind?: 'tip' | 'warning' | 'info';
  btn?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
  categoryLabel: string;
  excerpt: string;
  content: Block[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'tradovate-auto-import-trading-journal',
    title: 'How to Auto-Import Tradovate Trades to Your Journal (No CSV)',
    description:
      'Stop manually exporting CSV files. Learn how to connect Tradovate directly to TraderYo and have your futures trades synced automatically in seconds.',
    date: '2026-04-20',
    readTime: 5,
    category: 'guides',
    categoryLabel: 'Guides',
    excerpt:
      'Manual CSV exports waste 20+ minutes a day and introduce errors. Here\'s how to connect Tradovate directly via API and have every trade logged automatically.',
    content: [
      { type: 'p', text: 'If you trade futures on Tradovate, you\'ve probably been through this routine: wait for the session to end, export a CSV, open Excel or your journal, paste the data, fix the formatting, and hope nothing is off. It\'s slow, error-prone, and it pulls you out of the post-session review mindset.' },
      { type: 'p', text: 'TraderYo solves this with a direct API connection to Tradovate — no CSV, no copy-paste, no delays. Your trades sync in one click, including P&L, direction, symbol, timestamps, and commission.' },
      { type: 'h2', text: 'Why CSV Exports Are Holding You Back' },
      { type: 'p', text: 'The problem isn\'t just time. Manual imports create a gap between when you trade and when you review — and that gap is where lessons disappear. You\'re also one formatting mistake away from wrong P&L numbers skewing your analytics.' },
      { type: 'ul', items: [
        'Tradovate\'s CSV format changes without notice — breaking your import scripts',
        'Execution reports don\'t always map cleanly to completed trades',
        'Demo and live accounts have different data structures',
        'You have to do it again tomorrow. And the day after.',
      ]},
      { type: 'h2', text: 'How TraderYo\'s Direct Connection Works' },
      { type: 'p', text: 'TraderYo authenticates with the Tradovate API using your credentials (never stored in plain text), pulls your execution reports, identifies closing fills, resolves contract IDs to readable symbols (MNQ, NQ, ES, etc.), and creates complete trade records — automatically.' },
      { type: 'p', text: 'For each closed position, TraderYo records:' },
      { type: 'ul', items: [
        'Symbol (normalized: MNQM6 → MNQ)',
        'Direction (Long / Short — derived from which side closed the position)',
        'Gross P&L minus commission = net P&L',
        'Entry and exit timestamps',
        'Broker trade ID to prevent duplicate imports',
      ]},
      { type: 'callout', kind: 'info', text: 'TraderYo supports both Live and Demo/Eval Tradovate accounts. Select the right environment before connecting — live trades and eval trades stay separate.' },
      { type: 'h2', text: 'Step-by-Step: Connect Tradovate in TraderYo' },
      { type: 'ol', items: [
        'Go to Settings → Broker Connections',
        'Select Tradovate from the broker list',
        'Choose Live or Demo depending on your account type',
        'Enter your Tradovate email and password',
        'Click Connect — TraderYo authenticates and finds your account ID',
        'Click Sync Now to pull your trades (last 90 days on first sync)',
        'After the first sync, every subsequent sync picks up only new trades from where the last one ended',
      ]},
      { type: 'callout', kind: 'tip', text: 'Run a sync immediately after each session. It takes under 5 seconds and keeps your analytics current for your post-session review.' },
      { type: 'h2', text: 'What Happens After the Import' },
      { type: 'p', text: 'Every imported trade lands in your trading calendar, updates your equity curve, win rate, profit factor, and drawdown — all in real time. If you have multiple accounts (Live + Eval + Sim), each syncs independently and you can filter by account across all views.' },
      { type: 'p', text: 'If you trade NQ, MNQ, ES, MES, CL, GC, or any of the 50+ supported futures contracts, the R:R calculator automatically uses the correct point value for that symbol — no manual setup needed.' },
      { type: 'h2', text: 'Frequently Asked Questions' },
      { type: 'h3', text: 'Is my Tradovate password stored?' },
      { type: 'p', text: 'TraderYo uses your credentials to fetch an access token from Tradovate\'s API. The token is what\'s stored, not your password. Tradovate tokens expire and are refreshed on each sync.' },
      { type: 'h3', text: 'Does it work with Tradovate\'s evaluation accounts?' },
      { type: 'p', text: 'Yes. Toggle the "Demo / Eval" switch before connecting to point TraderYo at the Tradovate demo API endpoint. Your eval trades sync the same way as live trades.' },
      { type: 'h3', text: 'What if I also have a TopstepX account?' },
      { type: 'p', text: 'Connect both. TraderYo lets you link multiple brokers and accounts. Topstep trades and Tradovate trades stay in separate accounts, and you can view them together in the "All Accounts" dashboard view.' },
      { type: 'cta', text: 'Connect your Tradovate account and have every trade logged automatically.', btn: 'Start Free 14-Day Trial' },
    ],
  },
  {
    slug: 'prop-firm-trailing-drawdown-explained',
    title: 'Prop Firm Trailing Drawdown Explained: EOD vs Intraday',
    description:
      'Understand exactly how Topstep, Apex, and MyFundedFutures calculate trailing drawdown — and how to track it in real time so you never breach by surprise.',
    date: '2026-04-23',
    readTime: 7,
    category: 'prop-firm',
    categoryLabel: 'Prop Firm',
    excerpt:
      'Most traders know they have a drawdown limit — very few know exactly how it moves. Here\'s how trailing drawdown actually calculates at the major prop firms, and how to track your live floor.',
    content: [
      { type: 'p', text: 'Trailing drawdown is the rule that ends more funded accounts than any other. Not because traders blow past it intentionally — but because they don\'t know exactly where their floor is right now, in this moment, after this trade.' },
      { type: 'p', text: 'This guide explains how trailing drawdown calculates at the major prop firms, the difference between EOD and intraday trailing, the most common mistakes, and how to track your live floor automatically.' },
      { type: 'h2', text: 'What Is Trailing Drawdown?' },
      { type: 'p', text: 'A trailing drawdown limit means your maximum allowed loss floor moves upward as your account grows — but never moves down. If you start with a $150,000 account and a $3,000 trailing drawdown:' },
      { type: 'ul', items: [
        'Starting floor: $147,000',
        'After reaching $152,000 high-water mark → new floor: $149,000',
        'After reaching $155,000 → floor rises to $152,000',
        'The floor stops rising once it reaches your starting balance (at most prop firms)',
      ]},
      { type: 'p', text: 'The key insight: your floor is always (high-water mark) minus (drawdown limit). It only moves up, never down.' },
      { type: 'h2', text: 'EOD Trailing vs Intraday Trailing' },
      { type: 'p', text: 'This distinction is critical and confuses most traders.' },
      { type: 'h3', text: 'End-of-Day (EOD) Trailing — Most Common' },
      { type: 'p', text: 'Used by Topstep and most major prop firms. Your high-water mark updates at end of day based on your closing balance — intraday peaks don\'t count.' },
      { type: 'p', text: 'Example: Your floor is $147,000. During the day you hit $153,000 unrealized, but close the day at $150,500. Your new high-water mark is $150,500 → new floor: $147,500.' },
      { type: 'callout', kind: 'tip', text: 'EOD trailing means intraday drawdowns are calculated from your starting-of-day balance, not your intraday peak. This gives you more breathing room during the session.' },
      { type: 'h3', text: 'Intraday Trailing — More Aggressive' },
      { type: 'p', text: 'Some firms trail your drawdown off your intraday high-water mark, not just EOD. If your balance peaks at $153,000 intraday, your floor immediately rises to $150,000 — even if you give some back before the close.' },
      { type: 'callout', kind: 'warning', text: 'Always check your specific prop firm\'s rules. Intraday trailing is significantly more restrictive than EOD trailing on the same nominal drawdown amount.' },
      { type: 'h2', text: 'The 3 Most Common Trailing Drawdown Mistakes' },
      { type: 'h3', text: '1. Not knowing your current floor' },
      { type: 'p', text: 'Most traders look at their account balance and compare it to their starting balance. But if your account has grown, your floor has also risen. Many traders breach because they think they have $3,000 of room when they actually have $1,200.' },
      { type: 'h3', text: '2. Ignoring overnight positions' },
      { type: 'p', text: 'Open positions are marked to market at EOD. An overnight NQ position that moves $1,500 against you before the open can push you into drawdown territory before you even sit down to trade.' },
      { type: 'h3', text: '3. Confusing daily loss limit with trailing drawdown' },
      { type: 'p', text: 'Most prop firms have two separate limits: (1) a trailing drawdown from your high-water mark, and (2) a daily loss limit that resets every day. You can breach the daily limit without breaching the trailing drawdown — and vice versa. Track both.' },
      { type: 'h2', text: 'How TraderYo Tracks Your Live Floor' },
      { type: 'p', text: 'The Prop Firm Tracker in TraderYo does this calculation for you in real time. When you set up a prop firm account, you enter your starting balance, drawdown type (trailing or static), drawdown limit, and whether it\'s EOD or intraday. After that:' },
      { type: 'ul', items: [
        'Trailing floor updates automatically as your P&L changes',
        'High-water mark is tracked and displayed',
        'Drawdown used % shown as a color-coded progress bar (green → orange → red)',
        'Daily loss limit tracked separately with its own bar',
        'Status: Safe / Warning (>75% used) / Danger (>90% used) / Breached',
        'Auto-import from Topstep via direct API keeps everything current',
      ]},
      { type: 'h2', text: 'Quick Reference: Major Prop Firm Trailing Rules' },
      { type: 'ul', items: [
        'Topstep: EOD trailing drawdown, stops trailing once floor reaches starting balance',
        'Apex Trader Funding: EOD trailing drawdown',
        'MyFundedFutures: EOD trailing on most plans',
        'The Funded Trader: varies by plan — check your specific rules',
      ]},
      { type: 'callout', kind: 'warning', text: 'Prop firm rules change. Always verify the current drawdown rules in your specific account agreement — not on forums or third-party guides.' },
      { type: 'cta', text: 'Track your Prop Firm trailing drawdown automatically — connect TopstepX or enter trades manually.', btn: 'Start Free 14-Day Trial' },
    ],
  },
  {
    slug: 'true-cost-prop-trading-profitability',
    title: 'Are You Actually Profitable? The Real Cost of Prop Trading',
    description:
      'Challenge fees, resets, data fees — most funded traders don\'t know if they\'re net positive after expenses. Here\'s how to calculate your real profitability as a prop trader.',
    date: '2026-04-25',
    readTime: 6,
    category: 'business',
    categoryLabel: 'Business',
    excerpt:
      'You had a $1,200 payout last month. But you also spent $400 on a new challenge after a reset, plus data fees. What\'s your actual net? Most traders don\'t know — and that\'s the problem.',
    content: [
      { type: 'p', text: 'Most prop traders track their trading P&L carefully. Very few track the other side of the ledger: what they\'re spending to keep trading.' },
      { type: 'p', text: 'The result is a blind spot that can make a marginally profitable trader feel like they\'re winning — until they run the actual numbers.' },
      { type: 'h2', text: 'The Math Most Prop Traders Skip' },
      { type: 'p', text: 'Here\'s a realistic example of a prop trader\'s month:' },
      { type: 'ul', items: [
        'Payout received: $1,200',
        'New challenge fee (after previous reset): $165',
        'Data feed: $55/month',
        'Platform fee: $99/month',
        'Net profit: $1,200 − $165 − $55 − $99 = $881',
      ]},
      { type: 'p', text: 'That\'s still profitable — but only 73% of the headline number. Now add a month where the challenge ends in a breach and there\'s no payout:' },
      { type: 'ul', items: [
        'Challenge fee: $165',
        'Data feed: $55',
        'Platform fee: $99',
        'Net: −$319 for the month',
      ]},
      { type: 'p', text: 'Two months like that wipes out the profitable month. The question isn\'t whether you\'re profitable on your trades — it\'s whether you\'re profitable as a business.' },
      { type: 'h2', text: 'The Key Metrics That Actually Matter' },
      { type: 'h3', text: 'Cost Per Account (CPA)' },
      { type: 'p', text: 'How much are you spending, on average, per funded account you receive? If you\'ve spent $800 in challenges and received 2 funded accounts, your CPA is $400. If your average payout per account is $600, you\'re making $200 per cycle. If CPA exceeds average payout, you\'re losing money regardless of win rate.' },
      { type: 'h3', text: 'Net Profit (not Gross Payout)' },
      { type: 'p', text: 'Total payouts received minus total expenses (challenges + resets + data + platform fees). This is the only number that tells you if prop trading is working as a business for you.' },
      { type: 'h3', text: 'Break-Even Point' },
      { type: 'p', text: 'How many payouts do you need this month to cover your fixed costs (data, platform) plus any recent challenge fees? If your fixed costs are $154/month and you spent $165 on a new challenge, you need at least $319 in payouts just to break even.' },
      { type: 'callout', kind: 'tip', text: 'Treat prop trading like a business with a cost of goods sold. Your "COGS" is the cost of challenges and resets. Your margin is (payouts − expenses) / payouts.' },
      { type: 'h2', text: 'The Tilt Trap: Too Many Challenges Too Fast' },
      { type: 'p', text: 'One of the most expensive patterns in prop trading: taking a new challenge immediately after a breach, while still in a bad emotional state. TraderYo\'s Business Manager flags this automatically — if you\'ve started 2 or more evaluations within 48 hours, you\'ll see a Tilt Alert. It\'s a prompt to pause, not a judgment.' },
      { type: 'h2', text: 'How to Track This in TraderYo' },
      { type: 'p', text: 'The Business Manager page is built specifically for this. Every time you start a new challenge or reset, log it as an expense. Every payout goes in as a payout. The dashboard calculates:' },
      { type: 'ul', items: [
        'Total revenue (payouts) vs total expenses — month by month',
        'Net profit for the current month and all-time',
        'Cost per account — updates automatically as you add records',
        'Business Meter: a visual indicator of whether your payout-to-expense ratio is healthy',
        'Break-even progress: how much more in payouts you need to cover this month\'s costs',
        'Month-over-month bar chart so you can see the trend clearly',
      ]},
      { type: 'p', text: 'When you add a new prop firm account in Settings, TraderYo prompts you to log the challenge cost immediately — so you never forget to track it.' },
      { type: 'h2', text: 'A Useful Rule of Thumb' },
      { type: 'p', text: 'If your total payouts are less than 2× your total expenses, you\'re in marginal territory. Below 1× expenses means you\'re net negative. The Business Meter visualizes exactly this ratio and labels it clearly: Risky / Break-Even / Healthy.' },
      { type: 'callout', kind: 'info', text: 'This analysis only works if you log expenses consistently. Make it a habit: every new challenge or reset gets logged the day you pay for it.' },
      { type: 'cta', text: 'Track your real prop trading profitability — challenges, resets, payouts, all in one place.', btn: 'Start Free 14-Day Trial' },
    ],
  },
];

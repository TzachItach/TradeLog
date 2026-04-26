import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiskDisclosure() {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px', color: 'var(--t1)', overflowY: 'auto' }}>
      <div className="legal-wrap" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            ← {lang === 'he' ? 'חזור' : 'Back'}
          </button>
          <button className="btn btn-lang btn-close" style={{ fontSize: '.82rem', padding: '4px 12px', borderRadius: 16 }}
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
            {lang === 'he' ? 'EN' : 'עב'}
          </button>
        </div>

        {lang === 'he' ? (
          <>
            <div className="legal-title">גילוי סיכונים</div>
            <div className="legal-date">עודכן לאחרונה: אפריל 2026</div>

            <div className="disclaimer" style={{ marginBottom: 32 }}>
              ⚠ מסחר בחוזים עתידיים, אופציות, מניות ומכשירים פיננסיים אחרים כרוך בסיכון גבוה לאובדן הון. קרא בעיון את גילוי הסיכונים המלא להלן.
            </div>

            <div className="legal-section">
              <h2>1. אין ייעוץ השקעות</h2>
              <p>TraderYo הינו כלי תיעוד ואנליזה בלבד. <strong>אין בתוכן המוצג, בנתונים, בגרפים, בסטטיסטיקות, בחישובים, או בכל חלק אחר של השירות משום ייעוץ השקעות, ייעוץ מס, ייעוץ פיננסי, או המלצה לרכישה, מכירה, או החזקה של כל נכס פיננסי שהוא.</strong></p>
              <p>המידע המוצג נועד לצרכי ניהול יומן מסחר אישי בלבד, ואין לפרשו כהמלצה לפעולה כלשהי. כל החלטת מסחר היא באחריות הבלעדית של המשתמש.</p>
            </div>

            <div className="legal-section">
              <h2>2. סיכון אובדן הון</h2>
              <p>מסחר בשוק ההון, ובפרט מסחר בחוזים עתידיים (Futures), כולל סיכון מהותי לאובדן כל ההון המושקע ואף מעבר לו. ביצועי עבר אינם ערובה לתוצאות עתידיות.</p>
              <ul>
                <li><strong>מינוף (Leverage)</strong> — מסחר ממונף מגביר הן את הרווחים הפוטנציאליים והן את ההפסדים הפוטנציאליים. ניתן להפסיד יותר מההשקעה הראשונית.</li>
                <li><strong>תנודתיות</strong> — מחירי נכסים פיננסיים נתונים לתנודות חדות ובלתי צפויות.</li>
                <li><strong>נזילות</strong> — בשוקי נזילות נמוכה ייתכן כי לא ניתן יהיה לבצע עסקאות במחיר הרצוי.</li>
                <li><strong>סיכון טכנולוגי</strong> — תקלות בפלטפורמות מסחר, חיבור אינטרנט, או גורמים טכניים אחרים עלולים להשפיע על ביצוע עסקאות.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. ביצועי עבר</h2>
              <p>ביצועי מסחר היסטוריים המוצגים בשירות, לרבות גרפי Equity, ניתוחי P&L, ו-Win Rate, <strong>אינם מהווים אינדיקציה לתוצאות עתידיות</strong> ואין להסתמך עליהם לצורך קבלת החלטות השקעה.</p>
            </div>

            <div className="legal-section">
              <h2>4. אחריות מוגבלת</h2>
              <p>TraderYo ובעליו אינם אחראים לכל הפסד כספי, ישיר, עקיף, מקרי, או תוצאתי, הנובע מ:</p>
              <ul>
                <li>שימוש בשירות או בנתונים המוצגים בו</li>
                <li>הסתמכות על מידע, סטטיסטיקות, או חישובים בשירות</li>
                <li>שגיאות טכניות, אי-דיוקים, או השמטות בנתונים</li>
                <li>כל החלטת מסחר שהתקבלה על בסיס הנתונים בשירות</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. התאמה אישית</h2>
              <p>לפני ביצוע כל פעולת מסחר, על המשתמש לשקול את מצבו הפיננסי האישי, את יכולת הסיכון שלו, ואת מטרותיו הפיננסיות. מומלץ להתייעץ עם יועץ השקעות מוסמך ומורשה על ידי הרשות לניירות ערך בישראל לפני קבלת החלטות השקעה.</p>
            </div>

            <div className="legal-section">
              <h2>6. תאימות רגולטורית</h2>
              <p>TraderYo אינו גוף מפוקח על ידי הרשות לניירות ערך בישראל (רשות ני"ע), ה-CFTC, ה-SEC, ה-NFA, או כל רגולטור פיננסי אחר. השירות אינו מורשה לספק ייעוץ השקעות, לנהל תיקי השקעות, או לבצע כל פעולה המחייבת רישיון פיננסי.</p>
            </div>

            <div className="legal-section">
              <h2>7. דיוק הנתונים</h2>
              <p>TraderYo מסתמך על נתונים המוזנים על ידי המשתמש, ייבוא ממערכות ברוקרים חיצוניים, ו-API של צד שלישי. אנו שואפים לדיוק מרבי, אך איננו מתחייבים על נכונות, שלמות, או עדכניות הנתונים. <strong>יש לאמת תמיד את נתוני המסחר מול דוחות הברוקר הרשמיים.</strong></p>
            </div>

            <div className="disclaimer">
              ⚠ בשימוש בשירות, המשתמש מאשר כי קרא, הבין, וקיבל את גילוי הסיכונים המלא לעיל. TraderYo אינו ייעוץ השקעות. מסחר בניירות ערך כרוך בסיכון גבוה. יש להתייעץ עם יועץ מוסמך.
            </div>
          </>
        ) : (
          <>
            <div className="legal-title">Risk Disclosure</div>
            <div className="legal-date">Last updated: April 2026</div>

            <div className="disclaimer" style={{ marginBottom: 32 }}>
              ⚠ Trading futures, options, stocks, and other financial instruments involves a high risk of capital loss. Please read the full risk disclosure below carefully.
            </div>

            <div className="legal-section">
              <h2>1. Not Investment Advice</h2>
              <p>TraderYo is a trade journaling and analytics tool only. <strong>Nothing in this Service — including any content, data, charts, statistics, calculations, or other features — constitutes investment advice, tax advice, financial advice, or a recommendation to buy, sell, or hold any financial instrument.</strong></p>
              <p>All information is provided solely for personal trade journaling purposes and should not be interpreted as a recommendation for any action. All trading decisions are the sole responsibility of the user.</p>
            </div>

            <div className="legal-section">
              <h2>2. Risk of Capital Loss</h2>
              <p>Trading in financial markets, and in particular trading futures contracts, carries a substantial risk of losing all invested capital and more. Past performance is not indicative of future results.</p>
              <ul>
                <li><strong>Leverage</strong> — Leveraged trading amplifies both potential gains and potential losses. You may lose more than your initial investment.</li>
                <li><strong>Volatility</strong> — Financial asset prices are subject to sharp and unpredictable fluctuations.</li>
                <li><strong>Liquidity</strong> — In low-liquidity markets, it may not be possible to execute trades at the desired price.</li>
                <li><strong>Technology Risk</strong> — Failures in trading platforms, internet connectivity, or other technical factors may affect trade execution.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. Past Performance</h2>
              <p>Historical trading performance displayed in the Service, including Equity charts, P&L analysis, and Win Rate statistics, <strong>does not indicate future results</strong> and should not be relied upon for investment decisions.</p>
            </div>

            <div className="legal-section">
              <h2>4. Limitation of Liability</h2>
              <p>TraderYo and its owners are not liable for any financial loss — direct, indirect, incidental, or consequential — arising from:</p>
              <ul>
                <li>Use of the Service or any data displayed therein</li>
                <li>Reliance on information, statistics, or calculations in the Service</li>
                <li>Technical errors, inaccuracies, or omissions in data</li>
                <li>Any trading decision made based on Service data</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Suitability</h2>
              <p>Before executing any trade, users should consider their personal financial situation, risk tolerance, and financial objectives. It is recommended to consult a qualified, licensed investment advisor before making any investment decisions.</p>
            </div>

            <div className="legal-section">
              <h2>6. Regulatory Compliance</h2>
              <p>TraderYo is not regulated by the Israel Securities Authority (ISA), the CFTC, the SEC, the NFA, or any other financial regulator. The Service is not licensed to provide investment advice, manage investment portfolios, or perform any activity requiring a financial license.</p>
            </div>

            <div className="legal-section">
              <h2>7. Data Accuracy</h2>
              <p>TraderYo relies on data entered by the user, imports from third-party broker systems, and external APIs. While we strive for maximum accuracy, we make no warranty as to the correctness, completeness, or timeliness of data. <strong>Always verify trade data against official broker statements.</strong></p>
            </div>

            <div className="disclaimer">
              ⚠ By using the Service, the user confirms they have read, understood, and accepted this Risk Disclosure in full. TraderYo does not constitute investment advice. Trading securities involves significant risk. Consult a qualified advisor.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
            <div className="legal-title">תנאי שימוש</div>
            <div className="legal-date">עודכן לאחרונה: ינואר 2025</div>
            <div className="legal-section">
              <h2>1. קבלת התנאים</h2>
              <p>בשימוש בשירות TradeLog ("השירות"), הנך מסכים לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש בשירות.</p>
            </div>
            <div className="legal-section">
              <h2>2. תיאור השירות</h2>
              <p>TradeLog הינו יומן מסחר דיגיטלי המיועד לתיעוד ואנליזה של עסקאות מסחר בשוק ההון. השירות מיועד למטרות תיעוד בלבד.</p>
            </div>
            <div className="legal-section">
              <h2>3. אחריות מוגבלת</h2>
              <p>השירות מסופק "כפי שהוא" (AS IS) ללא אחריות מכל סוג שהוא. החברה אינה אחראית לכל הפסד כספי, ישיר או עקיף, הנובע משימוש בשירות.</p>
              <p>המידע המוצג בשירות אינו ייעוץ השקעות, ייעוץ מס, או המלצה לפעולה כלשהי בשוק ההון.</p>
            </div>
            <div className="legal-section">
              <h2>4. קניין רוחני</h2>
              <p>כל הזכויות בשירות, לרבות עיצוב, קוד, ומותג, שמורות לחברה. הנך רשאי להשתמש בשירות למטרות אישיות בלבד.</p>
            </div>
            <div className="legal-section">
              <h2>5. שינויים לתנאים</h2>
              <p>החברה שומרת לעצמה את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יפורסמו באתר.</p>
            </div>
            <div className="legal-section">
              <h2>6. דין ושיפוט</h2>
              <p>תנאים אלה כפופים לדיני מדינת ישראל. כל סכסוך יידון בבתי המשפט המוסמכים בישראל.</p>
            </div>
            <div className="disclaimer">⚠ המידע המוצג בשירות אינו ייעוץ השקעות. מסחר בניירות ערך כרוך בסיכון אובדן הון. אנא התייעצו עם יועץ פיננסי מוסמך.</div>
          </>
        ) : (
          <>
            <div className="legal-title">Terms of Use</div>
            <div className="legal-date">Last updated: January 2025</div>
            <div className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>By using the TradeLog service ("Service"), you agree to these Terms of Use. If you do not agree, please discontinue use of the Service.</p>
            </div>
            <div className="legal-section">
              <h2>2. Description of Service</h2>
              <p>TradeLog is a digital trading journal designed for recording and analyzing trading activity in financial markets. The Service is intended for documentation purposes only.</p>
            </div>
            <div className="legal-section">
              <h2>3. Limitation of Liability</h2>
              <p>The Service is provided "AS IS" without warranty of any kind. The Company is not responsible for any financial loss, direct or indirect, arising from use of the Service.</p>
              <p>Information displayed in the Service does not constitute investment advice, tax advice, or any recommendation to take action in financial markets.</p>
            </div>
            <div className="legal-section">
              <h2>4. Intellectual Property</h2>
              <p>All rights in the Service, including design, code, and brand, are reserved by the Company. You may use the Service for personal purposes only.</p>
            </div>
            <div className="legal-section">
              <h2>5. Changes to Terms</h2>
              <p>The Company reserves the right to modify these terms at any time. Material changes will be published on the website.</p>
            </div>
            <div className="legal-section">
              <h2>6. Governing Law</h2>
              <p>These terms are governed by the laws of the State of Israel. Any dispute shall be resolved in the competent courts of Israel.</p>
            </div>
            <div className="disclaimer">⚠ Information displayed is not investment advice. Trading involves significant risk of capital loss. Please consult a licensed financial advisor.</div>
          </>
        )}
      </div>
    </div>
  );
}

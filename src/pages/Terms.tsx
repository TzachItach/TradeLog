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
            <div className="legal-date">עודכן לאחרונה: אפריל 2026</div>
            <div className="legal-section">
              <h2>1. פרטי בעל השירות</h2>
              <p>השירות מופעל על ידי: <strong>צח איטח</strong>, ע"מ: <strong>203461470</strong>.</p>
              <p>כתובת: <strong>יהודה הלוי 21</strong>.</p>
              <p>יצירת קשר: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
            </div>
            <div className="legal-section">
              <h2>2. קבלת התנאים</h2>
              <p>בשימוש בשירות TraderYo ("השירות"), הנך מסכים לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש בשירות.</p>
            </div>
            <div className="legal-section">
              <h2>3. תיאור השירות</h2>
              <p>TraderYo הינו יומן מסחר דיגיטלי המיועד לתיעוד ואנליזה של עסקאות מסחר בשוק ההון. השירות מיועד למטרות תיעוד בלבד ואינו מהווה כלי לניהול השקעות.</p>
            </div>
            <div className="legal-section">
              <h2>4. שימוש מותר ואסור</h2>
              <p>הנך רשאי להשתמש בשירות למטרות אישיות ומקצועיות חוקיות בלבד. <strong>אסור</strong>:</p>
              <ul>
                <li>לשתף גישה לחשבונך עם אחרים</li>
                <li>לבצע reverse engineering, פריצה, או ניסיון לגשת לנתוני משתמשים אחרים</li>
                <li>להשתמש בשירות לצרכי הונאה, הלבנת הון, או כל פעילות בלתי חוקית</li>
                <li>להעמיס על השרתים באופן חריג (bot, scraping) ללא אישור בכתב</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>5. אחריות מוגבלת</h2>
              <p>השירות מסופק "כפי שהוא" (AS IS) ללא אחריות מכל סוג שהוא. בעל השירות אינו אחראי לכל הפסד כספי, ישיר או עקיף, הנובע משימוש בשירות.</p>
              <p><strong>המידע המוצג בשירות אינו ייעוץ השקעות, ייעוץ מס, או המלצה לפעולה כלשהי בשוק ההון.</strong></p>
            </div>
            <div className="legal-section">
              <h2>6. קניין רוחני</h2>
              <p>כל הזכויות בשירות, לרבות עיצוב, קוד, ומותג, שמורות לבעל השירות. הנך רשאי להשתמש בשירות למטרות אישיות ומקצועיות בלבד, ואסור לשכפל, להפיץ, או ליצור יצירות נגזרות ללא אישור מפורש בכתב.</p>
            </div>
            <div className="legal-section">
              <h2>7. שינויים לתנאים</h2>
              <p>בעל השירות שומר לעצמו את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יפורסמו באתר לפחות 14 יום מראש. המשך השימוש לאחר השינוי מהווה הסכמה לתנאים החדשים.</p>
            </div>
            <div className="legal-section">
              <h2>8. הפסקת שירות</h2>
              <p>בעל השירות רשאי להשעות או לסיים את גישתך לשירות בכל עת, בפרט במקרה של הפרת תנאים אלה.</p>
            </div>
            <div className="legal-section">
              <h2>9. דין ושיפוט</h2>
              <p>תנאים אלה כפופים לדיני מדינת ישראל. כל סכסוך יידון בבתי המשפט המוסמכים בתל אביב-יפו, ישראל.</p>
            </div>
            <div className="disclaimer">⚠ המידע המוצג בשירות אינו ייעוץ השקעות. מסחר בניירות ערך כרוך בסיכון אובדן הון. אנא התייעצו עם יועץ פיננסי מוסמך.</div>
          </>
        ) : (
          <>
            <div className="legal-title">Terms of Use</div>
            <div className="legal-date">Last updated: April 2026</div>
            <div className="legal-section">
              <h2>1. Service Operator</h2>
              <p>The Service is operated by: <strong>Tzach Itach</strong>, Business ID: <strong>203461470</strong>.</p>
              <p>Address: <strong>Yehuda Halevi 21, Yavne, Israel</strong>.</p>
              <p>Contact: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
            </div>
            <div className="legal-section">
              <h2>2. Acceptance of Terms</h2>
              <p>By using the TraderYo service ("Service"), you agree to these Terms of Use. If you do not agree, please discontinue use of the Service.</p>
            </div>
            <div className="legal-section">
              <h2>3. Description of Service</h2>
              <p>TraderYo is a digital trading journal designed for recording and analyzing trading activity in financial markets. The Service is intended for documentation purposes only and does not constitute an investment management tool.</p>
            </div>
            <div className="legal-section">
              <h2>4. Permitted and Prohibited Use</h2>
              <p>You may use the Service for lawful personal and professional purposes only. The following are <strong>prohibited</strong>:</p>
              <ul>
                <li>Sharing account access with others</li>
                <li>Reverse engineering, hacking, or attempting to access other users' data</li>
                <li>Using the Service for fraud, money laundering, or any illegal activity</li>
                <li>Placing abnormal load on servers (bots, scraping) without written permission</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>5. Limitation of Liability</h2>
              <p>The Service is provided "AS IS" without warranty of any kind. The operator is not responsible for any financial loss, direct or indirect, arising from use of the Service.</p>
              <p><strong>Information displayed in the Service does not constitute investment advice, tax advice, or any recommendation to take action in financial markets.</strong></p>
            </div>
            <div className="legal-section">
              <h2>6. Intellectual Property</h2>
              <p>All rights in the Service, including design, code, and brand, are reserved by the operator. You may use the Service for personal and professional purposes only. Reproduction, distribution, or creation of derivative works without explicit written permission is prohibited.</p>
            </div>
            <div className="legal-section">
              <h2>7. Changes to Terms</h2>
              <p>The operator reserves the right to modify these terms at any time. Material changes will be published on the website at least 14 days in advance. Continued use after the change constitutes acceptance of the new terms.</p>
            </div>
            <div className="legal-section">
              <h2>8. Termination</h2>
              <p>The operator may suspend or terminate your access to the Service at any time, particularly in the event of a breach of these terms.</p>
            </div>
            <div className="legal-section">
              <h2>9. Governing Law</h2>
              <p>These terms are governed by the laws of the State of Israel. Any dispute shall be resolved in the competent courts of Tel Aviv-Jaffa, Israel.</p>
            </div>
            <div className="disclaimer">⚠ Information displayed is not investment advice. Trading involves significant risk of capital loss. Please consult a licensed financial advisor.</div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
            <div className="legal-title">מדיניות פרטיות</div>
            <div className="legal-date">עודכן לאחרונה: אפריל 2026 | בהתאם לחוק הגנת הפרטיות תשמ"א-1981 ותקנות הגנת הפרטיות (אבטחת מידע) תשע"ז-2017</div>
            <div className="legal-section">
              <h2>1. מידע שאנו אוספים</h2>
              <p>אנו אוספים את המידע הבא בעת שימוש בשירות:</p>
              <ul>
                <li>פרטי חשבון: שם, כתובת דוא"ל (דרך Google Sign-In)</li>
                <li>נתוני מסחר: עסקאות, חשבונות, ואסטרטגיות שהזנתם</li>
                <li>נתוני שימוש: לוגים טכניים לצורך תחזוקה ואבטחה</li>
                <li>צילומי מסך: קבצי מדיה שהעלאתם לצורך תיעוד עסקאות</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>2. שימוש במידע</h2>
              <p>אנו משתמשים במידע אך ורק לצורך:</p>
              <ul>
                <li>מתן השירות ושיפורו</li>
                <li>תמיכה טכנית</li>
                <li>שמירת אבטחת החשבון</li>
              </ul>
              <p>אנו לא מוכרים, משכירים, או חולקים את המידע שלך עם צדדים שלישיים לצרכי שיווק.</p>
            </div>
            <div className="legal-section">
              <h2>3. העברת מידע לחו"ל</h2>
              <p>השירות נבנה על גבי ספקי תשתית מחוץ לישראל. המידע שלך מאוחסן ומעובד על ידי:</p>
              <ul>
                <li><strong>Supabase Inc.</strong> (ארה"ב) — מסד הנתונים ואימות זהות. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>מדיניות פרטיות Supabase</a></li>
                <li><strong>Vercel Inc.</strong> (ארה"ב) — אירוח האתר. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>מדיניות פרטיות Vercel</a></li>
                <li><strong>Google LLC</strong> (ארה"ב) — אימות זהות דרך Google OAuth. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>מדיניות פרטיות Google</a></li>
              </ul>
              <p>העברות אלו מתבצעות על בסיס הסכמים עם ספקים אלו הכוללים מחויבויות הגנה מתאימות על מידע אישי.</p>
            </div>
            <div className="legal-section">
              <h2>4. אבטחת מידע</h2>
              <p>נתוני המסחר שלך מוצפנים ומאובטחים. גישה לנתוניך אפשרית רק עבורך, בזכות Row-Level Security (RLS) ברמת מסד הנתונים.</p>
            </div>
            <div className="legal-section">
              <h2>5. שמירת מידע</h2>
              <p>נתוניך נשמרים כל עוד חשבונך פעיל. תוכל לבקש מחיקת כל נתוניך בכל עת על ידי פנייה אלינו.</p>
            </div>
            <div className="legal-section">
              <h2>6. זכויותיך</h2>
              <p>בהתאם לחוק הגנת הפרטיות הישראלי, הנך זכאי ל:</p>
              <ul>
                <li>עיון בנתונים שנשמרו עליך</li>
                <li>תיקון נתונים שגויים</li>
                <li>מחיקת נתוניך ("הזכות להישכח")</li>
                <li>ייצוא נתוניך בפורמט נגיש</li>
              </ul>
              <p>לממש זכויות אלו, פנה אלינו בכתובת המייל המפורטת בסעיף 8.</p>
            </div>
            <div className="legal-section">
              <h2>7. קובצי Cookie</h2>
              <p>אנו משתמשים בקובצי cookie חיוניים בלבד לצורך ניהול ה-session. לא נעשה שימוש ב-cookie לצרכי פרסום.</p>
            </div>
            <div className="legal-section">
              <h2>8. צור קשר</h2>
              <p>לשאלות בנוגע למדיניות הפרטיות, לממש זכויות, או לכל פנייה אחרת:</p>
              <p>מייל: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
            </div>
          </>
        ) : (
          <>
            <div className="legal-title">Privacy Policy</div>
            <div className="legal-date">Last updated: April 2026 | Compliant with Israeli Privacy Protection Law 5741-1981 and Privacy Protection Regulations (Data Security) 5777-2017</div>
            <div className="legal-section">
              <h2>1. Information We Collect</h2>
              <p>We collect the following information when you use the Service:</p>
              <ul>
                <li>Account details: name, email address (via Google Sign-In)</li>
                <li>Trading data: trades, accounts, and strategies you enter</li>
                <li>Usage data: technical logs for maintenance and security</li>
                <li>Screenshots: media files you upload to document trades</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>2. Use of Information</h2>
              <p>We use your information solely for:</p>
              <ul>
                <li>Providing and improving the Service</li>
                <li>Technical support</li>
                <li>Account security</li>
              </ul>
              <p>We do not sell, rent, or share your data with third parties for marketing purposes.</p>
            </div>
            <div className="legal-section">
              <h2>3. International Data Transfers</h2>
              <p>The Service is built on infrastructure operated outside Israel. Your data is stored and processed by:</p>
              <ul>
                <li><strong>Supabase Inc.</strong> (USA) — database and authentication. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>Supabase Privacy Policy</a></li>
                <li><strong>Vercel Inc.</strong> (USA) — website hosting. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>Vercel Privacy Policy</a></li>
                <li><strong>Google LLC</strong> (USA) — identity verification via Google OAuth. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'var(--b)'}}>Google Privacy Policy</a></li>
              </ul>
              <p>These transfers are carried out under agreements with appropriate data protection obligations.</p>
            </div>
            <div className="legal-section">
              <h2>4. Data Security</h2>
              <p>Your trading data is secured and access is restricted exclusively to you via Row-Level Security (RLS) at the database level.</p>
            </div>
            <div className="legal-section">
              <h2>5. Data Retention</h2>
              <p>Your data is retained as long as your account is active. You may request deletion of all your data at any time by contacting us.</p>
            </div>
            <div className="legal-section">
              <h2>6. Your Rights</h2>
              <p>Under Israeli Privacy Protection Law, you are entitled to:</p>
              <ul>
                <li>Access data stored about you</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data ("right to be forgotten")</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p>To exercise these rights, contact us at the email address listed in Section 8.</p>
            </div>
            <div className="legal-section">
              <h2>7. Cookies</h2>
              <p>We use only essential cookies for session management. No advertising cookies are used.</p>
            </div>
            <div className="legal-section">
              <h2>8. Contact</h2>
              <p>For privacy questions, to exercise your rights, or for any other inquiry:</p>
              <p>Email: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

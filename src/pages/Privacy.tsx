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
            <div className="legal-date">עודכן לאחרונה: ינואר 2025 | בהתאם לחוק הגנת הפרטיות תשמ"א-1981</div>
            <div className="legal-section">
              <h2>1. מידע שאנו אוספים</h2>
              <p>אנו אוספים את המידע הבא בעת שימוש בשירות:</p>
              <ul>
                <li>פרטי חשבון: שם, כתובת דוא"ל (דרך Google/Apple Sign-In)</li>
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
              <h2>3. אבטחת מידע</h2>
              <p>נתוני המסחר שלך מוצפנים ומאובטחים באמצעות הצפנת AES-256. גישה לנתוניך אפשרית רק עבורך, בזכות Row-Level Security (RLS) ברמת מסד הנתונים.</p>
            </div>
            <div className="legal-section">
              <h2>4. שמירת מידע</h2>
              <p>נתוניך נשמרים כל עוד חשבונך פעיל. תוכל לבקש מחיקת כל נתוניך בכל עת על ידי פנייה אלינו.</p>
            </div>
            <div className="legal-section">
              <h2>5. זכויותיך</h2>
              <p>בהתאם לחוק הגנת הפרטיות הישראלי, הנך זכאי ל:</p>
              <ul>
                <li>עיון בנתונים שנשמרו עליך</li>
                <li>תיקון נתונים שגויים</li>
                <li>מחיקת נתוניך ("הזכות להישכח")</li>
                <li>ייצוא נתוניך בפורמט נגיש</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>6. קובצי Cookie</h2>
              <p>אנו משתמשים בקובצי cookie חיוניים בלבד לצורך ניהול ה-session. לא נעשה שימוש ב-cookie לצרכי פרסום.</p>
            </div>
            <div className="legal-section">
              <h2>7. צור קשר</h2>
              <p>לשאלות בנוגע למדיניות הפרטיות: privacy@tradelog.app</p>
            </div>
          </>
        ) : (
          <>
            <div className="legal-title">Privacy Policy</div>
            <div className="legal-date">Last updated: January 2025 | Compliant with Israeli Privacy Protection Law 5741-1981</div>
            <div className="legal-section">
              <h2>1. Information We Collect</h2>
              <p>We collect the following information when you use the Service:</p>
              <ul>
                <li>Account details: name, email address (via Google/Apple Sign-In)</li>
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
              <h2>3. Data Security</h2>
              <p>Your trading data is encrypted and secured using AES-256 encryption. Access to your data is restricted exclusively to you via Row-Level Security (RLS) at the database level.</p>
            </div>
            <div className="legal-section">
              <h2>4. Data Retention</h2>
              <p>Your data is retained as long as your account is active. You may request deletion of all your data at any time by contacting us.</p>
            </div>
            <div className="legal-section">
              <h2>5. Your Rights</h2>
              <p>Under Israeli Privacy Protection Law, you are entitled to:</p>
              <ul>
                <li>Access data stored about you</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data ("right to be forgotten")</li>
                <li>Export your data in a portable format</li>
              </ul>
            </div>
            <div className="legal-section">
              <h2>6. Cookies</h2>
              <p>We use only essential cookies for session management. No advertising cookies are used.</p>
            </div>
            <div className="legal-section">
              <h2>7. Contact</h2>
              <p>For privacy questions: privacy@tradelog.app</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

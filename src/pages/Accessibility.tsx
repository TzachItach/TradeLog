import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Accessibility() {
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
            <div className="legal-title">הצהרת נגישות</div>
            <div className="legal-date">עודכן לאחרונה: אפריל 2026 | בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע"ג-2013</div>

            <div className="legal-section">
              <h2>1. מחויבות לנגישות</h2>
              <p>TradeLog מחויב להנגשת השירות לכלל המשתמשים, לרבות אנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ"ח-1998, ותקנות הנגישות.</p>
            </div>

            <div className="legal-section">
              <h2>2. רמת הנגישות</h2>
              <p>אנו שואפים לעמוד בדרישות תקן WCAG 2.1 ברמה AA. בשירות קיימים הכלים הבאים לשיפור הנגישות:</p>
              <ul>
                <li><strong>שינוי גודל טקסט</strong> — ניתן להגדיל ולהקטין את הגופן ישירות בממשק</li>
                <li><strong>ניגודיות גבוהה</strong> — מצב ניגודיות מוגברת לשיפור קריאות</li>
                <li><strong>גווני אפור</strong> — מצב grayscale למשתמשים עם לקויות צבע</li>
                <li><strong>גופן קריא</strong> — מעבר לגופן מותאם לדיסלקציה</li>
                <li><strong>מצב כהה/בהיר</strong> — בחירה חופשית בין ערכות צבע</li>
                <li><strong>תמיכה ב-RTL</strong> — ממשק מלא בעברית מימין לשמאל</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. מה אינו נגיש עדיין</h2>
              <p>אנו עובדים על שיפור הנגישות באופן מתמשך. הסעיפים הבאים עשויים להיות בעלי נגישות חלקית:</p>
              <ul>
                <li>גרפים אנליטיים (Canvas) — כרגע אינם נגישים לקוראי מסך. אנו עובדים על הוספת תיאורים חלופיים (aria-label)</li>
                <li>חלק מהאייקונים — ייתכן שחסר תיאור טקסטואלי לכל האייקונים</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. פנייה בנושאי נגישות</h2>
              <p>נתקלת בבעיית נגישות? אנחנו רוצים לדעת ולתקן. פנה אלינו:</p>
              <p>מייל: <a href="mailto:support@tradelog.app" style={{color:'var(--b)'}}>support@tradelog.app</a></p>
              <p>נשתדל לחזור תוך 5 ימי עסקים.</p>
            </div>

            <div className="legal-section">
              <h2>5. רכז נגישות</h2>
              <p>רכז הנגישות של השירות אחראי לטיפול בפניות ולשיפור מתמשך של הנגישות. לפנייה: <a href="mailto:support@tradelog.app" style={{color:'var(--b)'}}>support@tradelog.app</a></p>
            </div>
          </>
        ) : (
          <>
            <div className="legal-title">Accessibility Statement</div>
            <div className="legal-date">Last updated: April 2026 | Pursuant to Israeli Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013</div>

            <div className="legal-section">
              <h2>1. Our Commitment</h2>
              <p>TradeLog is committed to making its Service accessible to all users, including people with disabilities, in accordance with the Israeli Equal Rights for Persons with Disabilities Law, 5758-1998, and the Accessibility Regulations.</p>
            </div>

            <div className="legal-section">
              <h2>2. Accessibility Level</h2>
              <p>We strive to meet WCAG 2.1 Level AA requirements. The following accessibility tools are available directly in the interface:</p>
              <ul>
                <li><strong>Text size adjustment</strong> — increase or decrease font size within the app</li>
                <li><strong>High contrast mode</strong> — enhanced contrast for improved readability</li>
                <li><strong>Grayscale mode</strong> — for users with color vision deficiencies</li>
                <li><strong>Readable font</strong> — switch to a dyslexia-friendly typeface</li>
                <li><strong>Dark / light mode</strong> — freely choose your color scheme</li>
                <li><strong>RTL support</strong> — full Hebrew right-to-left interface</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. Known Limitations</h2>
              <p>We continuously work to improve accessibility. The following areas may have partial accessibility:</p>
              <ul>
                <li>Analytics charts (Canvas) — currently not fully accessible to screen readers. We are working on adding alternative text descriptions (aria-label)</li>
                <li>Some icons — textual descriptions may be missing for certain icons</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. Accessibility Feedback</h2>
              <p>Encountered an accessibility issue? We want to know and fix it. Contact us:</p>
              <p>Email: <a href="mailto:support@tradelog.app" style={{color:'var(--b)'}}>support@tradelog.app</a></p>
              <p>We aim to respond within 5 business days.</p>
            </div>

            <div className="legal-section">
              <h2>5. Accessibility Coordinator</h2>
              <p>Our accessibility coordinator is responsible for handling inquiries and continuously improving accessibility. Contact: <a href="mailto:support@tradelog.app" style={{color:'var(--b)'}}>support@tradelog.app</a></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

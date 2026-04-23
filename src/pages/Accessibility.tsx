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
              <p>אנו שואפים לעמוד בדרישות תקן WCAG 2.1 ברמה AA. האתר משתמש בתוסף הנגישות של <strong>Negishot</strong> (<a href="https://negishot.co.il" style={{color:'var(--b)'}}>negishot.co.il</a>), המספק מגוון כלים לשיפור הנגישות:</p>
              <ul>
                <li><strong>הגדלת טקסט</strong> — הגדלת גודל הגופן לשיפור קריאות</li>
                <li><strong>ניגודיות גבוהה</strong> — מצב ניגודיות מוגברת למשתמשים עם לקויות ראייה</li>
                <li><strong>ניווט מקלדת</strong> — גלישה מלאה באתר באמצעות מקלדת בלבד</li>
                <li><strong>הקראת טקסט</strong> — האזנה לתוכן הדף (Text-to-Speech)</li>
                <li><strong>התאמת צבעים</strong> — שינוי ערכת הצבעים בהתאם להעדפת המשתמש</li>
                <li><strong>התאמת גדלים</strong> — שינוי גודל אלמנטים מעבר לטקסט בלבד</li>
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
              <p>מייל: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
              <p>נשתדל לחזור תוך 5 ימי עסקים.</p>
            </div>

            <div className="legal-section">
              <h2>5. רכז נגישות</h2>
              <p>רכז הנגישות: <strong>צח איטח</strong></p>
              <p>לפנייה: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
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
              <p>We strive to meet WCAG 2.1 Level AA requirements. The site uses the <strong>Negishot</strong> accessibility plugin (<a href="https://negishot.co.il" style={{color:'var(--b)'}}>negishot.co.il</a>), providing the following tools:</p>
              <ul>
                <li><strong>Text enlargement</strong> — increase font size for improved readability</li>
                <li><strong>High contrast mode</strong> — enhanced visual distinction for low vision users</li>
                <li><strong>Keyboard navigation</strong> — full site navigation via keyboard controls</li>
                <li><strong>Text-to-speech</strong> — audio readout of page content</li>
                <li><strong>Color customization</strong> — adjust color schemes per user preferences</li>
                <li><strong>Size adjustment</strong> — customizable element sizing beyond text</li>
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
              <p>Email: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
              <p>We aim to respond within 5 business days.</p>
            </div>

            <div className="legal-section">
              <h2>5. Accessibility Coordinator</h2>
              <p>Accessibility Coordinator: <strong>Tzach Itach</strong></p>
              <p>Contact: <a href="mailto:tradelogisr@gmail.com" style={{color:'var(--b)'}}>tradelogisr@gmail.com</a></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

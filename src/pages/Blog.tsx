import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import './blog.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Blog() {
  return (
    <div className="bl-page">
      <header className="bl-nav">
        <div className="bl-nav-inner">
          <a href="/" className="bl-nav-logo">
            <img src="/logo.png?v=2" alt="TraderYo" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6, mixBlendMode: 'screen' }} />
            TraderYo
          </a>
          <span className="bl-nav-sep">/</span>
          <span className="bl-nav-title">Blog</span>
          <a href="/" className="bl-nav-back">
            ← Back to site
          </a>
        </div>
      </header>

      <main>
        <div className="bl-hero">
          <div className="bl-hero-label">Blog</div>
          <h1>Guides & insights for futures traders</h1>
          <p>Practical articles on prop firm tracking, trade analytics, and building a profitable trading business.</p>
        </div>

        <div className="bl-list">
          {blogPosts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="bl-card">
              <div className="bl-card-meta">
                <span className={`bl-badge ${post.category}`}>{post.categoryLabel}</span>
                <span className="bl-meta-dot">·</span>
                <span className="bl-meta-info">{post.readTime} min read</span>
                <span className="bl-meta-dot">·</span>
                <span className="bl-meta-info">{formatDate(post.date)}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="bl-card-cta">Read article →</div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="bl-footer">
        © {new Date().getFullYear()} TraderYo. All rights reserved. ·{' '}
        <a href="/terms" style={{ color: 'inherit' }}>Terms</a> ·{' '}
        <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>
      </footer>
    </div>
  );
}

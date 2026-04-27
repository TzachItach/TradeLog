import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { blogPosts, Block } from '../data/blogPosts';
import './blog.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const calloutIcon: Record<string, string> = { tip: '💡', warning: '⚠️', info: 'ℹ️' };

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'p':   return <p key={i}>{block.text}</p>;
    case 'h2':  return <h2 key={i}>{block.text}</h2>;
    case 'h3':  return <h3 key={i}>{block.text}</h3>;
    case 'hr':  return <hr key={i} />;
    case 'ul':  return <ul key={i}>{block.items!.map((t, j) => <li key={j}>{t}</li>)}</ul>;
    case 'ol':  return <ol key={i}>{block.items!.map((t, j) => <li key={j}>{t}</li>)}</ol>;
    case 'callout':
      return (
        <div key={i} className={`bl-callout ${block.kind}`}>
          <span className="bl-callout-icon">{calloutIcon[block.kind!]}</span>
          <span>{block.text}</span>
        </div>
      );
    case 'cta':
      return (
        <div key={i} className="bl-cta-block">
          <p>{block.text}</p>
          <button
            className="bl-cta-btn"
            onClick={() => window.open('https://whop.com/checkout/plan_prXodSeim1jYH/', '_blank')}
          >
            {block.btn}
          </button>
        </div>
      );
    default: return null;
  }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | TraderYo Blog`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', post.description);
    }
    return () => {
      document.title = 'TraderYo — Futures Trading Journal with Auto-Import | Prop Firm Tracker';
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="bl-page">
      <header className="bl-nav">
        <div className="bl-nav-inner">
          <a href="/" className="bl-nav-logo">
            <img src="/logo.png?v=2" alt="TraderYo" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6, mixBlendMode: 'screen' }} />
            TraderYo
          </a>
          <span className="bl-nav-sep">/</span>
          <Link to="/blog" className="bl-nav-title" style={{ textDecoration: 'none' }}>Blog</Link>
          <a href="https://whop.com/checkout/plan_prXodSeim1jYH/" target="_blank" rel="noreferrer" className="bl-nav-back" style={{ color: '#1DB954' }}>
            Start Free Trial →
          </a>
        </div>
      </header>

      <article className="bl-article">
        <Link to="/blog" className="bl-back-link">← All articles</Link>

        <header className="bl-article-header">
          <span className={`bl-badge ${post.category}`}>{post.categoryLabel}</span>
          <h1>{post.title}</h1>
          <p className="bl-article-desc">{post.description}</p>
          <div className="bl-article-meta">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </header>

        <div className="bl-body">
          {post.content.map((block, i) => renderBlock(block, i))}
        </div>
      </article>

      <footer className="bl-footer">
        © {new Date().getFullYear()} TraderYo. All rights reserved. ·{' '}
        <a href="/terms" style={{ color: 'inherit' }}>Terms</a> ·{' '}
        <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>
      </footer>
    </div>
  );
}

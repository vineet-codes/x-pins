import { useState, useEffect } from 'react'
import './Digest.css'

// Icons
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const ArticleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function getAvatarUrl(username) {
  return `https://unavatar.io/twitter/${username}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${username}`
}

// Highlight Hero Component
function HighlightHero({ bookmark }) {
  if (!bookmark) return null
  
  const { author, title, quote, what, links } = bookmark
  
  return (
    <section className="digest-highlight">
      <div className="digest-highlight-label">Highlight of the Week</div>
      <div className="digest-highlight-content">
        <div className="digest-highlight-author">
          <img 
            src={getAvatarUrl(author)} 
            alt={author}
            className="digest-highlight-avatar"
          />
          <span className="digest-highlight-username">@{author}</span>
        </div>
        
        {title && <h2 className="digest-highlight-title">{title}</h2>}
        
        {quote && (
          <blockquote className="digest-highlight-quote">
            "{quote}"
          </blockquote>
        )}
        
        {what && (
          <p className="digest-highlight-what">{what}</p>
        )}
        
        <div className="digest-highlight-links">
          {links?.tweet && (
            <a href={links.tweet} target="_blank" rel="noopener noreferrer" className="digest-link">
              View Tweet <ExternalIcon />
            </a>
          )}
          {links?.link && (
            <a href={links.link} target="_blank" rel="noopener noreferrer" className="digest-link digest-link-primary">
              Visit Link <ExternalIcon />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

// Tool Card Component
function ToolCard({ bookmark }) {
  const { author, title, what, links } = bookmark
  
  return (
    <article className="digest-tool-card">
      <div className="digest-tool-icon">
        <GithubIcon />
      </div>
      <div className="digest-tool-content">
        <h4 className="digest-tool-title">{title || 'Untitled Tool'}</h4>
        <span className="digest-tool-author">via @{author}</span>
        {what && <p className="digest-tool-desc">{what}</p>}
        {links?.link && (
          <a href={links.link} target="_blank" rel="noopener noreferrer" className="digest-tool-link">
            View Repo <ExternalIcon />
          </a>
        )}
      </div>
    </article>
  )
}

// Article Card Component  
function ArticleCard({ bookmark }) {
  const { author, title, quote, what, links } = bookmark
  
  return (
    <article className="digest-article-card">
      <div className="digest-article-header">
        <ArticleIcon />
        <span className="digest-article-author">@{author}</span>
      </div>
      <h4 className="digest-article-title">{title || 'Untitled Article'}</h4>
      {quote && (
        <blockquote className="digest-article-quote">"{quote}"</blockquote>
      )}
      {what && <p className="digest-article-desc">{what}</p>}
      <div className="digest-article-footer">
        {links?.link && (
          <a href={links.link} target="_blank" rel="noopener noreferrer" className="digest-link">
            Read Article <ExternalIcon />
          </a>
        )}
        {links?.tweet && (
          <a href={links.tweet} target="_blank" rel="noopener noreferrer" className="digest-link-subtle">
            Source Tweet
          </a>
        )}
      </div>
    </article>
  )
}

// Quick Take Component
function QuickTake({ bookmark }) {
  const { author, quote, what, links } = bookmark
  
  return (
    <div className="digest-quick-take">
      <img 
        src={getAvatarUrl(author)} 
        alt={author}
        className="digest-quick-avatar"
      />
      <div className="digest-quick-content">
        <span className="digest-quick-author">@{author}</span>
        <p className="digest-quick-text">{quote || what}</p>
        {links?.tweet && (
          <a href={links.tweet} target="_blank" rel="noopener noreferrer" className="digest-link-subtle">
            View →
          </a>
        )}
      </div>
    </div>
  )
}

export default function Digest() {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDigest() {
      try {
        const res = await fetch('/api/digest?days=7')
        const data = await res.json()
        setDigest(data)
      } catch (error) {
        console.error('Failed to load digest:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDigest()
  }, [])

  if (loading) {
    return (
      <div className="digest-page">
        <div className="digest-loading">
          <div className="spinner" />
          <p>Preparing your weekly digest...</p>
        </div>
      </div>
    )
  }

  if (!digest || digest.stats.total === 0) {
    return (
      <div className="digest-page">
        <div className="digest-masthead">
          <h1 className="digest-title">The Weekly Hoard</h1>
          <p className="digest-subtitle">Your week in discoveries</p>
        </div>
        <div className="digest-empty">
          <div className="digest-empty-icon">📭</div>
          <p>No bookmarks from the past week.</p>
          <p className="digest-empty-hint">Start collecting treasures to see your weekly digest!</p>
        </div>
      </div>
    )
  }

  // Filter out highlight from other sections to avoid duplication
  const highlightId = digest.highlight ? `${digest.highlight.author}-${digest.highlight.title}` : null
  const tools = digest.tools.filter(t => `${t.author}-${t.title}` !== highlightId)
  const articles = digest.articles.filter(a => `${a.author}-${a.title}` !== highlightId)
  const tweets = digest.tweets.filter(t => `${t.author}-${t.title}` !== highlightId)

  return (
    <div className="digest-page">
      {/* Masthead */}
      <header className="digest-masthead">
        <div className="digest-masthead-content">
          <p className="digest-date-range">{digest.dateRange.start} — {digest.dateRange.end}</p>
          <h1 className="digest-title">The Weekly Hoard</h1>
          <p className="digest-subtitle">Your week in discoveries</p>
        </div>
        <div className="digest-masthead-decoration" />
      </header>

      {/* Highlight */}
      <HighlightHero bookmark={digest.highlight} />

      {/* Divider */}
      <hr className="digest-divider" />

      {/* Tools Section */}
      {tools.length > 0 && (
        <section className="digest-section">
          <div className="digest-section-header">
            <GithubIcon />
            <h3>Tools Discovered</h3>
            <span className="digest-section-count">{tools.length}</span>
          </div>
          <div className="digest-tools-grid">
            {tools.map((tool, index) => (
              <ToolCard key={`${tool.author}-${index}`} bookmark={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="digest-section">
          <div className="digest-section-header">
            <ArticleIcon />
            <h3>Articles & Insights</h3>
            <span className="digest-section-count">{articles.length}</span>
          </div>
          <div className="digest-articles-list">
            {articles.map((article, index) => (
              <ArticleCard key={`${article.author}-${index}`} bookmark={article} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Takes Section */}
      {tweets.length > 0 && (
        <section className="digest-section">
          <div className="digest-section-header">
            <TwitterIcon />
            <h3>Quick Takes</h3>
            <span className="digest-section-count">{tweets.length}</span>
          </div>
          <div className="digest-quick-takes">
            {tweets.map((tweet, index) => (
              <QuickTake key={`${tweet.author}-${index}`} bookmark={tweet} />
            ))}
          </div>
        </section>
      )}

      {/* Footer Stats */}
      <footer className="digest-footer">
        <div className="digest-footer-line" />
        <div className="digest-stats">
          <span className="digest-stat-total">{digest.stats.total} treasures collected</span>
          <span className="digest-stat-separator">•</span>
          {digest.stats.tools > 0 && (
            <>
              <span>{digest.stats.tools} tools</span>
              <span className="digest-stat-separator">•</span>
            </>
          )}
          {digest.stats.articles > 0 && (
            <>
              <span>{digest.stats.articles} articles</span>
              <span className="digest-stat-separator">•</span>
            </>
          )}
          {digest.stats.tweets > 0 && (
            <span>{digest.stats.tweets} tweets</span>
          )}
        </div>
        <p className="digest-footer-tagline">Curated by Pins 📌</p>
      </footer>
    </div>
  )
}


import { useState, useEffect } from 'react'
import './Knowledge.css'

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
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function KnowledgeCard({ item, type }) {
  const isGithub = type === 'tool'
  
  return (
    <article className="knowledge-card">
      <div className="knowledge-card-header">
        <div className={`knowledge-card-icon ${isGithub ? 'knowledge-card-icon-github' : 'knowledge-card-icon-article'}`}>
          {isGithub ? <GithubIcon /> : <ArticleIcon />}
        </div>
        <div className="knowledge-card-meta">
          <h3 className="knowledge-card-title">{item.title}</h3>
          {item.dateAdded && (
            <span className="knowledge-card-date">Added {item.dateAdded}</span>
          )}
        </div>
      </div>

      {item.excerpt && (
        <p className="knowledge-card-excerpt line-clamp-2">{item.excerpt}</p>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="knowledge-card-tags">
          {item.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="knowledge-card-tag">{tag}</span>
          ))}
          {item.tags.length > 4 && (
            <span className="knowledge-card-tag-more">+{item.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="knowledge-card-footer">
        {item.via && (
          <span className="knowledge-card-via truncate">{item.via}</span>
        )}
        {item.source && (
          <a 
            href={item.source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="knowledge-card-link"
          >
            View Source <ExternalIcon />
          </a>
        )}
      </div>
    </article>
  )
}

export default function Knowledge() {
  const [knowledge, setKnowledge] = useState({ tools: [], articles: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tools')

  useEffect(() => {
    async function loadKnowledge() {
      try {
        const res = await fetch('/api/knowledge')
        const data = await res.json()
        setKnowledge(data)
      } catch (error) {
        console.error('Failed to load knowledge:', error)
      } finally {
        setLoading(false)
      }
    }

    loadKnowledge()
  }, [])

  const items = activeTab === 'tools' ? knowledge.tools : knowledge.articles
  const counts = {
    tools: knowledge.tools.length,
    articles: knowledge.articles.length,
  }

  return (
    <div className="knowledge-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Knowledge Base</h1>
          <p>Your curated collection of tools and articles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="knowledge-tabs">
        <button
          className={`knowledge-tab ${activeTab === 'tools' ? 'knowledge-tab-active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <GithubIcon />
          Tools
          <span className="knowledge-tab-count">{counts.tools}</span>
        </button>
        <button
          className={`knowledge-tab ${activeTab === 'articles' ? 'knowledge-tab-active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <ArticleIcon />
          Articles
          <span className="knowledge-tab-count">{counts.articles}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="knowledge-loading">
          <div className="spinner" />
          <p>Loading knowledge base...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {activeTab === 'tools' ? '🛠️' : '📄'}
          </div>
          <p>
            No {activeTab} yet. Bookmark some {activeTab === 'tools' ? 'GitHub repos' : 'articles'} to grow your knowledge base!
          </p>
        </div>
      ) : (
        <div className="knowledge-grid">
          {items.map((item, index) => (
            <KnowledgeCard 
              key={item.slug || index} 
              item={item} 
              type={activeTab === 'tools' ? 'tool' : 'article'}
            />
          ))}
        </div>
      )}
    </div>
  )
}


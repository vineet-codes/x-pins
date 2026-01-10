import './StatCard.css'

const iconMap = {
  bookmark: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  github: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  ),
  article: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  pending: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

const colorMap = {
  amber: {
    bg: 'rgba(217, 119, 6, 0.15)',
    text: 'var(--color-accent)',
  },
  teal: {
    bg: 'rgba(20, 184, 166, 0.15)',
    text: '#14B8A6',
  },
  violet: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#8B5CF6',
  },
  emerald: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#10B981',
  },
}

export default function StatCard({ 
  label, 
  value, 
  icon = 'bookmark', 
  color = 'amber',
  loading = false 
}) {
  const iconElement = iconMap[icon] || iconMap.bookmark
  const colors = colorMap[color] || colorMap.amber

  return (
    <div className="stat-card">
      <div 
        className="stat-card-icon"
        style={{ 
          background: colors.bg,
          color: colors.text 
        }}
      >
        {iconElement}
      </div>
      <div className="stat-card-content">
        {loading ? (
          <div className="stat-card-value">
            <span className="spinner" />
          </div>
        ) : (
          <div className="stat-card-value">{value}</div>
        )}
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  )
}


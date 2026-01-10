import './CategoryBreakdown.css'

const categoryColors = {
  GitHub: '#14B8A6',
  Article: '#8B5CF6',
  Uncategorized: '#525252',
}

export default function CategoryBreakdown({ categories = [], loading = false }) {
  const total = categories.reduce((sum, cat) => sum + cat.count, 0)

  if (loading) {
    return (
      <div className="category-breakdown">
        <h3 className="category-breakdown-title">Category Breakdown</h3>
        <div className="category-breakdown-loading">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="category-breakdown">
        <h3 className="category-breakdown-title">Category Breakdown</h3>
        <p className="category-breakdown-empty">No bookmarks yet</p>
      </div>
    )
  }

  return (
    <div className="category-breakdown">
      <h3 className="category-breakdown-title">Category Breakdown</h3>
      <div className="category-breakdown-list">
        {categories.map(({ name, count }) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          const color = categoryColors[name] || categoryColors.Uncategorized

          return (
            <div key={name} className="category-item">
              <div className="category-item-header">
                <span className="category-item-name">{name}</span>
                <span className="category-item-count">{count}</span>
              </div>
              <div className="category-item-bar-bg">
                <div 
                  className="category-item-bar"
                  style={{ 
                    width: `${percentage}%`,
                    background: color 
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


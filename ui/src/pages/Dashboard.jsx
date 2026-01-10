import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StatCard, BookmarkCard, ActivityItem, CategoryBreakdown } from '../components'
import './Dashboard.css'

// Icons
const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const ProcessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [activity, setActivity] = useState([])
  const [pending, setPending] = useState({ count: 0, bookmarks: [] })
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, categoriesRes, activityRes, pendingRes, bookmarksRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/categories'),
        fetch('/api/activity'),
        fetch('/api/pending'),
        fetch('/api/bookmarks?limit=4'),
      ])

      const [statsData, categoriesData, activityData, pendingData, bookmarksData] = await Promise.all([
        statsRes.json(),
        categoriesRes.json(),
        activityRes.json(),
        pendingRes.json(),
        bookmarksRes.json(),
      ])

      setStats(statsData)
      setCategories(categoriesData)
      setActivity(activityData)
      setPending(pendingData)
      setBookmarks(bookmarksData.bookmarks || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFetch() {
    setFetching(true)
    try {
      const res = await fetch('/api/fetch', { method: 'POST' })
      const data = await res.json()
      if (data.count > 0) {
        // Reload data after fetch
        await loadData()
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setFetching(false)
    }
  }

  async function handleProcess() {
    setProcessing(true)
    try {
      await fetch('/api/process', { method: 'POST' })
      // Reload data after processing
      await loadData()
    } catch (error) {
      console.error('Failed to process:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Your Hoard</h1>
          <p>Welcome back to your treasure trove</p>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleProcess}
            disabled={processing || pending.count === 0}
          >
            {processing ? (
              <span className="spinner" />
            ) : (
              <ProcessIcon />
            )}
            Process ({pending.count})
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleFetch}
            disabled={fetching}
          >
            {fetching ? (
              <span className="spinner" />
            ) : (
              <RefreshIcon />
            )}
            Fetch New
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        <StatCard
          label="Total Bookmarks"
          value={stats?.totalBookmarks ?? '-'}
          icon="bookmark"
          color="amber"
          loading={loading}
        />
        <StatCard
          label="This Week"
          value={stats?.thisWeek ?? '-'}
          icon="clock"
          color="teal"
          loading={loading}
        />
        <StatCard
          label="GitHub Repos"
          value={stats?.githubRepos ?? '-'}
          icon="github"
          color="violet"
          loading={loading}
        />
        <StatCard
          label="Articles"
          value={stats?.articles ?? '-'}
          icon="article"
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Middle Section: Categories + Activity */}
      <div className="dashboard-middle">
        <CategoryBreakdown 
          categories={categories} 
          loading={loading}
        />
        
        <div className="dashboard-activity">
          <h3 className="dashboard-section-title">Recent Activity</h3>
          {loading ? (
            <div className="dashboard-activity-loading">
              <div className="spinner" />
            </div>
          ) : activity.length === 0 ? (
            <p className="dashboard-activity-empty">No recent activity</p>
          ) : (
            <div className="dashboard-activity-list">
              {activity.slice(0, 5).map((item, index) => (
                <ActivityItem key={index} activity={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookmarks */}
      <div className="dashboard-recent">
        <div className="dashboard-recent-header">
          <h3 className="dashboard-section-title">Recent Bookmarks</h3>
          <Link to="/bookmarks" className="dashboard-view-all">
            View All →
          </Link>
        </div>
        
        {loading ? (
          <div className="dashboard-recent-loading">
            <div className="spinner" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🐉</div>
            <p>No bookmarks yet. Click "Fetch New" to start hoarding!</p>
          </div>
        ) : (
          <div className="dashboard-recent-grid">
            {bookmarks.map((bookmark, index) => (
              <BookmarkCard key={index} bookmark={bookmark} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


import { useState, useEffect, useCallback, useRef } from 'react'
import { BookmarkCard } from '../components'
import './Bookmarks.css'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  
  const searchTimeoutRef = useRef(null)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  // Load categories for filter
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error)
  }, [])

  // Load bookmarks
  const loadBookmarks = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
      })
      if (search) params.set('search', search)
      if (category) params.set('category', category)

      const res = await fetch(`/api/bookmarks?${params}`)
      const data = await res.json()

      if (append) {
        setBookmarks(prev => [...prev, ...data.bookmarks])
      } else {
        setBookmarks(data.bookmarks)
      }

      setTotal(data.total)
      setHasMore(pageNum < data.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, category])

  // Initial load and reload on filter changes
  useEffect(() => {
    loadBookmarks(1, false)
  }, [search, category])

  // Debounced search
  function handleSearchChange(e) {
    const value = e.target.value
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadBookmarks(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadingMore, page, loadBookmarks])

  return (
    <div className="bookmarks-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Bookmarks</h1>
          <p>{total} treasures in your hoard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bookmarks-filters">
        <div className="input-group bookmarks-search">
          <span className="input-group-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search bookmarks..."
            onChange={handleSearchChange}
          />
        </div>

        <div className="bookmarks-filter-group">
          <FilterIcon />
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="bookmarks-category-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookmarks List */}
      {loading ? (
        <div className="bookmarks-loading">
          <div className="spinner" />
          <p>Loading bookmarks...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p>
            {search || category 
              ? 'No bookmarks match your filters' 
              : 'No bookmarks yet. Start hoarding!'}
          </p>
        </div>
      ) : (
        <>
          <div className="bookmarks-grid">
            {bookmarks.map((bookmark, index) => (
              <BookmarkCard key={`${bookmark.author}-${index}`} bookmark={bookmark} />
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="bookmarks-load-more">
            {loadingMore && (
              <div className="bookmarks-loading-more">
                <div className="spinner" />
              </div>
            )}
            {!hasMore && bookmarks.length > 0 && (
              <p className="bookmarks-end">That's all your treasures!</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}


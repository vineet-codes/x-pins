import { useState, useEffect } from 'react'
import './Videos.css'

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getAvatarUrl(username) {
  return `https://unavatar.io/twitter/${username}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${username}`
}

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  
  useEffect(() => {
    loadVideos()
  }, [])
  
  async function loadVideos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/videos?${params}`)
      const data = await res.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadVideos()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])
  
  function handleVideoClick(video) {
    setSelectedVideo(video)
  }
  
  function closeModal() {
    setSelectedVideo(null)
  }
  
  // Close modal on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="videos-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Videos</h1>
          <p>{videos.length} videos in your collection</p>
        </div>
      </div>

      {/* Search */}
      <div className="videos-filters">
        <div className="input-group videos-search">
          <span className="input-group-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="videos-loading">
          <div className="spinner" />
          <p>Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <VideoIcon />
          </div>
          <p>
            {search 
              ? 'No videos match your search' 
              : 'No videos downloaded yet. Videos from Twitter/X bookmarks will appear here.'}
          </p>
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map(video => (
            <div 
              key={video.bookmarkId} 
              className="video-card"
              onClick={() => handleVideoClick(video)}
            >
              <div className="video-card-thumbnail">
                {video.hasThumbnail ? (
                  <img 
                    src={`/videos/${video.bookmarkId}.jpg`}
                    alt={`Video by @${video.author}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="video-card-placeholder">
                    <VideoIcon />
                  </div>
                )}
                <div className="video-card-overlay">
                  <PlayIcon />
                </div>
                {video.duration && (
                  <span className="video-card-duration">{video.duration}</span>
                )}
              </div>
              <div className="video-card-info">
                <div className="video-card-author">
                  <img 
                    src={getAvatarUrl(video.author)} 
                    alt={video.author}
                    className="video-card-avatar"
                    loading="lazy"
                  />
                  <span>@{video.author}</span>
                </div>
                <div className="video-card-meta">
                  <span>{formatFileSize(video.fileSize)}</span>
                  <span className="video-card-meta-separator">•</span>
                  <span>{formatDate(video.downloadedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="video-modal-backdrop" onClick={closeModal}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeModal}>
              <CloseIcon />
            </button>
            <div className="video-modal-content">
              <video 
                controls 
                autoPlay
                className="video-modal-player"
                src={`/videos/${selectedVideo.filename}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="video-modal-info">
              <div className="video-modal-author">
                <img 
                  src={getAvatarUrl(selectedVideo.author)} 
                  alt={selectedVideo.author}
                  className="video-modal-avatar"
                />
                <div>
                  <span className="video-modal-name">{selectedVideo.authorName || selectedVideo.author}</span>
                  <span className="video-modal-username">@{selectedVideo.author}</span>
                </div>
              </div>
              <div className="video-modal-meta">
                <span>{formatFileSize(selectedVideo.fileSize)}</span>
                {selectedVideo.duration && (
                  <>
                    <span className="video-card-meta-separator">•</span>
                    <span>{selectedVideo.duration}</span>
                  </>
                )}
                <span className="video-card-meta-separator">•</span>
                <span>{formatDate(selectedVideo.downloadedAt)}</span>
              </div>
              <a 
                href={selectedVideo.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="video-modal-link"
              >
                View original tweet →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


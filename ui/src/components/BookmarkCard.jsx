import { useState } from 'react'
import VideoPlayer from './VideoPlayer'
import './BookmarkCard.css'

const categoryColors = {
  GitHub: {
    bg: 'rgba(20, 184, 166, 0.15)',
    text: '#14B8A6',
  },
  Article: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#8B5CF6',
  },
  Uncategorized: {
    bg: 'var(--color-surface)',
    text: 'var(--color-text-tertiary)',
  },
}

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

function getAvatarUrl(username) {
  // Use unavatar.io for Twitter avatars
  return `https://unavatar.io/twitter/${username}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${username}`
}

export default function BookmarkCard({ bookmark, compact = false }) {
  const { author, title, quote, category, date, links, what, hasVideo, video, bookmarkId } = bookmark
  const colors = categoryColors[category] || categoryColors.Uncategorized
  const [showVideo, setShowVideo] = useState(false)
  
  const displayText = what || quote || title
  const tweetUrl = links?.tweet
  
  // Get video source URL
  const videoSrc = hasVideo && video ? `/videos/${video.filename}` : null
  const videoThumbnail = hasVideo && video?.hasThumbnail ? `/videos/${bookmarkId}.jpg` : null

  return (
    <article className={`bookmark-card ${compact ? 'bookmark-card-compact' : ''} ${hasVideo ? 'bookmark-card-has-video' : ''}`}>
      <div className="bookmark-card-header">
        <div className="bookmark-card-author">
          <img 
            src={getAvatarUrl(author)} 
            alt={author}
            className="bookmark-card-avatar"
            loading="lazy"
          />
          <span className="bookmark-card-username">@{author}</span>
        </div>
        <div className="bookmark-card-badges">
          {hasVideo && (
            <span className="bookmark-card-video-badge">
              <PlayIcon /> Video
            </span>
          )}
          <span 
            className="bookmark-card-category"
            style={{ 
              background: colors.bg,
              color: colors.text,
              border: category === 'Uncategorized' ? '1px solid var(--color-border)' : 'none'
            }}
          >
            {category}
          </span>
        </div>
      </div>

      {title && !compact && (
        <h3 className="bookmark-card-title">{title}</h3>
      )}

      <p className="bookmark-card-text">
        {displayText}
      </p>

      {/* Video Section */}
      {hasVideo && videoSrc && (
        <div className="bookmark-card-video">
          {showVideo ? (
            <VideoPlayer 
              src={videoSrc}
              poster={videoThumbnail}
              compact={compact}
            />
          ) : (
            <div 
              className="bookmark-card-video-preview"
              onClick={() => setShowVideo(true)}
            >
              {videoThumbnail ? (
                <img 
                  src={videoThumbnail} 
                  alt="Video thumbnail"
                  className="bookmark-card-video-thumbnail"
                />
              ) : (
                <div className="bookmark-card-video-placeholder" />
              )}
              <div className="bookmark-card-video-play">
                <PlayIcon />
                <span>Play Video</span>
              </div>
              {video?.duration && (
                <span className="bookmark-card-video-duration">{video.duration}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bookmark-card-footer">
        {date && (
          <span className="bookmark-card-date">{date}</span>
        )}
        {tweetUrl && (
          <a 
            href={tweetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bookmark-card-link"
          >
            View tweet →
          </a>
        )}
      </div>
    </article>
  )
}


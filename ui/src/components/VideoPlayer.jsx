import { useState, useRef } from 'react'
import './VideoPlayer.css'

const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const PauseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const ExpandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

export default function VideoPlayer({ 
  src, 
  poster, 
  autoPlay = false,
  compact = false,
  onExpand,
  className = ''
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef(null)
  const hideControlsTimer = useRef(null)

  function togglePlay() {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return
    const current = videoRef.current.currentTime
    const total = videoRef.current.duration
    setProgress((current / total) * 100)
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  function handleSeek(e) {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    videoRef.current.currentTime = percentage * duration
    setProgress(percentage * 100)
  }

  function handleMouseMove() {
    setShowControls(true)
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current)
    }
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 2000)
  }

  function handleEnded() {
    setIsPlaying(false)
    setShowControls(true)
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentTime = videoRef.current?.currentTime || 0

  return (
    <div 
      className={`video-player ${compact ? 'video-player-compact' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
      
      {/* Click to play overlay */}
      {!isPlaying && (
        <div className="video-player-overlay" onClick={togglePlay}>
          <button className="video-player-play-btn">
            <PlayIcon />
          </button>
        </div>
      )}
      
      {/* Controls */}
      <div className={`video-player-controls ${showControls ? 'visible' : ''}`}>
        <button 
          className="video-player-control-btn"
          onClick={togglePlay}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        
        <div 
          className="video-player-progress"
          onClick={handleSeek}
        >
          <div 
            className="video-player-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="video-player-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        
        {onExpand && (
          <button 
            className="video-player-control-btn video-player-expand"
            onClick={onExpand}
          >
            <ExpandIcon />
          </button>
        )}
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import './Settings.css'

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        setConfig(data)
      } catch (error) {
        console.error('Failed to load config:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Settings</h1>
          <p>Configure your Pins instance</p>
        </div>
      </div>

      {loading ? (
        <div className="settings-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="settings-sections">
          <section className="settings-section">
            <h2 className="settings-section-title">Configuration</h2>
            <p className="settings-section-desc">
              Edit <code>smaug.config.json</code> in your project root to change these settings.
            </p>
            
            <div className="settings-grid">
              <div className="settings-item">
                <label className="settings-label">Source</label>
                <div className="settings-value">{config?.source || 'bookmarks'}</div>
              </div>
              
              <div className="settings-item">
                <label className="settings-label">Archive File</label>
                <div className="settings-value">{config?.archiveFile || './bookmarks.md'}</div>
              </div>
              
              <div className="settings-item">
                <label className="settings-label">Timezone</label>
                <div className="settings-value">{config?.timezone || 'America/New_York'}</div>
              </div>
              
              <div className="settings-item">
                <label className="settings-label">Auto-Invoke Claude</label>
                <div className="settings-value">
                  {config?.autoInvokeClaude ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="settings-item">
                <label className="settings-label">Claude Model</label>
                <div className="settings-value">{config?.claudeModel || 'sonnet'}</div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-section-title">About</h2>
            <div className="settings-about">
              <div className="settings-about-logo">📌</div>
              <div className="settings-about-info">
                <h3>Pins</h3>
                <p>Archive your Twitter/X bookmarks to markdown. Automatically.</p>
                <p className="text-muted">
                  Keep your valuable bookmarks organized and accessible.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}


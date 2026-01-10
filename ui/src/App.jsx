import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components'
import { Dashboard, Bookmarks, Knowledge, Settings, Digest, Videos } from './pages'

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/digest" element={<Digest />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

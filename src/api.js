/**
 * Smaug API Server
 * 
 * Express server that exposes APIs for the dashboard UI,
 * reading from Smaug's existing markdown and JSON files.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';
import { fetchAndPrepareBookmarks } from './processor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Load video metadata from videos.json
 */
function loadVideosMetadata(config) {
  const metaPath = path.resolve(PROJECT_ROOT, config.videosMetaFile || './.state/videos.json');
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { videos: [] };
  }
}

/**
 * Get video info for a specific bookmark
 */
function getVideoForBookmark(config, bookmarkId) {
  const metadata = loadVideosMetadata(config);
  return metadata.videos.find(v => v.bookmarkId === bookmarkId.toString()) || null;
}

/**
 * Parse bookmarks.md into structured data
 */
function parseBookmarksMd(content) {
  const bookmarks = [];
  const lines = content.split('\n');
  
  let currentDate = null;
  let currentBookmark = null;
  let inQuote = false;
  let quoteLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Date header (# Day, Month Date, Year)
    if (line.startsWith('# ')) {
      currentDate = line.slice(2).trim();
      continue;
    }
    
    // Bookmark header (## @username - Title)
    if (line.startsWith('## @')) {
      // Save previous bookmark
      if (currentBookmark) {
        if (quoteLines.length > 0) {
          currentBookmark.quote = quoteLines.join('\n');
        }
        bookmarks.push(currentBookmark);
      }
      
      const match = line.match(/^## @(\w+)\s*-?\s*(.*)$/);
      if (match) {
        currentBookmark = {
          author: match[1],
          title: match[2] || '',
          date: currentDate,
          quote: '',
          links: {},
          category: 'Uncategorized',
          what: ''
        };
        quoteLines = [];
        inQuote = false;
      }
      continue;
    }
    
    if (!currentBookmark) continue;
    
    // Quote block
    if (line.startsWith('> ')) {
      inQuote = true;
      quoteLines.push(line.slice(2));
      continue;
    }
    
    // End of quote
    if (inQuote && !line.startsWith('>') && line.trim() !== '') {
      inQuote = false;
    }
    
    // Links
    if (line.startsWith('- **Tweet:**')) {
      currentBookmark.links.tweet = line.match(/https?:\/\/[^\s]+/)?.[0] || '';
    } else if (line.startsWith('- **Link:**')) {
      currentBookmark.links.link = line.match(/https?:\/\/[^\s]+/)?.[0] || '';
    } else if (line.startsWith('- **Links:**')) {
      // Multiple links
      const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const m of linkMatches) {
        currentBookmark.links[m[1].toLowerCase()] = m[2];
      }
    } else if (line.startsWith('- **Filed:**')) {
      const fileMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (fileMatch) {
        currentBookmark.links.filed = fileMatch[2];
        // Determine category from filed path
        if (fileMatch[2].includes('/tools/')) {
          currentBookmark.category = 'GitHub';
        } else if (fileMatch[2].includes('/articles/')) {
          currentBookmark.category = 'Article';
        }
      }
    } else if (line.startsWith('- **What:**')) {
      currentBookmark.what = line.slice('- **What:**'.length).trim();
    } else if (line.startsWith('- **Quote of:**')) {
      currentBookmark.links.quote = line.match(/https?:\/\/[^\s]+/)?.[0] || '';
    } else if (line.startsWith('- **Quoted:**')) {
      currentBookmark.links.quoted = line.match(/https?:\/\/[^\s]+/)?.[0] || '';
    }
  }
  
  // Don't forget last bookmark
  if (currentBookmark) {
    if (quoteLines.length > 0) {
      currentBookmark.quote = quoteLines.join('\n');
    }
    bookmarks.push(currentBookmark);
  }
  
  return bookmarks;
}

/**
 * Parse frontmatter from markdown files
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return { metadata: {}, content };
  }
  
  const metadata = {};
  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  
  // Simple YAML-like parsing
  for (const line of frontmatter.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        // Remove quotes
        value = value.replace(/^["']|["']$/g, '');
      }
      
      metadata[key] = value;
    }
  }
  
  return { metadata, content: body };
}

/**
 * Get stats from the data
 */
function getStats(config) {
  const stats = {
    totalBookmarks: 0,
    thisWeek: 0,
    githubRepos: 0,
    articles: 0,
    pending: 0
  };
  
  // Count bookmarks from bookmarks.md
  const archivePath = path.resolve(PROJECT_ROOT, config.archiveFile);
  if (fs.existsSync(archivePath)) {
    const content = fs.readFileSync(archivePath, 'utf8');
    const bookmarks = parseBookmarksMd(content);
    stats.totalBookmarks = bookmarks.length;
    
    // Count this week's bookmarks
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const b of bookmarks) {
      const dateMatch = b.date?.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d+)/);
      if (dateMatch) {
        const bookmarkDate = new Date(`${dateMatch[2]} ${dateMatch[3]}, ${dateMatch[4]}`);
        if (bookmarkDate >= oneWeekAgo) {
          stats.thisWeek++;
        }
      }
    }
  }
  
  // Count knowledge files
  const toolsDir = path.resolve(PROJECT_ROOT, 'knowledge/tools');
  const articlesDir = path.resolve(PROJECT_ROOT, 'knowledge/articles');
  
  if (fs.existsSync(toolsDir)) {
    stats.githubRepos = fs.readdirSync(toolsDir).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(articlesDir)) {
    stats.articles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md')).length;
  }
  
  // Count pending
  const pendingPath = path.resolve(PROJECT_ROOT, config.pendingFile);
  if (fs.existsSync(pendingPath)) {
    try {
      const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
      stats.pending = pending.bookmarks?.length || 0;
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return stats;
}

/**
 * Get category breakdown
 */
function getCategoryBreakdown(config) {
  const categories = {};
  
  const archivePath = path.resolve(PROJECT_ROOT, config.archiveFile);
  if (fs.existsSync(archivePath)) {
    const content = fs.readFileSync(archivePath, 'utf8');
    const bookmarks = parseBookmarksMd(content);
    
    for (const b of bookmarks) {
      const cat = b.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }
  }
  
  return Object.entries(categories).map(([name, count]) => ({ name, count }));
}

/**
 * Get recent activity from state file
 */
function getActivity(config) {
  const activities = [];
  
  const statePath = path.resolve(PROJECT_ROOT, config.stateFile);
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      
      if (state.last_check) {
        activities.push({
          type: 'fetch',
          message: 'Fetched bookmarks',
          timestamp: state.last_check
        });
      }
      
      if (state.last_processing_run) {
        activities.push({
          type: 'process',
          message: 'Processed bookmarks',
          timestamp: state.last_processing_run
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities;
}

/**
 * Get knowledge items
 */
function getKnowledge() {
  const items = { tools: [], articles: [] };
  
  const toolsDir = path.resolve(PROJECT_ROOT, 'knowledge/tools');
  const articlesDir = path.resolve(PROJECT_ROOT, 'knowledge/articles');
  
  // Read tools
  if (fs.existsSync(toolsDir)) {
    for (const file of fs.readdirSync(toolsDir)) {
      if (!file.endsWith('.md')) continue;
      
      const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
      const { metadata, content: body } = parseFrontmatter(content);
      
      items.tools.push({
        slug: file.replace('.md', ''),
        title: metadata.title || file.replace('.md', ''),
        type: 'tool',
        dateAdded: metadata.date_added,
        source: metadata.source,
        tags: metadata.tags || [],
        via: metadata.via,
        excerpt: body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 200) || ''
      });
    }
  }
  
  // Read articles
  if (fs.existsSync(articlesDir)) {
    for (const file of fs.readdirSync(articlesDir)) {
      if (!file.endsWith('.md')) continue;
      
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const { metadata, content: body } = parseFrontmatter(content);
      
      items.articles.push({
        slug: file.replace('.md', ''),
        title: metadata.title || file.replace('.md', ''),
        type: 'article',
        dateAdded: metadata.date_added,
        source: metadata.source,
        tags: metadata.tags || [],
        via: metadata.via,
        excerpt: body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 200) || ''
      });
    }
  }
  
  return items;
}

/**
 * Get weekly digest data
 * Returns bookmarks from the last N days, grouped by category
 */
function getDigest(config, days = 7) {
  const archivePath = path.resolve(PROJECT_ROOT, config.archiveFile);
  
  if (!fs.existsSync(archivePath)) {
    return {
      dateRange: { start: '', end: '' },
      highlight: null,
      tools: [],
      articles: [],
      tweets: [],
      stats: { total: 0, tools: 0, articles: 0, tweets: 0 }
    };
  }
  
  const content = fs.readFileSync(archivePath, 'utf8');
  const allBookmarks = parseBookmarksMd(content);
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Filter bookmarks within date range
  const bookmarks = allBookmarks.filter(b => {
    if (!b.date) return false;
    const dateMatch = b.date.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d+)/);
    if (!dateMatch) return false;
    const bookmarkDate = new Date(`${dateMatch[2]} ${dateMatch[3]}, ${dateMatch[4]}`);
    return bookmarkDate >= startDate && bookmarkDate <= endDate;
  });
  
  // Group by category
  const tools = bookmarks.filter(b => b.category === 'GitHub');
  const articles = bookmarks.filter(b => b.category === 'Article');
  const tweets = bookmarks.filter(b => b.category === 'Uncategorized');
  
  // Pick highlight: prefer items with longest 'what' description or most content
  let highlight = null;
  if (bookmarks.length > 0) {
    highlight = bookmarks.reduce((best, current) => {
      const currentScore = (current.what?.length || 0) + (current.quote?.length || 0) + 
        (current.links?.link ? 50 : 0) + (current.links?.filed ? 30 : 0);
      const bestScore = (best.what?.length || 0) + (best.quote?.length || 0) +
        (best.links?.link ? 50 : 0) + (best.links?.filed ? 30 : 0);
      return currentScore > bestScore ? current : best;
    });
  }
  
  // Format date range for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return {
    dateRange: {
      start: formatDate(startDate),
      end: formatDate(endDate)
    },
    highlight,
    tools,
    articles,
    tweets,
    stats: {
      total: bookmarks.length,
      tools: tools.length,
      articles: articles.length,
      tweets: tweets.length
    }
  };
}

/**
 * Get single knowledge item content
 */
function getKnowledgeItem(type, slug) {
  const dir = type === 'tool' ? 'knowledge/tools' : 'knowledge/articles';
  const filePath = path.resolve(PROJECT_ROOT, dir, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const { metadata, content: body } = parseFrontmatter(content);
  
  return {
    slug,
    ...metadata,
    content: body
  };
}

/**
 * Create and configure Express app
 */
export function createApp() {
  const app = express();
  const config = loadConfig();
  
  app.use(cors());
  app.use(express.json());
  
  // API Routes
  
  // Get dashboard stats
  app.get('/api/stats', (req, res) => {
    try {
      const stats = getStats(config);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get category breakdown
  app.get('/api/categories', (req, res) => {
    try {
      const categories = getCategoryBreakdown(config);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get recent activity
  app.get('/api/activity', (req, res) => {
    try {
      const activities = getActivity(config);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get bookmarks (paginated)
  app.get('/api/bookmarks', (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search?.toLowerCase() || '';
      const category = req.query.category || '';
      
      const archivePath = path.resolve(PROJECT_ROOT, config.archiveFile);
      if (!fs.existsSync(archivePath)) {
        return res.json({ bookmarks: [], total: 0, page, pages: 0 });
      }
      
      const content = fs.readFileSync(archivePath, 'utf8');
      let bookmarks = parseBookmarksMd(content);
      
      // Filter by search
      if (search) {
        bookmarks = bookmarks.filter(b => 
          b.title?.toLowerCase().includes(search) ||
          b.author?.toLowerCase().includes(search) ||
          b.quote?.toLowerCase().includes(search) ||
          b.what?.toLowerCase().includes(search)
        );
      }
      
      // Filter by category
      if (category) {
        bookmarks = bookmarks.filter(b => b.category === category);
      }
      
      // Enrich bookmarks with video info
      const videosMetadata = loadVideosMetadata(config);
      const videosByBookmarkId = new Map(
        videosMetadata.videos.map(v => [v.bookmarkId, v])
      );
      
      // Extract bookmark IDs from tweet URLs and attach video info
      bookmarks = bookmarks.map(b => {
        const tweetUrl = b.links?.tweet || '';
        const idMatch = tweetUrl.match(/status\/(\d+)/);
        const bookmarkId = idMatch ? idMatch[1] : null;
        const video = bookmarkId ? videosByBookmarkId.get(bookmarkId) : null;
        
        return {
          ...b,
          bookmarkId,
          hasVideo: !!video,
          video
        };
      });
      
      const total = bookmarks.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      
      res.json({
        bookmarks: bookmarks.slice(start, start + limit),
        total,
        page,
        pages
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get pending bookmarks
  app.get('/api/pending', (req, res) => {
    try {
      const pendingPath = path.resolve(PROJECT_ROOT, config.pendingFile);
      
      if (!fs.existsSync(pendingPath)) {
        return res.json({ count: 0, bookmarks: [] });
      }
      
      const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
      res.json({
        count: pending.count || pending.bookmarks?.length || 0,
        generatedAt: pending.generatedAt,
        bookmarks: pending.bookmarks || []
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get knowledge items
  app.get('/api/knowledge', (req, res) => {
    try {
      const knowledge = getKnowledge();
      res.json(knowledge);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get single knowledge item
  app.get('/api/knowledge/:type/:slug', (req, res) => {
    try {
      const { type, slug } = req.params;
      const item = getKnowledgeItem(type, slug);
      
      if (!item) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get weekly digest
  app.get('/api/digest', (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const digest = getDigest(config, days);
      res.json(digest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all videos
  app.get('/api/videos', (req, res) => {
    try {
      const metadata = loadVideosMetadata(config);
      const search = req.query.search?.toLowerCase() || '';
      
      let videos = metadata.videos || [];
      
      // Filter by search term (matches author or bookmarkId)
      if (search) {
        videos = videos.filter(v => 
          v.author?.toLowerCase().includes(search) ||
          v.bookmarkId?.includes(search)
        );
      }
      
      // Sort by download date (newest first)
      videos.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
      
      res.json({
        videos,
        total: videos.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get single video metadata
  app.get('/api/videos/:bookmarkId', (req, res) => {
    try {
      const { bookmarkId } = req.params;
      const video = getVideoForBookmark(config, bookmarkId);
      
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve video files statically
  const videosDir = path.resolve(PROJECT_ROOT, config.videosDir || './videos');
  if (fs.existsSync(videosDir)) {
    app.use('/videos', express.static(videosDir, {
      setHeaders: (res, filepath) => {
        // Set proper content type for video files
        if (filepath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        }
      }
    }));
  }
  
  // Get config (safe subset)
  app.get('/api/config', (req, res) => {
    res.json({
      source: config.source,
      archiveFile: config.archiveFile,
      timezone: config.timezone,
      autoInvokeClaude: config.autoInvokeClaude,
      claudeModel: config.claudeModel
    });
  });
  
  // Trigger fetch
  app.post('/api/fetch', async (req, res) => {
    try {
      const count = req.body.count || 20;
      const result = await fetchAndPrepareBookmarks({ count });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Trigger process (runs Claude Code)
  app.post('/api/process', async (req, res) => {
    try {
      // Import job module dynamically
      const jobModule = await import('./job.js');
      const result = await jobModule.default.run({ skipFetch: true });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve static files from ui/dist in production
  const uiDistPath = path.resolve(PROJECT_ROOT, 'ui/dist');
  if (fs.existsSync(uiDistPath)) {
    app.use(express.static(uiDistPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(uiDistPath, 'index.html'));
      }
    });
  }
  
  return app;
}

/**
 * Start the server
 */
export function startServer(port = 3333) {
  const app = createApp();
  
  app.listen(port, () => {
    console.log(`
🐉 Smaug Dashboard
━━━━━━━━━━━━━━━━━━━━━

Server running at: http://localhost:${port}

API Endpoints:
  GET  /api/stats      - Dashboard statistics
  GET  /api/categories - Category breakdown
  GET  /api/activity   - Recent activity
  GET  /api/bookmarks  - Paginated bookmarks
  GET  /api/pending    - Pending bookmarks
  GET  /api/knowledge  - Tools and articles
  GET  /api/digest     - Weekly digest (last 7 days)
  GET  /api/videos     - Downloaded videos
  GET  /videos/:file   - Video file serving
  POST /api/fetch      - Trigger bookmark fetch
  POST /api/process    - Trigger processing
`);
  });
  
  return app;
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.env.PORT) || 3333;
  startServer(port);
}


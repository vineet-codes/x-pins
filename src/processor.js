/**
 * Bookmark Processor - Fetches and prepares Twitter bookmarks for analysis
 *
 * This handles the mechanical work:
 * - Fetching bookmarks via bird CLI
 * - Expanding t.co links
 * - Extracting content from linked pages (articles, GitHub repos)
 * - Downloading Twitter/X videos using yt-dlp
 * - Optional: Bypassing paywalls via archive.ph
 *
 * Outputs a JSON bundle for AI analysis (Claude Code, etc.)
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { loadConfig } from './config.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================
// Video Download Functions
// ============================================

/**
 * Load video metadata from videos.json
 */
export function loadVideosMetadata(config) {
  try {
    const content = fs.readFileSync(config.videosMetaFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { videos: [] };
  }
}

/**
 * Save video metadata to videos.json
 */
export function saveVideosMetadata(config, metadata) {
  const dir = path.dirname(config.videosMetaFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(config.videosMetaFile, JSON.stringify(metadata, null, 2) + '\n');
}

/**
 * Check if yt-dlp is installed
 */
export function isYtDlpInstalled() {
  try {
    execSync('which yt-dlp', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a Twitter/X video using yt-dlp
 * @param {string} tweetUrl - The tweet URL containing the video
 * @param {string} bookmarkId - The bookmark ID for naming the file
 * @param {object} config - The configuration object
 * @returns {object|null} - Video metadata or null if download failed
 */
export async function downloadTwitterVideo(tweetUrl, bookmarkId, config) {
  const videosDir = config.videosDir || './videos';
  
  // Ensure videos directory exists
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }
  
  const outputPath = path.join(videosDir, `${bookmarkId}.mp4`);
  const thumbnailPath = path.join(videosDir, `${bookmarkId}.jpg`);
  
  // Check if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`  Video already downloaded: ${outputPath}`);
    return getExistingVideoMetadata(outputPath, bookmarkId, tweetUrl);
  }
  
  if (!isYtDlpInstalled()) {
    console.log('  yt-dlp not installed. Install with: brew install yt-dlp');
    return null;
  }
  
  try {
    console.log(`  Downloading video from ${tweetUrl}...`);
    
    // Download video with yt-dlp
    // -f best: get best quality
    // --write-thumbnail: save thumbnail
    // --convert-thumbnails jpg: convert thumbnail to jpg
    // -o: output template
    const cmd = `yt-dlp -f "best[ext=mp4]/best" --write-thumbnail --convert-thumbnails jpg -o "${outputPath}" "${tweetUrl}" 2>&1`;
    
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (!fs.existsSync(outputPath)) {
      console.log(`  Video download failed - file not created`);
      return null;
    }
    
    // Get video metadata
    const stats = fs.statSync(outputPath);
    const duration = getVideoDuration(outputPath);
    
    const videoMeta = {
      bookmarkId,
      filename: `${bookmarkId}.mp4`,
      tweetUrl,
      downloadedAt: new Date().toISOString(),
      fileSize: stats.size,
      duration,
      hasThumbnail: fs.existsSync(thumbnailPath)
    };
    
    console.log(`  Video downloaded: ${outputPath} (${formatFileSize(stats.size)}, ${duration || 'unknown duration'})`);
    
    return videoMeta;
  } catch (error) {
    console.log(`  Video download failed: ${error.message}`);
    return null;
  }
}

/**
 * Get metadata for an existing video file
 */
function getExistingVideoMetadata(outputPath, bookmarkId, tweetUrl) {
  try {
    const stats = fs.statSync(outputPath);
    const duration = getVideoDuration(outputPath);
    const videosDir = path.dirname(outputPath);
    const thumbnailPath = path.join(videosDir, `${bookmarkId}.jpg`);
    
    return {
      bookmarkId,
      filename: `${bookmarkId}.mp4`,
      tweetUrl,
      downloadedAt: stats.mtime.toISOString(),
      fileSize: stats.size,
      duration,
      hasThumbnail: fs.existsSync(thumbnailPath)
    };
  } catch {
    return null;
  }
}

/**
 * Get video duration using ffprobe (if available)
 */
function getVideoDuration(videoPath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const seconds = parseFloat(result.trim());
    if (isNaN(seconds)) return null;
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } catch {
    return null;
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Check if a tweet has video content
 */
export function hasVideoContent(bookmark) {
  // Check media array for videos
  if (bookmark.media && Array.isArray(bookmark.media)) {
    return bookmark.media.some(m => 
      m.type === 'video' || 
      m.type === 'animated_gif' ||
      (m.video_info && m.video_info.variants)
    );
  }
  return false;
}

// Sites that typically require paywall bypass
const PAYWALL_DOMAINS = [
  'nytimes.com',
  'wsj.com',
  'washingtonpost.com',
  'theatlantic.com',
  'newyorker.com',
  'bloomberg.com',
  'ft.com',
  'economist.com',
  'bostonglobe.com',
  'latimes.com',
  'wired.com'
];

export function loadState(config) {
  try {
    const content = fs.readFileSync(config.stateFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {
      last_processed_id: null,
      last_check: null,
      last_processing_run: null
    };
  }
}

export function saveState(config, state) {
  const dir = path.dirname(config.stateFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2) + '\n');
}

function buildBirdEnv(config) {
  const env = { ...process.env };
  if (config.twitter?.authToken) {
    env.AUTH_TOKEN = config.twitter.authToken;
  }
  if (config.twitter?.ct0) {
    env.CT0 = config.twitter.ct0;
  }
  return env;
}

export function fetchBookmarks(config, count = 10) {
  try {
    const env = buildBirdEnv(config);
    const birdCmd = config.birdPath || 'bird';
    const output = execSync(`${birdCmd} bookmarks -n ${count} --json`, {
      encoding: 'utf8',
      timeout: 30000,
      env
    });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  }
}

export function fetchLikes(config, count = 10) {
  try {
    const env = buildBirdEnv(config);
    const birdCmd = config.birdPath || 'bird';
    const output = execSync(`${birdCmd} likes -n ${count} --json`, {
      encoding: 'utf8',
      timeout: 30000,
      env
    });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to fetch likes: ${error.message}`);
  }
}

export function fetchFromSource(config, count = 10) {
  const source = config.source || 'bookmarks';

  if (source === 'bookmarks') {
    return fetchBookmarks(config, count);
  } else if (source === 'likes') {
    return fetchLikes(config, count);
  } else if (source === 'both') {
    const bookmarks = fetchBookmarks(config, count);
    const likes = fetchLikes(config, count);
    // Merge and dedupe by ID
    const seen = new Set();
    const merged = [];
    for (const item of [...bookmarks, ...likes]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  } else {
    throw new Error(`Invalid source: ${source}. Must be 'bookmarks', 'likes', or 'both'.`);
  }
}

export function fetchTweet(config, tweetId) {
  try {
    const env = buildBirdEnv(config);
    const birdCmd = config.birdPath || 'bird';
    const output = execSync(`${birdCmd} read ${tweetId} --json`, {
      encoding: 'utf8',
      timeout: 15000,
      env
    });
    return JSON.parse(output);
  } catch (error) {
    console.log(`  Could not fetch parent tweet ${tweetId}: ${error.message}`);
    return null;
  }
}

export function expandTcoLink(url, timeout = 10000) {
  try {
    const result = execSync(
      `curl -Ls -o /dev/null -w '%{url_effective}' '${url}'`,
      { encoding: 'utf8', timeout }
    );
    return result.trim();
  } catch (error) {
    console.error(`Failed to expand ${url}: ${error.message}`);
    return url;
  }
}

export function isPaywalled(url) {
  return PAYWALL_DOMAINS.some(domain => url.includes(domain));
}

export function stripQuerystring(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function extractGitHubInfo(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export async function fetchGitHubContent(url) {
  const info = extractGitHubInfo(url);
  if (!info) {
    throw new Error('Could not parse GitHub URL');
  }

  const { owner, repo } = info;

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoData = execSync(
      `curl -sL -H "Accept: application/vnd.github.v3+json" "${apiUrl}"`,
      { encoding: 'utf8', timeout: 15000 }
    );
    const repoJson = JSON.parse(repoData);

    // Fetch README content
    let readme = '';
    try {
      const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      const readmeData = execSync(
        `curl -sL -H "Accept: application/vnd.github.v3+json" "${readmeUrl}"`,
        { encoding: 'utf8', timeout: 15000 }
      );
      const readmeJson = JSON.parse(readmeData);
      if (readmeJson.content) {
        readme = Buffer.from(readmeJson.content, 'base64').toString('utf8');
        if (readme.length > 5000) {
          readme = readme.slice(0, 5000) + '\n...[truncated]';
        }
      }
    } catch (e) {
      console.log(`  No README found for ${owner}/${repo}`);
    }

    return {
      name: repoJson.name,
      fullName: repoJson.full_name,
      description: repoJson.description || '',
      stars: repoJson.stargazers_count,
      language: repoJson.language,
      topics: repoJson.topics || [],
      readme,
      url: repoJson.html_url
    };
  } catch (error) {
    console.error(`  GitHub API error for ${owner}/${repo}: ${error.message}`);
    throw error;
  }
}

export async function fetchArticleContent(url) {
  try {
    const result = execSync(
      `curl -sL -m 30 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "${url}" | head -c 50000`,
      { encoding: 'utf8', timeout: 35000 }
    );

    // Check for paywall indicators
    if (result.includes('Subscribe') && result.includes('sign in') ||
        result.includes('This article is for subscribers') ||
        result.length < 1000) {
      return { text: result, source: 'direct', paywalled: true };
    }

    return { text: result, source: 'direct', paywalled: false };
  } catch (error) {
    throw error;
  }
}

export async function fetchContent(url, type, config) {
  // Use GitHub API for GitHub URLs
  if (type === 'github') {
    try {
      const ghContent = await fetchGitHubContent(url);
      return { ...ghContent, source: 'github-api' };
    } catch (error) {
      console.log(`  GitHub API failed: ${error.message}`);
    }
  }

  // For paywalled sites, note for manual handling or custom bypass
  if (isPaywalled(url)) {
    console.log(`  Paywalled domain detected: ${url}`);
    return {
      url,
      source: 'paywalled',
      note: 'Content requires paywall bypass - see README for options'
    };
  }

  // Try direct fetch for other URLs
  return await fetchArticleContent(url);
}

export function getExistingBookmarkIds(config) {
  try {
    const content = fs.readFileSync(config.archiveFile, 'utf8');
    const matches = content.matchAll(/x\.com\/\w+\/status\/(\d+)/g);
    return new Set([...matches].map(m => m[1]));
  } catch {
    return new Set();
  }
}

export async function fetchAndPrepareBookmarks(options = {}) {
  const config = loadConfig(options.configPath);
  const now = dayjs().tz(config.timezone || 'America/New_York');
  console.log(`[${now.format()}] Fetching and preparing bookmarks...`);

  const state = loadState(config);
  const source = options.source || config.source || 'bookmarks';
  const includeMedia = options.includeMedia ?? config.includeMedia ?? false;
  const configWithOptions = { ...config, source, includeMedia };

  console.log(`Fetching from source: ${source}${includeMedia ? ' (with media)' : ''}`);
  const tweets = fetchFromSource(configWithOptions, options.count || 20);

  if (!tweets || tweets.length === 0) {
    console.log(`No ${source} found`);
    return { bookmarks: [], count: 0 };
  }

  // Get IDs already processed or pending
  const existingIds = getExistingBookmarkIds(config);
  let pendingIds = new Set();
  try {
    if (fs.existsSync(config.pendingFile)) {
      const pending = JSON.parse(fs.readFileSync(config.pendingFile, 'utf8'));
      pendingIds = new Set(pending.bookmarks.map(b => b.id.toString()));
    }
  } catch (e) {}

  // Determine which tweets to process
  let toProcess;
  if (options.specificIds) {
    toProcess = tweets.filter(b => options.specificIds.includes(b.id.toString()));
  } else if (options.force) {
    // Force mode: skip duplicate checking, process all fetched tweets
    toProcess = tweets;
  } else {
    toProcess = tweets.filter(b => {
      const id = b.id.toString();
      return !existingIds.has(id) && !pendingIds.has(id);
    });
  }

  if (toProcess.length === 0) {
    console.log('No new tweets to process');
    return { bookmarks: [], count: 0 };
  }

  console.log(`Preparing ${toProcess.length} tweets...`);

  const prepared = [];
  const date = now.format('dddd, MMMM D, YYYY');

  for (const bookmark of toProcess) {
    try {
      console.log(`\nProcessing bookmark ${bookmark.id}...`);
      const text = bookmark.text || bookmark.full_text || '';
      const author = bookmark.author?.username || bookmark.user?.screen_name || 'unknown';

      // Find and expand t.co links
      const tcoLinks = text.match(/https?:\/\/t\.co\/\w+/g) || [];
      const links = [];

      for (const link of tcoLinks) {
        const expanded = expandTcoLink(link);
        console.log(`  Expanded: ${link} -> ${expanded}`);

        // Categorize the link
        let type = 'unknown';
        let content = null;

        if (expanded.includes('github.com')) {
          type = 'github';
        } else if (expanded.includes('youtube.com') || expanded.includes('youtu.be')) {
          type = 'video';
        } else if (expanded.includes('x.com') || expanded.includes('twitter.com')) {
          if (expanded.includes('/photo/') || expanded.includes('/video/')) {
            type = 'media';
          } else {
            type = 'tweet';
            // Quote tweet - fetch the quoted tweet for context
            const tweetIdMatch = expanded.match(/status\/(\d+)/);
            if (tweetIdMatch) {
              const quotedTweetId = tweetIdMatch[1];
              console.log(`  Quote tweet detected, fetching ${quotedTweetId}...`);
              const quotedTweet = fetchTweet(config, quotedTweetId);
              if (quotedTweet) {
                content = {
                  id: quotedTweet.id,
                  author: quotedTweet.author?.username || 'unknown',
                  authorName: quotedTweet.author?.name || quotedTweet.author?.username || 'unknown',
                  text: quotedTweet.text || quotedTweet.full_text || '',
                  tweetUrl: `https://x.com/${quotedTweet.author?.username || 'unknown'}/status/${quotedTweet.id}`,
                  source: 'quote-tweet'
                };
              }
            }
          }
        } else if (expanded.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          type = 'image';
        } else {
          type = 'article';
        }

        // Fetch content for articles and GitHub repos
        if (type === 'article' || type === 'github') {
          try {
            const fetchResult = await fetchContent(expanded, type, config);

            if (fetchResult.source === 'github-api') {
              content = {
                name: fetchResult.name,
                fullName: fetchResult.fullName,
                description: fetchResult.description,
                stars: fetchResult.stars,
                language: fetchResult.language,
                topics: fetchResult.topics,
                readme: fetchResult.readme,
                url: fetchResult.url,
                source: 'github-api'
              };
              console.log(`  GitHub repo: ${fetchResult.fullName} (${fetchResult.stars} stars)`);
            } else {
              content = {
                text: fetchResult.text?.slice(0, 10000),
                source: fetchResult.source,
                paywalled: fetchResult.paywalled
              };
            }
          } catch (error) {
            console.log(`  Could not fetch content: ${error.message}`);
            content = { error: error.message };
          }
        }

        links.push({
          original: link,
          expanded,
          type,
          content
        });
      }

      // If this is a reply, fetch the parent tweet for context
      let replyContext = null;
      if (bookmark.inReplyToStatusId) {
        console.log(`  This is a reply to ${bookmark.inReplyToStatusId}, fetching parent...`);
        const parentTweet = fetchTweet(config, bookmark.inReplyToStatusId);
        if (parentTweet) {
          replyContext = {
            id: parentTweet.id,
            author: parentTweet.author?.username || 'unknown',
            authorName: parentTweet.author?.name || parentTweet.author?.username || 'unknown',
            text: parentTweet.text || parentTweet.full_text || '',
            tweetUrl: `https://x.com/${parentTweet.author?.username || 'unknown'}/status/${parentTweet.id}`
          };
        }
      }

      // Check for native quote tweet
      let quoteContext = null;
      if (bookmark.quotedTweet) {
        const qt = bookmark.quotedTweet;
        quoteContext = {
          id: qt.id,
          author: qt.author?.username || 'unknown',
          authorName: qt.author?.name || qt.author?.username || 'unknown',
          text: qt.text || '',
          tweetUrl: `https://x.com/${qt.author?.username || 'unknown'}/status/${qt.id}`,
          source: 'native-quote'
        };
      }

      // Capture media attachments (photos, videos, GIFs) - EXPERIMENTAL
      // Only included if includeMedia is true (--media flag)
      const media = configWithOptions.includeMedia ? (bookmark.media || []) : [];

      // Download Twitter/X video if present and video downloads are enabled
      let videoMeta = null;
      const tweetUrl = `https://x.com/${author}/status/${bookmark.id}`;
      
      if (config.downloadVideos !== false && hasVideoContent(bookmark)) {
        console.log(`  Tweet has video content, attempting download...`);
        videoMeta = await downloadTwitterVideo(tweetUrl, bookmark.id.toString(), config);
        
        if (videoMeta) {
          // Update videos metadata file
          const videosMetadata = loadVideosMetadata(config);
          const existingIndex = videosMetadata.videos.findIndex(v => v.bookmarkId === bookmark.id.toString());
          if (existingIndex >= 0) {
            videosMetadata.videos[existingIndex] = { ...videoMeta, author, authorName: bookmark.author?.name || author };
          } else {
            videosMetadata.videos.push({ ...videoMeta, author, authorName: bookmark.author?.name || author });
          }
          saveVideosMetadata(config, videosMetadata);
        }
      }

      prepared.push({
        id: bookmark.id,
        author,
        authorName: bookmark.author?.name || bookmark.user?.name || author,
        text,
        tweetUrl,
        createdAt: bookmark.createdAt,
        links,
        media,
        date,
        isReply: !!bookmark.inReplyToStatusId,
        replyContext,
        isQuote: !!quoteContext,
        quoteContext,
        hasVideo: !!videoMeta,
        video: videoMeta
      });

      const mediaInfo = media.length > 0 ? ` (${media.length} media)` : '';
      const videoInfo = videoMeta ? ' (video downloaded)' : '';
      console.log(`  Prepared: @${author} with ${links.length} links${mediaInfo}${videoInfo}${replyContext ? ' (reply)' : ''}${quoteContext ? ' (quote)' : ''}`);

    } catch (error) {
      console.error(`  Error processing bookmark ${bookmark.id}: ${error.message}`);
    }
  }

  // Merge prepared bookmarks into pending file
  let existingPending = { bookmarks: [] };
  try {
    if (fs.existsSync(config.pendingFile)) {
      existingPending = JSON.parse(fs.readFileSync(config.pendingFile, 'utf8'));
    }
  } catch (e) {}

  const existingPendingIds = new Set(existingPending.bookmarks.map(b => b.id));
  const newBookmarks = prepared.filter(b => !existingPendingIds.has(b.id));

  const output = {
    generatedAt: now.toISOString(),
    count: existingPending.bookmarks.length + newBookmarks.length,
    bookmarks: [...existingPending.bookmarks, ...newBookmarks]
  };

  const pendingDir = path.dirname(config.pendingFile);
  if (!fs.existsSync(pendingDir)) {
    fs.mkdirSync(pendingDir, { recursive: true });
  }
  fs.writeFileSync(config.pendingFile, JSON.stringify(output, null, 2));
  console.log(`\nMerged ${newBookmarks.length} new bookmarks into ${config.pendingFile} (total: ${output.count})`);

  // Update state
  state.last_check = now.toISOString();
  saveState(config, state);

  return { bookmarks: prepared, count: prepared.length, pendingFile: config.pendingFile };
}

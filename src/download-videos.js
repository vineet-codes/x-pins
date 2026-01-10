#!/usr/bin/env node
/**
 * Download Videos from Archived Bookmarks
 * 
 * Scans bookmarks.md for tweets and downloads any videos found using yt-dlp.
 * Run: node src/download-videos.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be downloaded without actually downloading
 *   --limit N    Only process the first N bookmarks
 *   --force      Re-download videos even if they already exist
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

/**
 * Load video metadata
 */
function loadVideosMetadata(config) {
  const metaPath = path.resolve(PROJECT_ROOT, config.videosMetaFile || './.state/videos.json');
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { videos: [] };
  }
}

/**
 * Save video metadata
 */
function saveVideosMetadata(config, metadata) {
  const metaPath = path.resolve(PROJECT_ROOT, config.videosMetaFile || './.state/videos.json');
  const dir = path.dirname(metaPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n');
}

/**
 * Extract tweet URLs from bookmarks.md
 */
function extractTweetUrls(archivePath) {
  const content = fs.readFileSync(archivePath, 'utf8');
  const tweets = [];
  
  // Match tweet URLs and extract author from the bookmark header
  const lines = content.split('\n');
  let currentAuthor = null;
  
  for (const line of lines) {
    // Match bookmark header: ## @username - Title
    const authorMatch = line.match(/^## @(\w+)/);
    if (authorMatch) {
      currentAuthor = authorMatch[1];
    }
    
    // Match tweet URLs
    const tweetMatch = line.match(/https?:\/\/(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/);
    if (tweetMatch) {
      const [url, username, tweetId] = tweetMatch;
      tweets.push({
        url: url.replace('twitter.com', 'x.com'),
        author: currentAuthor || username,
        tweetId
      });
    }
  }
  
  // Deduplicate by tweetId
  const seen = new Set();
  return tweets.filter(t => {
    if (seen.has(t.tweetId)) return false;
    seen.add(t.tweetId);
    return true;
  });
}

/**
 * Check if yt-dlp is installed
 */
function isYtDlpInstalled() {
  try {
    execSync('which yt-dlp', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a tweet has video content using yt-dlp
 */
function hasVideo(tweetUrl) {
  try {
    // Use yt-dlp to check if there's a video (--simulate doesn't download)
    execSync(`yt-dlp --simulate --quiet "${tweetUrl}"`, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download video using yt-dlp
 */
function downloadVideo(tweetUrl, outputPath, thumbnailPath) {
  try {
    const cmd = `yt-dlp -f "best[ext=mp4]/best" --write-thumbnail --convert-thumbnails jpg -o "${outputPath}" "${tweetUrl}" 2>&1`;
    execSync(cmd, {
      encoding: 'utf8',
      timeout: 180000, // 3 minute timeout
      maxBuffer: 10 * 1024 * 1024
    });
    return fs.existsSync(outputPath);
  } catch (error) {
    console.error(`    Download failed: ${error.message}`);
    return false;
  }
}

/**
 * Get video duration using ffprobe
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
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Main function
 */
async function main() {
  console.log(`
🎬 Smaug Video Downloader
━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  // Check for yt-dlp
  if (!isYtDlpInstalled()) {
    console.error('❌ yt-dlp is not installed. Install it with: brew install yt-dlp');
    process.exit(1);
  }

  // Load config
  const config = loadConfig();
  const archivePath = path.resolve(PROJECT_ROOT, config.archiveFile);
  const videosDir = path.resolve(PROJECT_ROOT, config.videosDir || './videos');

  // Check archive exists
  if (!fs.existsSync(archivePath)) {
    console.error(`❌ Archive file not found: ${archivePath}`);
    process.exit(1);
  }

  // Ensure videos directory exists
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // Load existing video metadata
  const videosMetadata = loadVideosMetadata(config);
  const existingVideoIds = new Set(videosMetadata.videos.map(v => v.bookmarkId));

  // Extract tweet URLs from archive
  let tweets = extractTweetUrls(archivePath);
  console.log(`Found ${tweets.length} unique tweets in archive\n`);

  // Apply limit if specified
  if (limit && limit > 0) {
    tweets = tweets.slice(0, limit);
    console.log(`Processing first ${limit} tweets only\n`);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be downloaded\n');
  }

  let checked = 0;
  let downloaded = 0;
  let skipped = 0;
  let noVideo = 0;
  let failed = 0;

  for (const tweet of tweets) {
    checked++;
    const outputPath = path.join(videosDir, `${tweet.tweetId}.mp4`);
    const thumbnailPath = path.join(videosDir, `${tweet.tweetId}.jpg`);

    process.stdout.write(`[${checked}/${tweets.length}] @${tweet.author} (${tweet.tweetId}): `);

    // Skip if already downloaded (unless --force)
    if (!force && (existingVideoIds.has(tweet.tweetId) || fs.existsSync(outputPath))) {
      console.log('⏭️  Already downloaded');
      skipped++;
      continue;
    }

    // Check if tweet has video
    process.stdout.write('Checking... ');
    if (!hasVideo(tweet.url)) {
      console.log('📝 No video');
      noVideo++;
      continue;
    }

    if (dryRun) {
      console.log('🎬 Has video (would download)');
      downloaded++;
      continue;
    }

    // Download video
    process.stdout.write('Downloading... ');
    const success = downloadVideo(tweet.url, outputPath, thumbnailPath);

    if (success) {
      const stats = fs.statSync(outputPath);
      const duration = getVideoDuration(outputPath);
      
      // Save metadata
      const videoMeta = {
        bookmarkId: tweet.tweetId,
        filename: `${tweet.tweetId}.mp4`,
        tweetUrl: tweet.url,
        author: tweet.author,
        downloadedAt: new Date().toISOString(),
        fileSize: stats.size,
        duration,
        hasThumbnail: fs.existsSync(thumbnailPath)
      };

      // Update metadata
      const existingIndex = videosMetadata.videos.findIndex(v => v.bookmarkId === tweet.tweetId);
      if (existingIndex >= 0) {
        videosMetadata.videos[existingIndex] = videoMeta;
      } else {
        videosMetadata.videos.push(videoMeta);
      }
      saveVideosMetadata(config, videosMetadata);

      console.log(`✅ Downloaded (${formatFileSize(stats.size)}, ${duration || 'unknown duration'})`);
      downloaded++;
    } else {
      console.log('❌ Failed');
      failed++;
    }
  }

  // Summary
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━
  Checked:    ${checked}
  Downloaded: ${downloaded}${dryRun ? ' (dry run)' : ''}
  Skipped:    ${skipped}
  No video:   ${noVideo}
  Failed:     ${failed}
`);

  if (downloaded > 0 && !dryRun) {
    console.log(`Videos saved to: ${videosDir}`);
    console.log(`Metadata saved to: ${config.videosMetaFile}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});


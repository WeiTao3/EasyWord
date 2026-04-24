/**
 * transcriptUtils.ts
 *
 * Provides transcripts via a 3-tier lookup:
 *   1. Pre-bundled JSON (CELPIP videos already fetched)
 *   2. AsyncStorage cache (previously fetched on-device)
 *   3. YouTube watch page: captions first, then description as fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import BUNDLED_TRANSCRIPTS from '../data/transcripts.json';

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

const CACHE_PREFIX = '@EasyWord:transcript:';

// Lines to strip from VOA descriptions
const DESCRIPTION_NOISE = [
  /^welcome to the voice of america/i,
  /^learning english is voice of america/i,
  /^-{3,}/,
  /^={3,}/,
  /^\*{3,}/,
  /^learn more at/i,
  /^subscribe/i,
  /^follow us/i,
  /^https?:\/\//i,
];

function descriptionToSegments(description: string): TranscriptSegment[] {
  // Unescape \n sequences that survive JSON parsing
  const text = description.replace(/\\n/g, '\n');

  // Split into non-empty lines, then split each line into sentences
  const sentences: string[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || DESCRIPTION_NOISE.some((re) => re.test(trimmed))) continue;

    // Split on sentence boundaries
    for (const part of trimmed.split(/(?<=[.!?])\s+/)) {
      const s = part.trim();
      if (s.length > 4) sentences.push(s);
    }
  }

  if (sentences.length === 0) return [];

  // Distribute sentences evenly across an estimated 100-second video
  const estimatedDurationMs = 100_000;
  const perSegment = Math.floor(estimatedDurationMs / sentences.length);

  return sentences.map((text, i) => ({
    text,
    offset:   i * perSegment,
    duration: perSegment,
  }));
}

async function fetchFromYouTube(videoId: string): Promise<TranscriptSegment[]> {
  // Fetch the YouTube watch page once; use it for both approaches
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!pageRes.ok) throw new Error(`YouTube page returned HTTP ${pageRes.status}`);

  const html = await pageRes.text();

  // ── Approach 1: timed captions ─────────────────────────────────────────────
  const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
  if (captionMatch) {
    try {
      const tracks: any[] = JSON.parse(captionMatch[1]);
      const track =
        tracks.find((t: any) => t.languageCode === 'en' && !t.kind) ||
        tracks.find((t: any) => t.languageCode === 'en') ||
        tracks[0];

      if (track?.baseUrl) {
        const sep = track.baseUrl.includes('?') ? '&' : '?';
        const transcriptRes = await fetch(`${track.baseUrl}${sep}fmt=json3`, {
          headers: { 'Accept-Language': 'en-US' },
        });

        if (transcriptRes.ok) {
          const raw = await transcriptRes.text();
          const json = JSON.parse(raw);
          const segments: TranscriptSegment[] = (json.events ?? [])
            .filter((e: any) => e.segs)
            .map((e: any) => ({
              text: e.segs
                .map((s: any) => s.utf8 ?? '')
                .join('')
                .replace(/\n/g, ' ')
                .trim(),
              offset:   e.tStartMs    ?? 0,
              duration: e.dDurationMs ?? 2000,
            }))
            .filter((s: TranscriptSegment) => s.text);

          if (segments.length > 0) return segments;
        }
      }
    } catch {
      // fall through to description approach
    }
  }

  // ── Approach 2: video description as transcript ────────────────────────────
  const descMatch = html.match(/"shortDescription":"(.*?)","isCrawlable"/s);
  if (descMatch) {
    // The description is JSON-string-escaped inside the HTML
    let raw = descMatch[1];
    // Decode JSON escape sequences
    try {
      raw = JSON.parse(`"${raw}"`);
    } catch {
      raw = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    const segments = descriptionToSegments(raw);
    if (segments.length > 0) return segments;
  }

  throw new Error('No transcript or description found for this video');
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  // 1. Bundled
  const bundled = (BUNDLED_TRANSCRIPTS as Record<string, TranscriptSegment[]>)[videoId];
  if (bundled && bundled.length > 0) return bundled;

  // 2. AsyncStorage cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + videoId);
    if (cached) {
      const parsed: TranscriptSegment[] = JSON.parse(cached);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore cache read errors
  }

  // 3. Fetch from YouTube and cache
  const segments = await fetchFromYouTube(videoId);

  try {
    await AsyncStorage.setItem(CACHE_PREFIX + videoId, JSON.stringify(segments));
  } catch {
    // ignore cache write errors
  }

  return segments;
}

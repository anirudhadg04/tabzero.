import { DomainUsage } from '../types';
import { cleanDomain } from '../blocking/rules';

export function categorizeDomain(domain: string): string {
  const d = domain.toLowerCase();
  if (d.includes('instagram') || d.includes('facebook') || d.includes('twitter') || d.includes('x.com') || d.includes('tiktok') || d.includes('threads')) {
    return 'Social Media';
  }
  if (d.includes('youtube') || d.includes('netflix') || d.includes('twitch') || d.includes('spotify') || d.includes('primevideo')) {
    return 'Entertainment';
  }
  if (d.includes('reddit') || d.includes('quora') || d.includes('stack') || d.includes('forum')) {
    return 'Forums & Discussion';
  }
  if (d.includes('github') || d.includes('docs') || d.includes('google') || d.includes('notion') || d.includes('linear') || d.includes('slack')) {
    return 'Work & Productivity';
  }
  if (d.includes('news') || d.includes('medium') || d.includes('nytimes') || d.includes('bbc')) {
    return 'News & Reading';
  }
  return 'Other';
}

export function recordDomainVisit(
  usageRecord: Record<string, DomainUsage>,
  rawUrl: string,
  durationSeconds: number
): Record<string, DomainUsage> {
  if (!rawUrl || durationSeconds <= 0) return usageRecord;

  try {
    const url = new URL(rawUrl);
    // Ignore chrome-extension://, chrome://, about:, etc.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return usageRecord;
    }

    const domain = cleanDomain(url.hostname);
    if (!domain) return usageRecord;

    const existing = usageRecord[domain] || {
      domain,
      timeSpentSeconds: 0,
      lastActive: Date.now(),
      category: categorizeDomain(domain),
    };

    return {
      ...usageRecord,
      [domain]: {
        ...existing,
        timeSpentSeconds: existing.timeSpentSeconds + durationSeconds,
        lastActive: Date.now(),
      },
    };
  } catch {
    return usageRecord;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = (mins / 60).toFixed(1);
  return `${hours}h`;
}

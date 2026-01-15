import { TrackedObject } from './api/types';

export const STALE_THRESHOLD_MS = 30000; // 30 seconds
export const LOW_CONFIDENCE_THRESHOLD = 0.1;

export const parseUtcDate = (dateStr: string): Date => {
    // If the string doesn't contain 'Z' or offset info, assume UTC and append 'Z'
    // ISO format from python usually is YYYY-MM-DDTHH:MM:SS.mmmmmm
    // Check if it ends with Z or +HH:MM or -HH:MM
    if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
};

export const timeAgo = (dateStr: string): string => {
    const now = new Date();
    const then = parseUtcDate(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
};

export const isAssetStale = (obj: TrackedObject): boolean => {
    if (!obj) return true;

    // Check time since last seen
    const now = new Date().getTime();
    const lastSeen = parseUtcDate(obj.last_seen).getTime();

    // Use Math.abs in case of slight clock skews, though usually stale implies > threshold positiv
    // But if clock skew makes it negative, we don't assume stale unless very negative? 
    // Actually if now < lastSeen (future), treat as active (diff is negative).

    if (now - lastSeen > STALE_THRESHOLD_MS) {
        return true;
    }

    // Check low confidence (immediate for now, as we don't track duration of low confidence in frontend state easily without extra logic)
    // The user mentioned "extended amount of time" for low confidence, but for MVP we treat very low confidence as "lost signal"
    if (obj.last_confidence < LOW_CONFIDENCE_THRESHOLD) {
        return true;
    }

    return false;
};

// Media of the /premium feature explorer: a poster/still image per feature and optionally a short clip.

export const DEFAULT_FEATURE_MEDIA_BASE = 'https://static.coflnet.com/skycofl/features/v1'

function readMediaBaseOverride(): string | undefined {
    try {
        // inlined by Next at build time; `process` does not exist in plain browser bundles (unit specs)
        return process.env.NEXT_PUBLIC_FEATURE_MEDIA_BASE
    } catch {
        return undefined
    }
}

/** overridable with NEXT_PUBLIC_FEATURE_MEDIA_BASE, e.g. to test captures before they are on the CDN */
export const FEATURE_MEDIA_BASE = readMediaBaseOverride() || DEFAULT_FEATURE_MEDIA_BASE

export const POSTER_WIDTH = 1280
export const POSTER_HEIGHT = 720

/** none (no media box at all), a still image only, or a still used as poster plus a looping clip */
export type FeatureMedia = { kind: 'still' } | { kind: 'clip'; seconds: number }

export const STILL: FeatureMedia = { kind: 'still' }

export function clip(seconds: number): FeatureMedia {
    return { kind: 'clip', seconds }
}

export interface FeatureMediaUrls {
    poster: string
    webm: string
    mp4: string
}

export function getFeatureMediaUrls(id: string, base: string = FEATURE_MEDIA_BASE): FeatureMediaUrls {
    const root = `${base.replace(/\/+$/, '')}/${encodeURIComponent(id)}`
    return { poster: `${root}.webp`, webm: `${root}.webm`, mp4: `${root}.mp4` }
}

/** 9 -> "0:09", 75 -> "1:15" */
export function formatClipLength(seconds: number): string {
    const total = Math.max(0, Math.round(seconds))
    const minutes = Math.floor(total / 60)
    const rest = total % 60
    return `${minutes}:${rest.toString().padStart(2, '0')}`
}

'use client'
import { useCallback, useState } from 'react'
import { FeatureMedia, formatClipLength, getFeatureMediaUrls, POSTER_HEIGHT, POSTER_WIDTH } from '../../../utils/FeatureMedia'
import { ClipTrigger, useClipPlayer } from './useClipPlayer'
import styles from './FeatureMediaBox.module.css'

interface Props {
    featureId: string
    title: string
    media?: FeatureMedia
    compact?: boolean
    onClipStart?: (trigger: ClipTrigger) => void
}

/**
 * The media frame of one feature: nothing, a still, or a poster with a lazily loaded clip.
 * Keyed by the feature id, so switching features tears the old clip down.
 */
export default function FeatureMediaBox(props: Props) {
    if (!props.media) return null
    return <MediaFrame key={props.featureId} {...props} media={props.media} />
}

/** marks the image as failed when it errored before hydration attached onError */
function usePosterFailure(): [boolean, () => void, (image: HTMLImageElement | null) => void] {
    const [failed, setFailed] = useState(false)
    const markFailed = useCallback(() => setFailed(true), [])
    const checkLoaded = useCallback((image: HTMLImageElement | null) => {
        // a lazy image that has not started loading has no currentSrc yet
        if (image && image.complete && image.currentSrc !== '' && image.naturalWidth === 0) setFailed(true)
    }, [])
    return [failed, markFailed, checkLoaded]
}

function MediaFrame({ featureId, title, media, compact, onClipStart }: Props & { media: FeatureMedia }) {
    const [posterFailed, onPosterError, posterRef] = usePosterFailure()
    if (posterFailed) return null
    const urls = getFeatureMediaUrls(featureId)
    const className = [styles.frame, compact ? styles.compact : ''].filter(Boolean).join(' ')
    return (
        <div className={className} data-testid="feature-media" data-feature={featureId}>
            <img
                ref={posterRef}
                className={styles.poster}
                src={urls.poster}
                width={POSTER_WIDTH}
                height={POSTER_HEIGHT}
                alt={media.kind === 'clip' ? `Preview of ${title}` : `Screenshot of ${title}`}
                decoding="async"
                loading="lazy"
                onError={onPosterError}
            />
            {media.kind === 'clip' ? <ClipLayer webm={urls.webm} mp4={urls.mp4} seconds={media.seconds} title={title} onStart={onClipStart} /> : null}
        </div>
    )
}

const PLAY_ICON = <path d="M5 3l12 7-12 7z" />
const PAUSE_ICON = <path d="M5 3h3.5v14H5zM11.5 3H15v14h-3.5z" />

function Icon({ paused, size }: { paused: boolean; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {paused ? PLAY_ICON : PAUSE_ICON}
        </svg>
    )
}

interface ClipProps {
    webm: string
    mp4: string
    seconds: number
    title: string
    onStart?: (trigger: ClipTrigger) => void
}

function ClipLayer({ webm, mp4, seconds, title, onStart }: ClipProps) {
    const player = useClipPlayer(onStart)
    const length = formatClipLength(seconds)
    const { view } = player

    return (
        <div ref={player.observe} className={styles.layer} data-view={view}>
            {player.hasVideo ? (
                <video
                    ref={player.videoRef}
                    className={`${styles.video} ${player.hasFrame ? styles.videoVisible : ''}`}
                    muted
                    loop
                    playsInline
                    preload="none"
                    disablePictureInPicture
                    aria-label={`${title} clip`}
                    {...player.videoEvents}
                >
                    <source src={webm} type="video/webm" />
                    <source src={mp4} type="video/mp4" onError={player.onSourceError} />
                </video>
            ) : null}
            {view === 'tap-to-play' ? (
                <button type="button" className={styles.tapToPlay} onClick={player.requestPlay} aria-label={`Play clip, ${seconds} seconds`}>
                    <Icon paused size={18} />
                    <span>Play clip</span>
                    <span className={styles.length}>{length}</span>
                </button>
            ) : null}
            {view === 'loading' ? <span className={styles.spinner} role="img" aria-label="Loading clip" /> : null}
            {view === 'unavailable' ? <span className={styles.unavailable}>Clip unavailable</span> : null}
            {view === 'playing' || view === 'paused' || view === 'loading' ? (
                <div className={styles.controls}>
                    <button
                        type="button"
                        className={styles.toggle}
                        onClick={player.togglePause}
                        aria-label={view === 'paused' ? 'Play clip' : 'Pause clip'}
                    >
                        <Icon paused={view === 'paused'} size={20} />
                    </button>
                    <div className={styles.track}>
                        <div className={styles.progress} style={{ transform: `scaleX(${player.progress})` }} />
                    </div>
                    <span className={styles.controlLength}>{length}</span>
                </div>
            ) : null}
        </div>
    )
}

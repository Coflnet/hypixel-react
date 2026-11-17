'use client'
import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useAutoplayPolicy } from '../../../hooks/useAutoplayPolicy'
import { useInView } from '../../../hooks/useInView'
import { usePageVisible } from '../../../hooks/usePageVisible'
import { shouldLoadClip, shouldPlayClip } from '../../../utils/ClipAutoplay'

export type ClipTrigger = 'auto' | 'tap'
export type ClipView = 'still' | 'tap-to-play' | 'loading' | 'playing' | 'paused' | 'unavailable'

/** stops the download of a removed or replaced clip */
function tearDownVideo(video: HTMLVideoElement) {
    video.pause()
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'))
    video.removeAttribute('src')
    video.load()
}

/**
 * React also detaches the ref of a video it keeps (StrictMode re-attaches every ref once in development, hidden
 * content detaches too). Tearing that one down would strip its sources for good, so only a removed video is torn down.
 */
export function tearDownWhenRemoved(video: HTMLVideoElement, schedule: (task: () => void) => void = task => setTimeout(task)) {
    schedule(() => {
        if (!video.isConnected) tearDownVideo(video)
    })
}

function isAutoplayRefusal(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError'
}

/** plays or pauses the video whenever the decision changes */
function usePlaybackSync(video: HTMLVideoElement | null, play: boolean, onRefused: () => void) {
    const onRefusedRef = useRef(onRefused)
    onRefusedRef.current = onRefused
    useEffect(() => {
        if (!video) return
        if (!play) {
            video.pause()
            return
        }
        video.play().catch(error => {
            // an AbortError only means a pause interrupted the start
            if (isAutoplayRefusal(error)) onRefusedRef.current()
        })
    }, [video, play])
}

function getView(started: boolean, failed: boolean, manual: boolean, playing: boolean, buffering: boolean, userPaused: boolean): ClipView {
    if (failed) return 'unavailable'
    if (!started) return manual ? 'tap-to-play' : 'still'
    if (userPaused) return 'paused'
    if (buffering) return 'loading'
    return playing ? 'playing' : 'paused'
}

/**
 * Lazy, policy-aware clip playback. The <video> only exists once the clip is wanted:
 * autoplay when at least half visible and allowed (no reduced motion, data saver or touch-first device),
 * otherwise after a tap. Pauses when scrolled away or the tab is hidden.
 */
export function useClipPlayer(onStart?: (trigger: ClipTrigger) => void) {
    const policy = useAutoplayPolicy()
    const pageVisible = usePageVisible()
    const [observe, { inView, visible }] = useInView<HTMLDivElement>(0.5)
    const [started, setStarted] = useState(false)
    const [trigger, setTrigger] = useState<ClipTrigger>('auto')
    const [userPaused, setUserPaused] = useState(false)
    const [failed, setFailed] = useState(false)
    const [refused, setRefused] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [buffering, setBuffering] = useState(true)
    const [progress, setProgress] = useState(0)
    const [video, setVideo] = useState<HTMLVideoElement | null>(null)
    const reported = useRef(false)

    const manual = refused || policy === 'manual'
    const tapped = trigger === 'tap'
    const state = { policy: refused ? 'manual' : policy, inView, visible, pageVisible, started, tapped, userPaused, failed } as const
    const load = shouldLoadClip(state)
    if (load && !started) setStarted(true)

    usePlaybackSync(video, shouldPlayClip(state), () => {
        // refused even after a tap: show the clip as unavailable instead of offering the same tap again
        if (tapped) return setFailed(true)
        setRefused(true)
        setStarted(false)
    })

    const videoRef = useCallback((element: HTMLVideoElement | null) => {
        if (!element) return
        element.muted = true
        setVideo(element)
        return () => {
            tearDownWhenRemoved(element)
            setVideo(null)
        }
    }, [])

    function requestPlay() {
        setTrigger('tap')
        setUserPaused(false)
        setStarted(true)
    }

    function togglePause() {
        if (!started) return requestPlay()
        setUserPaused(paused => !paused)
    }

    const videoEvents = {
        onPlaying: () => {
            setPlaying(true)
            setBuffering(false)
            if (reported.current) return
            reported.current = true
            onStart?.(trigger)
        },
        onPause: () => setPlaying(false),
        onWaiting: () => setBuffering(true),
        onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => {
            const { currentTime, duration } = event.currentTarget
            if (duration > 0) setProgress(currentTime / duration)
        },
        onError: (event: SyntheticEvent<HTMLVideoElement>) => {
            if (event.currentTarget.isConnected) setFailed(true)
        }
    }

    return {
        observe,
        videoRef,
        hasVideo: started && !failed,
        hasFrame: playing || progress > 0,
        view: getView(started, failed, manual, playing, buffering, userPaused),
        progress,
        requestPlay,
        togglePause,
        videoEvents,
        /** torn-down sources (src removed) also report errors; only a real load failure counts */
        onSourceError: (event: SyntheticEvent<HTMLSourceElement>) => {
            if (event.currentTarget.getAttribute('src')) setFailed(true)
        }
    }
}

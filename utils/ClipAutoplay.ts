// Pure decisions of the feature clip player, kept apart from the DOM so they can be unit tested.

export interface AutoplayEnvironment {
    reducedMotion: boolean
    saveData: boolean
    touchFirst: boolean
}

/** 'unknown' until the client knows the environment (server render and first client render) */
export type AutoplayPolicy = 'unknown' | 'auto' | 'manual'

export function getAutoplayPolicy(environment: AutoplayEnvironment | null): AutoplayPolicy {
    if (!environment) return 'unknown'
    if (environment.reducedMotion || environment.saveData || environment.touchFirst) return 'manual'
    return 'auto'
}

export interface PlaybackState {
    policy: AutoplayPolicy
    /** the stage is at least half visible */
    inView: boolean
    /** any part of the stage is visible */
    visible: boolean
    pageVisible: boolean
    /** the clip was already started, by autoplay or by a tap on play */
    started: boolean
    /** the visitor started it with a tap */
    tapped: boolean
    /** the user pressed pause */
    userPaused: boolean
    /** the clip failed to load */
    failed: boolean
}

/** whether the <video> element should exist; once started it stays until the feature changes */
export function shouldLoadClip(state: PlaybackState): boolean {
    if (state.failed) return false
    if (state.started) return true
    return state.policy === 'auto' && state.inView && state.pageVisible
}

/** autoplayed clips pause below half visibility; a clip the visitor tapped keeps playing while any part is visible */
export function shouldPlayClip(state: PlaybackState): boolean {
    if (!shouldLoadClip(state) || state.userPaused || !state.pageVisible) return false
    return state.tapped ? state.visible : state.inView
}

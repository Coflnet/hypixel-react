import api from '../api/ApiHelper'
import { NOTIFIER_LAST_CHANNELS, getSettingsObject, setSetting } from './SettingsUtils'
import { isClientSideRendering } from './SSRUtils'
import { findInGameNeverTarget, isNotificationType } from './NotificationUtils'

/**
 * User-facing model of where a notifier should deliver. This is plain UI state: the actual
 * NotificationTarget rows are only created/looked up at submit time via resolveChannelSelection.
 */
export interface ChannelSelection {
    /** in-game chat, on by default; when false a shared "in-game disabled" marker target is attached */
    inGame: boolean
    /** push to this device; only true once browser permission + FCM token have been obtained */
    push: boolean
    /** null = Discord row unchecked; string (incl. '') = checked and being typed */
    newDiscordUrl: string | null
    /** optional label for the new Discord webhook; prefilled with the fetched webhook name, user-overridable */
    newDiscordName?: string
    /** ids of other existing targets (past webhooks, other devices, legacy targets) toggled on */
    existingTargetIds: number[]
}

const MAX_TARGET_NAME_LENGTH = 32

export function isValidDiscordWebhookUrl(url: string): boolean {
    let trimmed = url.trim()
    return trimmed.startsWith('https://discord.com/api/') || trimmed.startsWith('https://discordapp.com/api/webhooks/')
}

/** Builds a friendly name for the current browser/device, e.g. "Chrome on Linux". */
export function getDeviceName(): string {
    if (typeof navigator === 'undefined') {
        return 'This device'
    }
    let ua = navigator.userAgent
    let browser = 'Browser'
    // order matters: Edge/Opera UAs also contain "Chrome", Chrome's UA also contains "Safari"
    if (/Edg\//.test(ua)) browser = 'Edge'
    else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = 'Opera'
    else if (/Firefox\//.test(ua)) browser = 'Firefox'
    else if (/Chrome\//.test(ua)) browser = 'Chrome'
    else if (/Safari\//.test(ua)) browser = 'Safari'

    let os = 'device'
    if (/Windows/.test(ua)) os = 'Windows'
    else if (/Android/.test(ua)) os = 'Android'
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
    else if (/Mac OS X/.test(ua)) os = 'macOS'
    else if (/Linux/.test(ua)) os = 'Linux'

    return `${browser} on ${os}`.slice(0, MAX_TARGET_NAME_LENGTH)
}

/** Discord serves an unauthenticated GET on webhook URLs returning { name, ... }; used only to label the row. */
export async function fetchWebhookName(url: string): Promise<string | null> {
    try {
        let controller = new AbortController()
        let timeout = setTimeout(() => controller.abort(), 2000)
        let res = await fetch(url.trim(), { signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) {
            return null
        }
        let data = await res.json()
        return data?.name || null
    } catch {
        return null
    }
}

function getStoredFcmToken(): string | null {
    return isClientSideRendering() ? localStorage.getItem('fcmToken') : null
}

/** The FIREBASE target that represents the current browser (matched by the stored FCM token). */
export function findDeviceTarget(targets: NotificationTarget[]): NotificationTarget | undefined {
    let token = getStoredFcmToken()
    if (!token) {
        return undefined
    }
    return targets.find(t => isNotificationType(t.type, 'FIREBASE') && t.target === token)
}

/**
 * Extra target rows to show below the three standard channels: everything that isn't the current
 * device (shown as "This device") and isn't an in-game marker (owned by the in-game toggle).
 */
export function getExtraTargets(targets: NotificationTarget[]): NotificationTarget[] {
    let deviceTarget = findDeviceTarget(targets)
    return targets.filter(t => {
        if (isNotificationType(t.type, 'InGame')) return false
        if (deviceTarget && t.id === deviceTarget.id) return false
        return true
    })
}

export function isChannelSelectionValid(selection: ChannelSelection): boolean {
    let discordChecked = selection.newDiscordUrl !== null
    if (discordChecked && !isValidDiscordWebhookUrl(selection.newDiscordUrl || '')) {
        return false
    }
    return selection.inGame || selection.push || discordChecked || selection.existingTargetIds.length > 0
}

export function getInitialChannelSelection(targets: NotificationTarget[], prefillTargetIds?: number[]): ChannelSelection {
    let deviceTarget = findDeviceTarget(targets)

    let filterExtras = (ids: number[]) =>
        ids.filter(id => {
            let t = targets.find(t => t.id === id)
            if (!t) return false // stale id, target no longer exists
            if (isNotificationType(t.type, 'InGame')) return false // owned by the in-game toggle
            if (deviceTarget && t.id === deviceTarget.id) return false // owned by the push toggle
            return true
        })

    // edit mode: derive the selection from the notifier's attached targets
    if (prefillTargetIds) {
        let inGameMarker = findInGameNeverTarget(targets)
        let inGame = !(inGameMarker && inGameMarker.id !== undefined && prefillTargetIds.includes(inGameMarker.id))
        let push = deviceTarget?.id !== undefined && prefillTargetIds.includes(deviceTarget.id)
        return { inGame, push, newDiscordUrl: null, existingTargetIds: filterExtras(prefillTargetIds) }
    }

    // create mode: start from the remembered selection
    let remembered = getSettingsObject<{ inGame: boolean; push: boolean; targetIds: number[] }>(NOTIFIER_LAST_CHANNELS, {
        inGame: true,
        push: false,
        targetIds: []
    })
    let permissionGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted'
    let push = !!remembered.push && !!deviceTarget && permissionGranted
    return {
        inGame: remembered.inGame ?? true,
        push,
        newDiscordUrl: null,
        existingTargetIds: filterExtras(remembered.targetIds || [])
    }
}

/** Persists the selection so the next notifier starts with the same channels pre-selected. */
export function rememberChannelSelection(selection: ChannelSelection, resolvedTargets: NotificationTarget[]) {
    let token = getStoredFcmToken()
    let targetIds = resolvedTargets
        .filter(t => !isNotificationType(t.type, 'InGame')) // in-game state tracked separately
        .filter(t => !(token && t.target === token)) // device tracked by the push flag
        .map(t => t.id)
        .filter((id): id is number => id !== undefined)
    setSetting(NOTIFIER_LAST_CHANNELS, JSON.stringify({ inGame: selection.inGame, push: selection.push, targetIds }))
}

/**
 * Turns a ChannelSelection into the concrete NotificationTarget list to pass into api.subscribe,
 * creating any targets that don't exist yet (device, Discord webhook, in-game marker).
 * Throws if a required target can't be created, so no listener is created on failure.
 */
export async function resolveChannelSelection(selection: ChannelSelection, targets: NotificationTarget[]): Promise<NotificationTarget[]> {
    let resolved: NotificationTarget[] = []

    // 1. extra existing targets the user toggled on
    selection.existingTargetIds.forEach(id => {
        let t = targets.find(t => t.id === id)
        if (t && !isNotificationType(t.type, 'InGame')) {
            resolved.push(t)
        }
    })

    // 2. this device (push)
    if (selection.push) {
        let token = getStoredFcmToken()
        if (!token) {
            throw new Error('Push notifications are not set up. Please re-enable "This device".')
        }
        let existing = findDeviceTarget(targets)
        if (existing) {
            if (!resolved.some(t => t.id === existing!.id)) {
                resolved.push(existing)
            }
        } else {
            let created = await api.addNotificationTarget({
                id: undefined,
                type: 'FIREBASE',
                when: 'ALWAYS',
                target: token,
                name: getDeviceName(),
                useCount: 0
            })
            resolved.push(created)
        }
    }

    // 3. new Discord webhook
    if (selection.newDiscordUrl !== null && isValidDiscordWebhookUrl(selection.newDiscordUrl)) {
        let url = selection.newDiscordUrl.trim()
        let existing = targets.find(t => t.target === url)
        if (existing) {
            if (!resolved.some(t => t.id === existing!.id)) {
                resolved.push(existing)
            }
        } else {
            // prefer the label the user typed, fall back to the webhook's own name, then a generic default
            let name = (selection.newDiscordName || '').trim() || (await fetchWebhookName(url)) || 'Discord webhook'
            let created = await api.addNotificationTarget({
                id: undefined,
                type: 'DiscordWebhook',
                when: 'ALWAYS',
                target: url,
                name: name.slice(0, MAX_TARGET_NAME_LENGTH),
                useCount: 0
            })
            resolved.push(created)
        }
    }

    // 4. in-game disabled marker (only when the user turned in-game off)
    if (!selection.inGame) {
        let marker = findInGameNeverTarget(targets)
        if (!marker) {
            marker = await api.addNotificationTarget({
                id: undefined,
                type: 'InGame',
                when: 'NEVER',
                target: null,
                name: 'In-game disabled',
                useCount: 0
            })
        }
        // attach as a disabled connection so it is never sent to, even before the backend update ships
        resolved.push({ ...marker, isDisabled: true })
    }

    return resolved
}

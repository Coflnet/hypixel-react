import { toast } from 'react-toastify'
import {
    deleteApiNotificationsListeners,
    deleteApiNotificationsSubscriptions,
    deleteApiNotificationsTargets,
    getApiNotificationsListeners,
    getApiNotificationsSubscriptions,
    getApiNotificationsTargets,
    postApiNotificationsListeners,
    postApiNotificationsSubscriptions,
    postApiNotificationsTargets,
    postApiNotificationsTargetsTest,
    putApiNotificationsTargets
} from './_generated/skyApi'
import { NotificationListener, SubscriptionType } from './ApiTypes.d'
import { parseSubscription } from '../utils/Parser/APIResponseParser'
import { isClientSideRendering } from '../utils/SSRUtils'
import { canUseClipBoard, writeToClipboard } from '../utils/ClipboardUtils'

/**
 * All notifier related calls (listeners, subscriptions and targets) go through the generated
 * sky.coflnet.com client. Nothing in here may touch the websocket: it retries forever instead of
 * failing when the connection isn't ready, which used to leave the notifier dialog hanging.
 */

interface ApiError extends Error {
    slug?: string
    traceId?: string
    /** set once the error has been shown to the user, so callers don't toast it a second time */
    wasToasted?: boolean
}

/** True for errors this module has already shown a toast for. */
export function wasErrorShownToUser(error: any): boolean {
    return !!(error as ApiError)?.wasToasted
}

export function getGoogleToken(): string | null {
    if (!isClientSideRendering()) {
        return null
    }
    return sessionStorage.getItem('googleId') || localStorage.getItem('googleId')
}

function authOptions(): RequestInit {
    let token = getGoogleToken()
    if (!token) {
        throw createError('You need to be logged in to manage notifiers.')
    }
    return {
        headers: {
            GoogleToken: token
        }
    }
}

function createError(message: string, slug?: string, traceId?: string): ApiError {
    let error: ApiError = new Error(message)
    error.slug = slug
    error.traceId = traceId
    return error
}

/**
 * The generated client resolves for every status code, so success has to be checked by hand.
 * Error bodies are either a { slug, message, traceId } object or plain text.
 */
function unwrap<T>(response: { data: any; status: number }, fallbackMessage: string): T {
    if (response.status >= 200 && response.status < 300) {
        return response.data as T
    }
    let data: any = response.data
    if (typeof data === 'string' && data) {
        throw createError(data)
    }
    throw createError(data?.message || fallbackMessage, data?.slug, data?.traceId)
}

/** Shows the same error toast the rest of the api uses, then rethrows so callers can react. */
export function handleNotificationApiError(error: any): never {
    let apiError = error as ApiError
    if (isClientSideRendering() && apiError?.message && !apiError.wasToasted) {
        apiError.wasToasted = true
        if (apiError.slug === 'subscription_limit_reached' || apiError.message.includes('subscription_limit_reached')) {
            toast.error(
                <span>
                    You have reached the free subscription limit.{' '}
                    <a
                        href="/premium"
                        style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}
                        onClick={() => {
                            window.location.href = '/premium'
                        }}
                    >
                        Upgrade to Starter Premium
                    </a>{' '}
                    for under 2€/month to unlock more notifiers.
                </span>,
                { autoClose: 15000 }
            )
            throw error
        }
        toast.error(apiError.message, {
            onClick: () => {
                if (apiError.traceId && canUseClipBoard()) {
                    writeToClipboard(apiError.traceId)
                    toast.success(
                        <span>
                            Copied the error trace to the clipboard. Please use this to ask for help on our{' '}
                            <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                                Discord
                            </a>
                            .
                        </span>
                    )
                }
            }
        })
    }
    throw error
}

/** The api models the subscription types as a bitmask sum. NONE is always part of it. */
function getTypeBitmask(types: SubscriptionType[]): number {
    return [...types, SubscriptionType.NONE]
        .map(type => (typeof type === 'number' ? type : parseInt(SubscriptionType[type])))
        .reduce((a, b) => a + b, 0)
}

function serializeFilter(filter?: ItemFilter): string | undefined {
    if (!filter) {
        return undefined
    }
    let toSend = { ...filter }
    toSend._hide = undefined
    toSend._sellerName = undefined
    return JSON.stringify(toSend)
}

export async function getNotificationTargets(): Promise<NotificationTarget[]> {
    try {
        let response = await getApiNotificationsTargets(authOptions())
        return unwrap<NotificationTarget[]>(response, 'Could not load your notification targets.') || []
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function addNotificationTarget(target: NotificationTarget): Promise<NotificationTarget> {
    try {
        let response = await postApiNotificationsTargets(target as any, authOptions())
        return unwrap<NotificationTarget>(response, 'Could not create the notification target.')
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function updateNotificationTarget(target: NotificationTarget): Promise<NotificationTarget> {
    try {
        let response = await putApiNotificationsTargets(target as any, authOptions())
        return unwrap<NotificationTarget>(response, 'Could not update the notification target.')
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

/** The backend refuses to delete a target that a notifier still delivers to. */
export function isTargetInUseError(error: any): boolean {
    let message = typeof error === 'string' ? error : (error as ApiError)?.message
    // depending on the endpoint the error arrives as a slug, as a json body or as the plain english message
    return (
        (error as ApiError)?.slug === 'subscription_depends' ||
        !!message?.includes('subscription_depends') ||
        !!message?.includes('depending on this target')
    )
}

export async function deleteNotificationTarget(target: NotificationTarget): Promise<void> {
    try {
        let response = await deleteApiNotificationsTargets(target as any, authOptions())
        unwrap<void>(response, 'Could not delete the notification target.')
    } catch (e) {
        if (isTargetInUseError(e)) {
            // the caller points the user at the notifiers still using the channel, a generic error toast
            // on top of that would just say the same thing twice
            if (e instanceof Error) {
                ;(e as ApiError).wasToasted = true
            }
            throw e
        }
        return handleNotificationApiError(e)
    }
}

export async function sendTestNotification(target: NotificationTarget): Promise<void> {
    try {
        let response = await postApiNotificationsTargetsTest(target as any, authOptions())
        unwrap<void>(response, 'Could not send the test notification.')
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function getNotificationSubscriptions(): Promise<NotificationSubscription[]> {
    try {
        let response = await getApiNotificationsSubscriptions(authOptions())
        return unwrap<NotificationSubscription[]>(response, 'Could not load your notification subscriptions.') || []
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function createNotificationSubscription(subscription: NotificationSubscription): Promise<NotificationSubscription> {
    try {
        let response = await postApiNotificationsSubscriptions(subscription as any, authOptions())
        return unwrap<NotificationSubscription>(response, 'Could not link the notifier to the selected channels.')
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function deleteNotificationSubscription(subscription: NotificationSubscription): Promise<void> {
    try {
        let response = await deleteApiNotificationsSubscriptions(subscription as any, authOptions())
        unwrap<void>(response, 'Could not delete the notification subscription.')
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

export async function getNotificationListeners(): Promise<NotificationListener[]> {
    try {
        let response = await getApiNotificationsListeners(authOptions())
        let listeners = unwrap<any[]>(response, 'Could not load your notifiers.') || []
        return listeners.map(parseSubscription)
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

/**
 * Creates a notifier: a listener (what to watch for) plus a subscription linking it to the targets
 * (where to send it). If the linking fails the listener is rolled back, so a half created notifier
 * doesn't linger invisibly and count against the notifier limit.
 */
export async function createNotifier(
    topic: string,
    types: SubscriptionType[],
    targets: NotificationTarget[],
    price?: number,
    filter?: ItemFilter
): Promise<void> {
    let listener: any
    try {
        let response = await postApiNotificationsListeners(
            {
                topicId: topic,
                price: price || undefined,
                type: getTypeBitmask(types),
                filter: serializeFilter(filter)
            } as any,
            authOptions()
        )
        listener = unwrap<any>(response, 'Could not create the notifier.')
    } catch (e) {
        return handleNotificationApiError(e)
    }

    try {
        let response = await postApiNotificationsSubscriptions(
            {
                id: undefined,
                sourceSubIdRegex: listener?.id?.toString() || '',
                sourceType: 'Subscription',
                targets: targets.map(target => ({
                    id: target.id || 0,
                    name: target.name || '',
                    isDisabled: target.isDisabled ?? false,
                    priority: 0
                }))
            } as any,
            authOptions()
        )
        unwrap<void>(response, 'Could not link the notifier to the selected channels.')
    } catch (e) {
        // roll back the listener silently, the error of the failed linking is the one worth showing
        await deleteListenerRequest(listener).catch(rollbackError => console.error('rolling back the listener failed', rollbackError))
        return handleNotificationApiError(e)
    }
}

async function deleteListenerRequest(listener: { id?: number; topicId?: string | null; price?: number; type: number; filter?: string }) {
    let response = await deleteApiNotificationsListeners(listener as any, authOptions())
    unwrap<void>(response, 'Could not delete the notifier.')
}

export async function deleteNotifier(listener: NotificationListener): Promise<void> {
    try {
        await deleteListenerRequest({
            id: listener.id,
            topicId: listener.topicId,
            price: listener.price || undefined,
            type: getTypeBitmask(listener.types),
            filter: serializeFilter(listener.filter)
        })
    } catch (e) {
        return handleNotificationApiError(e)
    }
}

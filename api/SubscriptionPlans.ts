export interface SubscriptionPlan {
    productSlug: string
    title: string
    price: number
    currencyCode: string
    ownershipSeconds: number
    slotCount: number
    isUpgrade: boolean
}

export interface SubscriptionChangeResult {
    status: 'completed' | 'pending' | 'redirect'
    redirectUrl?: string
}

async function request<T>(externalId: string, path: string, method: string): Promise<T> {
    const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
    if (!token) throw new Error('Sign in to manage your subscription.')
    const response = await fetch(`https://sky.coflnet.com/api/premium/subscription/${encodeURIComponent(externalId)}/${path}`, {
        method,
        headers: { GoogleToken: token }
    })
    const body = await response.json()
    if (!response.ok) {
        throw new Error(response.status === 428
            ? 'Accept the current agreement on the Premium page before upgrading.'
            : body.message || body.Message || 'Your subscription could not be updated. Please try again.')
    }
    return body as T
}

export const getSubscriptionPlans = (id: string) => request<SubscriptionPlan[]>(id, 'plans', 'GET')
export const changeSubscriptionPlan = (id: string, slug: string) =>
    request<SubscriptionChangeResult>(id, `switch?targetProductSlug=${encodeURIComponent(slug)}`, 'PUT')

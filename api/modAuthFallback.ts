export function getFallbackModAuthUrl(origin: string, connectionId: string): string | null {
    if (origin !== 'https://sky-commands.coflnet.com') return null
    return `/api/mod/auth?${new URLSearchParams({ newId: connectionId })}`
}

export function postFallbackModAuth(origin: string, connectionId: string, options: RequestInit): Promise<Response> | null {
    const url = getFallbackModAuthUrl(origin, connectionId)
    return url ? fetch(url, { ...options, method: 'POST' }).then(response => {
        if (!response.ok) throw new Error(`Mod authentication failed (${response.status})`)
        return response
    }) : null
}

import React, { ReactNode } from 'react'

// kept free of JSX and heavy imports so unit-style Cypress specs can bundle it
export type RunInGameResult = { executed: boolean; receivers: number; fallback?: string | null }

export function getInGameToastMessage(command: string, result: RunInGameResult | null, copiedMessage: ReactNode): ReactNode {
    if (!result || !result.executed) {
        return copiedMessage
    }
    // createElement instead of JSX so the Cypress webpack preprocessor can bundle this file in unit-style specs
    if (result.fallback === 'no_cookie_pending_search') {
        return React.createElement('p', null, 'Queued ', React.createElement('i', null, command.replace(/^\/bz\s+/, '')), ' in your in-game bazaar panel (no booster cookie)')
    }
    return React.createElement('p', null, 'Ran ', React.createElement('i', null, command), ' in game')
}

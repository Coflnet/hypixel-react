import { ReactNode } from 'react'
import { toast, ToastOptions } from 'react-toastify'
import { postApiModExecute } from '../api/_generated/skyApi'
import { getGoogleToken } from '../api/NotificationApi'
import { writeToClipboard } from './ClipboardUtils'
import { getInGameToastMessage, RunInGameResult } from './InGameToastMessage'

const RUN_IN_GAME_TIMEOUT_MS = 4000

export { getInGameToastMessage }
export type { RunInGameResult }

async function runInGame(command: string, token: string): Promise<RunInGameResult | null> {
    try {
        let response = await postApiModExecute({ command }, { headers: { GoogleToken: token } })
        if (response.status !== 200) {
            return null
        }
        return response.data
    } catch {
        return null
    }
}

/**
 * Copies the command synchronously (inside the user gesture) and, if logged in, also asks the connected mod to run it.
 * The toast is shown once the API answered (max 4 seconds), otherwise the copied message is shown.
 */
export function copyAndRunInGame(command: string, opts: { copiedMessage: ReactNode; hideToast?: boolean; toastOptions?: ToastOptions }): void {
    if (typeof window === 'undefined') {
        return
    }
    writeToClipboard(command)

    let showToast = (result: RunInGameResult | null) => {
        if (opts.hideToast) {
            return
        }
        let message = getInGameToastMessage(command, result, opts.copiedMessage)
        toast.success(message, opts.toastOptions)
    }

    let token = getGoogleToken()
    if (!token) {
        showToast(null)
        return
    }
    let timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), RUN_IN_GAME_TIMEOUT_MS))
    Promise.race([runInGame(command, token), timeout]).then(showToast)
}

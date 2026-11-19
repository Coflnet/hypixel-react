import { atobUnicode } from './Base64Utils'

const STORAGE_KEY = 'skycoflTermsReminder'
export const TERMS_REMINDER_DELAY_MS = 12 * 60 * 60 * 1000

interface TermsReminder {
    agreementHash: string
    user: string
    showAfter: number
}

function userFromToken(token: string) {
    try {
        const claims = JSON.parse(atobUnicode(token.split('.')[1]))
        return String(claims.email ?? claims.sub ?? '').toLowerCase()
    } catch {
        return ''
    }
}

export function postponeTermsReminder(agreementHash: string, token: string) {
    const reminder: TermsReminder = {
        agreementHash,
        user: userFromToken(token),
        showAfter: Date.now() + TERMS_REMINDER_DELAY_MS
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminder))
    } catch {}
}

export function isTermsReminderPostponed(agreementHash: string, token: string) {
    try {
        const reminder = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as TermsReminder
        return reminder.agreementHash === agreementHash && reminder.user === userFromToken(token) && reminder.showAfter > Date.now()
    } catch {
        return false
    }
}

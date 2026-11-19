// Coflnet's legal pages that every page links to. The site is English; legal texts follow the browser language
// (German or English), like the agreement package on /premium.

export type LegalLocale = 'de' | 'en'

/** the legally required (§ 312k BGB) page to cancel contracts, hosted on coflnet.com */
const CANCEL_CONTRACT_URLS: Record<LegalLocale, string> = {
    en: 'https://coflnet.com/cancel-contract',
    de: 'https://coflnet.com/de/cancel-contract'
}

const CANCEL_CONTRACT_LABELS: Record<LegalLocale, string> = {
    en: 'Cancel contracts here',
    de: 'Verträge hier kündigen'
}

/** German for a German browser language, English otherwise */
export function getLegalLocaleOf(language: string | undefined): LegalLocale {
    return language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

/** the browser's legal locale; English while rendering on the server */
export function getLegalLocale(): LegalLocale {
    return getLegalLocaleOf(typeof navigator !== 'undefined' ? navigator.language : undefined)
}

export function getCancelContractUrl(locale: LegalLocale): string {
    return CANCEL_CONTRACT_URLS[locale]
}

export function getCancelContractLabel(locale: LegalLocale): string {
    return CANCEL_CONTRACT_LABELS[locale]
}

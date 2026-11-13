// DuckDuckgo on Android doesnt support the clipboard API, but the old execCommand
function isAndroidDuckDuckGo() {
    return navigator.userAgent.includes('DuckDuckGo') && navigator.userAgent.includes('Android')
}

export function canUseClipBoard() {
    if (typeof window === 'undefined') {
        return false
    }
    return window.navigator.clipboard || isAndroidDuckDuckGo()
}

/** Copies with the old execCommand when the clipboard API is missing; true when the copy worked. */
function copyWithTextarea(text: string): boolean {
    let textarea = document.createElement('textarea')
    textarea.style.position = 'fixed'
    textarea.style.width = '1px'
    textarea.style.height = '1px'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    document.body.appendChild(textarea)
    textarea.textContent = text
    textarea.focus()
    textarea.select()
    try {
        return document.execCommand('copy')
    } finally {
        textarea.remove()
    }
}

/**
 * Starts the copy synchronously (it has to happen inside the user gesture). The promise resolves to whether it worked and never rejects,
 * so callers that ignore it cause no unhandled rejection.
 */
export function writeToClipboard(text: string): Promise<boolean> {
    try {
        if (isAndroidDuckDuckGo() || !window.navigator.clipboard) {
            return Promise.resolve(copyWithTextarea(text))
        }
        return Promise.resolve(window.navigator.clipboard.writeText(text)).then(
            () => true,
            () => false
        )
    } catch {
        return Promise.resolve(false)
    }
}

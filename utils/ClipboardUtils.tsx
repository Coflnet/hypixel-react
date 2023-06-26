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

export function writeToClipboard(text: string) {
    if (isAndroidDuckDuckGo() || !window.navigator.clipboard) {
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
        document.execCommand('copy')
        textarea.remove()
    } else {
        window.navigator.clipboard.writeText(text)
    }
}

/** true for elements that consume typed characters (so single-key shortcuts must not fire there) */
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!target || typeof (target as HTMLElement).tagName !== 'string') {
        return false
    }
    const element = target as HTMLElement
    const tag = element.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable === true
}

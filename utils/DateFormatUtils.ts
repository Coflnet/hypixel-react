/**
 * Date and time text that is safe to render during SSR/hydration.
 * Until `useLocal` is true it uses a fixed format and time zone, so server and first client render match.
 */
export function formatDateAndTime(d: Date, useLocal: boolean): string {
    if (useLocal) {
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
    }
    // built from the ISO string instead of Intl, as ICU versions differ between Node and browsers (e.g. the space before AM/PM)
    return d.toISOString().slice(0, 19).replace('T', ' ') + ' UTC'
}

export function btoaUnicode(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_match, p1) {
            return String.fromCharCode(parseInt(p1, 16))
        })
    );
}

// Decoding base64 ⇢ UTF8

export function atobUnicode(str) {
    return decodeURIComponent(
        Array.prototype.map
            .call(atob(str), function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            })
            .join('')
    )
}

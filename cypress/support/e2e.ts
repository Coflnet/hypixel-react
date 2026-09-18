Cypress.on('uncaught:exception', err => {
    // Ignore only the known server/client hydration mismatch, never arbitrary errors.
    if (
        err.message.includes('Minified React error #418;') ||
        err.message.includes('Minified React error #423;') ||
        err.message.includes('Hydration failed because the initial UI does not match what was rendered on the server')
    ) {
        return false
    }
})

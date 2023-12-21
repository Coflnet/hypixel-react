Cypress.on('uncaught:exception', err => {
    return false
    // we check if the error is
    if (
        err.message.includes('Minified React error #418;') ||
        err.message.includes('Minified React error #423;') ||
        err.message.includes('Hydration failed because the initial UI does not match what was rendered on the server')
    ) {
        return false
    }
})

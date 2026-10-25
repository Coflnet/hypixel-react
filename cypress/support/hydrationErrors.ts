// e2e.ts ignores hydration mismatches globally, this records them so a test can assert that there are none
export function recordHydrationErrors(): string[] {
    const errors: string[] = []
    cy.on('uncaught:exception', err => {
        if (err.message.includes('Minified React error #418;')) {
            errors.push(err.message)
            return false
        }
    })
    return errors
}

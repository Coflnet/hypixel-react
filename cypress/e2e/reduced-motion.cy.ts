function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    return Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-reduced-motion', value }] }
    })
}

function durationInMs(cssDuration: string) {
    return Math.max(...cssDuration.split(',').map(part => (part.trim().endsWith('ms') ? parseFloat(part) : parseFloat(part) * 1000)))
}

describe('Reduced motion', () => {
    afterEach(() => {
        emulateReducedMotion('no-preference')
    })

    it('shows the offline banner without the slide-in animation', () => {
        emulateReducedMotion('reduce')
        cy.visit('/')
        cy.window().then(win => {
            Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => false })
            win.dispatchEvent(new win.Event('offline'))
        })
        cy.get('#offline-banner')
            .should('be.visible')
            .then($banner => {
                expect(durationInMs(getComputedStyle($banner[0]).animationDuration)).to.be.lessThan(1)
            })
    })
})

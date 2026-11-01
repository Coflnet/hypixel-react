function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    return Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-reduced-motion', value }] }
    })
}

function durationInMs(cssDuration: string) {
    return Math.max(...cssDuration.split(',').map(part => (part.trim().endsWith('ms') ? parseFloat(part) : parseFloat(part) * 1000)))
}

function setOnline(win: Cypress.AUTWindow, online: boolean) {
    Object.defineProperty(win.navigator, 'onLine', { configurable: true, get: () => online })
}

function changeConnection(online: boolean) {
    cy.window().then(win => {
        setOnline(win, online)
        win.dispatchEvent(new win.Event(online ? 'online' : 'offline'))
    })
}

describe('Reduced motion', () => {
    afterEach(() => {
        cy.then(() => emulateReducedMotion('no-preference'))
    })

    it('shows the offline banner without the slide-in animation', () => {
        cy.then(() => emulateReducedMotion('reduce'))
        // Offline before hydration: no 'offline' event reaches the app, it has to read navigator.onLine itself.
        cy.visit('/', { onBeforeLoad: win => setOnline(win, false) })
        cy.get('#offline-banner')
            .should('be.visible')
            .then($banner => {
                expect(durationInMs(getComputedStyle($banner[0]).animationDuration)).to.be.lessThan(1)
            })
        // The banner is only rendered after its listeners are attached, so these events are always seen.
        changeConnection(true)
        cy.get('#offline-banner').should('not.exist')
        changeConnection(false)
        cy.get('#offline-banner').should('be.visible')
    })
})

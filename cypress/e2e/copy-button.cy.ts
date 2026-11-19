describe('Copy button', () => {
    it('supports keyboard and pointer activation without sending copied tokens to analytics', () => {
        const token = 'private-copy-test-token'
        cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', {
            headers: { 'content-type': 'application/javascript' }, body: ''
        })
        cy.intercept('GET', '**/api/blacklist/status', { ip: '127.0.0.1', banned: false })
        cy.intercept('POST', '**/api/premium/user/owns', { body: {} })
        cy.visit('/wiki/api-access', {
            onBeforeLoad(window) {
                window.localStorage.setItem('googleId', token)
                Object.defineProperty(window.navigator, 'clipboard', {
                    configurable: true,
                    value: { writeText: cy.stub().as('copy').resolves() }
                })
            }
        })
        cy.contains('Token found (from your login)').parent().find('button').as('copyToken').focus()
        cy.press(Cypress.Keyboard.Keys.SPACE)
        cy.get('@copy').should('have.been.calledOnceWithExactly', token)
        cy.get('@copyToken').find('.bi-clipboard-check').should('exist')
        cy.get('@copyToken').click()
        cy.get('@copy').should('have.been.calledTwice')
        cy.window().should(window => {
            const events = (window as any)._paq.filter(event => event[0] === 'trackEvent' && event[1] === 'copyButtonClick')
            expect(events).to.have.length(2)
            expect(events.every(event => event[2] === 'copyToClipboard')).to.equal(true)
            expect(JSON.stringify(events)).not.to.contain(token)
        })
    })
})

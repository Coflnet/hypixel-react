const itemPath = '/item/ENCHANTMENT_SHARPNESS_6'

function replaceLoadingText(price: Element) {
    // Translators replace React-owned text nodes with their own elements.
    // Force that mutation even if the browser honors our translation opt-out.
    const document = price.ownerDocument
    const walker = document.createTreeWalker(price, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
        if (node.textContent !== '-') continue
        const translated = document.createElement('font')
        translated.textContent = 'translated loading text'
        node.parentNode!.replaceChild(translated, node)
        return
    }
    throw new Error('Loading price text was not found')
}

function translatePricesWhenLoading(window: Cypress.AUTWindow, onTranslated: () => void) {
    const labels = ['Avg Sell Price:', 'Avg Buy Price:']
    const observer = new window.MutationObserver(() => {
        const headings = Array.from(window.document.querySelectorAll('b'))
        const prices = labels.map(label => headings.find(heading => heading.textContent === label)?.parentElement)
        if (!prices.every(price => price?.querySelector('span')?.textContent === '-')) return

        observer.disconnect()
        prices.forEach((price, index) => {
            expect(price!.textContent).to.equal(`${labels[index]} -`)
            replaceLoadingText(price!)
        })
        onTranslated()
    })
    observer.observe(window.document, { childList: true, subtree: true, characterData: true })
}

describe('DOM translation protection', () => {
    it('opts out of DOM translation in the server HTML before hydration', () => {
        for (const path of [itemPath, '/bazaar']) {
            cy.request(path).then(({ body }) => {
                const document = new DOMParser().parseFromString(body, 'text/html')
                expect(document.documentElement.getAttribute('translate')).to.equal('no')
                expect(document.querySelector('meta[name="google"]')?.getAttribute('content')).to.equal('notranslate')
            })
        }
    })

    it('survives replaced loading text when Bazaar prices finish loading', () => {
        let releaseHistory: () => void
        const historyReady = new Promise<void>(resolve => {
            releaseHistory = resolve
        })
        cy.intercept('GET', '**/api/bazaar/ENCHANTMENT_SHARPNESS_6/history/*', request =>
            historyReady.then(() =>
                request.reply([
                    { timestamp: '2026-09-01T12:00:00Z', buy: 800000, sell: 790000 },
                    { timestamp: '2026-09-01T12:05:00Z', buy: 800000, sell: 790000 }
                ])
            )
        ).as('history')
        cy.intercept('GET', '**/api/bazaar/ENCHANTMENT_SHARPNESS_6/snapshot*', { body: null })
        cy.intercept('GET', '**/api/mayor*', [])
        cy.visit(itemPath, {
            onBeforeLoad(window) {
                window.sessionStorage.clear()
                // Translate and release the response without waiting for cy.visit to finish.
                translatePricesWhenLoading(window, releaseHistory)
            }
        })

        cy.wait('@history')
        cy.contains('b', 'Avg Buy Price:').parent().should('contain.text', '800,000 Coins')
        cy.contains('b', 'Avg Sell Price:').parent().should('contain.text', '790,000 Coins')
        cy.contains('translated loading text').should('not.exist')
        cy.contains('label', '1 Hour').click()
        cy.location('search').should('include', 'range=hour')
        cy.get('.echarts-for-react canvas').should('be.visible')
        cy.contains('Unable to load this page').should('not.exist')
        // React boundaries may catch errors before Cypress sees them; check those too.
        cy.window().then(window => {
            const errors = JSON.parse(window.sessionStorage.getItem('skycoflClientErrors') || '[]')
            expect(errors.filter(entry => entry.error.name === 'NotFoundError' || entry.source === 'react-boundary')).to.deep.equal([])
        })
    })
})

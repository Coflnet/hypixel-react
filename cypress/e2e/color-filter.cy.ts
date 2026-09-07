describe('Color filter builder', () => {
    beforeEach(() => {
        cy.viewport(1280, 1000)
        cy.visit('/wiki/color-filters', {
            onBeforeLoad(window) {
                window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            }
        })
    })

    const input = () => cy.get('section[aria-label="Color filter builder"] input[placeholder]').first()
    const mode = (label: string) => cy.get('[aria-label="Color matching mode"]').contains('button', label).click()

    it('shows three matching repeating blocks and preserves pattern syntax', () => {
        cy.get('[data-testid="matching-color"]')
            .should('have.length', 3)
            .each(card => {
                const color = card.attr('data-color')!
                expect(color.slice(0, 3)).to.equal(color.slice(3))
            })
        cy.get('[data-testid="matching-color"]').first().should('contain', '#D07D07')
        cy.get('section[aria-label="Color filter builder"]')
            .then(elements => elements[0].scrollIntoView({ behavior: 'instant', block: 'start' }))
            .screenshot('color-builder-desktop')
        cy.get('[data-testid="color-filter-value"]').should('have.text', 'Color=pattern:ABCABC')
        cy.contains('button', 'AABBCC · digit pairs').click()
        cy.get('[data-testid="matching-color"]').each(card => {
            expect(card.attr('data-color')).to.match(/^(.)\1(.)\2(.)\3$/)
        })
        cy.get('[data-testid="color-filter-value"]').should('have.text', 'Color=pattern:AABBCC')
        cy.contains('button', '_E_E_E · alternating').click()
        cy.get('[data-testid="matching-color"]').each(card => {
            const color = card.attr('data-color')!
            expect(color[1]).to.equal(color[3]).and.equal(color[5])
        })
    })

    it('edits RGB distance, updates the limit, and only previews matches', () => {
        mode('RGB distance')
        cy.get('[data-testid="color-filter-value"]').should('have.text', 'Color=F2DF11-11')
        cy.get('[data-testid="matching-color"]')
            .should('have.length', 3)
            .each(card => {
                const color = card.attr('data-color')!
                const distance = [0, 2, 4].reduce(
                    (sum, offset) => sum + Math.abs(parseInt(color.slice(offset, offset + 2), 16) - parseInt('F2DF11'.slice(offset, offset + 2), 16)),
                    0
                )
                expect(distance).to.be.at.most(11)
            })
        cy.get('input[type="range"]')
            .then(inputs => {
                const input = inputs[0] as HTMLInputElement
                const view = input.ownerDocument.defaultView!
                Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!.call(input, '0')
            })
            .trigger('input')
        cy.get('[data-testid="color-filter-value"]').should('have.text', 'Color=F2DF11-0')
        cy.get('[data-testid="matching-color"]').should('have.length', 1)
        input().clear().type('000000-765')
        cy.get('[data-testid="matching-color"]').should('have.length', 3)
        input().clear().type('F2DF11-766')
        cy.get('[aria-invalid="true"]').should('exist')
        cy.get('[data-testid="color-filter-value"]').should('not.contain', '766')
        cy.contains('whole decimal distance from 0 to 765').should('be.visible')
    })

    it('supports exact hex, RGB and lists without inventing extra exact matches', () => {
        mode('Exact hex')
        input().clear().type('#aabbcc')
        cy.get('[data-testid="matching-color"]').should('have.length', 1).and('contain', '#AABBCC')
        cy.contains('Only one distinct color').should('be.visible')
        mode('Exact RGB')
        cy.get('[data-testid="matching-color"]').should('have.length', 1).and('contain', '#D07D07')
        input().clear().type('256:0:0')
        cy.get('[aria-invalid="true"]').should('exist')
        mode('Color list')
        cy.get('[data-testid="matching-color"]').should('have.length', 3)
        cy.get('[data-testid="color-filter-value"]').should('have.text', 'Color=D07D07, F0DE09, AAAAAA')
    })

    it('rejects malformed patterns and mixed rules', () => {
        for (const value of ['pattern:ABC', 'pattern:AA11AA', 'pattern:ABCABC-3', 'D07D07, F2DF11-11']) {
            input().clear().type(value)
            cy.get('[aria-invalid="true"]').should('exist')
            cy.get('[data-testid="matching-color"]').should('not.exist')
        }
    })

    it('fits a narrow screen and links to the complete syntax', () => {
        cy.viewport(375, 812)
        cy.get('section[aria-label="Color filter builder"]').scrollIntoView().should('be.visible')
        cy.get('section[aria-label="Color filter builder"]').then(elements => {
            expect(elements[0].scrollWidth).to.be.at.most(elements[0].clientWidth)
        })
        cy.contains('a', 'All color options and examples').should('have.attr', 'href', '/wiki/color-filters')
        cy.contains('h2', 'Repeating patterns').should('exist')
        cy.get('section[aria-label="Color filter builder"]')
            .then(elements => elements[0].scrollIntoView({ behavior: 'instant', block: 'start' }))
            .screenshot('color-builder-mobile')
    })
})

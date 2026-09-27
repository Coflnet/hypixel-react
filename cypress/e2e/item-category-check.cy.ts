export {}

// The ItemCategory filter is only exposed through the flip restriction (blacklist/whitelist)
// editor on the flipper page, which needs the flip websocket connection to be mocked so the
// page can mount without erroring (mirrors the pattern in flipper-recovery.cy.ts). No login is
// required to reach this UI.
function visitFlipperRestrictionEditor() {
    // Prevent the Nitro ad-consent banner from loading and covering the UI under test.
    cy.intercept('GET', '**/s.nitropay.com/**', '')
    cy.intercept('GET', '**/api/user/terms*', { required: false })
    cy.intercept('POST', '**/api/premium/user/owns', { premium: { expiresAt: new Date(Date.now() + 86400000).toISOString() } })
    cy.intercept('GET', '**/api/referral/info*', { oldInfo: {} })
    cy.intercept('GET', '**/api/flip/update/when', { body: new Date().toISOString() }).as('updateTime')

    // The item page's plain auction-house filters (Reforge, Rarity, ...) - not relevant here, ItemCategory
    // is only returned by flipFilters below.
    cy.intercept('GET', '**/api/filter/options*', []).as('getFilters')
    cy.intercept('GET', '**/command/flipFilters/**', [
        {
            name: 'ItemCategory',
            options: ['UNKNOWN', 'COSMETIC', 'PET_SKIN', 'SWORD'],
            type: 1,
            longType: 'Equal',
            description: 'The category of the item'
        }
    ]).as('flipFilters')

    cy.intercept('GET', '**/api/item/search/*', [
        {
            type: 'item',
            id: 'PET_SKIN_SCATHA_GUMMY',
            tag: 'PET_SKIN_SCATHA_GUMMY',
            name: 'Gummy Worm Scatha Skin'
        }
    ]).as('itemSearch')
    cy.intercept('GET', '**/api/item/PET_SKIN_SCATHA_GUMMY/details', {
        tag: 'PET_SKIN_SCATHA_GUMMY',
        name: 'Gummy Worm Scatha Skin',
        category: 'PET_SKIN',
        tier: 'RARE'
    }).as('itemDetails')

    cy.visit('/flipper', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            window.localStorage.setItem('userSettings', JSON.stringify({ flipperFilters: JSON.stringify({}) }))

            class FlipWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onclose: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null

                constructor() {
                    window.setTimeout(() => this.onopen?.(new Event('open')), 0)
                }

                send(value: string) {
                    const request = JSON.parse(value)
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new MessageEvent('message', {
                                    data: JSON.stringify({
                                        mId: request.mId,
                                        type: 'ok',
                                        data: JSON.stringify(''),
                                        maxAge: 0
                                    })
                                })
                            ),
                        0
                    )
                }

                close() {
                    this.readyState = 3
                    this.onclose?.(new Event('close'))
                }
            }
            window.WebSocket = FlipWebSocket as unknown as typeof WebSocket
        }
    })
    cy.wait('@updateTime')

    cy.contains('Filter Rules').click()
    cy.contains('Restrict the flip results').should('be.visible')
    cy.contains('Add new restriction').click()
    cy.wait('@flipFilters')
}

describe('Item category check', () => {
    it('shows whether a looked-up item matches the selected ItemCategory filter and can switch to its category', () => {
        visitFlipperRestrictionEditor()

        cy.get('input[placeholder="Add filter"]').type('item categ')
        cy.contains('[role="option"]', /ItemCategory/i).click()

        // Open the ItemCategory select (rendered by EqualFilterElement, a react-bootstrap-typeahead Typeahead)
        // and pick "Cosmetic" - this is the filter value from the bug report.
        cy.contains('b', /item categor/i)
            .parents('[style*="grid"]')
            .first()
            .as('itemCategoryFilter')
        cy.get('@itemCategoryFilter').find('input').first().click()
        cy.contains('[role="option"]', /^Cosmetic$/).click()
        cy.get('@itemCategoryFilter').find('input').first().should('have.value', 'Cosmetic')

        // Look up the item from the bug report through the new checker field.
        cy.get('input[placeholder="Check an item\'s category..."]').type('Gummy')
        cy.wait('@itemSearch')
        cy.contains('[role="option"]', /Gummy Worm Scatha Skin/i).click()
        cy.wait('@itemDetails')

        cy.contains('Gummy Worm Scatha Skin is not in').should('be.visible')
        cy.contains('Cosmetic').should('be.visible')
        cy.contains('It is in').should('be.visible')
        cy.contains('Pet Skin (unapplied)').should('be.visible')

        cy.contains('button', /switch to pet skin/i).click()

        // The select now visibly shows the switched-to category ...
        cy.get('@itemCategoryFilter').find('input').first().should('have.value', 'Pet Skin (unapplied)')
        // ... and the message turned green (included).
        cy.contains('Gummy Worm Scatha Skin is in Pet Skin (unapplied) and is included by this filter.')
            .scrollIntoView()
            .should('be.visible')
    })
})

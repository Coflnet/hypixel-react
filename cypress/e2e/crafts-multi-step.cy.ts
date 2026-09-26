const ingredient = (itemId: string, type = 'bazaar') => ({ itemId, type, count: 1, cost: 100 })
const craft = (itemId: string, itemName: string, ingredients: ReturnType<typeof ingredient>[], profit = 1000) => ({
    itemId, itemName, ingredients, craftCost: 100, sellPrice: 100 + profit, median: 1100, volume: 10
})
const crafts = [
    ...[1, 2, 3].map(index => craft(`PREMIUM_${index}`, `Premium ${index}`, [ingredient('COAL')], 10000)),
    craft('MULTI_STEP', 'Multi Step Fixture', [ingredient('SUBCRAFT', 'craft')]),
    craft('SINGLE_STEP', 'Single Step Fixture', [ingredient('COAL'), ingredient('IRON_INGOT')]),
    craft('BUY_SUBCRAFT', 'Bought Subcraft Fixture', [ingredient('SUBCRAFT')]),
    craft('UNRESOLVED', 'Unresolved Fixture', [ingredient('MISSING', 'craft')]),
    craft('SUBCRAFT', 'Subcraft Fixture', [ingredient('COAL')])
]

describe('Craft list multi-step labels', () => {
    it('marks recipes with a crafted ingredient on desktop and mobile', () => {
        // Crafts are server props, so stub the navigation response rather than a browser API request.
        cy.intercept({ pathname: '/crafts', query: { _rsc: '*' } }, request => {
            request.continue(response => {
                const body = String(response.body)
                response.body = body.replace(/"crafts":\[.*?\],"bazaarTags":/, `"crafts":${JSON.stringify(crafts)},"bazaarTags":`)
            })
        }).as('crafts')
        cy.visit('/flips')
        cy.get('a[href="/crafts"]').first().click()
        cy.contains('h4', 'Multi Step Fixture', { timeout: 20000 }).should('be.visible')
        for (const [width, height] of [[1280, 900], [390, 844]]) {
            cy.viewport(width, height)
            cy.contains('.list-group-item', 'Multi Step Fixture').within(() => {
                cy.contains('Multi-step').should('be.visible')
            })
            for (const name of ['Single Step Fixture', 'Bought Subcraft Fixture', 'Unresolved Fixture', 'Subcraft Fixture']) {
                cy.contains('h4', name).closest('.list-group-item').should('not.contain.text', 'Multi-step')
            }
            cy.screenshot(`crafts-multi-step-${width}`, { capture: 'fullPage' })
        }
    })
})

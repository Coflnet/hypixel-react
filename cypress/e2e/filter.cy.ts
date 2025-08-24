// cypress/integration/item.spec.js
describe('Item page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })
    it('opens item with sharpness 5', () => {
        cy.visit('/item/ASPECT_OF_THE_DRAGON')
        cy.contains('Add Filter').click()
        cy.get('input[placeholder="Add filter"]').type('shar')
        cy.contains('a', 'Sharpness').click()
        cy.get('form').contains('SharpnessNone1234567Please fill the filter or remove it').find('input').type('5')
        cy.contains(/ended.*ago/i).click()
        cy.url().should('match', /.*\/auction\/.*/i)
        cy.contains('Sharpness 5').should('be.visible')
    })
})

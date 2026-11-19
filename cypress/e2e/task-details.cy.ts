// Runs against the TEST_RUNNER build: /tasks/warp-task is served from test-fixtures/tasks.ts.
describe('Task details', () => {
    beforeEach(() => {
        cy.visit('/tasks/warp-task')
    })

    it('shows the warp command once without a double prefix', () => {
        cy.get('code').filter(':contains("/warp")').should('have.length', 1).and('have.text', '/warp kuudra')
    })

    it('lists needed and recommended requirements', () => {
        cy.get('[data-cy="task-requirements"]').within(() => {
            cy.contains('h2', 'Requirements')
            cy.contains('dt', 'Needed').next('dd').should('contain', 'Combat 24').and('not.contain', 'Catacombs 36')
            cy.contains('dt', 'Recommended').next('dd').should('contain', 'Catacombs 36').and('not.contain', 'Combat 24')
        })
    })

    it('renders no requirements block for a task without requirements', () => {
        cy.visit('/tasks/plain-task')
        cy.get('[data-cy="task-requirements"]').should('not.exist')
    })
})

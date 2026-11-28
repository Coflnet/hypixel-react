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

    it('shows no availability note for an always available task', () => {
        cy.get('[data-testid="task-unavailable"]').should('not.exist')
        cy.get('[data-testid="task-availability-note"]').should('not.exist')
    })
})

describe('Task out of its event', () => {
    it('still has an indexable page that says it is not possible right now', () => {
        cy.visit('/tasks/event-task')
        cy.contains('h1', 'Event Task')
        cy.get('[data-testid="task-unavailable"]')
            .should('contain', 'Not possible right now – needs Spooky Festival')
            .and('contain', 'Only possible during the Spooky Festival')
            .and('contain', 'Dec 1, 2099')
        cy.request('/tasks/event-task').then(response => {
            expect(response.status).to.equal(200)
            expect(response.body).not.to.match(/<meta name="robots" content="noindex/)
        })
    })

    it('shows a hint when the event could not be checked', () => {
        cy.visit('/tasks/maybe-task')
        cy.get('[data-testid="task-availability-note"]').should('contain', 'could not be checked')
        cy.get('[data-testid="task-unavailable"]').should('not.exist')
    })
})

export {}

const ratCheckUrl = '**/api/mod/ratcheck/*'

function selectJarFiles(files: { fileName: string; contents: string }[]) {
    cy.get('input[type=file]').selectFile(
        files.map(({ fileName, contents }) => ({ contents: Cypress.Buffer.from(contents), fileName, mimeType: 'application/java-archive' })),
        { force: true }
    )
}

describe('Rat checker backend failures', () => {
    beforeEach(() => {
        cy.visit('/mod')
    })

    it('shows the unavailable message with an isthisarat.com link when the proxy 404s (not deployed yet)', () => {
        cy.intercept('GET', ratCheckUrl, { statusCode: 404 }).as('ratCheck')
        selectJarFiles([{ fileName: 'suspicious.jar', contents: 'not-yet-deployed' }])
        cy.wait('@ratCheck')
        cy.contains('Checking file').should('not.exist')
        cy.contains('The rat scanner is currently unavailable').should('be.visible')
        cy.get('a[href="https://isthisarat.com/"]').should('have.attr', 'rel', 'noopener noreferrer')
        cy.get('.Toastify__toast').should('not.exist')
    })

    it('shows the unavailable message when the backend reports 503', () => {
        cy.intercept('GET', ratCheckUrl, { statusCode: 503, body: { slug: 'ratcheck_unavailable', message: 'Scanner unavailable' } }).as('ratCheck')
        selectJarFiles([{ fileName: 'suspicious.jar', contents: '503-case' }])
        cy.wait('@ratCheck')
        cy.contains('The rat scanner is currently unavailable').should('be.visible')
        cy.get('a[href="https://isthisarat.com/"]').should('have.attr', 'rel', 'noopener noreferrer')
        cy.get('.Toastify__toast').should('not.exist')
    })

    it('tells the user to slow down on 429 instead of showing the unavailable message', () => {
        cy.intercept('GET', ratCheckUrl, { statusCode: 429, body: { slug: 'rate_limited', message: 'Too many requests' } }).as('ratCheck')
        selectJarFiles([{ fileName: 'suspicious.jar', contents: '429-case' }])
        cy.wait('@ratCheck')
        cy.contains('checking files too fast').should('be.visible')
        cy.contains('The rat scanner is currently unavailable').should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
    })

    it('does not reject the whole batch - other files still get their own result when one check fails', () => {
        let requestCount = 0
        cy.intercept('GET', ratCheckUrl, request => {
            requestCount++
            if (requestCount === 1) {
                request.reply({ statusCode: 503, body: 'Unavailable' })
            } else {
                request.reply({ rat: 'No', md5return: 'deadbeef' })
            }
        }).as('ratCheck')
        selectJarFiles([
            { fileName: 'a.jar', contents: 'file-a' },
            { fileName: 'b.jar', contents: 'file-b' }
        ])
        cy.contains('Checking file').should('not.exist')
        cy.contains('The rat scanner is currently unavailable').should('be.visible')
        cy.contains('No harmful code was found in this mod.').should('be.visible')
    })
})

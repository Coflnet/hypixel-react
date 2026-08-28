describe('Node toolchain configuration', () => {
    it('pins clean installs to Node 26 and npm 11', () => {
        cy.readFile('.nvmrc').invoke('trim').should('equal', '26')

        cy.readFile('package.json').then(packageJson => {
            expect(packageJson.engines.node).to.include('^26')
            expect(packageJson.packageManager).to.equal('npm@11.5.2')
        })

        cy.readFile('package-lock.json').then(packageLock => {
            expect(packageLock.packages[''].engines.node).to.equal('^22 || ^24 || ^26')
        })
    })
})

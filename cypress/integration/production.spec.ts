import { Interception } from "cypress/types/net-stubbing"

describe('production', () => {

    it('check if css/js files are normal', () => {

        cy.intercept(/.*.chunk.css/).as('css')
        cy.intercept(/.*.chunk.js/).as('js')

        cy.visit('/')

        cy.wait('@js').its('response.statusCode').should("be.gte", 200).and("be.lte", 399)
        cy.wait('@css').its('response.statusCode').should("be.gte", 200).and("be.lte", 399)

    })
})
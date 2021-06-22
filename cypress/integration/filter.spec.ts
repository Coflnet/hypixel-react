describe('filter', () => {

    // basic search bar
    it('enable rarity filter', () => {
        cy.visit('localhost:3000/item/ASPECT_OF_THE_END')
        cy.contains('Aspect of the End')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().select('Reforge')
        cy.wait(1000)
        cy.get('.generic-filter').children().children('select').select("Demonic")
        cy.contains('Apply').click()
        // no sword matches Demonic
        cy.contains('0 Coins');
        cy.contains('No data found');
    });

    it('enable valid rarity filter', () => {
        cy.visit('localhost:3000/item/ASPECT_OF_THE_END')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().select('Reforge')
        cy.wait(1000)
        cy.get('.generic-filter').children().children('select').select("Sharp")
        let oldPrice = cy.contains('Avg Price:').parent();

        cy.contains('Apply').click()
        cy.wait(2000)
        cy.contains('Avg Price:').parent().should('not.equal', oldPrice);
        cy.get('.recent-auctions-list').children().first().click()
        cy.contains("Sharp")
    });

    it('enable pet level filter', () => {
        cy.visit('localhost:3000/item/PET_BLUE_WHALE')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().select('PetLevel')
        cy.wait(1000)
        cy.get('.generic-filter').children().children('input').type("1")
        cy.contains('Apply').click()
        // trigger a reload to test the url apply as well
        cy.reload()
        cy.wait(4000)
        cy.get('.recent-auctions-list').children().first().click()
        cy.contains("[Lvl 1] ")
    });
});
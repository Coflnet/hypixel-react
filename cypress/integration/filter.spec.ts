describe('filter', () => {

    // basic search bar
    it('enable rarity filter', () => {
        cy.visit('/item/ASPECT_OF_THE_END')
        cy.contains('Aspect of the End')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().should("be.enabled").wait(100).should("be.enabled").select('Reforge')
        cy.wait(1000)
        
        cy.get('.generic-filter').children().children('select').scrollIntoView().select("Itchy")
        // no sword matches Demonic
        cy.contains('0 Coins');
        cy.contains('No data found');
    });

    it('enable valid rarity filter', () => {
        cy.visit('/item/ASPECT_OF_THE_END')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().should("be.enabled").select('Reforge')
        cy.wait(1000)
        cy.get('.generic-filter').children().children('select').select("Sharp")
        let oldPrice = cy.contains('Avg Price:').parent();

        cy.wait(2000)
        cy.contains('Avg Price:').parent().should('not.equal', oldPrice);
        cy.get('.recent-auctions-list').children().first().scrollIntoView().click()
        cy.contains("Sharp")
    });

    it('enable pet level filter', () => {
        cy.visit('/item/PET_BLUE_WHALE')
        cy.contains('Add Filter').click()
        cy.contains('Click to add filter', {
            timeout: 12000
        }).parent().should("be.enabled").wait(100).should("be.enabled",{timeout:10000}).select('Pet level')
        cy.wait(1000)
        // this doesn't work, tracked by https://github.com/Coflnet/hypixel-react/issues/294
        //cy.get('.generic-filter').children().children('input').clear().type("1")
        // trigger a reload to test the url apply as well
        cy.reload()
        cy.wait(4000)
        cy.get('.recent-auctions-list').children().first().scrollIntoView().click()
        cy.contains("[Lvl 1] ")
    });
});
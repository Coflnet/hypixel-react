describe("flipper", () => {
  it("check display", () => {
    cy.visit("/flipper");
    // quit and cry
    cy.get(".flip-auction-card").contains("Cost:");
    cy.get(".flip-auction-card").contains("Median price:");
    cy.get(".flip-auction-card").contains("Estimated Profit:");



    cy.get(".MuiSvgIcon-root").last().click();

    cy.get(".flip-based>div").children().should("have.length.at.least", 2);
    cy.get("button.close").click();

    // a SOLD flip is displayed within half a min
    cy.get(".flip-auction-card").contains("SOLD",{timeout:30000});
  });

  it("copy link", () => {
    cy.visit("/flipper");
    cy.on('uncaught:exception', (err, runnable) => {
        expect(err.message).to.include('Document is not focused')
        // return false to prevent the error from
        // failing this test
        return false
      })
    cy.get(".flip-auction-card").get('[aria-label="copy to clipboard"]').last().parent().trigger('mouseover').click();
    cy.contains("/viewauction");
  })
});

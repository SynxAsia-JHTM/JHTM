describe('Events sync', () => {
  it('updates homepage Upcoming Events after admin add within 2s', () => {
    cy.visit('/login');
    cy.contains('button', 'Sign in').click();

    cy.get('a[aria-label="Events"]').click();
    cy.contains('button', 'Add Event').click();

    cy.contains('[role="dialog"]', 'Add Event').within(() => {
      cy.get('input[type="text"]').first().clear().type('Cypress Event');
      cy.contains('button', 'Save').click();
    });

    cy.get('a[aria-label="Back to homepage"]').click();
    cy.contains('Cypress Event', { timeout: 2000 }).should('be.visible');
  });
});

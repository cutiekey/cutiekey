describe('Router transition', () => {
  describe('Redirect', () => {
    // Server initialization
    //
    // As far testing the route is concerned, it is sufficient to run it only
    // once for each `describe`
    before(() => {
      cy.resetState()

      // Initial setup for the instance
      cy.registerUser('admin', 'pass', true)

      // Create a user
      cy.registerUser('alice', 'alice1234')

      cy.login('alice', 'alice1234')

      // Account initialization wizard
      //
      // This takes a long time to display, so the default timeout value
      // wouldn't work in this case
      cy.get(
        '[data-cy-user-setup] [data-cy-modal-window-close]',
        {
          timeout: 30000
        }
      ).click()

      cy.wait(500)
      cy.get('[data-cy-modal-dialog-ok]').click()
    })

    it('redirects to user profile', () => {
      // Jump to a redirect route prepared for testing purposes only
      cy.visit('/redirect-test')

      // Ensure that it is the URL of your profile page
      cy.url().should('include', '/@alice')
    })
  })
})

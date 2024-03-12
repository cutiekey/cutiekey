Cypress.Commands.add('login', (username, password) => {
  cy.visitHome()

  cy.intercept('POST', '/api/signin').as('signin')

  cy.get('[data-cy-signin]').click()
  cy.get('[data-cy-signin-username] input').type(username)
  cy.get('[data-cy-signin-password] input').type(`${password}{enter}`)

  cy.wait('@signin').as('signedIn')
})

Cypress.Commands.add('registerUser', (username, password, isAdmin = false) => {
  const route = isAdmin
    ? '/api/admin/accounts/create'
    : '/api/signup'

  cy.request(
    'POST',
    route,
    {
      password,
      username
    }
  ).its('body').as(username)
})

Cypress.Commands.add('resetState', () => {
  cy.window().then(win => {
    win.indexedDB.deleteDatabase('keyval-store')
  })

  cy.request('POST', '/api/reset-db', {}).as('reset')
  cy.get('@reset').its('status').should('equal', 204)
  cy.reload(true)
})

Cypress.Commands.add('visitHome', () => {
  cy.visit('/')
  cy.get('button', { timeout: 30000 }).should('be.visible')
})

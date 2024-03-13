describe('Before instance setup', () => {
  beforeEach(() => {
    cy.resetState()
  })

  afterEach(() => {
    // In test cases where there is a page transition just before the end of the
    // test (e.g. account creation), the browser content will probably be
    // carried over to the next test case due to a bug in Cypress (e.g. the test
    // starts when the account has been created). The inclusion of `cy.wait` can
    // prevent this.
    cy.wait(1000)
  })

  it('successfully loads', () => {
    cy.visitHome()
  })

  it('sets up the instance', () => {
    cy.visitHome()

    cy.intercept('POST', '/api/admin/accounts/create').as('signup')

    cy.get('[data-cy-admin-username] input').type('admin')
    cy.get('[data-cy-admin-password] input').type('admin1234')
    cy.get('[data-cy-admin-ok]').click()

    cy.wait('@signup')
  })
})

describe('After instance setup', () => {
  beforeEach(() => {
    cy.resetState()

    // Set up the administrator account
    cy.registerUser('admin', 'pass', true)
  })

  afterEach(() => {
    // In test cases where there is a page transition just before the end of the
    // test (e.g. account creation), the browser content will probably be
    // carried over to the next test case due to a bug in Cypress (e.g. the test
    // starts when the account has been created). The inclusion of `cy.wait` can
    // prevent this.
    cy.wait(1000)
  })

  it('successfully loads', () => {
    cy.visitHome()
  })

  it('signs up', () => {
    cy.visitHome()

    cy.intercept('POST', '/api/signup').as('signup')

    cy.get('[data-cy-signup]').click()
    cy.get('[data-cy-signup-rules-continue]').should('be.disabled')
    cy.get('[data-cy-signup-rules-notes-agree] [data-cy-switch-toggle]').click()
    cy.get('[data-cy-modal-dialog-ok]').click()
    cy.get('[data-cy-signup-rules-continue]').should('not.be.disabled')
    cy.get('[data-cy-signup-rules-continue]').click()

    cy.get('[data-cy-signup-submit]').should('be.disabled')
    cy.get('[data-cy-signup-username] input').type('alice')
    cy.get('[data-cy-signup-submit]').should('be.disabled')
    cy.get('[data-cy-signup-password] input').type('alice1234')
    cy.get('[data-cy-signup-submit]').should('be.disabled')
    cy.get('[data-cy-signup-password-retype] input').type('alice1234')
    cy.get('[data-cy-signup-submit]').should('not.be.disabled')
    cy.get('[data-cy-signup-submit]').click()

    cy.wait('@signup')
  })

  it('does not sign up with a duplicated username', () => {
    cy.registerUser('alice', 'alice1234')
    cy.visitHome()

    // Check that signup requests using duplicated usernames are rejected
    cy.get('[data-cy-signup]').click()
    cy.get('[data-cy-signup-rules-continue]').should('be.disabled')
    cy.get('[data-cy-signup-rules-notes-agree] [data-cy-switch-toggle]').click()
    cy.get('[data-cy-modal-dialog-ok]').click()
    cy.get('[data-cy-signup-rules-continue]').should('not.be.disabled')
    cy.get('[data-cy-signup-rules-continue]').click()

    cy.get('[data-cy-signup-username] input').type('alice')
    cy.get('[data-cy-signup-password] input').type('alice1234')
    cy.get('[data-cy-signup-password-retype] input').type('alice1234')
    cy.get('[data-cy-signup-submit]').should('be.disabled')
  })
})

describe('After user signup', () => {
  beforeEach(() => {
    cy.resetState()

    // Set up the administrator account
    cy.registerUser('admin', 'pass', true)

    // Set up the `alice` account
    cy.registerUser('alice', 'alice1234')
  })

  afterEach(() => {
    // In test cases where there is a page transition just before the end of the
    // test (e.g. account creation), the browser content will probably be
    // carried over to the next test case due to a bug in Cypress (e.g. the test
    // starts when the account has been created). The inclusion of `cy.wait` can
    // prevent this.
    cy.wait(1000)
  })

  it('successfully loads', () => {
    cy.visitHome()
  })

  it('signs in', () => {
    cy.visitHome()

    cy.intercept('POST', '/api/signin').as('signin')

    cy.get('[data-cy-signin]').click()
    cy.get('[data-cy-signin-username] input').type('alice')
    cy.get('[data-cy-signin-password] input').type('alice1234{enter}')

    cy.wait('@signin')
  })

  it('suspends a user', function() {
    cy.request('POST', '/api/admin/suspend-user', {
      i: this.admin.token,
      userId: this.alice.id
    })

    cy.visitHome()

    cy.get('[data-cy-signin]').click()
    cy.get('[data-cy-signin-username] input').type('alice')
    cy.get('[data-cy-signin-password] input').type('alice1234{enter}')

    cy.contains(/This account has been suspended due to/gi)
  })
})

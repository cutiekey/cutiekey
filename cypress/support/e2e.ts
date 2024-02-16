import './commands'

Cypress.on('uncaught:exception', err => {
  if ([
    'The source image cannot be decoded',

    // Chrome
    'ResizeObserver loop limit exceeded',

    // Firefox
    'ResizeObserver loop completed with undelivered notifications'
  ].some(msg => err.message.includes(msg))) {
    return false
  }
})

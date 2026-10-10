/// <reference types="cypress" />
import '@testing-library/cypress/add-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Visits a route and waits until the page has hydrated, so typing and
       * clicking reach React instead of the inert server-rendered markup.
       */
      visitDex(path: string, options?: Partial<VisitOptions>): Chainable<void>

      /** The result grid's links in reading order, named like "Pikachu, no. 0025". */
      findSpecimens(): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('visitDex', (path: string, options?: Partial<Cypress.VisitOptions>) => {
  cy.visit(path, options)
  // Type rosters are fetched only in the browser, so a count beside a type in
  // the rail is the first sign the app is live. `hidden` keeps this working
  // below the md breakpoint, where the rail is replaced by a dropdown.
  cy.findByRole('link', { name: /^Water, \d+ specimens$/, hidden: true, timeout: 15_000 })
})

Cypress.Commands.add('findSpecimens', () =>
  cy.findByRole('main').findAllByRole('link', { name: /, no\. \d+$/ }),
)

export {}

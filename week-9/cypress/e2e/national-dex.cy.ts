/**
 * These specs run against the live PokeAPI, so they assert facts that do not
 * move between game releases (Bulbasaur is no. 1) and compare totals the page
 * reports against each other rather than against a hardcoded count.
 */
describe('Listing the National Dex', () => {
  beforeEach(() => {
    cy.visitDex('/')
  })

  it('lists every Pokémon in dex order, each linking to its entry', () => {
    cy.findByRole('heading', { level: 1, name: 'National Dex' }).should('be.visible')
    cy.findByRole('navigation', { name: 'Filter by type' })
      .findByRole('link', { name: /^All types, \d+ specimens$/ })
      .should('have.attr', 'aria-current', 'page')

    cy.findSpecimens().should(($links) => {
      const firstThree = $links.toArray().slice(0, 3)
      expect(firstThree.map((link) => link.getAttribute('aria-label'))).to.deep.equal([
        'Bulbasaur, no. 0001',
        'Ivysaur, no. 0002',
        'Venusaur, no. 0003',
      ])
      expect(firstThree.map((link) => link.getAttribute('href'))).to.deep.equal([
        '/pokemon/bulbasaur',
        '/pokemon/ivysaur',
        '/pokemon/venusaur',
      ])
    })
  })

  it('reports the same total in the header and in the type rail', () => {
    cy.findByRole('navigation', { name: 'Filter by type' })
      .findByRole('link', { name: /^All types, \d+ specimens$/ })
      .invoke('attr', 'aria-label')
      .then((label) => {
        const total = Number(/(\d+) specimens/.exec(label ?? '')?.[1])
        // Every generation through Scarlet and Violet, before alternate forms.
        expect(total).to.be.at.least(1025)
        cy.findByRole('main').findByText(`${total} specimens`).should('be.visible')
      })
  })

  it('renders the dex a page at a time as it is scrolled', () => {
    cy.findByRole('main')
      .findByText(/^\d+ specimens$/)
      .invoke('text')
      .then((text) => {
        const total = Number.parseInt(text, 10)

        cy.findSpecimens().should('have.length', 60)
        cy.findByText(`${total - 60} more`).scrollIntoView()

        cy.findSpecimens().should('have.length.greaterThan', 60)
        cy.findByText(/^\d+ more$/)
          .invoke('text')
          .then((more) => expect(Number.parseInt(more, 10)).to.be.lessThan(total - 60))
      })
  })
})

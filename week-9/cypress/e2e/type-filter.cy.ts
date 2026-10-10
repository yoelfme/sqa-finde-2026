function typeRail() {
  return cy.findByRole('navigation', { name: 'Filter by type' })
}

describe('Filtering by type', () => {
  it('shows the full roster of the type picked in the rail', () => {
    cy.visitDex('/')

    typeRail().findByRole('link', { name: /^Water, \d+ specimens$/ }).as('water').click()

    cy.location('pathname').should('eq', '/type/water')
    cy.findByRole('heading', { level: 1, name: 'Water' }).should('be.visible')
    cy.findByText('Every Pokémon carrying the water type, primary or secondary.').should(
      'be.visible',
    )
    cy.get('@water').should('have.attr', 'aria-current', 'page')

    // The rail count and the header count are two views of the same roster.
    cy.get('@water')
      .invoke('attr', 'aria-label')
      .then((label) => {
        const count = /(\d+) specimens/.exec(label ?? '')?.[1]
        cy.findByRole('main').findByText(`${count} specimens`).should('be.visible')
      })

    cy.findSpecimens().should(($links) => {
      const labels = $links.toArray().map((link) => link.getAttribute('aria-label'))
      expect(labels).to.include('Squirtle, no. 0007')
      expect(labels).to.include('Psyduck, no. 0054')
      expect(labels).not.to.include('Bulbasaur, no. 0001')
    })
  })

  it('goes back to the whole dex through "All types"', () => {
    cy.visitDex('/type/water')

    typeRail().findByRole('link', { name: /^All types, \d+ specimens$/ }).click()

    cy.location('pathname').should('eq', '/')
    cy.findByRole('heading', { level: 1, name: 'National Dex' }).should('be.visible')
    cy.findSpecimens().first().should('have.attr', 'aria-label', 'Bulbasaur, no. 0001')
  })

  it('offers the same filter as a dropdown on small screens', () => {
    cy.viewport('iphone-x')
    cy.visitDex('/')

    cy.findByRole('combobox', { name: 'Filter by type' }).click()
    cy.findByRole('listbox').findByRole('option', { name: /^Fire/ }).click()

    cy.location('pathname').should('eq', '/type/fire')
    cy.findByRole('heading', { level: 1, name: 'Fire' }).should('be.visible')
    cy.findByRole('combobox', { name: 'Filter by type' }).should('contain.text', 'Fire')
    cy.findSpecimens().first().should('have.attr', 'aria-label', 'Charmander, no. 0004')
  })
})

describe('Filtering by type and searching by name', () => {
  it('searches only within the chosen type', () => {
    cy.visitDex('/type/fire')

    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).type('char')

    cy.location('pathname').should('eq', '/type/fire')
    cy.location('search').should('eq', '?q=char')
    cy.findByText('Matching “char” within Fire.').should('be.visible')
    cy.findSpecimens().should(($links) => {
      const labels = $links.toArray().map((link) => link.getAttribute('aria-label'))
      expect(labels[0]).to.equal('Charmander, no. 0004')
      expect(labels).to.include('Chimchar, no. 0390')
      // Contains "char", but is Bug and Electric.
      expect(labels).not.to.include('Charjabug, no. 0737')
    })
    cy.findSpecimens().then(($links) => {
      cy.findByRole('main').findByText(`${$links.length} specimens`).should('be.visible')
    })
  })

  it('keeps the search when the type changes', () => {
    cy.visitDex('/type/fire?q=char')

    typeRail().findByRole('link', { name: /^Electric, \d+ specimens$/ }).click()

    cy.location('pathname').should('eq', '/type/electric')
    cy.location('search').should('eq', '?q=char')
    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).should('have.value', 'char')
    cy.findSpecimens()
      .should('have.length', 1)
      .and('have.attr', 'aria-label', 'Charjabug, no. 0737')
  })

  it('finds nothing when the name belongs to another type', () => {
    cy.visitDex('/type/water?q=pikachu')

    cy.findByText('No specimen is named “pikachu”.').should('be.visible')
    cy.findByText('Matching “pikachu” within Water.').should('be.visible')

    typeRail().findByRole('link', { name: /^Electric, \d+ specimens$/ }).click()

    cy.location('pathname').should('eq', '/type/electric')
    cy.findSpecimens().first().should('have.attr', 'aria-label', 'Pikachu, no. 0025')
  })
})

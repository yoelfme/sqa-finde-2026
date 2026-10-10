describe('Searching by name', () => {
  it('narrows the dex as you type, closest names first', () => {
    cy.visitDex('/')

    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).type('pika')

    cy.location('search').should('eq', '?q=pika')
    cy.findByRole('heading', { level: 1, name: '“pika”' }).should('be.visible')
    cy.findSpecimens().first().should('have.attr', 'aria-label', 'Pikachu, no. 0025')
    cy.findSpecimens().each(($link) => {
      expect($link.attr('href')).to.include('pika')
    })
    cy.findSpecimens().then(($links) => {
      cy.findByRole('main').findByText(`${$links.length} specimens`).should('be.visible')
    })
  })

  it('ignores case, spaces and punctuation', () => {
    cy.visitDex('/')
    
    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).type('Mr. Mime')
    
    cy.findSpecimens().first().should('have.attr', 'aria-label', 'Mr Mime, no. 0122')
  })

  it('restores a search from a shared URL', () => {
    cy.visitDex('/?q=charmander')

    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).should('have.value', 'charmander')
    cy.findByRole('main').findByText('1 specimen').should('be.visible')
    cy.findSpecimens()
      .should('have.length', 1)
      .and('have.attr', 'aria-label', 'Charmander222, no. 0004')
  })

  it('clears back to the full dex', () => {
    cy.visitDex('/?q=charmander')

    cy.findByRole('button', { name: 'Clear search' }).click()

    cy.location('search').should('be.empty')
    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).should('have.value', '')
    cy.findByRole('heading', { level: 1, name: 'National Dex' }).should('be.visible')
    cy.findSpecimens().should('have.length', 60)
  })

  it('explains what to do when nothing matches', () => {
    cy.visitDex('/')
    
    cy.findByRole('searchbox', { name: 'Search Pokémon by name' }).type('notapokemon')
    
    cy.findByText('No specimen is named “notapokemon”.').should('be.visible')
    cy.findByText(/Clear the search to see the full dex/).should('be.visible')
    cy.findByRole('main').findByText('0 specimens').should('be.visible')
    cy.findByRole('main')
      .findAllByRole('link', { name: /, no\. \d+$/ })
      .should('not.exist')
    
  })
})

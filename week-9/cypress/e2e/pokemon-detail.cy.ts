/** Reads a value from a `<dl>` by its term, as a sighted reader pairs them. */
function definitionOf(term: string) {
  return cy.contains('dt', new RegExp(`^${term}$`)).next('dd')
}

describe('A Pokémon’s detail page', () => {
  it('opens from the dex and shows the full entry', () => {
    cy.visitDex('/?q=pikachu')

    cy.findByRole('link', { name: 'Pikachu, no. 0025' }).click()

    cy.location('pathname').should('eq', '/pokemon/pikachu')
    cy.title().should('eq', 'Pikachu · Pokédex')

    cy.findByRole('article').within(() => {
      cy.findByRole('heading', { level: 1, name: 'Pikachu' }).should('be.visible')
      cy.findByText('0025').should('be.visible')
      cy.findByText('Mouse Pokémon').should('be.visible')
      cy.findByRole('img', { name: 'Official artwork of Pikachu' })
        .should('have.attr', 'src')
        .and('match', /\/official-artwork\/25\.png$/)
      cy.findByRole('link', { name: 'Electric' }).should('have.attr', 'href', '/type/electric')

      definitionOf('Height').should('have.text', '0.4 m')
      definitionOf('Weight').should('have.text', '6.0 kg')
      definitionOf('Abilities').should('have.text', 'Static, Lightning Rod (hidden)')

      cy.findByRole('heading', { level: 2, name: 'Base stats' }).should('be.visible')
      definitionOf('HP').should('have.text', '35')
      definitionOf('Speed').should('have.text', '90')
      definitionOf('Total').should('have.text', '320')
    })
  })

  it('leads back to the index', () => {
    cy.visitDex('/pokemon/pikachu')

    cy.findByRole('link', { name: 'Back to the index' }).click()

    cy.location('pathname').should('eq', '/')
    cy.findByRole('heading', { level: 1, name: 'National Dex' }).should('be.visible')
  })

  it('leads to the roster of its type', () => {
    cy.visitDex('/pokemon/pikachu')

    cy.findByRole('article').findByRole('link', { name: 'Electric' }).click()

    cy.location('pathname').should('eq', '/type/electric')
    cy.findByRole('heading', { level: 1, name: 'Electric' }).should('be.visible')
  })

  it('answers an unknown name with the not-found page', () => {
    // Ve a la pagina de detall de Pokemon
    cy.visitDex('/pokemon/notarealpokemon', { failOnStatusCode: false })
    
     // Valida que exista un titulo: "No entry here"
    cy.findByRole('heading', { level: 1, name: 'No entry here' }).should('be.visible')
    
    // Busca el link que diga: "Back to index" y da click sobre ese boton
    cy.findByRole('link', { name: 'Back to the index' }).click()
    
    // Valida que haya regresado entonces a la pagina principal
    cy.location('pathname').should('eq', '/')
  })
})

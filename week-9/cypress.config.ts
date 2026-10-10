import { defineConfig } from 'cypress'

export default defineConfig({
  // Electron is deprecated as of Cypress 16.
  defaultBrowser: 'chrome',
  video: true,
  e2e: {
    // A port of its own, so a run never attaches to another app left on 3000.
    baseUrl: 'http://localhost:5174',
    // Above the `md` breakpoint, where the type filter is the rail rather than
    // the dropdown. Specs that need the small screen set it themselves.
    viewportWidth: 1280,
    viewportHeight: 800,
    // Route loaders run on the server during SSR, out of reach of cy.intercept,
    // so these specs exercise the live PokeAPI. Retries absorb its occasional
    // slow answer in CI; interactive runs keep failing on the first attempt.
    retries: { runMode: 2, openMode: 0 },
  },
})

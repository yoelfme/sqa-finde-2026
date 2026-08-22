import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/ingest.ts'],
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        },
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['tests/**/*.test.ts'],
                    exclude: ['tests/**/*.integration.test.ts']
                }
            },
            {
                test: {
                    name: 'integration',
                    include: ['tests/**/*.integration.test.ts'],
                    testTimeout: 60_000,
                    hookTimeout: 120_000
                }
            }
        ]
    }
})

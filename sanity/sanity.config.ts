import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// DEFINITIVE FIX: Hardcode the public, non-secret values.
// The dev server launched by the CLI also lacks Next.js context.
const projectId = '0zany1dm'
const dataset = 'production'
const apiVersion = '2024-03-11'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool(),
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
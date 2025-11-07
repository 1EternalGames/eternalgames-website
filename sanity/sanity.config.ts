import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = '0zany1dm'
const dataset = 'production'
// THE FIX: Aligned the API version to match the rest of the application.
const apiVersion = '2025-09-30'

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
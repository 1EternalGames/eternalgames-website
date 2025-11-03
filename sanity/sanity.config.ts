import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = '0zany1dm'
const dataset = 'production'
const apiVersion = '2025-10-29'

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



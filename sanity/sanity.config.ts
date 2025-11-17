// sanity/sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool, StructureBuilder} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {apiVersion, dataset, projectId} from './env'
import {ColorWheelIcon} from '@sanity/icons'

// Custom desk structure for singletons
export const singletonStructure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Our singleton document
      S.listItem()
        .title('Color Dictionary')
        .id('colorDictionary')
        .icon(ColorWheelIcon)
        .child(
          S.document()
            .schemaType('colorDictionary')
            .documentId('colorDictionary')
            .title('Automatic Word Color Dictionary')
        ),
      S.divider(),
      // The rest of our document types
      ...S.documentTypeListItems().filter(
        (listItem) => !['colorDictionary'].includes(listItem.getId() || '')
      ),
    ])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // THE DEFINITIVE FIX: Add the API token to the Sanity config
  // This allows the local studio to see drafts and make authenticated requests.
  token: process.env.SANITY_STUDIO_API_WRITE_TOKEN,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({
      structure: singletonStructure,
    }),
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
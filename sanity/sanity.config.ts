// sanity/sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool, StructureBuilder} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {apiVersion, dataset, projectId} from './env'
import {ColorWheelIcon, HomeIcon} from '@sanity/icons'

// Custom desk structure for singletons
export const singletonStructure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Homepage Settings Singleton
      S.listItem()
        .title('Homepage Settings')
        .id('homepageSettings')
        .icon(HomeIcon)
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings')
            .title('Homepage Settings')
        ),
      // Color Dictionary Singleton
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
        (listItem) => !['colorDictionary', 'homepageSettings'].includes(listItem.getId() || '')
      ),
    ])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
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



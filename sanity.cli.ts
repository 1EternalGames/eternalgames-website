import { defineCliConfig } from 'sanity/cli'

// DEFINITIVE FIX: Hardcode the public, non-secret values.
// The CLI does not have access to the Next.js process.env variables.
const projectId = '0zany1dm'
const dataset = 'production'

export default defineCliConfig({
  api: { projectId, dataset },
  project: {
    path: './sanity',
  },
})



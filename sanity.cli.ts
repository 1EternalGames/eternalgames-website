import { defineCliConfig } from 'sanity/cli'

const projectId = '0zany1dm'
const dataset = 'production'

export default defineCliConfig({
  api: { projectId, dataset }
})






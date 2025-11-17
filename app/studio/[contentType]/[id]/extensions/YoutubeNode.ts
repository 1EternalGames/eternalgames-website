// app/studio/[contentType]/[id]/extensions/YoutubeNode.ts
import {Node, mergeAttributes} from '@tiptap/core'
import {ReactNodeViewRenderer} from '@tiptap/react'
import {YoutubeComponent} from '../editor-components/YoutubeComponent'

export const YoutubeNode = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
        getAttrs: (dom) => {
          const iframe = (dom as HTMLElement).querySelector('iframe')
          return {src: iframe?.src}
        },
      },
    ]
  },

  renderHTML({HTMLAttributes}) {
    return ['div', mergeAttributes({'data-youtube-video': ''}, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeComponent)
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (options) =>
        ({commands}) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
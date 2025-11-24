// app/studio/[contentType]/[id]/RichTextEditor.tsx
'use client'

import {
  useEditor,
  EditorContent,
  Editor,
  ReactNodeViewRenderer,
  BubbleMenu,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import Bold from '@tiptap/extension-bold'
import Blockquote from '@tiptap/extension-blockquote'
import TextStyle from '@tiptap/extension-text-style'
import {Color} from '@tiptap/extension-color'
import {InputRule, Node, mergeAttributes, Extension} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {slugify} from 'transliteration'
import {useState, useEffect, useCallback, useRef} from 'react'
import React from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {useToast} from '@/lib/toastStore'
import {optimizeImageForUpload, UploadQuality} from '@/lib/image-optimizer'
import {uploadSanityAssetAction} from '../../actions'
import {FormattingToolbar} from './FormattingToolbar'
import {LinkEditorModal} from './LinkEditorModal'
import {ImageResizeComponent} from './ImageResizeComponent'
import {ImageCompareComponent} from './ImageCompareComponent'
import {TwoImageGridComponent} from './editor-components/TwoImageGridComponent'
import {FourImageGridComponent} from './editor-components/FourImageGridComponent'
import {GameDetailsNode} from './extensions/GameDetailsNode'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {TableComponent} from './editor-components/TableComponent'
import {AutoColorExtension} from './extensions/AutoColorExtension'
import {AutoBoldEnglishExtension} from './extensions/AutoBoldEnglishExtension' // <-- IMPORT ADDED
import {YoutubeNode} from './extensions/YoutubeNode'
import { DeactivateMarksExtension } from './extensions/DeactivateMarksExtension'; 
import styles from './Editor.module.css'

const DragIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" {...props}>
    <path
      d="M20.964 4H16.9719M20.964 4C20.964 4.56018 19.4727 5.60678 18.9679 6M20.964 4C20.964 3.43982 19.4727 2.39322 18.9679 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M2.99921 4H6.99136M2.99921 4C2.99921 3.43982 4.49058 2.39322 4.99529 2M2.99921 4C2.99921 4.56018 4.49058 5.60678 4.99529 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M9.81505 22.0006V21.0595C9.81505 20.4116 9.60526 19.781 9.21707 19.2622L5.39435 14.1534C5.07668 13.7288 4.83978 13.2141 4.98565 12.7043C5.34585 11.4454 6.76792 10.3261 8.35901 12.2974L9.95917 14.0049V3.59381C10.0573 1.76459 13.1325 1.18685 13.4504 3.59381V9.52698C14.933 9.33608 21.9162 10.378 20.9003 14.7917C20.8517 15.0026 20.8032 15.2167 20.7557 15.4279C20.5493 16.346 19.9407 17.98 19.2696 18.9355C18.5705 19.9309 18.897 21.5353 18.8172 22.0019"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
)

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

export const uploadFile = async (
  file: File,
  editor: Editor,
  toast: ReturnType<typeof useToast>,
  quality: UploadQuality,
) => {
  try {
    toast.info('جارٍ تهيئة الصورة للرفع...', 'left')
    const {file: optimizedFile, finalQuality} = await optimizeImageForUpload(file, quality)

    const reader = new FileReader()
    reader.readAsDataURL(optimizedFile)
    reader.onload = async () => {
      const {tr} = editor.state
      const node = editor.state.schema.nodes.image.create({src: reader.result as string})
      const transaction = tr.replaceSelectionWith(node)
      editor.view.dispatch(transaction)

      toast.info(
        `جارٍ رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(
          finalQuality * 100,
        )}%)...`,
        'left',
      )

      const formData = new FormData()
      formData.append('file', optimizedFile)
      const result = await uploadSanityAssetAction(formData)

      let imagePos: number | null = null
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src.startsWith('data:')) {
          imagePos = pos
          return false
        }
        return true
      })

      if (imagePos !== null) {
        if (result.success && result.asset) {
          const finalTransaction = editor.state.tr.setNodeMarkup(imagePos, undefined, {
            ...editor.state.doc.nodeAt(imagePos)?.attrs,
            src: result.asset.url,
            assetId: result.asset._id,
          })
          editor.view.dispatch(finalTransaction)
          toast.success('رُفِعت الصورة.', 'left')
        } else {
          throw new Error(result.error || 'أخفق رفع أصل الصورة.')
        }
      }
    }
  } catch (error: any) {
    toast.error(error.message || 'أخفق رفع الصورة.', 'left')
    let imagePos: number | null = null
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src.startsWith('data:')) {
        imagePos = pos
        return false
      }
      return true
    })
    if (imagePos !== null) {
      const failedTransaction = editor.state.tr.delete(imagePos, imagePos + 1)
      editor.view.dispatch(failedTransaction)
    }
  }
}

const TrailingNode = Extension.create({
  name: 'trailingNode',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingNode'),
        appendTransaction: (transactions, oldState, newState) => {
          const {doc, tr} = newState
          const shouldInsertNodeAtEnd = transactions.some((transaction) => transaction.docChanged)
          if (!shouldInsertNodeAtEnd) return

          const endPosition = doc.content.size
          const lastNode = doc.lastChild

          const nodeTypesThatNeedTrailingNode = [
            'image',
            'imageCompare',
            'twoImageGrid',
            'fourImageGrid',
            'gameDetails',
            'heading',
            'blockquote',
            'table',
            'youtube',
          ]

          if (lastNode && nodeTypesThatNeedTrailingNode.includes(lastNode.type.name)) {
            const paragraph = newState.schema.nodes.paragraph.create()
            return tr.insert(endPosition, paragraph)
          }
          return
        },
      }),
    ]
  },
})

const ImageCompareNode = Node.create({
  name: 'imageCompare',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src1: {default: null},
      assetId1: {default: null},
      src2: {default: null},
      assetId2: {default: null},
      'data-size': {default: 'large'},
    }
  },
  parseHTML() {
    return [{tag: 'div[data-type="image-compare"]'}]
  },
  renderHTML({HTMLAttributes}) {
    return ['div', mergeAttributes({'data-type': 'image-compare'}, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageCompareComponent)
  },
})
const CustomImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {default: null},
      alt: {default: null},
      title: {default: null},
      assetId: {default: null},
    }
  },
  parseHTML() {
    return [{tag: 'img[src]'}]
  },
  renderHTML({HTMLAttributes}) {
    return ['div', {'data-type': 'custom-image'}, ['img', HTMLAttributes]]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent)
  },
})
const TwoImageGridNode = Node.create({
  name: 'twoImageGrid',
  group: 'block',
  atom: true,
  addAttributes() {
    return {src1: null, assetId1: null, src2: null, assetId2: null}
  },
  parseHTML() {
    return [{tag: 'div[data-type="two-image-grid"]'}]
  },
  renderHTML({HTMLAttributes}) {
    return ['div', mergeAttributes({'data-type': 'two-image-grid'}, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(TwoImageGridComponent)
  },
})
const FourImageGridNode = Node.create({
  name: 'fourImageGrid',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src1: null,
      assetId1: null,
      src2: null,
      assetId2: null,
      src3: null,
      assetId3: null,
      src4: null,
      assetId4: null,
    }
  },
  parseHTML() {
    return [{tag: 'div[data-type="four-image-grid"]'}]
  },
  renderHTML({HTMLAttributes}) {
    return ['div', mergeAttributes({'data-type': 'four-image-grid'}, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(FourImageGridComponent)
  },
})

interface RichTextEditorProps {
  onEditorCreated: (editor: Editor) => void
  initialContent?: any
  colorDictionary?: {word: string; color: string}[]
}

export default function RichTextEditor({
  onEditorCreated,
  initialContent,
  colorDictionary = [],
}: RichTextEditorProps) {
  const toast = useToast()
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [currentLinkUrl, setCurrentLinkUrl] = useState<string | undefined>(undefined)
  const [isMobile, setIsMobile] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const bubbleMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios')
    else if (/Android/.test(ua)) setPlatform('android')
    else setPlatform('desktop')

    const visualViewport = window.visualViewport
    if (visualViewport) {
      const handleViewportChange = () => {
        const isKeyboardVisible = visualViewport.height < window.innerHeight * 0.9
        setIsKeyboardOpen(isKeyboardVisible)
      }
      visualViewport.addEventListener('resize', handleViewportChange)
      return () => visualViewport.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({heading: false, bulletList: false, listItem: false, bold: false, blockquote: false}),
        TextStyle,
        Color,
        AutoColorExtension.configure({
          colorMappings: colorDictionary,
        }),
        AutoBoldEnglishExtension, // <-- ENABLE EXTENSION
        DeactivateMarksExtension, 
        Bold.extend({
          addInputRules() {
            return [
              new InputRule({
                find: /(?:^|\s)(\*\*(?!\s+\*\*).+\*\*(?!\s+\*\*))$/,
                handler: ({state, range, match}) => {
                  const {tr} = state
                  const text = match[1]
                  const start = range.from
                  const end = range.to
                  tr.delete(start, end)
                  tr.insertText(text.slice(2, -2), start)
                  tr.addMark(start, start + text.length - 4, this.type.create())
                },
              }),
            ]
          },
        }),
        Heading.configure({levels: [1, 2, 3]}).extend({
          onCreate() {
            const editor = this.editor
            const transaction = editor.state.tr
            editor.state.doc.descendants((node, pos) => {
              if (node.type.name === 'heading' && !node.attrs.id) {
                const id = slugify(node.textContent)
                transaction.setNodeMarkup(pos, undefined, {...node.attrs, id})
              }
            })
            transaction.setMeta('addToHistory', false)
            editor.view.dispatch(transaction)
          },
          addAttributes() {
            return {
              ...this.parent?.(),
              id: {
                default: null,
                parseHTML: (element) => element.getAttribute('id'),
                renderHTML: (attributes) => {
                  if (!attributes.id) {
                    return {}
                  }
                  return {id: attributes.id}
                },
              },
            }
          },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {class: 'editor-link'},
        }),
        Placeholder.configure({placeholder: 'خُطَّ ما في نفسِكَ هنا...'}),
        CustomImage,
        BulletList,
        ListItem,
        ImageCompareNode,
        TwoImageGridNode,
        FourImageGridNode,
        GameDetailsNode,
        Blockquote,
        TrailingNode,
        Table.configure({resizable: false, cellMinWidth: 100}).extend({
          addNodeView() {
            return ReactNodeViewRenderer(TableComponent)
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        YoutubeNode,
      ],
      editorProps: {
        attributes: {class: styles.tiptap},
        handlePaste(view, event, slice) {
          if (!editor) return false
          const text = event.clipboardData?.getData('text/plain')
          if (text) {
            const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
            const match = text.match(youtubeRegex)
            if (match && match[2].length === 11) {
              editor.chain().focus().setYoutubeVideo({src: text}).run()
              return true
            }
          }

          const items = Array.from(event.clipboardData?.items || [])
          const imageItem = items.find((item) => item.type.startsWith('image/'))
          if (imageItem) {
            const file = imageItem.getAsFile()
            if (file) {
              uploadFile(file, editor, toast, editor.storage.uploadQuality || '1080p')
              return true
            }
          }
          return false
        },
        handleDrop(view, event, slice, moved) {
          if (!editor || moved) return false
          const file = event.dataTransfer?.files[0]
          if (file && file.type.startsWith('image/')) {
            uploadFile(file, editor, toast, editor.storage.uploadQuality || '1080p')
            return true
          }
          return false
        },
      },
      immediatelyRender: false,
      content: initialContent || '',
      onSelectionUpdate: ({editor}) => {
        if (editor.isActive('link')) {
          setCurrentLinkUrl(editor.getAttributes('link').href)
        } else {
          setCurrentLinkUrl(undefined)
        }
      },
    },
    [colorDictionary],
  ) 

  const handleOpenLinkModal = useCallback(() => {
    setIsLinkModalOpen(true)
  }, [])
  const handleCloseLinkModal = useCallback(() => {
    setIsLinkModalOpen(false)
    setCurrentLinkUrl(undefined)
    editor?.chain().focus().run()
  }, [editor])
  const handleSetLink = useCallback(
    (url: string) => {
      if (editor) {
        editor.chain().focus().extendMarkRange('link').setLink({href: url}).run()
      }
      handleCloseLinkModal()
    },
    [editor, handleCloseLinkModal],
  )
  const handleRemoveLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    handleCloseLinkModal()
  }, [editor, handleCloseLinkModal])
  useEffect(() => {
    if (editor) {
      onEditorCreated(editor)
    }
  }, [editor, onEditorCreated])
  if (!editor) {
    return null
  }

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'A' && target.classList.contains('editor-link')) {
          e.preventDefault()
        }
      }}
    >
      <style jsx global>{`
        .tiptap a.editor-link {
          color: var(--accent);
          text-decoration: underline;
          text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent);
          cursor: default;
        }
        .tiptap h1 {
          font-family: var(--font-main), sans-serif;
          font-size: 3.6rem;
          line-height: 1.2;
          margin: 4rem 0 2rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .tiptap h2 {
          font-family: var(--font-main), sans-serif;
          font-size: 2.8rem;
          line-height: 1.2;
          margin: 4rem 0 2rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .tiptap h3 {
          font-family: var(--font-main), sans-serif;
          font-size: 2.2rem;
          line-height: 1.2;
          margin: 3rem 0 1.5rem 0;
        }
        .tiptap blockquote {
          margin: 2rem 0;
          padding-right: 1.5rem;
          border-right: 3px solid var(--accent);
          font-style: italic;
          color: var(--text-secondary);
        }
        .tiptap p.is-empty::before {
          content: '';
          display: inline-block;
        }
        .tiptap p.is-empty {
          min-height: 1rem;
        }
      `}</style>

      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          placement: platform === 'android' ? 'bottom' : 'top',
          offset: [0, 8],
          appendTo: () => document.body,
        }}
        shouldShow={({editor, state}) => {
          const {from, to} = state.selection
          const isTextSelection = from !== to
          return isTextSelection
        }}
      >
        <div ref={bubbleMenuRef} className={isKeyboardOpen && isMobile ? styles.docked : ''}>
          <FormattingToolbar editor={editor} onLinkClick={handleOpenLinkModal} platform={platform} />
        </div>
      </BubbleMenu>

      <LinkEditorModal
        isOpen={isLinkModalOpen}
        onClose={handleCloseLinkModal}
        onSubmit={handleSetLink}
        onRemove={handleRemoveLink}
        initialUrl={currentLinkUrl}
      />
      <EditorContent editor={editor} />
    </div>
  )
}
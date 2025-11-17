// app/studio/[contentType]/[id]/editor-components/YoutubeComponent.tsx
'use client'

import {NodeViewWrapper, NodeViewProps} from '@tiptap/react'
import {useState} from 'react'
import styles from './YoutubeComponent.module.css'
import editorStyles from '../Editor.module.css'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export const YoutubeComponent = ({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) => {
  const [urlInput, setUrlInput] = useState(node.attrs.src || '')
  const videoId = getYouTubeId(node.attrs.src)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }

  const handleUpdate = () => {
    updateAttributes({src: urlInput})
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUpdate()
    }
  }

  return (
    <NodeViewWrapper as="div" className={styles.youtubeContainer} data-drag-handle>
      {!videoId ? (
        <div className={styles.urlInputContainer}>
          <input
            type="text"
            value={urlInput}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            onBlur={handleUpdate}
            placeholder="ألصق رابط يوتيوب هنا ثم اضغط إدخال"
            className={editorStyles.sidebarInput}
            autoFocus
          />
        </div>
      ) : (
        <div className={styles.iframeContainer}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.iframe}
          ></iframe>
        </div>
      )}

      <div className={editorStyles.imageNodeMenu} contentEditable={false}>
        <button
          onClick={deleteNode}
          className={`${editorStyles.bubbleMenuButton} ${editorStyles.deleteButton}`}
          title="Delete Video"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </NodeViewWrapper>
  )
}
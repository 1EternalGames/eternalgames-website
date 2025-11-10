// app/studio/[contentType]/[id]/EditorStateSync.tsx
'use client';

import { useLayoutEffect } from 'react';
import { useEditorStore } from '@/lib/editorStore';

export function EditorStateSync() {

    useLayoutEffect(() => {

        document.body.classList.add('editor-active');
        

        useEditorStore.setState({ isEditorActive: true });

        return () => {
            document.body.classList.remove('editor-active');
            useEditorStore.setState({ isEditorActive: false, liveUrl: null });
        };
    }, []);

    return null;
}
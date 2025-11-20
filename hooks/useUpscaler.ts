// hooks/useUpscaler.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type UpscaleStatus = 'idle' | 'init' | 'downloading' | 'processing' | 'complete' | 'error';

interface UpscalerState {
    status: UpscaleStatus;
    progress: number; // 0-100
    message: string;
    resultSrc: string | null;
    originalSrc: string | null;
}

export function useUpscaler() {
    const [state, setState] = useState<UpscalerState>({
        status: 'idle',
        progress: 0,
        message: '',
        resultSrc: null,
        originalSrc: null,
    });

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        workerRef.current = new Worker(new URL('../lib/workers/upscaler.worker.ts', import.meta.url), {
            type: 'module'
        });

        workerRef.current.onmessage = (event) => {
            const { status, message, progress, result } = event.data;

            switch (status) {
                case 'init':
                    setState(prev => ({ ...prev, status: 'init', message: message || 'البدء...', progress: 0 }));
                    break;
                case 'downloading':
                    setState(prev => ({ ...prev, status: 'downloading', progress: progress || 0, message: 'تحميل نموذج الذكاء الاصطناعي...' }));
                    break;
                case 'processing':
                    // Update progress bar during tile processing
                    setState(prev => ({ ...prev, status: 'processing', progress: progress || 0, message: message || 'جارٍ المعالجة...' }));
                    break;
                case 'complete':
                    setState(prev => ({ ...prev, status: 'complete', resultSrc: result, progress: 100 }));
                    break;
                case 'error':
                    setState(prev => ({ ...prev, status: 'error', message: message || 'حدث خطأ.' }));
                    break;
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const upscaleImage = useCallback((file: File) => {
        const originalUrl = URL.createObjectURL(file);
        setState({
            status: 'init',
            progress: 0,
            message: 'جارٍ التهيئة...',
            resultSrc: null,
            originalSrc: originalUrl
        });

        workerRef.current?.postMessage({ type: 'upscale', image: originalUrl });
    }, []);

    const reset = useCallback(() => {
        setState({
            status: 'idle',
            progress: 0,
            message: '',
            resultSrc: null,
            originalSrc: null,
        });
    }, []);

    return { ...state, upscaleImage, reset };
}
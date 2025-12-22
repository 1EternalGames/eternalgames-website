// app/studio/[contentType]/[id]/metadata/VerticalImageEditor.tsx
'use client';

import React, { useState, useRef, useEffect, useTransition, useLayoutEffect } from 'react';
import { useToast } from '@/lib/toastStore';
import { uploadSanityAssetAction } from '../../../actions';
import { optimizeImageForUpload, UploadQuality } from '@/lib/image-optimizer';
import styles from './VerticalImageEditor.module.css';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';

const UploadIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ResetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

interface VerticalImageEditorProps {
    currentImageUrl: string | null;
    onImageChange: (assetId: string | null, url: string | null) => void;
    uploadQuality: UploadQuality;
}

export default function VerticalImageEditor({ currentImageUrl, onImageChange, uploadQuality }: VerticalImageEditorProps) {
    // Local state for the editing session
    const [localImageSrc, setLocalImageSrc] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Transform State (Virtual 800x1000 Space)
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [baseScale, setBaseScale] = useState(1);
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    
    // Responsive Scaling State
    const [containerWidth, setContainerWidth] = useState(1);
    
    const [isUploading, startUpload] = useTransition();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Drag Logic refs
    const dragStart = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Visual Drag Drop State
    const [isDragOver, setIsDragOver] = useState(false);
    
    const toast = useToast();

    // Measure container for responsive scaling
    useLayoutEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Initialize with current image if available
    useEffect(() => {
        if (currentImageUrl && !localImageSrc) {
            // Viewing existing saved image
        }
    }, [currentImageUrl, localImageSrc]);

    const loadImage = (src: string) => {
        const img = new window.Image();
        
        // --- FIX: ALLOW CROSS-ORIGIN CANVAS ACCESS ---
        img.crossOrigin = "anonymous";
        
        img.src = src;
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            setImgDims({ width: w, height: h });
            
            // Calculate base scale to cover 800x1000 virtual space
            const targetW = 800;
            const targetH = 1000;
            
            const scaleW = targetW / w;
            const scaleH = targetH / h;
            
            // "Cover" fit
            const newBaseScale = Math.max(scaleW, scaleH);
            
            setBaseScale(newBaseScale);
            setTransform({ x: 0, y: 0, scale: 1 });
            setLocalImageSrc(src);
            setIsEditing(true);
        };
        
        img.onerror = () => {
            toast.error("تعذر تحميل الصورة. قد تكون هناك مشكلة في المصدر.");
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    loadImage(ev.target.result as string);
                }
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset
        }
    };

    // --- Drag & Drop for File Upload ---
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(true);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    loadImage(ev.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            toast.error('يرجى إفلات ملف صورة صالح.');
        }
    };

    // --- Interaction Handlers (Pan & Zoom) ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditing) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: transform.x, y: transform.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !isEditing) return;
        e.preventDefault();
        
        // Map visual drag to virtual 800px space
        // If container is 400px, 1px mouse = 2px virtual
        const visualRatio = 800 / containerWidth; 
        
        const dx = (e.clientX - dragStart.current.x) * visualRatio;
        const dy = (e.clientY - dragStart.current.y) * visualRatio;
        
        setTransform(prev => ({ ...prev, x: initialPos.current.x + dx, y: initialPos.current.y + dy }));
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => {
        setIsDragging(false);
        setIsDragOver(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isEditing) return;
        e.stopPropagation();
        e.preventDefault();
        setTransform(prev => {
            const newScale = Math.max(0.1, Math.min(5, prev.scale - e.deltaY * 0.001));
            return { ...prev, scale: newScale };
        });
    };

    // --- Save & Process ---
    const handleSave = async () => {
        if (!localImageSrc) return;
        
        startUpload(async () => {
            try {
                const canvas = document.createElement('canvas');
                // Output Resolution: 1600x2000 (Vanguard High Quality - 2x Virtual)
                const targetW = 1600; 
                const targetH = 2000;
                
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context failed");

                const img = new window.Image();
                // --- FIX: CORS ---
                img.crossOrigin = "anonymous";
                img.src = localImageSrc;
                
                await new Promise((resolve, reject) => { 
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // Fill background
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, targetW, targetH);

                // Mapping from Virtual (800x1000) to Target (1600x2000)
                const renderRatio = targetW / 800; // = 2
                
                const effectiveScale = baseScale * transform.scale * renderRatio;
                
                // 1. Center of Canvas
                const centerX = targetW / 2;
                const centerY = targetH / 2;
                
                // 2. Translate to center + user offset (scaled)
                ctx.translate(centerX + (transform.x * renderRatio), centerY + (transform.y * renderRatio));
                
                // 3. Scale
                ctx.scale(effectiveScale, effectiveScale);

                // 4. Draw Image centered on origin
                ctx.drawImage(img, -imgDims.width / 2, -imgDims.height / 2);
                
                // Convert to Blob
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                if (!blob) throw new Error("Blob creation failed");

                const rawFile = new File([blob], "vertical-vanguard-crop.jpg", { type: "image/jpeg" });
                
                // Use built-in optimizer for safety
                const { file: optimizedFile } = await optimizeImageForUpload(rawFile, uploadQuality);
                
                const formData = new FormData();
                formData.append('file', optimizedFile);
                
                const result = await uploadSanityAssetAction(formData);
                
                if (result.success && result.asset) {
                    onImageChange(result.asset._id, result.asset.url);
                    setIsEditing(false);
                    setLocalImageSrc(null); 
                    toast.success("تم حفظ الصورة العمودية");
                } else {
                    throw new Error(result.error);
                }

            } catch (error) {
                console.error(error);
                toast.error("فشل حفظ الصورة - تحقق من الصلاحيات.");
            }
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setLocalImageSrc(null);
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    const displayImageSrc = isEditing ? localImageSrc : currentImageUrl;
    
    const responsiveScale = containerWidth / 800;
    
    const previewTransform = isEditing 
        ? `translate(-50%, -50%) translate(${transform.x * responsiveScale}px, ${transform.y * responsiveScale}px) scale(${baseScale * transform.scale * responsiveScale})`
        : `translate(-50%, -50%) scale(1)`; 

    return (
        <div className={styles.container}>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />

            <div 
                ref={containerRef}
                className={`${styles.editorFrame} ${isEditing ? styles.active : ''} ${isDragOver ? styles.dragOver : ''} ${isDragging ? styles.editing : ''}`}
                // Drag & Drop Handlers on Container
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {displayImageSrc ? (
                    <>
                        {/* 
                           INTERACTIVE LAYER
                           This layer captures mouse events for panning ONLY when editing.
                           It sits on top of the image visually but is transparent.
                        */}
                        {isEditing && (
                            <div 
                                className={styles.manipulationLayer}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onWheel={handleWheel}
                            />
                        )}

                        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000', pointerEvents: 'none' }}>
                            <img 
                                src={displayImageSrc} 
                                alt="Vertical Preview" 
                                className={styles.previewImage}
                                draggable={false}
                                style={{
                                    transform: previewTransform,
                                    left: '50%',
                                    top: '50%',
                                    objectFit: isEditing ? undefined : 'cover',
                                    width: isEditing ? imgDims.width : '100%',
                                    height: isEditing ? imgDims.height : '100%',
                                }}
                            />
                            
                            {isEditing && (
                                <div className={styles.overlayControls}>
                                    <button className={styles.controlButton} onClick={() => setTransform({x:0, y:0, scale: 1})} title="إعادة تعيين">
                                        <ResetIcon />
                                    </button>
                                    <button className={`${styles.controlButton} ${styles.save}`} onClick={handleSave} title="حفظ وقص">
                                        <CheckIcon />
                                        <span>حفظ</span>
                                    </button>
                                    <button className={styles.controlButton} onClick={handleCancel} title="إلغاء">
                                        <CloseIcon />
                                    </button>
                                </div>
                            )}
                            
                            {isEditing && (
                                <div className={styles.zoomBadge}>
                                    {(transform.scale * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Drop Overlay for Initial Upload */
                    <div 
                        className={styles.dropOverlay} 
                        onClick={() => fileInputRef.current?.click()}
                    >
                         <div className={styles.placeholder}>
                            <UploadIcon />
                            <span>اضغط أو أفلت لرفع صورة عمودية</span>
                            <span style={{fontSize: '0.8rem', opacity: 0.7}}>4:5 Aspect Ratio</span>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className={styles.loadingOverlay}>
                        <div className="spinner" />
                        <span style={{marginTop: '1rem'}}>جاري المعالجة والرفع...</span>
                    </div>
                )}
            </div>

            {/* Helper button to change image when not in edit mode */}
            {!isEditing && displayImageSrc && (
                <button 
                    className={`outline-button ${styles.changeImageBtn}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    تغيير الصورة
                </button>
            )}
        </div>
    );
}
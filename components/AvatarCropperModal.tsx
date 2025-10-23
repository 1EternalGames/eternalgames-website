'use client';

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AnimatePresence, motion } from 'framer-motion';

interface AvatarCropperModalProps {
isOpen: boolean;
onClose: () => void;
imageSrc: string;
onCropComplete: (file: File) => void;
}

// Function to convert canvas data to a file
function canvasToFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
return new Promise((resolve, reject) => {
canvas.toBlob((blob) => {
if (!blob) {
reject(new Error('Canvas is empty'));
return;
}
resolve(new File([blob], fileName, { type: 'image/png' }));
}, 'image/png');
});
}

export default function AvatarCropperModal({
isOpen,
onClose,
imageSrc,
onCropComplete,
}: AvatarCropperModalProps) {
const imgRef = useRef<HTMLImageElement>(null);
const [crop, setCrop] = useState<Crop>({
unit: '%',
width: 50,
height: 50,
x: 25,
y: 25,
});
const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

const handleCrop = async () => {
if (!completedCrop || !imgRef.current) {
console.error('Crop or image reference not available.');
return;
}

const image = imgRef.current;
const canvas = document.createElement('canvas');
const scaleX = image.naturalWidth / image.width;
const scaleY = image.naturalHeight / image.height;

canvas.width = completedCrop.width;
canvas.height = completedCrop.height;
const ctx = canvas.getContext('2d');

if (!ctx) {
console.error('Could not get canvas context.');
return;
}

ctx.drawImage(
image,
completedCrop.x * scaleX,
completedCrop.y * scaleY,
completedCrop.width * scaleX,
completedCrop.height * scaleY,
0,
0,
completedCrop.width,
completedCrop.height
);

try {
const croppedFile = await canvasToFile(canvas, 'avatar.png');
onCropComplete(croppedFile);
} catch (error) {
console.error("Error creating cropped file:", error);
}
};

return (
<AnimatePresence>
{isOpen && (
<motion.div
className="modal-overlay"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
onClick={onClose}
>
<motion.div
className="modal-content"
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
onClick={(e) => e.stopPropagation()}
style={{ maxWidth: '600px', width: '100%' }}
>
<h3 style={{ marginTop: 0, marginBottom: '2rem' }}>Crop Your Avatar</h3>
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
<ReactCrop
crop={crop}
onChange={(_, percentCrop) => setCrop(percentCrop)}
onComplete={(c) => setCompletedCrop(c)}
aspect={1}
circularCrop
>
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
ref={imgRef}
alt="Crop me"
src={imageSrc}
style={{ maxHeight: '70vh' }}
/>
</ReactCrop>
</div>
<div className="modal-actions">
<button onClick={onClose} className="outline-button">إلغاء</button>
<button onClick={handleCrop} className="primary-button">تأكيد</button>
</div>
</motion.div>
</motion.div>
)}
</AnimatePresence>
);
}




























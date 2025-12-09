// components/studio/social/shared/canvas-utils.ts

export const calculateWrappedLines = (text: string, fontSize: number, maxWidth: number, fontWeight: number | string = 700, fontFamily: string = "'Cairo', sans-serif") => {
    if (typeof document === 'undefined') return [text];
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [text];

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};
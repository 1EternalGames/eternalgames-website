// lib/layoutUtils.ts

export const generateLayoutId = (prefix: string | null | undefined, type: 'container' | 'image' | 'title', id: number | string): string | undefined => {
    // If no prefix (e.g. standard navigation), return undefined to disable transition
    if (!prefix || prefix === 'default') return undefined;

    return `${prefix}-card-${type}-${id}`;
};
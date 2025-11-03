// hooks/usePopoverManager.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type PopoverIdentifier = string | null;

/**
 * Manages the state for a group of popovers, including opening/closing
 * and handling clicks outside the component to close them.
 * @returns An object containing the popover ref, the currently open popover's ID,
 * and functions to toggle and close popovers.
 */
export function usePopoverManager() {
    const [openPopover, setOpenPopover] = useState<PopoverIdentifier>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const togglePopover = useCallback((popoverId: string) => {
        setOpenPopover(current => (current === popoverId ? null : popoverId));
    }, []);

    const closePopover = useCallback(() => {
        setOpenPopover(null);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                closePopover();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closePopover]);

    return { popoverRef, openPopover, togglePopover, closePopover };
}









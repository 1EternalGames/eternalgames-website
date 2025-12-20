// hooks/usePopoverManager.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type PopoverIdentifier = string | null;

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
            // THE DEFINITIVE FIX:
            // The ref is now placed on the container of the popovers and their triggers.
            // If a click happens AND the popoverRef exists AND the click is OUTSIDE the ref's boundary,
            // then we close the currently open popover.
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                closePopover();
            }
        };
        
        // We only add the listener if a popover is open.
        if (openPopover) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openPopover, closePopover]); // Re-run effect when the open popover changes

    return { popoverRef, openPopover, togglePopover, closePopover };
}



// hooks/useSearchablePopover.ts
'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';

interface UseSearchablePopoverProps<T> {
    searchAction: (query: string) => Promise<T[]>;
    initialResults?: T[];
}

export function useSearchablePopover<T>({ searchAction, initialResults = [] }: UseSearchablePopoverProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<T[]>(initialResults);
    const [isSearching, startSearchTransition] = useTransition();
    const popoverRef = useRef<HTMLDivElement>(null);

    const togglePopover = useCallback(() => setIsOpen(prev => !prev), []);
    const closePopover = useCallback(() => setIsOpen(false), []);
    const openPopover = useCallback(() => setIsOpen(true), []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                closePopover();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closePopover]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setResults(initialResults);
            return;
        }

        startSearchTransition(async () => {
            if (searchTerm.length > 0) {
                const searchResults = await searchAction(searchTerm);
                setResults(searchResults);
            } else {
                setResults(initialResults);
            }
        });
    }, [isOpen, searchTerm, searchAction, initialResults]);

    return {
        popoverRef,
        isOpen,
        searchTerm,
        results,
        isSearching,
        setSearchTerm,
        togglePopover,
        closePopover,
        openPopover,
    };
}






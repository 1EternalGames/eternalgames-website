// hooks/useBodyClass.ts
'use client';

import { useEffect } from 'react';

/**
 * A custom hook to manage adding and removing classes from the `<body>` element.
 * @param {string | string[]} classNames - The class name or an array of class names to apply.
 * @param {boolean} [condition=true] - A boolean condition. The class is applied if true, removed if false.
 */
export function useBodyClass(classNames: string | string[], condition: boolean = true) {
    useEffect(() => {
        const classes = Array.isArray(classNames) ? classNames : [classNames];

        if (condition) {
            document.body.classList.add(...classes);
        } else {
            document.body.classList.remove(...classes);
        }

        // Cleanup function to remove the class when the component unmounts
        // or when the condition becomes false in the next render.
        return () => {
            document.body.classList.remove(...classes);
        };
    }, [classNames, condition]); // Re-run the effect if the class name or condition changes
}






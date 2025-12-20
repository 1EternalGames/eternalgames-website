// hooks/useAsyncValidation.ts
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useDebounce } from './useDebounce';

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';
type ValidationResult = { type: ValidationStatus; message: string };

/**
 * A hook to perform debounced, asynchronous validation on an input value.
 * @param value The current value of the input to be validated.
 * @param validationFn The server action or async function to call for validation.
 * @param initialValue The original/initial value of the field to compare against.
 * @param delay The debounce delay in milliseconds.
 * @returns A validation result object: { type: ValidationStatus; message: string }.
 */
export function useAsyncValidation<T>(
    value: T,
    validationFn: (value: T, ...args: any[]) => Promise<{ isValid?: boolean; available?: boolean; message: string }>,
    initialValue?: T,
    delay: number = 500
): ValidationResult {
    const [status, setStatus] = useState<ValidationResult>({ type: 'idle', message: '' });
    const [isPending, startTransition] = useTransition();
    const debouncedValue = useDebounce(value, delay);

    useEffect(() => {
        // Don't validate if the value is empty or hasn't changed from its initial state
        if (!debouncedValue || debouncedValue === initialValue) {
            setStatus({ type: 'idle', message: '' });
            return;
        }

        setStatus({ type: 'checking', message: 'جارٍ التحقق...' });

        startTransition(async () => {
            const result = await validationFn(debouncedValue);
            const isValid = result.isValid ?? result.available ?? false;
            setStatus({
                type: isValid ? 'valid' : 'invalid',
                message: result.message,
            });
        });
    }, [debouncedValue, initialValue, validationFn]);

    return status;
}






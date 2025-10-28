// hooks/useUrlState.ts
'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type SetUrlStateAction<S> = S | ((prevState: S) => S);

function useSetSearchParam() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const setSearchParam = useCallback((key: string, value: string | null | undefined) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (!value) {
            current.delete(key);
        } else {
            current.set(key, value);
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";

        startTransition(() => {
            router.replace(`${pathname}${query}`, { scroll: false });
        });
    }, [pathname, router, searchParams]);

    return { setSearchParam, isPending };
}

export function useUrlState<T>({
    param,
    defaultValue,
    serialize,
    deserialize,
}: {
    param: string;
    defaultValue: T;
    serialize: (value: T) => string | undefined;
    deserialize: (value: string | null) => T;
}) {
    const searchParams = useSearchParams();
    const { setSearchParam } = useSetSearchParam();

    const [state, setState] = useState(() => {
        const paramValue = searchParams.get(param);
        return deserialize(paramValue);
    });

    // THE DEFINITIVE FIX:
    // This useEffect was causing a feedback loop.
    // 1. User types -> local state updates -> URL updates.
    // 2. URL update causes searchParams to change.
    // 3. This effect sees searchParams change and calls setState AGAIN.
    // 4. This redundant re-render causes severe input lag.
    // By removing it, the initial useState provides the initial value,
    // and `updateState` correctly handles all subsequent changes without a loop.
    /*
    useEffect(() => {
        const paramValue = searchParams.get(param);
        setState(deserialize(paramValue));
    }, [searchParams, param, deserialize]);
    */

    const updateState = useCallback((value: SetUrlStateAction<T>) => {
        const newValue = typeof value === 'function' ? (value as (prevState: T) => T)(state) : value;
        setState(newValue);
        setSearchParam(param, serialize(newValue));
    }, [state, setSearchParam, param, serialize]);

    return [state, updateState] as const;
}
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@tanstack/react-router';
import type { Parser } from '../lib/parsers';

export function useUrlState<T>(
  key: string,
  options: {
    parser: Parser<T>;
    defaultValue: T;
    history?: 'push' | 'replace';
  }
) {
  const router = useRouter();
  const { parser, defaultValue, history = 'replace' } = options;

  const [internalState, setInternalState] = useState<T>(() => {
    const searchParams = new URLSearchParams(router.state.location.search);
    const value = searchParams.get(key);
    if (value !== null) {
      return parser.parse(value) ?? defaultValue;
    }
    return defaultValue;
  });

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setInternalState(oldState => {
        const finalState = typeof newState === 'function' ? (newState as (prevState: T) => T)(oldState) : newState;
        const searchParams = new URLSearchParams(router.state.location.search);
        const serializedValue = parser.serialize(finalState);

        if (finalState === defaultValue || serializedValue === parser.serialize(defaultValue)) {
            searchParams.delete(key);
        } else {
            searchParams.set(key, serializedValue);
        }

        router.navigate({
            to: router.state.location.pathname,
            search: searchParams.toString(),
            replace: history === 'replace',
        });

        return finalState;
    });
  }, [key, parser, defaultValue, router, history]);


  useEffect(() => {
    const searchParams = new URLSearchParams(router.state.location.search);
    const value = searchParams.get(key);
    const parsedValue = value === null ? defaultValue : parser.parse(value) ?? defaultValue;

    if (JSON.stringify(parsedValue) !== JSON.stringify(internalState)) {
        setInternalState(parsedValue);
    }
  }, [router.state.location.search, key, parser, defaultValue, internalState]);

  return [internalState, setState] as const;
}

type StateFromParsers<T extends Record<string, Parser<any>>> = {
    [K in keyof T]: T[K] extends Parser<infer U> ? U : never;
}

export function useUrlStates<T extends Record<string, Parser<any>>>(
    parsers: T,
    options: {
      history?: 'push' | 'replace';
    }
  ) {
    type State = StateFromParsers<T>;
    const router = useRouter();
    const { history = 'replace' } = options;
  
    const [internalState, setInternalState] = useState<Partial<State>>(() => {
        const searchParams = new URLSearchParams(router.state.location.search);
        const initialState: Partial<State> = {};
        for (const key in parsers) {
            const value = searchParams.get(key);
            if (value !== null) {
                initialState[key] = parsers[key].parse(value) ?? undefined;
            }
        }
        return initialState;
    });
  
    const setState = useCallback((newState: Partial<{[K in keyof State]: State[K] | null}>) => {
        const searchParams = new URLSearchParams(router.state.location.search);
        let changed = false;
        const finalState: Partial<State> = {...internalState, ...newState};

        for (const key in newState) {
            if (newState.hasOwnProperty(key)){
                const parser = parsers[key];
                const value = (newState as any)[key];
                if(parser && value !== undefined && value !== null){
                    const serializedValue = parser.serialize(value);
                    if(searchParams.get(key) !== serializedValue){
                        searchParams.set(key, serializedValue);
                        changed = true;
                    }
                } else {
                    if(searchParams.has(key)){
                        searchParams.delete(key);
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            router.navigate({
              to: router.state.location.pathname,
              search: searchParams.toString(),
              replace: history === 'replace',
            });
        }

        setInternalState(finalState as Partial<State>);
    }, [parsers, router, history, internalState]);

    useEffect(() => {
        const searchParams = new URLSearchParams(router.state.location.search);
        const newState: Partial<State> = {};
        let changed = false;
        for (const key in parsers) {
            const value = searchParams.get(key);
            const parsedValue = value === null ? undefined : parsers[key].parse(value) ?? undefined;
            if(JSON.stringify(internalState[key]) !== JSON.stringify(parsedValue)){
                newState[key] = parsedValue;
                changed = true;
            }
        }

        if(changed){
            setInternalState(prev => ({...prev, ...newState}));
        }

    }, [router.state.location.search, parsers, internalState]);
  
    return [internalState, setState] as const;
  }
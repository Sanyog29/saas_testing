'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CacheEntry {
    data: any;
    timestamp: number;
}

interface DataCacheContextType {
    getCachedData: (key: string) => any | null;
    setCachedData: (key: string, data: any) => void;
    invalidateCache: (key?: string) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
    const [cache, setCache] = useState<Record<string, CacheEntry>>({});

    const getCachedData = useCallback((key: string) => {
        const entry = cache[key];
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
        if (isExpired) return null;

        return entry.data;
    }, [cache]);

    const setCachedData = useCallback((key: string, data: any) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }));
    }, []);

    const invalidateCache = useCallback((key?: string) => {
        if (key) {
            setCache(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } else {
            setCache({});
        }
    }, []);

    return (
        <DataCacheContext.Provider value={{ getCachedData, setCachedData, invalidateCache }}>
            {children}
        </DataCacheContext.Provider>
    );
}

export function useDataCache() {
    const context = useContext(DataCacheContext);
    if (!context) {
        throw new Error('useDataCache must be used within a DataCacheProvider');
    }
    return context;
}

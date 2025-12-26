
import { useState, useEffect } from 'react';

export function useFormPersistence<T>(key: string, initialData: T) {
    const [data, setData] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : initialData;
        } catch (e) {
            console.warn(`Error parsing localStorage key "${key}":`, e);
            return initialData;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Failed to save state to localStorage key "${key}":`, e);
        }
    }, [key, data]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(key);
            setData(initialData);
        } catch (e) {
            console.error(`Failed to clear localStorage key "${key}":`, e);
        }
    };

    return [data, setData, clearDraft] as const;
}

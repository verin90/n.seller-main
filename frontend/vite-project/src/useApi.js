import { useState, useEffect } from 'react';
import { api, errorText } from './api';

export function useApi(path) {
    const [result, setResult] = useState(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        if (!path) return;
        const controller = new AbortController();
        api.get(path, { signal: controller.signal }).then(({ data }) => {
            setResult({ path, revision, data });
        }).catch((error) => {
            if (!controller.signal.aborted) {
                setResult({ path, revision, error: errorText(error), status: error.response?.status });
            }
        });
        return () => controller.abort();
    }, [path, revision]);

    const current = result?.path === path && result.revision === revision ? result : null;
    return { ...current, loading: Boolean(path && !current), reload: () => setRevision((value) => value + 1) };
}

'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
            <span className="material-icons text-4xl text-f1-red">error_outline</span>
            <h1 className="text-xl font-bold uppercase">Something went wrong</h1>
            <p className="max-w-md text-sm text-f1-text-secondary">Please try loading this page again.</p>
            <button onClick={reset} className="rounded-lg bg-f1-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700">
                Try again
            </button>
        </div>
    );
}

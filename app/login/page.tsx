import { Suspense } from 'react';
import LoginClient from '@/components/auth/LoginClient';

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="animate-spin material-icons text-2xl text-f1-text-muted">autorenew</span>
            </div>
        }>
            <LoginClient />
        </Suspense>
    );
}

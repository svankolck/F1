import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
            <span className="material-icons text-4xl text-f1-red">wrong_location</span>
            <h1 className="text-xl font-bold uppercase">Page not found</h1>
            <p className="text-sm text-f1-text-secondary">This corner of the paddock does not exist.</p>
            <Link href="/" className="rounded-lg bg-f1-red px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700">
                Back to home
            </Link>
        </div>
    );
}

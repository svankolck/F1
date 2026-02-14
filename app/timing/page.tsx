export default function TimingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-icons text-6xl text-f1-text-muted">timer</span>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Live Timing</h1>
            <p className="text-f1-text-secondary text-center max-w-md">
                Live timing data will appear here during practice, qualifying, and race sessions.
            </p>
            <div className="glass-card px-4 py-2 mt-4">
                <span className="text-xs font-mono text-f1-text-muted">Coming in Phase 5</span>
            </div>
        </div>
    );
}

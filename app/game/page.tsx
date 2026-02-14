export default function GamePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-icons text-6xl text-f1-text-muted">sports_esports</span>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Prediction Game</h1>
            <p className="text-f1-text-secondary text-center max-w-md">
                Predict race results, earn points, and compete with friends.
            </p>
            <div className="glass-card px-4 py-2 mt-4">
                <span className="text-xs font-mono text-f1-text-muted">Coming in Phase 7</span>
            </div>
        </div>
    );
}

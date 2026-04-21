interface LoopProgressBarProps {
    progress: number;
    isRunning: boolean;
}

export function LoopProgressBar({ progress, isRunning }: LoopProgressBarProps) {
    return (
        <div className={`loop-progress ${isRunning ? 'loop-progress--running' : ''}`}>
            <div
                className="loop-progress__fill"
                style={{ width: isRunning ? `${progress * 100}%` : '0%' }}
            />
        </div>
    );
}

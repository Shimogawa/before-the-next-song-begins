import type { SliceVisualState } from '../audio/types';

interface SliceButtonProps {
    index: number;
    state: SliceVisualState;
    volume: number;
    disabled: boolean;
    onToggle: (index: number) => void;
    onVolumeChange: (index: number, value: number) => void;
}

export function SliceButton({ index, state, volume, disabled, onToggle, onVolumeChange }: SliceButtonProps) {
    return (
        <button
            className={`slice-button slice-button--${state}`}
            disabled={disabled}
            onClick={() => onToggle(index)}
        >
            <span className="slice-button__label">音色 {index + 1}</span>
            <span className="slice-button__indicator" />
            <input
                type="range"
                className="slice-button__volume"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => onVolumeChange(index, Number(e.target.value))}
            />
        </button>
    );
}

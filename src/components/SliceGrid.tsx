import type { SliceVisualState } from '../audio/types';
import { SliceButton } from './SliceButton';

interface SliceGridProps {
    sliceStates: SliceVisualState[];
    volumes: number[];
    disabled: boolean;
    onToggle: (index: number) => void;
    onVolumeChange: (index: number, value: number) => void;
}

export function SliceGrid({ sliceStates, volumes, disabled, onToggle, onVolumeChange }: SliceGridProps) {
    return (
        <div className="slice-grid">
            {sliceStates.map((state, i) => (
                <SliceButton
                    key={i}
                    index={i}
                    state={state}
                    volume={volumes[i] ?? 1}
                    disabled={disabled}
                    onToggle={onToggle}
                    onVolumeChange={onVolumeChange}
                />
            ))}
        </div>
    );
}

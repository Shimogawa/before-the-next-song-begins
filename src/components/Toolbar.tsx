interface ToolbarProps {
    masterVolume: number;
    disabled: boolean;
    isRunning: boolean;
    onMasterVolumeChange: (value: number) => void;
    onEnableAll: () => void;
    onDisableAll: () => void;
    onStop: () => void;
    onSkipToNext: () => void;
}

export function Toolbar({
    masterVolume,
    disabled,
    isRunning,
    onMasterVolumeChange,
    onEnableAll,
    onDisableAll,
    onStop,
    onSkipToNext,
}: ToolbarProps) {
    return (
        <div className="toolbar">
            <div className="toolbar__volume">
                <label className="toolbar__volume-label">音量</label>
                <input
                    type="range"
                    className="toolbar__volume-slider"
                    min={0}
                    max={1}
                    step={0.01}
                    value={masterVolume}
                    onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                />
            </div>
            <div className="toolbar__actions">
                <button className="toolbar__btn" disabled={disabled} onClick={onEnableAll}>
                    全部启用
                </button>
                <button className="toolbar__btn" disabled={disabled} onClick={onDisableAll}>
                    全部禁用
                </button>
                <button className="toolbar__btn toolbar__btn--skip" disabled={disabled || !isRunning} onClick={onSkipToNext}>
                    下一循环
                </button>
                <button className="toolbar__btn toolbar__btn--stop" disabled={disabled} onClick={onStop}>
                    停止播放
                </button>
            </div>
        </div>
    );
}

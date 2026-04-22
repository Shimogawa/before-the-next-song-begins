import type { SongConfig, EngineCallbacks } from './types';
import { loadSongBuffers, type LoadProgressCallback } from './AudioLoader';

const SCHEDULER_INTERVAL_MS = 25;
const LOOK_AHEAD_S = 0.1;
const STARTUP_OFFSET_S = 0.05;

export class LoopEngine {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private bufferCache: Map<string, AudioBuffer[]> = new Map();

    private currentBuffers: AudioBuffer[] = [];
    private loopDuration = 0;

    private originTime: number | null = null;
    private scheduledUpToIndex = -1;
    private schedulerHandle: ReturnType<typeof setInterval> | null = null;

    private desiredState: boolean[] = [];
    private activeState: boolean[] = [];
    private activeSources: (AudioBufferSourceNode | null)[] = [];
    private nextSources: (AudioBufferSourceNode | null)[] = [];

    private sliceGains: GainNode[] = [];

    private callbacks: EngineCallbacks;
    private sliceCount = 0;

    private unlocked = false;

    constructor(audioContext: AudioContext, callbacks: EngineCallbacks) {
        this.audioContext = audioContext;
        this.masterGain = audioContext.createGain();
        this.masterGain.connect(audioContext.destination);
        this.callbacks = callbacks;

        // iOS 17+: switch from "ambient" to "playback" so audio
        // is not muted when the device silent switch is on.
        if ('audioSession' in navigator) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).audioSession.type = 'playback';
        }
    }

    /**
     * Unlock audio output on iOS Safari.
     * Must be called from a user gesture (click/touchend).
     * Playing a silent buffer is required to fully unlock iOS audio.
     */
    async unlock(): Promise<void> {
        if (this.unlocked) return;
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        this.unlocked = true;
    }

    async loadSong(song: SongConfig, onProgress?: LoadProgressCallback): Promise<void> {
        let buffers = this.bufferCache.get(song.id);
        if (!buffers) {
            buffers = await loadSongBuffers(this.audioContext, song, onProgress);
            this.bufferCache.set(song.id, buffers);
        } else {
            onProgress?.(song.sliceCount, song.sliceCount);
        }
        this.currentBuffers = buffers;
        this.sliceCount = song.sliceCount;
        this.loopDuration = buffers[0].duration;
        this.resetState();
    }

    switchSong(song: SongConfig, onProgress?: LoadProgressCallback): Promise<void> {
        this.emergencyStop();
        return this.loadSong(song, onProgress);
    }

    toggle(index: number): void {
        if (index < 0 || index >= this.sliceCount) return;
        this.desiredState[index] = !this.desiredState[index];

        if (this.originTime === null && this.desiredState.some(Boolean)) {
            this.startClock();
        }
    }

    enableAll(): void {
        this.desiredState = new Array(this.sliceCount).fill(true);
        if (this.originTime === null) {
            this.startClock();
        }
    }

    disableAll(): void {
        this.desiredState = new Array(this.sliceCount).fill(false);
    }

    stop(): void {
        this.emergencyStop();
        this.desiredState = new Array(this.sliceCount).fill(false);
        this.activeState = new Array(this.sliceCount).fill(false);
        this.activeSources = new Array(this.sliceCount).fill(null);
        this.nextSources = new Array(this.sliceCount).fill(null);
        this.callbacks.onBoundary([...this.activeState]);
        this.callbacks.onProgress(0);
        this.callbacks.onClockStop();
    }

    skipToNext(): void {
        if (this.originTime === null) return;
        // Stop all currently scheduled sources
        for (let i = 0; i < this.sliceCount; i++) {
            this.stopSource(this.activeSources[i]);
            this.stopSource(this.nextSources[i]);
        }
        this.activeSources = new Array(this.sliceCount).fill(null);
        this.nextSources = new Array(this.sliceCount).fill(null);
        // Reset origin so the next loop starts immediately
        this.originTime = this.audioContext.currentTime + STARTUP_OFFSET_S;
        this.scheduledUpToIndex = -1;
        this.tick();
    }

    setVolume(index: number, value: number): void {
        if (index < 0 || index >= this.sliceCount) return;
        this.sliceGains[index].gain.value = value;
    }

    getVolumes(): number[] {
        return this.sliceGains.map((g) => g.gain.value);
    }

    setMasterVolume(value: number): void {
        this.masterGain.gain.value = value;
    }

    getMasterVolume(): number {
        return this.masterGain.gain.value;
    }

    getDesiredState(): boolean[] {
        return [...this.desiredState];
    }

    getActiveState(): boolean[] {
        return [...this.activeState];
    }

    getProgress(): number {
        if (this.originTime === null) return 0;
        const now = this.audioContext.currentTime;
        const elapsed = now - this.originTime;
        if (elapsed < 0) return 0;
        return (elapsed % this.loopDuration) / this.loopDuration;
    }

    isRunning(): boolean {
        return this.originTime !== null;
    }

    dispose(): void {
        this.emergencyStop();
        this.disconnectSliceGains();
        this.masterGain.disconnect();
    }

    // --- Private ---

    private resetState(): void {
        this.desiredState = new Array(this.sliceCount).fill(false);
        this.activeState = new Array(this.sliceCount).fill(false);
        this.activeSources = new Array(this.sliceCount).fill(null);
        this.nextSources = new Array(this.sliceCount).fill(null);
        this.originTime = null;
        this.scheduledUpToIndex = -1;
        this.rebuildSliceGains();
        this.callbacks.onBoundary([...this.activeState]);
    }

    private rebuildSliceGains(): void {
        this.disconnectSliceGains();
        this.sliceGains = [];
        for (let i = 0; i < this.sliceCount; i++) {
            const gain = this.audioContext.createGain();
            gain.connect(this.masterGain);
            this.sliceGains.push(gain);
        }
    }

    private disconnectSliceGains(): void {
        for (const gain of this.sliceGains) {
            gain.disconnect();
        }
    }

    private async startClock(): Promise<void> {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.originTime = this.audioContext.currentTime + STARTUP_OFFSET_S;
        this.scheduledUpToIndex = -1;

        if (this.schedulerHandle !== null) {
            clearInterval(this.schedulerHandle);
        }
        this.schedulerHandle = setInterval(() => this.tick(), SCHEDULER_INTERVAL_MS);

        // Run first tick immediately
        this.tick();
    }

    private stopClock(): void {
        if (this.schedulerHandle !== null) {
            clearInterval(this.schedulerHandle);
            this.schedulerHandle = null;
        }
        this.originTime = null;
        this.scheduledUpToIndex = -1;
        this.activeState = new Array(this.sliceCount).fill(false);
        this.activeSources = new Array(this.sliceCount).fill(null);
        this.nextSources = new Array(this.sliceCount).fill(null);
        this.callbacks.onBoundary([...this.activeState]);
        this.callbacks.onProgress(0);
        this.callbacks.onClockStop();
    }

    private emergencyStop(): void {
        for (let i = 0; i < this.sliceCount; i++) {
            this.stopSource(this.activeSources[i]);
            this.stopSource(this.nextSources[i]);
        }

        if (this.schedulerHandle !== null) {
            clearInterval(this.schedulerHandle);
            this.schedulerHandle = null;
        }

        this.originTime = null;
        this.scheduledUpToIndex = -1;
    }

    private stopSource(source: AudioBufferSourceNode | null): void {
        if (!source) return;
        try {
            source.stop(0);
            source.disconnect();
        } catch {
            // Already stopped
        }
    }

    private tick(): void {
        if (this.originTime === null) return;

        const now = this.audioContext.currentTime;
        const horizon = now + LOOK_AHEAD_S;

        const elapsed = now - this.originTime;
        if (elapsed >= 0) {
            const progress = (elapsed % this.loopDuration) / this.loopDuration;
            this.callbacks.onProgress(progress);
        }

        const horizonElapsed = horizon - this.originTime;
        if (horizonElapsed < 0) return;

        const horizonLoopIndex = Math.floor(horizonElapsed / this.loopDuration);

        for (let loopIdx = this.scheduledUpToIndex + 1; loopIdx <= horizonLoopIndex; loopIdx++) {
            this.scheduleIteration(loopIdx);
        }
    }

    private scheduleIteration(loopIndex: number): void {
        if (this.originTime === null) return;

        const boundaryTime = this.originTime + loopIndex * this.loopDuration;

        this.activeState = [...this.desiredState];
        this.callbacks.onBoundary([...this.activeState]);

        this.activeSources = [...this.nextSources];
        this.nextSources = new Array(this.sliceCount).fill(null);

        for (let i = 0; i < this.sliceCount; i++) {
            if (this.activeState[i]) {
                const source = this.audioContext.createBufferSource();
                source.buffer = this.currentBuffers[i];
                source.connect(this.sliceGains[i]);
                source.start(boundaryTime);
                source.stop(boundaryTime + this.loopDuration);
                this.nextSources[i] = source;
            }
        }

        this.scheduledUpToIndex = loopIndex;

        if (!this.desiredState.some(Boolean) && !this.activeState.some(Boolean)) {
            this.stopClock();
        }
    }
}

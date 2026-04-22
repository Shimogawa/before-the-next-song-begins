import { useEffect, useRef, useState, useCallback } from 'react';
import { LoopEngine } from '../audio/LoopEngine';
import type { SongConfig, SliceVisualState } from '../audio/types';

interface UseLoopEngineReturn {
    currentSongId: string | null;
    loadingSongId: string | null;
    sliceStates: SliceVisualState[];
    volumes: number[];
    masterVolume: number;
    loopProgress: number;
    isLoading: boolean;
    isRunning: boolean;
    toggle: (index: number) => void;
    switchSong: (song: SongConfig) => void;
    setVolume: (index: number, value: number) => void;
    setMasterVolume: (value: number) => void;
    enableAll: () => void;
    disableAll: () => void;
    stop: () => void;
    skipToNext: () => void;
}

export function useLoopEngine(initialSong: SongConfig): UseLoopEngineReturn {
    const audioContextRef = useRef<AudioContext | null>(null);
    const engineRef = useRef<LoopEngine | null>(null);
    const rafRef = useRef<number>(0);

    const [currentSongId, setCurrentSongId] = useState<string | null>(null);
    const [loadingSongId, setLoadingSongId] = useState<string | null>(initialSong.id);
    const [desiredState, setDesiredState] = useState<boolean[]>([]);
    const [activeState, setActiveState] = useState<boolean[]>([]);
    const [volumes, setVolumes] = useState<number[]>([]);
    const [masterVolume, setMasterVolumeState] = useState(1);
    const [loopProgress, setLoopProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let disposed = false;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const engine = new LoopEngine(audioContext, {
            onBoundary: (newActiveState) => {
                if (!disposed) setActiveState([...newActiveState]);
            },
            onProgress: () => { },
            onClockStop: () => {
                if (!disposed) setIsRunning(false);
            },
        });
        engineRef.current = engine;

        engine.loadSong(initialSong).then(() => {
            if (disposed) return;
            setCurrentSongId(initialSong.id);
            setLoadingSongId(null);
            setDesiredState(new Array(initialSong.sliceCount).fill(false));
            setActiveState(new Array(initialSong.sliceCount).fill(false));
            setVolumes(new Array(initialSong.sliceCount).fill(1));
            setIsLoading(false);
        });

        const updateProgress = () => {
            if (!disposed && engineRef.current && engineRef.current.isRunning()) {
                setLoopProgress(engineRef.current.getProgress());
            }
            if (!disposed) {
                rafRef.current = requestAnimationFrame(updateProgress);
            }
        };
        rafRef.current = requestAnimationFrame(updateProgress);

        return () => {
            disposed = true;
            cancelAnimationFrame(rafRef.current);
            engine.dispose();
            audioContext.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ensureResumed = useCallback(() => {
        const ctx = audioContextRef.current;
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    }, []);

    const toggle = useCallback((index: number) => {
        const engine = engineRef.current;
        if (!engine) return;
        ensureResumed();
        engine.toggle(index);
        setDesiredState(engine.getDesiredState());
        setIsRunning(engine.isRunning());
    }, [ensureResumed]);

    const switchSong = useCallback(async (song: SongConfig) => {
        const engine = engineRef.current;
        if (!engine) return;

        setIsLoading(true);
        setLoadingSongId(song.id);
        setIsRunning(false);
        setLoopProgress(0);

        await engine.switchSong(song);

        setCurrentSongId(song.id);
        setLoadingSongId(null);
        setDesiredState(new Array(song.sliceCount).fill(false));
        setActiveState(new Array(song.sliceCount).fill(false));
        setVolumes(new Array(song.sliceCount).fill(1));
        setIsLoading(false);
    }, []);

    const setVolume = useCallback((index: number, value: number) => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.setVolume(index, value);
        setVolumes(engine.getVolumes());
    }, []);

    const setMasterVolume = useCallback((value: number) => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.setMasterVolume(value);
        setMasterVolumeState(value);
    }, []);

    const enableAll = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        ensureResumed();
        engine.enableAll();
        setDesiredState(engine.getDesiredState());
        setIsRunning(engine.isRunning());
    }, [ensureResumed]);

    const disableAll = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.disableAll();
        setDesiredState(engine.getDesiredState());
    }, []);

    const stop = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.stop();
        setDesiredState(engine.getDesiredState());
        setActiveState(engine.getActiveState());
        setIsRunning(false);
        setLoopProgress(0);
    }, []);

    const skipToNext = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        ensureResumed();
        engine.skipToNext();
    }, [ensureResumed]);

    const sliceStates: SliceVisualState[] = desiredState.map((desired, i) => {
        const active = activeState[i] ?? false;
        if (desired && active) return 'active';
        if (desired && !active) return 'pending-on';
        if (!desired && active) return 'pending-off';
        return 'inactive';
    });

    return {
        currentSongId,
        loadingSongId,
        sliceStates,
        volumes,
        masterVolume,
        loopProgress,
        isLoading,
        isRunning,
        toggle,
        switchSong,
        setVolume,
        setMasterVolume,
        enableAll,
        disableAll,
        stop,
        skipToNext,
    };
}

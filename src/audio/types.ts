export interface SongConfig {
    id: string;
    title: string;
    sliceCount: number;
    baseUrl: string;
    filePattern: (index: number) => string;
}

export type SliceVisualState = 'inactive' | 'active' | 'pending-on' | 'pending-off';

export interface EngineCallbacks {
    onBoundary: (activeState: boolean[]) => void;
    onProgress: (progress: number) => void;
    onClockStop: () => void;
}

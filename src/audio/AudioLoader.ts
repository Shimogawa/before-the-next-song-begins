import type { SongConfig } from './types';

export type LoadProgressCallback = (loaded: number, total: number) => void;

export async function loadSongBuffers(
    audioContext: AudioContext,
    song: SongConfig,
    onProgress?: LoadProgressCallback,
): Promise<AudioBuffer[]> {
    const urls = Array.from({ length: song.sliceCount }, (_, i) => {
        const filename = song.filePattern(i + 1);
        return `${song.baseUrl}/${filename}`;
    });

    const total = urls.length;
    let loaded = 0;
    onProgress?.(0, total);

    const audioBuffers = await Promise.all(
        urls.map(async (url) => {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch ${res.url}: ${res.status}`);
            }
            const ab = await res.arrayBuffer();
            const buf = await audioContext.decodeAudioData(ab);
            loaded++;
            onProgress?.(loaded, total);
            return buf;
        }),
    );

    return audioBuffers;
}

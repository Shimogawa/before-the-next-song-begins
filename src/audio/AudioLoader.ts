import type { SongConfig } from './types';

export async function loadSongBuffers(
    audioContext: AudioContext,
    song: SongConfig,
): Promise<AudioBuffer[]> {
    const urls = Array.from({ length: song.sliceCount }, (_, i) => {
        const filename = song.filePattern(i + 1);
        return `${song.baseUrl}/${filename}`;
    });

    const responses = await Promise.all(urls.map((url) => fetch(url)));

    for (const res of responses) {
        if (!res.ok) {
            throw new Error(`Failed to fetch ${res.url}: ${res.status}`);
        }
    }

    const arrayBuffers = await Promise.all(responses.map((r) => r.arrayBuffer()));
    const audioBuffers = await Promise.all(
        arrayBuffers.map((ab) => audioContext.decodeAudioData(ab)),
    );

    return audioBuffers;
}

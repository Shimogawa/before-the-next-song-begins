import type { SongConfig } from '../audio/types';

const BASE = import.meta.env.BASE_URL;

// Detect OGG support (Safari/iOS does not support OGG)
function canPlayOgg(): boolean {
    try {
        const audio = new Audio();
        return audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
    } catch {
        return false;
    }
}

const useOgg = canPlayOgg();
const ext = useOgg ? 'ogg' : 'mp3';

export const songs: SongConfig[] = [
    {
        id: 'heart',
        title: '使一颗心免于哀伤',
        sliceCount: 15,
        baseUrl: `${BASE}audiocut/使一颗心免于哀伤_slices_${ext}`,
        filePattern: (index: number) => `使一颗心免于哀伤_${index}.${ext}`,
    },
    {
        id: 'galaxy',
        title: '在银河中孤独摇摆',
        sliceCount: 15,
        baseUrl: `${BASE}audiocut/在银河中孤独摇摆_slices_${ext}`,
        filePattern: (index: number) => `在银河中孤独摇摆_${index}.${ext}`,
    },
];

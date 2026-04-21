import type { SongConfig } from '../audio/types';

const BASE = import.meta.env.BASE_URL;

export const songs: SongConfig[] = [
    {
        id: 'heart',
        title: '使一颗心免于哀伤',
        sliceCount: 15,
        baseUrl: `${BASE}audiocut/使一颗心免于哀伤_slices_ogg`,
        filePattern: (index: number) => `使一颗心免于哀伤_${index}.ogg`,
    },
    {
        id: 'galaxy',
        title: '在银河中孤独摇摆',
        sliceCount: 15,
        baseUrl: `${BASE}audiocut/在银河中孤独摇摆_slices_ogg`,
        filePattern: (index: number) => `在银河中孤独摇摆_${index}.ogg`,
    },
];

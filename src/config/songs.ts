import type { SongConfig } from '../audio/types';

export const songs: SongConfig[] = [
    {
        id: 'xinmian',
        title: '使一颗心免于哀伤',
        sliceCount: 15,
        baseUrl: '/audiocut/使一颗心免于哀伤_slices_ogg',
        filePattern: (index: number) => `使一颗心免于哀伤_${index}.ogg`,
    },
    {
        id: 'yinhe',
        title: '在银河中孤独摇摆',
        sliceCount: 15,
        baseUrl: '/audiocut/在银河中孤独摇摆_slices_ogg',
        filePattern: (index: number) => `在银河中孤独摇摆_${index}.ogg`,
    },
];

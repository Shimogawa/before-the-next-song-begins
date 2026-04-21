import type { SongConfig } from '../audio/types';

interface SongSelectorProps {
    songs: SongConfig[];
    currentSongId: string | null;
    isLoading: boolean;
    onSelect: (song: SongConfig) => void;
}

export function SongSelector({ songs, currentSongId, isLoading, onSelect }: SongSelectorProps) {
    return (
        <div className="song-selector">
            {songs.map((song) => {
                const isActive = song.id === currentSongId;
                return (
                    <button
                        key={song.id}
                        className={`song-selector__btn ${isActive ? 'song-selector__btn--active' : ''}`}
                        disabled={isLoading && isActive}
                        onClick={() => {
                            if (!isActive) onSelect(song);
                        }}
                    >
                        {song.title}
                        {isLoading && isActive && <span className="song-selector__loading" />}
                    </button>
                );
            })}
        </div>
    );
}

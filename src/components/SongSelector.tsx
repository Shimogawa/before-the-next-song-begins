import type { SongConfig } from '../audio/types';

interface SongSelectorProps {
    songs: SongConfig[];
    currentSongId: string | null;
    loadingSongId: string | null;
    loadingProgress: number;
    onSelect: (song: SongConfig) => void;
}

export function SongSelector({ songs, currentSongId, loadingSongId, loadingProgress, onSelect }: SongSelectorProps) {
    return (
        <div className="song-selector">
            {songs.map((song) => {
                const isActive = song.id === currentSongId;
                const isLoadingThis = song.id === loadingSongId;
                return (
                    <button
                        key={song.id}
                        className={`song-selector__btn ${isActive ? 'song-selector__btn--active' : ''}`}
                        disabled={loadingSongId !== null}
                        onClick={() => {
                            if (!isActive) onSelect(song);
                        }}
                    >
                        {song.title}
                        {isLoadingThis && (
                            <span className="song-selector__loading">
                                <span className="song-selector__progress">{loadingProgress}%</span>
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

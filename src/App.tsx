import { songs } from './config/songs';
import { useLoopEngine } from './hooks/useLoopEngine';
import { SongSelector } from './components/SongSelector';
import { LoopProgressBar } from './components/LoopProgressBar';
import { Toolbar } from './components/Toolbar';
import { SliceGrid } from './components/SliceGrid';
import './App.css';

function App() {
  const {
    currentSongId,
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
  } = useLoopEngine(songs[0]);

  return (
    <div className="app">
      <h1 className="app__title">Before the Next Song Begins</h1>
      <SongSelector
        songs={songs}
        currentSongId={currentSongId}
        isLoading={isLoading}
        onSelect={switchSong}
      />
      <LoopProgressBar progress={loopProgress} isRunning={isRunning} />
      <Toolbar
        masterVolume={masterVolume}
        disabled={isLoading}
        isRunning={isRunning}
        onMasterVolumeChange={setMasterVolume}
        onEnableAll={enableAll}
        onDisableAll={disableAll}
        onStop={stop}
        onSkipToNext={skipToNext}
      />
      <SliceGrid
        sliceStates={sliceStates}
        volumes={volumes}
        disabled={isLoading}
        onToggle={toggle}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;

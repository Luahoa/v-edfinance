import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';

interface ProgressEvent {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

interface WatchLog {
  timestamp: number;
  playedSeconds: number;
  played: number;
  action: string;
}

interface ValidationResult {
  isValid: boolean;
  reason: string;
  totalWatchTime: number;
  jumpCount: number;
  completionRate: number;
}

const App: React.FC = () => {
  const [url] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState<ProgressEvent>({
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0
  });
  
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  const playerRef = useRef<ReactPlayer>(null);
  const lastProgressRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  const addLog = (action: string, playedSeconds: number, played: number) => {
    const log: WatchLog = {
      timestamp: Date.now(),
      playedSeconds,
      played,
      action
    };
    setLogs(prev => [...prev, log]);
  };

  const handleProgress = (state: ProgressEvent) => {
    setProgress(state);
    setEventCount(prev => prev + 1);

    // Detect suspicious jumps (>10s forward)
    const jump = state.playedSeconds - lastProgressRef.current;
    if (jump > 10 && lastProgressRef.current > 0) {
      addLog(`⚠️ JUMP DETECTED: +${jump.toFixed(1)}s`, state.playedSeconds, state.played);
    } else if (state.playedSeconds > lastProgressRef.current) {
      addLog('progress', state.playedSeconds, state.played);
    }

    lastProgressRef.current = state.playedSeconds;
  };

  const handleDuration = (d: number) => {
    setDuration(d);
    addLog('duration_loaded', 0, 0);
  };

  // Attack simulations
  const attackSeekEnd = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0.95, 'fraction');
      addLog('🔴 ATTACK: seekTo(95%)', duration * 0.95, 0.95);
    }
  };

  const attackConsoleManipulation = () => {
    // This simulates what a user could do in console
    console.log('🔴 ATTACK: User could run: window.playerRef.seekTo(999)');
    addLog('🔴 ATTACK: Console manipulation simulated', 999, 1);
  };

  const attackTabSwitch = () => {
    setPlaying(false);
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0.9, 'fraction');
        setPlaying(true);
      }
      addLog('🔴 ATTACK: Tab switch + seek', duration * 0.9, 0.9);
    }, 1000);
  };

  // Server-side validation simulation
  const validateCompletion = () => {
    if (logs.length === 0) {
      setValidation({
        isValid: false,
        reason: 'No watch data',
        totalWatchTime: 0,
        jumpCount: 0,
        completionRate: 0
      });
      return;
    }

    const progressLogs = logs.filter(l => l.action === 'progress');
    const jumpLogs = logs.filter(l => l.action.includes('JUMP'));
    
    // Calculate actual watch time (time spent, not video time)
    const totalSessionTime = (Date.now() - startTimeRef.current) / 1000;
    
    // Calculate continuous watch segments
    let continuousWatchTime = 0;
    let lastTimestamp = logs[0].timestamp;
    let lastPlayedSeconds = 0;
    
    for (const log of progressLogs) {
      const timeDelta = (log.timestamp - lastTimestamp) / 1000;
      const progressDelta = log.playedSeconds - lastPlayedSeconds;
      
      // Only count if progress delta matches time delta (±2s tolerance)
      if (Math.abs(progressDelta - timeDelta) < 2 && timeDelta < 5) {
        continuousWatchTime += timeDelta;
      }
      
      lastTimestamp = log.timestamp;
      lastPlayedSeconds = log.playedSeconds;
    }

    const completionRate = progress.played;
    const requiredWatchTime = duration * 0.9; // 90% of video
    const tolerance = 5; // ±5s tolerance

    const isValid = 
      completionRate >= 0.9 && // Reported 90%
      continuousWatchTime >= (requiredWatchTime - tolerance) && // Actually watched
      jumpLogs.length <= 2 && // Max 2 jumps allowed
      totalSessionTime >= (requiredWatchTime - tolerance); // Session time makes sense

    setValidation({
      isValid,
      reason: isValid 
        ? '✅ Valid: Continuous watch time verified'
        : `❌ Invalid: ${jumpLogs.length > 2 ? 'Too many jumps' : continuousWatchTime < requiredWatchTime ? 'Insufficient watch time' : 'Session time mismatch'}`,
      totalWatchTime: continuousWatchTime,
      jumpCount: jumpLogs.length,
      completionRate
    });
  };

  // Expose player to console for testing
  useEffect(() => {
    (window as any).playerRef = playerRef.current;
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>YouTube Anti-Cheat Spike Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          controls
          onProgress={handleProgress}
          onDuration={handleDuration}
          progressInterval={1000}
          width="640px"
          height="360px"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setPlaying(!playing)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={attackSeekEnd} style={{ marginLeft: '10px' }}>
          🔴 Attack: Seek to End
        </button>
        <button onClick={attackConsoleManipulation} style={{ marginLeft: '10px' }}>
          🔴 Attack: Console
        </button>
        <button onClick={attackTabSwitch} style={{ marginLeft: '10px' }}>
          🔴 Attack: Tab Switch
        </button>
        <button onClick={validateCompletion} style={{ marginLeft: '10px', background: '#4CAF50', color: 'white' }}>
          ✓ Validate Completion
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Current State</h3>
          <p>Duration: {duration.toFixed(1)}s</p>
          <p>Played: {progress.playedSeconds.toFixed(1)}s ({(progress.played * 100).toFixed(1)}%)</p>
          <p>onProgress Events: {eventCount}</p>
          <p>Fire Rate: ~1/sec</p>
        </div>

        <div>
          <h3>Validation Result</h3>
          {validation ? (
            <div style={{ 
              padding: '10px', 
              background: validation.isValid ? '#d4edda' : '#f8d7da',
              border: `1px solid ${validation.isValid ? '#28a745' : '#dc3545'}`
            }}>
              <p><strong>{validation.reason}</strong></p>
              <p>Watch Time: {validation.totalWatchTime.toFixed(1)}s</p>
              <p>Jumps: {validation.jumpCount}</p>
              <p>Completion: {(validation.completionRate * 100).toFixed(1)}%</p>
            </div>
          ) : (
            <p>Click "Validate Completion" to test</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Watch Logs (Last 10)</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflow: 'auto', 
          background: '#f5f5f5', 
          padding: '10px',
          fontSize: '11px'
        }}>
          {logs.slice(-10).reverse().map((log, i) => (
            <div key={i}>
              {new Date(log.timestamp).toLocaleTimeString()}: {log.action} 
              {' '}(played: {log.playedSeconds.toFixed(1)}s)
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#fff3cd', padding: '10px' }}>
        <h4>Console Test Commands:</h4>
        <code>window.playerRef.seekTo(999)</code> - Jump to end<br/>
        <code>window.playerRef.getCurrentTime()</code> - Get current time
      </div>
    </div>
  );
};

export default App;

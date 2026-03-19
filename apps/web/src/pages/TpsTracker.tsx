import { useState, useEffect, useRef, useCallback } from 'react';
import { useAptos } from '../contexts/AptosContext';
import styles from './TpsTracker.module.css';

interface DataPoint {
  timestamp: number;
  ledgerVersion: number;
}

interface TpsSample {
  timestamp: number;
  tps: number;
}

const POLL_INTERVAL_MS = 1000;
const GRAPH_HEIGHT = 200;
const GRAPH_PADDING = { top: 20, right: 20, bottom: 30, left: 60 };

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function TpsGraph({ samples, width }: { samples: TpsSample[]; width: number }) {
  if (samples.length < 2) return null;

  const plotW = width - GRAPH_PADDING.left - GRAPH_PADDING.right;
  const plotH = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;

  const minT = samples[0].timestamp;
  const maxT = samples[samples.length - 1].timestamp;
  const timeRange = maxT - minT || 1;

  const tpsValues = samples.map((s) => s.tps);
  const maxTps = Math.max(...tpsValues) * 1.15 || 1;

  const points = samples.map((s) => {
    const x = GRAPH_PADDING.left + ((s.timestamp - minT) / timeRange) * plotW;
    const y = GRAPH_PADDING.top + plotH - (s.tps / maxTps) * plotH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x},${GRAPH_PADDING.top + plotH} L${points[0].x},${GRAPH_PADDING.top + plotH} Z`;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxTps / yTicks) * i);

  const totalDuration = (maxT - minT) / 1000;
  const xTickCount = Math.min(6, Math.max(2, Math.floor(totalDuration / 10)));
  const xTickValues = Array.from(
    { length: xTickCount + 1 },
    (_, i) => minT + (timeRange / xTickCount) * i,
  );

  return (
    <svg width={width} height={GRAPH_HEIGHT} className={styles.graph}>
      <defs>
        <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTickValues.map((val) => {
        const y = GRAPH_PADDING.top + plotH - (val / maxTps) * plotH;
        return (
          <g key={`y-${val}`}>
            <line
              x1={GRAPH_PADDING.left}
              y1={y}
              x2={width - GRAPH_PADDING.right}
              y2={y}
              className={styles.gridLine}
            />
            <text x={GRAPH_PADDING.left - 8} y={y + 4} className={styles.axisLabel} textAnchor="end">
              {formatNumber(val)}
            </text>
          </g>
        );
      })}

      {xTickValues.map((val) => {
        const x = GRAPH_PADDING.left + ((val - minT) / timeRange) * plotW;
        const elapsed = (val - minT) / 1000;
        return (
          <g key={`x-${val}`}>
            <line
              x1={x}
              y1={GRAPH_PADDING.top}
              x2={x}
              y2={GRAPH_PADDING.top + plotH}
              className={styles.gridLine}
            />
            <text x={x} y={GRAPH_HEIGHT - 4} className={styles.axisLabel} textAnchor="middle">
              {formatDuration(elapsed * 1000)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#tpsGradient)" />
      <path d={linePath} fill="none" className={styles.tpsLine} />

      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3.5}
          className={styles.tpsDot}
        />
      )}
    </svg>
  );
}

function TpsTracker() {
  const { nodeUrl, networkId } = useAptos();
  const [recording, setRecording] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [tpsSamples, setTpsSamples] = useState<TpsSample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [graphWidth, setGraphWidth] = useState(800);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeUrlRef = useRef(nodeUrl);
  nodeUrlRef.current = nodeUrl;

  const latestDataRef = useRef<DataPoint | null>(null);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(nodeUrlRef.current);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const ledgerVersion = parseInt(data.ledger_version, 10);
      const now = Date.now();
      const point: DataPoint = { timestamp: now, ledgerVersion };

      const prev = latestDataRef.current;
      latestDataRef.current = point;

      setDataPoints((dp) => [...dp, point]);

      if (prev) {
        const dt = (now - prev.timestamp) / 1000;
        if (dt > 0) {
          const tps = (ledgerVersion - prev.ledgerVersion) / dt;
          setTpsSamples((s) => [...s, { timestamp: now, tps: Math.max(0, tps) }]);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ledger info');
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRecording(true);
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [poll]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setDataPoints([]);
    setTpsSamples([]);
    setError(null);
    latestDataRef.current = null;
  }, [stop]);

  // Stop polling on network change or unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    reset();
  }, [networkId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setGraphWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const averageTps =
    dataPoints.length >= 2
      ? (() => {
          const first = dataPoints[0];
          const last = dataPoints[dataPoints.length - 1];
          const dt = (last.timestamp - first.timestamp) / 1000;
          if (dt <= 0) return null;
          return (last.ledgerVersion - first.ledgerVersion) / dt;
        })()
      : null;

  const currentTps = tpsSamples.length > 0 ? tpsSamples[tpsSamples.length - 1].tps : null;
  const peakTps = tpsSamples.length > 0 ? Math.max(...tpsSamples.map((s) => s.tps)) : null;
  const elapsed =
    dataPoints.length >= 2
      ? dataPoints[dataPoints.length - 1].timestamp - dataPoints[0].timestamp
      : 0;

  const latestVersion = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].ledgerVersion : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📈</span>
          TPS Tracker
        </h1>
        <p className={styles.description}>
          Monitor real-time transactions per second on the Aptos blockchain. Polls the node API
          every second to track ledger version changes and calculate throughput.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttonGroup}>
          {!recording ? (
            <button type="button" className={styles.startButton} onClick={start}>
              ▶ Start Recording
            </button>
          ) : (
            <button type="button" className={styles.stopButton} onClick={stop}>
              ⏸ Pause
            </button>
          )}
          <button
            type="button"
            className={styles.resetButton}
            onClick={reset}
            disabled={dataPoints.length === 0 && !recording}
          >
            ↺ Reset
          </button>
        </div>
        {recording && <div className={styles.recordingIndicator}>● Recording</div>}
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Current TPS</div>
          <div className={styles.statValue}>
            {currentTps !== null ? formatNumber(currentTps) : '—'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Average TPS</div>
          <div className={`${styles.statValue} ${styles.statAccent}`}>
            {averageTps !== null ? formatNumber(averageTps) : '—'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Peak TPS</div>
          <div className={styles.statValue}>{peakTps !== null ? formatNumber(peakTps) : '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Duration</div>
          <div className={styles.statValue}>{elapsed > 0 ? formatDuration(elapsed) : '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Samples</div>
          <div className={styles.statValue}>{tpsSamples.length || '—'}</div>
        </div>
        <div className={styles.statCardWide}>
          <div className={styles.statLabel}>Ledger Version</div>
          <div className={styles.statValue}>
            {latestVersion !== null ? formatNumber(latestVersion) : '—'}
          </div>
        </div>
      </div>

      <div className={styles.graphContainer} ref={containerRef}>
        <h2 className={styles.graphTitle}>TPS Over Time</h2>
        {tpsSamples.length < 2 ? (
          <div className={styles.graphPlaceholder}>
            {recording
              ? 'Collecting data...'
              : dataPoints.length === 0
                ? 'Press Start Recording to begin tracking TPS.'
                : 'Not enough data points to render graph. Resume recording.'}
          </div>
        ) : (
          <TpsGraph samples={tpsSamples} width={graphWidth} />
        )}
      </div>
    </div>
  );
}

export default TpsTracker;

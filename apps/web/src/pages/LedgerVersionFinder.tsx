import { useState } from 'react';
import { useAptos } from '../contexts/AptosContext';
import styles from './LedgerVersionFinder.module.css';

interface SearchResult {
  ledgerVersion: string;
  timestamp: number;
  blockHeight: string;
  epochNumber: string;
  formattedDate: string;
  diffSeconds: number;
}

function LedgerVersionFinder() {
  const { aptos, network } = useAptos();
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('00:00:00');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setSearchLog((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const findLedgerVersion = async () => {
    if (!targetDate) {
      setError('Please select a date');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);
    setSearchLog([]);

    try {
      const targetTimestamp = new Date(`${targetDate}T${targetTime}`).getTime() * 1000; // Convert to microseconds
      addLog(`Target timestamp: ${targetTimestamp} (${new Date(targetTimestamp / 1000).toISOString()})`);

      // Get the latest ledger info
      addLog('Fetching latest ledger info...');
      const ledgerInfo = await aptos.getLedgerInfo();
      let high = BigInt(ledgerInfo.ledger_version);
      let low = BigInt(1);

      addLog(`Search range: ${low.toString()} to ${high.toString()}`);
      addLog('Starting binary search...');

      let iterations = 0;
      const maxIterations = 100;
      let closestVersion = high;
      let closestDiff = Number.MAX_SAFE_INTEGER;

      while (low <= high && iterations < maxIterations) {
        iterations++;
        const mid = (low + high) / BigInt(2);

        addLog(`Iteration ${iterations}: Checking version ${mid.toString()}`);

        // Get block by version
        const block = await aptos.getBlockByVersion({
          ledgerVersion: mid,
          options: { withTransactions: false },
        });

        const blockTimestamp = BigInt(block.block_timestamp);
        const diff = Number(blockTimestamp - BigInt(targetTimestamp));
        const absDiff = Math.abs(diff);

        addLog(`  Block timestamp: ${blockTimestamp} (${new Date(Number(blockTimestamp) / 1000).toISOString()})`);
        addLog(`  Difference: ${(diff / 1000000).toFixed(2)}s`);

        // Track closest version
        if (absDiff < closestDiff) {
          closestDiff = absDiff;
          closestVersion = mid;
        }

        // If we're within 1 second, that's close enough
        if (absDiff < 1000000) {
          addLog(`Found version within 1 second tolerance!`);
          break;
        }

        if (blockTimestamp < BigInt(targetTimestamp)) {
          low = mid + BigInt(1);
        } else {
          high = mid - BigInt(1);
        }
      }

      addLog(`Binary search completed in ${iterations} iterations`);
      addLog(`Fetching final result for version ${closestVersion.toString()}...`);

      // Get the final result
      const finalBlock = await aptos.getBlockByVersion({
        ledgerVersion: closestVersion,
        options: { withTransactions: false },
      });

      const finalTimestamp = Number(finalBlock.block_timestamp);
      const resultData: SearchResult = {
        ledgerVersion: closestVersion.toString(),
        timestamp: finalTimestamp,
        blockHeight: finalBlock.block_height,
        epochNumber: finalBlock.epoch || 'N/A',
        formattedDate: new Date(finalTimestamp / 1000).toISOString(),
        diffSeconds: Math.abs((finalTimestamp - Number(targetTimestamp)) / 1000000),
      };

      setResult(resultData);
      addLog(`✓ Search complete!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addLog(`✗ Error: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findLedgerVersion();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>🔍</span>
          Ledger Version Finder
        </h1>
        <p className={styles.description}>
          Find the closest ledger version to a specific date and time using binary search
          on the Aptos blockchain. This tool efficiently searches through millions of
          transactions to pinpoint the exact moment you're looking for.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="date" className={styles.label}>
              📅 Target Date
            </label>
            <input
              id="date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={styles.dateInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="time" className={styles.label}>
              🕐 Target Time (UTC)
            </label>
            <input
              id="time"
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className={styles.timeInput}
              step="1"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className={styles.submitButton}
        >
          {isSearching ? (
            <>
              <span className={styles.spinner} />
              Searching...
            </>
          ) : (
            'Find Ledger Version'
          )}
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>✓ Result Found</h2>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Ledger Version</div>
              <div className={styles.resultValue}>{result.ledgerVersion}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Block Height</div>
              <div className={styles.resultValue}>{result.blockHeight}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Epoch</div>
              <div className={styles.resultValue}>{result.epochNumber}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Actual Timestamp</div>
              <div className={styles.resultValue}>{result.formattedDate}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Time Difference</div>
              <div className={styles.resultValue}>
                {result.diffSeconds.toFixed(2)} seconds
              </div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Microseconds</div>
              <div className={styles.resultValue}>
                {result.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
          <a
            href={`https://explorer.aptoslabs.com/txn/${result.ledgerVersion}?network=${network.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.explorerLink}
          >
            View in Aptos Explorer →
          </a>
        </div>
      )}

      {searchLog.length > 0 && (
        <div className={styles.log}>
          <h3 className={styles.logTitle}>Search Log</h3>
          <div className={styles.logContent}>
            {searchLog.map((log, index) => (
              <div key={index} className={styles.logLine}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.infoTitle}>How it works</h3>
        <ul className={styles.infoList}>
          <li>
            Uses <strong>binary search</strong> algorithm to efficiently find the target
            ledger version in O(log n) time complexity
          </li>
          <li>
            Queries the Aptos blockchain to get block timestamps at different ledger versions
          </li>
          <li>
            Narrows down the search range until finding the version closest to your target time
          </li>
          <li>
            Achieves sub-second accuracy by continuing search until within 1 second tolerance
          </li>
        </ul>
      </div>
    </div>
  );
}

export default LedgerVersionFinder;


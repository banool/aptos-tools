import { useState, useRef } from 'react';
import { useAptos } from '../contexts/AptosContext';
import { AccountAddress } from '@aptos-labs/ts-sdk';
import styles from './TransactionFinder.module.css';

interface TransactionResult {
  version: string;
  hash: string;
  sender: string;
  sequenceNumber: string;
  timestamp: string;
  success: boolean;
  vmStatus: string;
  gasUsed: string;
  type: string;
}

function TransactionFinder() {
  const { aptos, network } = useAptos();
  const [senderAddress, setSenderAddress] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState<string[]>([]);
  const shouldStopRef = useRef(false);

  const addLog = (message: string) => {
    setSearchLog((prev) => [
      ...prev,
      `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`,
    ]);
  };

  const stopSearch = () => {
    shouldStopRef.current = true;
    addLog('Stop requested by user...');
  };

  const findTransaction = async () => {
    if (!senderAddress.trim()) {
      setError('Please enter a sender address');
      return;
    }

    if (!sequenceNumber.trim()) {
      setError('Please enter a sequence number');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);
    setSearchLog([]);
    shouldStopRef.current = false;

    try {
      // Validate and parse the address
      addLog('Validating sender address...');
      const address = AccountAddress.from(senderAddress.trim());
      const addressStr = address.toString();
      addLog(`Using address: ${addressStr}`);

      const targetSeqNum = sequenceNumber.trim();
      addLog(`Target sequence number: ${targetSeqNum}`);

      // Get account transactions and search for the one with matching sequence number
      addLog('Fetching account transactions to determine range...');
      
      // First, get the first transaction to find the starting sequence number
      const firstBatch = await aptos.getAccountTransactions({
        accountAddress: address,
        options: {
          offset: 0,
          limit: 1,
        },
      });

      if (firstBatch.length === 0) {
        addLog('No transactions found for this address');
        throw new Error('No transactions found for this address');
      }

      const firstTxn = firstBatch[0];
      if (!('sequence_number' in firstTxn)) {
        addLog('First transaction has no sequence number');
        throw new Error('First transaction has no sequence number');
      }

      const firstSeqNum = parseInt(firstTxn.sequence_number);
      addLog(`First transaction sequence number: ${firstSeqNum}`);

      const targetSeqNumInt = parseInt(targetSeqNum);
      addLog(`Target sequence number: ${targetSeqNumInt}`);

      // Quick probe to find approximate range and check if target is in range
      addLog('Probing to find transaction range...');
      const probeSizes = [100, 1000, 10000, 100000];
      let lowOffset = 0;
      let highOffset = 100000; // Start with large upper bound
      let lastSeqNum = firstSeqNum;
      let matchingTxn: any = null;
      
      for (const probeSize of probeSizes) {
        if (shouldStopRef.current) break;
        
        const probe = await aptos.getAccountTransactions({
          accountAddress: address,
          options: {
            offset: probeSize,
            limit: 1,
          },
        });
        
        if (probe.length > 0 && 'sequence_number' in probe[0]) {
          const probeSeqNum = parseInt(probe[0].sequence_number);
          lastSeqNum = probeSeqNum;
          addLog(`  Probed offset ${probeSize}: sequence number ${probeSeqNum}`);
          
          // If we haven't passed the target yet, update low bound
          if (probeSeqNum < targetSeqNumInt) {
            lowOffset = probeSize;
          } else if (probeSeqNum > targetSeqNumInt) {
            // We passed it, this is our high bound
            highOffset = probeSize;
            break;
          } else {
            // Exact match during probing!
            addLog('✓ Found exact match during probing!');
            matchingTxn = probe[0];
            break;
          }
        } else {
          addLog(`  Offset ${probeSize} is beyond available transactions`);
          highOffset = probeSize;
          break;
        }
      }

      // If we found it during probing, skip binary search
      if (!matchingTxn && !shouldStopRef.current) {
        addLog(`Starting binary search for sequence number ${targetSeqNumInt}...`);
        addLog(`Search range: offset ${lowOffset} to ${highOffset} (seq ~${firstSeqNum} to ~${lastSeqNum})`);

        // Binary search by offset
        let low = lowOffset;
        let high = highOffset;
        let iterations = 0;
        const maxIterations = 50;

        while (low <= high && iterations < maxIterations && !shouldStopRef.current) {
        iterations++;
        const mid = Math.floor((low + high) / 2);
        
        addLog(`Iteration ${iterations}: Checking offset ${mid} (range: ${low}-${high})`);

        const transactions = await aptos.getAccountTransactions({
          accountAddress: address,
          options: {
            offset: mid,
            limit: 1,
          },
        });

        if (transactions.length === 0) {
          addLog(`  No transaction at offset ${mid}, adjusting high to ${mid - 1}`);
          high = mid - 1;
          continue;
        }

        const txn = transactions[0];
        if (!('sequence_number' in txn)) {
          addLog(`  Transaction at offset ${mid} has no sequence number`);
          high = mid - 1;
          continue;
        }

        const currentSeqNum = parseInt(txn.sequence_number);
        addLog(`  Found sequence number: ${currentSeqNum}`);

        if (currentSeqNum === targetSeqNumInt) {
          addLog('✓ Found exact match!');
          matchingTxn = txn;
          break;
        } else if (currentSeqNum < targetSeqNumInt) {
          addLog(`  ${currentSeqNum} < ${targetSeqNumInt}, searching higher`);
          low = mid + 1;
        } else {
          addLog(`  ${currentSeqNum} > ${targetSeqNumInt}, searching lower`);
          high = mid - 1;
        }
        }
      }

      if (shouldStopRef.current) {
        addLog('✗ Search cancelled by user');
        setError('Search cancelled');
      } else if (matchingTxn) {
        addLog('✓ Search complete! Transaction found.');

        const txResult: TransactionResult = {
          version: matchingTxn.version,
          hash: matchingTxn.hash,
          sender: matchingTxn.sender || addressStr,
          sequenceNumber: matchingTxn.sequence_number || 'N/A',
          timestamp: matchingTxn.timestamp
            ? new Date(Number(matchingTxn.timestamp) / 1000).toISOString()
            : 'N/A',
          success: matchingTxn.success ?? true,
          vmStatus: matchingTxn.vm_status || 'N/A',
          gasUsed: matchingTxn.gas_used || 'N/A',
          type: matchingTxn.type || 'N/A',
        };

        setResult(txResult);
      } else {
        setError(`No transaction found with sequence number ${targetSeqNum} for this address`);
        addLog('✗ No matching transaction found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addLog(`✗ Error: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
      shouldStopRef.current = false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findTransaction();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>🔎</span>
          Transaction Finder
        </h1>
        <p className={styles.description}>
          Find the transaction hash and ledger version for a transaction submitted by a specific
          sender address with a given sequence number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="sender" className={styles.label}>
            Sender Address
          </label>
          <input
            id="sender"
            type="text"
            value={senderAddress}
            onChange={(e) => setSenderAddress(e.target.value)}
            className={styles.input}
            placeholder="0x1 or 0x0000...0001"
            required
          />
          <div className={styles.hint}>
            Enter the Aptos address of the transaction sender
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="sequence" className={styles.label}>
            Sequence Number
          </label>
          <input
            id="sequence"
            type="text"
            value={sequenceNumber}
            onChange={(e) => setSequenceNumber(e.target.value)}
            className={styles.input}
            placeholder="e.g., 0, 1, 2, ..."
            required
          />
          <div className={styles.hint}>
            Enter the sender's account sequence number for the transaction
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" disabled={isSearching} className={styles.submitButton}>
            {isSearching ? (
              <>
                <span className={styles.spinner} />
                Searching...
              </>
            ) : (
              'Find Transaction'
            )}
          </button>
          {isSearching && (
            <button type="button" onClick={stopSearch} className={styles.stopButton}>
              Stop Search
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>✓ Transaction Found</h2>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Transaction Hash</div>
              <div className={styles.resultValue}>{result.hash}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Version</div>
              <div className={styles.resultValue}>{result.version}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Sender</div>
              <div className={styles.resultValue}>{result.sender}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Sequence Number</div>
              <div className={styles.resultValue}>{result.sequenceNumber}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Timestamp</div>
              <div className={styles.resultValue}>{result.timestamp}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Success</div>
              <div className={styles.resultValue}>
                {result.success ? '✓ Yes' : '✗ No'}
              </div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>VM Status</div>
              <div className={styles.resultValue}>{result.vmStatus}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Gas Used</div>
              <div className={styles.resultValue}>{result.gasUsed}</div>
            </div>
            <div className={styles.resultItem}>
              <div className={styles.resultLabel}>Type</div>
              <div className={styles.resultValue}>{result.type}</div>
            </div>
          </div>
          <a
            href={`https://explorer.aptoslabs.com/txn/${result.version}?network=${network.toLowerCase()}`}
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
            <strong>Binary Search:</strong> Uses an efficient O(log n) binary search algorithm to
            find the transaction by offset, rather than scanning sequentially
          </li>
          <li>
            <strong>Range Probing:</strong> First probes at offsets 100, 1000, 10000, and 100000 to
            quickly determine the approximate range of transactions
          </li>
          <li>
            <strong>Offset-based Search:</strong> Searches by offset position in the account's
            transaction list, comparing sequence numbers at each midpoint
          </li>
          <li>
            <strong>Efficiency:</strong> Typically finds the transaction in 10-20 API calls instead
            of potentially thousands with sequential search
          </li>
          <li>
            <strong>Result:</strong> Returns the transaction hash, ledger version, and full
            transaction details for the matching sequence number
          </li>
        </ul>
      </div>
    </div>
  );
}

export default TransactionFinder;


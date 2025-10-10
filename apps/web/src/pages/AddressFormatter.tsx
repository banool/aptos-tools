import { useState } from 'react';
import { AccountAddress } from '@aptos-labs/ts-sdk';
import styles from './AddressFormatter.module.css';

interface AddressResult {
  isValid: boolean;
  isAIP40Compliant: boolean;
  shortFormat: string;
  longFormat: string;
  rawInput: string;
}

function AddressFormatter() {
  const [inputAddress, setInputAddress] = useState('');
  const [result, setResult] = useState<AddressResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopiedField(null);

    if (!inputAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      // Parse the address using AccountAddress
      const address = AccountAddress.from(inputAddress.trim());
      
      // Get both formats
      const longFormat = address.toString();
      const shortFormat = address.toStringWithoutPrefix();
      
      // Check AIP-40 compliance
      // AIP-40 compliant addresses are 64 characters (without 0x prefix)
      // and don't have leading zeros after 0x
      const isAIP40Compliant = inputAddress.trim().toLowerCase() === longFormat.toLowerCase();

      setResult({
        isValid: true,
        isAIP40Compliant,
        shortFormat,
        longFormat,
        rawInput: inputAddress.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid address format');
      console.error('Address parsing error:', err);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>📋</span>
          AIP-40 Address Formatter
        </h1>
        <p className={styles.description}>
          Validate and format Aptos addresses according to AIP-40 standards. Convert
          between short and long formats, and check compliance.
        </p>
      </div>

      <form onSubmit={formatAddress} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>
            Aptos Address
          </label>
          <input
            id="address"
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            className={styles.input}
            placeholder="0x1 or 0x0000...0001"
            required
          />
          <div className={styles.hint}>
            Enter any valid Aptos address (with or without 0x prefix)
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Format Address
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <div className={styles.complianceStatus}>
            <div className={styles.statusBadge}>
              {result.isAIP40Compliant ? (
                <>
                  <span className={styles.statusIcon}>✓</span>
                  <span className={styles.statusText}>AIP-40 Compliant</span>
                </>
              ) : (
                <>
                  <span className={styles.statusIconWarning}>⚠</span>
                  <span className={styles.statusTextWarning}>Not AIP-40 Compliant</span>
                </>
              )}
            </div>
            {!result.isAIP40Compliant && (
              <div className={styles.complianceNote}>
                Input address uses non-standard formatting. Use the long format below
                for AIP-40 compliance.
              </div>
            )}
          </div>

          <div className={styles.formats}>
            <div className={styles.formatCard}>
              <div className={styles.formatHeader}>
                <div className={styles.formatLabel}>LONG Format (AIP-40)</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.longFormat, 'long')}
                  className={styles.copyButton}
                >
                  {copiedField === 'long' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className={styles.formatValue}>{result.longFormat}</div>
              <div className={styles.formatNote}>
                64 hex characters with 0x prefix (standard format)
              </div>
            </div>

            <div className={styles.formatCard}>
              <div className={styles.formatHeader}>
                <div className={styles.formatLabel}>SHORT Format</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('0x' + result.shortFormat, 'short')}
                  className={styles.copyButton}
                >
                  {copiedField === 'short' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className={styles.formatValue}>0x{result.shortFormat}</div>
              <div className={styles.formatNote}>Without leading zeros (human-readable)</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.infoTitle}>About AIP-40</h3>
        <ul className={styles.infoList}>
          <li>
            <strong>AIP-40</strong> standardizes Aptos address formatting for consistency
          </li>
          <li>
            Compliant addresses are always <strong>66 characters</strong> (0x + 64 hex digits)
          </li>
          <li>
            Short format removes leading zeros for readability (e.g., 0x1 instead of 0x00...01)
          </li>
          <li>
            Both formats are valid, but long format is required for certain operations
          </li>
          <li>
            Special addresses like <strong>0x1</strong> (core framework) use short format commonly
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AddressFormatter;


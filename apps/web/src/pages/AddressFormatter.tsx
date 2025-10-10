import { useState } from 'react';
import { AccountAddress } from '@aptos-labs/ts-sdk';
import styles from './AddressFormatter.module.css';

interface AddressResult {
  isValid: boolean;
  isAIP40Compliant: boolean;
  aip40Format: string;
  longFormat: string;
  shortFormat: string;
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
      
      // Get all three formats
      const aip40Format = address.toString();
      const longFormat = address.toStringLong();
      const shortFormat = address.toStringShort();
      
      // Check AIP-40 compliance
      // AIP-40 compliant addresses are 64 characters (without 0x prefix)
      // and don't have leading zeros after 0x
      const isAIP40Compliant = inputAddress.trim().toLowerCase() === aip40Format.toLowerCase();

      setResult({
        isValid: true,
        isAIP40Compliant,
        aip40Format,
        longFormat,
        shortFormat,
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
                <div className={styles.formatLabel}>AIP-40 Format</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.aip40Format, 'aip40')}
                  className={styles.copyButton}
                >
                  {copiedField === 'aip40' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className={styles.formatValue}>{result.aip40Format}</div>
              <div className={styles.formatNote}>
                Standard format via toString() - AIP-40 compliant
              </div>
            </div>

            <div className={styles.formatCard}>
              <div className={styles.formatHeader}>
                <div className={styles.formatLabel}>LONG Format</div>
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
                Via toStringLong() - Full 64 hex characters with 0x prefix
              </div>
            </div>

            <div className={styles.formatCard}>
              <div className={styles.formatHeader}>
                <div className={styles.formatLabel}>SHORT Format</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.shortFormat, 'short')}
                  className={styles.copyButton}
                >
                  {copiedField === 'short' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className={styles.formatValue}>{result.shortFormat}</div>
              <div className={styles.formatNote}>
                Via toStringShort() - Without leading zeros (human-readable)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.infoTitle}>About AIP-40</h3>
        <ul className={styles.infoList}>
          <li>
            <strong>AIP-40 Format</strong> - This is what <code>toString()</code> outputs. SHORT for special addresses (0x0 to 0xf), LONG for everything else.
          </li>
          <li>
            <strong>LONG Format</strong> - Via <code>toStringLong()</code>. Always 66 characters (0x + 64 hex digits).
          </li>
          <li>
            <strong>SHORT Format</strong> - Via <code>toStringShort()</code>. No leading zeroes.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AddressFormatter;


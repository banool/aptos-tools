import { useState, useEffect, useCallback } from 'react';
import { useAptos } from '../contexts/AptosContext';
import styles from './FeatureFlags.module.css';

interface FeatureInfo {
  name: string;
  description: string;
  deprecated?: boolean;
}

// Derived from aptos-core features.move on the main branch.
// https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/move-stdlib/sources/configs/features.move
const FEATURE_FLAGS: Record<number, FeatureInfo> = {
  1: { name: 'CODE_DEPENDENCY_CHECK', description: 'Validation of package dependencies' },
  2: {
    name: 'TREAT_FRIEND_AS_PRIVATE',
    description: 'Friend functions treated as private during upgrade compatibility checking',
  },
  3: {
    name: 'SHA_512_AND_RIPEMD_160_NATIVES',
    description: 'SHA2-512, SHA3-512, and RIPEMD-160 hash function natives',
  },
  4: { name: 'APTOS_STD_CHAIN_ID_NATIVES', description: 'Chain ID native function' },
  5: { name: 'VM_BINARY_FORMAT_V6', description: 'Binary format version v6' },
  6: {
    name: 'COLLECT_AND_DISTRIBUTE_GAS_FEES',
    description: 'Gas fee collection and distribution',
    deprecated: true,
  },
  7: {
    name: 'MULTI_ED25519_PK_VALIDATE_V2_NATIVES',
    description: 'Multi-Ed25519 public key validation v2',
  },
  8: { name: 'BLAKE2B_256_NATIVE', description: 'BLAKE2B-256 hash function native' },
  9: { name: 'RESOURCE_GROUPS', description: 'Resource groups' },
  10: { name: 'MULTISIG_ACCOUNTS', description: 'Multisig accounts' },
  11: { name: 'DELEGATION_POOLS', description: 'Delegation pools' },
  12: {
    name: 'CRYPTOGRAPHY_ALGEBRA_NATIVES',
    description: 'Generic algebra basic operation support',
  },
  13: { name: 'BLS12_381_STRUCTURES', description: 'BLS12-381 algebra operations' },
  14: {
    name: 'ED25519_PUBKEY_VALIDATE_RETURN_FALSE_WRONG_LENGTH',
    description: 'Ed25519 pubkey validate returns false on wrong length',
  },
  15: { name: 'STRUCT_CONSTRUCTORS', description: 'Struct constructors' },
  16: { name: 'PERIODICAL_REWARD_RATE_DECREASE', description: 'Periodical reward rate decrease' },
  17: { name: 'PARTIAL_GOVERNANCE_VOTING', description: 'Partial governance voting' },
  20: { name: 'CHARGE_INVARIANT_VIOLATION', description: 'Charge invariant violation error' },
  21: {
    name: 'DELEGATION_POOL_PARTIAL_GOVERNANCE_VOTING',
    description: 'Partial governance voting on delegation pool',
  },
  22: { name: 'FEE_PAYER_ENABLED', description: 'Alternate gas payer support' },
  23: { name: 'APTOS_UNIQUE_IDENTIFIERS', description: 'AUID creation for unique identifiers' },
  24: { name: 'BULLETPROOFS_NATIVES', description: 'Bulletproofs zero-knowledge range proof' },
  25: { name: 'SIGNER_NATIVE_FORMAT_FIX', description: 'Fix native formatter for signer' },
  26: { name: 'MODULE_EVENT', description: 'Module events via emit function' },
  29: {
    name: 'SIGNATURE_CHECKER_V2_SCRIPT_FIX',
    description: 'Fix for counting bug in signature checker script path',
  },
  31: { name: 'SAFER_RESOURCE_GROUPS', description: 'Safer resource groups' },
  32: { name: 'SAFER_METADATA', description: 'Safer metadata' },
  33: { name: 'SINGLE_SENDER_AUTHENTICATOR', description: 'Single sender authenticator' },
  34: {
    name: 'SPONSORED_AUTOMATIC_ACCOUNT_CREATION',
    description: 'Automatic account creation for sponsored transactions',
  },
  35: { name: 'FEE_PAYER_ACCOUNT_OPTIONAL', description: 'Fee payer account optional' },
  38: { name: 'LIMIT_MAX_IDENTIFIER_LENGTH', description: 'Limit max identifier length' },
  39: {
    name: 'OPERATOR_BENEFICIARY_CHANGE',
    description: 'Changing beneficiaries for operators',
  },
  40: { name: 'VM_BINARY_FORMAT_V7', description: 'Binary format version v7' },
  41: {
    name: 'RESOURCE_GROUPS_SPLIT_IN_VM_CHANGE_SET',
    description: 'Resource groups split in VM change set',
  },
  42: {
    name: 'COMMISSION_CHANGE_DELEGATION_POOL',
    description: 'Operator commission rate change in delegation pool',
  },
  43: { name: 'BN254_STRUCTURES', description: 'BN254 algebra operations' },
  45: { name: 'RECONFIGURE_WITH_DKG', description: 'Reconfiguration with DKG' },
  46: { name: 'KEYLESS_ACCOUNTS', description: 'Keyless accounts (OIDB)' },
  47: {
    name: 'KEYLESS_BUT_ZKLESS_ACCOUNTS',
    description: 'ZK-less mode for keyless accounts',
  },
  49: { name: 'JWK_CONSENSUS', description: 'JWK consensus' },
  50: {
    name: 'CONCURRENT_FUNGIBLE_ASSETS',
    description: 'Concurrent fungible asset creation',
  },
  52: { name: 'OBJECT_CODE_DEPLOYMENT', description: 'Deploying code to objects' },
  53: { name: 'MAX_OBJECT_NESTING_CHECK', description: 'Maximum object nesting check' },
  54: {
    name: 'KEYLESS_ACCOUNTS_WITH_PASSKEYS',
    description: 'Keyless accounts with passkey-based ephemeral signatures',
  },
  55: { name: 'MULTISIG_V2_ENHANCEMENT', description: 'Multisig V2 enhancement' },
  56: {
    name: 'DELEGATION_POOL_ALLOWLISTING',
    description: 'Delegators allowlisting for delegation pools',
  },
  57: { name: 'MODULE_EVENT_MIGRATION', description: 'Module event migration' },
  59: {
    name: 'TRANSACTION_CONTEXT_EXTENSION',
    description: 'Transaction context extension for user transaction info',
  },
  60: {
    name: 'COIN_TO_FUNGIBLE_ASSET_MIGRATION',
    description: 'Migration from coin to fungible asset',
  },
  61: {
    name: 'PRIMARY_APT_FUNGIBLE_STORE_AT_USER_ADDRESS',
    description: 'Primary APT fungible store at user address',
  },
  62: {
    name: 'OBJECT_NATIVE_DERIVED_ADDRESS',
    description: 'Efficient native implementation for object derived address',
  },
  63: {
    name: 'DISPATCHABLE_FUNGIBLE_ASSET',
    description: 'Dispatchable fungible asset standard',
  },
  64: {
    name: 'NEW_ACCOUNTS_DEFAULT_TO_FA_APT_STORE',
    description: 'New accounts default to FA APT store',
  },
  65: {
    name: 'OPERATIONS_DEFAULT_TO_FA_APT_STORE',
    description: 'Operations default to FA APT store',
  },
  66: { name: 'AGGREGATOR_V2_IS_AT_LEAST_API', description: 'Aggregator V2 is_at_least API' },
  67: { name: 'CONCURRENT_FUNGIBLE_BALANCE', description: 'Concurrent fungible balance' },
  68: {
    name: 'DEFAULT_TO_CONCURRENT_FUNGIBLE_BALANCE',
    description: 'Default new fungible store to concurrent variant',
  },
  70: {
    name: 'ABORT_IF_MULTISIG_PAYLOAD_MISMATCH',
    description: 'Abort if multisig payload does not match on-chain payload',
  },
  78: {
    name: 'TRANSACTION_SIMULATION_ENHANCEMENT',
    description: 'Simulation without auth check, sponsored and multisig simulation',
  },
  79: { name: 'COLLECTION_OWNER', description: 'Collection owner' },
  80: { name: 'NATIVE_MEMORY_OPERATIONS', description: 'Native memory operations' },
  84: { name: 'PERMISSIONED_SIGNER', description: 'Permissioned signer' },
  85: { name: 'ACCOUNT_ABSTRACTION', description: 'Account abstraction' },
  86: { name: 'VM_BINARY_FORMAT_V8', description: 'Binary format version v8' },
  87: { name: 'BULLETPROOFS_BATCH_NATIVES', description: 'Batch Bulletproofs native functions' },
  88: {
    name: 'DERIVABLE_ACCOUNT_ABSTRACTION',
    description: 'Derivable account abstraction',
  },
  89: { name: 'ENABLE_FUNCTION_VALUES', description: 'Function values' },
  90: {
    name: 'NEW_ACCOUNTS_DEFAULT_TO_FA_STORE',
    description: 'New accounts default to fungible asset store',
  },
  91: { name: 'DEFAULT_ACCOUNT_RESOURCE', description: 'Default account resource' },
  92: { name: 'JWK_CONSENSUS_PER_KEY_MODE', description: 'JWK consensus in per-key mode' },
  94: { name: 'ORDERLESS_TRANSACTIONS', description: 'Orderless transactions' },
  96: {
    name: 'CALCULATE_TRANSACTION_FEE_FOR_DISTRIBUTION',
    description: 'Calculate transaction fee for distribution',
  },
  97: {
    name: 'DISTRIBUTE_TRANSACTION_FEE',
    description: 'Distribute transaction fee to validators',
  },
  98: {
    name: 'MONOTONICALLY_INCREASING_COUNTER',
    description: 'Monotonically increasing counter native function',
  },
  105: { name: 'FUNCTION_REFLECTION', description: 'Function reflection' },
  107: {
    name: 'SLH_DSA_SHA2_128S_SIGNATURE',
    description: 'SLH-DSA-SHA2-128s post-quantum signature scheme',
  },
  108: { name: 'ENCRYPTED_TRANSACTIONS', description: 'Encrypted mempool' },
};

function parseFeaturesBitfield(hexString: string): Set<number> {
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  const enabled = new Set<number>();

  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    const byteIndex = i / 2;
    for (let bit = 0; bit < 8; bit++) {
      if (byte & (1 << bit)) {
        enabled.add(byteIndex * 8 + bit);
      }
    }
  }

  return enabled;
}

interface FeatureRow {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  known: boolean;
  deprecated: boolean;
}

function buildFeatureRows(enabledFeatures: Set<number>): FeatureRow[] {
  const allIds = new Set<number>([
    ...Object.keys(FEATURE_FLAGS).map(Number),
    ...enabledFeatures,
  ]);

  return Array.from(allIds)
    .sort((a, b) => a - b)
    .map((id) => {
      const info = FEATURE_FLAGS[id];
      return {
        id,
        name: info?.name ?? `UNKNOWN_FEATURE_${id}`,
        description: info?.description ?? 'Unknown feature flag',
        enabled: enabledFeatures.has(id),
        known: !!info,
        deprecated: info?.deprecated ?? false,
      };
    });
}

function FeatureFlags() {
  const { nodeUrl, networkId } = useAptos();
  const [enabledFeatures, setEnabledFeatures] = useState<Set<number> | null>(null);
  const [rawHex, setRawHex] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showOnly, setShowOnly] = useState<'all' | 'enabled' | 'disabled'>('all');

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEnabledFeatures(null);
    setRawHex(null);

    try {
      const response = await fetch(
        `${nodeUrl}/accounts/0x1/resource/0x1::features::Features`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const hex: string = data.data.features;
      setRawHex(hex);
      setEnabledFeatures(parseFeaturesBitfield(hex));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features');
    } finally {
      setLoading(false);
    }
  }, [nodeUrl]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const rows = enabledFeatures ? buildFeatureRows(enabledFeatures) : [];

  const filteredRows = rows.filter((row) => {
    if (showOnly === 'enabled' && !row.enabled) return false;
    if (showOnly === 'disabled' && row.enabled) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        String(row.id).includes(q)
      );
    }
    return true;
  });

  const enabledCount = rows.filter((r) => r.enabled).length;
  const disabledCount = rows.filter((r) => !r.enabled).length;

  // Key on networkId to avoid showing stale results while loading.
  const hasResults = enabledFeatures && !loading;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>⛳️</span>
          Feature Flags
        </h1>
        <p className={styles.description}>
          View which on-chain feature flags are enabled for the selected network. Feature
          definitions are sourced from{' '}
          <a
            href="https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/move-stdlib/sources/configs/features.move"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            features.move
          </a>
          .
        </p>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Fetching feature flags...
        </div>
      )}

      {hasResults && (
        <>
          <div className={styles.summary}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{enabledCount}</div>
              <div className={styles.statLabel}>Enabled</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValueDim}>{disabledCount}</div>
              <div className={styles.statLabel}>Disabled</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValueDim}>{rows.length}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
            {rawHex && (
              <div className={styles.rawHex}>
                <span className={styles.rawHexLabel}>Raw:</span>
                <code className={styles.rawHexValue}>{rawHex}</code>
              </div>
            )}
          </div>

          <div className={styles.filterRow}>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterInput}
              placeholder="Filter by name, description, or number..."
            />
            <div className={styles.toggleGroup}>
              <button
                type="button"
                className={`${styles.toggleButton} ${showOnly === 'all' ? styles.toggleActive : ''}`}
                onClick={() => setShowOnly('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${showOnly === 'enabled' ? styles.toggleActive : ''}`}
                onClick={() => setShowOnly('enabled')}
              >
                Enabled
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${showOnly === 'disabled' ? styles.toggleActive : ''}`}
                onClick={() => setShowOnly('disabled')}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className={styles.featureList} key={networkId}>
            {filteredRows.length === 0 && (
              <div className={styles.emptyState}>No features match your filter.</div>
            )}
            {filteredRows.map((row) => (
              <div
                key={row.id}
                className={`${styles.featureRow} ${row.enabled ? styles.featureEnabled : styles.featureDisabled} ${row.deprecated ? styles.featureDeprecated : ''}`}
              >
                <div className={styles.featureStatus}>
                  <span
                    className={row.enabled ? styles.statusDotEnabled : styles.statusDotDisabled}
                  />
                </div>
                <div className={styles.featureId}>#{row.id}</div>
                <div className={styles.featureInfo}>
                  <div className={styles.featureName}>
                    {row.name}
                    {row.deprecated && <span className={styles.deprecatedBadge}>deprecated</span>}
                    {!row.known && <span className={styles.unknownBadge}>unknown</span>}
                  </div>
                  <div className={styles.featureDesc}>{row.description}</div>
                </div>
                <div className={styles.featureBadge}>
                  {row.enabled ? (
                    <span className={styles.enabledBadge}>Enabled</span>
                  ) : (
                    <span className={styles.disabledBadge}>Disabled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FeatureFlags;

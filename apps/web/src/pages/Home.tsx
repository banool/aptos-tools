import { Link } from '@tanstack/react-router';
import styles from './Home.module.css';

function Home() {
  const tools = [
    {
      path: '/ledger-version-finder',
      name: 'Ledger Version Finder',
      icon: '🔍',
      description:
        'Find the ledger version closest to a specific date and time using binary search on the Aptos blockchain.',
      features: ['Binary search algorithm', 'Millisecond precision', 'All networks supported'],
    },
    {
      path: '/address-formatter',
      name: 'AIP-40 Address Formatter',
      icon: '📋',
      description:
        'Validate and format Aptos addresses according to AIP-40 standards. Convert between short and long formats.',
      features: ['AIP-40 compliance check', 'Short & long formats', 'One-click copy'],
    },
    {
      path: '/clock-comparison',
      name: 'Clock Comparison',
      icon: '🕐',
      description:
        'Compare wall clock time with Aptos blockchain time across multiple timezones. Visualize time differences in analog or digital format.',
      features: ['Multiple timezones', 'Analog & digital clocks', 'Latency correction'],
    },
    {
      path: '/transaction-finder',
      name: 'Transaction Finder',
      icon: '🔎',
      description:
        'Find the transaction hash and ledger version for a transaction by sender address and sequence number using binary search.',
      features: ['Binary search algorithm', 'O(log n) complexity', 'Full transaction details'],
    },
    {
      path: '/feature-flags',
      name: 'Feature Flags',
      icon: '⛳️',
      description:
        'View which on-chain feature flags are enabled for a given network. Supports mainnet, testnet, devnet, shelbynet, and custom node URLs.',
      features: ['All networks + custom URL', 'Live on-chain data', 'Search & filter'],
    },
    {
      path: '/tps-tracker',
      name: 'TPS Tracker',
      icon: '📈',
      description:
        'Monitor real-time transactions per second on the Aptos blockchain. Polls the node API every second to track throughput with a live graph.',
      features: ['Live TPS graph', 'Average & peak TPS', 'Start/stop/reset controls'],
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>Aptos Tools</span>
        </h1>
        <p className={styles.subtitle}>Utilities for the Aptos blockchain</p>
      </div>

      <div className={styles.tools}>
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className={styles.toolCard}>
            <div className={styles.toolIcon}>{tool.icon}</div>
            <h2 className={styles.toolName}>{tool.name}</h2>
            <p className={styles.toolDescription}>{tool.description}</p>
            <ul className={styles.featureList}>
              {tool.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  <span className={styles.featureIcon}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className={styles.toolAction}>Try it now →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;

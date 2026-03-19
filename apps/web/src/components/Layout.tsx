import { Link, useRouterState } from '@tanstack/react-router';
import { useAptos } from '../contexts/AptosContext';
import NetworkModal from './NetworkModal';
import styles from './Layout.module.css';
import { ReactNode, useState } from 'react';

const MANAGE_NETWORKS_VALUE = '__manage__';

function Layout({ children }: { children: ReactNode }) {
  const router = useRouterState();
  const { networkId, setNetworkId, customNetworks } = useAptos();
  const [modalOpen, setModalOpen] = useState(false);

  const tools = [
    { path: '/ledger-version-finder', name: 'Ledger Version Finder', icon: '🔍' },
    { path: '/address-formatter', name: 'Address Formatter', icon: '📋' },
    { path: '/clock-comparison', name: 'Clock Comparison', icon: '🕐' },
    { path: '/transaction-finder', name: 'Transaction Finder', icon: '🔎' },
    { path: '/feature-flags', name: 'Feature Flags', icon: '⛳️' },
    { path: '/tps-tracker', name: 'TPS Tracker', icon: '📈' },
  ];

  const currentPath = router.location.pathname;

  const handleNetworkChange = (value: string) => {
    if (value === MANAGE_NETWORKS_VALUE) {
      setModalOpen(true);
      return;
    }
    setNetworkId(value);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>Aptos Tools</span>
          </Link>

          <div className={styles.networkSelector}>
            <label htmlFor="network">Network:</label>
            <select
              id="network"
              value={networkId}
              onChange={(e) => handleNetworkChange(e.target.value)}
              className={styles.select}
            >
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="devnet">Devnet</option>
              <option value="shelbynet">Shelbynet</option>
              {customNetworks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value={MANAGE_NETWORKS_VALUE}>Manage networks...</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link
              to="/"
              className={`${styles.navLink} ${currentPath === '/' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🏠</span>
              <span>Home</span>
            </Link>

            {tools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className={`${styles.navLink} ${currentPath === tool.path ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{tool.icon}</span>
                <span>{tool.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>

      <footer className={styles.footer}>
        <p>
          Built with ❤️ for the Aptos community |{' '}
          <a href="https://github.com/banool/aptos-tools" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>

      <NetworkModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default Layout;

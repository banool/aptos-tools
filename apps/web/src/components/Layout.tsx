import { Link, useRouterState } from '@tanstack/react-router';
import { useAptos } from '../contexts/AptosContext';
import { Network } from '@aptos-labs/ts-sdk';
import styles from './Layout.module.css';
import { ReactNode } from 'react';

function Layout({ children }: { children: ReactNode }) {
  const router = useRouterState();
  const { network, setNetwork } = useAptos();

  const tools = [
    { path: '/ledger-version-finder', name: 'Ledger Version Finder', icon: '🔍' },
    { path: '/address-formatter', name: 'Address Formatter', icon: '📋' },
    { path: '/clock-comparison', name: 'Clock Comparison', icon: '🕐' },
  ];

  const currentPath = router.location.pathname;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬢</span>
            <span className={styles.logoText}>Aptos Tools</span>
          </Link>

          <div className={styles.networkSelector}>
            <label htmlFor="network">Network:</label>
            <select
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value as Network)}
              className={styles.select}
            >
              <option value={Network.MAINNET}>Mainnet</option>
              <option value={Network.TESTNET}>Testnet</option>
              <option value={Network.DEVNET}>Devnet</option>
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
    </div>
  );
}

export default Layout;

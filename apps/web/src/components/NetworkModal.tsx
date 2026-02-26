import { useState, useRef, useEffect } from 'react';
import { useAptos, CustomNetwork } from '../contexts/AptosContext';
import styles from './NetworkModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

function NetworkModal({ open, onClose }: Props) {
  const { customNetworks, addCustomNetwork, removeCustomNetwork, setNetworkId } = useAptos();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      nameInputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUrl = url.trim().replace(/\/+$/, '');

    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (!trimmedUrl) {
      setError('URL is required');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError('Invalid URL');
      return;
    }

    const network = addCustomNetwork(trimmedName, trimmedUrl);
    setNetworkId(network.id);
    setName('');
    setUrl('');
    onClose();
  };

  const handleRemove = (network: CustomNetwork) => {
    removeCustomNetwork(network.id);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClick={handleBackdropClick}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Manage Networks</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        {customNetworks.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Custom Networks</h3>
            <div className={styles.networkList}>
              {customNetworks.map((network) => (
                <div key={network.id} className={styles.networkItem}>
                  <div className={styles.networkInfo}>
                    <div className={styles.networkName}>{network.name}</div>
                    <div className={styles.networkUrl}>{network.url}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemove(network)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Add Network</h3>
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="net-name" className={styles.label}>
                Name
              </label>
              <input
                ref={nameInputRef}
                id="net-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="My Network"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="net-url" className={styles.label}>
                Node URL
              </label>
              <input
                id="net-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={styles.inputMono}
                placeholder="https://fullnode.example.com/v1"
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.addButton}>
              Add &amp; Select
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

export default NetworkModal;

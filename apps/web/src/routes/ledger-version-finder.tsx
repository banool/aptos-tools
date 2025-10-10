import { createFileRoute } from '@tanstack/react-router';
import LedgerVersionFinder from '../pages/LedgerVersionFinder';

export const Route = createFileRoute('/ledger-version-finder')({
  component: LedgerVersionFinder,
});


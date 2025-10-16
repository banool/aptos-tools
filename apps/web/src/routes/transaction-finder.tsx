import { createFileRoute } from '@tanstack/react-router';
import TransactionFinder from '../pages/TransactionFinder';

export const Route = createFileRoute('/transaction-finder')({
  component: TransactionFinder,
});


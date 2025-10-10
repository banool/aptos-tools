import { createFileRoute } from '@tanstack/react-router';
import AddressFormatter from '../pages/AddressFormatter';

export const Route = createFileRoute('/address-formatter')({
  component: AddressFormatter,
});


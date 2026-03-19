import { createFileRoute } from '@tanstack/react-router';
import TpsTracker from '../pages/TpsTracker';

export const Route = createFileRoute('/tps-tracker')({
  component: TpsTracker,
});

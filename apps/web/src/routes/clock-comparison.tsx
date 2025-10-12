import { createFileRoute } from '@tanstack/react-router';
import ClockComparison from '../pages/ClockComparison';

export const Route = createFileRoute('/clock-comparison')({
  component: ClockComparison,
});

import { createFileRoute } from '@tanstack/react-router';
import FeatureFlags from '../pages/FeatureFlags';

export const Route = createFileRoute('/feature-flags')({
  component: FeatureFlags,
});

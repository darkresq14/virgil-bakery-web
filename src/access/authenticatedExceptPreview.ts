import type { AccessArgs } from 'payload';

import type { User } from '@/payload-types';
import { isPreviewDeployment } from '@/utilities/previewEnv';

import { authenticated } from './authenticated';

type isAuthenticated = (args: AccessArgs<User>) => boolean;

/**
 * `authenticated`, except on Vercel Preview Deployments.
 *
 * Media write operations (create / update / delete) are denied on preview
 * regardless of authentication, so test uploads cannot pollute the preview
 * database — the blob plugin is production-gated and Media's local upload
 * directory only exists in dev, so uploads would have nowhere to land (ADR 0005).
 * On production and dev (`VERCEL_ENV` unset or `'production'`) access is
 * unchanged, deferring to `authenticated`.
 */
export const authenticatedExceptPreview: isAuthenticated = (args) => {
  if (isPreviewDeployment()) {
    return false;
  }

  return authenticated(args);
};

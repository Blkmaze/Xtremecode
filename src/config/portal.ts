// src/config/portal.ts

// Simple shape for known portals
export interface PortalDefinition {
  id: string;
  label: string;
  url: string;
}

// ✅ Your four DNS portals
export const PORTALS: PortalDefinition[] = [
  {
    id: 'xyzchd',
    label: 'XYZCHD Live',
    url: 'https://live.xyzchd.io',
  },
  {
    id: 'flarepearl',
    label: 'FlarePearl',
    url: 'http://flarepearl.com',
  },
  {
    id: 'cdnky',
    label: 'CDN-KY',
    url: 'http://cdn-ky.com:80',
  },
  {
    id: 'blacklabelx',
    label: 'BlackLabelX',
    url: 'https://blacklabelx.online:443',
  },
];

/**
 * FIXED_PORTAL behavior:
 * - Leave as null → app uses whatever URL you type in the setup screen.
 * - Set to one of the entries in PORTALS → that portal is forced/embedded.
 *
 * Example to lock to XYZCHD:
 *   export const FIXED_PORTAL = PORTALS[0];
 */
export const FIXED_PORTAL = null;

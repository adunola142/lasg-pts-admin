/**
 * `LoginDto.deviceId` expects a client-generated UUID (mirroring the
 * mobile app's behaviour — see lasg-pts-backend/src/auth/dto/login.dto.ts).
 * For a browser, that just means a stable id persisted per-browser.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'lasg_pts_admin_device_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

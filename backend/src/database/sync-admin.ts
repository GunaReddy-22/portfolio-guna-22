/**
 * @deprecated PERMANENTLY DISABLED
 *
 * Automatic owner credential mutation on server startup has been removed.
 * Normal server startup must NEVER alter or reset existing owner credentials,
 * active status, roles, or session tokens.
 *
 * Initial owner provisioning must be explicitly executed using the create-only
 * script:
 *   ADMIN_PASSWORD="your-strong-password" npm run seed:admin
 *
 * which delegates to `provisionOwner()` in `./provision-owner.js`.
 */
export async function syncAdminUserFromEnv(): Promise<void> {
  // Permanently disabled. No-op to prevent any accidental credential mutation.
}

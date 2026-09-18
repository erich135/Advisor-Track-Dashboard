/**
 * Workflows that need Abel database/local/031–037.
 * Production builds keep this off until those migrations are authorised.
 * Local Abel: set VITE_ENTERPRISE_SCHEMA=true in .env.development.
 */
export function isEnterpriseSchemaEnabled(): boolean {
  const viteFlag =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ENTERPRISE_SCHEMA : undefined;
  const processFlag = typeof process !== 'undefined' ? process.env.VITE_ENTERPRISE_SCHEMA : undefined;
  return viteFlag === 'true' || processFlag === 'true';
}

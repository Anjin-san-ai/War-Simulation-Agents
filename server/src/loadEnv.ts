/**
 * Load env files with predictable precedence so war API works whether you run
 * from repo root or `server/`, and so `server/.env` overrides repo-root `.env`.
 */
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = resolve(__dirname, '..')
const repoRoot = resolve(serverDir, '..')

export function loadEnvFiles(): void {
  // Lower priority: monorepo root (often has VITE_* for the client)
  config({ path: resolve(repoRoot, '.env') })
  // Higher priority: server-only secrets
  config({ path: resolve(serverDir, '.env'), override: true })
}

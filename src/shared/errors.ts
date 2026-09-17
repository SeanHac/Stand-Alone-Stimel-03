/**
 * Electron wraps anything thrown in an IPC handler, so a message that reads
 * "Incorrect username or password" in the main process arrives in the
 * renderer as:
 *
 *   Error invoking remote method 'auth:login': Error: Incorrect username or password
 *
 * That prefix is plumbing. It names an internal channel, repeats "Error"
 * twice, and tells a therapist nothing they can act on. This strips it back
 * to the message the service actually wrote.
 */

const IPC_PREFIX = /^Error invoking remote method '[^']*':\s*/
const REPEATED_ERROR = /^(Error:\s*)+/

export function toMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!(error instanceof Error)) return fallback

  const cleaned = error.message.replace(IPC_PREFIX, '').replace(REPEATED_ERROR, '').trim()

  return cleaned || fallback
}

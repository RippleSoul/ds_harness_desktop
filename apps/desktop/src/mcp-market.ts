/** Safe projection of the public MCP Registry used by the Desktop marketplace. */

/** One HTTP MCP that Desktop can connect without installing or executing a package. */
export interface DesktopMcpMarketServer {
  /** Registry-qualified server name. */
  readonly name: string
  /** Registry-supplied summary, when present. */
  readonly description: string
  /** Registry-supplied server version, when present. */
  readonly version: string
  /** Optional source repository shown to the user. */
  readonly repositoryUrl?: string
  /** HTTPS endpoint eligible for one-click Desktop connection. */
  readonly url?: string
}

interface RegistryServerRow {
  readonly server?: unknown
}

const REGISTRY_URL = 'https://registry.modelcontextprotocol.io/v0.1/servers'
const REQUEST_TIMEOUT_MS = 12_000
const MAX_QUERY_LENGTH = 120

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function repositoryUrl(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const url = text(value.url)
  if (url === undefined) return undefined
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}

function oneClickUrl(remotes: unknown): string | undefined {
  if (!Array.isArray(remotes)) return undefined
  for (const remote of remotes) {
    if (!isRecord(remote) || remote.type !== 'streamable-http') continue
    const url = text(remote.url)
    if (url === undefined) continue
    if (isRecord(remote.headers) && Object.keys(remote.headers).length > 0) continue
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:') return parsed.href
    } catch {
      // The public registry is untrusted input; an invalid endpoint is simply not one-click eligible.
    }
  }
  return undefined
}

function project(row: RegistryServerRow): DesktopMcpMarketServer | undefined {
  if (!isRecord(row.server)) return undefined
  const name = text(row.server.name)
  if (name === undefined) return undefined
  const repository = repositoryUrl(row.server.repository)
  const url = oneClickUrl(row.server.remotes)
  return {
    name,
    description: text(row.server.description) ?? '',
    version: text(row.server.version) ?? '',
    ...(repository === undefined ? {} : { repositoryUrl: repository }),
    ...(url === undefined ? {} : { url }),
  }
}

/**
 * Query the official MCP Registry and retain only fields the Desktop renderer needs.
 * @param query - Optional human search phrase.
 * @returns A bounded page of registry servers, without registry implementation metadata.
 */
export async function searchDesktopMcpMarket(query: string): Promise<readonly DesktopMcpMarketServer[]> {
  const search = query.trim()
  if (search.length > MAX_QUERY_LENGTH) throw new Error(`MCP marketplace: search is limited to ${String(MAX_QUERY_LENGTH)} characters`)
  const endpoint = new URL(REGISTRY_URL)
  endpoint.searchParams.set('limit', '30')
  if (search !== '') endpoint.searchParams.set('search', search)
  let response: Response
  try {
    response = await fetch(endpoint, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  } catch (error) {
    throw new Error('MCP marketplace: the official registry could not be reached', { cause: error })
  }
  if (!response.ok) throw new Error(`MCP marketplace: registry returned HTTP ${String(response.status)}`)
  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    throw new Error('MCP marketplace: registry returned invalid JSON', { cause: error })
  }
  if (!isRecord(body) || !Array.isArray(body.servers)) throw new Error('MCP marketplace: registry response has no server list')
  const servers = body.servers
    .map(value => project(value as RegistryServerRow))
    .filter((value): value is DesktopMcpMarketServer => value !== undefined)
  return servers.sort((left, right) => left.name.localeCompare(right.name))
}

/** Minimal, typed desktop operations exposed to the primary application UI. */

/** One installed Streamable HTTP MCP connection. */
export interface DesktopMcpRecord {
  readonly id: string
  readonly name: string
  readonly serverName: string
  readonly url: string
}

/** One public MCP Registry result. */
export interface DesktopMcpMarketServer {
  readonly name: string
  readonly description: string
  readonly version: string
  readonly repositoryUrl?: string
  readonly url?: string
}

/** One balance denomination returned without exposing the API key. */
export interface DesktopAccountBalance {
  readonly currency: string
  readonly total: string
  readonly granted: string
  readonly toppedUp: string
}

/** Desktop-only account and retained session usage summary. */
export interface DesktopAccountSummary {
  readonly balance: readonly DesktopAccountBalance[]
  readonly usage: {
    readonly sessions: number
    readonly scannedSessions: number
    readonly truncated: boolean
    readonly inputTokens: number
    readonly outputTokens: number
    readonly cacheReadTokens: number
    readonly cacheWriteTokens: number
  }
}

/** Allowlisted native operations made available to the main web renderer. */
export interface DesktopSettingsBridge {
  readonly protocolVersion: 1
  readonly mcp: {
    list(): Promise<readonly DesktopMcpRecord[]>
    search(query: string): Promise<readonly DesktopMcpMarketServer[]>
    add(request: { readonly name: string; readonly url: string }): Promise<void>
    remove(id: string): Promise<void>
  }
  readonly account: {
    summary(): Promise<DesktopAccountSummary>
  }
}

declare global {
  interface Window {
    /** Present only in the packaged Desktop application. */
    dshDesktop?: DesktopSettingsBridge
  }
}

/**
 * Return the Desktop renderer bridge only when all required safe operations
 * are present. The regular browser application intentionally exposes none.
 * @returns the Desktop settings bridge, or undefined outside Desktop.
 */
export function resolveDesktopSettingsBridge(): DesktopSettingsBridge | undefined {
  const bridge = window.dshDesktop
  if (bridge?.protocolVersion !== 1 || bridge.mcp === undefined || bridge.account === undefined) return undefined
  return bridge
}

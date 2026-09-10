/** Typed preload operations exposed only by the Electron shell. */

import type { DesktopMcpAddRequest, DesktopMcpRecord, DesktopPluginRecord } from './project-manager.ts'
import type { DesktopMcpMarketServer } from './mcp-market.ts'
import type { DesktopLocale } from './locale.ts'

/** IPC channel names kept private to the desktop application bundle. */
export const DESKTOP_IPC = {
  localeGet: 'dsh-desktop:locale-get',
  pluginsList: 'dsh-desktop:plugins-list',
  pluginsAdd: 'dsh-desktop:plugins-add',
  pluginsRemove: 'dsh-desktop:plugins-remove',
  pluginsUpdate: 'dsh-desktop:plugins-update',
  mcpList: 'dsh-desktop:mcp-list',
  mcpAdd: 'dsh-desktop:mcp-add',
  mcpRemove: 'dsh-desktop:mcp-remove',
  mcpSearch: 'dsh-desktop:mcp-search',
  accountSummary: 'dsh-desktop:account-summary',
  updatesCheck: 'dsh-desktop:updates-check',
  updatesInstall: 'dsh-desktop:updates-install',
  updatesState: 'dsh-desktop:updates-state',
} as const

/** Desktop release update state rendered by desktop-owned UI. */
export interface DesktopUpdateState {
  readonly phase: 'idle' | 'checking' | 'available' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly message?: string
}

/** One official DeepSeek balance bucket shown without exposing the API key. */
export interface DesktopAccountBalance {
  readonly currency: string
  readonly total: string
  readonly granted: string
  readonly toppedUp: string
}

/** Key-free account and retained-session token totals for the desktop dashboard. */
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

/** Narrow bridge exposed through context isolation. */
export interface DshDesktopApi {
  readonly protocolVersion: 1
  locale(): Promise<DesktopLocale>
  readonly plugins: {
    list(): Promise<readonly DesktopPluginRecord[]>
    add(spec: string): Promise<void>
    remove(name: string): Promise<void>
    update(name: string, version: string): Promise<void>
  }
  readonly mcp: {
    list(): Promise<readonly DesktopMcpRecord[]>
    search(query: string): Promise<readonly DesktopMcpMarketServer[]>
    add(request: DesktopMcpAddRequest): Promise<void>
    remove(id: string): Promise<void>
  }
  readonly account: {
    summary(): Promise<DesktopAccountSummary>
  }
  readonly updates: {
    check(): Promise<DesktopUpdateState>
    install(): Promise<void>
    subscribe(listener: (state: DesktopUpdateState) => void): () => void
  }
}

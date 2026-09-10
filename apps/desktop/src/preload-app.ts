/** Narrow desktop bridge for the primary application renderer. */

import { contextBridge, ipcRenderer } from 'electron'
import { DESKTOP_IPC, type DesktopAccountSummary, type DshDesktopApi } from './ipc.ts'

const api = {
  protocolVersion: 1 as const,
  mcp: {
    list: () => ipcRenderer.invoke(DESKTOP_IPC.mcpList) as Promise<ReturnType<DshDesktopApi['mcp']['list']> extends Promise<infer T> ? T : never>,
    search: (query: string) => ipcRenderer.invoke(DESKTOP_IPC.mcpSearch, query) as Promise<ReturnType<DshDesktopApi['mcp']['search']> extends Promise<infer T> ? T : never>,
    add: (request: Parameters<DshDesktopApi['mcp']['add']>[0]) => ipcRenderer.invoke(DESKTOP_IPC.mcpAdd, request) as Promise<void>,
    remove: (id: string) => ipcRenderer.invoke(DESKTOP_IPC.mcpRemove, id) as Promise<void>,
  },
  account: {
    summary: () => ipcRenderer.invoke(DESKTOP_IPC.accountSummary) as Promise<DesktopAccountSummary>,
  },
}

contextBridge.exposeInMainWorld('dshDesktop', api)

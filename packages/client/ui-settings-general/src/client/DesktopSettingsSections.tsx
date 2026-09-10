/** Desktop-only Settings pages: MCP connections, account totals, and computer control. */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DesktopAccountSummary, DesktopMcpMarketServer, DesktopMcpRecord, DesktopSettingsBridge } from './desktop-api.ts'
import css from './DesktopSettingsSections.module.css'

/** Injected desktop-native operations owned by the Electron preload bridge. */
export interface DesktopSettingsSectionInjected {
  readonly desktop: DesktopSettingsBridge
}

/** Props shared by every Desktop Settings page. */
export type DesktopSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings'>
  & InjectFace<DesktopSettingsSectionInjected>

type RequestState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly value: T }

const number = (value: number): string => value.toLocaleString()

/** One action button with the common Settings page treatment. */
function ActionButton({ children, onClick, disabled = false, tone = 'primary' }: {
  readonly children: ReactNode
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly tone?: 'primary' | 'danger'
}): ReactNode {
  return (
    <button type="button" className={tone === 'primary' ? css.primaryButton : css.dangerButton} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

/** Render the desktop MCP Registry search and installed connection list. */
export function DesktopMcpMarketplaceSection({ desktop, t }: DesktopSettingsSectionProps): ReactNode {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RequestState<readonly DesktopMcpMarketServer[]>>({ status: 'loading' })
  const [installed, setInstalled] = useState<RequestState<readonly DesktopMcpRecord[]>>({ status: 'loading' })
  const [busy, setBusy] = useState<string | undefined>(undefined)

  const refreshInstalled = useCallback(async () => {
    try {
      setInstalled({ status: 'loading' })
      setInstalled({ status: 'ready', value: await desktop.mcp.list() })
    } catch {
      setInstalled({ status: 'error' })
    }
  }, [desktop])
  const search = useCallback(async (nextQuery: string) => {
    try {
      setResults({ status: 'loading' })
      setResults({ status: 'ready', value: await desktop.mcp.search(nextQuery) })
    } catch {
      setResults({ status: 'error' })
    }
  }, [desktop])

  useEffect(() => {
    void refreshInstalled()
    void search('')
  }, [refreshInstalled, search])

  const add = async (server: DesktopMcpMarketServer): Promise<void> => {
    if (server.url === undefined) return
    setBusy(`add:${server.name}`)
    try {
      await desktop.mcp.add({ name: server.name, url: server.url })
      await refreshInstalled()
    } catch {
      setInstalled({ status: 'error' })
    } finally {
      setBusy(undefined)
    }
  }
  const remove = async (server: DesktopMcpRecord): Promise<void> => {
    setBusy(`remove:${server.id}`)
    try {
      await desktop.mcp.remove(server.id)
      await refreshInstalled()
    } catch {
      setInstalled({ status: 'error' })
    } finally {
      setBusy(undefined)
    }
  }
  const installedNames = new Set(installed.status === 'ready' ? installed.value.map(server => server.name) : [])

  return (
    <section className={css.section}>
      <div className={css.titleRow}>
        <h2>{t('desktop.mcp.title')}</h2>
        <ActionButton onClick={() => { void refreshInstalled() }}>{t('refresh')}</ActionButton>
      </div>
      <form className={css.search} onSubmit={(event) => { event.preventDefault(); void search(query) }}>
        <input value={query} onChange={event => { setQuery(event.target.value) }} placeholder={t('desktop.mcp.placeholder')} aria-label={t('desktop.mcp.placeholder')} />
        <ActionButton onClick={() => { void search(query) }}>{t('search')}</ActionButton>
      </form>
      <h3>{t('desktop.mcp.discover')}</h3>
      {results.status === 'loading' ? <div className={css.empty}>{t('loading')}</div> : null}
      {results.status === 'error' ? <div className={css.empty}>{t('unavailable')}</div> : null}
      {results.status === 'ready' && results.value.length === 0 ? <div className={css.empty}>{t('empty')}</div> : null}
      {results.status === 'ready' && results.value.length > 0 ? (
        <ul className={css.list}>
          {results.value.map(server => (
            <li className={css.card} key={server.name}>
              <strong>{server.name}</strong>
              {server.version === '' ? null : <span className={css.version}>{server.version}</span>}
              {server.url === undefined ? null : installedNames.has(server.name)
                ? <span className={css.installed}>{t('desktop.mcp.installed')}</span>
                : <ActionButton disabled={busy !== undefined} onClick={() => { void add(server) }}>{t('desktop.mcp.add')}</ActionButton>}
            </li>
          ))}
        </ul>
      ) : null}
      <h3>{t('desktop.mcp.connected')}</h3>
      {installed.status === 'loading' ? <div className={css.empty}>{t('loading')}</div> : null}
      {installed.status === 'error' ? <div className={css.empty}>{t('unavailable')}</div> : null}
      {installed.status === 'ready' && installed.value.length === 0 ? <div className={css.empty}>{t('desktop.mcp.none')}</div> : null}
      {installed.status === 'ready' && installed.value.length > 0 ? (
        <ul className={css.list}>
          {installed.value.map(server => (
            <li className={css.card} key={server.id}>
              <strong>{server.name}</strong>
              <ActionButton tone="danger" disabled={busy !== undefined} onClick={() => { void remove(server) }}>{t('desktop.mcp.remove')}</ActionButton>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

/** Render account balance and local token totals from the Desktop host. */
export function DesktopAccountSection({ desktop, t }: DesktopSettingsSectionProps): ReactNode {
  const [summary, setSummary] = useState<RequestState<DesktopAccountSummary>>({ status: 'loading' })
  const refresh = useCallback(async () => {
    try {
      setSummary({ status: 'loading' })
      setSummary({ status: 'ready', value: await desktop.account.summary() })
    } catch {
      setSummary({ status: 'error' })
    }
  }, [desktop])
  useEffect(() => { void refresh() }, [refresh])
  const usage = summary.status === 'ready' ? summary.value.usage : undefined

  return (
    <section className={css.section}>
      <div className={css.titleRow}>
        <h2>{t('desktop.account.title')}</h2>
        <ActionButton onClick={() => { void refresh() }}>{t('refresh')}</ActionButton>
      </div>
      {summary.status === 'loading' ? <div className={css.empty}>{t('loading')}</div> : null}
      {summary.status === 'error' ? <div className={css.empty}>{t('unavailable')}</div> : null}
      {summary.status === 'ready' ? (
        <>
          <h3>{t('desktop.account.balance')}</h3>
          <div className={css.metricGrid}>
            {summary.value.balance.length === 0 ? <div className={css.empty}>{t('desktop.account.noBalance')}</div> : summary.value.balance.map(balance => (
              <div className={css.metric} key={balance.currency}>
                <span>{balance.currency}</span>
                <strong>{balance.total}</strong>
              </div>
            ))}
          </div>
          <h3>{t('desktop.account.tokens')}</h3>
          <div className={css.metricGrid}>
            <div className={css.metric}><span>{t('desktop.account.input')}</span><strong>{number(usage?.inputTokens ?? 0)}</strong></div>
            <div className={css.metric}><span>{t('desktop.account.output')}</span><strong>{number(usage?.outputTokens ?? 0)}</strong></div>
            <div className={css.metric}><span>{t('desktop.account.cacheRead')}</span><strong>{number(usage?.cacheReadTokens ?? 0)}</strong></div>
            <div className={css.metric}><span>{t('desktop.account.cacheWrite')}</span><strong>{number(usage?.cacheWriteTokens ?? 0)}</strong></div>
          </div>
        </>
      ) : null}
    </section>
  )
}

/** Render the desktop computer-control capability page. */
export function DesktopComputerControlSection({ t }: DesktopSettingsSectionProps): ReactNode {
  return (
    <section className={css.section}>
      <div className={css.titleRow}><h2>{t('desktop.computer.title')}</h2></div>
      <div className={css.metricGrid}>
        <div className={css.metric}><span>{t('desktop.computer.screen')}</span><strong>{t('desktop.computer.enabled')}</strong></div>
        <div className={css.metric}><span>{t('desktop.computer.mouse')}</span><strong>{t('desktop.computer.enabled')}</strong></div>
        <div className={css.metric}><span>{t('desktop.computer.keyboard')}</span><strong>{t('desktop.computer.enabled')}</strong></div>
        <div className={css.metric}><span>{t('desktop.computer.app')}</span><strong>{t('desktop.computer.enabled')}</strong></div>
      </div>
    </section>
  )
}

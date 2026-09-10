import { useEffect, useMemo, useState } from 'react'
import type { SessionListState, SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ScheduleRecord } from '@deepseek-ai/dsh-schedule/client'
import { IconAlarmClockOutline16, IconSearchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { formatScheduleFrequency, formatScheduleLocalTime, formatScheduleRelative } from './ScheduleCatalogAction.tsx'
import { NS } from './locales.ts'
import css from './ScheduleCenterPanel.module.css'

/** Session-navigation action supplied by the plugin registration. */
export interface ScheduleCenterInjected {
  /** Open the task's owning conversation and return to the conversation panel. */
  openSession(sessionId: SessionId): void
}

/** Full props for the root-scoped Schedule task center. */
export type ScheduleCenterPanelProps =
  & PropsRuntime<'main'>
  & PropsLocale<typeof NS>
  & InjectFace<ScheduleCenterInjected>

type TaskFilter = 'all' | 'scheduled' | 'overdue'
type TaskStatus = Exclude<TaskFilter, 'all'>

interface ScheduleTask {
  readonly key: string
  readonly session: SessionSummary
  readonly record: ScheduleRecord
  readonly status: TaskStatus
}

const EMPTY_RECORDS: readonly ScheduleRecord[] = []
const CLOCK_REFRESH_MS = 60_000

/** Derive current task rows from the already-loaded Session-list projection. */
function scheduleTasks(state: SessionListState, now: number): readonly ScheduleTask[] {
  const rows: ScheduleTask[] = []
  for (const sessionId of state.ids) {
    const session = state.byId[sessionId]
    if (session === undefined || session.origin === 'subagent') continue
    const records = session.projectionValues?.schedule ?? EMPTY_RECORDS
    for (const record of records) {
      rows.push({
        key: `${session.id}:${record.id}`,
        session,
        record,
        status: Date.parse(record.scheduledAt) <= now ? 'overdue' : 'scheduled',
      })
    }
  }
  return rows.sort((left, right) => {
    if (left.status !== right.status) return left.status === 'overdue' ? -1 : 1
    const targetOrder = Date.parse(left.record.scheduledAt) - Date.parse(right.record.scheduledAt)
    if (targetOrder !== 0) return targetOrder
    const sessionOrder = left.session.displayTitle.localeCompare(right.session.displayTitle)
    return sessionOrder !== 0 ? sessionOrder : left.key.localeCompare(right.key)
  })
}

/**
 * Render the root-scoped read-only summary of every loaded main-session reminder.
 * @param props - current session-list hook, localized copy, and session-navigation action.
 * @returns the task-center panel.
 */
export function ScheduleCenterPanel({ useSessions, openSession, t }: ScheduleCenterPanelProps) {
  const sessions = useSessions(state => state)
  const [now, setNow] = useState(() => Date.now())
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()) }, CLOCK_REFRESH_MS)
    return () => { window.clearInterval(timer) }
  }, [])

  const rows = useMemo(() => scheduleTasks(sessions, now), [sessions, now])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleRows = rows.filter((task) => {
    if (filter !== 'all' && task.status !== filter) return false
    if (normalizedQuery === '') return true
    return task.record.prompt.toLocaleLowerCase().includes(normalizedQuery)
      || task.session.displayTitle.toLocaleLowerCase().includes(normalizedQuery)
  })
  const locale = document.documentElement.lang || undefined
  const filters: readonly TaskFilter[] = ['all', 'scheduled', 'overdue']

  return (
    <section className={css.root} aria-label={t('center.nav')}>
      <div className={css.content}>
        <h1 className={css.title}>{t('center.title')}</h1>
        <label className={css.search}>
          <IconSearchOutline16 size={18} />
          <input
            value={query}
            placeholder={t('center.search')}
            aria-label={t('center.search')}
            onChange={(event) => { setQuery(event.target.value) }}
          />
        </label>
        <div className={css.filters} role="tablist" aria-label={t('center.filters.aria')}>
          {filters.map((entry) => {
            const label = t(`center.filter.${entry}`)
            return (
              <button
                key={entry}
                type="button"
                className={filter === entry ? css.filterActive : css.filter}
                role="tab"
                aria-selected={filter === entry}
                onClick={() => { setFilter(entry) }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {visibleRows.length > 0
          ? (
            <ul className={css.list} aria-label={t('center.list.aria')}>
              {visibleRows.map((task) => {
                const overdue = task.status === 'overdue'
                return (
                  <li key={task.key}>
                    <button
                      type="button"
                      className={overdue ? `${css.task} ${css.taskOverdue}` : css.task}
                      aria-label={t('center.task.aria', { prompt: task.record.prompt })}
                      onClick={() => { openSession(task.session.id) }}
                    >
                      <span className={css.taskHeading}>
                        <IconAlarmClockOutline16 size={16} />
                        <span className={css.prompt}>{task.record.prompt}</span>
                      </span>
                      <span className={css.metadata}>
                        <span className={overdue ? `${css.status} ${css.statusOverdue}` : css.status}>
                          <span className={css.statusDot} aria-hidden="true" />
                          {t(`status.${task.status}`)}
                        </span>
                        <span>{formatScheduleFrequency(task.record, t)}</span>
                        <span>{formatScheduleLocalTime(task.record.scheduledAt, locale)}</span>
                        <span className={overdue ? css.relativeOverdue : undefined}>
                          {formatScheduleRelative(task.record.scheduledAt, now, t)}
                        </span>
                        <span className={css.sessionTitle}>{task.session.displayTitle}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )
          : <p className={css.empty}>{t(rows.length === 0 ? 'center.empty.all' : 'center.empty.filtered')}</p>}
      </div>
    </section>
  )
}

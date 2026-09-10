// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionListState, SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ScheduleRecord } from '@deepseek-ai/dsh-schedule/client'
import { ScheduleId } from '@deepseek-ai/dsh-schedule'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import {
  ScheduleCenterPanel, type ScheduleCenterPanelProps,
} from '../src/client/ScheduleCenterPanel.tsx'
import { en } from '../src/client/locales.ts'

const START = Date.parse('2026-08-25T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
  document.documentElement.lang = 'en'
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const sid = (id: string) => id as SessionId

function record(
  id: string,
  scheduledAt: number,
  options: { prompt?: string; kind?: ScheduleRecord['kind']; everySeconds?: number } = {},
): ScheduleRecord {
  const kind = options.kind ?? 'at'
  const common = {
    id: ScheduleId(id),
    kind,
    prompt: options.prompt ?? id,
    scheduledAt: new Date(scheduledAt).toISOString(),
  }
  if (kind === 'after') return { ...common, kind, afterSeconds: 60 }
  if (kind === 'every') return { ...common, kind, everySeconds: options.everySeconds ?? 300 }
  return { ...common, kind }
}

function summary(
  id: string,
  title: string,
  records: readonly ScheduleRecord[] = [],
  overrides: Partial<SessionSummary> = {},
): SessionSummary {
  return {
    id: sid(id), displayTitle: title, running: false, blank: false, updatedAt: START,
    projectionValues: { schedule: records }, ...overrides,
  }
}

function sessionState(items: readonly SessionSummary[], ids = items.map(item => item.id)): SessionListState {
  return {
    ids: [...ids],
    byId: Object.fromEntries(items.map(item => [item.id, item])),
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function props(state: SessionListState, openSession = vi.fn()): ScheduleCenterPanelProps {
  const useSessions = <T,>(select: (value: SessionListState) => T): T => select(state)
  return {
    useSessions,
    openSession,
    t: makeTranslate(en),
  } as unknown as ScheduleCenterPanelProps
}

describe('ScheduleCenterPanel', () => {
  it('shows main-session reminders in due order and opens their owning conversation', () => {
    const openSession = vi.fn()
    const overdue = summary('alpha', 'Alpha project', [record('due', START - 60_000, { prompt: 'Review invoice' })])
    const future = summary('beta', 'Beta project', [record('later', START + 300_000, {
      prompt: 'Check deployment', kind: 'every', everySeconds: 300,
    })])
    const hidden = summary('child', 'Child agent', [record('hidden', START + 1_000)], { origin: 'subagent' })
    render(<ScheduleCenterPanel {...props(sessionState([overdue, future, hidden], [sid('missing'), overdue.id, future.id, hidden.id]), openSession)} />)

    expect(screen.getByRole('heading', { name: 'Scheduled tasks' })).toBeDefined()
    const rows = within(screen.getByRole('list', { name: 'Scheduled task list' })).getAllByRole('listitem')
    expect(rows.map(row => row.textContent ?? '')).toEqual([
      expect.stringContaining('Review invoice'),
      expect.stringContaining('Check deployment'),
    ])
    expect(rows[0]?.textContent).toContain('Overdue')
    expect(rows[1]?.textContent).toContain('Scheduled')
    expect(rows[1]?.textContent).toContain('Every 5 minutes')
    expect(screen.queryByText('Child agent')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open the conversation for task: Check deployment' }))
    expect(openSession).toHaveBeenCalledWith(future.id)
  })

  it('filters by task status and text, then keeps overdue presentation current with the local clock', () => {
    const future = summary('beta', 'Beta project', [record('later', START + 30_000, { prompt: 'Check deployment' })])
    const overdue = summary('alpha', 'Alpha project', [record('due', START - 30_000, { prompt: 'Review invoice' })])
    render(<ScheduleCenterPanel {...props(sessionState([future, overdue]))} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Scheduled' }))
    expect(screen.queryByText('Review invoice')).toBeNull()
    expect(screen.getByText('Check deployment')).toBeDefined()

    fireEvent.change(screen.getByRole('textbox', { name: 'Search scheduled tasks' }), { target: { value: 'invoice' } })
    expect(screen.getByText('No scheduled tasks match')).toBeDefined()

    fireEvent.click(screen.getByRole('tab', { name: 'All' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search scheduled tasks' }), { target: { value: 'beta' } })
    expect(screen.getByText('Check deployment')).toBeDefined()

    fireEvent.change(screen.getByRole('textbox', { name: 'Search scheduled tasks' }), { target: { value: '' } })
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(screen.getAllByText('Overdue', { exact: true })).toHaveLength(2)
  })

  it('renders the empty state when no loaded main Session has a pending reminder', () => {
    const plain = summary('plain', 'Plain project')
    const child = summary('child', 'Child agent', [record('hidden', START + 1_000)], { origin: 'subagent' })
    render(<ScheduleCenterPanel {...props(sessionState([plain, child]))} />)
    expect(screen.getByText('No scheduled tasks')).toBeDefined()
    expect(screen.queryByRole('list', { name: 'Scheduled task list' })).toBeNull()
  })
})

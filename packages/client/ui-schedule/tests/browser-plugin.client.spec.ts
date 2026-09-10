// @vitest-environment jsdom
import { createElement, type ComponentType } from 'react'
import { cleanup, render } from '@testing-library/react'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'
import { apply as applyLocale, inject as localeInject } from '@deepseek-ai/dsh-client-locale/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { apply, inject } from '../src/client/index.ts'
import { apply as applyNode } from '../src/index.ts'
import type { ScheduleCenterInjected } from '../src/client/ScheduleCenterPanel.tsx'
import { en, NS, zh } from '../src/client/locales.ts'

const Empty = () => null

afterEach(() => { cleanup() })

function headerEntryIds(ctx: Context): (string | undefined)[] {
  return ctx.slots
    .entries('conversation.session.header.actions')
    .map(entry => entry.options.id)
}

async function baseContext(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('connection', { api: { settings: {} }, isLoopback: false } as never)
  ctx.provide('remote', { $on: () => () => {} } as never)
  ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
  ctx.provide('sessions', { open: vi.fn() } as unknown as ISessions)
  ctx.provide('layout', { selectPanel: vi.fn() } as unknown as ILayout)
  await ctx.plugin({ inject: localeInject, apply: applyLocale }).await()
  return ctx
}

function declareSurfaces(ctx: Context): () => void {
  const root = ctx.slots.register({
    name: 'root',
    children: {
      'main': { kind: 'keyed', scope: 'root' },
      'sidebar': { kind: 'single', scope: 'root' },
      'conversation.session.header.actions': { kind: 'list', scope: 'session' },
    },
  } as never, Empty)
  const sidebar = ctx.slots.register({
    name: 'sidebar',
    children: {
      'sidebar.panellist': { kind: 'list', scope: 'root' },
    },
  } as never, Empty)
  return () => { sidebar(); root() }
}

describe('ui-schedule browser half', () => {
  it('declares only the services used by registration', () => {
    expect(inject).toEqual(['slots', 'locale', 'sessions', 'layout'])
  })

  it('waits for the shell, registers the task center and catalog, and tears down', async () => {
    const ctx = await baseContext()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(headerEntryIds(ctx)).toEqual([])

    const surfaces = declareSurfaces(ctx)
    ctx.slots.register({
      name: 'conversation.session.header.actions', id: 'agent-preset', order: -10,
    }, Empty)
    ctx.slots.register({
      name: 'conversation.session.header.actions', id: 'job-list', order: 20,
    }, Empty)
    expect(headerEntryIds(ctx)).toEqual(['agent-preset', 'schedule-catalog', 'job-list'])
    const center = ctx.slots.entries('main').find(entry => entry.options.key === 'schedule-center')
    const sidebar = ctx.slots.entries('sidebar.panellist').find(entry => entry.options.id === 'schedule-center')
    expect(center).toBeDefined()
    expect(sidebar).toBeDefined()

    const injected = center?.inject?.() as unknown as ScheduleCenterInjected
    const sessions = ctx.get('sessions') as ISessions
    const layout = ctx.get('layout') as ILayout
    const sessionId = 'task-session' as never
    injected.openSession(sessionId)
    expect(sessions.open).toHaveBeenCalledWith(sessionId)
    expect(layout.selectPanel).toHaveBeenCalledWith(null)

    const Icon = sidebar?.component as ComponentType<PropsRuntime<'sidebar.panellist'>>
    const view = render(createElement(Icon, { size: 16, active: false } as PropsRuntime<'sidebar.panellist'>))
    expect(view.container.querySelector('svg')).not.toBeNull()

    await fiber.dispose()
    expect(headerEntryIds(ctx)).toEqual(['agent-preset', 'job-list'])
    expect(ctx.slots.entries('main')).toEqual([])
    expect(ctx.slots.entries('sidebar.panellist')).toEqual([])
    surfaces()
    await ctx.fiber.dispose()
  })

  it('registers both dictionaries and releases them with its fiber', async () => {
    const ctx = await baseContext()
    const surfaces = declareSurfaces(ctx)
    ctx.locale.setLocale('zh')
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const translate = ctx.locale.bind(NS)
    expect(translate('list.aria')).toBe(zh['list.aria'])
    ctx.locale.setLocale('en')
    expect(translate('list.aria')).toBe(en['list.aria'])
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())

    await fiber.dispose()
    expect(translate('list.aria')).not.toBe(en['list.aria'])
    surfaces()
    await ctx.fiber.dispose()
  })
})

describe('ui-schedule node half', () => {
  it('keeps the node half inert', () => {
    expect(applyNode).not.toThrow()
  })
})

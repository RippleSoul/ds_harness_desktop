/** Browser half of the read-only Schedule catalog. */

import { createElement } from 'react'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ILayout, MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-schedule/client'
import { IconAlarmClockOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { ScheduleCatalogAction } from './ScheduleCatalogAction.tsx'
import { ScheduleCenterPanel, type ScheduleCenterInjected } from './ScheduleCenterPanel.tsx'
import { en, NS, zh, type ScheduleCatalogKey } from './locales.ts'

const SCHEDULE_CENTER = 'schedule-center' as MainPanelId

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Read-only active Schedule catalog copy. */
    'schedule.catalog': ScheduleCatalogKey
  }
}

/** Required services for Schedule registration and root-panel navigation. */
export const inject = ['slots', 'locale', 'sessions', 'layout']

/** Sidebar glyph for the root-scoped Schedule task center. */
function ScheduleCenterIcon({ size }: PropsRuntime<'sidebar.panellist'>) {
  return createElement(IconAlarmClockOutline16, { size })
}

/** Register the dictionaries and Session-header catalog action. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-schedule: dictionaries')
  const layout: ILayout = ctx.layout
  const injectCenter = (): ScheduleCenterInjected => ({
    openSession: (sessionId) => {
      ctx.sessions.open(sessionId)
      layout.selectPanel(null)
    },
  })
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: SCHEDULE_CENTER,
    locale: NS,
    inject: injectCenter,
  }, ScheduleCenterPanel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: SCHEDULE_CENTER,
    order: 10,
    label: () => ctx.locale.bind(NS)('center.nav'),
    locale: NS,
  }, ScheduleCenterIcon))
  ctx.slots.inject(
    'conversation.session.header.actions',
    () => ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'schedule-catalog',
      // Static Session identity precedes this entry; background jobs follow it.
      order: 10,
      locale: NS,
    }, ScheduleCatalogAction),
  )
}

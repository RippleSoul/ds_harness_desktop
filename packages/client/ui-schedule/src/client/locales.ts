/** `schedule.catalog` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'schedule.catalog'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'trigger.one': '{count} 个提醒',
  'trigger.other': '{count} 个提醒',
  'list.aria': '活动提醒',
  'status.scheduled': '等待中',
  'status.overdue': '已逾期',
  'frequency.once': '单次',
  'frequency.every': '{value}{unit}一次',
  'unit.day.one': '天',
  'unit.day.other': '天',
  'unit.hour.one': '小时',
  'unit.hour.other': '小时',
  'unit.minute.one': '分钟',
  'unit.minute.other': '分钟',
  'unit.second.one': '秒',
  'unit.second.other': '秒',
  'relative.now': '现在到期',
  'relative.future': '{value}{unit}后',
  'relative.overdue': '已逾期 {value}{unit}',
  'center.nav': '定时任务',
  'center.title': '定时任务',
  'center.search': '搜索定时任务',
  'center.filters.aria': '任务状态',
  'center.filter.all': '全部',
  'center.filter.scheduled': '等待中',
  'center.filter.overdue': '已逾期',
  'center.list.aria': '定时任务列表',
  'center.task.aria': '打开任务所属会话：{prompt}',
  'center.empty.all': '暂无定时任务',
  'center.empty.filtered': '没有符合条件的定时任务',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<ScheduleCatalogKey, string> = {
  'trigger.one': '{count} reminder',
  'trigger.other': '{count} reminders',
  'list.aria': 'Active reminders',
  'status.scheduled': 'Scheduled',
  'status.overdue': 'Overdue',
  'frequency.once': 'Once',
  'frequency.every': 'Every {value} {unit}',
  'unit.day.one': 'day',
  'unit.day.other': 'days',
  'unit.hour.one': 'hour',
  'unit.hour.other': 'hours',
  'unit.minute.one': 'minute',
  'unit.minute.other': 'minutes',
  'unit.second.one': 'second',
  'unit.second.other': 'seconds',
  'relative.now': 'Due now',
  'relative.future': 'in {value} {unit}',
  'relative.overdue': '{value} {unit} overdue',
  'center.nav': 'Scheduled tasks',
  'center.title': 'Scheduled tasks',
  'center.search': 'Search scheduled tasks',
  'center.filters.aria': 'Task status',
  'center.filter.all': 'All',
  'center.filter.scheduled': 'Scheduled',
  'center.filter.overdue': 'Overdue',
  'center.list.aria': 'Scheduled task list',
  'center.task.aria': 'Open the conversation for task: {prompt}',
  'center.empty.all': 'No scheduled tasks',
  'center.empty.filtered': 'No scheduled tasks match',
}

/** Key domain of the Schedule catalog namespace. */
export type ScheduleCatalogKey = keyof typeof zh

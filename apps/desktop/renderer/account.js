const api = window.dshDesktop

async function main() {
  const locale = await api.locale()
  const messages = locale.messages
  const message = (key, values = {}) => messages[key].replaceAll(/\{([^{}]+)\}/gu, (placeholder, name) => values[name] ?? placeholder)
  document.documentElement.lang = locale.id
  document.querySelector('#page-title').textContent = messages.accountTitle
  document.querySelector('#title').textContent = messages.accountTitle
  document.querySelector('#description').textContent = messages.accountDescription
  document.querySelector('#refresh').textContent = messages.accountRefresh
  document.querySelector('#balance-heading').textContent = messages.accountBalance
  document.querySelector('#balance-empty').textContent = messages.accountNoBalance
  document.querySelector('#usage-heading').textContent = messages.accountUsage

  const refresh = document.querySelector('#refresh')
  const status = document.querySelector('#status')
  const balance = document.querySelector('#balance')
  const balanceEmpty = document.querySelector('#balance-empty')
  const usage = document.querySelector('#usage')
  const usageNote = document.querySelector('#usage-note')

  const number = value => new Intl.NumberFormat(locale.id).format(value)

  function usageItem(label, value) {
    const item = document.createElement('li')
    const name = document.createElement('h3')
    name.className = 'name'
    name.textContent = label
    const amount = document.createElement('p')
    amount.className = 'summary'
    amount.textContent = number(value)
    item.append(name, amount)
    return item
  }

  async function load() {
    refresh.disabled = true
    status.textContent = messages.accountLoading
    try {
      const summary = await api.account.summary()
      balance.replaceChildren(...summary.balance.map(entry => {
        const item = document.createElement('li')
        const currency = document.createElement('h3')
        currency.className = 'name'
        currency.textContent = entry.currency
        const total = document.createElement('p')
        total.className = 'summary'
        total.textContent = `${messages.accountTotal}: ${entry.total}`
        const granted = document.createElement('p')
        granted.className = 'metadata'
        granted.textContent = `${messages.accountGranted}: ${entry.granted}`
        const toppedUp = document.createElement('p')
        toppedUp.className = 'metadata'
        toppedUp.textContent = `${messages.accountToppedUp}: ${entry.toppedUp}`
        item.append(currency, total, granted, toppedUp)
        return item
      }))
      balanceEmpty.hidden = summary.balance.length !== 0
      usage.replaceChildren(
        usageItem(messages.accountSessions, summary.usage.sessions),
        usageItem(messages.accountInputTokens, summary.usage.inputTokens),
        usageItem(messages.accountOutputTokens, summary.usage.outputTokens),
        usageItem(messages.accountCacheReadTokens, summary.usage.cacheReadTokens),
        usageItem(messages.accountCacheWriteTokens, summary.usage.cacheWriteTokens),
      )
      usageNote.hidden = !summary.usage.truncated
      if (summary.usage.truncated) {
        usageNote.textContent = message('accountUsageTruncated', {
          scanned: number(summary.usage.scannedSessions),
          total: number(summary.usage.sessions),
        })
      }
      status.textContent = ''
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      refresh.disabled = false
    }
  }

  refresh.addEventListener('click', () => void load())
  await load()
}

void main()

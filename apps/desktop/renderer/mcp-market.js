const api = window.dshDesktop

async function main() {
  const locale = await api.locale()
  const messages = locale.messages
  const message = (key, values = {}) => messages[key].replaceAll(/\{([^{}]+)\}/gu, (placeholder, name) => values[name] ?? placeholder)
  document.documentElement.lang = locale.id
  document.querySelector('#page-title').textContent = messages.mcpMarketTitle
  document.querySelector('#title').textContent = messages.mcpMarketTitle
  document.querySelector('#description').textContent = messages.mcpMarketDescription
  document.querySelector('#refresh').textContent = messages.refresh
  document.querySelector('#search-label').textContent = messages.mcpSearchLabel
  document.querySelector('#search').placeholder = messages.mcpSearchPlaceholder
  document.querySelector('#search-button').textContent = messages.search
  document.querySelector('#results-heading').textContent = messages.mcpDiscover
  document.querySelector('#empty').textContent = messages.mcpEmpty
  document.querySelector('#installed-heading').textContent = messages.mcpInstalled
  document.querySelector('#installed-empty').textContent = messages.mcpInstalledEmpty

  const search = document.querySelector('#search')
  const results = document.querySelector('#results')
  const empty = document.querySelector('#empty')
  const installed = document.querySelector('#installed')
  const installedEmpty = document.querySelector('#installed-empty')
  const status = document.querySelector('#status')
  let query = ''

  function setBusy(busy, text = '') {
    for (const control of document.querySelectorAll('button, input')) control.disabled = busy
    status.textContent = text
  }

  async function renderInstalled() {
    const servers = await api.mcp.list()
    installed.replaceChildren(...servers.map(server => {
      const item = document.createElement('li')
      const name = document.createElement('strong')
      name.className = 'name'
      name.textContent = server.name
      const endpoint = document.createElement('p')
      endpoint.className = 'metadata'
      endpoint.textContent = server.url
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'secondary'
      remove.textContent = messages.remove
      remove.addEventListener('click', () => void run(
        () => api.mcp.remove(server.id),
        message('mcpRemoving', { name: server.name }),
      ))
      const row = document.createElement('div')
      row.className = 'installed-row'
      row.append(name, remove)
      item.append(row, endpoint)
      return item
    }))
    installedEmpty.hidden = servers.length !== 0
  }

  function marketCard(server) {
    const item = document.createElement('li')
    const name = document.createElement('h3')
    name.className = 'name'
    name.textContent = server.name
    const description = document.createElement('p')
    description.className = 'summary'
    description.textContent = server.description || messages.mcpNoDescription
    const metadata = document.createElement('p')
    metadata.className = 'metadata'
    metadata.textContent = [server.version, server.url ? messages.mcpOneClick : messages.mcpSetupRequired].filter(Boolean).join(' · ')
    const source = document.createElement('p')
    source.className = 'metadata'
    source.textContent = server.repositoryUrl || messages.mcpRegistryOnly
    const add = document.createElement('button')
    add.type = 'button'
    add.textContent = messages.mcpAdd
    add.disabled = !server.url
    add.title = server.url ? '' : messages.mcpSetupRequired
    add.addEventListener('click', () => void run(
      () => api.mcp.add(server),
      message('mcpAdding', { name: server.name }),
    ))
    item.append(name, description, metadata, source, add)
    return item
  }

  async function renderResults() {
    const servers = await api.mcp.search(query)
    results.replaceChildren(...servers.map(marketCard))
    empty.hidden = servers.length !== 0
  }

  async function run(operation, text) {
    setBusy(true, text)
    try {
      await operation()
      await renderInstalled()
      status.textContent = messages.operationComplete
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      setBusy(false, status.textContent)
    }
  }

  async function load(text, complete) {
    setBusy(true, text)
    try {
      await Promise.all([renderResults(), renderInstalled()])
      status.textContent = complete
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      setBusy(false, status.textContent)
    }
  }

  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault()
    query = search.value.trim()
    void load(messages.mcpSearching, '')
  })
  document.querySelector('#refresh').addEventListener('click', () => void load(messages.mcpRefreshing, messages.mcpRefreshed))
  await load(messages.mcpLoading, '')
}

void main()

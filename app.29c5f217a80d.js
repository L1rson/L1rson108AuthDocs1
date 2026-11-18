const search = document.getElementById('doc-search')
const sections = [...document.querySelectorAll('.doc-section.searchable')]
const navLinks = [...document.querySelectorAll('.nav a')]
const noResults = document.getElementById('no-results')
const sidebar = document.getElementById('sidebar')
const menuButton = document.getElementById('menu-button')
const menuScrim = document.getElementById('menu-scrim')
const searchFeedback = document.getElementById('search-feedback')
const progress = document.getElementById('reading-progress')
const backTop = document.getElementById('back-top')
const currentIndex = document.getElementById('current-index')
const totalIndex = document.getElementById('total-index')
const currentSectionTitle = document.getElementById('current-section-title')
const previousLink = document.getElementById('rail-previous')
const nextLink = document.getElementById('rail-next')
const railMeter = document.getElementById('rail-meter-fill')
const totalCount = sections.length
let activeId = ''
let scrollPending = false

const groups = [
  ['overview', 'Foundations'],
  ['tee', 'Hardware security'],
  ['nonce', 'Platform attestation'],
  ['server-validation', 'Security policy'],
  ['auth-architecture', 'Server engineering'],
  ['references', 'Source material']
]

sections.forEach((section, index) => {
  const order = String(index + 1).padStart(2, '0')
  section.dataset.order = order
  const group = [...groups].reverse().find(([id]) => sections.findIndex(item => item.id === id) <= index)
  section.dataset.category = group ? group[1] : 'Documentation'
})

navLinks.forEach((link, index) => {
  link.dataset.order = String(index + 1).padStart(2, '0')
  link.addEventListener('click', () => closeMenu())
  const group = groups.find(([id]) => link.getAttribute('href') === `#${id}`)
  if (group) {
    const heading = document.createElement('p')
    heading.className = 'nav-group'
    heading.textContent = group[1]
    link.before(heading)
  }
})

document.getElementById('section-count').textContent = String(totalCount).padStart(2, '0')
totalIndex.textContent = String(totalCount).padStart(2, '0')
search.setAttribute('aria-keyshortcuts', '/ Control+k Meta+k')

const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const visibleSections = () => sections.filter(section => !section.classList.contains('filtered-out'))

function closeMenu(restoreFocus = false) {
  const wasOpen = sidebar.classList.contains('open')
  sidebar.classList.remove('open')
  document.body.classList.remove('menu-open')
  menuButton.setAttribute('aria-expanded', 'false')
  menuButton.setAttribute('aria-label', 'Open contents')
  menuScrim.hidden = true
  if (restoreFocus && wasOpen) menuButton.focus()
}

function openMenu() {
  sidebar.classList.add('open')
  document.body.classList.add('menu-open')
  menuButton.setAttribute('aria-expanded', 'true')
  menuButton.setAttribute('aria-label', 'Close contents')
  menuScrim.hidden = false
  search.focus()
}

menuButton.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) closeMenu(true)
  else openMenu()
})
menuScrim.addEventListener('click', () => closeMenu(true))
window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeMenu()
  requestScrollUpdate()
})

function filterSections() {
  const query = normalize(search.value.trim())
  const tokens = query.split(/\s+/).filter(Boolean)
  let visible = 0

  sections.forEach((section, index) => {
    const text = normalize(section.textContent)
    const matches = !tokens.length || tokens.every(token => text.includes(token))
    section.classList.toggle('filtered-out', !matches)
    navLinks[index].classList.toggle('filtered-link', !matches)
    if (matches) visible += 1
  })

  noResults.hidden = visible !== 0
  searchFeedback.textContent = query ? `${visible} ${visible === 1 ? 'section' : 'sections'} matching your search` : 'Browse the complete field guide'

  document.querySelectorAll('.nav-group').forEach(group => {
    let next = group.nextElementSibling
    let groupVisible = false
    while (next && !next.classList.contains('nav-group')) {
      if (next.matches('a:not(.filtered-link)')) groupVisible = true
      next = next.nextElementSibling
    }
    group.hidden = !groupVisible
  })

  if (query && visible) {
    activeId = ''
    visibleSections()[0].scrollIntoView({ behavior: 'auto', block: 'start' })
  }
  requestScrollUpdate()
}

search.addEventListener('input', filterSections)
search.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const first = visibleSections()[0]
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (window.innerWidth <= 980) closeMenu()
      else search.blur()
    }
  }
})

document.addEventListener('keydown', event => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable
  if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !typing && !event.altKey && !event.ctrlKey && !event.metaKey)) {
    event.preventDefault()
    if (window.innerWidth <= 980) openMenu()
    else search.focus()
    search.select()
  }
  if (event.key === 'Escape') {
    if (sidebar.classList.contains('open')) closeMenu(true)
    else if (document.activeElement === search) {
      if (search.value) {
        search.value = ''
        filterSections()
      } else search.blur()
    }
  }
})

function updateActiveSection() {
  const matches = visibleSections()
  if (!matches.length) return
  let active = matches[0]
  const position = Math.min(200, window.innerHeight * .35)
  for (const section of matches) {
    if (section.getBoundingClientRect().top <= position) active = section
    else break
  }
  if (activeId === active.id) return
  activeId = active.id
  const index = sections.indexOf(active)
  navLinks.forEach(link => {
    const selected = link.getAttribute('href') === `#${activeId}`
    link.classList.toggle('active', selected)
    if (selected) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  })
  currentIndex.textContent = String(index + 1).padStart(2, '0')
  currentSectionTitle.textContent = active.querySelector('h1, h2').textContent
  railMeter.style.width = `${Math.round((index + 1) / totalCount * 100)}%`
  const previous = sections[index - 1]
  const next = sections[index + 1]
  previousLink.href = previous ? `#${previous.id}` : '#overview'
  nextLink.href = next ? `#${next.id}` : '#references'
  previousLink.setAttribute('aria-disabled', String(!previous))
  nextLink.setAttribute('aria-disabled', String(!next))
}

function updateScroll() {
  scrollPending = false
  const root = document.documentElement
  const scrollable = Math.max(1, root.scrollHeight - window.innerHeight)
  const ratio = Math.max(0, Math.min(1, window.scrollY / scrollable))
  progress.style.width = `${ratio * 100}%`
  backTop.classList.toggle('visible', window.scrollY > 700)
  updateActiveSection()
}

function requestScrollUpdate() {
  if (scrollPending) return
  scrollPending = true
  requestAnimationFrame(updateScroll)
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true })
window.addEventListener('hashchange', requestScrollUpdate)
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  const success = document.execCommand('copy')
  area.remove()
  if (!success) throw new Error('Unable to copy')
}

document.querySelectorAll('pre').forEach(block => {
  const code = block.querySelector('code')
  if (!code) return
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'copy-code'
  button.textContent = 'COPY'
  button.setAttribute('aria-label', 'Copy code')
  button.addEventListener('click', async () => {
    try {
      await copyText(code.textContent)
      button.textContent = 'COPIED'
    } catch {
      button.textContent = 'COPY FAILED'
    }
    window.setTimeout(() => { button.textContent = 'COPY' }, 1800)
  })
  block.append(button)
})

requestScrollUpdate()

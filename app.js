const search = document.getElementById('doc-search')
const sections = [...document.querySelectorAll('.searchable')]
const navLinks = [...document.querySelectorAll('.nav a')]
const noResults = document.getElementById('no-results')
const sidebar = document.getElementById('sidebar')
const menuButton = document.getElementById('menu-button')

search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase()
  let visible = 0

  sections.forEach(section => {
    const matches = !query || section.textContent.toLowerCase().includes(query)
    section.classList.toggle('filtered-out', !matches)
    if (matches) visible += 1
  })

  noResults.hidden = visible !== 0
})

menuButton.addEventListener('click', () => {
  sidebar.classList.toggle('open')
})

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open')
  })
})

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    const id = entry.target.id
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`)
    })
  })
}, {
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0
})

sections.forEach(section => observer.observe(section))

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}));

const themeButton = document.querySelector('.theme-toggle');
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light') document.body.classList.add('light');
function updateThemeButton() {
  const light = document.body.classList.contains('light');
  themeButton.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  themeButton.querySelector('.theme-icon').textContent = light ? '☾' : '☼';
}
updateThemeButton();
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('portfolio-theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateThemeButton();
});

const projects = [
  { type: 'FINTECH · 2025', title: 'Orbit Finance', description: 'A personal finance dashboard concept that makes budgets, spending trends, and goals feel easy to understand at a glance.', stack: ['React', 'TypeScript', 'Chart.js'], url: 'https://github.com/' },
  { type: 'E-COMMERCE · 2025', title: 'Bloom Studio', description: 'A cheerful storefront concept for plant lovers, with product discovery, care notes, and a streamlined checkout flow.', stack: ['Next.js', 'Tailwind CSS', 'Stripe'], url: 'https://github.com/' }
];
const modal = document.querySelector('.project-modal');
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[Number(button.dataset.project)];
  document.querySelector('#modal-type').textContent = project.type;
  document.querySelector('#modal-title').textContent = project.title;
  document.querySelector('#modal-description').textContent = project.description;
  document.querySelector('#modal-stack').replaceChildren(...project.stack.map(name => {
    const tag = document.createElement('span'); tag.textContent = name; return tag;
  }));
  document.querySelector('#modal-link').href = project.url;
  modal.showModal();
}));
document.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero-scroll');
const philosophy = document.querySelector('.philosophy');
const browser = document.querySelector('#app-browser');
const panels = [...document.querySelectorAll('.app-panel')];
const appLinks = document.querySelectorAll('[data-app-link]');
const pickerLinks = document.querySelectorAll('.app-picker a');
const announcement = document.querySelector('#app-announcement');
const viewer = document.querySelector('.screenshot-viewer');
const viewerGallery = viewer.querySelector('.viewer-gallery');
const viewerCount = viewer.querySelector('.viewer-count');
const viewerPrev = viewer.querySelector('.viewer-prev');
const viewerNext = viewer.querySelector('.viewer-next');

function updateViewer() {
  const index = Math.round(viewerGallery.scrollLeft / viewerGallery.clientWidth);
  const total = viewerGallery.children.length;
  viewerCount.textContent = `${index + 1} / ${total}`;
  viewerPrev.setAttribute('aria-disabled', String(index === 0));
  viewerNext.setAttribute('aria-disabled', String(index === total - 1));
}

for (const gallery of document.querySelectorAll('.screenshot-gallery')) {
  for (const [index, image] of [...gallery.querySelectorAll('img')].entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${image.alt}を拡大`);
    image.replaceWith(button);
    button.append(image);
    button.addEventListener('click', () => {
      viewerGallery.replaceChildren(...[...gallery.querySelectorAll('img')].map(original => {
        const copy = original.cloneNode();
        copy.loading = 'eager';
        return copy;
      }));
      viewer.querySelector('#viewer-title').textContent = `${gallery.closest('.app-panel').querySelector('h3').textContent}の画像`;
      viewer.showModal();
      viewerGallery.scrollLeft = index * viewerGallery.clientWidth;
      updateViewer();
    });
  }
}
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewerGallery.addEventListener('scroll', updateViewer, { passive: true });
for (const [button, direction] of [[viewerPrev, -1], [viewerNext, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') !== 'true') viewerGallery.scrollBy({ left: direction * viewerGallery.clientWidth, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  });
}
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') viewerPrev.click();
  if (event.key === 'ArrowRight') viewerNext.click();
});

function selectApp(panel) {
  for (const item of panels) item.hidden = item !== panel;
  for (const link of pickerLinks) {
    if (link.dataset.appLink === panel.dataset.app) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  announcement.textContent = `${panel.querySelector('h3').textContent}の紹介を表示しています。`;
}

// Hashes also work when opening a shared link or using the browser's back button.
function showLinkedApp() {
  const panel = panels.find(item => `#${item.id}` === location.hash);
  if (panel) {
    selectApp(panel);
    panel.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}

selectApp(panels[0]);
browser.classList.add('is-enhanced');
for (const link of appLinks) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const panel = panels.find(item => item.dataset.app === link.dataset.appLink);
    selectApp(panel);
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    if (link.classList.contains('hero-icon')) {
      panel.scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
      panel.focus({ preventScroll: true });
    }
  });
}
window.addEventListener('hashchange', showLinkedApp);
if (location.hash) requestAnimationFrame(showLinkedApp);

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: .08 });
for (const element of document.querySelectorAll('[data-reveal]')) revealObserver.observe(element);

const clamp = value => Math.min(1, Math.max(0, value));
let scheduledFrame = 0;
function updateScroll() {
  scheduledFrame = 0;
  const viewport = window.innerHeight;
  const heroBounds = hero.getBoundingClientRect();
  const photoBounds = philosophy.getBoundingClientRect();
  const heroProgress = clamp((header.offsetHeight - heroBounds.top) / heroBounds.height);
  const photoProgress = clamp((viewport - photoBounds.top) / (viewport + photoBounds.height));
  header.classList.toggle('is-scrolled', window.scrollY > 12);
  if (!motionPreference.matches) {
    if (heroBounds.bottom > 0 && heroBounds.top < viewport) hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
    if (photoBounds.top < viewport && photoBounds.bottom > 0) philosophy.style.setProperty('--photo-shift', `${((photoProgress - .5) * 16).toFixed(2)}px`);
  }
}
function scheduleScroll() {
  if (!scheduledFrame) scheduledFrame = requestAnimationFrame(updateScroll);
}
function syncMotionPreference() {
  document.documentElement.classList.toggle('motion-ready', !motionPreference.matches);
  scheduleScroll();
}
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll, { passive: true });
motionPreference.addEventListener('change', syncMotionPreference);
syncMotionPreference();

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const browser = document.querySelector('#app-browser');
const panels = [...document.querySelectorAll('.app-panel')];
const appLinks = document.querySelectorAll('[data-app-link]');
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
  for (const link of appLinks) {
    if (link.dataset.appLink === panel?.dataset.app) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  announcement.textContent = panel ? `${panel.querySelector('h3').textContent}の紹介を表示しています。` : '';
}

function showLinkedApp() {
  const panel = panels.find(item => `#${item.id}` === location.hash);
  selectApp(panel);
  if (panel) panel.scrollIntoView({ behavior: 'instant', block: 'start' });
}

browser.classList.add('is-enhanced');
showLinkedApp();
for (const link of appLinks) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const panel = panels.find(item => item.dataset.app === link.dataset.appLink);
    selectApp(panel);
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
  });
}
window.addEventListener('hashchange', showLinkedApp);

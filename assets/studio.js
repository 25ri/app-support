const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const browser = document.querySelector('#app-browser');
const panels = [...document.querySelectorAll('.app-panel')];
const appLinks = document.querySelectorAll('[data-app-link]');
const details = document.querySelector('#app-details');
const detail = document.querySelector('.detail-dialog');
const sheet = detail.querySelector('.detail-sheet');
const shade = detail.querySelector('.detail-shade');
const detailBody = detail.querySelector('.detail-body');
const detailClose = detail.querySelector('.detail-close');
let opener;
let cardTransform;
let sheetMotion;
let shadeMotion;
let closingDetail = false;
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

function openDetail(panel) {
  closingDetail = false;
  sheetMotion?.cancel();
  shadeMotion?.cancel();
  const previous = detailBody.firstElementChild;
  if (previous) details.append(previous);
  opener?.removeAttribute('aria-current');
  opener = [...appLinks].find(link => link.dataset.appLink === panel.dataset.app);
  opener.setAttribute('aria-current', 'true');

  detailBody.append(panel);
  detail.setAttribute('aria-labelledby', panel.getAttribute('aria-labelledby'));
  if (!detail.open) detail.showModal();
  sheet.scrollTop = 0;
  detailClose.focus({ preventScroll: true });

  const card = opener.getBoundingClientRect();
  const surface = sheet.getBoundingClientRect();
  const x = card.left + (card.width - surface.width) / 2 - surface.left;
  const y = card.top + (card.height - surface.height) / 2 - surface.top;
  cardTransform = `translate(${x}px, ${y}px) scale(${card.width / surface.width}, ${card.height / surface.height})`;

  if (!motionPreference.matches) {
    sheetMotion = sheet.animate(
      [{ transform: cardTransform, opacity: .28 }, { transform: 'none', opacity: 1 }],
      { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    shadeMotion = shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
  }
}

async function closeDetail() {
  if (!detail.open) return;
  closingDetail = true;
  if (viewer.open) viewer.close();

  if (!motionPreference.matches) {
    // Begin at the current frame if the user closes during the opening motion.
    const { transform, opacity } = getComputedStyle(sheet);
    const shadeOpacity = getComputedStyle(shade).opacity;
    sheetMotion?.cancel();
    shadeMotion?.cancel();
    const closing = sheet.animate(
      [{ transform, opacity }, { transform: cardTransform, opacity: 0 }],
      { duration: 230, easing: 'cubic-bezier(.4,0,.65,1)', fill: 'forwards' }
    );
    sheetMotion = closing;
    shadeMotion = shade.animate([{ opacity: shadeOpacity }, { opacity: 0 }], { duration: 230, fill: 'forwards' });
    await closing.finished.catch(() => {});
    if (sheetMotion !== closing) return;
  }

  detail.close();
  sheetMotion?.cancel();
  shadeMotion?.cancel();
  details.append(detailBody.firstElementChild);
  opener.removeAttribute('aria-current');
  opener.focus({ preventScroll: true });
}

function syncDetail() {
  const panel = panels.find(item => `#${item.id}` === location.hash);
  if (panel) openDetail(panel);
  else closeDetail();
}

function requestClose() {
  if (closingDetail) return;
  closingDetail = true;
  if (history.state?.catalogDetail) {
    history.back();
  } else {
    history.replaceState(history.state, '', location.pathname + location.search);
    closeDetail();
  }
}

browser.hidden = true;
syncDetail();
for (const link of appLinks) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState({ catalogDetail: true }, '', link.hash);
    syncDetail();
  });
}
window.addEventListener('hashchange', syncDetail);
detailClose.addEventListener('click', requestClose);
detail.addEventListener('cancel', event => {
  event.preventDefault();
  requestClose();
});
detail.addEventListener('click', event => {
  if (event.target === detail) requestClose();
});

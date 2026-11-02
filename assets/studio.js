const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-app]');
const summary = document.querySelector('#result-summary');

for (const button of filters) {
  button.addEventListener('click', () => {
    for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
    let visibleCount = 0;
    for (const card of cards) {
      const visible = button.dataset.filter === 'all' || card.dataset[button.dataset.filter] === 'true';
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    }
    summary.textContent = `${button.textContent}のアプリを${visibleCount}件表示しています。`;
  });
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 760px)');
const header = document.querySelector('.site-header');
const heroStory = document.querySelector('.hero-scroll');
const hero = document.querySelector('.hero');
const philosophy = document.querySelector('.philosophy');
const featureStage = document.querySelector('.feature-stage');
const featureVisual = document.querySelector('.feature-visual');
const featureSteps = [...document.querySelectorAll('[data-feature]')];
const featureShots = document.querySelectorAll('[data-shot]');
const featureLinks = document.querySelectorAll('[data-feature-link]');
const clamp = value => Math.min(1, Math.max(0, value));

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -36px 0px', threshold: .08 });
for (const element of document.querySelectorAll('[data-reveal]')) revealObserver.observe(element);

let activeFeature = 'buff';
function selectFeature(key) {
  if (activeFeature === key) return;
  activeFeature = key;
  featureVisual.dataset.active = key;
  for (const shot of featureShots) {
    const active = shot.dataset.shot === key;
    shot.classList.toggle('is-active', active);
    shot.setAttribute('aria-hidden', String(!active));
  }
  for (const link of featureLinks) {
    if (link.dataset.featureLink === key) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  for (const step of featureSteps) step.classList.toggle('is-active', step.dataset.feature === key);
}

let scheduledFrame = 0;
function updateScroll() {
  scheduledFrame = 0;
  const viewport = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const heroBounds = heroStory.getBoundingClientRect();
  const photoBounds = philosophy.getBoundingClientRect();
  const featureBounds = featureStage.getBoundingClientRect();
  const featurePositions = featureBounds.top < viewport && featureBounds.bottom > headerHeight
    ? featureSteps.map(step => step.getBoundingClientRect().top)
    : [];
  const heroTravel = heroStory.offsetHeight - hero.offsetHeight;
  const heroProgress = heroTravel > 0 ? clamp((headerHeight - heroBounds.top) / heroTravel) : 0;
  const photoProgress = clamp((viewport - photoBounds.top) / (viewport + photoBounds.height));

  header.classList.toggle('is-scrolled', window.scrollY > 12);
  if (!motionPreference.matches) {
    if (heroBounds.bottom > 0 && heroBounds.top < viewport) heroStory.style.setProperty('--hero-progress', heroProgress.toFixed(4));
    if (photoBounds.top < viewport && photoBounds.bottom > 0) philosophy.style.setProperty('--photo-shift', `${((photoProgress - .5) * 24).toFixed(2)}px`);
  }
  if (featurePositions.length) {
    const readingLine = viewport * (mobileLayout.matches ? .74 : .5);
    let index = 0;
    for (let i = 1; i < featurePositions.length; i += 1) {
      if (featurePositions[i] < readingLine) index = i;
    }
    selectFeature(featureSteps[index].dataset.feature);
  }
}
function scheduleScroll() {
  if (!scheduledFrame) scheduledFrame = window.requestAnimationFrame(updateScroll);
}
function syncMotionPreference() {
  document.documentElement.classList.toggle('motion-ready', !motionPreference.matches);
  scheduleScroll();
}
for (const link of featureLinks) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const step = featureSteps.find(item => item.dataset.feature === link.dataset.featureLink);
    const offset = header.offsetHeight + (mobileLayout.matches ? featureVisual.offsetHeight + 12 : 80);
    window.scrollTo({ top: window.scrollY + step.getBoundingClientRect().top - offset, behavior: motionPreference.matches ? 'auto' : 'smooth' });
  });
}
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll, { passive: true });
motionPreference.addEventListener('change', syncMotionPreference);
syncMotionPreference();

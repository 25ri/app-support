const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-app]');
const summary = document.querySelector('#result-summary');

for (const button of filters) {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    for (const item of filters) {
      item.setAttribute('aria-pressed', String(item === button));
    }
    let visibleCount = 0;
    for (const card of cards) {
      const visible = filter === 'all' || card.dataset[filter] === 'true';
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    }
    summary.textContent = `${button.textContent}のアプリを${visibleCount}件表示しています。`;
  });
}

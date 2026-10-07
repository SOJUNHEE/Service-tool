/* UI-only wiring; CATEGORIES, SERVICES, and the original filter engine are preserved. */
(function () {
  'use strict';
  const search = document.getElementById('search');
  const heroQuery = document.getElementById('heroQuery');
  function searchFromHero(query) {
    // Reset category/price/review state before starting a fresh global search.
    document.getElementById('resetBtn').click();
    search.value = query.trim();
    heroQuery.value = search.value;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('services').scrollIntoView({ block: 'start' });
    search.focus({ preventScroll: true });
  }
  document.getElementById('heroSearch').addEventListener('submit', function (event) {
    event.preventDefault();
    searchFromHero(heroQuery.value);
  });
  document.querySelectorAll('[data-query]').forEach(function (button) {
    button.addEventListener('click', function () { searchFromHero(button.dataset.query); });
  });
  document.querySelectorAll('[data-stat="services"]').forEach(el => { el.textContent = SERVICES.length; });
  document.querySelectorAll('[data-stat="categories"]').forEach(el => { el.textContent = CATEGORIES.length; });
  // These counts update automatically when Claude updates services.js.
  const reviews = document.getElementById('reviewGrid');
  if (!reviews.children.length) {
    const empty = document.createElement('p');
    empty.className = 'sec-lead';
    empty.textContent = '아직 등록된 소감이 없어요. 직접 써 본 소감이 추가되면 이곳에 표시됩니다.';
    reviews.appendChild(empty);
  }
})();

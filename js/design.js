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

  // 하단 배너: 경고 문구로 배너 전체를 가려 두고, 열기/닫기로 보여 줌
  const photo = document.getElementById('closingCta');
  const photoOpen = document.getElementById('photoOpen');
  const photoClose = document.getElementById('photoClose');
  function setPhoto(open) {
    photo.classList.toggle('is-open', open);
    document.getElementById('photoCover').hidden = open;
    photoClose.hidden = !open;
    (open ? photoClose : photoOpen).focus();
  }
  if (photo && photoOpen && photoClose) {
    photoOpen.addEventListener('click', function () { setPhoto(true); });
    photoClose.addEventListener('click', function () { setPhoto(false); });
  }
  const reviews = document.getElementById('reviewGrid');
  if (!reviews.children.length) {
    const empty = document.createElement('p');
    empty.className = 'sec-lead';
    empty.textContent = '아직 등록된 소감이 없어요. 직접 써 본 소감이 추가되면 이곳에 표시됩니다.';
    reviews.appendChild(empty);
  }
})();

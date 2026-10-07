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
  // 열 때는 가림막이 천천히 사라진 뒤 내용이 천천히 나타남 (시간은 css 의 .photo-cover transition 과 맞춤)
  const photo = document.getElementById('closingCta');
  const photoCover = document.getElementById('photoCover');
  const photoOpen = document.getElementById('photoOpen');
  const photoClose = document.getElementById('photoClose');
  const FADE = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600;
  let fadeTimer;
  function setPhoto(open) {
    clearTimeout(fadeTimer);
    photoClose.hidden = !open;
    if (open) {
      photo.classList.add('is-open');
      photoCover.classList.add('is-fading');
      fadeTimer = setTimeout(function () { photoCover.hidden = true; }, FADE);
      photoClose.focus();
    } else {
      photoCover.hidden = false;
      photoCover.offsetWidth;  // 투명한 상태를 한 번 그린 뒤 다시 서서히 덮음
      photoCover.classList.remove('is-fading');
      fadeTimer = setTimeout(function () { photo.classList.remove('is-open'); }, FADE);
      photoOpen.focus();
    }
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

/* =====================================================================
   픽셀캣 AI 서비스 툴 · 동작
   - 분야 탭, 세부 분류, 요금, 검색어, "써본 소감" 필터
   - 조건에 맞는 서비스만 카드로 그리기
   데이터는 js/services.js 의 CATEGORIES, SERVICES 를 사용합니다.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- 화면 요소 ---------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    total: $("totalCount"),
    search: $("search"),
    searchClear: $("searchClear"),
    tabs: $("tabs"),
    scopeTitle: $("scopeTitle"),
    scopeDesc: $("scopeDesc"),
    subRow: $("subRow"),
    subChips: $("subChips"),
    priceChips: $("priceChips"),
    onlyReviewed: $("onlyReviewed"),
    result: $("result"),
    grid: $("grid"),
    empty: $("empty"),
    resetBtn: $("resetBtn"),
    toTop: $("toTop"),
    app: document.querySelector(".app"),
    catCount: $("catCount"),
    moreRow: $("moreRow"),
    moreBtn: $("moreBtn"),
  };

  // 한 번에 보여 줄 카드 수 ("더 보기"를 누르면 이만큼 더 보여 줌)
  const PAGE = 12;
  let shown = PAGE;
  let current = [];   // 지금 조건에 맞는 서비스 목록

  /* ---------- 현재 필터 상태 ---------- */
  const state = {
    cat: "all",       // 분야 id
    sub: "all",       // 세부 분류
    price: "all",     // free | freemium | paid
    reviewed: false,  // 써본 소감이 있는 것만
    query: "",        // 검색어
  };

  const PRICE_LABEL = { free: "무료", freemium: "무료+유료", paid: "유료" };
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  /* ---------- 도우미 함수 ---------- */

  // 글자를 HTML 에 안전하게 넣기
  function esc(text) {
    return String(text).replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  }

  // 검색어와 일치하는 부분을 형광펜으로 표시
  // (원문에서 찾은 뒤 조각마다 escape 해야 &#39; 같은 문자 코드가 깨지지 않음)
  function mark(text) {
    const raw = String(text);
    const words = state.query.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return esc(raw);
    const pattern = words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    // split 에 괄호 그룹을 쓰면 홀수 번째 조각이 일치한 부분
    return raw.split(new RegExp("(" + pattern + ")", "gi"))
      .map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part)))
      .join("");
  }

  // https://www.example.com/path → example.com/path
  function shortUrl(url) {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ""; }
  }

  // 검색 대상 글자를 서비스마다 한 번만 만들어 둠
  SERVICES.forEach((s) => {
    s._text = [
      s.name, s.sub, s.desc, s.pros, s.cons, s.use, s.url,
      catById[s.cat].name, PRICE_LABEL[s.price],
      s.reviews.map((r) => r.text + " " + r.by).join(" "),
    ].join(" ").toLowerCase();
  });

  /* ---------- 필터 ---------- */

  // skip 에 적은 조건 하나는 무시하고 걸러냄 (탭·칩의 개수 계산에 사용)
  function filtered(skip) {
    const words = state.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return SERVICES.filter((s) => {
      if (skip !== "cat" && state.cat !== "all" && s.cat !== state.cat) return false;
      if (skip !== "cat" && skip !== "sub" && state.sub !== "all" && s.sub !== state.sub) return false;
      if (state.price !== "all" && s.price !== state.price) return false;
      if (state.reviewed && !s.reviews.length) return false;
      return words.every((w) => s._text.includes(w));
    });
  }

  /* ---------- 분야 탭 ---------- */

  function renderTabs() {
    const pool = filtered("cat");
    const count = (id) => pool.filter((s) => s.cat === id).length;

    const tabs = [{ id: "all", name: "전체", color: "#FFD23F", n: pool.length }]
      .concat(CATEGORIES.map((c) => ({ id: c.id, name: c.name, color: c.color, n: count(c.id) })));

    el.tabs.innerHTML = tabs.map((t) => `
      <button class="tab${t.id === state.cat ? " is-on" : ""}" type="button"
              data-cat="${t.id}" style="--tab:${t.color}"
              aria-pressed="${t.id === state.cat}">
        ${esc(t.name)}<span class="tab-count">${t.n}</span>
      </button>`).join("");
  }

  /* ---------- 세부 분류 칩 ---------- */

  function renderSubs() {
    if (state.cat === "all") { el.subRow.hidden = true; return; }

    const inCat = SERVICES.filter((s) => s.cat === state.cat);
    const subs = [...new Set(inCat.map((s) => s.sub).filter(Boolean))];

    // 세부 분류가 서비스 수만큼 잘게 나뉜 분야는 칩을 보여 주지 않음
    if (subs.length < 2 || subs.length > inCat.length * 0.6) {
      el.subRow.hidden = true;
      return;
    }

    const pool = filtered("sub");
    const chips = [{ name: "all", label: "전체", n: pool.length }]
      .concat(subs.map((name) => ({ name, label: name, n: pool.filter((s) => s.sub === name).length })));

    el.subChips.innerHTML = chips.map((c) => `
      <button class="chip${c.name === state.sub ? " is-on" : ""}" type="button"
              data-sub="${esc(c.name)}" aria-pressed="${c.name === state.sub}">
        ${esc(c.label)} ${c.n}
      </button>`).join("");
    el.subRow.hidden = false;
  }

  /* ---------- 카드 ---------- */

  const ICON_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  function fact(label, value) {
    if (!value) return "";
    return `<div class="fact"><dt>${label}</dt><dd>${mark(value)}</dd></div>`;
  }

  function cardHtml(s) {
    const cat = catById[s.cat];
    const host = hostOf(s.url);
    const logo = host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : "";

    const badge = s.ended
      ? '<span class="badge badge-ended">지원 종료</span>'
      : `<span class="badge badge-${s.price}">${PRICE_LABEL[s.price]}</span>`;

    const reviews = s.reviews.map((r) => `
      <div class="review">
        <p class="review-text">${mark(r.text)}</p>
        <p class="review-by">직접 써본 소감${r.by ? " · " + mark(r.by) : ""}</p>
      </div>`).join("");

    // 내용이 길면 "자세히 보기" 버튼을 붙임
    const longest = Math.max(s.pros.length, s.cons.length, s.use.length, s.priceNote.length,
      ...s.reviews.map((r) => r.text.length), 0);
    const more = longest > 44 || /\n/.test(s.pros + s.cons + s.use)
      ? '<button class="more" type="button" aria-expanded="false">자세히 보기</button>'
      : "";

    return `
      <article class="card" style="--cat:${cat.color}">
        <div class="card-head">
          <span class="logo" data-initial="${esc(s.name.charAt(0))}">
            ${logo ? `<img src="${logo}" alt="" loading="lazy" width="40" height="40">` : ""}
          </span>
          <div class="card-title">
            <h3 class="card-name">
              <a class="card-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"
                 aria-label="${esc(s.name)} 새 탭에서 열기">${mark(s.name)}</a>
              ${s.featured ? '<span class="star">대표</span>' : ""}
            </h3>
            <p class="card-sub"><span class="cat-name">${esc(cat.name)}</span>${s.sub ? " / " + mark(s.sub) : ""}</p>
          </div>
          ${badge}
        </div>

        <p class="card-desc">${mark(s.desc)}</p>

        <dl class="facts">
          ${fact("장점", s.pros)}
          ${fact("추천 용도", s.use)}
          ${fact("아쉬운 점", s.cons)}
          ${fact("요금 상세", s.priceNote)}
        </dl>

        ${reviews}

        <div class="card-foot">
          <span class="domain">${ICON_OUT}<span>${esc(shortUrl(s.url))}</span></span>
          ${more}
        </div>
      </article>`;
  }

  /* ---------- 전체 다시 그리기 ---------- */

  function render() {
    shown = PAGE;
    const list = filtered();
    current = list;

    renderTabs();
    renderSubs();

    // 선택한 분야 제목과 설명
    el.scopeTitle.style.setProperty("--scope", state.cat === "all" ? "" : catById[state.cat].color);
    if (state.cat === "all") {
      el.scopeTitle.textContent = "전체";
      el.scopeDesc.textContent = `${CATEGORIES.length}개 분야의 서비스를 모두 보여 줍니다.`;
    } else {
      el.scopeTitle.textContent = catById[state.cat].name;
      el.scopeDesc.textContent = catById[state.cat].scope;
    }

    // 요금 칩 / 체크박스 / 검색창 상태 맞추기
    el.priceChips.querySelectorAll(".chip").forEach((chip) => {
      const on = chip.dataset.price === state.price;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on);
    });
    el.onlyReviewed.checked = state.reviewed;
    el.searchClear.hidden = !state.query;

    // 결과 개수
    const scopeTotal = state.cat === "all"
      ? SERVICES.length
      : SERVICES.filter((s) => s.cat === state.cat).length;
    el.result.innerHTML = list.length === scopeTotal
      ? `서비스 <strong>${list.length}</strong>개`
      : `${scopeTotal}개 중 <strong>${list.length}</strong>개`;

    // 카드
    el.grid.innerHTML = list.slice(0, shown).map(cardHtml).join("");
    el.grid.hidden = list.length === 0;
    updateMore();
    el.empty.hidden = list.length !== 0;
  }

  function updateMore() {
    const rest = current.length - shown;
    el.moreRow.hidden = rest <= 0;
    el.moreBtn.textContent = `더 보기 (${Math.min(rest, PAGE)}개 더 · 남은 ${rest}개)`;
  }

  function reset() {
    state.cat = "all";
    state.sub = "all";
    state.price = "all";
    state.reviewed = false;
    state.query = "";
    el.search.value = "";
    render();
  }

  /* ---------- 사용자 동작 연결 ---------- */

  // 분야 탭
  el.tabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    state.cat = tab.dataset.cat;
    state.sub = "all";
    render();
    // 선택한 탭이 보이도록 가로로 이동하고, 목록 맨 위로 올림
    const active = el.tabs.querySelector(".tab.is-on");
    if (active) active.scrollIntoView({ inline: "center", block: "nearest" });
    scrollToList();
  });

  function scrollToList() {
    const top = el.app.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > top) window.scrollTo({ top });
  }

  // 메뉴·히어로·기능 카드의 바로가기 (무료 서비스, 써본 소감)
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-action]");
    if (!link) return;
    reset();
    if (link.dataset.action === "free") state.price = "free";
    if (link.dataset.action === "reviewed") state.reviewed = true;
    render();
  });

  // 세부 분류
  el.subChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.sub = chip.dataset.sub;
    render();
  });

  // 요금
  el.priceChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.price = chip.dataset.price;
    render();
  });

  // 써본 소감만
  el.onlyReviewed.addEventListener("change", () => {
    state.reviewed = el.onlyReviewed.checked;
    render();
  });

  // 검색 (입력이 잠깐 멈추면 반영)
  let timer;
  el.search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = el.search.value;
      render();
    }, 120);
  });

  el.searchClear.addEventListener("click", () => {
    state.query = "";
    el.search.value = "";
    render();
    el.search.focus();
  });

  el.resetBtn.addEventListener("click", reset);

  // 이미 보이는 카드(펼친 상태 포함)는 그대로 두고 다음 묶음만 덧붙임
  el.moreBtn.addEventListener("click", () => {
    el.grid.insertAdjacentHTML("beforeend", current.slice(shown, shown + PAGE).map(cardHtml).join(""));
    shown += PAGE;
    updateMore();
  });

  // 카드 안의 "자세히 보기"
  el.grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".more");
    if (!btn) return;
    const open = btn.closest(".card").classList.toggle("is-open");
    btn.textContent = open ? "접기" : "자세히 보기";
    btn.setAttribute("aria-expanded", open);
  });

  // 로고를 못 불러오면 이름 첫 글자로 대신 표시
  el.grid.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG") return;
    img.remove();
  }, true);

  // 맨 위로 버튼
  window.addEventListener("scroll", () => {
    el.toTop.hidden = window.scrollY < 600;
  }, { passive: true });
  el.toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));

  /* ---------- 시작 ---------- */
  el.total.textContent = SERVICES.length;
  el.catCount.textContent = CATEGORIES.length;
  render();
})();

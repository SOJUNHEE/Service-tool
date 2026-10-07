/* =====================================================================
   픽셀캣 AI · 랜딩 페이지 동작
   - 작업 흐름 단계 (업로드 → 분석 → 리포트 → 완료) 와 대시보드 미리보기 연동
   - 매출 추이 차트 (막대 + 목표선, 마우스를 올리면 값 표시)
   - 요약 지표 숫자 올라가기
   - 고객 후기: js/services.js 의 "직접 써본 소감" 으로 카드 만들기
   대시보드 숫자는 화면 소개용 예시 데이터입니다.
   ===================================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  }

  /* ---------- 작업 흐름 단계 ---------- */

  const dash = $("dash");
  const steps = document.querySelectorAll("#steps .step");
  const navBtns = document.querySelectorAll(".dash-nav button");
  const STATUS = ["업로드 완료", "AI 분석 중", "리포트 생성 중", "분석 완료"];
  const NAV_FOR_STEP = [1, 2, 3, 0];  // 단계별로 켜질 사이드바 메뉴 위치

  let current = 0;
  let autoplay = !calm;
  let timer = null;

  // nav: 켤 사이드바 메뉴 위치 (사이드바를 직접 누른 경우 그 메뉴)
  function setStep(i, nav = NAV_FOR_STEP[i]) {
    current = i;
    dash.dataset.step = i;
    steps.forEach((b, n) => {
      b.classList.toggle("is-on", n === i);
      b.classList.toggle("is-done", n < i);
      b.setAttribute("aria-pressed", n === i);
    });
    navBtns.forEach((b, n) => b.classList.toggle("is-on", n === nav));
    $("dashStatusText").textContent = STATUS[i];
    $("dashStatus").dataset.state = i === 3 ? "done" : "busy";
    $("buddyMeter").style.width = (i + 1) * 25 + "%";
  }

  function stopAuto() {
    autoplay = false;
    clearInterval(timer);
  }

  steps.forEach((b) => b.addEventListener("click", () => { stopAuto(); setStep(+b.dataset.step); }));
  navBtns.forEach((b, n) => b.addEventListener("click", () => { stopAuto(); setStep(+b.dataset.step, n); }));
  // 기능 카드, 리포트 버튼 → 해당 단계로
  document.querySelectorAll("a[data-step]").forEach((a) => a.addEventListener("click", () => {
    stopAuto();
    setStep(+a.dataset.step);
  }));

  // 화면에 보일 때만 단계를 자동으로 넘김
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        clearInterval(timer);
        if (e.isIntersecting && autoplay) {
          timer = setInterval(() => setStep((current + 1) % 4), 2600);
        }
      });
    }, { threshold: 0.35 }).observe(dash);
  }

  setStep(0);

  /* ---------- 요약 지표 숫자 올라가기 ---------- */

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const unit = el.dataset.unit || "";
    const digits = String(el.dataset.count).includes(".") ? 1 : 0;
    const start = performance.now();
    const dur = 900;
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const v = target * (1 - Math.pow(1 - t, 3));
      el.textContent = v.toFixed(digits) + unit;
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  if (!calm && "IntersectionObserver" in window) {
    const kpiObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    kpiObs.observe(document.querySelector(".kpis"));
  }

  /* ---------- 매출 추이 차트 ---------- */

  // 단위: 만 원 (예시 데이터)
  const SERIES = {
    month: {
      labels: ["1월", "2월", "3월", "4월", "5월", "6월"],
      sales: [124, 98, 156, 132, 171, 148],
      goal: [120, 120, 130, 140, 150, 150],
    },
    week: {
      labels: ["1주", "2주", "3주", "4주", "5주", "6주", "7주", "8주"],
      sales: [131, 136, 142, 158, 149, 135, 161, 167],
      goal: [135, 135, 140, 140, 145, 145, 150, 150],
    },
  };
  let range = "month";

  const chartEl = $("chart");
  const tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.hidden = true;

  function niceMax(v) {
    const step = 50;
    return Math.ceil((v * 1.1) / step) * step;
  }

  function drawChart() {
    const data = SERIES[range];
    const W = Math.max(260, chartEl.clientWidth);
    const H = 190;
    const pad = { l: 40, r: 8, t: 10, b: 26 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const max = niceMax(Math.max(...data.sales, ...data.goal));
    const n = data.labels.length;
    const slot = iw / n;
    const bw = Math.min(30, slot * 0.52);
    const y = (v) => pad.t + ih - (v / max) * ih;
    const cx = (i) => pad.l + slot * i + slot / 2;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-labelledby="chartTitle chartSummary"><g aria-hidden="true">`;

    // 눈금
    const ticks = 4;
    for (let k = 0; k <= ticks; k++) {
      const v = (max / ticks) * k;
      const yy = Math.round(y(v)) + 0.5;
      svg += `<line class="grid-line${k === 0 ? " base" : ""}" x1="${pad.l}" x2="${W - pad.r}" y1="${yy}" y2="${yy}"/>`;
      svg += `<text class="axis" x="${pad.l - 8}" y="${yy + 4}" text-anchor="end">${v === 0 ? "0" : v + "만"}</text>`;
    }

    // 막대 (위쪽만 둥글게)
    data.sales.forEach((v, i) => {
      const x = cx(i) - bw / 2;
      const top = y(v);
      const h = y(0) - top;
      const r = Math.min(4, h);
      svg += `<path class="bar" data-i="${i}" d="M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${y(0)} Z"/>`;
      svg += `<text class="axis" x="${cx(i)}" y="${H - 8}" text-anchor="middle">${data.labels[i]}</text>`;
    });

    // 목표선
    const pts = data.goal.map((v, i) => `${cx(i)},${y(v)}`).join(" ");
    svg += `<polyline class="goal" points="${pts}"/>`;
    data.goal.forEach((v, i) => { svg += `<circle class="goal-dot" data-i="${i}" cx="${cx(i)}" cy="${y(v)}" r="4"/>`; });

    svg += "</g>";

    // 마우스·키보드 대상 (막대보다 넓은 영역, 화면 낭독기는 이 설명을 읽음)
    data.labels.forEach((label, i) => {
      svg += `<rect class="hit" role="img" data-i="${i}" x="${pad.l + slot * i}" y="${pad.t}" width="${slot}" height="${ih}" tabindex="0" aria-label="${label} 일평균 매출 ${data.sales[i]}만 원, 목표 ${data.goal[i]}만 원"/>`;
    });

    svg += "</svg>";
    chartEl.innerHTML = svg;
    chartEl.appendChild(tip);

    const best = data.sales.indexOf(Math.max(...data.sales));
    $("chartSummary").textContent =
      `${data.labels.join(", ")} 일평균 매출: ${data.sales.join(", ")}만 원. 가장 높은 기간은 ${data.labels[best]} ${data.sales[best]}만 원입니다.`;
  }

  function showTip(i) {
    const data = SERIES[range];
    chartEl.querySelectorAll(".bar, .goal-dot").forEach((el) => el.classList.toggle("is-dim", +el.dataset.i !== i));
    const hit = chartEl.querySelector(`.hit[data-i="${i}"]`);
    const diff = data.sales[i] - data.goal[i];
    tip.innerHTML = `<b>${data.labels[i]}</b>
      <span><i class="key key-bar"></i>일평균 매출 <strong>${data.sales[i]}만 원</strong></span>
      <span><i class="key key-line"></i>목표 <strong>${data.goal[i]}만 원</strong></span>
      <em>${diff >= 0 ? "목표 대비 +" + diff : "목표 대비 " + diff}만 원</em>`;
    tip.hidden = false;
    const box = chartEl.getBoundingClientRect();
    const r = hit.getBoundingClientRect();
    const left = r.left - box.left + r.width / 2;
    tip.style.left = Math.min(Math.max(left, 80), box.width - 80) + "px";
  }

  function hideTip() {
    tip.hidden = true;
    chartEl.querySelectorAll(".is-dim").forEach((el) => el.classList.remove("is-dim"));
  }

  chartEl.addEventListener("pointerover", (e) => {
    const hit = e.target.closest(".hit");
    if (hit) showTip(+hit.dataset.i);
  });
  chartEl.addEventListener("pointerleave", hideTip);
  chartEl.addEventListener("focusin", (e) => {
    const hit = e.target.closest(".hit");
    if (hit) showTip(+hit.dataset.i);
  });
  chartEl.addEventListener("focusout", hideTip);

  $("chartSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    range = btn.dataset.range;
    $("chartSeg").querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-on", b === btn);
      b.setAttribute("aria-pressed", b === btn);
    });
    drawChart();
  });

  let lastW = 0;
  window.addEventListener("resize", () => {
    if (chartEl.clientWidth === lastW) return;
    lastW = chartEl.clientWidth;
    drawChart();
  });
  drawChart();

  /* ---------- 고객 후기 ---------- */

  const PRICE_LABEL = { free: "무료", freemium: "무료+유료", paid: "유료" };
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const AVATARS = [
    { skin: "orange", face: "normal", acc: "headphones" },
    { skin: "cream", face: "shout", acc: "" },
    { skin: "gray", face: "wink", acc: "" },
  ];

  const reviews = [];
  SERVICES.forEach((s) => s.reviews.forEach((r) => reviews.push({ s, r })));
  // 같은 사람은 늘 같은 고양이로
  const people = [...new Set(reviews.map(({ r }) => r.by || "조원"))];

  $("reviewGrid").innerHTML = reviews.map(({ s, r }) => {
    const a = AVATARS[people.indexOf(r.by || "조원") % AVATARS.length];
    const cat = catById[s.cat];
    return `
      <article class="review-card" style="--cat:${cat.color}">
        <header class="review-head">
          <span class="sprite review-avatar" data-sprite="cat" data-skin="${a.skin}" data-face="${a.face}" data-acc="${a.acc}" aria-hidden="true"></span>
          <div>
            <p class="review-name">${esc(r.by || "조원")}</p>
            <p class="review-meta"><b>${esc(s.name)}</b> · ${esc(cat.name)}</p>
          </div>
          <span class="badge badge-${s.price}">${PRICE_LABEL[s.price]}</span>
        </header>
        <p class="review-body">${esc(r.text)}</p>
        <a class="review-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} 써 보기 <span aria-hidden="true">↗</span></a>
      </article>`;
  }).join("");

  if (window.Pixel) window.Pixel.paint($("reviewGrid"));
})();

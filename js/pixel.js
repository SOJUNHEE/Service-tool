/* =====================================================================
   픽셀캣 AI · 픽셀 그림
   - data-sprite="cat"            고양이 얼굴 (data-skin / data-face / data-acc)
   - data-sprite="heart|star|…"   작은 아이콘
   - data-scene="desk|shout|dab|back|burst|room"   캐릭터가 등장하는 장면
   모든 그림은 SVG 사각형으로 그려서 어떤 크기로 늘려도 또렷합니다.
   하단 배너의 밤 도시는 canvas 에 작은 해상도로 그린 뒤 크게 늘려 보여 줍니다.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- 색 ---------- */
  const SKINS = {
    orange: { O: "#F5A142", o: "#D8701F", W: "#FFF3E4" },  // 치즈 (헤드셋 고양이)
    cream:  { O: "#F8E6CB", o: "#D6A878", W: "#FFFAF1" },  // 크림 (입 벌린 고양이)
    gray:   { O: "#B3AEB4", o: "#6F6A74", W: "#F1EDEE" },  // 고등어 (포즈 고양이)
    white:  { O: "#FFFAF3", o: "#D9B48F", W: "#FFFFFF" },
  };
  const BASE = {
    K: "#3B2630",  // 테두리
    P: "#FFB0B9",  // 귀 안쪽, 코
    E: "#2A1A22",  // 눈
    H: "#FFFFFF",  // 눈 반짝임
    C: "#FF8FA0",  // 볼 터치
    R: "#E8384F",  // 입 안
    T: "#FF9EB0",  // 혀
    N: "#2E3552",  // 헤드셋
    n: "#4B5680",  // 헤드셋 밝은 면
    B: "#7CC7FF",  // 눈물
  };
  const pal = (skin) => Object.assign({}, BASE, SKINS[skin] || SKINS.orange);

  /* ---------- 고양이 얼굴 (16 x 14, 헤드셋 자리 포함 18 x 14) ---------- */
  const CAT = [
    ".KK..........KK.",
    "KOOK........KOOK",
    "KOPOK......KOPOK",
    "KOPOOKKKKKKOOPOK",
    "KOOOOOoOOoOOOOOK",
    "KOOOOOoOOoOOOOOK",
    "KOOOOOOOOOOOOOOK",
    "KOOOOOOOOOOOOOOK",
    "KoOOOOOOOOOOOOoK",
    "KOOOOOWWWWOOOOOK",
    "KoOWWWWWWWWWWOoK",
    ".KOWWWWWWWWWWOK.",
    "..KKOWWWWWWOKK..",
    "....KKKKKKKK....",
  ];

  const eyes = (lx, rx) => [
    [lx, 6, "H"], [lx + 1, 6, "E"], [lx, 7, "E"], [lx + 1, 7, "E"],
    [rx, 6, "H"], [rx + 1, 6, "E"], [rx, 7, "E"], [rx + 1, 7, "E"],
  ];
  const blush = [[2, 9, "C"], [13, 9, "C"]];
  const nose = [[7, 9, "P"], [8, 9, "P"]];
  const smile = [[6, 10, "K"], [7, 11, "K"], [8, 11, "K"], [9, 10, "K"]];

  const FACES = {
    normal: [...eyes(3, 11), ...blush, ...nose, ...smile],
    shout: [
      [3, 7, "K"], [4, 6, "K"], [5, 7, "K"], [10, 7, "K"], [11, 6, "K"], [12, 7, "K"],
      ...blush, [7, 8, "P"], [8, 8, "P"],
      [5, 9, "K"], [6, 9, "K"], [7, 9, "K"], [8, 9, "K"], [9, 9, "K"], [10, 9, "K"],
      [5, 10, "K"], [6, 10, "R"], [7, 10, "R"], [8, 10, "R"], [9, 10, "R"], [10, 10, "K"],
      [5, 11, "K"], [6, 11, "R"], [7, 11, "T"], [8, 11, "T"], [9, 11, "R"], [10, 11, "K"],
      [6, 12, "K"], [7, 12, "K"], [8, 12, "K"], [9, 12, "K"],
    ],
    wink: [
      [3, 6, "H"], [4, 6, "E"], [3, 7, "E"], [4, 7, "E"],
      [11, 7, "K"], [12, 7, "K"], [13, 6, "K"],
      ...blush, ...nose, ...smile,
    ],
    focus: [  // 집중해서 화면을 보는 눈
      [3, 7, "E"], [4, 7, "E"], [5, 7, "E"], [11, 7, "E"], [12, 7, "E"], [13, 7, "E"],
      [3, 6, "K"], [13, 6, "K"], ...blush, ...nose, [7, 10, "K"], [8, 10, "K"],
    ],
    proud: [  // 눈 감고 뿌듯
      [3, 7, "K"], [4, 7, "K"], [5, 6, "K"], [10, 6, "K"], [11, 7, "K"], [12, 7, "K"],
      ...blush, ...nose, ...smile,
    ],
    sad: [...eyes(3, 11), [3, 8, "B"], [3, 9, "B"], ...nose, [6, 11, "K"], [7, 10, "K"], [8, 10, "K"], [9, 11, "K"]],
  };

  const ACCS = {
    headphones: [
      [5, 1, "N"], [6, 1, "N"], [7, 1, "N"], [8, 1, "N"], [9, 1, "N"], [10, 1, "N"],
      [4, 2, "N"], [5, 2, "n"], [6, 2, "n"], [7, 2, "n"], [8, 2, "n"], [9, 2, "n"], [10, 2, "n"], [11, 2, "N"],
      [3, 3, "N"], [12, 3, "N"], [2, 4, "N"], [13, 4, "N"],
      [0, 5, "N"], [1, 5, "N"], [2, 5, "N"],
      [-1, 6, "N"], [0, 6, "R"], [1, 6, "n"], [2, 6, "N"],
      [-1, 7, "N"], [0, 7, "R"], [1, 7, "n"], [2, 7, "N"],
      [-1, 8, "N"], [0, 8, "R"], [1, 8, "n"], [2, 8, "N"],
      [0, 9, "N"], [1, 9, "N"],
      [13, 5, "N"], [14, 5, "N"], [15, 5, "N"],
      [13, 6, "N"], [14, 6, "n"], [15, 6, "R"], [16, 6, "N"],
      [13, 7, "N"], [14, 7, "n"], [15, 7, "R"], [16, 7, "N"],
      [13, 8, "N"], [14, 8, "n"], [15, 8, "R"], [16, 8, "N"],
      [14, 9, "N"], [15, 9, "N"],
    ],
  };

  /* ---------- 작은 아이콘 ---------- */
  const ICONS = {
    heart: {
      map: [".KK.KK.", "KRRKRRK", "KRHRRRK", ".KRRRK.", "..KRK..", "...K..."],
      pal: { K: "#B8203A", R: "#FF5A79", H: "#FFC6D2" },
    },
    star: {
      map: ["....K....", "...KYK...", "...KYK...", "KKKKYKKKK", "KYYYHYYYK", ".KYYYYYK.", "..KYYYK..", ".KYYKYYK.", ".KKK.KKK."],
      pal: { K: "#B7791F", Y: "#FFD23F", H: "#FFF3B0" },
    },
    spark: {
      map: ["..Y..", "..Y..", "YYHYY", "..Y..", "..Y.."],
      pal: { Y: "#FFE07A", H: "#FFFFFF" },
    },
    coin: {
      map: ["..KKKK..", ".KYYYYK.", "KYHYYyYK", "KYHKKyYK", "KYYKKyYK", "KYYYYyYK", ".KyyyyK.", "..KKKK.."],
      pal: { K: "#9A5B10", Y: "#FFC93C", y: "#E59A1B", H: "#FFF1B5" },
    },
    bang: {
      map: ["KKKK", "KYYK", "KYYK", "KYYK", "KYYK", "KYYK", "KKKK", "....", "KKKK", "KYYK", "KKKK"],
      pal: { K: "#3B2630", Y: "#FFD23F" },
    },
    doc: {
      map: [
        "KKKKKK....", "KWWWWKK...", "KWWWWKWK..", "KWWWWKKKK.", "KWLLLLLWK.", "KWWWWWWWK.",
        "KWLLLLWWK.", "KWWWWWWWK.", "KWLLLLLWK.", "KWWWWWWWK.", "KKKKKKKKK.",
      ],
      pal: { K: "#3B2630", W: "#FFFFFF", L: "#7AA7F5" },
    },
    upload: {
      map: [
        "KKKKKK.....", "KWWWWKK....", "KWWWWKWK...", "KWWWWKKKK..", "KWLLLLLWK..", "KWWWWWWWK..",
        "KWLLLL.KK..", "KWWWW.KUUK.", "KWLL.KUUUUK", "KWWW.KKUUKK", "KKKKK.KUUK.", "......KKKK.",
      ],
      pal: { K: "#3B2630", W: "#FFFFFF", L: "#7AA7F5", U: "#3E7EF0" },
    },
    chart: {
      map: ["K.........", "K.....YY..", "K.....YY..", "K..BB.YY..", "K..BB.YY..", "K..BB.YY..", "KRR.B.YY..", "KRR.B.YY..", "KKKKKKKKKK"],
      pal: { K: "#3B2630", R: "#F2477F", B: "#3E7EF0", Y: "#F5932A" },
    },
    check: {
      map: ["..KKKKK..", ".KGGGGGK.", "KGGGGGWGK", "KGGGGWWGK", "KGWGWWGGK", "KGWWWGGGK", "KGGWGGGGK", ".KGGGGGK.", "..KKKKK.."],
      pal: { K: "#16754A", G: "#2FBF7A", W: "#FFFFFF" },
    },
    bottle: {
      map: [".KKK.", ".KcK.", ".KbK.", ".KbK.", "KbbbK", "KbhbK", "KRRRK", "KRWRK", "KRRRK", "KbhbK", "KbhbK", "KbbbK", "KbbbK", ".KKK."],
      pal: { K: "#3B2630", c: "#D8D8DE", b: "#5B2A1E", h: "#8E4B36", R: "#E23B3B", W: "#FFFFFF" },
    },
  };

  /* ---------- 캔버스 (칸 배열) ---------- */

  function Board(w, h) {
    this.w = w;
    this.h = h;
    this.cells = Array.from({ length: h }, () => new Array(w).fill(null));
  }
  Board.prototype.px = function (x, y, c) {
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y][x] = c;
  };
  Board.prototype.rect = function (x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  };
  // 모서리를 한 칸 깎은 둥근 상자 + 1칸 테두리
  Board.prototype.blob = function (x, y, w, h, fill, line) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const corner = (i === 0 || i === w - 1) && (j === 0 || j === h - 1);
        if (corner) continue;
        const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1;
        this.px(x + i, y + j, edge && line ? line : fill);
      }
    }
  };
  // 두께가 있는 계단식 선 (팔, 꼬리)
  Board.prototype.line = function (x0, y0, x1, y1, t, fill, line) {
    const pts = [];
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) {
      pts.push([x, y]);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    const half = Math.floor(t / 2);
    if (line) pts.forEach(([px, py]) => this.rect(px - half - 1, py - half - 1, t + 2, t + 2, line));
    pts.forEach(([px, py]) => this.rect(px - half, py - half, t, t, fill));
  };
  Board.prototype.map = function (x, y, rows, colors) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") this.px(x + i, y + j, colors[ch]); }));
  };
  Board.prototype.icon = function (x, y, name) { this.map(x, y, ICONS[name].map, ICONS[name].pal); };
  Board.prototype.cat = function (x, y, skin, face, acc) {
    const p = pal(skin);
    this.map(x + 1, y, CAT, p);
    const put = ([cx, cy, ch]) => this.px(x + 1 + cx, y + cy, p[ch]);
    (FACES[face] || FACES.normal).forEach(put);
    (ACCS[acc] || []).forEach(put);
  };

  // 같은 색이 이어지는 칸을 rect 하나로 합쳐 SVG 로 만듦
  Board.prototype.svg = function () {
    const rects = [];
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.cells[y][x];
        if (!c) { x++; continue; }
        let run = 1;
        while (x + run < this.w && this.cells[y][x + run] === c) run++;
        rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${c}"/>`);
        x += run;
      }
    }
    return `<svg viewBox="0 0 ${this.w} ${this.h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects.join("")}</svg>`;
  };

  // 매번 같은 그림이 나오도록 고정된 난수
  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  /* ---------- 장면 ---------- */
  const K = BASE.K;

  const SCENES = {
    // 치즈: 헤드셋을 쓰고 콜라를 든 채 데이터를 분석하는 메인 마스코트
    desk() {
      const b = new Board(86, 60);
      const p = pal("orange");
      // 의자 등받이
      b.blob(2, 14, 24, 36, "#3A4166", K);
      b.rect(5, 17, 3, 30, "#4B5480");
      // 꼬리
      b.line(9, 44, 3, 40, 2, p.O, K);
      b.line(3, 40, 4, 34, 2, p.O, K);
      // 몸통 + 가슴 + 줄무늬
      b.blob(8, 25, 25, 24, p.O, K);
      b.rect(15, 27, 11, 14, p.W);
      [[10, 30], [10, 34], [10, 38], [28, 31], [28, 35]].forEach(([x, y]) => b.rect(x, y, 3, 1, p.o));
      // 키보드로 뻗은 왼팔
      b.line(13, 33, 21, 39, 3, p.O, K);
      // 얼굴 (헤드셋)
      b.cat(11, 13, "orange", "focus", "headphones");
      // 콜라병 + 오른팔
      b.icon(34, 12, "bottle");
      b.line(29, 31, 33, 26, 3, p.O, K);
      b.blob(31, 23, 6, 5, p.O, K);
      b.px(33, 25, p.o);
      // 모니터
      b.blob(44, 7, 38, 28, "#3A3F5C", K);
      b.rect(47, 10, 32, 21, "#1F2849");
      b.rect(47, 10, 32, 3, "#2E3C6B");
      b.px(49, 11, "#FF6B81"); b.px(51, 11, "#FFD23F"); b.px(53, 11, "#3FD18A");
      const bars = [5, 4, 8, 6, 10, 7];
      bars.forEach((h, i) => b.rect(50 + i * 5, 29 - h, 3, h, "#4A86F0"));
      const pts = [[51, 22], [56, 23], [61, 19], [66, 20], [71, 16], [76, 17]];
      for (let i = 0; i < pts.length - 1; i++) b.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1, "#FF7BA6");
      pts.forEach(([x, y]) => b.px(x, y, "#FFFFFF"));
      b.rect(76, 8, 5, 5, "#FFE58A");          // 메모지
      b.rect(77, 9, 3, 1, "#E8B93C");
      b.blob(58, 34, 10, 6, "#4A5070", K);     // 받침대
      b.blob(53, 39, 20, 4, "#4A5070", K);
      // 책상
      b.rect(0, 42, 86, 4, "#C98A5A");
      b.rect(0, 42, 86, 1, "#E3A877");
      b.rect(0, 46, 86, 1, K);
      b.rect(0, 47, 86, 13, "#A8693F");
      b.rect(0, 53, 86, 1, "#8C5634");
      // 키보드 + 왼손
      b.blob(13, 39, 28, 5, "#DCDEEA", K);
      for (let x = 15; x < 39; x += 2) { b.px(x, 40, "#A9ADC4"); b.px(x + 1, 42, "#A9ADC4"); }
      b.blob(19, 37, 7, 4, p.O, K);
      // 머그컵
      b.blob(42, 36, 7, 7, "#FFFFFF", K);
      b.rect(49, 38, 1, 3, K);
      b.px(45, 39, "#FF5A79");
      return b;
    },

    // 크림: 입을 크게 벌리고 두 손을 번쩍 든 리액션 담당
    shout() {
      const b = new Board(42, 46);
      const p = pal("cream");
      b.line(31, 41, 38, 35, 2, p.O, K);
      b.line(38, 35, 37, 29, 2, p.O, K);
      b.blob(10, 25, 22, 21, p.O, K);
      b.rect(15, 27, 12, 14, p.W);
      b.rect(12, 33, 2, 1, p.o); b.rect(28, 33, 2, 1, p.o);
      b.line(12, 29, 6, 19, 3, p.O, K);
      b.line(29, 29, 35, 19, 3, p.O, K);
      b.blob(2, 14, 7, 6, p.O, K); b.px(5, 16, BASE.P); b.px(4, 17, BASE.P); b.px(6, 17, BASE.P);
      b.blob(33, 14, 7, 6, p.O, K); b.px(36, 16, BASE.P); b.px(35, 17, BASE.P); b.px(37, 17, BASE.P);
      b.cat(11, 12, "cream", "shout");
      b.blob(12, 42, 8, 4, p.O, K);
      b.blob(22, 42, 8, 4, p.O, K);
      return b;
    },

    // 고등어: 리포트를 끝내고 디비는(dab) 포즈를 취하는 퍼포먼스 담당
    dab() {
      const b = new Board(50, 48);
      const p = pal("gray");
      b.line(15, 41, 7, 37, 2, p.O, K);
      b.line(7, 37, 6, 30, 2, p.O, K);
      b.blob(14, 25, 21, 20, p.O, K);
      b.rect(19, 28, 11, 12, p.W);
      [[16, 30], [16, 34], [31, 31], [31, 35]].forEach(([x, y]) => b.rect(x, y, 3, 1, p.o));
      // 쭉 뻗은 팔
      b.line(32, 28, 44, 13, 3, p.O, K);
      b.blob(42, 8, 6, 5, p.O, K);
      // 얼굴 + 얼굴을 가리는 팔꿈치
      b.cat(13, 13, "gray", "proud");
      b.line(17, 32, 30, 23, 3, p.O, K);
      b.line(30, 23, 38, 13, 3, p.O, K);
      b.blob(36, 9, 6, 5, p.O, K);
      b.blob(15, 42, 8, 5, p.O, K);
      b.blob(27, 42, 8, 5, p.O, K);
      return b;
    },

    // 치즈 뒷모습 (하단 배너)
    back() {
      const b = new Board(46, 32);
      const p = pal("orange");
      b.icon(1, 17, "bottle");
      // 꼬리
      b.line(40, 30, 44, 25, 2, p.O, K);
      b.line(44, 25, 43, 19, 2, p.O, K);
      // 엉덩이 + 몸통 + 등 줄무늬
      b.blob(11, 22, 10, 10, p.O, K);
      b.blob(33, 22, 10, 10, p.O, K);
      b.blob(14, 14, 26, 18, p.O, K);
      b.rect(26, 17, 2, 11, p.o);
      [[17, 19], [33, 19], [16, 24], [34, 24]].forEach(([x, y]) => b.rect(x, y, 4, 1, p.o));
      // 귀 + 머리
      b.map(19, 0, ["K....", "KK...", "KOK..", "KOOK.", "KOOOK"], p);
      b.map(30, 0, ["....K", "...KK", "..KOK", ".KOOK", "KOOOK"], p);
      b.blob(19, 4, 16, 12, p.O, K);
      b.rect(24, 7, 6, 1, p.o); b.rect(23, 9, 8, 1, p.o); b.rect(24, 11, 6, 1, p.o);
      // 헤드셋
      b.rect(20, 5, 14, 1, BASE.N);
      b.blob(16, 8, 4, 6, BASE.N, K);
      b.blob(34, 8, 4, 6, BASE.N, K);
      return b;
    },

    // 픽셀 폭발 (고등어 뒤 배경)
    burst() {
      const b = new Board(64, 64);
      const rand = seeded(11);
      const ring = ["#FFF7D1", "#FFE27A", "#FFC23D", "#FF9A2E", "#F86A38", "#E94B3C"];
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const dx = x - 32, dy = y - 34;
          const ang = Math.atan2(dy, dx);
          const spike = 4 * Math.abs(Math.sin(ang * 5)) + rand() * 2.4;
          const d = Math.sqrt(dx * dx + dy * dy) - spike;
          const i = Math.floor(d / 4.6);
          if (i >= 0 && i < ring.length) b.px(x, y, ring[i]);
        }
      }
      for (let i = 0; i < 26; i++) {
        const a = rand() * Math.PI * 2, r = 26 + rand() * 6;
        b.px(Math.round(32 + Math.cos(a) * r), Math.round(34 + Math.sin(a) * r), rand() > 0.5 ? "#FFC23D" : "#F86A38");
      }
      return b;
    },

    // 치즈의 방 (히어로 왼쪽 배경)
    room() {
      const b = new Board(80, 52);
      // 창문
      b.blob(4, 4, 32, 26, "#C98A5A", "#8C5634");
      b.rect(6, 6, 28, 22, "#CFEAFF");
      b.rect(6, 6, 28, 8, "#B6DEFF");
      b.rect(19, 6, 2, 22, "#C98A5A");
      b.rect(6, 16, 28, 2, "#C98A5A");
      b.rect(9, 9, 6, 2, "#FFFFFF"); b.rect(8, 10, 9, 1, "#FFFFFF");
      b.rect(24, 21, 7, 2, "#FFFFFF");
      // 화분
      b.blob(10, 30, 9, 8, "#E07A4F", "#9C4A2C");
      b.line(14, 30, 10, 22, 1, "#3FA35B");
      b.line(14, 30, 18, 21, 1, "#3FA35B");
      b.line(14, 30, 14, 20, 1, "#2E8A4A");
      b.blob(7, 19, 6, 4, "#4FBF6E", "#2E8A4A");
      b.blob(16, 18, 6, 4, "#4FBF6E", "#2E8A4A");
      b.blob(11, 16, 6, 4, "#5ACB79", "#2E8A4A");
      // 선반 + 책
      b.rect(44, 14, 32, 2, "#B47A4C");
      [["#F2477F", 6], ["#3E7EF0", 8], ["#FFD23F", 5], ["#2FBF7A", 7]].forEach(([c, h], i) => b.rect(46 + i * 4, 14 - h, 3, h, c));
      b.blob(64, 9, 8, 5, "#FFFFFF", K);
      b.px(67, 11, "#FF5A79");
      // 벽 포스터 (그래프)
      b.blob(48, 22, 18, 14, "#FFFFFF", K);
      b.rect(51, 31, 2, 2, "#F2477F"); b.rect(54, 28, 2, 5, "#3E7EF0"); b.rect(57, 26, 2, 7, "#F5932A"); b.rect(60, 24, 2, 9, "#2FBF7A");
      return b;
    },
  };

  /* ---------- 페이지에 그려 넣기 ---------- */
  const cache = {};

  function sceneSvg(name) {
    if (!cache[name]) cache[name] = SCENES[name]().svg();
    return cache[name];
  }

  function headSvg(skin, face, acc) {
    const b = new Board(18, 14);
    b.cat(0, 0, skin, face, acc);
    return b.svg();
  }

  function iconSvg(name) {
    const icon = ICONS[name];
    const b = new Board(icon.map[0].length, icon.map.length);
    b.icon(0, 0, name);
    return b.svg();
  }

  function paint(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-sprite]").forEach((el) => {
      const kind = el.dataset.sprite;
      el.innerHTML = kind === "cat"
        ? headSvg(el.dataset.skin, el.dataset.face, el.dataset.acc)
        : ICONS[kind] ? iconSvg(kind) : "";
    });
    scope.querySelectorAll("[data-scene]").forEach((el) => {
      if (SCENES[el.dataset.scene]) el.innerHTML = sceneSvg(el.dataset.scene);
    });
  }

  /* ---------- 하단 배너: 밤 도시 ---------- */
  function drawCity(canvas) {
    const PX = 4;  // 픽셀 한 칸의 실제 크기
    const w = Math.ceil(canvas.clientWidth / PX);
    const h = Math.ceil(canvas.clientHeight / PX);
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    const rand = seeded(7);

    const sky = ["#2A2050", "#30245A", "#382964", "#43306F", "#523678", "#653C81", "#7C4388", "#954C8C", "#B0588E"];
    const band = Math.ceil(h / sky.length);
    sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * band, w, band); });

    for (let i = 0; i < w * 0.35; i++) {
      g.fillStyle = rand() > 0.8 ? "#FFE9A8" : "#FFFFFF";
      g.globalAlpha = 0.4 + rand() * 0.6;
      g.fillRect(Math.floor(rand() * w), Math.floor(rand() * h * 0.55), 1, 1);
    }
    g.globalAlpha = 1;

    // 픽셀 구름
    function cloud(cx, cy, s) {
      g.fillStyle = "rgba(255, 200, 230, 0.18)";
      g.fillRect(cx, cy, s * 6, s);
      g.fillRect(cx + s, cy - s, s * 3, s);
      g.fillRect(cx - s, cy + s, s * 8, s);
    }
    cloud(Math.round(w * 0.18), Math.round(h * 0.22), 2);
    cloud(Math.round(w * 0.62), Math.round(h * 0.14), 2);
    cloud(Math.round(w * 0.82), Math.round(h * 0.34), 1);

    let x = 0;
    while (x < w) {
      const bw = 5 + Math.floor(rand() * 9);
      const bh = Math.floor(h * (0.22 + rand() * 0.2));
      g.fillStyle = "#3A2A63";
      g.fillRect(x, h - bh, bw, bh);
      x += bw;
    }

    x = -2;
    while (x < w) {
      const bw = 7 + Math.floor(rand() * 12);
      const bh = Math.floor(h * (0.1 + rand() * 0.26));
      const top = h - bh;
      g.fillStyle = rand() > 0.5 ? "#231A40" : "#2B2049";
      g.fillRect(x, top, bw, bh);
      if (rand() > 0.6) { g.fillStyle = "#231A40"; g.fillRect(x + 2, top - 2, 1, 2); }
      for (let wy = top + 2; wy < h - 2; wy += 3) {
        for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
          const r = rand();
          if (r > 0.62) {
            g.fillStyle = r > 0.93 ? "#FF9EC4" : r > 0.8 ? "#FFE58A" : "#FFC85C";
            g.fillRect(wx, wy, 1, 1);
          }
        }
      }
      x += bw + (rand() > 0.7 ? 1 : 0);
    }

    function blossom(cx, cy, rx, ry) {
      for (let yy = -ry; yy <= ry; yy++) {
        for (let xx = -rx; xx <= rx; xx++) {
          const d = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
          if (d <= 1 && rand() > d * 0.35) {
            const r = rand();
            g.fillStyle = r > 0.85 ? "#FFE1EC" : r > 0.45 ? "#F7A8C8" : "#E27FAD";
            g.fillRect(cx + xx, cy + yy, 1, 1);
          }
        }
      }
    }
    const s = Math.max(6, Math.round(h / 7));
    blossom(Math.round(s * 0.6), h - s, s * 2, s);
    blossom(Math.round(s * 2.6), h - Math.round(s * 0.4), s * 2, s);
    blossom(w - Math.round(s * 1.2), h - s, s * 2, s);
    blossom(w - Math.round(s * 3.4), h - Math.round(s * 0.3), Math.round(s * 1.6), Math.round(s * 0.8));

    for (let i = 0; i < w * 0.08; i++) {
      g.fillStyle = "#FFC2DA";
      g.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1, 1);
    }
  }

  function initCity() {
    const canvas = document.getElementById("city");
    if (!canvas) return;
    let last = 0;
    const redraw = () => {
      if (canvas.clientWidth === last) return;  // 가로 폭이 바뀔 때만 다시 그림
      last = canvas.clientWidth;
      drawCity(canvas);
    };
    redraw();
    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(redraw, 150);
    });
  }

  paint();
  initCity();

  window.Pixel = { paint };
})();

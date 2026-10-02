/* ═══════════════════════════════════════════════════════════════════════════
   PTT Scout na stronie zapisów par — WERSJA TESTOWA (demo, 2.10.2026)

   Trzecia ikona w pasku bocznym (obok lekcji i szkoleń) z rozwijanym menu:
   Ranking PTT · Forma par · Historia pary · Kalendarz turniejów.

   DANE SĄ FIKCYJNE — generowane tutaj, w przeglądarce, z ziarna losowania. Ani jedno
   nazwisko nie pochodzi z bazy PTT ani z bazy Scouta. Powód: demo jest publiczne, a baza
   Scouta zamknięta; podłączenie prawdziwych danych to osobna decyzja (patrz ROADMAP demo).
   Kształt danych odpowiada temu, co oddaje Scout (v_ranking, sila, v_starty, turnieje),
   więc podmiana źródła = podmiana funkcji `dane()`, bez ruszania widoków.

   Włączane flagą TAKT_CONFIG.scout (klienci/demo.json). Bez flagi plik nic nie robi.
   Wpięcie w stronę: owija globalne switchKind(), żeby powrót do lekcji/szkoleń chował Scouta.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof TAKT_CONFIG === 'undefined' || !TAKT_CONFIG.scout) return;
  const SZKOLA = TAKT_CONFIG.schoolName || 'Studio Demo TAKT';

  // ── Dane przykładowe ─────────────────────────────────────────────────────
  // Deterministyczne (stałe ziarno), żeby każdy prospekt zobaczył to samo, a daty
  // liczone od DZIŚ, żeby kalendarz nigdy nie był „w przeszłości".
  function los(ziarno) {
    let a = ziarno >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const KLASY = ['F', 'E', 'D', 'C', 'B'];
  // Grupy PIN-u strony zapisów → kategorie wiekowe. PIN „senior" widzi tylko 25+,
  // „junior" i „sport" — wszystko poniżej 25, PIN ogólny („pair") — obie grupy z przełącznikiem.
  // ⚠️ To filtr WIDOKU na danych fikcyjnych. Przy prawdziwych danych grupę musi rozstrzygać
  // SERWER z PIN-u (_pin_group), a nie przeglądarka — inaczej junior podmieni sessionStorage.
  const GRUPY = {
    S: { nazwa: 'Seniorzy', opis: '25+', przedzialy: ['25-29', '30-39', '40-49'] },
    M: { nazwa: 'Juniorzy i młodzież', opis: 'poniżej 25', przedzialy: ['12-13', '14-15', '16-18', '19-24'] },
  };
  const ETYKIETA = { '25-29': 'Pre-Senior', '30-39': 'Senior 1', '40-49': 'Senior 2',
    '12-13': 'Junior 1', '14-15': 'Junior 2', '16-18': 'Młodzież', '19-24': 'Dorośli' };
  const grupaZPinu = () => {
    let g = ''; try { g = sessionStorage.getItem('zapisy_grupa') || ''; } catch (e) {}
    return g === 'senior' ? 'S' : (g === 'junior' || g === 'sport') ? 'M' : null;   // null = PIN ogólny
  };
  const PROG_AWANSU = { F: 5, E: 7, D: 8, C: 10 };                          // jak w regulaminie PTT
  // Podpis kolumny punktów: seniorzy punktują w Lidze Seniorów (LS), młodzież w Grand Prix Polski (GPX).
  const punktyNaglowek = g => g === 'S' ? 'Punkty LS' : 'Punkty GPX';
  const PROGI = [[3,1],[5,2],[7,3],[9,4],[11,5],[13,6],[16,7],[19,8],[22,9],[25,10],[28,11],[1e9,12]];
  const progPremium = n => { if (n < 2) return 0; for (const [mx, pl] of PROGI) if (n <= mx) return pl; return 12; };
  const iso = d => d.toISOString().slice(0, 10);
  const dni = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  let _dane = null;
  function dane() {
    if (_dane) return _dane;
    const r = los(20261002);
    const wybierz = a => a[Math.floor(r() * a.length)];
    const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += r(); return (s - 3) / Math.sqrt(.5); };
    const ON = ['Adam','Bartosz','Damian','Grzegorz','Jakub','Kamil','Krzysztof','Łukasz','Marcin','Mateusz','Michał','Paweł','Piotr','Rafał','Szymon','Tomasz','Wojciech','Marek','Robert','Daniel'];
    const ONA = ['Agata','Agnieszka','Aleksandra','Anna','Beata','Ewa','Joanna','Justyna','Karolina','Katarzyna','Magdalena','Marta','Monika','Natalia','Paulina','Renata','Sylwia','Weronika','Kinga','Dorota'];
    const NAZW = [['Wrona','Wrona'],['Sikorski','Sikorska'],['Malinowski','Malinowska'],['Zawada','Zawada'],['Kubiak','Kubiak'],
      ['Jankowski','Jankowska'],['Pietrzak','Pietrzak'],['Sobczak','Sobczak'],['Wieczorek','Wieczorek'],['Michalski','Michalska'],
      ['Kaczmarek','Kaczmarek'],['Głowacki','Głowacka'],['Leśniak','Leśniak'],['Ostrowski','Ostrowska'],['Borkowski','Borkowska'],
      ['Czarnecki','Czarnecka'],['Urban','Urban'],['Kozieł','Kozieł'],['Sadowski','Sadowska'],['Domański','Domańska'],
      ['Rogalski','Rogalska'],['Tomczyk','Tomczyk'],['Banaś','Banaś'],['Wilk','Wilk'],['Szulc','Szulc'],['Lis','Lis']];
    const KLUBY = ['Klub Tańca Rytm – Kraków','Akademia Tańca Impuls – Wrocław','Studio Ruchu Forte – Gdynia',
      'Klub Tańca Kadryl – Poznań','Szkoła Tańca Pas de Deux – Łódź','Klub Tańca Gracja – Lublin','Studio Tańca Arabeska – Opole'];
    const MIASTA = ['Wrocław','Kraków','Gdynia','Błonie','Kędzierzyn-Koźle','Olesno','Zabrze','Rzeszów','Poznań','Łódź','Lublin','Bydgoszcz','Siechnice','Gogolin'];
    // Ranga per grupa: seniorzy punktują na GPPS i w Lidze Seniorów, młodzież na Grand Prix Polski.
    const RODZAJE = [
      { nazwa: 'Grand Prix Polski PTT', S: 'GPPS', M: 'GP' },
      { nazwa: 'Liga Seniorów PTT', S: 'LS', M: null, tylkoS: true },
      { nazwa: 'Ogólnopolski Turniej Tańca Towarzyskiego', S: null, M: null },
      { nazwa: 'Puchar Klas PTT', S: null, M: null },
      { nazwa: 'Grand Prix Polski PTT i Liga Seniorów PTT', S: 'LS', M: 'GP' },
      { nazwa: 'Otwarty Turniej Okręgowy', S: null, M: null }];

    // Pary: siła ukryta zgodna z klasą + szum; klasa startowa o stopień niższa u części par,
    // żeby w historii były awanse.
    const pary = [];
    for (let i = 0; i < 100; i++) {
      const grupa = i < 46 ? 'S' : 'M', [mn, zn] = wybierz(NAZW), malz = grupa === 'S' && r() < .5;
      const partner = `${mn} ${wybierz(ON)}`, partnerka = `${malz ? zn : wybierz(NAZW)[1]} ${wybierz(ONA)}`;
      const szkola = i < 7 || (i >= 46 && i < 54);
      const pz = GRUPY[grupa].przedzialy;
      const p = { klucz: 'p' + i, partner, partnerka, klub: szkola ? SZKOLA : wybierz(KLUBY), grupa,
        przedzial: pz[Math.min(pz.length - 1, Math.floor(r() * pz.length))], aktyw: .35 + r() * .45, styl: {} };
      for (const st of ['ST', 'LA']) {
        const ki = Math.min(3, Math.floor(r() * 3.2));
        p.styl[st] = { ki: Math.max(0, ki - (r() < .45 ? 1 : 0)), sila: ki + gauss() * .55, prem: 0 };
      }
      pary.push(p);
    }
    const dzis = new Date(); dzis.setHours(12, 0, 0, 0);
    // Turnieje rozegrane: ~co 3–4 tygodnie wstecz przez 2,5 roku, bez lipca i sierpnia.
    const turnieje = [];
    for (let d = dni(dzis, -6), i = 0; d > dni(dzis, -930); d = dni(d, -(18 + Math.floor(r() * 14))), i++) {
      if (d.getMonth() === 6 || d.getMonth() === 7) continue;
      turnieje.push({ data: iso(d), ...RODZAJE[i % RODZAJE.length], miasto: wybierz(MIASTA) });
    }
    turnieje.reverse();
    const starty = Object.fromEntries(pary.map(p => [p.klucz, []]));
    const kategorie = [];
    for (const t of turnieje) {
      for (const g of ['S', 'M']) for (const st of ['ST', 'LA']) for (const pz of GRUPY[g].przedzialy) for (let ki = 0; ki < 4; ki++) {
        if (t.tylkoS && g === 'M') continue;
        const ucz = pary.filter(p => p.przedzial === pz && p.styl[st].ki === ki && r() < p.aktyw);
        if (!ucz.length) continue;
        const wynik = ucz.map(p => ({ p, w: p.styl[st].sila + gauss() * .75 })).sort((a, b) => b.w - a.w);
        const n = wynik.length, prog = progPremium(n);
        const kat = { data: t.data, styl: st, przedzial: pz, klasa: KLASY[ki], wyniki: [] };
        wynik.forEach(({ p }, i) => {
          const s = p.styl[st], miejsce = r() < .04 ? null : i + 1;
          const premium = miejsce && miejsce <= prog ? 1 : null;
          let nowa = null;
          if (premium) { s.prem++; if (PROG_AWANSU[KLASY[s.ki]] && s.prem >= PROG_AWANSU[KLASY[s.ki]]) {
            nowa = KLASY[s.ki + 1]; s.ki++; s.prem = 0; s.sila += .35; } }
          const punkty = t[g] && t.data >= `${dzis.getFullYear()}-01-01` && miejsce
            ? 30 + 2 * (n - miejsce) + ({ 1: 20, 2: 12, 3: 8 }[miejsce] || 0) : null;
          kat.wyniki.push({ klucz: p.klucz, miejsce });
          starty[p.klucz].push({ data: t.data, turniej: t.nazwa, miasto: t.miasto, ranga: t[g], przedzial: pz,
            klasa: KLASY[ki], styl: st, miejsce, obsada: n, nowa_klasa: nowa, punkty, premium });
        });
        kategorie.push(kat);
      }
    }
    // Siła (jak w Scoucie: skala Elo, 1500 = przeciętna) i forma z ostatnich 90 dni,
    // liczona naprawdę z wygenerowanych wyników: pokonani minus oczekiwani.
    const ocena = {};
    for (const p of pary) for (const st of ['ST', 'LA']) {
      const n = starty[p.klucz].filter(x => x.styl === st && x.miejsce).length;
      if (!n) continue;
      const o = Math.round(1500 + 170 * (p.styl[st].sila - 1.4) + gauss() * 25);
      const niep = Math.round(2 * 330 / Math.sqrt(n + 2));
      ocena[p.klucz + st] = { ocena: o, niepewnosc: niep, ostrozna: o - niep, startow: n };
    }
    const granica = iso(dni(dzis, -90));
    for (const k of kategorie) {
      if (k.data < granica) continue;
      for (const a of k.wyniki) {
        const oa = ocena[a.klucz + k.styl]; if (!oa || !a.miejsce) continue;
        let fakt = 0, oczek = 0;
        for (const b of k.wyniki) { if (b === a || !b.miejsce) continue; const ob = ocena[b.klucz + k.styl];
          fakt += b.miejsce > a.miejsce ? 1 : 0; oczek += 1 / (1 + Math.pow(10, ((ob ? ob.ocena : 1500) - oa.ocena) / 400)); }
        oa.forma = (oa.forma || 0) + fakt - oczek;
      }
    }
    // Kalendarz przed nami — terminy jak w regulaminach PTT (zgłoszenia ~13 dni przed,
    // zamknięcie list ~6 dni przed).
    const kalendarz = [3, 9, 16, 30, 37, 51].map((n, i) => {
      const d = dni(dzis, n), rodzaj = RODZAJE[(i + 2) % RODZAJE.length];
      const kat = [];
      for (const g of ['S', 'M']) for (const st of ['ST', 'LA']) for (const pz of GRUPY[g].przedzialy) for (const kl of ['F', 'E', 'D', 'C']) {
        if (rodzaj.tylkoS && g === 'M') continue;
        const zg = pary.filter(p => p.przedzial === pz && KLASY[p.styl[st].ki] === kl && r() < (n < 12 ? .5 : .22));
        if (zg.length || r() < .5) kat.push({ grupa: g, styl: st, przedzial: pz, klasa: kl, zgloszonych: zg.length,
          nasze: zg.filter(p => p.klub === SZKOLA).map(p => `${p.partner.split(' ')[0]} / ${p.partnerka.split(' ')[0]}`) });
      }
      return { data: iso(d), nazwa: rodzaj.nazwa, ranga: { S: rodzaj.S, M: rodzaj.M }, miasto: MIASTA[(i * 5 + 3) % MIASTA.length],
        termin: iso(dni(d, -13)), zamkniecie: iso(dni(d, -6)), kategorie: kat };
    });
    _dane = { pary, starty, ocena, kalendarz, klasa: (p, st) => KLASY[p.styl[st].ki] };
    return _dane;
  }

  // ── Wygląd ───────────────────────────────────────────────────────────────
  const css = `
  .sc-wrap{ display:none } .sc-wrap.on{ display:block }
  .sc-baner{ display:flex; gap:10px; align-items:center; font-size:.8rem; color:#7a5b00; background:#fff7dc;
    border:1px solid #f0dc9c; border-radius:10px; padding:8px 12px; margin-bottom:12px }
  .sc-grupa{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:.84rem; margin:0 0 12px }
  .sc-grupa .seg{ margin:0 } .sc-grupa .seg-btn{ flex:0 0 auto; padding:7px 12px; font-size:.84rem }
  .sc-h{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin:0 0 4px }
  .sc-h h2{ margin:0; font-size:1.15rem } .sc-h .sc-pod{ font-size:.8rem; color:var(--muted) }
  .sc-filtry{ display:flex; gap:8px; flex-wrap:wrap; margin:12px 0 }
  .sc-filtry .seg{ margin:0; flex:0 0 auto } .sc-filtry .seg-btn{ flex:0 0 auto; padding:8px 14px }
  .sc-filtry select, .sc-szukaj{ padding:9px 11px; border:1px solid var(--border); border-radius:9px; font:inherit; font-size:.9rem; background:#fff }
  .sc-szukaj{ width:100%; max-width:340px }
  .sc-tab{ overflow-x:auto; border:1px solid var(--border); border-radius:10px }
  .sc-tab table{ width:100%; border-collapse:collapse; font-size:.86rem; min-width:520px }
  .sc-tab th{ text-align:left; font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; color:var(--muted);
    background:#fafafa; padding:9px 10px; border-bottom:1px solid var(--border) }
  .sc-tab td{ padding:9px 10px; border-bottom:1px solid #f1f1f1; vertical-align:middle }
  .sc-tab tr:last-child td{ border-bottom:0 }
  .sc-tab .num{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap }
  .sc-tab tr.nasza td{ background:#fff4f2 } .sc-tab tr.nasza td:first-child{ box-shadow:inset 3px 0 0 var(--gold) }
  .sc-klub{ font-size:.74rem; color:var(--muted) }
  .sc-szk{ display:inline-block; font-size:.66rem; font-weight:800; color:var(--gold); border:1px solid var(--gold);
    border-radius:20px; padding:1px 7px; margin-left:6px; vertical-align:1px }
  .sc-up{ color:#1f7a3f; font-weight:700 } .sc-down{ color:#b3261e; font-weight:700 } .sc-cichy{ color:#b8b2a8 }
  .sc-plus{ font-size:.72rem; color:var(--muted); margin-left:3px }
  .sc-kafle{ display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:8px; margin:10px 0 14px }
  .sc-kafel{ background:#fafafa; border:1px solid var(--border); border-radius:10px; padding:10px 12px }
  .sc-kafel b{ display:block; font-size:1.35rem; font-variant-numeric:tabular-nums } .sc-kafel span{ font-size:.74rem; color:var(--muted) }
  .sc-lista{ display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 2px }
  .sc-lista button{ border:1px solid var(--border); background:#fff; border-radius:20px; padding:6px 11px; font:inherit; font-size:.82rem; cursor:pointer }
  .sc-lista button:hover{ border-color:var(--gold) }
  .sc-os svg{ display:block; width:100%; height:auto }
  .sc-os .tor{ fill:#f6f5f3 } .sc-os .rok{ stroke:#e2e0dc } .sc-os .lab{ font:600 10px system-ui; fill:#8a8378 }
  .sc-os .linia{ fill:none; stroke:var(--gold); stroke-width:1.6; opacity:.55 }
  .sc-os .kr{ fill:#c9a59f } .sc-os .kr.w{ fill:var(--gold) } .sc-os .kr.aw{ fill:var(--gold); stroke:#1a1a1a; stroke-width:2 }
  .sc-os .awt{ font:800 10px system-ui; fill:var(--gold) }
  .sc-turn{ border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-bottom:10px; background:#fff }
  .sc-turn .t1{ display:flex; gap:10px; align-items:baseline; flex-wrap:wrap }
  .sc-turn .data{ font-weight:800; font-variant-numeric:tabular-nums } .sc-turn .nazwa{ font-weight:700 }
  .sc-zn{ display:inline-block; font-size:.68rem; font-weight:800; padding:2px 8px; border-radius:20px; border:1px solid var(--border) }
  .sc-zn.gpps, .sc-zn.gp{ background:#1a1a1a; color:#fff; border-color:#1a1a1a } .sc-zn.ls{ background:var(--gold); color:#fff; border-color:var(--gold) }
  .sc-zn.ok{ color:#1f7a3f; border-color:#9fd3b0 } .sc-zn.pozno{ color:#9a4a00; border-color:#f3c48f } .sc-zn.zamk{ color:var(--muted) }
  .sc-kat{ display:flex; flex-wrap:wrap; gap:6px; margin-top:9px }
  .sc-kat span{ font-size:.76rem; background:#f6f5f3; border-radius:7px; padding:4px 8px }
  .sc-kat span.nasze{ background:#fff4f2; box-shadow:inset 0 0 0 1px var(--gold) }
  `;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dm = s => { const [, m, d] = s.split('-'); return `${d}.${m}`; };
  const ikona = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 0 5H7M17 6h2.5a2.5 2.5 0 0 1 0 5H17"/></svg>`;
  const WIDOKI = [
    ['ranking', 'Ranking PTT', 'punkty Grand Prix i Ligi Seniorów'],
    ['forma', 'Forma par', 'kto z kim wygrywa — ocena i forma'],
    ['para', 'Historia pary', 'starty, awanse, oś kariery'],
    ['kalendarz', 'Kalendarz turniejów', 'terminy zgłoszeń, kto jedzie'],
  ];
  const stan = { widok: null, styl: 'ST', przedzial: '30-39', klasa: '', para: null, grupa: 'S', pin: null };
  // Grupa z PIN-u ustala, co wolno pokazać; PIN ogólny wybiera przełącznikiem.
  function ustawGrupe() {
    const z = grupaZPinu();
    if (z !== stan.pin) { stan.pin = z; if (z) stan.grupa = z; }
    if (!GRUPY[stan.grupa].przedzialy.includes(stan.przedzial)) stan.przedzial = GRUPY[stan.grupa].przedzialy[stan.grupa === 'S' ? 1 : 0];
    const p = dane().pary.find(x => x.klucz === stan.para);
    if (p && p.grupa !== stan.grupa) stan.para = null;
  }
  const paryGrupy = D => D.pary.filter(p => p.grupa === stan.grupa);

  function wepnij() {
    const rail = document.querySelector('.tab-rail'), tresc = document.querySelector('.app-content');
    if (!rail || !tresc) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const wrap = document.createElement('div');
    wrap.className = 'tab-wrap'; wrap.id = 'tabScoutWrap';
    wrap.innerHTML = `<button type="button" class="tab" id="tabScout" title="PTT Scout">${ikona}<span class="tip">PTT Scout</span></button>
      <div class="flyout" id="scoutFlyout"><div class="flyout-head">PTT Scout · wyniki turniejów</div>
        ${WIDOKI.map(([k, n, o]) => `<button type="button" class="flyout-item" data-w="${k}"><div class="name">${n}</div><div class="range">${o}</div></button>`).join('')}
      </div>`;
    rail.appendChild(wrap);
    const widok = document.createElement('div');
    widok.className = 'sc-wrap'; widok.id = 'scoutView';
    tresc.appendChild(widok);

    const fly = wrap.querySelector('#scoutFlyout');
    wrap.querySelector('#tabScout').addEventListener('click', e => {
      e.stopPropagation();
      if (typeof closeTrainingFlyout === 'function') closeTrainingFlyout();
      fly.classList.toggle('open');
    });
    fly.querySelectorAll('.flyout-item').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); fly.classList.remove('open'); pokaz(b.dataset.w);
    }));
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) fly.classList.remove('open'); });

    // Powrót do lekcji/szkoleń chowa Scouta. switchKind to funkcja globalna strony —
    // owijamy ją, zamiast zmieniać stronę zapisów (moduł da się wyjąć bez śladu).
    const oryg = window.switchKind;
    window.switchKind = function (k) { schowaj(); return oryg.apply(this, arguments); };
  }

  function schowaj() {
    stan.widok = null;
    document.getElementById('scoutView').classList.remove('on');
    document.getElementById('tabScout').classList.remove('active');
    document.querySelectorAll('.app-content > :not(#scoutView)').forEach(el => el.style.display = '');
  }
  function pokaz(w) {
    stan.widok = w;
    ustawGrupe();
    document.querySelectorAll('.app-content > :not(#scoutView)').forEach(el => el.style.display = 'none');
    ['tabWeekly', 'tabWeekend'].forEach(id => { const t = document.getElementById(id); if (t) t.classList.remove('active'); });
    document.getElementById('tabScout').classList.add('active');
    const box = document.getElementById('scoutView'); box.classList.add('on');
    rysuj();
  }

  // ── Widoki ───────────────────────────────────────────────────────────────
  function rysuj() {
    const D = dane(), box = document.getElementById('scoutView');
    const [, tytul, opis] = WIDOKI.find(x => x[0] === stan.widok);
    const tresc = { ranking: wRanking, forma: wForma, para: wPara, kalendarz: wKalendarz }[stan.widok](D);
    box.innerHTML = `<div class="card">
      <div class="sc-baner">🧪 <span><b>Wersja testowa, dane przykładowe.</b> Pary, kluby i wyniki są fikcyjne — tak wyglądałby moduł PTT Scout w Waszej szkole.</span></div>
      ${stan.pin ? `<div class="sc-grupa">Wasz PIN: <b>${GRUPY[stan.pin].nazwa}</b> · kategorie ${GRUPY[stan.pin].opis}</div>`
        : `<div class="sc-grupa"><div class="seg">${Object.entries(GRUPY).map(([k, g]) =>
            `<button type="button" class="seg-btn${stan.grupa === k ? ' active' : ''}" data-grupa="${k}">${g.nazwa} · ${g.opis}</button>`).join('')}</div>
            <span class="sc-klub">PIN ogólny — widać obie grupy. PIN seniorów albo juniorów pokazuje tylko swoją.</span></div>`}
      <div class="sc-h"><h2>${tytul}</h2><span class="sc-pod">${opis}</span></div>${tresc}</div>`;
    podepnij(box);
  }
  const filtry = (z) => `<div class="sc-filtry">
      <div class="seg">${['ST', 'LA'].map(s => `<button type="button" class="seg-btn${stan.styl === s ? ' active' : ''}" data-styl="${s}">${s === 'ST' ? 'Standard' : 'Latyna'}</button>`).join('')}</div>
      <select data-f="przedzial">${GRUPY[stan.grupa].przedzialy.map(p => `<option value="${p}"${stan.przedzial === p ? ' selected' : ''}>${p} · ${ETYKIETA[p]}</option>`).join('')}</select>
      ${z ? `<select data-f="klasa"><option value="">wszystkie klasy</option>${['F', 'E', 'D', 'C', 'B'].map(k => `<option${stan.klasa === k ? ' selected' : ''}>${k}</option>`).join('')}</select>` : ''}
    </div>`;
  const nazwaPary = p => `${esc(p.partner)} / ${esc(p.partnerka)}${p.klub === SZKOLA ? '<span class="sc-szk">nasza szkoła</span>' : ''}<div class="sc-klub">${esc(p.klub)}</div>`;

  function wRanking(D) {
    const rok = String(new Date().getFullYear());
    const wiersze = paryGrupy(D).filter(p => p.przedzial === stan.przedzial).map(p => {
      const s = D.starty[p.klucz].filter(x => x.styl === stan.styl && x.data.startsWith(rok) && x.punkty != null);
      return { p, startow: s.length, punkty: s.reduce((a, x) => a + x.punkty, 0),
               // Premie liczą się do awansu w OBECNEJ klasie (po awansie licznik startuje od zera) — „ma / potrzebuje”.
               premium: p.styl[stan.styl].prem, prog: PROG_AWANSU[D.klasa(p, stan.styl)] || null,
               klasa: D.klasa(p, stan.styl) };
    }).filter(x => x.punkty > 0 && (!stan.klasa || x.klasa === stan.klasa)).sort((a, b) => b.punkty - a.punkty);
    return `<p class="hint" style="margin:0">Sezon ${rok}. ${stan.grupa === 'S'
        ? 'Punkty naliczają się tylko na Grand Prix Polski Senior i w Lidze Seniorów — każdy styl osobno.'
        : 'Punkty naliczają się na turniejach Grand Prix Polski — każdy styl osobno.'}</p>
      ${filtry(true)}
      ${wiersze.length ? `<div class="sc-tab"><table><thead><tr><th>#</th><th>Para</th><th>Kl.</th><th class="num">Startów</th><th class="num" title="Punkty premiowe zdobyte w obecnej klasie / ile potrzeba do awansu">Premium<br><small>ma / potrzebuje</small></th><th class="num">${punktyNaglowek(stan.grupa)}</th></tr></thead>
      <tbody>${wiersze.map((x, i) => `<tr class="${x.p.klub === SZKOLA ? 'nasza' : ''}" data-para="${x.p.klucz}" style="cursor:pointer">
        <td class="num">${i + 1}</td><td>${nazwaPary(x.p)}</td><td>${x.klasa}</td>
        <td class="num">${x.startow}</td><td class="num" title="${x.prog ? 'do awansu do klasy ' + KLASY[KLASY.indexOf(x.klasa) + 1] + ': ' + x.prog + ' premii' : 'klasa B — bez progu awansu w regulaminie'}">${x.prog ? `${x.premium} / ${x.prog}` : x.premium}</td><td class="num"><b>${x.punkty}</b></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty">Brak punktów w tym wycinku.</div>'}`;
  }

  function wForma(D) {
    const wiersze = paryGrupy(D).filter(p => p.przedzial === stan.przedzial)
      .map(p => ({ p, o: D.ocena[p.klucz + stan.styl], klasa: D.klasa(p, stan.styl) }))
      .filter(x => x.o && (!stan.klasa || x.klasa === stan.klasa)).sort((a, b) => b.o.ostrozna - a.o.ostrozna);
    const forma = f => f == null ? '<span class="sc-cichy">—</span>'
      : f >= .05 ? `<span class="sc-up">▲ +${f.toFixed(1).replace('.', ',')}</span>`
      : f <= -.05 ? `<span class="sc-down">▼ −${Math.abs(f).toFixed(1).replace('.', ',')}</span>` : '0,0';
    return `<p class="hint" style="margin:0">Liczy się, <b>kogo para pokonała</b>, a nie samo miejsce. Ocena 1500 = para przeciętna.
      <b>Forma</b>: ile par więcej (▲) albo mniej (▼) para pokonała w ostatnich 3 miesiącach, niż się spodziewano. To nie jest ranking PTT.</p>
      ${filtry(true)}
      <div class="sc-tab"><table><thead><tr><th>#</th><th>Para</th><th>Kl.</th><th class="num">Ocena</th><th class="num">Forma</th><th class="num">Startów</th></tr></thead>
      <tbody>${wiersze.map((x, i) => `<tr class="${x.p.klub === SZKOLA ? 'nasza' : ''}" data-para="${x.p.klucz}" style="cursor:pointer">
        <td class="num">${i + 1}</td><td>${nazwaPary(x.p)}</td><td>${x.klasa}</td>
        <td class="num"><b>${x.o.ocena}</b><span class="sc-plus">±${x.o.niepewnosc}</span></td>
        <td class="num">${forma(x.o.forma)}</td><td class="num">${x.o.startow}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function wPara(D) {
    const nasze = paryGrupy(D).filter(p => p.klub === SZKOLA);
    const p = D.pary.find(x => x.klucz === stan.para);
    const wybor = `<input class="sc-szukaj" id="scSzukaj" placeholder="Szukaj pary po nazwisku…" autocomplete="off">
      <div class="sc-lista" id="scWyniki">${nasze.map(x => `<button type="button" data-para="${x.klucz}">${esc(x.partner)} / ${esc(x.partnerka)}</button>`).join('')}</div>
      <p class="hint" style="margin:2px 0 0">Pod polem — pary z Waszej szkoły.</p>`;
    if (!p) return `<div style="margin-top:12px">${wybor}</div>`;
    const s = D.starty[p.klucz];
    const styl = st => {
      const z = s.filter(x => x.styl === st), skl = z.filter(x => x.miejsce);
      if (!z.length) return '';
      const pok = skl.filter(x => x.obsada > 1).map(x => (x.obsada - x.miejsce) / (x.obsada - 1));
      const sr = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
      const o = D.ocena[p.klucz + st];
      return `<h3 style="margin:16px 0 0;font-size:1rem">${st === 'ST' ? 'Standard' : 'Latyna'} <span class="badge ${st.toLowerCase()}">klasa ${D.klasa(p, st)}</span></h3>
        <div class="sc-kafle">
          <div class="sc-kafel"><b>${z.length}</b><span>startów</span></div>
          <div class="sc-kafel"><b>${skl.length ? (sr(skl.map(x => x.miejsce))).toFixed(1).replace('.', ',') : '—'}</b><span>średnie miejsce</span></div>
          <div class="sc-kafel"><b>${pok.length ? Math.round(sr(pok) * 100) + '%' : '—'}</b><span>pokonanych par</span></div>
          <div class="sc-kafel"><b>${skl.filter(x => x.miejsce === 1).length} / ${skl.filter(x => x.miejsce <= 3).length}</b><span>wygrane / podium</span></div>
          <div class="sc-kafel"><b>${o ? o.ocena : '—'}</b><span>ocena siły</span></div>
        </div>`;
    };
    return `<div style="margin-top:12px">${wybor}</div>
      <h3 style="margin:18px 0 4px;font-size:1.05rem">${esc(p.partner)} / ${esc(p.partnerka)}</h3>
      <div class="sc-klub">${esc(p.klub)} · kategoria ${esc(p.przedzial)}</div>
      ${osKariery(s)}${styl('ST')}${styl('LA')}
      <div class="sc-tab" style="margin-top:6px"><table><thead><tr><th>Data</th><th>Turniej</th><th>Kategoria</th><th class="num">Miejsce</th><th class="num">Obsada</th><th class="num">${punktyNaglowek(GRUPY.S.przedzialy.includes(p.przedzial) ? 'S' : 'M')}</th></tr></thead>
      <tbody>${s.slice().reverse().slice(0, 40).map(x => `<tr><td>${x.data}</td>
        <td>${esc(x.turniej)}<div class="sc-klub">${esc(x.miasto)}</div></td>
        <td>${x.przedzial} ${x.klasa} ${x.styl}${x.nowa_klasa ? ` <span class="sc-szk">awans → ${x.nowa_klasa}</span>` : ''}</td>
        <td class="num">${x.miejsce ?? '—'}</td><td class="num">${x.obsada}</td><td class="num">${x.punkty ?? '—'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  // Oś kariery — ta sama idea co w Scoucie: tor na styl, wyżej = więcej pokonanych,
  // linia = średnia dnia, duża kropka z obwódką = awans.
  function osKariery(s) {
    if (s.length < 2) return '';
    const W = 760, L = 30, R = 10, G = 22, TOR = 54, OD = 26;
    const t = x => new Date(x + 'T12:00:00').getTime();
    const t0 = t(s[0].data), t1 = t(s[s.length - 1].data), X = ms => L + 8 + (ms - t0) / Math.max(t1 - t0, 1) * (W - L - R - 16);
    let svg = '';
    for (let r = new Date(t0).getFullYear() + 1; r <= new Date(t1).getFullYear(); r++) {
      const x = X(new Date(r, 0, 1).getTime()).toFixed(1);
      svg += `<line class="rok" x1="${x}" x2="${x}" y1="${G - 6}" y2="${G + 2 * (TOR + OD)}" stroke-dasharray="2 4"/><text class="lab" x="${+x + 3}" y="${G - 9}">${r}</text>`;
    }
    ['ST', 'LA'].forEach((st, k) => {
      const y0 = G + k * (TOR + OD), z = s.filter(x => x.styl === st);
      const Y = o => (y0 + 7 + (1 - o) * (TOR - 14)).toFixed(1);
      const pk = x => x.miejsce && x.obsada > 1 ? (x.obsada - x.miejsce) / (x.obsada - 1) : null;
      const dzien = new Map(); z.forEach(x => { const o = pk(x); if (o != null) (dzien.get(x.data) || dzien.set(x.data, []).get(x.data)).push(o); });
      const linia = [...dzien].map(([d, os]) => `${X(t(d)).toFixed(1)},${Y(os.reduce((a, b) => a + b) / os.length)}`).join(' ');
      svg += `<rect class="tor" x="${L}" y="${y0}" width="${W - L - R}" height="${TOR}" rx="7"/><text class="lab" x="0" y="${y0 + TOR / 2 + 4}">${st}</text>`;
      if (dzien.size > 1) svg += `<polyline class="linia" points="${linia}"/>`;
      z.forEach(x => { const o = pk(x); if (o == null) return;
        svg += x.nowa_klasa
          ? `<circle class="kr aw" cx="${X(t(x.data)).toFixed(1)}" cy="${Y(o)}" r="6"><title>${x.data} · awans ${x.klasa}→${x.nowa_klasa}</title></circle><text class="awt" x="${X(t(x.data)).toFixed(1)}" y="${(+Y(o) - 10).toFixed(1)}" text-anchor="middle">${x.klasa}→${x.nowa_klasa}</text>`
          : `<circle class="kr${x.miejsce === 1 ? ' w' : ''}" cx="${X(t(x.data)).toFixed(1)}" cy="${Y(o)}" r="4"><title>${x.data} · ${x.miejsce}. / ${x.obsada} · ${esc(x.turniej)}</title></circle>`; });
    });
    return `<div class="sc-os" style="margin-top:12px"><div class="hint" style="margin:0 0 4px">Oś kariery · wyżej = więcej pokonanych par · duża kropka = awans</div>
      <svg viewBox="0 0 ${W} ${G + 2 * (TOR + OD) - 6}">${svg}</svg></div>`;
  }

  function wKalendarz(D) {
    const dzis = new Date(); dzis.setHours(0, 0, 0, 0);
    const ile = s => Math.round((new Date(s + 'T00:00:00') - dzis) / 864e5);
    const lista = D.kalendarz.map(t => ({ ...t, ranga: t.ranga[stan.grupa], kategorie: t.kategorie.filter(k => k.grupa === stan.grupa) }))
      .filter(t => t.kategorie.length);
    return `<p class="hint" style="margin:0">Turnieje dla kategorii ${GRUPY[stan.grupa].przedzialy.join(', ')}. <b>Obwódką</b> — kategorie, w których są już zgłoszone pary z naszej szkoły.</p>
      <div style="margin-top:12px">${lista.map(t => {
        const dt = ile(t.termin), dz = ile(t.zamkniecie);
        const zapisy = dt >= 0 ? `<span class="sc-zn ok">● zapisy do ${dm(t.termin)} · ${dt === 0 ? 'dziś' : dt + ' dni'}</span>`
          : dz >= 0 ? `<span class="sc-zn pozno">● po terminie (drożej) do ${dm(t.zamkniecie)}</span>`
          : `<span class="sc-zn zamk">● listy zamknięte</span>`;
        const nasze = t.kategorie.flatMap(k => k.nasze.map(n => `${n} (${k.styl} ${k.klasa})`));
        return `<div class="sc-turn"><div class="t1"><span class="data">${dm(t.data)}</span><span class="nazwa">${esc(t.nazwa)}</span>
            <span class="sc-klub">${esc(t.miasto)} · za ${ile(t.data)} dni</span>
            ${t.ranga ? `<span class="sc-zn ${t.ranga.toLowerCase()}">${t.ranga}</span>` : ''} ${zapisy}</div>
          <div class="sc-kat">${t.kategorie.map(k => `<span class="${k.nasze.length ? 'nasze' : ''}">${k.styl} ${k.przedzial} ${k.klasa} · <b>${k.zgloszonych}</b> ${k.zgloszonych === 1 ? 'para' : 'par'}</span>`).join('')}</div>
          ${nasze.length ? `<div class="hint" style="margin-top:8px">Z naszej szkoły: ${esc(nasze.join(', '))}</div>` : ''}</div>`;
      }).join('')}</div>`;
  }

  function podepnij(box) {
    box.querySelectorAll('[data-styl]').forEach(b => b.addEventListener('click', () => { stan.styl = b.dataset.styl; rysuj(); }));
    box.querySelectorAll('[data-grupa]').forEach(b => b.addEventListener('click', () => {
      if (stan.pin) return;                     // PIN grupy nie przełącza — widzi tylko swoje
      stan.grupa = b.dataset.grupa; stan.klasa = ''; ustawGrupe(); rysuj(); }));
    box.querySelectorAll('select[data-f]').forEach(s => s.addEventListener('change', () => { stan[s.dataset.f] = s.value; rysuj(); }));
    box.querySelectorAll('[data-para]').forEach(el => el.addEventListener('click', () => { stan.para = el.dataset.para; pokaz('para'); }));
    const q = box.querySelector('#scSzukaj');
    if (q) q.addEventListener('input', () => {
      const f = q.value.trim().toLowerCase(), D = dane();
      const lista = f.length < 2 ? paryGrupy(D).filter(p => p.klub === SZKOLA)
        : paryGrupy(D).filter(p => (p.partner + ' ' + p.partnerka).toLowerCase().includes(f)).slice(0, 12);
      const w = box.querySelector('#scWyniki');
      w.innerHTML = lista.map(x => `<button type="button" data-para="${x.klucz}">${esc(x.partner)} / ${esc(x.partnerka)}</button>`).join('') || '<span class="hint">Nie znaleziono.</span>';
      w.querySelectorAll('[data-para]').forEach(el => el.addEventListener('click', () => { stan.para = el.dataset.para; pokaz('para'); }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wepnij); else wepnij();
})();

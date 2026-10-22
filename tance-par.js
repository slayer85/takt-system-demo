/* „Tańce par” — sam kod modułu, bez danych: dane podaje strona w window.TP_DANE (panel TAKT: rpc klub_tance; Scout „TEAM forma”: rpc team_forma). Źródło: PTT Scout/takt-tance-par/ */
(function(){ if (document.getElementById("tpStyl")) return; var s = document.createElement("style"); s.id = "tpStyl"; s.textContent = ".tp{--tp-karta:#ffffff;--tp-pan:#f4f4f5;--tp-pan2:#e6e6e9;--tp-tx:#1a1a1a;--tp-cichy:#6b6560;--tp-linia:#e2e2e4;--tp-zl:#b07d0e;--tp-zl2:#c9a24a;--tp-plus:#3d6fd6;--tp-minus:#c95454;--tp-na:#ffffff;\n  color:var(--tp-tx);font-variant-numeric:tabular-nums;display:grid;gap:14px;max-width:1180px}\nhtml.motyw-ciemny .tp.tp{--tp-karta:#1c1c1e;--tp-pan:#262628;--tp-pan2:#313134;--tp-tx:#e9e6df;--tp-cichy:#9a968c;--tp-linia:#3a3a3d;--tp-zl:#e3b84f;--tp-zl2:#a8852f;--tp-plus:#4f7fe0;--tp-minus:#d76666;--tp-na:#ffffff}\n.tp *{box-sizing:border-box}\n.tp .tp-karta{background:var(--tp-karta);border-radius:10px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.08)}\n.tp .tp-tytul{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px}\n.tp .tp-tytul h2{font-size:1.35rem;margin:0}\n.tp .tp-pod{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--tp-zl);font-weight:600}\n.tp .tp-lead{margin:8px 0 4px;color:var(--tp-cichy);max-width:75ch;line-height:1.5}\n.tp .tp-meta{font:12px/1.5 ui-monospace,Menlo,monospace;color:var(--tp-cichy)}\n.tp .tp-cichy{color:var(--tp-cichy);font-size:.86rem;line-height:1.5}\n.tp .tp-opis{margin:0 0 12px}\n.tp details.tp-jak{margin:12px 0 4px;background:var(--tp-pan);border-radius:8px;padding:8px 14px}\n.tp details.tp-jak summary{cursor:pointer;font-weight:600;font-size:.9rem;padding:2px 0}\n.tp details.tp-jak p{margin:8px 0;max-width:80ch;line-height:1.5;font-size:.9rem}\n.tp .tp-liczby{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin:8px 0}\n.tp .tp-liczby div{background:var(--tp-karta);border-radius:8px;padding:10px 12px;font-size:.84rem;color:var(--tp-cichy)}\n.tp .tp-liczby b{display:block;font-size:1.25rem;color:var(--tp-tx);margin-bottom:2px}\n.tp .tp-seg{display:inline-flex;flex-wrap:wrap;background:var(--tp-pan);border-radius:9px;padding:3px;gap:2px}\n.tp .tp-seg button{border:0;background:transparent;cursor:pointer;padding:7px 14px;border-radius:7px;font:inherit;font-size:.88rem;font-weight:500;color:var(--tp-cichy)}\n.tp .tp-seg button.on{background:var(--tp-karta);color:var(--tp-tx);font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.12)}\n.tp .tp-widoki{margin-top:14px}\n.tp .tp-widoki button{padding:9px 18px;font-size:.95rem}\n.tp button:focus-visible,.tp select:focus-visible,.tp tr:focus-visible{outline:2px solid var(--tp-zl);outline-offset:1px}\n.tp .tp-pasek{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px}\n.tp .tp-h{font-size:1.1rem;font-weight:700}\n.tp .tp-h small{font:12px ui-monospace,Menlo,monospace;color:var(--tp-cichy);margin-left:8px;font-weight:400}\n.tp .tp-wybory{display:flex;gap:8px;flex-wrap:wrap}\n.tp select{max-width:100%;font-size:.9rem;padding:7px 9px;border-radius:7px}\n.tp .tp-e{font:600 11px/1.5 ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--tp-cichy);margin-bottom:8px}\n.tp .tp-e i.kr{display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:-1px;margin-left:4px}\n.tp .tp-e i.kr.ja{background:var(--tp-zl)}\n.tp .tp-e i.kr.nasz{border:2px solid var(--tp-zl2)}\n.tp .tp-e i.kr.inny{background:var(--tp-cichy);opacity:.55}\n.tp .tp-scroll{overflow-x:auto}\n/* A: mapa */\n.tp table.tp-heat{border-collapse:separate;border-spacing:3px;width:100%;min-width:620px}\n.tp table.tp-heat th{font:600 11px ui-monospace,Menlo,monospace;color:var(--tp-cichy);text-align:center;padding:4px;letter-spacing:.04em;border:0;background:transparent}\n.tp table.tp-heat th.l{text-align:left}\n.tp table.tp-heat td{padding:0;border:0}\n.tp table.tp-heat td.para{padding:6px 10px;background:var(--tp-pan);border-radius:6px;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis;font-weight:500}\n.tp table.tp-heat td.para small{display:block;font:11px ui-monospace,Menlo,monospace;color:var(--tp-cichy);font-weight:400}\n.tp table.tp-heat td.sila{font:600 13px ui-monospace,Menlo,monospace;text-align:center;background:var(--tp-pan);border-radius:6px;padding:0 8px}\n.tp td.c.c{height:40px;min-width:64px;text-align:center;font:600 13px ui-monospace,Menlo,monospace;border-radius:6px;color:var(--tp-tx);\n  background:color-mix(in srgb,var(--tp-plus) calc(var(--a,0) * 100%),var(--tp-pan2))}\n.tp td.c.c.m{background:color-mix(in srgb,var(--tp-minus) calc(var(--a,0) * 100%),var(--tp-pan2))}\n.tp td.c.mocny{color:var(--tp-na)}\n.tp td.c.c.pusty{background:transparent;border:1px dashed var(--tp-linia);color:var(--tp-cichy)}\n.tp td.c .ile{font-size:10px;opacity:.75}\n.tp table.tp-heat tr.grp td{font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tp-zl);padding:12px 4px 2px;background:transparent}\n.tp table.tp-heat tr.wiersz{cursor:pointer}\n.tp table.tp-heat tr.wiersz:hover td.para,.tp table.tp-heat tr.wiersz.akt td.para{background:var(--tp-pan2);box-shadow:inset 3px 0 0 var(--tp-zl)}\n.tp table.tp-heat tr.klub td.para{background:transparent;color:var(--tp-zl);font-weight:700}\n.tp tbody tr:hover > td.c{filter:brightness(1.04)}\n.tp .tp-legenda{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font:11px ui-monospace,Menlo,monospace;color:var(--tp-cichy);margin-top:10px}\n.tp .tp-legenda .gr{width:160px;height:10px;border-radius:5px;background:linear-gradient(90deg,var(--tp-minus),var(--tp-pan2) 50%,var(--tp-plus))}\n.tp .tp-objasn{background:var(--tp-pan);border-radius:8px;padding:12px 14px;margin-top:12px;font-size:.9rem;line-height:1.55;min-height:48px}\n.tp .tp-objasn b{color:var(--tp-zl)}\n.tp .tp-wzorzec{border-left:3px solid var(--tp-zl);padding:4px 0 4px 14px;margin-top:14px;font-size:.92rem;line-height:1.55;max-width:90ch}\n.tp .tp-wzorzec:empty{display:none}\n.tp .tp-link{border:0;background:transparent;color:var(--tp-zl);font:inherit;font-weight:700;cursor:pointer;padding:0 0 0 6px;text-decoration:underline;text-underline-offset:2px}\n/* B: karta pary */\n.tp .tp-kafle{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:16px}\n.tp .tp-kafle > div{background:var(--tp-pan);border-radius:8px;padding:12px}\n.tp .tp-kafle .n{font-size:1.6rem;font-weight:700;line-height:1}\n.tp .tp-kafle .o{font-size:.8rem;color:var(--tp-cichy);margin-top:4px}\n.tp .tp-paski{display:grid;gap:12px}\n.tp .tp-os{display:grid;grid-template-columns:130px 1fr 96px;gap:12px;align-items:center}\n.tp .tp-os .n{font-size:.9rem;font-weight:500}\n.tp .tp-os .r{font:600 13px ui-monospace,Menlo,monospace;text-align:right}\n.tp .tp-os .r small{display:block;color:var(--tp-cichy);font-size:11px;font-weight:400}\n.tp .tp-os svg{width:100%;height:34px;display:block;overflow:visible}\n.tp svg line.os{stroke:var(--tp-linia)}\n.tp svg line.med{stroke:var(--tp-cichy);stroke-dasharray:2 2}\n.tp svg circle.inny{fill:var(--tp-cichy);fill-opacity:.5}\n.tp svg circle.nasz{fill:none;stroke:var(--tp-zl2);stroke-width:1.8}\n.tp svg circle.ja{fill:var(--tp-zl);stroke:var(--tp-karta);stroke-width:2}\n.tp .tp-wnioski{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}\n.tp .tp-wnioski > div{background:var(--tp-pan);border-radius:8px;padding:12px 14px;font-size:.88rem;line-height:1.55}\n/* C: przed turniejem */\n.tp .tp-dwie{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:18px}\n.tp svg.tp-las{width:100%;display:block}\n.tp svg.tp-las rect.zas{fill:var(--tp-pan2)}\n.tp svg.tp-las text{font-size:10.5px;font-family:system-ui,sans-serif}\n.tp svg.tp-las text.inny{fill:var(--tp-cichy)}\n.tp svg.tp-las text.nasz{fill:var(--tp-tx)}\n.tp svg.tp-las text.ja{fill:var(--tp-tx);font-weight:700}\n.tp svg.tp-las line.u{stroke-width:1.5;stroke-opacity:.5}\n.tp svg.tp-las line.u.ja{stroke-opacity:1}\n.tp svg.tp-las .inny{stroke:var(--tp-cichy)}\n.tp svg.tp-las circle.inny{fill:var(--tp-cichy);stroke:none}\n.tp svg.tp-las .nasz{stroke:var(--tp-zl2)}\n.tp svg.tp-las circle.nasz{fill:var(--tp-zl2);stroke:none}\n.tp svg.tp-las .ja{stroke:var(--tp-zl)}\n.tp svg.tp-las circle.ja{fill:var(--tp-zl);stroke:none}\n.tp svg.tp-las text.nasz,.tp svg.tp-las text.ja,.tp svg.tp-las text.inny{stroke:none}\n.tp svg.tp-las line.fin{stroke:var(--tp-zl);stroke-dasharray:4 3;stroke-opacity:.8}\n.tp svg.tp-las text.fin{fill:var(--tp-zl);font:9.5px ui-monospace,Menlo,monospace}\n.tp table.tp-mecz{border-collapse:separate;border-spacing:3px;width:100%}\n.tp table.tp-mecz th{font:600 11px ui-monospace,Menlo,monospace;color:var(--tp-cichy);padding:4px;text-align:center;border:0;background:transparent}\n.tp table.tp-mecz th.l{text-align:left}\n.tp table.tp-mecz td{border:0}\n.tp table.tp-mecz td.c{height:30px;min-width:46px;font-size:12px;padding:0 4px}\n.tp table.tp-mecz td.kto{text-align:left;background:var(--tp-pan);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;padding:0 8px;border-radius:5px;height:30px}\n.tp table.tp-mecz td.kto small{color:var(--tp-cichy);font:11px ui-monospace,Menlo,monospace}\n.tp .tp-prior{display:grid;gap:8px}\n.tp .tp-prior div{display:grid;grid-template-columns:118px 1fr 40px;gap:10px;align-items:center;font-size:.88rem}\n.tp .tp-prior .bar{height:10px;background:var(--tp-pan2);border-radius:5px;overflow:hidden}\n.tp .tp-prior .bar i{display:block;height:100%;background:var(--tp-zl)}\n.tp .tp-prior .v{font:600 13px ui-monospace,Menlo,monospace;text-align:right}\n/* D: dziennik pary (13.10.2026) */\n.tp .tp-kafle > div.zl{box-shadow:inset 3px 0 0 var(--tp-zl)}\n.tp .tp-kafle .n.plus{color:var(--tp-plus)}\n.tp .tp-kafle .n.minus{color:var(--tp-minus)}\n.tp .tp-sygn{display:grid;gap:6px;margin-bottom:16px}\n.tp .tp-sygn:empty{display:none}\n.tp .tp-sygn .s{border-left:3px solid var(--tp-cichy);background:var(--tp-pan);border-radius:0 8px 8px 0;padding:8px 12px;font-size:.88rem;line-height:1.45}\n.tp .tp-sygn .s.m{border-left-color:var(--tp-minus)}\n.tp .tp-sygn .s.u{border-left-color:var(--tp-zl)}\n.tp .tp-sklad{display:grid;gap:4px;background:var(--tp-pan);border-radius:8px;padding:10px 12px;font-size:.86rem}\n.tp .tp-sklad div{display:flex;justify-content:space-between;gap:12px}\n.tp .tp-sklad b{font:600 12px ui-monospace,Menlo,monospace;white-space:nowrap}\n.tp .tp-dz{align-items:start}\n.tp .tp-form{display:grid;gap:10px;margin-top:12px;background:var(--tp-pan);border-radius:10px;padding:14px}\n.tp .tp-wiersz{display:flex;flex-wrap:wrap;gap:10px}\n.tp .tp-pole{display:grid;gap:4px;font-size:.8rem;color:var(--tp-cichy);min-width:130px;flex:1 1 130px}\n.tp .tp-pole b{color:var(--tp-tx);font-size:.95rem;padding:7px 0}\n.tp .tp-pole.tp-pelne{flex-basis:100%}\n.tp .tp-form input[type=date],.tp .tp-form select,.tp .tp-form textarea{font:inherit;font-size:.9rem;padding:7px 9px;border-radius:7px;border:1px solid var(--tp-linia);background:var(--tp-karta);color:var(--tp-tx);width:100%}\n.tp .tp-form textarea{resize:vertical;min-height:52px}\n.tp .tp-suw{display:grid;grid-template-columns:minmax(120px,190px) 1fr 34px;gap:10px;align-items:center;font-size:.88rem}\n.tp .tp-suw .n small{display:block;font-size:.72rem;color:var(--tp-cichy);line-height:1.3}\n.tp .tp-suw input{width:100%;accent-color:var(--tp-zl)}\n.tp .tp-suw output{font:700 14px ui-monospace,Menlo,monospace;text-align:right}\n.tp .tp-skala{border:0;margin:0;padding:0;min-width:0}\n.tp .tp-skala legend{font-size:.88rem;font-weight:600;margin-bottom:6px;padding:0}\n.tp .tp-skala > div{display:flex;flex-wrap:wrap;gap:4px}\n.tp .tp-skala label{position:relative}\n.tp .tp-skala input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}\n.tp .tp-skala span{display:block;padding:7px 11px;border-radius:7px;background:var(--tp-karta);border:1px solid var(--tp-linia);font-size:.84rem;cursor:pointer;min-width:36px;text-align:center}\n.tp .tp-skala input:checked + span{background:var(--tp-zl);border-color:var(--tp-zl);color:var(--tp-na);font-weight:700}\n.tp .tp-skala input:focus-visible + span{outline:2px solid var(--tp-zl);outline-offset:1px}\n.tp .tp-check{font-size:.84rem;color:var(--tp-cichy);display:flex;gap:6px;align-items:center}\n.tp .tp-skutek{font-size:.84rem;line-height:1.45;border-left:3px solid var(--tp-zl);padding:2px 0 2px 10px}\n.tp .tp-akcje{display:flex;gap:12px;align-items:center;flex-wrap:wrap}\n.tp .tp-przycisk{border:0;border-radius:8px;background:var(--tp-zl);color:var(--tp-na);font:inherit;font-weight:700;padding:9px 18px;cursor:pointer}\n.tp .tp-przycisk:focus-visible{outline:2px solid var(--tp-tx);outline-offset:2px}\n.tp .tp-dzmsg{font-size:.86rem;margin-top:8px;min-height:1.3em;color:var(--tp-plus)}\n.tp .tp-dzmsg.zle{color:var(--tp-minus)}\n.tp .tp-komp{display:grid;gap:8px}\n.tp .tp-komp > div{display:grid;grid-template-columns:150px 1fr 52px;gap:10px;align-items:center;font-size:.88rem}\n.tp .tp-komp .bar{position:relative;height:10px;background:var(--tp-pan2);border-radius:5px}\n.tp .tp-komp .bar i{display:block;height:100%;background:var(--tp-zl);border-radius:5px}\n.tp .tp-komp .bar em{position:absolute;top:-3px;width:2px;height:16px;background:var(--tp-tx);opacity:.55}\n.tp .tp-komp .v{font:600 13px ui-monospace,Menlo,monospace;text-align:right}\n.tp .tp-komp .v small{display:block;font-size:10.5px}\n.tp .plus{color:var(--tp-plus)}\n.tp .minus{color:var(--tp-minus)}\n.tp .tp-hist{display:grid;gap:6px;max-height:440px;overflow-y:auto;padding-right:2px}\n.tp .tp-wpis{background:var(--tp-pan);border-radius:8px;padding:8px 12px;font-size:.86rem;line-height:1.45;border-left:3px solid var(--tp-linia)}\n.tp .tp-wpis.oc{border-left-color:var(--tp-zl)}\n.tp .tp-wpis.zd{border-left-color:var(--tp-minus)}\n.tp .tp-wpis.od{border-left-color:var(--tp-plus)}\n.tp .tp-wpis .g{display:flex;gap:6px;align-items:baseline}\n.tp .tp-wpis .o{color:var(--tp-cichy);font-size:.8rem}\n.tp .tp-wpis .nt{margin-top:3px;white-space:pre-wrap}\n.tp .tp-usun{margin-left:auto;border:0;background:transparent;color:var(--tp-cichy);font:inherit;font-size:.76rem;cursor:pointer;text-decoration:underline}\n.tp .tp-dzstopka{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:12px}\n.tp .tp-dzstopka .tp-cichy{margin-right:auto}\n.tp label.tp-link{display:inline-block}\n.tp svg.tp-las circle.dz{fill:none;stroke:var(--tp-zl);stroke-width:2}\n.tp [hidden]{display:none !important}\n@media (max-width:820px){\n  .tp .tp-karta{padding:14px}\n  .tp .tp-dwie,.tp .tp-wnioski{grid-template-columns:1fr}\n  .tp .tp-os{grid-template-columns:92px 1fr 72px;gap:8px}\n  .tp .tp-widoki{display:flex}\n  .tp .tp-widoki button{flex:1 1 0;padding:9px 8px;font-size:.88rem}\n  .tp .tp-widoki:has(> :nth-child(4)){display:grid;grid-template-columns:1fr 1fr}\n  .tp > .tp-karta{min-width:0}\n  .tp .tp-kafle{grid-template-columns:1fr 1fr}\n  .tp .tp-kafle .n{font-size:1.35rem}\n  .tp .tp-sklad div{flex-wrap:wrap;gap:2px 12px}\n  .tp .tp-suw{grid-template-columns:1fr 34px}\n  .tp .tp-suw input{grid-column:1 / -1;grid-row:2}\n  .tp .tp-komp > div{grid-template-columns:110px 1fr 46px}\n}\n"; document.head.appendChild(s); })();
// ===================== TAŃCE PAR — analiza turniejowa dla trenera (panel Teamu od 9.10.2026; Scout „TEAM forma” z opcjami w TP_DANE.opcje) =====================
// Źródło liczb: PTT Scout (kolektor/tance.py → sila_tance, ranking siły `sila`), zrzut z dnia w TP_DANE.na_dzien.
// Siła w tańcu = siła pary + poprawka za taniec (porównania taniec po tańcu z parami w tych samych rundach).
// Moduł jest samodzielny: wołany z showTab('tance') przez tanceParPokaz(); nic nie zapisuje.
// Kolory WYŁĄCZNIE przez zmienne --tp-* (tryb ciemny panelu przemalowuje jawne kolory w regułach i style="").
(function () {
  'use strict';
  var D = TP_DANE;
  // Opcje osadzenia (Scout „TEAM forma” podaje własne); domyślne = panel Teamu dla Maćka.
  var O = Object.assign({ tytul: '💃 Tańce par', pod: 'analiza turniejowa · tylko dla trenera', naglowekC: 'Puchar Klas FEDCBA · 10.10',
    dopisek: 'zrzut — aktualizowany ręcznie', lsKlucz: 'takt_tance_par', domyslna: 'Cieślik',
    kolej: ['Dzieci i juniorzy (do 15)', 'Młodzież i dorośli (16+)', 'Dorośli 19+ i Pre-Senior', 'Seniorzy (30+)'] }, D.opcje || {});
  var MIN = 12, FINAL = 6, KLUB = O.klub || 'TEAM - Ornontowice';   // nazwa klubu w PTT (RS: 'RS - WARSZAWA')
  var DZ = !!O.dziennik;   // 4. widok „Dziennik pary” (13.10.2026) — na razie tylko Scout; panele TAKT bez zmian
  var WIDOKI = DZ ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c'];
  var TANCE = { ST: ['WA', 'T', 'WW', 'F', 'Q'], LA: ['CC', 'S', 'R', 'PD', 'JV'] };
  TANCE.KOMB = TANCE.ST.concat(TANCE.LA);
  var NAZWA = { WA: 'Walc angielski', T: 'Tango', WW: 'Walc wiedeński', F: 'Foxtrot', Q: 'Quickstep', CC: 'Cha-cha', S: 'Samba', R: 'Rumba', PD: 'Paso doble', JV: 'Jive' };
  var KROTKO = { WA: 'Walc ang.', T: 'Tango', WW: 'Walc wied.', F: 'Foxtrot', Q: 'Quickstep', CC: 'Cha-cha', S: 'Samba', R: 'Rumba', PD: 'Paso doble', JV: 'Jive' };
  var STYL = { ST: 'Standard', LA: 'Latin', KOMB: 'Kombinacja' };
  var KOLEJ = O.kolej;

  function h(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function zn(v) { var r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r); }
  function szansa(d) { return Math.round(100 / (1 + Math.pow(10, -d / 400))); }
  function kr(n) { var s = n.split(' & ').map(function (x) { return x.split(' ')[0]; }).join(' / '); return s.length > 24 ? s.slice(0, 23) + '…' : s; }
  function pop(x, t) { var v = x.t && x.t[t]; return v && v[1] >= MIN ? v[0] : null; }
  function sw(x, t) { var d = pop(x, t); return d == null || x.s == null ? null : x.s + d; }
  function nasz(x) { return !!(x.team || x.k === KLUB); }
  // Komórka mapy: kierunek klasą (p/m), natężenie zmienną --a — kolor składa CSS z palety motywu.
  function kom(d, skala, tresc, tytul) {
    var a = Math.min(1, Math.abs(d) / (skala || 90));
    return '<td class="c ' + (d >= 0 ? 'p' : 'm') + (a > 0.5 ? ' mocny' : '') + '" style="--a:' + a.toFixed(2) + '"' + (tytul ? ' title="' + h(tytul) + '"' : '') + '>' + tresc + '</td>';
  }
  function grupa(p) {
    var n = parseInt(p.przedzial, 10);
    return isNaN(n) || n < 16 ? KOLEJ[0] : n >= 30 ? KOLEJ[3] : n >= 19 ? KOLEJ[2] : KOLEJ[1];
  }
  function odmPoj(n) { return n === 1 ? 'pojedynek' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'pojedynki' : 'pojedynków'; }

  // Rozpakowanie: wspólna tablica par (P) → stawki jako obiekty
  var PARY = D.zestawy.map(function (z) {
    var st = z.st.map(function (i) { return D.P[i]; });
    return { id: z.id, para: z.para, styl: z.styl, przedzial: z.przedzial, klasa: z.klasa, stawka: st, my: D.P[z.my] };
  }).filter(function (p) { return p.my && p.my.s != null; });
  var TURNIEJ = D.turniej.map(function (k) {
    return { naglowek: k.naglowek, obsada: k.obsada, styl: k.styl, turniej: k.turniej, data: k.data, stawka: k.st.map(function (i) { return D.P[i]; }) };
  });

  var stan = { widok: 'a', stylA: 'ST', parB: null, katC: 0, parC: null };
  try { var zap = JSON.parse(localStorage.getItem(O.lsKlucz) || 'null'); if (zap && typeof zap === 'object') Object.assign(stan, zap); } catch (e) {}
  function zapamietaj() { try { localStorage.setItem(O.lsKlucz, JSON.stringify(stan)); } catch (e) {} }
  var root = null;
  function $(id) { return root.querySelector('#' + id); }

  function szkielet() {
    return '<div class="tp">' +
      '<div class="tp-karta tp-gora">' +
        '<div class="tp-tytul"><h2>' + h(O.tytul) + '</h2><span class="tp-pod">' + h(O.pod) + '</span></div>' +
        '<p class="tp-lead">W którym tańcu każda para jest najmocniejsza, w którym najsłabsza, jak wypada na tle rywali ze swojej kategorii i co trenować przed najbliższym turniejem.</p>' +
        '<div class="tp-meta" id="tpMeta"></div>' +
        '<details class="tp-jak"><summary>Jak czytać liczby</summary>' +
          '<p>Sędziowie PTT dają w każdym tańcu krzyżyk albo miejsce. Z tego liczymy dla każdej pary <b>siłę w tańcu</b>: jej ogólną siłę z rankingu plus poprawkę za dany taniec. Poprawka bierze się z porównań taniec po tańcu z innymi parami w tych samych rundach, przy tych samych sędziach.</p>' +
          '<div class="tp-liczby"><div><b>+50 pkt</b><span>w tym tańcu para wygrywa 57% starć z parą o tej samej ogólnej sile</span></div>' +
          '<div><b>+100 pkt</b><span>64% starć; −100 pkt oznacza 36%</span></div>' +
          '<div><b>12 mies.</b><span>okno danych; taniec pokazujemy od ' + MIN + ' porównań, a małe próbki ściągamy do zera</span></div></div>' +
          '<p class="tp-cichy">Liczby mówią, w którym tańcu para traci, ale nie dlaczego. W PTT nie ma osobnych ocen za technikę czy muzyczność, więc przyczynę ocenia trener.</p>' +
        '</details>' +
        '<div class="tp-seg tp-widoki" role="tablist" aria-label="Widok">' +
          '<button type="button" role="tab" data-w="a">Tablica klubu</button>' +
          '<button type="button" role="tab" data-w="b">Karta pary</button>' +
          '<button type="button" role="tab" data-w="c">Przed turniejem</button>' +
          (DZ ? '<button type="button" role="tab" data-w="d">Dziennik pary</button>' : '') +
        '</div>' +
      '</div>' +
      // A
      '<div class="tp-karta tp-widok" data-w="a">' +
        '<div class="tp-pasek"><div class="tp-h">Tańce par klubu <small>poprawka za taniec, pkt siły</small></div>' +
          '<div class="tp-seg" id="tpStylA" role="group" aria-label="Styl">' +
            '<button type="button" data-s="ST">Standard</button><button type="button" data-s="LA">Latin</button><button type="button" data-s="KOMB">Kombinacja</button></div></div>' +
        '<p class="tp-cichy tp-opis">Kolor pokazuje, czy taniec ciągnie parę w górę, czy w dół. Dolny wiersz to średnia klubu. Kliknij parę, żeby zobaczyć opis.</p>' +
        '<div class="tp-scroll"><table class="tp-heat" id="tpHeat"></table></div>' +
        '<div class="tp-legenda"><span>słabszy taniec</span><span class="gr"></span><span>mocniejszy taniec</span><span>· kreska = taniec poza programem albo za mało ocen</span></div>' +
        '<div class="tp-objasn" id="tpObjA">Kliknij parę, żeby zobaczyć opis.</div>' +
        '<div class="tp-wzorzec" id="tpWzorce"></div>' +
      '</div>' +
      // B
      '<div class="tp-karta tp-widok" data-w="b">' +
        '<div class="tp-pasek"><div class="tp-h">Karta pary <small id="tpKatB"></small></div>' +
          '<select id="tpParaB" aria-label="Para"></select></div>' +
        '<p class="tp-cichy tp-opis">Wybrana para i wszyscy rywale z jej kategorii z ostatnich 12 miesięcy, w każdym tańcu na osobnej osi.</p>' +
        '<div class="tp-kafle" id="tpKafleB"></div>' +
        '<div class="tp-e">Siła w tańcu · <i class="kr ja"></i> wybrana para · <i class="kr nasz"></i> inne pary klubu · <i class="kr inny"></i> rywale · przerywana kreska = mediana</div>' +
        '<div class="tp-paski" id="tpPaskiB"></div>' +
        '<div class="tp-wnioski" id="tpWnB"></div>' +
      '</div>' +
      // C
      '<div class="tp-karta tp-widok" data-w="c">' +
        '<div class="tp-pasek"><div class="tp-h"><span id="tpTytC">' + h(O.naglowekC) + '</span> <small id="tpOpisC"></small></div>' +
          '<div class="tp-wybory"><select id="tpKatC" aria-label="Kategoria"></select><select id="tpParaC" aria-label="Para"></select></div></div>' +
        '<p class="tp-cichy tp-opis">Prawdziwe listy zgłoszeń. Raport pokazuje, gdzie para stoi w obsadzie, z kim jest w zasięgu i w którym tańcu z nim wygrywa albo przegrywa. Na dole: ilu rywali para przestałaby przegrywać w danym tańcu, gdyby poprawiła go o 50 punktów.</p>' +
        '<div class="tp-dwie">' +
          '<div><div class="tp-e">Obsada według siły · kreska = niepewność · jasny pas = w zasięgu</div><svg class="tp-las" id="tpLas" role="img" aria-label="Obsada według siły"></svg></div>' +
          '<div><div class="tp-e">Pojedynki taniec po tańcu</div><div class="tp-scroll"><table class="tp-mecz" id="tpMecz"></table></div>' +
            '<div class="tp-e" style="margin-top:16px">Priorytet treningu · +50 pkt w tańcu = ilu rywali więcej</div><div class="tp-prior" id="tpPrior"></div></div>' +
        '</div>' +
        '<div class="tp-objasn" id="tpObjC"></div>' +
        '<p class="tp-cichy" style="margin-top:10px">Linia finału na 6 parach to założenie. Pary bez rankingu siły (debiut albo za mało startów) nie są na wykresie.' +
          (DZ ? ' Pusty złoty krążek = siła z dziennikiem trenera.' : '') + '</p>' +
      '</div>' +
      (DZ ? szkieletD() : '') +
    '</div>';
  }

  function przelaczWidok(w) {
    stan.widok = w; zapamietaj();
    root.querySelectorAll('.tp-widoki button').forEach(function (b) { var on = b.dataset.w === w; b.setAttribute('aria-selected', on); b.classList.toggle('on', on); });
    root.querySelectorAll('.tp-widok').forEach(function (s) { s.hidden = s.dataset.w !== w; });
    if (w === 'd' && DZ) { $('tpParaD').value = stan.parB || $('tpParaB').value; rysujD(); }
  }

  // ── A: tablica klubu ──
  function rysujA() {
    var styl = stan.stylA, kody = TANCE[styl], pary = PARY.filter(function (p) { return p.styl === styl; });
    root.querySelectorAll('#tpStylA button').forEach(function (b) { var on = b.dataset.s === styl; b.setAttribute('aria-pressed', on); b.classList.toggle('on', on); });
    var uzyte = kody.filter(function (t) { return pary.some(function (p) { return pop(p.my, t) != null; }); });
    var w = '<thead><tr><th class="l">Para · kategoria</th><th>Siła</th>' + uzyte.map(function (t) { return '<th title="' + NAZWA[t] + '">' + KROTKO[t] + '</th>'; }).join('') + '</tr></thead><tbody>';
    KOLEJ.forEach(function (g) {
      var wg = pary.filter(function (p) { return grupa(p) === g && uzyte.filter(function (t) { return pop(p.my, t) != null; }).length >= 2; }).sort(function (a, b) { return b.my.s - a.my.s; });
      if (!wg.length) return;
      w += '<tr class="grp"><td colspan="' + (uzyte.length + 2) + '">' + g + '</td></tr>';
      wg.forEach(function (p) {
        w += '<tr class="wiersz" tabindex="0" data-k="' + p.id + '"><td class="para">' + h(p.para) + '<small>' + h(p.przedzial) + ' ' + h(p.klasa) + ' · stawka ' + p.stawka.length + ' par</small></td><td class="sila">' + p.my.s + '</td>' +
          uzyte.map(function (t) { var v = pop(p.my, t); return v == null ? '<td class="c pusty">–</td>' : kom(v, 90, zn(v), NAZWA[t] + ': ' + szansa(v) + '% starć z parą równą sobie'); }).join('') + '</tr>';
      });
    });
    var sr = uzyte.map(function (t) {
      var v = pary.map(function (p) { return pop(p.my, t); }).filter(function (x) { return x != null; });
      return v.length ? { t: t, s: v.reduce(function (a, b) { return a + b; }, 0) / v.length, n: v.length, m: v.filter(function (x) { return x < -15; }).length } : null;
    });
    w += '<tr class="grp"><td colspan="' + (uzyte.length + 2) + '">Klub</td></tr><tr class="klub"><td class="para">Średnio w klubie<small>ile par poniżej −15</small></td><td class="sila">–</td>' +
      sr.map(function (s) { return s ? kom(s.s, 90, zn(s.s) + '<br><span class="ile">' + s.m + '/' + s.n + '</span>') : '<td class="c pusty">–</td>'; }).join('') + '</tr></tbody>';
    var tab = $('tpHeat'); tab.innerHTML = w;
    tab.querySelectorAll('tr.wiersz').forEach(function (r) {
      var f = function () { opiszA(+r.dataset.k, r); };
      r.onclick = f; r.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } };
    });
    $('tpObjA').textContent = 'Kliknij parę, żeby zobaczyć opis.';
    var ok = sr.filter(function (z) { return z && z.n >= 3; }).sort(function (a, b) { return a.s - b.s; });
    var nazwaStylu = styl === 'ST' ? 'standardzie' : styl === 'LA' ? 'latynie' : 'kombinacji';
    $('tpWzorce').innerHTML = ok.length ? '<b>Wzorzec w ' + nazwaStylu + ':</b> najsłabiej klub wypada w tańcu <b>' + NAZWA[ok[0].t] + '</b> (średnio ' + zn(ok[0].s) + ', poniżej −15 u ' + ok[0].m + ' z ' + ok[0].n + ' par), ' +
      'najmocniej w tańcu <b>' + NAZWA[ok[ok.length - 1].t] + '</b> (' + zn(ok[ok.length - 1].s) + '). ' +
      (ok[0].m >= Math.max(2, ok[0].n / 3) ? 'Słabość powtarza się u wielu par, więc to temat na zajęcia grupowe, a nie tylko na lekcje indywidualne.' : 'Słabość nie powtarza się u większości par, więc to raczej sprawa pojedynczych par niż całej grupy.') : '';
  }
  function opiszA(id, r) {
    root.querySelectorAll('#tpHeat tr.akt').forEach(function (z) { z.classList.remove('akt'); }); r.classList.add('akt');
    var p = PARY.find(function (z) { return z.id === id && z.styl === stan.stylA; });
    var t = TANCE[stan.stylA].map(function (k) { return [k, pop(p.my, k)]; }).filter(function (z) { return z[1] != null; }).sort(function (a, b) { return b[1] - a[1]; });
    var btn = ' <button type="button" class="tp-link" data-karta="' + p.id + '|' + p.styl + '">Karta pary →</button>';
    if (t.length < 2) { $('tpObjA').innerHTML = '<b>' + h(p.para) + '</b>: za mało ocen, żeby porównać tańce.' + btn; return; }
    var mt = t[0][0], mv = t[0][1], st = t[t.length - 1][0], sv = t[t.length - 1][1], roz = mv - sv;
    $('tpObjA').innerHTML = '<b>' + h(p.para) + '</b> · ' + h(p.przedzial) + ' ' + h(p.klasa) + ' · siła ' + p.my.s + ' ±' + p.my.u + '<br>' +
      'Najmocniejszy: <b>' + NAZWA[mt] + '</b> (' + zn(mv) + '), czyli ' + szansa(mv) + '% starć z parą równą sobie. Najsłabszy: <b>' + NAZWA[st] + '</b> (' + zn(sv) + '), czyli ' + szansa(sv) + '%. ' +
      (roz < 40 ? 'Profil równy.' : roz > 110 ? 'Duża rozpiętość, więc najsłabszy taniec realnie kosztuje miejsca.' : 'Wyraźna, umiarkowana różnica.') + btn;
  }

  // ── wspólne: oś tańca ──
  function paski(pole, my, kody) {
    var wsz = [];
    pole.forEach(function (p) { kody.forEach(function (t) { var v = sw(p, t); if (v != null) wsz.push(v); }); });
    var lo = Math.min.apply(null, wsz) - 20, hi = Math.max.apply(null, wsz) + 20;
    var X = function (v) { return ((v - lo) / (hi - lo) * 100).toFixed(2); };
    var r = {}, w = '';
    kody.forEach(function (t) {
      var mine = sw(my, t);
      if (mine == null) { w += '<div class="tp-os"><div class="n">' + NAZWA[t] + '</div><div class="tp-cichy" style="font-size:12px">za mało ocen w tym tańcu</div><div></div></div>'; return; }
      var v = pole.map(function (p) { return { p: p, v: sw(p, t) }; }).filter(function (z) { return z.v != null; }).sort(function (a, b) { return b.v - a.v; });
      var ja = v.findIndex(function (z) { return z.p === my; }) + 1, og = v.filter(function (z) { return z.p.s > my.s; }).length + 1, med = v[Math.floor(v.length / 2)].v;
      r[t] = { r: ja, og: og, n: v.length };
      w += '<div class="tp-os"><div class="n">' + NAZWA[t] + '</div><svg aria-label="' + NAZWA[t] + ': ' + ja + '. z ' + v.length + '"><line class="os" x1="0" x2="100%" y1="17" y2="17"/>' +
        '<line class="med" x1="' + X(med) + '%" x2="' + X(med) + '%" y1="5" y2="29"/>' +
        v.filter(function (z) { return z.p !== my; }).map(function (z) {
          return nasz(z.p) ? '<circle class="nasz" cx="' + X(z.v) + '%" cy="17" r="5"><title>' + h(kr(z.p.n)) + '</title></circle>'
                           : '<circle class="inny" cx="' + X(z.v) + '%" cy="17" r="4"><title>' + h(kr(z.p.n)) + '</title></circle>';
        }).join('') +
        '<circle class="ja" cx="' + X(mine) + '%" cy="17" r="7"/></svg>' +
        '<div class="r">' + ja + '. z ' + v.length + '<small>' + zn(pop(my, t)) + ' · ' + szansa(pop(my, t)) + '%</small></div></div>';
    });
    return { w: w, r: r };
  }

  // ── B: karta pary ──
  function wypelnijB() {
    $('tpParaB').innerHTML = KOLEJ.map(function (g) {
      var w = PARY.filter(function (p) { return grupa(p) === g; }).sort(function (a, b) { return a.para.localeCompare(b.para, 'pl'); });
      return w.length ? '<optgroup label="' + g + '">' + w.map(function (p) { return '<option value="' + p.id + '|' + p.styl + '">' + h(p.para) + ' · ' + STYL[p.styl] + '</option>'; }).join('') + '</optgroup>' : '';
    }).join('');
    var dom = PARY.find(function (p) { return p.para.indexOf(O.domyslna) === 0 && p.styl === 'ST'; }) || PARY[0];
    var chce = stan.parB && PARY.some(function (p) { return p.id + '|' + p.styl === stan.parB; }) ? stan.parB : dom.id + '|' + dom.styl;
    $('tpParaB').value = chce;
  }
  function rysujB() {
    var k = $('tpParaB').value.split('|'), p = PARY.find(function (z) { return z.id === +k[0] && z.styl === k[1]; });
    if (!p) return;
    stan.parB = p.id + '|' + p.styl; zapamietaj();
    var pole = p.stawka.filter(function (x) { return x.s != null; }).sort(function (a, b) { return b.s - a.s; }), my = p.my;
    var kody = TANCE[p.styl].filter(function (t) { return pole.some(function (x) { return pop(x, t) != null; }); });
    $('tpKatB').textContent = p.przedzial + ' ' + p.klasa + ' ' + STYL[p.styl] + ' · ' + pole.length + ' par w stawce';
    var res = paski(pole, my, kody), r = res.r;
    var ok = Object.keys(r).sort(function (a, b) { return r[a].r - r[b].r || pop(my, b) - pop(my, a); });
    var poz = pole.indexOf(my) + 1;
    $('tpKafleB').innerHTML =
      '<div><div class="n">' + my.s + '</div><div class="o">siła ±' + my.u + '</div></div><div><div class="n">' + poz + '. / ' + pole.length + '</div><div class="o">miejsce w stawce wg siły</div></div>' +
      (ok.length ? '<div><div class="n">' + KROTKO[ok[0]] + '</div><div class="o">najlepiej na tle stawki (' + r[ok[0]].r + '.)</div></div><div><div class="n">' + KROTKO[ok[ok.length - 1]] + '</div><div class="o">najsłabiej na tle stawki (' + r[ok[ok.length - 1]].r + '.)</div></div>' : '');
    var dzr = dzDla(my.n, p.styl);
    if (dzr) $('tpKafleB').innerHTML += '<div class="zl"><div class="n">' + dzr.s + '</div><div class="o">z dziennikiem trenera (' + zn(dzr.korekta) + ', ±' + dzr.u + ')</div></div>';
    $('tpPaskiB').innerHTML = res.w;
    var lep = ok.filter(function (t) { return r[t].r < r[t].og; }), gor = ok.filter(function (t) { return r[t].r > r[t].og; }).reverse();
    var l = function (a, e) { return a.length ? a.map(function (t) { return '<b>' + NAZWA[t] + '</b>: ' + r[t].r + '., a według samej siły ' + r[t].og + '. (z ' + r[t].n + ')'; }).join('<br>') : e; };
    $('tpWnB').innerHTML = '<div><div class="tp-e">Ciągnie w górę</div>' + l(lep, 'Żaden taniec nie stoi wyżej niż sama siła.') + '</div><div><div class="tp-e">Ciągnie w dół</div>' + l(gor, 'Żaden taniec nie stoi niżej niż sama siła.') + '</div>';
  }

  // ── C: przed turniejem ──
  function krotkaKat(k) { return k.naglowek.replace(/ \([^)]*\)/, '').replace(' Puchar Klas', ''); }
  function wypelnijC() {
    if (!TURNIEJ.length) { root.querySelector('.tp-widok[data-w="c"]').innerHTML = '<div class="tp-h">Przed turniejem</div><p class="tp-cichy">W najbliższych tygodniach żadna para klubu nie jest zgłoszona na turniej.</p>'; return; }
    $('tpKatC').innerHTML = TURNIEJ.map(function (k, i) { return '<option value="' + i + '">' + (k.data ? h(k.data) + ' · ' : '') + h(krotkaKat(k)) + ' · ' + k.obsada + ' par</option>'; }).join('');
    $('tpKatC').value = String(stan.katC < TURNIEJ.length ? stan.katC : 0);
    kategoriaC(true);
  }
  function kategoriaC(start) {
    var k = TURNIEJ[+$('tpKatC').value];
    stan.katC = +$('tpKatC').value;
    var nasze = k.stawka.filter(function (x) { return x.team && x.s != null; });
    $('tpParaC').innerHTML = nasze.map(function (x) { return '<option value="' + h(x.n) + '">' + h(x.n) + '</option>'; }).join('');
    if (start && stan.parC && nasze.some(function (x) { return x.n === stan.parC; })) $('tpParaC').value = stan.parC;
    rysujC();
  }
  function rysujC() {
    var k = TURNIEJ[+$('tpKatC').value], kody = TANCE[k.styl];
    var pole = k.stawka.filter(function (x) { return x.s != null; }).sort(function (a, b) { return b.s - a.s; });
    var my = pole.find(function (x) { return x.n === $('tpParaC').value; });
    stan.parC = my ? my.n : null; zapamietaj();
    $('tpOpisC').textContent = k.naglowek.replace(' Puchar Klas', '') + ' · ' + k.obsada + ' par';
    if (k.turniej) $('tpTytC').textContent = k.turniej + (k.data ? ' · ' + k.data : '');
    if (!my) { $('tpObjC').textContent = 'Ta para nie ma jeszcze rankingu siły.'; $('tpLas').innerHTML = ''; $('tpMecz').innerHTML = ''; $('tpPrior').innerHTML = ''; return; }
    var zasieg = pole.filter(function (p) { return p !== my && Math.abs(p.s - my.s) <= Math.max(120, (p.u + my.u) / 2); });
    var W = 470, rh = 15, top = 6, H = top + pole.length * rh + 6, L = 166, R = W - 8;
    var lo = Math.min.apply(null, pole.map(function (p) { return p.s - p.u; })), hi = Math.max.apply(null, pole.map(function (p) { return p.s + p.u; }));
    var X = function (v) { return L + (v - lo) / (hi - lo) * (R - L); };
    var s = '';
    pole.forEach(function (p, i) {
      var y = top + i * rh + rh / 2, ja = p === my, kl = ja ? 'ja' : nasz(p) ? 'nasz' : 'inny';
      if (zasieg.indexOf(p) >= 0) s += '<rect class="zas" x="0" y="' + (y - rh / 2) + '" width="' + W + '" height="' + rh + '"/>';
      s += '<text class="t ' + kl + '" x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + (i + 1) + '. ' + h(kr(p.n)) + '</text>';
      s += '<line class="u ' + kl + '" x1="' + X(p.s - p.u) + '" x2="' + X(p.s + p.u) + '" y1="' + y + '" y2="' + y + '"/><circle class="k ' + kl + '" cx="' + X(p.s) + '" cy="' + y + '" r="' + (ja ? 4.5 : 3) + '"/>';
      if (i === FINAL - 1 && pole.length > FINAL) s += '<line class="fin" x1="0" x2="' + W + '" y1="' + (y + rh / 2) + '" y2="' + (y + rh / 2) + '"/><text class="fin" x="' + (W - 4) + '" y="' + (y + rh / 2 - 3) + '" text-anchor="end">linia finału</text>';
    });
    var dzr = dzDla(my.n, k.styl), dzTxt = '';
    if (dzr) {
      var iy = top + pole.indexOf(my) * rh + rh / 2, xs = Math.max(L, Math.min(R, X(dzr.s)));
      s += '<circle class="dz" cx="' + xs + '" cy="' + iy + '" r="5"><title>z dziennikiem trenera: ' + dzr.s + ' ±' + dzr.u + '</title></circle>';
      var pd = pole.filter(function (p) { return p !== my && p.s >= dzr.s; }).length + 1;
      dzTxt = ' Z dziennikiem trenera: <b>siła ' + dzr.s + ' ±' + dzr.u + '</b> (' + zn(dzr.korekta) + '), czyli ' + pd + '. miejsce' + (pd <= FINAL ? ', w strefie finału.' : ', ' + (pd - FINAL) + ' pod linią finału.');
    }
    var svg = $('tpLas'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = s;
    var naszeT = kody.filter(function (t) { return sw(my, t) != null; });
    var rywale = zasieg.filter(function (p) { return naszeT.filter(function (t) { return sw(p, t) != null; }).length >= 2; }).slice(0, 8);
    $('tpMecz').innerHTML = '<thead><tr><th class="l">Rywal</th>' + naszeT.map(function (t) { return '<th title="' + NAZWA[t] + '">' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rywale.length ? rywale.map(function (p) {
        return '<tr><td class="kto">' + h(kr(p.n)) + ' <small>' + p.s + '</small></td>' + naszeT.map(function (t) {
          var b = sw(p, t); if (b == null) return '<td class="c pusty">–</td>';
          var r = sw(my, t) - b; return kom(r, 150, zn(r), NAZWA[t] + ': ' + szansa(r) + '% szans');
        }).join('') + '</tr>';
      }).join('') : '<tr><td class="kto" colspan="' + (naszeT.length + 1) + '">Brak rywali w zasięgu z ocenami w tych tańcach.</td></tr>') + '</tbody>';
    var pr = naszeT.map(function (t) {
      return { t: t,
        n: rywale.filter(function (p) { var b = sw(p, t); return b != null && sw(my, t) < b && sw(my, t) + 50 >= b; }).length,
        g: rywale.filter(function (p) { var b = sw(p, t); return b != null && sw(my, t) < b; }).length };
    }).sort(function (a, b) { return b.n - a.n || b.g - a.g; });
    var mx = Math.max.apply(null, [1].concat(pr.map(function (z) { return z.n; })));
    $('tpPrior').innerHTML = pr.map(function (z) { return '<div><span>' + NAZWA[z.t] + '</span><span class="bar"><i style="width:' + (z.n / mx * 100) + '%"></i></span><span class="v">+' + z.n + '</span></div>'; }).join('');
    var poz = pole.indexOf(my) + 1, wyzej = rywale.filter(function (p) { return p.s > my.s; }).length, best = pr[0];
    $('tpObjC').innerHTML = '<b>' + h(my.n) + '</b>: ' + poz + '. siła w obsadzie ' + pole.length + ' par z rankingiem' +
      (poz <= FINAL ? ', w strefie finału' : ', ' + (poz - FINAL) + ' pod linią finału') + '. W zasięgu ' + rywale.length + ' par z ocenami, w tym ' + wyzej + ' wyżej. ' +
      (best && best.n ? 'Najwięcej daje <b>' + NAZWA[best.t] + '</b>: +50 pkt odwraca ' + best.n + ' ' + odmPoj(best.n) + '.' : (rywale.length ? 'Żaden taniec przy +50 pkt nie odwraca pojedynku, więc różnice z rywalami są ogólne, a nie w jednym tańcu.' : '')) + dzTxt;
  }

  // ── D: dziennik pary (13.10.2026, opcja O.dziennik) ──
  // Trener opisuje parę: ocena w 4 komponentach WDSF + „forma względem wyników”, zdarzenia (kontuzja, przerwa,
  // nowy partner…), odczucia pary. Siła z wyników zostaje NIETKNIĘTA — dziennik daje obok niej korektę trenera
  // i szerszą niepewność (wzory: Tennis Elo — kara za przerwę; Glicko — niepewność rośnie, gdy coś się zmienia).
  // Odczucia pary nie ruszają siły, tylko zapalają sygnały. Zapis: localStorage tego urządzenia (podgląd).
  var DZK = O.lsKlucz + '_dziennik';
  var KOMP = [['tq', 'Technika', 'postawa, balans, linie, trzymanie (WDSF: Technical Quality)'], ['mm', 'Muzyka', 'timing, rytm, interpretacja (Movement to Music)'],
              ['ps', 'Partnerowanie', 'prowadzenie, zgranie, kontakt (Partnering Skills)'], ['cp', 'Choreografia i prezentacja', 'układ, wyraz, prezentacja (Choreography & Presentation)']];
  // k = korekta siły (pkt), u = dodatkowa niepewność (pkt), dni = wygaszanie po zakończeniu; czas = ma datę „do”
  var ZDARZ = {
    kontuzja: { n: 'Kontuzja / niedyspozycja', k: -40, u: 60, dni: 30, czas: true },
    przerwa: { n: 'Przerwa w treningach', k: -50, u: 60, dni: 60, czas: true },
    choreo: { n: 'Nowa choreografia', k: 0, u: 40, dni: 45 },
    partner: { n: 'Zmiana partnera / partnerki', k: 0, u: 150, dni: 120 },
    oboz: { n: 'Obóz / zgrupowanie', k: 20, u: 0, dni: 45 },
    trener: { n: 'Zmiana trenera / klubu', k: 0, u: 60, dni: 90 },
    inne: { n: 'Inne (sama notatka)', k: 0, u: 0, dni: 0 }
  };
  var FORMA = [[-2, 'wyraźnie słabiej'], [-1, 'trochę słabiej'], [0, 'jak wyniki'], [1, 'trochę lepiej'], [2, 'wyraźnie lepiej']];
  var PKT_FORMA = 25, PELNA = 30, ZERO = 90;   // stopień formy = 25 pkt; pełna waga 30 dni, zero po 90
  var dz = { typ: 'ocena', msg: '' };

  // O.magazyn = { czytaj(): obiekt|null, zapisz(obiekt) } — panel TAKT trzyma dziennik w swojej bazie (Chmura+, kopia);
  // bez magazynu (Scout) — localStorage tej przeglądarki.
  var MAG = O.magazyn && typeof O.magazyn.czytaj === 'function' && typeof O.magazyn.zapisz === 'function' ? O.magazyn : null;
  function dzCzytaj() {
    try {
      var d = MAG ? MAG.czytaj() : JSON.parse(localStorage.getItem(DZK) || 'null');
      if (d && Array.isArray(d.wpisy)) return { v: 1, wpisy: d.wpisy.map(czysty).filter(Boolean) };
    } catch (e) {}
    return { v: 1, wpisy: [] };
  }
  function dzZapisz(d) { try { if (MAG) MAG.zapisz(JSON.parse(JSON.stringify(d))); else localStorage.setItem(DZK, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function dzis() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dni(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }   // b − a
  function plD(s) { var p = String(s).split('-'); return p.length === 3 ? +p[2] + '.' + p[1] + '.' + p[0] : s; }
  function poDacie(a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : (a.id < b.id ? -1 : 1); }
  function sr(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
  // „17.10” z listy zgłoszeń → ISO; bez roku, więc bierzemy najbliższy przyszły (albo świeżo miniony)
  function isoTurnieju(s) {
    var m = /^(\d{1,2})\.(\d{1,2})/.exec(s || ''); if (!m) return null;
    var t = new Date(), r = t.getFullYear(), iso = function (y) { return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); };
    return dni(dzis(), iso(r)) < -60 ? iso(r + 1) : iso(r);
  }
  function paraZ(klucz) { var k = String(klucz || '').split('|'); return PARY.find(function (z) { return z.id === +k[0] && z.styl === k[1]; }); }
  function wpisyPary(p) { return dzCzytaj().wpisy.filter(function (w) { return w.para === p.id && (!w.styl || w.styl === p.styl); }).sort(poDacie); }

  function wagaOceny(w, d) { var a = dni(w.data, d); return a < 0 ? 0 : a <= PELNA ? 1 : Math.max(0, 1 - (a - PELNA) / (ZERO - PELNA)); }
  function wagaZd(w, d) {
    var z = ZDARZ[w.rodzaj]; if (!z || dni(w.data, d) < 0) return 0;
    var koniec = z.czas ? w.do : w.data;
    if (!koniec || dni(koniec, d) <= 0) return 1;            // trwa
    return z.dni ? Math.max(0, 1 - dni(koniec, d) / z.dni) : 0;
  }
  function korektaZd(w, d) {
    var z = ZDARZ[w.rodzaj];
    if (w.rodzaj === 'przerwa') return dni(w.data, w.do || d) >= 56 ? -100 : -50;   // Tennis Elo: ~100 pkt po 8 tyg.
    return z.k;
  }
  // Siła z dziennikiem dla zestawu para × styl na dzień d
  function dzLicz(p, d) {
    d = d || dzis();
    var wp = wpisyPary(p), r = { s: p.my.s, u: p.my.u, korekta: 0, sklad: [], wpisy: wp }, u2 = p.my.u * p.my.u;
    var oc = wp.filter(function (w) { return w.typ === 'ocena' && w.forma != null; }).pop();
    if (oc && oc.forma) {
      var g = wagaOceny(oc, d);
      if (g > 0) { var k = oc.forma * PKT_FORMA * g; r.korekta += k; r.sklad.push({ o: 'Ocena trenera z ' + plD(oc.data) + ': ' + FORMA[oc.forma + 2][1] + ' niż wyniki', k: k, u: 0, g: g }); }
    }
    wp.forEach(function (w) {
      if (w.typ !== 'zdarzenie') return;
      var z = ZDARZ[w.rodzaj], g = wagaZd(w, d); if (!z || !g || (!z.k && !z.u)) return;
      var k = korektaZd(w, d) * g, u = z.u * (w.taniec ? 0.5 : 1) * g;
      r.korekta += k; u2 += u * u;
      r.sklad.push({ o: z.n + (w.taniec ? ' (' + NAZWA[w.taniec] + ')' : '') + ' od ' + plD(w.data) + (g < 1 ? ', wygasa' : ', trwa'), k: k, u: u, g: g });
    });
    r.korekta = Math.round(r.korekta); r.s = p.my.s + r.korekta; r.u = Math.round(Math.sqrt(u2));
    return r;
  }
  function dzSygnaly(p, r, d) {
    var s = [], od = r.wpisy.filter(function (w) { return w.typ === 'odczucie'; });
    if (!r.wpisy.length) return [['i', 'Brak wpisów. Zacznij od oceny trenera — wystarczy pytanie „czy para tańczy teraz lepiej, niż pokazują wyniki?”.']];
    var ost = od.slice(-3).filter(function (w) { return w.zgranie != null; });
    if (ost.length >= 2) { var z = sr(ost.map(function (w) { return w.zgranie; })); if (z <= 2.5) s.push(['m', 'Słabe zgranie w ostatnich ' + ost.length + ' wpisach (średnio ' + z.toFixed(1) + '/5).']); }
    var ciez = od.slice(-5).filter(function (w) { return w.wysilek >= 8; }).length;
    if (ciez >= 3) s.push(['m', 'Wysokie obciążenie: wysiłek 8+ w ' + ciez + ' z ostatnich 5 wpisów.']);
    var dni2 = {}; od.forEach(function (w) { if (w.kto !== 'para' && w.zgranie != null) (dni2[w.data] = dni2[w.data] || {})[w.kto] = w.zgranie; });
    Object.keys(dni2).sort().slice(-3).forEach(function (k) { var x = dni2[k]; if (x.on != null && x.ona != null && Math.abs(x.on - x.ona) >= 2) s.push(['u', plD(k) + ': partner i partnerka różnie oceniają zgranie (' + x.on + ' i ' + x.ona + '/5). Warto pogadać.']); });
    var tur = TURNIEJ.filter(function (k) { return k.styl === p.styl && k.stawka.some(function (x) { return x.n === p.my.n; }); })
      .map(function (k) { return { k: k, za: dni(d, isoTurnieju(k.data) || '2999-01-01') }; }).filter(function (x) { return x.za >= 0 && x.za <= 14; }).sort(function (a, b) { return a.za - b.za; })[0];
    var pew = od.filter(function (w) { return w.pewnosc != null; }).pop();
    if (tur) s.push([pew && pew.pewnosc <= 2 ? 'm' : 'i', 'Turniej za ' + tur.za + ' dni: ' + (tur.k.turniej || krotkaKat(tur.k)) + '.' + (pew ? ' Ostatnia pewność przed startem: ' + pew.pewnosc + '/5.' : ' Brak wpisu o pewności przed startem.')]);
    var ost1 = r.wpisy[r.wpisy.length - 1], wiek = dni(ost1.data, d);
    if (wiek > 30) s.push(['u', 'Ostatni wpis ' + wiek + ' dni temu. Ocena trenera traci wagę po 30 dniach i znika po 90.']);
    return s;
  }

  function szkieletD() {
    return '<div class="tp-karta tp-widok" data-w="d">' +
      '<div class="tp-pasek"><div class="tp-h">Dziennik pary <small id="tpKatD"></small></div><select id="tpParaD" aria-label="Para"></select></div>' +
      '<p class="tp-cichy tp-opis">Wiedza trenera obok liczb z turniejów. Siła z wyników zostaje bez zmian. Dziennik dokłada korektę trenera i poszerza niepewność, gdy w parze coś się zmieniło. Odczucia pary nie zmieniają siły, tylko zapalają sygnały.</p>' +
      '<div class="tp-kafle" id="tpKafleD"></div>' +
      '<div class="tp-sygn" id="tpSygD"></div>' +
      '<div class="tp-dwie tp-dz">' +
        '<div><div class="tp-e">Nowy wpis</div>' +
          '<div class="tp-seg" id="tpDzTyp" role="group" aria-label="Rodzaj wpisu"><button type="button" data-t="ocena">Ocena trenera</button><button type="button" data-t="zdarzenie">Zdarzenie</button><button type="button" data-t="odczucie">Odczucia pary</button></div>' +
          '<form id="tpDzForm" class="tp-form" autocomplete="off"></form><div id="tpDzMsg" class="tp-dzmsg" role="status"></div></div>' +
        '<div><div class="tp-e">Komponenty WDSF · ostatnie oceny trenera</div><div id="tpKompD" class="tp-komp"></div>' +
          '<div class="tp-e" style="margin-top:18px">Historia wpisów</div><div id="tpHistD" class="tp-hist"></div></div>' +
      '</div>' +
      '<details class="tp-jak"><summary>Jak dziennik wpływa na analizę</summary>' +
        '<p><b>Siła z wyników</b> (ranking Bradleya-Terry’ego z turniejów PTT) się nie zmienia. Obok niej liczymy <b>siłę z dziennikiem</b> = siła z wyników + korekta trenera, z własną niepewnością. W widoku „Przed turniejem” para dostaje drugi, pusty krążek.</p>' +
        '<div class="tp-liczby"><div><b>±25 pkt</b><span>za każdy stopień „formy względem wyników” (najwyżej ±50). Pełna waga przez 30 dni, potem maleje do zera w 90. dniu.</span></div>' +
          '<div><b>−50 / −100</b><span>przerwa w treningach krótsza / dłuższa niż 8 tygodni (wzór z Tennis Elo), wygasa przez 60 dni po powrocie</span></div>' +
          '<div><b>niepewność</b><span>zmiana partnera +150, kontuzja i przerwa +60, nowa choreografia +40 (w jednym tańcu +20) — prognoza robi się ostrożniejsza, siła się nie zmienia</span></div></div>' +
        '<p>Komponenty WDSF (technika, muzyka, partnerowanie, choreografia) to diagnoza dla trenera: pokazują, <i>dlaczego</i> taniec traci, czego PTT w protokole nie mówi. Na siłę wpływa tylko odpowiedź na pytanie o formę. Wagi są robocze; po sezonie da się je skalibrować, porównując prognozy z dziennikiem i bez niego z wynikami turniejów.</p>' +
        '<p class="tp-cichy">Zdrowie: przy kontuzji wystarczy „niedyspozycja” i daty, bez diagnozy. Wpisy widzi tylko trener. ' + (MAG ? 'Dziennik jest częścią danych panelu: idzie do kopii i synchronizuje się jak reszta.' : 'Ten podgląd zapisuje dziennik w pamięci tej przeglądarki — użyj eksportu, żeby mieć kopię.') + '</p>' +
      '</details>' +
      '<div class="tp-dzstopka"><span class="tp-cichy" id="tpDzIle"></span><button type="button" class="tp-link" data-dz="eksport">Eksport do pliku</button>' +
        '<label class="tp-link">Import z pliku<input type="file" accept="application/json,.json" id="tpDzImport" hidden></label></div>' +
    '</div>';
  }

  function suwak(nazwa, et, min, max, krok, war, opis) {
    return '<label class="tp-suw"><span class="n">' + et + (opis ? '<small>' + opis + '</small>' : '') + '</span>' +
      '<input type="range" name="' + nazwa + '" min="' + min + '" max="' + max + '" step="' + krok + '" value="' + war + '"><output>' + war + '</output></label>';
  }
  function skala(nazwa, et, opcje, war) {
    return '<fieldset class="tp-skala"><legend>' + et + '</legend><div>' + opcje.map(function (o) {
      return '<label><input type="radio" name="' + nazwa + '" value="' + o[0] + '"' + (String(o[0]) === String(war) ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function formD(p) {
    var f = $('tpDzForm'), t = dz.typ, wp = wpisyPary(p);
    root.querySelectorAll('#tpDzTyp button').forEach(function (b) { var on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    var dataP = '<label class="tp-pole"><span>Data</span><input type="date" name="data" value="' + dzis() + '" max="' + dzis() + '"></label>';
    var notka = '<label class="tp-pole tp-pelne"><span>Notatka</span><textarea name="notka" rows="2" maxlength="600" placeholder="co widać na sali, nad czym pracujemy"></textarea></label>';
    var h0 = '';
    if (t === 'ocena') {
      var pop0 = wp.filter(function (w) { return w.typ === 'ocena'; }).pop() || {};
      h0 = '<div class="tp-wiersz">' + dataP + '<div class="tp-pole"><span>Dotyczy</span><b>' + STYL[p.styl] + '</b></div></div>' +
        skala('forma', 'Jak para tańczy teraz w porównaniu z tym, co pokazują wyniki?', FORMA, 0) +
        '<div class="tp-e" style="margin:12px 0 4px">Komponenty WDSF, skala 1–10</div>' +
        KOMP.map(function (k) { return suwak(k[0], k[1], 1, 10, 0.5, pop0[k[0]] || 5, k[2]); }).join('') + notka;
    } else if (t === 'zdarzenie') {
      h0 = '<div class="tp-wiersz"><label class="tp-pole"><span>Co się stało</span><select name="rodzaj">' + Object.keys(ZDARZ).map(function (k) { return '<option value="' + k + '">' + ZDARZ[k].n + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="tp-wiersz">' + dataP.replace('<span>Data</span>', '<span>Od</span>') + '<label class="tp-pole" data-tylko="czas"><span>Do (puste = trwa)</span><input type="date" name="do"></label>' +
          '<label class="tp-pole" data-tylko="choreo"><span>Taniec</span><select name="taniec"><option value="">cały styl</option>' + TANCE[p.styl].map(function (k) { return '<option value="' + k + '">' + NAZWA[k] + '</option>'; }).join('') + '</select></label></div>' +
        '<label class="tp-check"><input type="checkbox" name="tenStyl"> tylko ' + STYL[p.styl] + ' (domyślnie oba style pary)</label>' +
        '<div class="tp-skutek" id="tpDzSkutek"></div>' + notka;
    } else {
      h0 = '<div class="tp-wiersz">' + dataP + '<label class="tp-pole"><span>Kto</span><select name="kto"><option value="para">para razem</option><option value="on">partner</option><option value="ona">partnerka</option></select></label>' +
          '<label class="tp-pole"><span>Po czym</span><select name="po"><option value="trening">treningu</option><option value="turniej">turnieju</option><option value="przed">przed startem</option></select></label></div>' +
        suwak('wysilek', 'Wysiłek', 0, 10, 1, 5, '0 = odpoczynek, 10 = maksymalny (skala sRPE)') +
        skala('zgranie', 'Jak nam się tańczyło razem', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], 3) +
        skala('pewnosc', 'Pewność przed startem', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], 3) + notka;
    }
    f.innerHTML = h0 + '<div class="tp-akcje"><button type="submit" class="tp-przycisk">Zapisz wpis</button><span class="tp-cichy">' + h(p.para) + '</span></div>';
    f.querySelectorAll('input[type=range]').forEach(function (r) { r.oninput = function () { r.nextElementSibling.textContent = r.value; }; });
    if (t === 'zdarzenie') {
      var odsw = function () {
        var rd = f.rodzaj.value, z = ZDARZ[rd];
        f.querySelectorAll('[data-tylko]').forEach(function (e) { e.hidden = !(e.dataset.tylko === 'czas' ? z.czas : e.dataset.tylko === rd); });
        var k = rd === 'przerwa' ? '−50 pkt (przerwa do 8 tyg.) albo −100 pkt (dłuższa)' : z.k ? zn(z.k) + ' pkt' : 'bez zmiany siły';
        $('tpDzSkutek').innerHTML = z.k || z.u || rd === 'przerwa' ? '<b>Skutek w analizie:</b> ' + k + (z.u ? ', niepewność +' + z.u + ' pkt' : '') + (z.dni ? ', wygasa w ' + z.dni + ' dni' + (z.czas ? ' po zakończeniu' : '') : '') + '.' +
          (rd === 'kontuzja' ? ' Bez diagnozy — wystarczy „niedyspozycja”.' : '') : 'Sama notatka, bez wpływu na liczby.';
      };
      f.rodzaj.onchange = odsw; odsw();
    }
  }
  function zapiszD(e) {
    e.preventDefault();
    var p = paraZ($('tpParaD').value), f = e.target; if (!p) return;
    var data = f.data.value || dzis();
    if (data > dzis()) { pokazMsg('Data nie może być z przyszłości.', true); return; }
    var w = { id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), para: p.id, nazwa: p.para, typ: dz.typ, data: data, notka: f.notka.value.trim() };
    if (dz.typ === 'ocena') { w.styl = p.styl; w.forma = +(f.querySelector('input[name=forma]:checked') || { value: 0 }).value; KOMP.forEach(function (k) { w[k[0]] = +f[k[0]].value; }); }
    else if (dz.typ === 'zdarzenie') {
      w.rodzaj = f.rodzaj.value; if (f.tenStyl.checked) w.styl = p.styl;
      if (ZDARZ[w.rodzaj].czas && f.do.value) { if (f.do.value < data) { pokazMsg('Data „do” jest przed datą „od”.', true); return; } w.do = f.do.value; }
      if (w.rodzaj === 'choreo' && f.taniec.value) { w.taniec = f.taniec.value; w.styl = p.styl; }
      if (w.rodzaj === 'inne' && !w.notka) { pokazMsg('Przy „inne” dopisz notatkę.', true); return; }
    } else {
      w.kto = f.kto.value; w.po = f.po.value; w.wysilek = +f.wysilek.value;
      w.zgranie = +(f.querySelector('input[name=zgranie]:checked') || { value: 3 }).value;
      w.pewnosc = +(f.querySelector('input[name=pewnosc]:checked') || { value: 3 }).value;
    }
    var d = dzCzytaj(); d.wpisy.push(w);
    if (!dzZapisz(d)) { pokazMsg('Nie udało się zapisać — przeglądarka blokuje pamięć strony.', true); return; }
    dz.msg = 'Zapisane: ' + opisWpisu(w).t.toLowerCase() + ', ' + plD(w.data) + '.';
    rysujD(); odswiezInne();
  }
  function pokazMsg(t, zle) { var m = $('tpDzMsg'); m.textContent = t; m.classList.toggle('zle', !!zle); }
  // Wpis z pliku: tylko znane pola i typy (trafia do HTML-a i do obliczeń)
  function czysty(w) {
    var ISO = /^\d{4}-\d\d-\d\d$/, l = function (v, a, b) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : null; };
    if (!w || typeof w !== 'object' || !/^[\w-]{1,40}$/.test(w.id || '') || typeof w.para !== 'number' || !ISO.test(w.data || '')) return null;
    if (['ocena', 'zdarzenie', 'odczucie'].indexOf(w.typ) < 0) return null;
    var o = { id: w.id, para: w.para, nazwa: String(w.nazwa || '').slice(0, 120), typ: w.typ, data: w.data, notka: String(w.notka || '').slice(0, 600) };
    if (STYL[w.styl]) o.styl = w.styl;
    if (w.typ === 'ocena') { o.forma = Math.round(l(w.forma, -2, 2) || 0); KOMP.forEach(function (k) { o[k[0]] = l(w[k[0]], 1, 10) || 5; }); }
    else if (w.typ === 'zdarzenie') { if (!ZDARZ[w.rodzaj]) return null; o.rodzaj = w.rodzaj; if (ISO.test(w.do || '')) o.do = w.do; if (NAZWA[w.taniec]) o.taniec = w.taniec; }
    else { o.kto = { para: 1, on: 1, ona: 1 }[w.kto] ? w.kto : 'para'; o.po = { trening: 1, turniej: 1, przed: 1 }[w.po] ? w.po : 'trening';
      o.wysilek = Math.round(l(w.wysilek, 0, 10) || 0); o.zgranie = Math.round(l(w.zgranie, 1, 5) || 3); o.pewnosc = Math.round(l(w.pewnosc, 1, 5) || 3); }
    return o;
  }
  function opisWpisu(w) {
    if (w.typ === 'ocena') return { t: 'Ocena trenera', c: 'oc', o: (w.styl ? STYL[w.styl] + ' · ' : '') + 'forma: ' + FORMA[(w.forma || 0) + 2][1] + ' · ' + KOMP.map(function (k) { return k[1].split(' ')[0] + ' ' + w[k[0]]; }).join(', ') };
    if (w.typ === 'zdarzenie') { var z = ZDARZ[w.rodzaj] || { n: w.rodzaj }; return { t: z.n, c: 'zd', o: (w.do ? 'do ' + plD(w.do) : z.czas ? 'trwa' : '') + (w.taniec ? ' · ' + NAZWA[w.taniec] : '') + (w.styl && !w.taniec ? ' · tylko ' + STYL[w.styl] : '') }; }
    return { t: 'Odczucia: ' + ({ para: 'para', on: 'partner', ona: 'partnerka' }[w.kto] || ''), c: 'od', o: 'po ' + ({ trening: 'treningu', turniej: 'turnieju', przed: 'starcie (przed)' }[w.po] || '') + ' · wysiłek ' + w.wysilek + '/10 · zgranie ' + w.zgranie + '/5 · pewność ' + w.pewnosc + '/5' };
  }

  function wypelnijD() {
    $('tpParaD').innerHTML = $('tpParaB').innerHTML;
    $('tpParaD').value = stan.parB || $('tpParaB').value;
    $('tpParaD').onchange = function () { stan.parB = $('tpParaD').value; $('tpParaB').value = stan.parB; zapamietaj(); dz.msg = ''; rysujD(); rysujB(); };
    $('tpDzForm').onsubmit = zapiszD;
    $('tpDzTyp').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; dz.typ = b.dataset.t; dz.msg = ''; pokazMsg(''); formD(paraZ($('tpParaD').value)); };
    $('tpHistD').onclick = function (e) {
      var b = e.target.closest('button[data-usun]'); if (!b) return;
      if (b.dataset.pewne !== '1') { b.dataset.pewne = '1'; b.textContent = 'na pewno?'; setTimeout(function () { if (b.isConnected) { b.dataset.pewne = ''; b.textContent = 'usuń'; } }, 3000); return; }
      var d = dzCzytaj(); d.wpisy = d.wpisy.filter(function (w) { return w.id !== b.dataset.usun; }); dzZapisz(d); dz.msg = 'Wpis usunięty.'; rysujD(); odswiezInne();
    };
    root.querySelector('[data-dz="eksport"]').onclick = function () {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dzCzytaj(), null, 1)], { type: 'application/json' }));
      a.download = 'dziennik-par-' + dzis() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    };
    $('tpDzImport').onchange = function () {
      var plik = this.files[0]; this.value = ''; if (!plik) return;
      plik.text().then(function (t) {
        var nowe = JSON.parse(t); if (!nowe || !Array.isArray(nowe.wpisy)) throw new Error('to nie jest plik dziennika');
        var d = dzCzytaj(), sa = {}; d.wpisy.forEach(function (w) { sa[w.id] = 1; });
        var dod = nowe.wpisy.map(czysty).filter(function (w) { return w && !sa[w.id]; });
        d.wpisy = d.wpisy.concat(dod); dzZapisz(d); dz.msg = 'Wczytano ' + dod.length + ' nowych wpisów.'; rysujD(); odswiezInne();
      }).catch(function (e) { pokazMsg('Nie wczytano: ' + (e.message || e), true); });
    };
  }
  function rysujD() {
    var p = paraZ($('tpParaD').value); if (!p) return;
    var d = dzis(), r = dzLicz(p, d), wp = r.wpisy;
    $('tpKatD').textContent = p.przedzial + ' ' + p.klasa + ' ' + STYL[p.styl];
    var pole = p.stawka.filter(function (x) { return x.s != null; }), mPrzed = pole.slice().sort(function (a, b) { return b.s - a.s; }).indexOf(p.my) + 1,
        mPo = pole.filter(function (x) { return x !== p.my && x.s >= r.s; }).length + 1;
    $('tpKafleD').innerHTML =
      '<div><div class="n">' + p.my.s + '</div><div class="o">siła z wyników ±' + p.my.u + '</div></div>' +
      '<div><div class="n ' + (r.korekta > 0 ? 'plus' : r.korekta < 0 ? 'minus' : '') + '">' + zn(r.korekta) + '</div><div class="o">korekta z dziennika</div></div>' +
      '<div class="zl"><div class="n">' + r.s + '</div><div class="o">siła z dziennikiem ±' + r.u + '</div></div>' +
      '<div><div class="n">' + mPrzed + '. → ' + mPo + '.</div><div class="o">miejsce w stawce ' + pole.length + ' par (wyniki → z dziennikiem)</div></div>';
    var sk = r.sklad.length ? '<div class="tp-sklad"><div class="tp-e" style="margin:0 0 2px">Skąd korekta</div>' + r.sklad.map(function (x) { return '<div><span>' + h(x.o) + '</span><b>' + (x.k ? zn(x.k) + ' pkt' : '') + (x.u ? (x.k ? ' · ' : '') + 'niepewność +' + Math.round(x.u) : '') + '</b></div>'; }).join('') + '</div>' : '';
    $('tpSygD').innerHTML = sk + dzSygnaly(p, r, d).map(function (s) { return '<div class="s ' + s[0] + '">' + h(s[1]) + '</div>'; }).join('');
    // komponenty: ostatnia ocena vs poprzednia (ten styl)
    var oc = wp.filter(function (w) { return w.typ === 'ocena' && w.styl === p.styl; }), o1 = oc[oc.length - 1], o0 = oc[oc.length - 2];
    $('tpKompD').innerHTML = o1 ? KOMP.map(function (k) {
      var v = o1[k[0]], dl = o0 ? v - o0[k[0]] : null;
      return '<div><span>' + k[1] + '</span><span class="bar"><i style="width:' + (v * 10) + '%"></i>' + (o0 ? '<em style="left:' + (o0[k[0]] * 10) + '%" title="poprzednio ' + o0[k[0]] + '"></em>' : '') + '</span><span class="v">' + v +
        (dl ? '<small class="' + (dl > 0 ? 'plus' : 'minus') + '">' + (dl > 0 ? '↑' : '↓') + Math.abs(dl) + '</small>' : '') + '</span></div>';
    }).join('') + '<p class="tp-cichy" style="margin:6px 0 0">Ocena z ' + plD(o1.data) + (o0 ? '; kreska = poprzednia z ' + plD(o0.data) : '') + '. Najniżej: <b>' + KOMP.slice().sort(function (a, b) { return o1[a[0]] - o1[b[0]]; })[0][1].toLowerCase() + '</b>.</p>'
      : '<p class="tp-cichy">Brak oceny trenera w stylu ' + STYL[p.styl] + '.</p>';
    $('tpHistD').innerHTML = wp.length ? wp.slice().reverse().map(function (w) {
      var o = opisWpisu(w);
      return '<div class="tp-wpis ' + o.c + '"><div class="g"><b>' + h(plD(w.data)) + '</b> · ' + h(o.t) + '<button type="button" class="tp-usun" data-usun="' + h(w.id) + '">usuń</button></div>' +
        '<div class="o">' + h(o.o) + '</div>' + (w.notka ? '<div class="nt">' + h(w.notka) + '</div>' : '') + '</div>';
    }).join('') : '<p class="tp-cichy">Jeszcze nic. Pierwszy wpis zajmuje pół minuty.</p>';
    var wsz = dzCzytaj().wpisy, ileP = {}; wsz.forEach(function (w) { ileP[w.para] = 1; });
    var np = Object.keys(ileP).length;
    $('tpDzIle').textContent = wsz.length + (wsz.length === 1 ? ' wpis' : wsz.length % 10 >= 2 && wsz.length % 10 <= 4 && (wsz.length % 100 < 12 || wsz.length % 100 > 14) ? ' wpisy' : ' wpisów') + ' dla ' + np + (np === 1 ? ' pary' : ' par') + (MAG ? ' · zapis w bazie panelu' + (O.magazynOpis ? ' (' + O.magazynOpis + ')' : '') : ' · zapis w tej przeglądarce');
    formD(p); pokazMsg(dz.msg);
  }
  function odswiezInne() { if (!DZ) return; rysujB(); if (TURNIEJ.length) rysujC(); }
  // dla B i C: siła z dziennikiem pary o danej nazwie w stylu (null = brak wpisów wpływających na liczby)
  function dzDla(nazwa, styl) {
    if (!DZ) return null;
    var p = PARY.find(function (z) { return z.styl === styl && z.my.n === nazwa; }); if (!p) return null;
    var r = dzLicz(p); return r.korekta || r.u !== p.my.u ? r : null;
  }

  function pokaz(el) {
    if (!el) return;
    if (el.dataset.tpGotowe !== '1') {
      root = el;
      el.innerHTML = szkielet();
      el.dataset.tpGotowe = '1';
      var ileP = {}; PARY.forEach(function (p) { ileP[p.id] = 1; });
      $('tpMeta').textContent = Object.keys(ileP).length + ' par · ' + PARY.length + ' zestawów para × styl · stawki z ostatnich 12 miesięcy · dane PTT Scout z ' + D.na_dzien + ' (' + O.dopisek + ')';
      el.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('button') : null; if (!t || !el.contains(t)) return;
        if (t.parentNode.classList.contains('tp-widoki')) { przelaczWidok(t.dataset.w); return; }
        if (t.parentNode.id === 'tpStylA') { stan.stylA = t.dataset.s; zapamietaj(); rysujA(); return; }
        if (t.dataset.karta) { $('tpParaB').value = t.dataset.karta; rysujB(); przelaczWidok('b'); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      });
      $('tpParaB').onchange = rysujB;
      $('tpKatC').onchange = function () { kategoriaC(false); };
      $('tpParaC').onchange = rysujC;
      if (!TANCE[stan.stylA]) stan.stylA = 'ST';
      rysujA(); wypelnijB(); rysujB(); wypelnijC();
      if (DZ) wypelnijD();
    }
    root = el;
    przelaczWidok(WIDOKI.indexOf(stan.widok) >= 0 ? stan.widok : 'a');
  }
  window.TancePar = { pokaz: pokaz };
})();

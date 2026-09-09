/* =====================================================================
   TAKT — KLUCZ ORGANIZACJI: wpięcie w panel
   Wyodrębnione z panelu 8.09.2026.

   PO CO OSOBNY PLIK: to samo wpięcie musi działać w trzech liniach
   (produkt, demo, Team), a demo i Team mają WŁASNE kopie panelu, różne
   od siebie o setki linii. Trzymanie tego kodu wewnątrz każdego panelu
   znaczyłoby trzy kopie tego samego — i rozjazd przy pierwszej łatce.
   Teraz jest jedno źródło w `produkt/`, a `build.mjs` kopiuje je obok
   panelu, tak jak `orgkey.js` i `supabase.js`.

   ZAŁOŻENIA O PANELU (sprawdzone we wszystkich trzech liniach):
     · `TAKT_CONFIG`, `SYNC_BASE_KEY`, `SYNC_DIRTY_KEY`, `BRANCHES`,
       `currentBranch` to top-level `const`/`let` — widoczne z innego
       skryptu przez globalne środowisko LEKSYKALNE, nie przez `window`,
     · `esc`, `deviceName`, `paymentsScope`, `applyCloudState`, `LS*`,
       `openCloudModal`, `pushStateNow`, `loadStateFromCloud`,
       `manualStatePush`, `scheduleStatePush` to deklaracje `function`
       — czyli SĄ na `window` i dają się owinąć,
     · aplikacja desktopowa siedzi w `<template id="app-desktop">`,
       więc owijki zakładamy DOPIERO gdy szablon jest wstrzyknięty.

   Wyłącznik: `TAKT_CONFIG.orgKey`. Fałsz → plik wychodzi w pierwszej
   linii i panel jedzie starą ścieżką z hasłem szyfrującym.
   ===================================================================== */
(function () {
  'use strict';
  // ⚠️ NIE `window.TAKT_CONFIG` — to top-level `const`, a `const`/`let` trafiają
  // do globalnego środowiska LEKSYKALNEGO, nie na obiekt `window` (inaczej niż
  // deklaracje `function`). Pierwsza wersja sprawdzała `window.TAKT_CONFIG`
  // i blok wychodził tu ZAWSZE — bez żadnego błędu w konsoli.
  if (typeof TAKT_CONFIG === 'undefined' || !TAKT_CONFIG.orgKey) return;      // ← jedyny wyłącznik
  const K = window.TAKT_ORGKEY;
  if (!K) { console.warn('[orgkey] brak orgkey.js — Chmura+ zostaje na starej ścieżce'); return; }
  // Ten panel wymaga rdzenia w wersji kontraktu >= 3. `orgkey.js` jest OSOBNYM
  // plikiem wgrywanym ręcznie, więc rozbieżność wersji jest realna i cicha:
  // stary rdzeń „działa", tylko zachowuje się inaczej (8.09.2026 stary `isOpen()`
  // nie uwzględniał kluczy filii i konto pracownika nigdy nie otwierało skarbca).
  const NEED_CONTRACT = 4;
  const STARY_RDZEN = !(K.CONTRACT >= NEED_CONTRACT);

  /* ── stan w PAMIĘCI KARTY. Nigdy do localStorage ─────────────────── */
  const ORG = {
    dev: null,          // klucze tego urządzenia (klucz prywatny niewyprowadzalny)
    boot: null,         // ostatnia odpowiedź key_bootstrap()
    vault: K.newVault() // otwarty skarbiec: klucz organizacji + klucze filii
  };
  window.TAKT_ORG = ORG;                                        // do diagnostyki w konsoli

  // Wersja paczki jest PER FILIA i wchodzi w AAD, więc trzymamy ją obok
  // danych filii (LSgetB), a nie globalnie.
  const VER_KEY = 'takt_org_ver';
  // „są lokalne zmiany do wysłania" — też PER FILIA, bo każda ma własną paczkę.
  const DIRTY_KEY = 'takt_org_dirty';
  let orgPushTimer = null;
  // Ostatnio widziane odciski kluczy — na tym stoi ostrzeżenie „klucz się zmienił".
  const FP_KEY = 'takt_org_fp';

  const sbAuth = () => window.TAKT_SB || null;
  const br = () => (typeof currentBranch !== 'undefined' && currentBranch) ? currentBranch : '';
  const bInfo = (n) => 'branch:' + (n || 'main') + ':';
  /* ⚠️ `LSgetB`/`LSsetB` (localStorage z segmentem filii) istnieją TYLKO
     w liniach z modułem filii — demo i Team. `produkt/takt-panel.html`
     ich nie ma, więc bez tego fallbacku wpięcie wywalałoby ReferenceError
     u klienta z jedną lokalizacją. Dla takiego klienta „filia" to '',
     czyli klucz bez segmentu — dokładnie to, co robi `LSget`/`LSset`.     */
  const bGet = (k) => (typeof LSgetB === 'function' ? LSgetB(k) : LSget(k));
  const bSet = (k, v) => (typeof LSsetB === 'function' ? LSsetB(k, v) : LSset(k, v));
  const lastVer = () => Number(bGet(VER_KEY) || 0) || 0;

  async function rpc(name, args) {
    const sb = sbAuth();
    if (!sb) throw new Error('Nie jesteś zalogowany.');
    const { data, error } = await sb.rpc(name, args || {});
    if (error) {
      const m = error.message || String(error);
      // PGRST202 = PostgREST nie zna takiej sygnatury. Prawie zawsze znaczy to
      // ROZJAZD WERSJI: panel jest nowszy niż schemat w bazie. Nazywamy to
      // wprost, bo goły komunikat „could not find the function" wygląda jak
      // awaria, a jest brakującym krokiem wdrożenia.
      if (error.code === 'PGRST202' || /Could not find the function/i.test(m)) {
        throw new Error('Baza ma starszą wersję funkcji „' + name + '" niż ten panel. ' +
          'Wklej ponownie CAŁY produkt/supabase_klucz_organizacji.sql w SQL Editorze tego projektu.');
      }
      throw new Error(m);
    }
    return data;
  }

  /* ═══════════════ 1. START: zero pytań, jeśli wszystko jest ═══════════════
     Cała ścieżka codzienna: klucz urządzenia z IndexedDB → koperta klucza
     prywatnego → klucz organizacji → klucze filii. Ani jednego pola.       */
  async function boot() {
    const sb = sbAuth();
    if (!sb) return;                                  // niezalogowany — nic do roboty
    // Na starym rdzeniu NIE ruszamy bazy: `createIdentity`/`enroll_device`
    // zapisałyby stan, którego nowy panel potem nie rozumie.
    if (STARY_RDZEN) return;

    // E-mail bierzemy z sesji, bo klucz urządzenia jest teraz PER KONTO.
    let myEmail = '';
    try { const u = await sb.auth.getUser(); myEmail = ((u.data && u.data.user && u.data.user.email) || '').toLowerCase(); }
    catch (e) { /* offline — poniżej wyjdzie brak konta */ }
    if (!myEmail) { ORG.blocked = 'Nie odczytałem adresu zalogowanego konta — odśwież panel.'; return; }
    try { ORG.dev = await K.deviceKeys(myEmail); }
    catch (e) {
      // Okno prywatne albo zablokowane dane witryny. Mówimy wprost, zamiast
      // wisieć albo cicho udawać, że Chmura+ działa.
      ORG.blocked = 'To okno przeglądarki nie pozwala zapisać klucza urządzenia (' +
        (e.message || e) + '). Chmura+ tutaj nie zadziała — otwórz panel w normalnym oknie.';
      return;
    }

    ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });

    // (a) Nie mam jeszcze tożsamości ALBO serwer nie zna mojego klucza publicznego.
    if (!ORG.boot.identity) { await createIdentity(); ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id }); }

    // (b) Tożsamość jest, ale TO urządzenie nie ma koperty klucza prywatnego.
    if (!ORG.boot.device || !ORG.boot.device.wrap) {
      // MARTWY PUNKT: nie ma ani mojej koperty, ani innego działającego
      // urządzenia, które mogłoby ją wystawić — a klucza prywatnego nie
      // odtworzę z niczego. Wyjście prowadzi przez wydruk (jeszcze nie
      // zaimplementowany) albo przez założenie tożsamości od nowa.
      // Nazywamy to wprost, zamiast próbować otworzyć skarbiec i wywalić się.
      if (!(ORG.boot.my_devices || []).some(d => d.approved)) {
        ORG.deadEnd = true;
        return;
      }
      const r = await rpc('enroll_device', {
        p_device_id: ORG.dev.device_id, p_label: deviceName(),
        p_pub_jwk: ORG.dev.pub, p_fingerprint: ORG.dev.fingerprint
      });
      if (r.first_device) {
        ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      } else {
        ORG.pendingCode = r.code;                     // ekran „wpisz 6 cyfr na starym urządzeniu"
        return;
      }
    }

    // (c) Odcisk: sprawdzany przy KAŻDYM starcie, nie tylko przy dodawaniu osoby.
    checkFingerprints(ORG.boot.fingerprints || {});

    // (d) Klucza organizacji jeszcze nie ma — trzeba włączyć.
    if (!ORG.boot.generation) return;

    // (e) Otwarcie skarbca. Powód niepowodzenia MUSI dojść do interfejsu —
    // wcześniej ginął w console.warn, a UI kłamał, że to auto-blokada.
    try { await openVault(); }
    catch (e) { ORG.vaultError = e.message || String(e); }
  }

  async function createIdentity() {
    const pair = await K.newIdentityKeyPair();
    const pub = await K.pubJwk(pair);
    const fp = await K.fingerprint(pub);
    await rpc('register_identity', { p_pub_jwk: pub, p_fingerprint: fp });
    // Klucz prywatny pieczętujemy na TO urządzenie i odkładamy na serwer —
    // odpakuje go wyłącznie ten sprzęt, bo tylko on ma klucz prywatny urządzenia.
    // Koperta leci RAZEM ze zgłoszeniem: `approve_device` wymaga już działającego
    // urządzenia, więc dla pierwszego nie miałby kto jej dopisać.
    const privJwk = await K.exportPrivJwk(pair.privateKey);
    const wrap = await K.sealTo(ORG.dev.pub, new TextEncoder().encode(JSON.stringify(privJwk)), 'device');
    await rpc('enroll_device', {
      p_device_id: ORG.dev.device_id, p_label: deviceName(),
      p_pub_jwk: ORG.dev.pub, p_fingerprint: ORG.dev.fingerprint, p_wrap: wrap
    });
    // Trzymamy klucz prywatny od razu w skarbcu — nie ma po co go odpakowywać
    // z serwera w tej samej sekundzie, w której go tam wysłaliśmy.
    ORG.vault.identityPriv = pair.privateKey;
  }

  async function openVault() {
    const b = ORG.boot;
    // 1. klucz prywatny osoby — kluczem urządzenia
    const privBytes = await K.openSealed(ORG.dev.priv, b.device.wrap, 'device');
    ORG.vault.identityPriv = await K.importPriv(JSON.parse(new TextDecoder().decode(privBytes)));
    ORG.vault.generation = b.generation;

    // 2. klucz organizacji — TYLKO właściciel go dostaje. Pracownik filii nie,
    //    i to jest sedno rozdziału: z jego koperty nie policzy innych filii.
    if (b.org_wrap) {
      ORG.vault.orgKey = await K.importSym(await K.openSealed(ORG.vault.identityPriv, b.org_wrap, 'org'), true);
    }

    // 3. klucze filii — DWIE różne operacje, rozpoznawane po `kind`:
    //    'org'   → AES-GCM pod kluczem organizacji (właściciel),
    //    'staff' → ECDH-ES na mój klucz publiczny (pracownik filii).
    //    Pierwsza wersja umiała tylko pierwszą i konto filii nie otwierało nic.
    ORG.vault.branches = {};
    ORG.branchErrors = [];
    for (const w of (b.branch_wraps || [])) {
      try {
        let key;
        if (w.kind === 'staff') {
          key = await K.importSym(await K.openSealed(ORG.vault.identityPriv, w.wrap, 'staff'), true);
        } else {
          if (!ORG.vault.orgKey) continue;                 // koperta 'org' bez klucza organizacji
          key = await K.unwrapKeyUnder(ORG.vault.orgKey, w.wrap, bInfo(w.branch) + w.branch_gen);
        }
        // Trzymamy klucz KAŻDEGO pokolenia, nie tylko najnowszego: po rotacji
        // w chmurze leżą jeszcze paczki zaszyfrowane starym kluczem filii,
        // dopóki przeszyfrowanie się nie skończy. Bez tego przerwana rotacja
        // czyniłaby je nieczytelnymi.
        const slot = ORG.vault.branches[w.branch] || { gen: 0, key: null, keys: {} };
        slot.keys[w.branch_gen] = key;
        if (w.branch_gen >= slot.gen) { slot.gen = w.branch_gen; slot.key = key; }
        ORG.vault.branches[w.branch] = slot;
      } catch (e) {
        // NIE gubimy tego w konsoli. Nieudane otwarcie koperty filii jest
        // jedyną informacją o tym, co się stało — a bez niej interfejs
        // zaczyna wymyślać powody (dwa razy 8.09.2026 skłamał o auto-blokadzie).
        ORG.branchErrors.push({ branch: w.branch, kind: w.kind, msg: e.message || String(e) });
        console.warn('[orgkey] nie otwarłem klucza filii', w.branch, e.message);
      }
    }

    // „Czekam na dostęp" to brak JAKIEJKOLWIEK drogi do danych — ani klucza
    // organizacji, ani choćby jednej koperty filii.
    if (!ORG.vault.orgKey && !Object.keys(ORG.vault.branches).length) { ORG.waiting = true; return; }
    ORG.vault.openedAt = Date.now();
    armAutoLock();
  }

  /* Auto-blokada: czyści klucze z PAMIĘCI po godzinie bezczynności.
     Uczciwie — to zmniejsza okno na wyciek z pamięci karty, a nie chroni
     przed kimś, kto siedzi przy tym komputerze (klucz urządzenia jest tu). */
  let lockTimer = null;
  function armAutoLock() {
    ORG.lockedByTimer = false;
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => { ORG.lockedByTimer = true; ORG.vault.lock(); renderOrgUI(); }, 60 * 60 * 1000);
  }
  ['click', 'keydown'].forEach(ev => document.addEventListener(ev, () => {
    if (ORG.vault.isOpen()) armAutoLock();
  }, { passive: true }));

  /* ── odcisk klucza: „safety number changed" ───────────────────────── */
  function checkFingerprints(now) {
    let seen = {};
    try { seen = JSON.parse(LSget(FP_KEY) || '{}'); } catch (e) { seen = {}; }
    ORG.fpChanged = [];
    Object.keys(now).forEach(em => {
      if (seen[em] && seen[em] !== now[em]) ORG.fpChanged.push({ email: em, was: seen[em], is: now[em] });
    });
    // Zapisujemy dopiero po pokazaniu — inaczej ostrzeżenie zniknęłoby
    // po jednym odświeżeniu i nikt by go nie zobaczył.
    if (!ORG.fpChanged.length) LSset(FP_KEY, JSON.stringify(now));
  }
  function trustFingerprints() {
    LSset(FP_KEY, JSON.stringify((ORG.boot && ORG.boot.fingerprints) || {}));
    ORG.fpChanged = [];
    renderOrgUI();
  }

  /* ═══════════════ 2. WŁĄCZENIE: jeden klik + jeden wydruk ═══════════════ */
  // Klucz ORGANIZACJI zakłada się RAZ na szkołę, klucz FILII osobno dla każdej
  // lokalizacji. Rozdzielone, bo druga filia dołącza do istniejącej organizacji
  // i NIE dostaje wtedy nowego wydruku — klucz organizacji się nie zmienia.
  async function enable() {
    const b = br();
    const nazwa = (typeof currentBranchDef === 'function' && currentBranchDef()) ? currentBranchDef().name : (b || 'szkoła');
    const pierwsza = !ORG.boot.generation;
    if (!confirm('Włączyć Chmurę+ dla „' + nazwa + '"?' +
      (pierwsza ? '\n\nZa chwilę pokażę klucz odzyskiwania do wydrukowania — pokażę go TYLKO RAZ.'
                : '\n\nTa filia dołączy do istniejącego klucza organizacji. Nowego wydruku nie będzie — stary nadal obejmuje całość.'))) return;
    try {
      let rk = null;
      if (pierwsza) {
        const orgKey = await K.newSymKey();
        const raw = new Uint8Array(await K.exportSym(orgKey));
        const myWrap = await K.sealTo(ORG.boot.identity.pub_jwk, raw, 'org');
        rk = K.newRecoveryKey();
        const recWrap = await K.wrapWithPassphrase(K.normRecoveryKey(rk), raw);
        await rpc('init_org_key', {
          p_wrap: myWrap, p_recovery: recWrap,
          p_label: 'wydruk ' + new Date().toLocaleDateString('pl-PL') + ' · ' + deviceName()
        });
        ORG.vault.orgKey = orgKey;
        ORG.vault.generation = 1;
      }
      if (!ORG.vault.orgKey) throw new Error('Skarbiec nie jest otwarty — odśwież panel i spróbuj ponownie.');

      // klucz TEJ filii, pokolenie 1
      const bek = await K.newSymKey();
      const bekWrap = await K.wrapKeyUnder(ORG.vault.orgKey, bek, bInfo(b) + '1');
      const r = await rpc('set_branch_key', { p_branch: b || 'main', p_branch_gen: 1, p_org_wrap: bekWrap, p_staff_wraps: [] });
      if (r && r.must_reencrypt) console.warn('[orgkey] wymiana klucza filii — paczkę trzeba przeszyfrować');
      ORG.vault.branches[b] = { gen: 1, key: bek, keys: { 1: bek } };
      ORG.vault.openedAt = Date.now();
      armAutoLock();

      // Pierwszy zapis TEJ filii: bierzemy to, co JEST lokalnie.
      bSet(VER_KEY, '0');
      await push(true);
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      if (rk) showRecovery(rk); else { renderOrgUI(); alert('Chmura+ włączona dla „' + nazwa + '".'); }
    } catch (e) { alert('Nie udało się włączyć Chmury+: ' + (e.message || e)); }
  }

  function showRecovery(rk) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(20,18,16,.82);display:flex;align-items:center;justify-content:center;padding:18px';
    wrap.innerHTML =
      '<div style="background:#fff;color:#1a1a1a;border-radius:16px;padding:26px;max-width:460px;width:100%;font-family:system-ui,sans-serif">' +
      '<h3 style="margin:0 0 6px;font-size:1.1rem">🗝 Wydrukuj to raz</h3>' +
      '<p style="font-size:.88rem;color:#555;margin:0 0 14px">To jedyna droga do Waszych danych, jeśli stracicie wszystkie komputery i telefony. ' +
      'Nie mam kopii i nie umiem jej odtworzyć. <b>Pokazuję ten klucz tylko teraz.</b></p>' +
      '<div id="orgRkBox" style="font:600 15px ui-monospace,Menlo,monospace;letter-spacing:.04em;text-align:center;' +
      'background:#FBF9F3;border:1px solid #E4E4E4;border-radius:10px;padding:14px;word-break:break-all">' + esc(rk) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
      '<button id="orgRkPrint" class="btn btn-primary">🖨 Drukuj</button>' +
      '<button id="orgRkDone" class="btn btn-outline">Zapisałem w bezpiecznym miejscu</button></div>' +
      '<p style="font-size:.8rem;color:#9A6412;margin:12px 0 0">Do schowka go nie skopiuję — kartka w sejfie jest bezpieczniejsza niż plik na pulpicie.</p>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.querySelector('#orgRkPrint').onclick = () => {
      const w = window.open('', '_blank');
      if (!w) { alert('Przeglądarka zablokowała nowe okno — zezwól na wyskakujące okna.'); return; }
      w.document.write('<!doctype html><meta charset="utf-8"><title>Klucz odzyskiwania — ' + esc(TAKT_CONFIG.schoolName) + '</title>' +
        '<style>body{font:14px system-ui,sans-serif;padding:32px;color:#111}h1{font-size:16px}' +
        'code{display:block;font:700 18px ui-monospace,Menlo,monospace;letter-spacing:.06em;margin:18px 0;padding:16px;border:2px solid #111}' +
        'p{max-width:60ch;color:#333}</style>' +
        '<h1>Klucz odzyskiwania — ' + esc(TAKT_CONFIG.schoolName) + '</h1><code>' + esc(rk) + '</code>' +
        '<p>Ten klucz otwiera dane Waszej szkoły w chmurze, gdy nie ma już żadnego działającego komputera ani telefonu. ' +
        'Trzymajcie go w sejfie albo w innym miejscu, do którego nie ma dostępu osoba postronna. ' +
        'Nikt poza Wami nie ma kopii tego klucza — także ja.</p>' +
        '<p>Wygenerowany: ' + new Date().toLocaleString('pl-PL') + '</p>');
      w.document.close(); w.focus(); w.print();
    };
    wrap.querySelector('#orgRkDone').onclick = () => {
      if (!confirm('Na pewno? Tego klucza nie pokażę drugi raz.')) return;
      wrap.remove(); renderOrgUI();
    };
  }

  /* ═══════════════ 3. ZAPIS I ODCZYT PACZKI ═══════════════
     Wersję nadaje KLIENT, bo musi ją znać przed zaszyfrowaniem (wchodzi
     w AAD). Serwer wymusza monotoniczność, więc dwa urządzenia nie
     nadpiszą się cicho.                                                  */
  async function push(force) {
    const b = br(), slot = ORG.vault.branch(b);
    if (!slot) return false;
    const ver = lastVer() + 1;
    try {
      const pack = await K.encryptPack(slot.key, paymentsScope(), b, slot.gen, ver);
      const res = await rpc('state_save_v2', {
        p_data: pack, p_version: ver, p_branch_gen: slot.gen,
        p_device: deviceName(), p_branch: b || null, p_force: !!force
      });
      bSet(VER_KEY, String(res.version));
      bSet(DIRTY_KEY, '');
      LSset(SYNC_BASE_KEY, String(res.updated_at));
      // SYNC_DIRTY_KEY jest GLOBALNY na demie i PER FILIA na Teamie (LSsetB),
      // więc czyścimy oba warianty — inaczej po porcie stary interfejs
      // twierdziłby, że zmiany wciąż czekają na wysłanie.
      LSdel(SYNC_DIRTY_KEY);
      bSet(SYNC_DIRTY_KEY, '');
      if (typeof updateSyncStatusUI === 'function') updateSyncStatusUI();
      return true;
    } catch (e) {
      const msg = e.message || String(e);
      if (msg.indexOf('KONFLIKT') >= 0) {
        if (confirm('⚠ ' + msg + '\n\nOK = nadpisz chmurę wersją z TEGO urządzenia.\nAnuluj = nie wysyłaj.')) {
          // Podłoga musi przeskoczyć powyżej wersji z chmury, inaczej serwer
          // odrzuci również wymuszony zapis.
          const m = /wersja (\d+)/.exec(msg);
          if (m) bSet(VER_KEY, m[1]);
          return push(true);
        }
        return false;
      }
      console.warn('[orgkey] zapis nieudany:', msg);
      return false;
    }
  }

  /* Ile uczestników niesie paczka — do porównania z tym, co jest lokalnie.
     Potrzebne, bo „nowsza wersja" nie znaczy „więcej danych": właściciel
     włączający Chmurę+ dla filii ze SWOJEGO komputera wysyła paczkę PUSTĄ
     (danych tej filii u siebie nie ma), a komputer filii wciągnąłby ją
     na swoje dane. Na Teamie to realny scenariusz: konta filii nie są
     właścicielami, więc nie mogą włączyć Chmury+ same.                     */
  function ileUczestnikow(o) {
    return (o && Array.isArray(o.participants)) ? o.participants.length : 0;
  }

  async function pull(interactive) {
    const b = br(), slot = ORG.vault.branch(b);
    if (!slot) { if (interactive) alert('Skarbiec nie jest otwarty dla tej filii.'); return; }
    // Lokalne zmiany, których jeszcze nie wysłaliśmy, mają PIERWSZEŃSTWO.
    // Automatyczne wczytanie skasowałoby je bez pytania.
    if (!interactive && bGet(DIRTY_KEY) === '1') {
      ORG.pullSkipped = 'lokalne zmiany czekają na wysłanie';
      return;
    }
    try {
      // WŁASNA funkcja, nie `state_load` — ta ma inną sygnaturę na Teamie
      // (p_pin, p_branch) niż na demie (p_pin), więc oparcie się na niej
      // dawało PGRST202 na demie. Patrz komentarz w SQL-u.
      const row = await rpc('state_load_v2', { p_branch: b || null });
      if (!row || !row.data) { if (interactive) alert('W chmurze nie ma jeszcze danych tej filii.'); return; }
      // Paczka może być jeszcze z poprzedniego pokolenia klucza filii —
      // dobieramy klucz do JEJ pokolenia, nie do najnowszego.
      const packGen = row.data && row.data.gen;
      const key = (slot.keys && slot.keys[packGen]) || slot.key;
      const obj = await K.decryptPack(key, row.data, b, packGen, lastVer() || null);

      // STRAŻNIK PIERWSZEGO POŁĄCZENIA: to urządzenie nigdy nie synchronizowało
      // tej filii (`lastVer() === 0`), lokalnie SĄ dane, a z chmury przychodzi
      // mniej. Nadpisanie byłoby utratą danych, więc pytamy — i domyślnie
      // NIE nadpisujemy, bo cichy zapis jest nieodwracalny, a pytanie nie.
      const lokalnie = ileUczestnikow(typeof db !== 'undefined' ? db : null);
      const zChmury = ileUczestnikow(obj);
      if (lastVer() === 0 && lokalnie > 0 && zChmury < lokalnie) {
        const t = 'W chmurze jest paczka tej filii z ' + zChmury + ' uczestnikami, ' +
          'a na tym komputerze jest ich ' + lokalnie + '.\n\n' +
          'To zwykle znaczy, że Chmurę+ dla tej filii włączono z innego komputera, ' +
          'na którym tych danych nie było.\n\n' +
          'OK = nadpisz dane lokalne wersją z chmury (STRACISZ ' + lokalnie + ' uczestników).\n' +
          'Anuluj = zostaw dane lokalne i wyślij je do chmury.';
        if (!interactive || !confirm(t)) {
          ORG.pullSkipped = 'chmura ma mniej danych niż ten komputer (' + zChmury + ' vs ' + lokalnie + ')';
          bSet(DIRTY_KEY, '1');            // oznacz do wysłania, żeby nie zginęły
          if (interactive) alert('Nic nie nadpisałem. Kliknij „⬆ Wyślij do chmury", ' +
            'żeby wysłać dane z tego komputera.');
          return;
        }
      }
      ORG.pullSkipped = null;
      applyCloudState({ data: obj, updated_at: row.updated_at, device: row.device, saved_at: row.saved_at });
      bSet(VER_KEY, String(row.data.version));
      if (interactive) alert('Wczytano dane z chmury (wersja ' + row.data.version + ').');
    } catch (e) { if (interactive) alert('Nie udało się wczytać: ' + (e.message || e)); else console.warn('[orgkey] odczyt:', e.message || e); }
  }

  /* ═══════════════ 4. URZĄDZENIA I WŁAŚCICIELE ═══════════════ */
  async function approveByCode(code) {
    try {
      const d = await rpc('device_by_code', { p_code: String(code || '').replace(/\D/g, '') });
      if (!confirm('Wpuścić urządzenie „' + (d.label || d.device_id) + '"?\n\nNa tamtym ekranie powinien być odcisk:\n' + d.fingerprint)) return;
      const privJwk = await K.exportPrivJwk(ORG.vault.identityPriv);
      const wrap = await K.sealTo(d.pub_jwk, new TextEncoder().encode(JSON.stringify(privJwk)), 'device');
      await rpc('approve_device', { p_device_id: d.device_id, p_wrap: wrap });
      alert('Wpuszczone. Na tamtym urządzeniu odśwież panel.');
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      renderOrgUI();
    } catch (e) { alert(e.message || e); }
  }

  async function grantOwner(email, fingerprint) {
    if (!confirm('Wpuścić ' + email + ' do WSZYSTKICH danych szkoły?\n\nNajpierw potwierdźcie na głos, że ta osoba widzi u siebie odcisk:\n' +
      fingerprint + '\n\nJeśli odcisk się nie zgadza, NIE wpuszczaj — może oznaczać podstawiony klucz.')) return;
    try {
      const pk = await rpc('get_public_key', { p_email: email });
      if (pk.fingerprint !== fingerprint) { alert('Odcisk zmienił się w trakcie — przerywam. Spróbuj ponownie i porównajcie od nowa.'); return; }
      const raw = new Uint8Array(await K.exportSym(ORG.vault.orgKey));
      const wrap = await K.sealTo(pk.pub_jwk, raw, 'org');
      await rpc('grant_owner', { p_email: email, p_wrap: wrap });
      alert(email + ' ma dostęp. Danych nie szyfrowałem od nowa — doszła jedna koperta.\n\nNiech odświeży panel.');
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      renderOrgUI();
    } catch (e) { alert(e.message || e); }
  }

  /* ═══════════════ 5. INTERFEJS — w istniejącym oknie „Chmura i konto" ═══════════════ */
  function renderOrgUI() {
    const box = document.getElementById('syncSection');
    if (!box) return;
    box.style.display = '';
    const H = [];
    const pill = (cls, txt) => '<span class="badge badge-' + cls + '">' + txt + '</span>';

    if (STARY_RDZEN) {
      box.innerHTML = '<span id="orgUiMark" hidden></span><label>Chmura+ — niezgodne wersje</label>' +
        '<div class="hint">Ten panel wymaga rdzenia <code>orgkey.js</code> w wersji <b>' + NEED_CONTRACT +
        '</b>, a wgrany jest <b>' + esc(String(K.CONTRACT || 1)) + '</b>.</div>' +
        '<div class="hint" style="margin-top:6px">Wgraj <code>orgkey.js</code> z tego samego buildu co panel ' +
        'i odśwież stronę z pominięciem cache (Cmd+Shift+R).</div>';
      return;
    }
    if (ORG.blocked) { box.innerHTML = '<span id="orgUiMark" hidden></span><label>Chmura+</label><div class="hint">⚠ ' + esc(ORG.blocked) + '</div>'; return; }
    if (!ORG.dev) { box.innerHTML = '<span id="orgUiMark" hidden></span><label>Chmura+</label><div class="hint">Sprawdzam to urządzenie…</div>'; return; }

    // ostrzeżenie o zmianie odcisku ma pierwszeństwo nad wszystkim
    if (ORG.fpChanged && ORG.fpChanged.length) {
      H.push('<label>⚠ Klucz się zmienił</label>');
      ORG.fpChanged.forEach(c => H.push('<div class="hint" style="margin-bottom:6px">' + esc(c.email) +
        '<br>wcześniej: <code>' + esc(c.was) + '</code><br>teraz: <code>' + esc(c.is) + '</code></div>'));
      H.push('<div class="hint">Zwykle znaczy to, że ta osoba zmieniła urządzenie i założyła klucz od nowa. ' +
        'Zadzwońcie i potwierdźcie nowy odcisk, zanim cokolwiek wyślesz.</div>' +
        '<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="TAKT_ORG.trust()">Potwierdzone — zaufaj</button>');
      box.innerHTML = '<span id="orgUiMark" hidden></span>' + H.join('');
      return;
    }

    if (ORG.deadEnd) {
      box.innerHTML = '<span id="orgUiMark" hidden></span><label>Brak dostępu z tego urządzenia</label>' +
        '<div class="hint">Twoje konto ma klucz publiczny w bazie, ale <b>żadne urządzenie nie ma koperty klucza prywatnego</b>, ' +
        'więc nie ma czym otworzyć skarbca i nie ma kogo o to poprosić.</div>' +
        '<div class="hint" style="margin-top:6px">Jeśli masz <b>wydruk klucza odzyskiwania</b> — użyj go, ' +
        'zachowasz dostęp do danych. Bez wydruku zostaje założenie tożsamości od nowa, ' +
        'a wtedy ktoś musi Cię wpuścić ponownie.</div>' +
        '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">' +
        (ORG.boot && ORG.boot.is_owner && ORG.boot.has_recovery
          ? '<button class="btn btn-primary btn-sm" onclick="TAKT_ORG.recover()">🗝 Odzyskaj z wydruku</button>' : '') +
        '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.resetIdentity()">Załóż tożsamość od nowa</button></div>';
      return;
    }

    // urządzenie czeka na wpuszczenie
    if (ORG.pendingCode) {
      box.innerHTML = '<label>Wpuść to urządzenie</label>' +
        '<div class="hint">Otwórz panel na komputerze, który już działa, wejdź w <b>☁ Chmura i konto</b> i wpisz tam ten kod:</div>' +
        '<div style="font:600 26px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-align:center;padding:12px 0">' + esc(ORG.pendingCode) + '</div>' +
        '<div class="hint">Kod jest ważny 10 minut. Na tamtym ekranie sprawdź, że odcisk to <code>' + esc(ORG.dev.fingerprint) + '</code>.</div>' +
        // Kod jest bezużyteczny, jeśli NIE MA już żadnego działającego urządzenia
        // — a panel tego nie wie. Bez tego wyjścia ekran jest ślepym zaułkiem
        // (8.09.2026: po nieudanej migracji kluczy wszystkie urządzenia prosiły
        // o kod z urządzenia, które nie istniało).
        '<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="TAKT_ORG.noDevice()">Nie mam już żadnego działającego urządzenia →</button>' +
        '<span id="orgUiMark" hidden></span>';
      return;
    }

    H.push('<label>Chmura+ · klucz organizacji</label>');

    if (!ORG.boot || !ORG.boot.generation) {
      H.push('<div class="hint">Dane wpłat leżą tylko na tym komputerze. Włącz Chmurę+, żeby widzieć je także ' +
        'na telefonie i w filiach — zaszyfrowane kluczem, którego nie mam.</div>' +
        '<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="TAKT_ORG.enable()">Włącz Chmurę+</button>' +
        '<div class="hint" style="margin-top:8px">Na koniec dostaniesz jedną kartkę do wydrukowania.</div>');
      box.innerHTML = '<span id="orgUiMark" hidden></span>' + H.join('');
      return;
    }

    if (ORG.waiting) {
      H.push('<div class="hint">' + pill('warning', 'czekasz na dostęp') +
        ' Twoje konto ma już własny klucz, ale nikt Cię jeszcze nie wpuścił do danych. ' +
        'Poproś właściciela — musi kliknąć jedno potwierdzenie.</div>' +
        '<div class="hint" style="margin-top:6px">Twój odcisk do porównania na głos: <code>' + esc(ORG.boot.identity.fingerprint) + '</code></div>');
      box.innerHTML = '<span id="orgUiMark" hidden></span>' + H.join('');
      return;
    }

    const open = ORG.vault.isOpen();
    H.push('<div class="hint">' + (open ? pill('success', 'skarbiec otwarty') : pill('gray', 'zablokowany')) +
      ' Pokolenie klucza: ' + ORG.boot.generation +
      (ORG.boot.has_recovery ? ' · wydruk klucza odzyskiwania: jest' : ' · <b>brak wydruku klucza odzyskiwania</b>') + '</div>');
    if (!open) {
      // Trzy różne stany, trzy różne komunikaty. Wcześniej wszystkie trzy
      // mówiły „zamknął się po godzinie bezczynności" — czyli interfejs
      // podawał przyczynę, której nie znał.
      const powod = ORG.vaultError || ORG.bootError;
      const bledy = ORG.branchErrors || [];
      if (ORG.lockedByTimer) {
        H.push('<div class="hint" style="margin-top:6px">Skarbiec zamknął się po godzinie bezczynności. Odśwież panel — otworzy się sam, bez pytania.</div>');
      } else if (powod || bledy.length) {
        H.push('<div class="hint" style="margin-top:6px">⚠ Nie udało się otworzyć skarbca.</div>');
        if (powod) H.push('<div class="hint"><b>' + esc(powod) + '</b></div>');
        bledy.forEach(b2 => H.push('<div class="hint">koperta filii <b>' + esc(b2.branch) +
          '</b> (' + esc(b2.kind || '?') + '): ' + esc(b2.msg) + '</div>'));
      } else {
        // Nie wiem dlaczego — więc mówię, że nie wiem, i pokazuję surowy stan.
        H.push('<div class="hint" style="margin-top:6px">⚠ Skarbiec się nie otworzył i <b>nie wiem dlaczego</b>. ' +
          'Stan: pokolenie ' + esc(String(ORG.boot.generation)) +
          ', koperta organizacji ' + (ORG.boot.org_wrap ? 'jest' : 'brak') +
          ', kopert filii ' + ((ORG.boot.branch_wraps || []).length) +
          ', urządzenie ' + (ORG.boot.device && ORG.boot.device.wrap ? 'ma kopertę' : 'BEZ koperty') + '.</div>');
      }
      H.push('<div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.reopen()">Spróbuj ponownie</button>' +
        (ORG.boot.is_owner && ORG.boot.has_recovery
          ? '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.recover()">🗝 Odzyskaj z wydruku</button>' : '') +
        '</div>');
    }

    if (open) {
      const names = Object.keys(ORG.vault.branches);
      H.push('<div class="hint" style="margin-top:8px">Widzisz dane: <b>' + (names.length ? names.map(esc).join(', ') : '—') + '</b></div>');
      // TA filia może jeszcze nie mieć własnego klucza — bez tego przycisku
      // nie byłoby jak jej dołączyć, a zapisy cicho by nie wychodziły.
      if (!ORG.vault.branch(br())) {
        const nm = (typeof currentBranchDef === 'function' && currentBranchDef()) ? currentBranchDef().name : (br() || 'ta szkoła');
        H.push('<div class="hint" style="margin-top:8px">„' + esc(nm) + '" nie ma jeszcze własnego klucza, ' +
          'więc jej dane zostają tylko na tym komputerze.</div>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="TAKT_ORG.enable()">Dołącz „' + esc(nm) + '" do Chmury+</button>');
        box.innerHTML = H.join('');
        return;
      }
      if (ORG.pullSkipped) H.push('<div class="hint" style="margin-top:6px">⚠ Nie wczytałem z chmury: <b>' +
        esc(ORG.pullSkipped) + '</b>. Wyślij dane z tego komputera albo wczytaj ręcznie.</div>');
      const czeka = bGet(DIRTY_KEY) === '1';
      H.push('<div class="hint" style="margin-top:6px">Wersja paczki tej filii: <b>' + lastVer() + '</b>' +
        (czeka ? ' · <b>⚠ lokalne zmiany czekają na wysłanie</b>' : ' · wysłane') + '</div>');
      H.push('<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.pull(true)">⬇ Wczytaj z chmury</button>' +
        '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.pushNow()">⬆ Wyślij do chmury</button></div>');

      const pend = ORG.boot.pending_people || [];
      if (pend.length) {
        H.push('<div class="form-group" style="margin:14px 0 0;padding-top:12px;border-top:1px solid var(--border)">' +
          '<label style="font-size:.8rem">Czekają na dostęp</label>');
        pend.forEach(p => H.push('<div class="row" style="gap:8px;align-items:center;margin-bottom:6px">' +
          '<span style="flex:1">' + esc(p.email) + '<br><code style="font-size:.8rem">' + esc(p.fingerprint) + '</code></span>' +
          '<button class="btn btn-primary btn-sm" onclick="TAKT_ORG.grant(' + q(p.email) + ',' + q(p.fingerprint) + ')">Wpuść</button></div>'));
        H.push('<div class="hint">Zadzwoń i porównajcie odcisk na głos — to jedyna obrona przed podstawionym kluczem.</div></div>');
      }

      H.push('<div class="form-group" style="margin:14px 0 0;padding-top:12px;border-top:1px solid var(--border)">' +
        '<label style="font-size:.8rem">Urządzenia</label>');
      const zatwM = (ORG.boot.my_devices || []).filter(x => x.approved).length;
      (ORG.boot.my_devices || []).forEach(d => H.push('<div class="row" style="gap:8px;align-items:baseline">' +
        '<span class="hint" style="flex:1">' + (d.approved ? '✓' : '○') + ' ' + esc(d.label || d.device_id) +
        (d.device_id === ORG.dev.device_id ? ' <b>(to urządzenie)</b>' : '') +
        (d.last_seen_at ? ' · ' + new Date(d.last_seen_at).toLocaleString('pl-PL') : '') + '</span>' +
        '<button class="btn btn-ghost btn-sm" style="color:#A3392A" onclick="TAKT_ORG.revokeDevice(' +
        q(ORG.boot.email) + ',' + q(d.device_id) + ',' + q(d.label || '') + ',' + zatwM + ')">Odbierz</button></div>'));
      H.push('<div class="row" style="gap:8px;margin-top:8px">' +
        '<input type="text" id="orgDevCode" placeholder="kod 6 cyfr z nowego urządzenia" inputmode="numeric" style="flex:1">' +
        '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.approve(document.getElementById(\'orgDevCode\').value)">Wpuść</button></div></div>');
    }

    box.innerHTML = '<span id="orgUiMark" hidden></span>' + H.join('');
  }
  // Cudzysłowy w atrybucie onclick MUSZĄ być encjami, inaczej atrybut urywa
  // się w połowie i kliknięcie nic nie robi (ta sama pułapka co w liście obecności).
  function q(v) { return JSON.stringify(String(v)).replace(/"/g, '&quot;'); }

  /* Wpuszczenie PRACOWNIKA filii. Różnica wobec właściciela jest zasadnicza:
     pieczętujemy klucz TEJ JEDNEJ filii, nie klucz organizacji — więc z tej
     koperty nie da się dojść do pozostałych lokalizacji. Wymaga, żeby
     wywołujący miał otwarty klucz tej filii (czyli był właścicielem). */
  async function grantStaff(email, branch, fingerprint) {
    const slot = ORG.vault.branch(branch);
    if (!slot) { alert('Nie mam otwartego klucza filii „' + branch + '" — przełącz się na nią i spróbuj ponownie.'); return; }
    if (!confirm('Dać kontu ' + email + ' dostęp do danych filii „' + branch + '"?\n\n' +
      'Najpierw potwierdźcie na głos odcisk:\n' + fingerprint +
      '\n\nTo konto NIE dostanie klucza organizacji — pozostałych filii nie odczyta.')) return;
    try {
      const pk = await rpc('get_public_key', { p_email: email });
      if (pk.fingerprint !== fingerprint) { alert('Odcisk zmienił się w trakcie — przerywam. Porównajcie od nowa.'); return; }
      const raw = new Uint8Array(await K.exportSym(slot.key));
      const wrap = await K.sealTo(pk.pub_jwk, raw, 'staff');
      await rpc('grant_staff', { p_email: email, p_branch: branch, p_branch_gen: slot.gen, p_wrap: wrap });
      alert(email + ' ma dostęp do filii „' + branch + '".\n\nNiech odświeży panel.');
      renderChmuraTab();
    } catch (e) { alert(e.message || e); }
  }

  /* Odebranie dostępu JEDNEMU urządzeniu — zgubiony telefon, sprzedany laptop.
     Tania operacja: nie rotuje kluczy i nie przeszyfrowuje paczek, bo koperta
     urządzenia jest kluczem do TOŻSAMOŚCI, nie do danych filii.
     Komunikat musi powiedzieć trzy rzeczy, których użytkownik sam nie wywnioskuje:
     czy to jego ostatnie urządzenie, czy to sprzęt, na którym właśnie pracuje,
     i że nie odbieramy tego, co ten sprzęt już pobrał.                        */
  async function revokeDevice(email, deviceId, label, approvedLeft) {
    const mojeKonto = email === (ORG.boot && ORG.boot.email);
    const toTen = mojeKonto && ORG.dev && deviceId === ORG.dev.device_id;
    const ostatnie = approvedLeft <= 1;
    let t = 'Odebrać dostęp urządzeniu „' + (label || deviceId) + '"';
    t += mojeKonto ? ' (Twoje konto)?' : ' konta ' + email + '?';
    t += '\n\nPo odświeżeniu ten sprzęt nie odczyta już danych z chmury.';
    if (toTen) t += '\n\n⚠️ TO URZĄDZENIE, NA KTÓRYM TERAZ PRACUJESZ. Po odświeżeniu ten panel ' +
      'będzie musiał zgłosić się od nowa.';
    if (ostatnie) t += mojeKonto
      ? '\n\n⚠️ To Twoje OSTATNIE wpuszczone urządzenie. Wrócisz ' +
        (ORG.boot.is_owner ? 'kluczem z wydruku.' : 'dopiero gdy właściciel wpuści Cię ponownie.')
      : '\n\n⚠️ To OSTATNIE wpuszczone urządzenie tego konta — straci dostęp do danych, ' +
        'dopóki nie wpuścisz go ponownie.';
    t += '\n\nUczciwie: to NIE odbiera danych, które ten sprzęt już pobrał. Kopia lokalna ' +
      'i plik kopii zapasowej na nim zostają.';
    if (!confirm(t)) return;
    try {
      const r = await rpc('revoke_device', { p_email: email, p_device_id: deviceId });
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      renderOrgUI();
      if (document.getElementById('tab-chmura')) renderChmuraTab();
      alert('Dostęp odebrany.' + (r.remaining
        ? ' Temu kontu zostaje ' + r.remaining + ' ' + (r.remaining === 1 ? 'urządzenie.' : 'urządzeń.')
        : ' To konto nie ma już żadnego wpuszczonego urządzenia.'));
    } catch (e) { alert('Nie udało się: ' + (e.message || e)); }
  }

  /* ═══════════════ 5bis. ODZYSKANIE Z WYDRUKU ═══════════════
     Ostatnia brakująca ścieżka. Wchodzi w grę, gdy właściciel stracił WSZYSTKIE
     urządzenia — czyli nie ma czym odpakować swojego klucza prywatnego i nie ma
     kogo poprosić o kod. Wydruk jest wtedy jedyną drogą do klucza organizacji.

     KOLEJNOŚĆ JEST KRYTYCZNA i nieprzypadkowa:
       1. NAJPIERW sprawdzamy, czy klucz z kartki faktycznie otwiera klucz
          organizacji — `register_identity` KASUJE stare koperty i urządzenia,
          więc literówka wykonana za wcześnie kosztowałaby dostęp,
       2. dopiero potem nowa tożsamość + to urządzenie,
       3. na koniec wystawiamy sobie kopertę klucza organizacji.

     Tożsamość jest jednorazowa, trwały jest klucz organizacji — to sedno
     całego projektu i tutaj się opłaca.                                       */
  async function recoverFromPrint() {
    const wpis = prompt('Wpisz klucz odzyskiwania z wydruku.\n\n' +
      'Osiem grup po cztery znaki. Wielkość liter i myślniki nie mają znaczenia; ' +
      'jeśli przepisałeś zero jako O albo jedynkę jako I, też sobie poradzę.');
    if (wpis === null) return;
    const pass = K.normRecoveryKey(wpis);
    if (pass.length !== 32) {
      alert('To nie wygląda na klucz z wydruku.\n\nPo odrzuceniu myślników powinno zostać ' +
        '32 znaki (osiem grup po cztery), a jest ' + pass.length + '.');
      return;
    }
    try {
      // ── 1. WERYFIKACJA przed czymkolwiek destrukcyjnym ──
      const rec = await rpc('get_recovery_wrap');
      let orgRaw;
      try { orgRaw = await K.openWithPassphrase(pass, rec.wrap); }
      catch (e) {
        alert('Ten klucz NIE otwiera danych tej szkoły.\n\nSprawdź przepisanie — ' +
          'w kluczu nie ma liter I, L, O ani U. Nic nie zostało zmienione.');
        return;
      }
      if (!confirm('Klucz z wydruku pasuje — pokolenie ' + rec.generation + '. ✓\n\n' +
        'Założę teraz nową tożsamość na tym urządzeniu i wystawię sobie kopertę klucza organizacji.\n\n' +
        'Twoje pozostałe urządzenia przestaną działać i będą musiały zgłosić się od nowa. ' +
        'Dane w chmurze zostają nietknięte.')) return;

      // ── 2. nowa tożsamość + to urządzenie (kasuje stare koperty i urządzenia) ──
      await createIdentity();
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });

      // ── 3. koperta klucza organizacji na mój NOWY klucz publiczny ──
      const wrap = await K.sealTo(ORG.boot.identity.pub_jwk, orgRaw, 'org');
      await rpc('grant_owner', { p_email: ORG.boot.email, p_wrap: wrap });

      ORG.deadEnd = false; ORG.waiting = false; ORG.pendingCode = null;
      ORG.vaultError = null; ORG.bootError = null;
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      try { await openVault(); } catch (e) { ORG.vaultError = e.message || String(e); }
      renderOrgUI();
      if (document.getElementById('tab-chmura')) renderChmuraTab();
      alert(ORG.vault.isOpen()
        ? 'Odzyskane. Skarbiec otwarty na tym urządzeniu.\n\nWydruk NADAL jest ważny — nie wyrzucaj go.'
        : 'Koperta wystawiona, ale skarbiec się nie otworzył. Odśwież panel.');
    } catch (e) {
      const m = e.message || String(e);
      alert(/właściciela/i.test(m)
        ? 'Klucz z wydruku otwiera dane całej szkoły, więc mogą go użyć tylko właściciele.\n\n' +
          'Konto filii odzyskuje dostęp inaczej: właściciel wpuszcza je ponownie jednym kliknięciem.'
        : 'Nie udało się odzyskać: ' + m);
    }
  }

  /* ═══════════════ 5c. ODEBRANIE DOSTĘPU (kafel E7) ═══════════════
     Najdroższa i najbardziej ryzykowna operacja w całym rozwiązaniu.
     Użytkownik widzi jeden przycisk i listę postępu; pod spodem dzieje się:
       1. odczyt i odszyfrowanie paczek WSZYSTKICH filii (zanim cokolwiek ruszymy),
       2. usunięcie kopert odchodzącego,
       3. nowe pokolenie klucza organizacji + nowe koperty dla ZOSTAJĄCYCH,
       4. nowe klucze filii — bo odchodzący znał stare,
       5. przeszyfrowanie paczek,
       6. przepieczętowanie kopert pracowników na nowe klucze filii,
       7. nowy wydruk klucza odzyskiwania (stary otwierałby nowe pokolenie!),
       8. wycofanie starych pokoleń — DOPIERO teraz.

     KOLEJNOŚĆ NIE JEST DOWOLNA. Paczki czytamy na początku, a stare klucze
     wycofujemy na końcu, żeby przerwanie w środku (zamknięta karta, brak sieci)
     nie zostawiło danych zaszyfrowanych kluczem, którego nikt już nie odpakuje.  */
  let revokeRunning = false;

  function drawSteps(title, steps, warn) {
    const box = document.getElementById('tab-chmura');
    if (!box) return;
    box.innerHTML = '<span id="orgUiMark" hidden></span><div class="card">' +
      '<h2 style="margin-bottom:14px">' + esc(title) + '</h2>' +
      steps.map(st => '<div class="org-row">' +
        (st.s === 'ok' ? '<span class="org-ok">✓</span>' : st.s === 'run' ? '<span class="org-run">◐</span>' :
         st.s === 'err' ? '<span class="org-no" style="color:#A3392A">✕</span>' : '<span class="org-no">○</span>') +
        '<span class="org-nm">' + esc(st.t) + (st.note ? '<br><span class="hint">' + esc(st.note) + '</span>' : '') + '</span></div>').join('') +
      (warn ? '<div class="org-hero bad" style="margin-top:14px"><b>Powiedz to wprost</b>' +
        '<div style="margin-top:6px">' + warn + '</div></div>' : '') + '</div>';
  }

  async function revokeOwner(email) {
    if (revokeRunning) return;
    if (!ORG.vault.orgKey) { alert('Ta operacja wymaga klucza organizacji — zaloguj się jako właściciel.'); return; }
    if (!confirm('Odebrać ' + email + ' dostęp do WSZYSTKICH danych szkoły?\n\n' +
      'Przeszyfruję paczki wszystkich filii i wygeneruję NOWY klucz odzyskiwania — stary wydruk przestanie działać.\n\n' +
      'Uczciwie: to odbiera dostęp do PRZYSZŁYCH zapisów. Kopii, którą ta osoba zdążyła zapisać wcześniej, nie odbierze żaden klucz.')) return;
    revokeRunning = true;
    const warn = 'Od tej chwili ' + esc(email) + ' nie przeczyta <b>nowych</b> zapisów. ' +
      'Kopii zapisanej wcześniej nie odbierze żaden klucz.';
    const nazwy = Object.keys(ORG.vault.branches);
    const steps = [{ t: 'Czytam paczki wszystkich filii', s: 'run' },
      { t: 'Usuwam koperty ' + email, s: '' },
      { t: 'Nowe pokolenie klucza organizacji', s: '' }]
      .concat(nazwy.map(b => ({ t: 'Przeszyfrowuję ' + b, s: '' })))
      .concat([{ t: 'Przepieczętowuję dostęp filii', s: '' },
               { t: 'Nowy klucz odzyskiwania do wydruku', s: '' },
               { t: 'Wycofuję stare klucze', s: '' }]);
    const go = (i, st, note) => { steps[i].s = st; if (note) steps[i].note = note; drawSteps('Odbieram dostęp: ' + email, steps, warn); };
    drawSteps('Odbieram dostęp: ' + email, steps, warn);
    try {
      // 1. paczki NAJPIERW — dopóki stare klucze jeszcze działają
      const dane = {};
      for (const b of nazwy) {
        const row = await rpc('state_load_v2', { p_branch: b || null });
        if (row && row.data) {
          const slot = ORG.vault.branch(b);
          const key = (slot.keys && slot.keys[row.data.gen]) || slot.key;
          dane[b] = { obj: await K.decryptPack(key, row.data, b, row.data.gen, null), version: row.version };
        }
      }
      go(0, 'ok', Object.keys(dane).length + ' z ' + nazwy.length + ' filii miało paczkę w chmurze');

      // 2. koperty odchodzącego
      const r = await rpc('revoke_access', { p_email: email });
      go(1, 'ok', r.was_owner ? 'był właścicielem' : 'nie miał koperty organizacji');

      // 3. nowe pokolenie + koperty dla ZOSTAJĄCYCH
      const gen = (ORG.boot.generation || 1) + 1;
      const orgKey = await K.newSymKey();
      const raw = new Uint8Array(await K.exportSym(orgKey));
      const zostaja = (ORG.boot.org_members || []).filter(m => m.email !== email).map(m => m.email);
      if (zostaja.indexOf(ORG.boot.email) < 0) zostaja.push(ORG.boot.email);
      const wraps = [];
      for (const em of zostaja) {
        const pk = await rpc('get_public_key', { p_email: em });
        wraps.push({ email: em, wrap: await K.sealTo(pk.pub_jwk, raw, 'org') });
      }
      const rk = K.newRecoveryKey();
      const recWrap = await K.wrapWithPassphrase(K.normRecoveryKey(rk), raw);
      // Nowe klucze filii + STARE przepieczętowane na nowe pokolenie. Stare są
      // tu kluczowe: bez nich przerwana rotacja czyni paczki nieczytelnymi.
      const bwraps = [], noweBek = {};
      for (const b of nazwy) {
        const slot = ORG.vault.branch(b);
        bwraps.push({ branch: b, branch_gen: slot.gen, wrap: await K.wrapKeyUnder(orgKey, slot.key, bInfo(b) + slot.gen) });
        noweBek[b] = { gen: slot.gen + 1, key: await K.newSymKey() };
        bwraps.push({ branch: b, branch_gen: noweBek[b].gen, wrap: await K.wrapKeyUnder(orgKey, noweBek[b].key, bInfo(b) + noweBek[b].gen) });
      }
      await rpc('rotate_org_key', {
        p_generation: gen, p_wraps: wraps, p_recovery: recWrap,
        p_branch_wraps: bwraps, p_reason: 'revoke:' + email,
        p_label: 'wydruk ' + new Date().toLocaleDateString('pl-PL') + ' po odebraniu dostępu'
      });
      ORG.vault.orgKey = orgKey; ORG.vault.generation = gen;
      go(2, 'ok', 'pokolenie ' + gen + ', kopert dla zostających: ' + wraps.length);

      // 4. przeszyfrowanie paczek nowym kluczem filii
      for (let i = 0; i < nazwy.length; i++) {
        const b = nazwy[i];
        go(3 + i, 'run');
        const nk = noweBek[b];
        ORG.vault.branches[b] = { gen: nk.gen, key: nk.key, keys: Object.assign({}, ORG.vault.branches[b].keys, { [nk.gen]: nk.key }) };
        if (dane[b]) {
          const ver = (dane[b].version || 0) + 1;
          const pack = await K.encryptPack(nk.key, dane[b].obj, b, nk.gen, ver);
          await rpc('state_save_v2', { p_data: pack, p_version: ver, p_branch_gen: nk.gen, p_device: deviceName(), p_branch: b || null, p_force: true });
          if (b === br()) bSet(VER_KEY, String(ver));
          go(3 + i, 'ok', 'wersja ' + ver);
        } else go(3 + i, 'ok', 'nie było paczki w chmurze');
      }

      // 5. pracownicy filii — na NOWE klucze
      let ile = 0;
      try {
        for (const st of (await rpc('list_branch_staff') || [])) {
          if (!st.has_key || !st.has_identity || !noweBek[st.branch]) continue;
          if (st.email === email) continue;
          const pk = await rpc('get_public_key', { p_email: st.email });
          const nk = noweBek[st.branch];
          await rpc('grant_staff', { p_email: st.email, p_branch: st.branch, p_branch_gen: nk.gen,
                                     p_wrap: await K.sealTo(pk.pub_jwk, new Uint8Array(await K.exportSym(nk.key)), 'staff') });
          ile++;
        }
      } catch (e) { /* brak kont filii */ }
      go(nazwy.length + 3, 'ok', ile ? ile + ' kont filii przepieczętowanych' : 'brak kont filii');

      // 6. wycofanie starych pokoleń — DOPIERO gdy paczki są już przeszyfrowane
      for (const b of nazwy) { try { await rpc('retire_branch_gen', { p_branch: b, p_branch_gen: noweBek[b].gen - 1 }); } catch (e) {} }
      go(nazwy.length + 4, 'ok');
      go(nazwy.length + 5, 'ok');
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      showRecovery(rk);
    } catch (e) {
      const i = steps.findIndex(x => x.s === 'run');
      if (i >= 0) go(i, 'err', e.message || String(e));
      alert('Rewokacja przerwana: ' + (e.message || e) +
        '\n\nStare klucze NIE zostały wycofane, więc dane są nadal czytelne. Spróbuj ponownie.');
    }
    revokeRunning = false;
  }

  async function revokeStaff(email, branch) {
    if (revokeRunning) return;
    const slot = ORG.vault.branch(branch);
    if (!slot || !ORG.vault.orgKey) { alert('Potrzebny otwarty klucz organizacji i klucz tej filii.'); return; }
    if (!confirm('Odebrać ' + email + ' dostęp do filii „' + branch + '"?\n\n' +
      'Wymienię klucz TEJ filii i przeszyfruję jej paczkę. Pozostałe filie i klucz odzyskiwania zostają bez zmian.\n\n' +
      'Uczciwie: to odbiera dostęp do przyszłych zapisów, nie do kopii zrobionej wcześniej.')) return;
    revokeRunning = true;
    const steps = [{ t: 'Czytam paczkę filii ' + branch, s: 'run' }, { t: 'Usuwam koperty ' + email, s: '' },
                   { t: 'Nowy klucz filii', s: '' }, { t: 'Przeszyfrowuję paczkę', s: '' },
                   { t: 'Przepieczętowuję pozostałe konta filii', s: '' }, { t: 'Wycofuję stary klucz', s: '' }];
    const go = (i, st, note) => { steps[i].s = st; if (note) steps[i].note = note; drawSteps('Odbieram dostęp do filii: ' + email, steps, 'Od tej chwili ' + esc(email) + ' nie przeczyta <b>nowych</b> zapisów tej filii.'); };
    drawSteps('Odbieram dostęp do filii: ' + email, steps, '');
    try {
      const row = await rpc('state_load_v2', { p_branch: branch || null });
      let obj = null, ver = 0;
      if (row && row.data) {
        const key = (slot.keys && slot.keys[row.data.gen]) || slot.key;
        obj = await K.decryptPack(key, row.data, branch, row.data.gen, null); ver = row.version || 0;
      }
      go(0, 'ok', obj ? 'odczytana' : 'brak paczki w chmurze');
      await rpc('revoke_access', { p_email: email });
      go(1, 'ok');
      const nGen = slot.gen + 1, nBek = await K.newSymKey();
      // p_retire_previous = false: stary klucz zostaje aktywny, dopóki paczka
      // nie jest przeszyfrowana. Inaczej przerwanie tu zostawia dane bez klucza.
      await rpc('set_branch_key', { p_branch: branch, p_branch_gen: nGen,
        p_org_wrap: await K.wrapKeyUnder(ORG.vault.orgKey, nBek, bInfo(branch) + nGen),
        p_staff_wraps: [], p_retire_previous: false });
      ORG.vault.branches[branch] = { gen: nGen, key: nBek, keys: Object.assign({}, slot.keys, { [nGen]: nBek }) };
      go(2, 'ok', 'pokolenie ' + nGen);
      if (obj) {
        const nv = ver + 1;
        await rpc('state_save_v2', { p_data: await K.encryptPack(nBek, obj, branch, nGen, nv),
          p_version: nv, p_branch_gen: nGen, p_device: deviceName(), p_branch: branch || null, p_force: true });
        if (branch === br()) bSet(VER_KEY, String(nv));
        go(3, 'ok', 'wersja ' + nv);
      } else go(3, 'ok', 'nic do przeszyfrowania');
      let ile = 0;
      for (const st of (await rpc('list_branch_staff') || [])) {
        if (st.branch !== branch || st.email === email || !st.has_key || !st.has_identity) continue;
        const pk = await rpc('get_public_key', { p_email: st.email });
        await rpc('grant_staff', { p_email: st.email, p_branch: branch, p_branch_gen: nGen,
          p_wrap: await K.sealTo(pk.pub_jwk, new Uint8Array(await K.exportSym(nBek)), 'staff') });
        ile++;
      }
      go(4, 'ok', ile ? ile + ' kont' : 'brak innych kont');
      await rpc('retire_branch_gen', { p_branch: branch, p_branch_gen: slot.gen });
      go(5, 'ok');
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      alert('Dostęp odebrany. Klucz odzyskiwania organizacji zostaje bez zmian.');
    } catch (e) {
      const i = steps.findIndex(x => x.s === 'run');
      if (i >= 0) go(i, 'err', e.message || String(e));
      alert('Przerwane: ' + (e.message || e) + '\n\nStary klucz filii NIE został wycofany — dane są czytelne.');
    }
    revokeRunning = false;
  }

  /* ═══════════════ 5b. ZAKŁADKA ☁ CHMURA ═══════════════
     Ekran, który właściciel widzi najczęściej: czy skarbiec otwarty, które
     filie są w chmurze i kiedy ostatnio, jakie urządzenia mają dostęp.

     Zakładka jest WSTRZYKIWANA z tego bloku (przycisk w <nav> + <div class="tab">),
     a nie wpisana w szablon — dzięki temu całe wpięcie zostaje jednym blokiem
     i port do produktu nadal jest przeniesieniem, nie scalaniem.

     Pokazuje się WYŁĄCZNIE na filii głównej (pierwsza w `TAKT_CONFIG.branches`,
     czyli Centrum na demie / Ornontowice na Teamie) albo gdy szkoła nie ma filii.
     To ekran właściciela — pracownik jednej lokalizacji nie ma po co widzieć
     stanu pozostałych.                                                        */
  const isMainBranch = () => (typeof BRANCHES === 'undefined' || !BRANCHES) || br() === BRANCHES[0].key;

  function kiedy(ms) {
    if (!ms) return '—';
    const d = new Date(Number(ms)), teraz = Date.now(), min = Math.round((teraz - d.getTime()) / 60000);
    if (min < 1) return 'teraz';
    if (min < 60) return min + ' min';
    const dzis = new Date(); dzis.setHours(0, 0, 0, 0);
    if (d >= dzis) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const wczoraj = new Date(dzis); wczoraj.setDate(wczoraj.getDate() - 1);
    if (d >= wczoraj) return 'wczoraj';
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  }

  function installTab() {
    if (!isMainBranch()) return;
    const nav = document.querySelector('nav');
    const tabBackup = document.getElementById('tab-backup');
    if (!nav || !tabBackup || document.getElementById('navChmura')) return;

    const btnBackup = Array.prototype.find.call(nav.querySelectorAll('button'),
      b => /backup/i.test(b.getAttribute('onclick') || ''));
    const btn = document.createElement('button');
    btn.id = 'navChmura';
    btn.textContent = '☁ Chmura';
    nav.insertBefore(btn, btnBackup || null);

    const div = document.createElement('div');
    div.id = 'tab-chmura';
    div.className = 'tab';
    tabBackup.parentNode.insertBefore(div, tabBackup);

    // Własne przełączenie zakładki: `showTab()` opiera się na globalnym `event`
    // i na swoim switchu, a ja nie chcę zależeć od jego wnętrza.
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
      const chip = document.getElementById('allFilieChip'); if (chip) chip.classList.remove('active');
      div.classList.add('active');
      btn.classList.add('active');
      if (typeof updateViewToggleVisibility === 'function') updateViewToggleVisibility();
      renderChmuraTab();
    });

    if (!document.getElementById('orgTabStyle')) {
      const st = document.createElement('style');
      st.id = 'orgTabStyle';
      st.textContent =
        '#tab-chmura .org-sec{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
        'color:var(--text-muted);margin:18px 0 8px}' +
        '#tab-chmura .org-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)}' +
        '#tab-chmura .org-row:last-child{border-bottom:0}' +
        '#tab-chmura .org-row .org-ok{color:#16794F;font-weight:700;width:1.1em;flex:none}' +
        '#tab-chmura .org-row .org-no{color:#B8B8B8;font-weight:700;width:1.1em;flex:none}' +
        '#tab-chmura .org-row .org-nm{flex:1;font-weight:600}' +
        '#tab-chmura .org-row .org-when{color:var(--text-muted);font-size:.85rem;font-variant-numeric:tabular-nums}' +
        '#tab-chmura .org-hero{border:1px solid #BFE0CE;background:#F3FAF6;border-radius:12px;padding:14px 16px}' +
        '#tab-chmura .org-hero.bad{border-color:#E9C4BC;background:#FDF3F1}' +
        '#tab-chmura .org-hero.warn{border-color:#E8D3A8;background:#FDF8EC}' +
        '#tab-chmura .org-fp{font-family:ui-monospace,Menlo,monospace;font-size:.85rem}' +
        '#tab-chmura .org-run{color:#8A6D34;font-weight:700;width:1.1em;flex:none}';
      document.head.appendChild(st);
    }
  }

  async function renderChmuraTab() {
    const box = document.getElementById('tab-chmura');
    if (!box) return;
    const H = [];
    H.push('<div class="card"><h2 style="margin-bottom:14px">☁ Chmura i klucz organizacji</h2>');

    if (ORG.blocked || ORG.deadEnd || !ORG.boot) {
      H.push('<div class="org-hero bad"><b>Chmura+ nie jest gotowa na tym urządzeniu.</b>' +
        '<div class="hint" style="margin-top:6px">Szczegóły i wyjście: <b>☁ Chmura i konto</b> w pasku Grafiku.</div></div></div>');
      box.innerHTML = H.join(''); return;
    }
    // Te dwa stany zakładka wcześniej ignorowała i pokazywała „zablokowany"
    // z wymyślonym powodem — a to są normalne etapy, nie awaria.
    if (ORG.pendingCode) {
      H.push('<div class="org-hero warn"><b>To urządzenie czeka na wpuszczenie.</b>' +
        '<div style="margin-top:6px">Otwórz panel na urządzeniu, które już działa, wejdź w ' +
        '<b>☁ Chmura</b> i wpisz tam ten kod:</div>' +
        '<div style="font:600 26px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-align:center;padding:12px 0">' +
        esc(ORG.pendingCode) + '</div>' +
        '<div class="hint">Kod jest ważny 10 minut. Odcisk tego urządzenia: <code>' + esc(ORG.dev.fingerprint) + '</code></div>' +
        '<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="TAKT_ORG.noDevice()">Nie mam już żadnego działającego urządzenia →</button></div></div>');
      box.innerHTML = H.join(''); return;
    }
    if (ORG.waiting) {
      H.push('<div class="org-hero warn"><b>Czekasz na dostęp do danych.</b>' +
        '<div style="margin-top:6px">Twoje konto ma już własny klucz, ale nikt Cię jeszcze nie wpuścił. ' +
        'Poproś właściciela — musi kliknąć jedno potwierdzenie.</div>' +
        '<div class="hint" style="margin-top:6px">Twój odcisk do porównania na głos: <code>' +
        esc(ORG.boot.identity ? ORG.boot.identity.fingerprint : '—') + '</code></div></div></div>');
      box.innerHTML = H.join(''); return;
    }
    if (!ORG.boot.generation) {
      H.push('<div class="org-hero warn"><b>Chmura+ wyłączona.</b>' +
        '<div class="hint" style="margin-top:6px">Wpłaty, uczestnicy i obecność leżą tylko na tym komputerze. ' +
        'Włącz Chmurę+, żeby widzieć je także na telefonie i w filiach.</div>' +
        '<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="TAKT_ORG.enable()">Włącz Chmurę+</button></div></div>');
      box.innerHTML = H.join(''); return;
    }

    const open = ORG.vault.isOpen();
    H.push(open
      ? '<div class="org-hero"><span class="badge badge-success">● Skarbiec otwarty</span>' +
        '<div style="margin-top:8px">To urządzenie ma własny klucz. <b>Nic nie musisz wpisywać.</b></div></div>'
      : '<div class="org-hero warn"><span class="badge badge-warning">Skarbiec zablokowany</span>' +
        '<div style="margin-top:8px">' + esc(ORG.vaultError || ORG.bootError ||
          'Zamknął się po godzinie bezczynności — odśwież panel, otworzy się sam.') + '</div>' +
        '<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="TAKT_ORG.reopen()">Spróbuj ponownie</button></div>');

    // ── WIDZISZ DANE: filia po filii, z czasem ostatniego zapisu ──
    H.push('<div class="org-sec">Widzisz dane</div>');
    let packs = {};
    if (ORG.boot.is_owner) {
      try {
        (await rpc('load_all_branches') || []).forEach(r => { packs[r.branch || ''] = r; });
      } catch (e) { /* brak uprawnień albo offline — pokażemy same klucze */ }
    }
    const lista = (typeof BRANCHES !== 'undefined' && BRANCHES)
      ? BRANCHES.map(b => ({ key: b.key, name: b.name }))
      : [{ key: '', name: TAKT_CONFIG.schoolName || 'Szkoła' }];
    lista.forEach(b => {
      const maKlucz = !!ORG.vault.branch(b.key);
      const pack = packs[b.key];
      H.push('<div class="org-row">' +
        (maKlucz ? '<span class="org-ok">✓</span>' : '<span class="org-no">○</span>') +
        '<span class="org-nm">' + esc(b.name) + (b.key === br() ? ' <span class="hint">(oglądasz)</span>' : '') + '</span>' +
        '<span class="org-when">' + (maKlucz
          ? (pack ? kiedy(pack.updated_at) : 'jeszcze nic nie wysłano')
          : 'bez Chmury+') + '</span></div>');
    });
    if (!ORG.vault.branch(br())) {
      const nm = (typeof currentBranchDef === 'function' && currentBranchDef()) ? currentBranchDef().name : 'ta filia';
      H.push('<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="TAKT_ORG.enable()">Dołącz „' + esc(nm) + '" do Chmury+</button>');
    }

    // ── właściciele: kto ma dziś klucz organizacji ──
    const czlonkowie = (ORG.boot.org_members || []).filter(m => m.email !== ORG.boot.email);
    if (ORG.boot.is_owner && (czlonkowie.length || ORG.boot.org_members.length)) {
      H.push('<div class="org-sec">Dostęp do wszystkich danych</div>');
      H.push('<div class="org-row"><span class="org-ok">✓</span><span class="org-nm">' +
        esc(ORG.boot.email) + ' <span class="hint">(Ty)</span></span></div>');
      czlonkowie.forEach(m => H.push('<div class="org-row"><span class="org-ok">✓</span>' +
        '<span class="org-nm">' + esc(m.email) +
        (m.fingerprint ? '<br><span class="org-fp hint">' + esc(m.fingerprint) + '</span>' : '') + '</span>' +
        '<button class="btn btn-outline btn-sm" style="color:#A3392A;border-color:#A3392A" onclick="TAKT_ORG.revokeOwner(' + q(m.email) + ')">Odbierz dostęp</button></div>'));
      if (czlonkowie.length) H.push('<div class="hint">Odebranie dostępu wymienia klucz organizacji i klucze wszystkich filii, ' +
        'przeszyfrowuje paczki i daje <b>nowy klucz odzyskiwania</b> — stary wydruk przestaje działać.</div>');
    }

    // ── kto czeka na dostęp ──
    const pend = ORG.boot.pending_people || [];
    if (pend.length) {
      H.push('<div class="org-sec">Czekają na dostęp</div>');
      pend.forEach(x => H.push('<div class="org-row"><span class="org-no">○</span>' +
        '<span class="org-nm">' + esc(x.email) + '<br><span class="org-fp hint">' + esc(x.fingerprint) + '</span></span>' +
        '<button class="btn btn-primary btn-sm" onclick="TAKT_ORG.grant(' + q(x.email) + ',' + q(x.fingerprint) + ')">Wpuść</button></div>'));
      H.push('<div class="hint">Zadzwoń i porównajcie odcisk na głos — to jedyna obrona przed podstawionym kluczem.</div>');
    }

    // ── konta filii (kafel E6) — tylko dla właściciela ──
    if (ORG.boot.is_owner) {
      let staff = [];
      try { staff = await rpc('list_branch_staff') || []; } catch (e) { /* offline */ }
      if (staff.length) {
        H.push('<div class="org-sec">Dostęp do danych filii</div>');
        staff.forEach(x => {
          const nazwaFilii = (typeof BRANCHES !== 'undefined' && BRANCHES && (BRANCHES.find(b => b.key === x.branch) || {}).name) || x.branch;
          let prawa;
          if (x.has_key) prawa = ORG.vault.branch(x.branch)
                ? '<button class="btn btn-outline btn-sm" style="color:#A3392A;border-color:#A3392A" onclick="TAKT_ORG.revokeStaff(' + q(x.email) + ',' + q(x.branch) + ')">Odbierz</button>'
                : '<span class="badge badge-success">ma dostęp</span>';
          else if (!x.has_identity) prawa = '<span class="hint">musi się raz zalogować</span>';
          else if (!ORG.vault.branch(x.branch)) prawa = '<span class="hint">przełącz się na tę filię</span>';
          else prawa = '<button class="btn btn-primary btn-sm" onclick="TAKT_ORG.grantStaff(' +
                q(x.email) + ',' + q(x.branch) + ',' + q(x.fingerprint || '') + ')">Wpuść</button>';
          H.push('<div class="org-row">' + (x.has_key ? '<span class="org-ok">✓</span>' : '<span class="org-no">○</span>') +
            '<span class="org-nm">' + esc(nazwaFilii) + '<br><span class="hint">' + esc(x.email) + '</span>' +
            (x.fingerprint ? '<br><span class="org-fp hint">' + esc(x.fingerprint) + '</span>' : '') + '</span>' + prawa + '</div>');
        });
        H.push('<div class="hint">Konto filii dostaje klucz <b>tylko swojej</b> lokalizacji — pozostałych nie odczyta.</div>');
      }
    }

    // ── urządzenia ──
    // Właściciel widzi WSZYSTKIE urządzenia w szkole, także te z filii —
    // `key_bootstrap` zwraca tylko własne, więc pytanie „ile komputerów ma
    // dostęp do naszych danych" wcześniej nie miało odpowiedzi.
    let wszystkie = null;
    if (ORG.boot.is_owner) {
      try { wszystkie = await rpc('list_all_devices'); } catch (e) { /* offline */ }
    }
    if (wszystkie) {
      const maja = wszystkie.filter(d => d.approved).length;
      const czekaja = wszystkie.filter(d => d.waiting).length;
      const osob = new Set(wszystkie.filter(d => d.approved).map(d => d.email)).size;
      H.push('<div class="org-sec">Urządzenia w całej szkole</div>');
      H.push('<div class="org-hero" style="margin-bottom:10px">' +
        '<b>' + maja + ' ' + (maja === 1 ? 'urządzenie ma' : 'urządzeń ma') + ' dostęp do Chmury+</b>' +
        ' — ' + osob + ' ' + (osob === 1 ? 'konto' : 'konta') +
        (czekaja ? ' · <b>' + czekaja + ' czeka na wpuszczenie</b>' : '') + '</div>');
      // Grupujemy po koncie, bo to jest jednostka dostępu — nie urządzenie.
      const poKoncie = {};
      wszystkie.forEach(d => { (poKoncie[d.email] = poKoncie[d.email] || []).push(d); });
      Object.keys(poKoncie).sort().forEach(em => {
        const lista = poKoncie[em], pierwszy = lista[0];
        const gdzie = pierwszy.is_owner ? 'wszystkie filie'
          : (pierwszy.branches || []).map(b => {
              const bb = (typeof BRANCHES !== 'undefined' && BRANCHES) ? BRANCHES.find(x => x.key === b) : null;
              return bb ? bb.name : b;
            }).join(', ') || 'bez filii';
        H.push('<div class="org-row"><span class="org-ok" style="color:var(--text-muted)">' +
          (pierwszy.is_owner ? '★' : '·') + '</span><span class="org-nm">' + esc(em) +
          '<br><span class="hint">' + esc(gdzie) + '</span></span>' +
          '<span class="org-when">' + lista.filter(d => d.approved).length + ' z ' + lista.length + '</span></div>');
        const zatw = lista.filter(x => x.approved).length;
        lista.forEach(d => H.push('<div class="org-row" style="padding-left:26px">' +
          (d.approved ? '<span class="org-ok">✓</span>' : '<span class="org-no">○</span>') +
          '<span class="org-nm" style="font-weight:400">' + esc(d.label || '(bez nazwy)') +
          (em === ORG.boot.email && ORG.dev && d.device_id === ORG.dev.device_id ? ' <b>(to urządzenie)</b>' : '') +
          '<br><span class="org-fp hint">' + esc(d.fingerprint || '') + '</span></span>' +
          '<span class="org-when">' + (d.approved ? kiedy(d.last_seen_at ? Date.parse(d.last_seen_at) : 0)
                                                  : (d.waiting ? 'czeka na kod' : 'nieaktywne')) + '</span>' +
          '<button class="btn btn-outline btn-sm" style="color:#A3392A;border-color:#A3392A;margin-left:8px" ' +
          'onclick="TAKT_ORG.revokeDevice(' + q(em) + ',' + q(d.device_id) + ',' + q(d.label || '') + ',' + zatw + ')">Odbierz</button>' +
          '</div>'));
      });
    } else {
      H.push('<div class="org-sec">Urządzenia</div>');
      const mojeZatw = (ORG.boot.my_devices || []).filter(x => x.approved).length;
      (ORG.boot.my_devices || []).forEach(d => H.push('<div class="org-row">' +
        (d.approved ? '<span class="org-ok">✓</span>' : '<span class="org-no">○</span>') +
        '<span class="org-nm">' + esc(d.label || d.device_id) +
        (d.device_id === ORG.dev.device_id ? ' <b>(to urządzenie)</b>' : '') + '</span>' +
        '<span class="org-when">' + (d.approved ? kiedy(d.last_seen_at ? Date.parse(d.last_seen_at) : 0) : 'czeka') + '</span>' +
        '<button class="btn btn-outline btn-sm" style="color:#A3392A;border-color:#A3392A;margin-left:8px" ' +
        'onclick="TAKT_ORG.revokeDevice(' + q(ORG.boot.email) + ',' + q(d.device_id) + ',' + q(d.label || '') + ',' + mojeZatw + ')">Odbierz</button>' +
        '</div>'));
    }
    H.push('<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">' +
      '<input type="text" id="orgTabCode" placeholder="kod 6 cyfr z nowego urządzenia" inputmode="numeric" style="flex:1;min-width:190px">' +
      '<button class="btn btn-outline btn-sm" onclick="TAKT_ORG.approve(document.getElementById(\'orgTabCode\').value)">Wpuść nowe urządzenie</button></div>');

    // ── co NIE jest w tej paczce: uczciwie, żeby nikt nie liczył na za dużo ──
    H.push('<div class="hint" style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">' +
      'W chmurze leżą <b>zaszyfrowane</b> wpłaty, uczestnicy i obecność — po jednej paczce na filię. ' +
      'Grafik, zapisy par i szkolenia synchronizują się osobno i <b>nie są</b> szyfrowane tym kluczem. ' +
      'Pokolenie klucza: ' + ORG.boot.generation +
      (ORG.boot.has_recovery ? ' · wydruk klucza odzyskiwania: jest' : ' · <b>brak wydruku klucza odzyskiwania</b>') + '.</div>');

    H.push('</div>');
    box.innerHTML = H.join('');
  }

  /* ═══════════════ 6. PODMIANA STAREJ ŚCIEŻKI ═══════════════
     ⚠️ Cała aplikacja desktopowa siedzi w `<template id="app-desktop">`, więc
     w chwili wykonania tego skryptu NIE MA jeszcze ani `#syncSection`, ani
     `openCloudModal` — panel wstrzykuje szablon po zalogowaniu. Pierwsza wersja
     zakładała owijki od razu: łapała `undefined`, a potem prawdziwa funkcja
     nadpisywała moją. Nie działało nic i nie było po tym śladu w konsoli.

     Dlatego owijamy DOPIERO gdy aplikacja istnieje i sprawdzamy to dalej —
     przełączenie widoku desktop ↔ mobile buduje DOM od nowa.                  */
  function wrapOnce() {
    if (typeof openCloudModal !== 'function') return false;                  // szablon nie wstrzyknięty
    if (window.openCloudModal && window.openCloudModal.__org) return true;   // już owinięte

    const origPush = window.pushStateNow, origLoad = window.loadStateFromCloud,
          origModal = window.openCloudModal, origManual = window.manualStatePush;

    window.pushStateNow = function (force) {
      if (ORG.vault.isOpen()) return push(!!force);
      return origPush ? origPush.apply(this, arguments) : Promise.resolve(false);
    };
    window.loadStateFromCloud = function (interactive) {
      if (ORG.vault.isOpen()) return pull(!!interactive);
      return origLoad ? origLoad.apply(this, arguments) : undefined;
    };
    window.manualStatePush = async function () {
      if (!ORG.vault.isOpen()) return origManual ? origManual.apply(this, arguments) : undefined;
      const ok = await push(true);
      alert(ok ? 'Dane wysłane do chmury.' : 'Nie udało się wysłać — szczegóły w oknie powyżej.');
    };
    // ⚠️ NAJWAŻNIEJSZA owijka, a przeoczyłem ją w pierwszej wersji.
    // `scheduleStatePush()` ma zaszyte `if (currentBranch !== 'centrum') return;`
    // (demo testowało Chmurę+ tylko na jednej filii), więc zmiany na Wschodzie
    // i Zachodzie NIGDY nie były nawet planowane do wysłania. Dane siedziały
    // lokalnie, a panel pokazywał „skarbiec otwarty" — czyli kłamał zachowaniem.
    // Klucz organizacji obejmuje KAŻDĄ filię, która ma swój klucz.
    const origSched = window.scheduleStatePush;
    window.scheduleStatePush = function () {
      if (!ORG.vault.isOpen() || !ORG.vault.branch(br())) {
        return origSched ? origSched.apply(this, arguments) : undefined;
      }
      if (typeof applyingCloudState !== 'undefined' && applyingCloudState) return;  // to my właśnie wczytujemy
      bSet(DIRTY_KEY, '1');
      clearTimeout(orgPushTimer);
      orgPushTimer = setTimeout(function () { push(false); }, 2500);
      if (typeof updateSyncStatusUI === 'function') updateSyncStatusUI();
    };

    const wrapped = function () {
      if (origModal) origModal.apply(this, arguments);
      renderOrgUI();
    };
    wrapped.__org = true;                       // znacznik: nie owijać dwa razy
    window.openCloudModal = wrapped;
    installTab();                               // zakładka ☁ Chmura przed Backupem
    return true;
  }

  ORG.enable = enable;
  ORG.pull = pull;
  ORG.pushNow = () => window.manualStatePush();
  ORG.approve = approveByCode;
  ORG.grant = grantOwner;
  ORG.trust = trustFingerprints;
  ORG.render = renderOrgUI;
  ORG.renderTab = renderChmuraTab;
  ORG.grantStaff = grantStaff;
  ORG.revokeOwner = revokeOwner;
  ORG.revokeStaff = revokeStaff;
  ORG.reopen = async function () {
    ORG.vaultError = null; ORG.bootError = null;
    try {
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      await openVault();
    } catch (e) { ORG.vaultError = e.message || String(e); }
    renderOrgUI();
  };
  /* Wyjście ze stanu „kod bez urządzenia". Mówi wprost, co kosztuje, bo
     dla WŁAŚCICIELA oznacza utratę dostępu do klucza organizacji, dopóki
     nie powstanie ścieżka odzyskiwania z wydruku. */
  ORG.recover = recoverFromPrint;
  ORG.revokeDevice = revokeDevice;
  ORG.noDevice = function () {
    const wlasciciel = ORG.boot && ORG.boot.is_owner;
    if (wlasciciel && ORG.boot.has_recovery) {
      // Właściciel z wydrukiem ma prawdziwe wyjście — nie proponujmy mu
      // utraty klucza organizacji, dopóki kartka istnieje.
      if (confirm('Masz wydruk klucza odzyskiwania?\n\nOK = odzyskaj z wydruku (zachowasz dostęp do danych).\n' +
        'Anuluj = pokażę drugie, gorsze wyjście.')) return recoverFromPrint();
    }
    const tresc = wlasciciel
      ? 'Bez wydruku zostaje jedno wyjście: założyć tożsamość od nowa.\n\nUWAGA: jako WŁAŚCICIEL ' +
        'stracisz wtedy dostęp do obecnego klucza organizacji, czyli do danych w chmurze. ' +
        'Dane lokalne i plik kopii zapasowej zostają nietknięte.'
      : 'Założę Ci nową tożsamość. Właściciel będzie musiał wpuścić Cię ponownie jednym kliknięciem. ' +
        'Nic nie tracisz — dane filii są w chmurze, nie w Twoim kluczu.';
    if (!confirm(tresc + '\n\nKontynuować?')) return;
    return ORG.resetIdentity();
  };
  ORG.resetIdentity = async function () {
    if (!confirm('Założyć tożsamość od nowa?\n\nStracisz dostęp do obecnego klucza organizacji — ' +
      'ktoś będzie musiał wpuścić Cię ponownie, albo trzeba będzie użyć klucza z wydruku.')) return;
    try {
      await K.forgetDevice();
      ORG.dev = await K.deviceKeys((ORG.boot && ORG.boot.email) || '');
      ORG.deadEnd = false; ORG.vaultError = null; ORG.bootError = null;
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      await createIdentity();
      ORG.boot = await rpc('key_bootstrap', { p_device_id: ORG.dev.device_id });
      renderOrgUI();
      alert('Nowa tożsamość i nowe urządzenie gotowe.');
    } catch (e) { alert('Nie udało się: ' + (e.message || e)); }
  };

  /* ═══════════════ 7. START ═══════════════
     Trzy rzeczy pojawiają się w różnych momentach: zalogowany klient Supabase,
     wstrzyknięty szablon aplikacji i sekcja, w której rysujemy. Zamiast
     zgadywać kolejność — pytamy co pół sekundy.                               */
  const ready = () => !!sbAuth() && typeof deviceName === 'function' && typeof openCloudModal === 'function';
  let booted = false, tries = 0;

  async function startOnce() {
    booted = true;
    try { await boot(); }
    catch (e) { console.warn('[orgkey] start:', e.message || e); ORG.bootError = e.message || String(e); }
    wrapOnce();
    renderOrgUI();
    if (ORG.vault.isOpen()) pull(false);
  }

  (function tick() {
    if (!booted && ready()) { startOnce(); }
    else if (booted) {
      // Przełączenie widoku odbudowuje DOM i zdejmuje owijki — zakładamy je ponownie.
      wrapOnce();
      if (document.getElementById('syncSection') && !document.getElementById('orgUiMark')) renderOrgUI();
      // Zakładka ☁ Chmura odświeża się tylko gdy jest OTWARTA — inaczej
      // pytalibyśmy bazę o wszystkie filie co pół sekundy.
      const tc = document.getElementById('tab-chmura');
      if (tc && tc.classList.contains('active') && !tc.dataset.busy) {
        tc.dataset.busy = '1';
        setTimeout(function () { delete tc.dataset.busy; }, 15000);
        renderChmuraTab();
      }
    }
    if (++tries > 240) return;                  // ~2 min: brak logowania albo widok mobilny
    setTimeout(tick, 500);
  })();
})();

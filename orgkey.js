/* =====================================================================
   TAKT — KLUCZ ORGANIZACJI: rdzeń kryptograficzny
   Wersja 1, 2026-09-07.

   Moduł CELOWO nie zna ani DOM-u, ani Supabase — same funkcje na bajtach.
   Dzięki temu da się go przetestować w przeglądarce bez logowania i bez
   panelu (patrz `produkt/orgkey.test.html`), a panel dostaje gotowe klocki.

   ŁAŃCUCH KOPERT (odpowiada tabelom z supabase_klucz_organizacji.sql):
     dane filii          ← AES-GCM kluczem filii (BEK), z AAD
     BEK                 ← koperta na klucz organizacji      branch_key_wraps
     BEK                 ← koperta na klucz publiczny pracownika  branch_staff_wraps
     klucz organizacji   ← koperta na klucz publiczny osoby   org_key_wraps
     klucz organizacji   ← koperta na klucz odzyskiwania      org_key_recovery
     klucz prywatny osoby← koperta na klucz URZĄDZENIA        owner_devices

   DWIE ZASADY, KTÓRE TRZYMAJĄ CAŁOŚĆ:
   1. Klucz prywatny URZĄDZENIA jest NIEWYPROWADZALNY (`extractable: false`)
      i leży w IndexedDB. Nie da się go odczytać ani wysłać — dlatego
      codzienne otwarcie skarbca nie wymaga żadnego hasła.
   2. Klucz prywatny OSOBY musi być wyprowadzalny, bo pieczętujemy go na
      kolejne urządzenia. Nigdy nie trafia nigdzie w postaci jawnej.
   ===================================================================== */
(function (root) {
  'use strict';

  var SUB = (root.crypto && root.crypto.subtle) || null;
  var TE = new TextEncoder(), TD = new TextDecoder();

  function need() {
    if (!SUB) throw new Error('Ta przeglądarka nie ma WebCrypto (wymagane HTTPS).');
    return SUB;
  }

  /* ── bajty ↔ base64url ────────────────────────────────────────────── */
  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(s) {
    var t = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    return Uint8Array.from(atob(t), function (c) { return c.charCodeAt(0); });
  }

  /* ── AAD: wersja i pokolenie WCHODZĄ w podpis szyfrogramu ──────────
     Bez tego serwer może podać starszą, w pełni poprawną paczkę (rollback)
     albo paczkę innej filii — podpis by się zgodził, bo to autentyczny
     szyfrogram, tylko nie ten, o który prosiliśmy. Z AAD taka podmiana
     nie odszyfrowuje się w ogóle.                                      */
  function aad(branch, gen, version) {
    return TE.encode('takt:v3:' + (branch || 'main') + ':' + gen + ':' + version);
  }

  /* ── klucze symetryczne ───────────────────────────────────────────── */
  // Klucz organizacji i klucze filii MUSZĄ być wyprowadzalne, bo je zawijamy.
  function newSymKey() {
    return need().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  function importSym(raw, extractable) {
    return need().importKey('raw', raw, 'AES-GCM', extractable !== false, ['encrypt', 'decrypt']);
  }
  function exportSym(key) { return need().exportKey('raw', key); }

  /* ── pary kluczy ──────────────────────────────────────────────────── */
  // Urządzenie: klucz prywatny NIE opuszcza przeglądarki, więc extractable=false.
  function newDeviceKeyPair() {
    return need().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  }
  // Osoba: klucz prywatny pieczętujemy na urządzenia, więc musi być wyprowadzalny.
  function newIdentityKeyPair() {
    return need().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  }
  function pubJwk(pair) { return need().exportKey('jwk', pair.publicKey); }
  function importPub(jwk) {
    return need().importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  }
  function importPriv(jwk) {
    return need().importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  }
  function exportPrivJwk(key) { return need().exportKey('jwk', key); }

  /* ── ODCISK KLUCZA PUBLICZNEGO ─────────────────────────────────────
     Do porównania NA GŁOS, jak „safety number" w komunikatorach —
     jedyna obrona przed podstawieniem klucza publicznego przez serwer.

     Świadome odejście od makiety: w projekcie były cztery polskie słowa,
     ale lista słów, która zmieści się w panelu, ma realistycznie ~256
     pozycji, czyli 4 słowa = 32 bity. Za mało na kanał porównawczy.
     Base32 daje 80 bitów w tyle samo sylab i nie ciągnie za sobą słownika.
     Alfabet bez 0/O/1/I/L — te same znaki odpadają w kluczu odzyskiwania,
     bo są przepisywane ręcznie.                                        */
  // ⚠️ DOKŁADNIE 32 symbole — przy 31 indeks 31 dawał `undefined` i do klucza
  // wpadał napis „undefined" (wyłapane testem 06). Alfabet Crockforda: bez
  // I, L, O i U, więc nie tworzy przypadkowych słów, a pomyłki przepisywania
  // (O↔0, I/L↔1) da się jednoznacznie odwzorować — patrz normRecoveryKey().
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function b32(bytes, chars) {
    var out = '', bits = 0, acc = 0;
    for (var i = 0; i < bytes.length && out.length < chars; i++) {
      acc = (acc << 8) | bytes[i]; bits += 8;
      while (bits >= 5 && out.length < chars) {
        bits -= 5; out += B32[(acc >> bits) & 31];
      }
    }
    return out;
  }
  function fingerprint(jwk) {
    // Odcisk liczony z KANONICZNEJ postaci klucza (x, y, krzywa), nie z całego
    // JWK — inaczej dodanie pola `key_ops` przez przeglądarkę zmieniłoby odcisk
    // i panel krzyczałby „klucz się zmienił" bez powodu.
    var canon = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
    return need().digest('SHA-256', TE.encode(canon)).then(function (h) {
      var s = b32(new Uint8Array(h), 16);
      return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16);
    });
  }

  /* ── KOPERTA ASYMETRYCZNA (ECDH-ES) ────────────────────────────────
     Tu wchodzi cała asymetria: pieczętuję DLA kogoś, znając wyłącznie
     jego klucz publiczny. Nie potrzebuję jego hasła ani wspólnego sekretu.

     ECDH samo nie szyfruje — uzgadnia sekret. Więc: efemeryczna para,
     wspólny sekret z kluczem odbiorcy, HKDF na klucz AES, AES-GCM na dane.
     W kopercie zostaje efemeryczny klucz PUBLICZNY i szyfrogram.        */
  function sealTo(recipientPubJwk, bytes, info) {
    var eph, pub;
    return importPub(recipientPubJwk)
      .then(function (p) { pub = p; return newIdentityKeyPair(); })   // efemeryczna, wyprowadzalna nieistotne
      .then(function (e) { eph = e; return need().deriveBits({ name: 'ECDH', public: pub }, eph.privateKey, 256); })
      .then(function (bits) { return need().importKey('raw', bits, 'HKDF', false, ['deriveKey']); })
      .then(function (hk) {
        return need().deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: TE.encode('takt-seal:' + (info || '')) },
          hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
      })
      .then(function (k) {
        var iv = root.crypto.getRandomValues(new Uint8Array(12));
        return need().encrypt({ name: 'AES-GCM', iv: iv }, k, bytes).then(function (ct) {
          return pubJwk(eph).then(function (ej) {
            return { v: 1, alg: 'ECDH-ES+A256GCM', epk: ej, iv: b64(iv), ct: b64(ct) };
          });
        });
      });
  }
  function openSealed(myPrivKey, wrap, info) {
    return importPub(wrap.epk)
      .then(function (ep) { return need().deriveBits({ name: 'ECDH', public: ep }, myPrivKey, 256); })
      .then(function (bits) { return need().importKey('raw', bits, 'HKDF', false, ['deriveKey']); })
      .then(function (hk) {
        return need().deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: TE.encode('takt-seal:' + (info || '')) },
          hk, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (k) {
        return need().decrypt({ name: 'AES-GCM', iv: unb64(wrap.iv) }, k, unb64(wrap.ct));
      })
      .then(function (pt) { return new Uint8Array(pt); });
  }

  /* ── KOPERTA NA KLUCZ Z WYDRUKU ────────────────────────────────────
     Ciąg z kartki to w praktyce hasło, więc PBKDF2 jest tu właściwym
     narzędziem. 600 000 iteracji zgodnie z zaleceniem OWASP (dotychczasowa
     Chmura+ ma 150 000). Numer iteracji zapisany w kopercie, żeby dało się
     go kiedyś podnieść bez psucia starych paczek.                       */
  var PBKDF2_ITER = 600000;
  function keyFromPassphrase(pass, salt, iter) {
    return need().importKey('raw', TE.encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return need().deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter || PBKDF2_ITER, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }
  // `iter` wyłącznie dla testów — produkcja NIE podaje go i dostaje 600 000.
  // Poprawność koperty nie zależy od krotności (jest zapisana w kopercie),
  // a 600 000 iteracji liczy się realne sekundy, czego headless nie doczeka.
  function wrapWithPassphrase(pass, bytes, iter) {
    var salt = root.crypto.getRandomValues(new Uint8Array(16));
    var n = iter || PBKDF2_ITER;
    return keyFromPassphrase(pass, salt, n).then(function (k) {
      var iv = root.crypto.getRandomValues(new Uint8Array(12));
      return need().encrypt({ name: 'AES-GCM', iv: iv }, k, bytes).then(function (ct) {
        return { v: 1, alg: 'PBKDF2+A256GCM', iter: n, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
      });
    });
  }
  function openWithPassphrase(pass, wrap) {
    return keyFromPassphrase(pass, unb64(wrap.salt), wrap.iter || PBKDF2_ITER).then(function (k) {
      return need().decrypt({ name: 'AES-GCM', iv: unb64(wrap.iv) }, k, unb64(wrap.ct));
    }).then(function (pt) { return new Uint8Array(pt); });
  }

  // Klucz odzyskiwania do wydruku: 32 znaki base32 = 160 bitów, w grupach po 4.
  function newRecoveryKey() {
    var raw = root.crypto.getRandomValues(new Uint8Array(24));
    var s = b32(raw, 32), out = [];
    for (var i = 0; i < 32; i += 4) out.push(s.slice(i, i + 4));
    return 'TAKT-' + out.join('-');
  }
  // Przy wpisywaniu z kartki tolerujemy spacje, małe litery, brak myślników
  // ORAZ klasyczne pomyłki odczytu: O widziane jako zero, I i L jako jedynkę.
  // Alfabet Crockforda tych znaków nie używa, więc mapowanie jest jednoznaczne.
  function normRecoveryKey(s) {
    return String(s || '').toUpperCase()
      .replace(/^TAKT-?/, '')
      .replace(/O/g, '0').replace(/[IL]/g, '1')
      .replace(/[^A-Z0-9]/g, '');
  }

  /* ── KOPERTA NA KLUCZ SYMETRYCZNY (klucz filii pod kluczem organizacji) ── */
  function wrapKeyUnder(wrappingKey, keyToWrap, info) {
    return exportSym(keyToWrap).then(function (raw) {
      var iv = root.crypto.getRandomValues(new Uint8Array(12));
      return need().encrypt({ name: 'AES-GCM', iv: iv, additionalData: TE.encode('takt-wrap:' + (info || '')) },
        wrappingKey, raw).then(function (ct) {
          return { v: 1, alg: 'A256GCM', iv: b64(iv), ct: b64(ct) };
        });
    });
  }
  function unwrapKeyUnder(wrappingKey, wrap, info) {
    return need().decrypt({ name: 'AES-GCM', iv: unb64(wrap.iv), additionalData: TE.encode('takt-wrap:' + (info || '')) },
      wrappingKey, unb64(wrap.ct)).then(function (raw) { return importSym(new Uint8Array(raw), true); });
  }

  /* ── PACZKA DANYCH ────────────────────────────────────────────────── */
  function encryptPack(bek, obj, branch, gen, version) {
    var iv = root.crypto.getRandomValues(new Uint8Array(12));
    return need().encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(branch, gen, version) },
      bek, TE.encode(JSON.stringify(obj))).then(function (ct) {
        // `enc: true` w JAWNEJ części paczki — serwerowy state_save_v2 odmawia
        // zapisu bez tego pola. Wniosek z incydentu z jawnym app_state.
        return { enc: true, v: 3, branch: branch || '', gen: gen, version: version, iv: b64(iv), ct: b64(ct) };
      });
  }
  function decryptPack(bek, pack, expectBranch, expectGen, minVersion) {
    if (!pack || pack.enc !== true) return Promise.reject(new Error('To nie jest zaszyfrowana paczka.'));
    if (pack.v !== 3) return Promise.reject(new Error('Nieznana wersja paczki: ' + pack.v));
    // PODŁOGA WERSJI: druga połowa ochrony przed rollbackiem. AAD sprawi, że
    // podmieniona paczka się nie rozpakuje, ale odrzucenie z komunikatem jest
    // uczciwsze niż „uszkodzone dane".
    if (minVersion != null && pack.version < minVersion) {
      return Promise.reject(new Error('Chmura oddała STARSZĄ wersję (' + pack.version +
        ') niż ostatnio widziana (' + minVersion + ') — odmawiam wczytania.'));
    }
    if (expectGen != null && pack.gen !== expectGen) {
      return Promise.reject(new Error('Paczka jest z pokolenia klucza ' + pack.gen + ', a filia ma ' + expectGen + '.'));
    }
    return need().decrypt(
      { name: 'AES-GCM', iv: unb64(pack.iv), additionalData: aad(expectBranch, pack.gen, pack.version) },
      bek, unb64(pack.ct)
    ).then(function (pt) { return JSON.parse(TD.decode(pt)); });
  }

  /* ── SKŁAD KLUCZA URZĄDZENIA (IndexedDB) ───────────────────────────
     CryptoKey da się zapisać w IndexedDB bezpośrednio (structured clone),
     i to jest cały trik: klucz prywatny przeżywa odświeżenie strony,
     a mimo to jego bajtów nie widzi ani JS, ani serwer.                */
  var DB = 'takt-orgkey', STORE = 'device';
  function idb() {
    return new Promise(function (res, rej) {
      if (!root.indexedDB) { rej(new Error('Ta przeglądarka nie daje dostępu do IndexedDB (okno prywatne?).')); return; }
      // Limit czasu, bo `open` w oknie prywatnym albo przy zablokowanych danych
      // witryny potrafi NIGDY nie rozstrzygnąć — panel wisiałby w nieskończoność
      // zamiast powiedzieć, że Chmury+ nie da się tu włączyć.
      var done = false, t = root.setTimeout(function () {
        if (!done) { done = true; rej(new Error('IndexedDB nie odpowiada — Chmura+ nie zadziała w tym oknie.')); }
      }, 8000);
      var r = root.indexedDB.open(DB, 1);
      r.onupgradeneeded = function () {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE);
      };
      r.onsuccess = function () { if (!done) { done = true; root.clearTimeout(t); res(r.result); } };
      r.onerror   = function () { if (!done) { done = true; root.clearTimeout(t); rej(r.error || new Error('IndexedDB niedostępny')); } };
      r.onblocked = function () { if (!done) { done = true; root.clearTimeout(t); rej(new Error('IndexedDB zablokowany przez inną kartę.')); } };
    });
  }
  function idbPut(key, val) {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put(val, key);
        t.oncomplete = function () { d.close(); res(true); };
        t.onerror = function () { d.close(); rej(t.error); };
      });
    });
  }
  function idbGet(key) {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, 'readonly'), q = t.objectStore(STORE).get(key);
        q.onsuccess = function () { d.close(); res(q.result); };
        q.onerror = function () { d.close(); rej(q.error); };
      });
    });
  }
  function idbClear() {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, 'readwrite');
        t.objectStore(STORE).clear();
        t.oncomplete = function () { d.close(); res(true); };
        t.onerror = function () { d.close(); rej(t.error); };
      });
    });
  }

  /* Zwraca klucze TEGO urządzenia DLA TEGO KONTA, tworząc je przy pierwszym
     wejściu. `device_id` jest losowy i jawny — służy tylko do adresowania wiersza.

     ⚠️ `email` W KLUCZU SKŁADU JEST KONIECZNE. IndexedDB jest per ORIGIN, więc
     bez rozdzielenia dwie osoby na tym samym komputerze (recepcja!) dzieliłyby
     jeden `device_id` i jeden klucz prywatny urządzenia. Na demie 8.09.2026
     skończyło się to nadpisaniem koperty właściciela kopertą pracownika filii.
     Osobny klucz per konto zamyka to i przy okazji jest zdrowsze: dwie osoby
     przy jednym komputerze nie dzielą już materiału kryptograficznego.        */
  function deviceKeys(email) {
    var slot = 'keys:' + String(email || '').toLowerCase();
    return idbGet(slot).then(function (found) {
      if (found && found.priv) return found;
      return newDeviceKeyPair().then(function (pair) {
        return pubJwk(pair).then(function (jwk) {
          return fingerprint(jwk).then(function (fp) {
            var rec = {
              device_id: b32(root.crypto.getRandomValues(new Uint8Array(16)), 20),
              priv: pair.privateKey,      // NIEWYPROWADZALNY CryptoKey
              pub: jwk,
              fingerprint: fp
            };
            return idbPut(slot, rec).then(function () { return rec; });
          });
        });
      });
    });
  }

  /* ── SKARBIEC: wyłącznie w pamięci karty ───────────────────────────
     Nigdy do localStorage ani do IndexedDB. Auto-blokada czyści go z RAM-u;
     ponowne otwarcie jest ciche, bo klucz urządzenia nadal jest na miejscu.
     Uczciwie: to zmniejsza okno na wyciek z pamięci, a nie chroni przed
     kimś, kto siedzi przy tym komputerze.                              */
  function newVault() {
    var v = { generation: null, orgKey: null, branches: {}, identityPriv: null, openedAt: null };
    v.lock = function () {
      v.orgKey = null; v.identityPriv = null; v.branches = {}; v.openedAt = null;
    };
    // ⚠️ Otwarty skarbiec to „mam czym odczytać CHOĆ JEDNĄ filię", a nie
    // „mam klucz organizacji". PRACOWNIK filii nigdy nie dostaje klucza
    // organizacji — ma kopertę wprost do klucza swojej lokalizacji. Pierwsza
    // wersja sprawdzała tylko `orgKey` i dla konta filii skarbiec był
    // na zawsze zamknięty.
    v.isOpen = function () { return !!(v.orgKey || Object.keys(v.branches).length); };
    v.branch = function (name) { return v.branches[name || ''] || null; };
    return v;
  }

  /* WERSJA KONTRAKTU między tym plikiem a panelem. Podnosić przy KAŻDEJ
     zmianie, która wymaga nowszego panelu albo nowszego rdzenia.
       1 — pierwsza wersja
       2 — `isOpen()` uwzględnia klucze filii (ścieżka pracownika)
       3 — `deviceKeys(email)` — osobny klucz urządzenia per konto
     Panel sprawdza to przy starcie i odmawia pracy na starszym rdzeniu.
     Powód: `orgkey.js` to OSOBNY plik, wgrywany ręcznie obok panelu —
     8.09.2026 przez pół godziny szukałem błędu w kryptografii, a na serwerze
     leżał po prostu stary rdzeń, w którym pracownik filii nigdy nie mógł
     otworzyć skarbca. Cicha rozbieżność wersji wygląda jak błąd logiki.     */
  var CONTRACT = 3;

  root.TAKT_ORGKEY = {
    CONTRACT: CONTRACT,
    // bajty
    b64: b64, unb64: unb64, aad: aad,
    // klucze
    newSymKey: newSymKey, importSym: importSym, exportSym: exportSym,
    newDeviceKeyPair: newDeviceKeyPair, newIdentityKeyPair: newIdentityKeyPair,
    pubJwk: pubJwk, importPub: importPub, importPriv: importPriv, exportPrivJwk: exportPrivJwk,
    fingerprint: fingerprint,
    // koperty
    sealTo: sealTo, openSealed: openSealed,
    wrapWithPassphrase: wrapWithPassphrase, openWithPassphrase: openWithPassphrase,
    wrapKeyUnder: wrapKeyUnder, unwrapKeyUnder: unwrapKeyUnder,
    newRecoveryKey: newRecoveryKey, normRecoveryKey: normRecoveryKey,
    // paczki
    encryptPack: encryptPack, decryptPack: decryptPack,
    // urządzenie i skarbiec
    deviceKeys: deviceKeys, forgetDevice: idbClear, newVault: newVault,
    PBKDF2_ITER: PBKDF2_ITER
  };
})(typeof window !== 'undefined' ? window : this);

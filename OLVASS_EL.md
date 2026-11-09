# Nyxoria RPG – zárt teszt (3. lépés: új grafika és főmenü)

## Indítás

**Közös szerverrel (Discord-belépés):** kövesd a `BEUZEMELES.md` leírást. Utána a játék a saját webcímén fut.

**Gyakorló módban (belépés nélkül):** amíg a `js/config.js` üres, kattints duplán az **index.html** fájlra. A játék a böngésződben nyílik meg (Chrome, Edge vagy Firefox), telepíteni nem kell semmit.

- Telefonon is kipróbálhatod: a mappát tedd fel például a Google Drive-ra, vagy várd meg a 2. lépést, amikor a játék saját webcímet kap.
- A hősöd ebben a böngészőben mentődik. Másik gépre a **Beállítások → Exportálás** gombbal viheted át.
- Gyakorló módban vannak fejlesztői gombok (fáklya, szint, Csillagpor, idő előretekerése): a címsorban az `index.html` után írd be: `?dev=1`. A közös szerveren ezek nem működnek.

## Mi van benne

- Karakterkészítés 8 lépésben, forgatható hőssel: nem, kaszt, faj, testalkat, arc, szemek, 24 frizura, fül, szarv, fejdísz, öltözet, színek, fegyver, köpeny, szárny, farok, aura, végül név, származás, jellem és jelmondat. Minden lépés visszavonható, és a kinézet később a Hős képernyőn bármikor átszabható.
- Fáklyák (90 percenként 1, legfeljebb 8) és Pihent-töltés (dupla tapasztalat, legfeljebb 16). Fáklya nélkül fáradtan is lehet menni, kevesebb tapasztalatért.
- Mindig 3 expedíció: Könnyű, Közepes és Nehéz. A játék 500 próbaharccal számolja ki a győzelmi esélyt, és a szörny szintjét úgy választja, hogy az esély a sávba essen.
- 3 tisztás kártyákkal (harc, kutatás, esemény), aztán az őrző. Közben vissza lehet fordulni.
- Automatikus harc lejátszással: 1×, 2×, 4× sebesség, vagy ugrás a végére. Előtte taktikát lehet választani.
- Zsákmány: 3 jutalomból egyet választasz. Ritkaságok: szürke, zöld, kék (5. szinttől), lila (12.-től), legendás (25.-től) és a legritkább, a mitikus. A lila és a legendás esélye a szinttel és a nehézséggel nő (Nehéz kalandon a legnagyobb); 80 Közepes/Nehéz tárgyesésből legalább egy lila, 300-ból legalább egy legendás. Fejlesztés ritkaság szerint +4…+12-ig; szétszedéskor vagy eladáskor a beletett Csillagpor 70%-a visszajár.
- Felszerelés 5 helyen, fejlesztés Csillagporral (+1-től +10-ig, heti kerettel), tárgyjellemző-újrasorsolás Holdezüstért.
- Képességek a 3., 6., 10. és 13. szinten; a sorrendjük állítható.
- Krónika, Bubó a kalauz bagoly, mentés, exportálás és importálás.

## A 2. lépésben került bele

- Discord-belépés, Nyxoria-tagság ellenőrzésével.
- Közös szerver (Supabase): a szerver dönt minden harcról és zsákmányról, így nem lehet csalni.
- Heti világboss: naponta 3 ütés, ládák 3, 9 és 15 ütésnél, győzelmi láda, dühödés péntektől, címek a hét 3 legnagyobb sebzőjének.
- Őrjárat: naponta egyszer, 1–8 órára.
- Felzárkózó szél: aki a szerver medián szintje alatt van, több tapasztalatot kap.
- Ranglisták (szint, heti boss, újoncok, gyűjtők, harcerő) és közös szerver-krónika.
- Discord-bejelentések webhookkal, és egy egyszerű admin-felület.

## A 3. lépésben került bele

- Új grafika mindenhol: a hősöket, a szörnyeket és a tájakat kódból rajzolt, mozgó vektorgrafika adja (`js/rig.js`, `js/monsters.js`, `js/scenes.js`).
- Új harci színpad: a hős és a szörny odamegy egymáshoz, mind a 40 képességnek saját mozdulata és látványa van (`js/stage.js`, `js/vfx.js`). A harc eredménye nem változott, ugyanaz a motor dönt róla.
- Új főmenü: címképernyő, felső sáv a készletekkel, bal oldali menü, tábor-színpad a „Kalandra fel” gombbal, telefonon alsó fülsáv és Menü. A még nem kész funkciók a „Készülő funkciók” ablakban vannak.
- Súgó, Hiba bejelentése és Discord ablak.

## A 4. lépésben került bele

- Napi ajándék, Vándorkereskedő, Holdtorony, heti esemény, Aréna, csapatküldetések, eredmények és gyűjtőalbum.
- Céhek (közös heti célok, céhkrónika) és heti céhháború: a hasonló erejű céhek hétfőnként párt kapnak, a győztes zászlójára csillag kerül.
- Ösvények a 15. szinttől: kasztonként három, az első választás ingyenes.
- Profil: a ranglistán bármelyik névre kattintva megnézhető a hős.
- Több hős: fiókonként legfeljebb 3, a Hőseim oldalon bármikor lehet váltani. A heti szörny ütései, a céh és a napi ajándék a fiókhoz tartozik.
- Festett ikonok mindenhez (tárgyak, képességek, menü).

## Mi jön ezután

A zárt teszt tapasztalatai alapján finomhangolás; új funkció most nincs tervben.

## Fájlok

| Fájl | Mi ez |
| --- | --- |
| `index.html` | A játék, ezt kell megnyitni |
| `css/style.css` | A kinézet (a Nyxoria stílusútmutató színeivel) |
| `js/data.js` | Az adatok: kasztok, képességek, területek, események, szövegek |
| `js/engine.js` | A játéklogika: harc, esélyszámítás, zsákmány, fejlődés |
| `js/game.js` | A játékos műveletei; ugyanez fut a böngészőben és a szerveren |
| `js/config.js` | A közös szerver címe és kulcsa (beüzemeléskor kell kitölteni) |
| `js/art.js` | Ikonok, és az új rajzolók összekötése a képernyőkkel |
| `js/rig.js` | A hős rajza és mozgása (minden kinézeti elem) |
| `js/monsters.js` | A szörnyek rajza és mozgása |
| `js/scenes.js` | A tájak (öt terület és a tábor) |
| `js/vfx.js` | A harci látványeffektek |
| `js/stage.js` | A harci színpad: a motor harci eseményeit játssza le látvánnyal |
| `js/creator.js` | A karakterkészítő (új hős és a kinézet átszabása) |
| `js/extra.js` | Az új funkciók szabályai: napi ajándék, vándorkereskedő, Holdtorony, heti esemény, eredmények, Aréna, csapatküldetések (a szerveren is ez fut) |
| `js/icons.js` | A festett ikonok rajzolókészlete és stílusszabályai |
| `js/icons-*.js` | Az ikonok: tárgyak (fegyverek, páncélok, ékszerek, mitikus tárgyak), mind a 40 képesség, jellemzők és készletek |
| `tools/ikonok.html` | Ikongaléria: minden ikon egy lapon, három méretben |
| `css/rig.css`, `css/creator.css` | Az új grafika és a készítő kinézete |
| `tools/teszt-kinezet.js` | Teszt: a hős kinézetének ellenőrzése és a régi hősök átalakítása (`node tools/teszt-kinezet.js`) |
| `tools/korona-ellenorzes/` | Ellenőrző szkriptek a szörnyek koronájához |
| `stilus.html`, `fomenu.html` | A grafika és a főmenü bemutatója (nem kell a játékhoz) |
| `js/ui.js` | A képernyők és a gombok |
| `server/schema.sql` | Az adatbázis táblái (a Supabase SQL Editorába kell beilleszteni) |
| `server/functions/nyx/index.ts` | A szerverfüggvény egyetlen fájlban (a Supabase-be kell beilleszteni) |
| `server/nyx.js` | A szerverfüggvény saját része; a `tools/build-server.js` rakja össze a fenti fájlt |
| `BEUZEMELES.md` | Lépésről lépésre a közös szerver beállítása |

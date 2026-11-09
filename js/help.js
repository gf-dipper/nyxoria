/* Nyxoria – a teljes Súgó. Csak adat: a ui.js rajzolja ki (képekkel, kereséssel).
   A {TOKEN} alakú helyekre a felület a kódban élő, mindig friss számot írja be. */
(function (root) {
  var D = root.NYX.data;
  D.HELP = {
    intro: 'Huhu! Bubó vagyok, a kalauzod. Itt mindent megtalálsz a Nyxoriáról: hogyan indulj kalandra, mitől erős a hősöd, és mit érdemes naponta megcsinálni. Keress rá bármire, vagy lapozz a fejezetek között!',

    groups: [
      { title: 'Alapok', ids: ['kezdes', 'kasztok', 'tabor', 'kaland', 'tisztasok', 'esemenyek', 'orzok'] },
      { title: 'Harc és fejlődés', ids: ['harc', 'taktika', 'faklyak', 'holdak', 'targyak', 'fejlesztes', 'penzek', 'szintek'] },
      { title: 'Napi teendők', ids: ['holdkronika', 'megbizasok', 'ajandek', 'kereskedo', 'orjarat'] },
      { title: 'Kihívások és közösség', ids: ['torony', 'heti-esemeny', 'arena', 'csapat', 'boss', 'ceh'] },
      { title: 'Hős és fiók', ids: ['eredmenyek', 'hosok', 'kozosseg', 'beallitasok'] }
    ],

    sections: [
      // ===================== ALAPOK =====================
      { id: 'kezdes', title: 'Az első lépések', short: 'Hőskészítés: faj, kaszt, származás, jellem és kinézet.',
        fig: 'hero', figCaption: 'A hősöd: kinézetét bármikor átszabhatod', go: 'kinezet',
        blocks: [
          { p: 'Minden egy hőssel kezdődik. A készítőben lépésről lépésre raksz össze valakit, aki aztán helyetted kalandozik. Ne izgulj túl sokat: a kinézet később is szabadon módosítható, csak a név, a faj és a kaszt marad örökre.' },
          { h: 'Mit választasz?', list: [
            'Faj: Ember, Holdtünde, Kőszívű, Árnyszülött vagy Csillagfényű. Csak a külsőt adja (bőrszín, fül), az erőt nem befolyásolja.',
            'Kaszt: ez dönti el a jellemzőidet, a képességeidet, a fegyveredet és az ajánlott taktikát. Lásd a Kasztok fejezetet.',
            'Származás (pl. Elűzött nemes, Folyami csempész): kaland közben néha csak neked nyíló, különleges választást ad.',
            'Jellem (pl. Vakmerő, Tréfás, Falánk): szintén külön eseményválasztásokat nyit, és ő fűz megjegyzést a győzelmeidhez.',
            'Név (2–16 karakter: betű, szám, szóköz, kötőjel) és egy nem kötelező jelmondat. A közös szerveren a név egyedi.'
          ] },
          { h: 'A kinézet lépései', list: [
            'Alap, Arc, Haj, Fej, Öltözet, Fegyver, Varázs, Összegzés, végül Név: minden lépésnél élőben látod a hősöd.',
            'Később a Hős menü Kinézet pontjában, vagy a Karakter képernyő Kinézet átszabása gombjával alakíthatsz rajta.'
          ] },
          { tip: 'Huhu! Ha még sosem játszottál ilyet, a Harcos vagy a Vadász a legbarátságosabb kezdés. A többi sem nehéz, csak több figyelmet kér.' }
        ] },

      { id: 'kasztok', title: 'A nyolc kaszt', short: 'Ki miben erős, és melyik taktika illik hozzá.',
        fig: 'classes', figCaption: 'Harcos, Vadász, Mágus, Gyógyító, Orgyilkos, Idéző, Dalnok, Alakváltó', go: 'hos',
        blocks: [
          { p: 'A kaszt adja a hősöd alapját: mennyi életet, támadást, védelmet és fürgeséget kap szintenként, és milyen képességeket tanul. Mindegyikkel végig lehet vinni a játékot, csak másképp harcolnak.' },
          { list: [
            'Harcos (könnyű): sokat bír, elöl véd. Ajánlott taktika: Kitartás.',
            'Vadász (könnyű): biztos, egyenletes sebzés, jó kitérés. Ajánlott: Roham.',
            'Mágus (közepes): nagyot sebez, de törékeny. Ajánlott: Roham.',
            'Gyógyító (közepes): gyógyít és véd; csapatban és a heti szörnynél aranyat ér. Ajánlott: Kitartás.',
            'Orgyilkos (haladó): a harc első találata nála másfélszer akkorát üt, de keveset bír. Ajánlott: Roham.',
            'Idéző (közepes): egy szellem minden körben vele együtt üt. Ajánlott: Roham.',
            'Dalnok (haladó): gyengíti az ellenfelet, erősíti magát. Ajánlott: Kitartás.',
            'Alakváltó (közepes): medve- és farkasformában más-más erőssége van. Ajánlott: Kitartás.'
          ] },
          { tip: 'Az ajánlott taktikát a felület is jelöli. Nem kötelező, de a kasztodhoz az illik a legjobban.' }
        ] },

      { id: 'tabor', title: 'A tábor és a napi rutin', short: 'Hol mit találsz, és mit érdemes naponta megcsinálni.',
        fig: 'camp', figCaption: 'A tábor: innen indul minden kaland', go: 'kaland',
        blocks: [
          { p: 'A tábor a kezdőképernyőd. Itt választasz kalandot (Hová indulsz?), itt küldöd őrjáratra a hősöd, és itt állítod a taktikát meg a Hold-fokozatot. A főmenü csoportjai: Kaland, Naponta, Kihívások, Együtt, Hős és Közösség. Telefonon alul öt gomb van: Tábor, Hős, Táska, Krónika (a közös szerveren Közösség) és Menü.' },
          { h: 'Egy jó játéknap', list: [
            'Vedd át a napi ajándékot, és nézz be a Vándorkereskedőhöz.',
            'Küldd őrjáratra a hősöd: közben nyugodtan kalandozhatsz.',
            'Égesd el a fáklyáidat kalandokon, és vedd át a teljesített Megbízásokat.',
            'Ha van időd: Holdkrónika-fejezet, Holdtorony, heti esemény, Aréna, csapatküldetés.',
            'A közös szerveren: a heti szörny napi ütései és a céh.'
          ] },
          { p: 'A menüpontok melletti kis jelzések mutatják, mi vár még ma: hány párbajod, eseményharcod vagy küldetésed maradt, és hol vár átvehető jutalom. A napi számlálók budapesti idő szerint éjfélkor, a heti dolgok hétfőn indulnak újra.' }
        ] },

      { id: 'kaland', title: 'Kalandok', short: 'Könnyű, Közepes vagy Nehéz: esély, ajánlás és jutalom.',
        fig: 'offers', figCaption: 'Három ajánlat: a középső az ajánlott', go: 'kaland',
        blocks: [
          { p: 'A kaland a játék szíve. A táborban mindig három ajánlat vár: Könnyű, Közepes és Nehéz. Egy kaland egy fáklyába kerül, nagyjából egy percig tart: három tisztáson választasz egy-egy kártyát, a végén megküzdesz a terület őrzőjével.' },
          { h: 'Mit mutat egy ajánlat?', list: [
            'A tájat (Ködláp, Holdfény-erdő, Árnyromok, Csillaghullás-szirtek, Éjkatlan), az őrzőt és a szintjét.',
            'A győzelmi esélyt: sok próbaharc eredménye, ugyanarra a helyzetre mindig ugyanazt mutatja.',
            'A várható tapasztalatot (TP), Holdezüstöt és azt, mekkora eséllyel jár tárgy.',
            'AJÁNLOTT: a Közepes. Jó esély, rendes jutalom; kezdetnek és általában is ez a legjobb választás.'
          ] },
          { h: 'Melyiket válaszd?', list: [
            'Könnyű: szinte biztos győzelem, de kevesebb tapasztalat és ritkábban tárgy.',
            'Közepes: a jó középút.',
            'Nehéz: kockázatos, de több tapasztalat, Holdezüst, Csillagpor és tárgy jár, és főleg innen jönnek a legendás tárgyak.'
          ] },
          { h: 'Győzelem és vereség', list: [
            'Győzelemnél tapasztalat, Holdezüst és Csillagpor jár, és a három felkínált jutalomból egyet választhatsz.',
            'A jutalom lehet tárgy, egy marék Holdezüst, Csillagpor vagy tapasztalat-tekercs. A jobb tárgyat a hősöd magától felveszi.',
            'Vereségnél is megkapod a tapasztalat felét, és semmit nem veszítesz.'
          ] },
          { tip: 'Új ajánlatok jönnek, ha szintet lépsz, átöltözöl, fejlesztesz, újrasorsolsz, átrendezed a képességeidet, holdat vagy ösvényt váltasz. A taktika csak az esélyt számolja újra.' }
        ] },

      { id: 'tisztasok', title: 'Tisztások és kártyák', short: 'Harc, Kutatás vagy Esemény: tisztásonként egyet választhatsz.',
        fig: 'clearing', figCaption: 'Harc, Kutatás, Esemény', go: 'kaland',
        blocks: [
          { p: 'Minden kalandban három tisztás van, mindegyiken három kártya. Csak egyet választhatsz, ezért érdemes figyelni, mire van épp szükséged. A fejlécben látod, hányadik tisztásnál jársz.' },
          { list: [
            'Harc: egy könnyebb szörny. Győzelemért kis tapasztalat és Holdezüst jár. Ha elkerget, kicsit sérülten érsz az őrzőhöz.',
            'Kutatás: a kártyán látod a sikeresélyt, ami a fürgeségeddel nő. Siker esetén tárgy vagy Holdezüst jár, kudarcnál csak egy kis sérülés.',
            'Esemény: meglepetés. Áldás, kincs, gyógyulás vagy egy kis történet. A fajtáiról az Események fejezetben olvashatsz.'
          ] },
          { h: 'Jó tudni', list: [
            'A sérülések összeadódnak, de az őrző ellen így is legalább az életerőd 70%-ával indulsz.',
            'Az útközben talált tárgyak a kaland végén kerülnek a táskádba.',
            'A Visszafordulok gombbal bármikor hazamehetsz: amit addig gyűjtöttél, megmarad, de a fáklya elfogy, és az őrző jutalma elmarad.'
          ] }
        ] },

      { id: 'esemenyek', title: 'Események', short: 'Szentély, csapda, vándorárus, rejtvény, arany tisztás és láncok.',
        fig: 'events', figCaption: 'Az eseménykártyák fajtái', go: 'kaland',
        blocks: [
          { p: 'Az eseménykártya mindig egy kis jelenet két vagy több választással. A választás eredménye lehet áldás, Holdezüst, Csillagpor, gyógyulás, tapasztalat, néha tárgy, de egy rossz döntés kis sérüléssel is járhat.' },
          { h: 'Fajták', list: [
            'Esemény: a klasszikus meglepetés, bármi lehet belőle.',
            'Szentély: áldás vagy gyógyulás. Az áldás az őrző ellen erősíti az ütéseidet.',
            'Csapda: gyanús hely, ügyesség kell hozzá.',
            'Vándorárus: valaki árul valamit. A gombon látod az árat Holdezüstben; ha nincs elég pénzed, nem választhatod.',
            'Rejtvény: aki megfejti, jutalmat kap.',
            'Arany tisztás: ritka, ragyogó hely, bőséges jutalommal.'
          ] },
          { h: 'Különleges lehetőségek', list: [
            'Próba: a gombon látod, mekkora eséllyel sikerül (pl. fürgeség). Sikernél jóval nagyobb a jutalom, kudarcnál csak kisebb baj ér.',
            'Néhány választás csak egy adott származásnak vagy jellemnek nyílik meg. Ezeket külön kiemelve látod.',
            'Ha teljes erőben vagy, a pihenés gyógyulás helyett tapasztalatot ad, így semmi sem vész el.',
            'Lánc: néha egy döntésnek folytatása lesz a következő tisztáson. Ezt a felület jelzi is.'
          ] }
        ] },

      { id: 'orzok', title: 'Őrzők és elit őrzők', short: 'A kaland végén vár az őrző; az elit erősebb, de többet ad.',
        fig: 'guard', figCaption: 'Elit őrző: kisebb esély, több jutalom', go: 'kaland',
        blocks: [
          { p: 'Minden táj végén egy őrző vár. Harc előtt még egyszer látod a szintjét, az életerejét, a támadását és a pontos győzelmi esélyedet, amibe az útközbeni áldás és sérülés is beleszámít. Ha készen állsz, jöhet a Harcba! gomb.' },
          { h: 'Elit őrzők', list: [
            'A {ELITE_MIN}. szinttől a Közepes és Nehéz ajánlatok kb. {ELITE_PCT}%-ában feldühödött, megerősödött őrző vár.',
            'Az esély kisebb, cserébe több Holdezüst, Csillagpor és tapasztalat jár, gyakrabban kapsz tárgyat, és a mitikus esély is nő.',
            'Hogy elit jön-e, azt a szinted és a kalandjaid száma dönti el, nem a felszerelés: átöltözéssel nem lehet kihorgászni.'
          ] },
          { tip: 'Kaland közben átöltözés, fejlesztés vagy taktikaváltás után az őrző csak erősebb lehet. A taktikát a táborban, indulás előtt érdemes beállítani.' }
        ] },

      // ===================== HARC ÉS FEJLŐDÉS =====================
      { id: 'harc', title: 'Hogyan zajlik a harc?', short: 'Automatikus harc: körök, képességek, telitalálat, kitérés.',
        fig: 'combat', figCaption: 'A hősöd és az ellenfél körről körre csap össze', go: 'hos',
        blocks: [
          { p: 'A harc magától zajlik, neked csak nézni kell (vagy gyorsítani). Körönként mindketten lépnek. Aki fürgébb, gyakrabban kezd, de nem mindig: egy hajszálnyi különbség nem dönti el a harcot.' },
          { h: 'Mi számít?', list: [
            'ÉLET: ennyit bírsz. TÁM: ennyit ütsz. VÉD: ennyivel kevesebbet kapsz. FÜR: gyakrabban kezdesz, kitérsz és telibe találsz.',
            'Telitalálat: majdnem kétszeres ütés. Az esélye a fürgeségeddel és egyes tárgyakkal nő.',
            'Kitérés: az ütés célt téveszt. Szintén a fürgeség és a tárgyak növelik.',
            'A szörny minden negyedik körben nagyot üt. Ezt érdemes pajzzsal vagy kitérő képességgel kivédeni.',
            'Ha a harc nagyon elhúzódik, időre dől el: az nyer, akinek arányaiban több élete maradt.'
          ] },
          { h: 'Képességek', list: [
            'Mindenkinek van egy alaptámadása, és a 3., 6., 10. és 13. szinten egy-egy új képességet tanul.',
            'A hős mindig a lista első kész képességét használja, utána az újratöltődik. Ha semmi sincs kész, alaptámadással üt.',
            'A sorrendet a Karakter képernyőn, a Képességek résznél a nyilakkal állíthatod.',
            'Idéző: a szellem minden körben vele üt; a Falka két farkast hív, a Lélekcsere egy nagy robbanásért feláldozza a szellemet.',
            'Orgyilkos: a harc első találata másfélszeres. Dalnok és Alakváltó: gyengítés, gyorsítás és gyógyulás.'
          ] },
          { h: 'Irányítás', list: [
            'A harc alatt 1×, 2× vagy 4× sebességre válthatsz, vagy az Ugrás a végére gombbal azonnal megnézheted az eredményt.',
            'Vereség után Bubó egy mondatban elmondja, mit érdemes legközelebb másképp csinálni.'
          ] }
        ] },

      { id: 'taktika', title: 'Taktika', short: 'Roham, Kiegyensúlyozott vagy Kitartás: támadj vagy védekezz.',
        fig: 'tactics', figCaption: 'A három taktika', go: 'kaland',
        blocks: [
          { p: 'A taktika az egyetlen dolog, amit harc közben „helyetted” döntesz el: inkább támadjon a hősöd, vagy inkább vigyázzon magára. Minden harcra érvényes, a kalandoktól a toronyig és az Arénáig.' },
          { list: [
            'Roham: többet ütsz, de többet is kapsz. Sebzőknek és rövid harcokhoz.',
            'Kiegyensúlyozott: a biztos középút.',
            'Kitartás: kevesebbet ütsz, de kevesebbet is kapsz. Szívós kasztoknak és hosszú harcokhoz.'
          ] },
          { h: 'Hol állíthatod?', list: [
            'A táborban, a Taktika résznél, és a heti szörny képernyőjén.',
            'Az „ajánlott” címke azt jelzi, melyik illik a kasztodhoz.',
            'Kaland közben is válthatsz, de utána az őrző csak erősebb lehet. A taktikát a táborban, indulás előtt érdemes beállítani.'
          ] },
          { tip: 'Taktikaváltásra nem jön új kaland, csak az esélyek számolódnak újra. Nyugodtan próbáld ki, melyiknél nagyobb a százalék!' }
        ] },

      { id: 'faklyak', title: 'Fáklyák és Frissesség', short: 'Egy kaland egy fáklya; tele fáklyáknál Frissesség gyűlik.',
        fig: 'torches', figCaption: 'Fáklya és Frissesség', go: 'kaland',
        blocks: [
          { p: 'Minden kaland egy fáklyába kerül. Legfeljebb {TORCH_MAX} fáklyád lehet, és {TORCH_MIN} percenként egy magától újragyullad. Nem kell tehát egész nap játszanod: elég, ha naponta párszor benézel.' },
          { h: 'Frissesség', list: [
            'Ha minden fáklyád ég, az idő nem vész el: Frissességgé alakul, legfeljebb {RESTED_MAX} adagig.',
            'Amíg van Frissességed, minden fáklyás kalandért dupla tapasztalat jár. Egy kaland egy adag Frissességet használ el.'
          ] },
          { h: 'Fáradtan', list: [
            'Fáklya nélkül is mehetsz kalandra, de fáradtan kevesebb tapasztalatot, Holdezüstöt és Csillagport kapsz, tárgyat pedig egyáltalán nem.',
            'Eleinte a jutalom fele jár. Ha sokszor mész egymás után fáradtan, még kevesebb.',
            'Fáradtan a mitikus tárgy esélye is jóval kisebb, és a győzelem nem számít bele a céhcélba.',
            'Amint újra fáklyával indulsz, a fáradtság elmúlik.'
          ] },
          { tip: 'Huhu! Ha tudod, hogy sokáig nem jössz, nem baj: közben Frissesség gyűlik, és a visszatérésed után gyorsabban szintet lépsz.' }
        ] },

      { id: 'holdak', title: 'Hold-fokozatok', short: 'Erősebb szörnyek több jutalomért, a {MOON_MIN}. szinttől.',
        fig: 'moons', figCaption: 'Újhold, Félhold, Telihold, Vérhold', go: 'kaland',
        blocks: [
          { p: 'A {MOON_MIN}. szinttől a táborban Hold-fokozatot választhatsz. Minél erősebb a hold, annál erősebbek a szörnyek, és annál kisebb a győzelmi esély. Cserébe több jutalom jár.' },
          { list: [
            'Újhold: az alap, semmi extra.',
            'Félhold, Telihold, Vérhold: egyre több Holdezüst és Csillagpor, egy csipetnyivel több tapasztalat, és nagyobb esély mitikus tárgyra.',
            'Az ajánlatokon mindig a már kiszámolt, valódi esélyt látod.',
            'A beállítás megmarad, amíg vissza nem váltasz.'
          ] },
          { tip: 'Ha a Csillagpor-kereted már betelt a héten, a hold leginkább a több Holdezüst és a mitikus esély miatt éri meg.' }
        ] },

      { id: 'targyak', title: 'Tárgyak és ritkaság', short: 'Öt hely, öt ritkaság, különleges tulajdonságok, legendás és mitikus.',
        fig: 'items', figCaption: 'Szürke, zöld, kék, lila, legendás', go: 'hos',
        blocks: [
          { p: 'A hősödön öt tárgy lehet. Minél ritkább és minél magasabb szintű egy tárgy, annál erősebb. A tárgyak szintje a te szintedhez igazodik, így a régi zsákmányt idővel érdemes lecserélni.' },
          { h: 'A helyek', list: [
            'Fegyver: támadás. Páncél: élet és védelem. Sisak: védelem és élet.',
            'Gyűrű: támadás és fürgeség. Amulett: élet és fürgeség.'
          ] },
          { h: 'Ritkaság', list: [
            'Szürke és zöld: a kezdet. Kék: a {GATE_KEK}. szinttől, egy különleges tulajdonsággal.',
            'Lila (epikus): a {GATE_LILA}. szinttől, két különleges tulajdonsággal.',
            'Legendás: a {GATE_LEG}. szinttől, saját névvel és történettel, három erősebb tulajdonsággal.',
            'Ha még nem érted el egy ritkaság szintjét, a legjobb elérhetőt kapod helyette.'
          ] },
          { h: 'Különleges tulajdonságok', list: [
            'Plusz sebzés, telitalálat-esély, kitérés, életerő, gyógyítás, vagy plusz sebzés az első körben.'
          ] },
          { h: 'Szerencsevédelem', list: [
            'Közepes és Nehéz kalandon (és csapatküldetésen) legkésőbb {PITY_LILA} tárgysorsolásonként egy lila biztosan jön (a {GATE_LILA}. szinttől).',
            'A legendásra ugyanígy: legkésőbb {PITY_LEG} sorsolásonként jár egy, a {GATE_LEG}. szinttől. A legendás oda kerül, ahol még nincs legendásod.'
          ] },
          { h: 'Mitikus tárgy', p: 'A legritkább fajta: legendás erejű, egyedi ragyogású tárgy. Csak Nehéz kaland győzelméért járhat, a {GATE_LEG}. szinttől. Az erősebb hold és az elit őrző növeli az esélyét, és minden sikertelen próbálkozás közelebb visz hozzá.' },
          { tip: 'A Harcerő egyetlen szám, ami összefoglalja, mennyire erős a hősöd. A zöld nyíl a tárgyakon azt jelzi, hogy erősebb a mostaninál.' }
        ] },

      { id: 'fejlesztes', title: 'Fejlesztés és a táska', short: 'Fejlesztés, újrasorsolás, szétszedés, eladás, tele táska.',
        fig: 'upgrade', figCaption: 'Csillagporral egyre erősebb lesz a tárgy', go: 'taska',
        blocks: [
          { p: 'A Karakter képernyőn kattints egy felvett tárgyra: alatta fejlesztheted és újrasorsolhatod. A Táskában pedig a többi tárgyadat veheted fel, szedheted szét vagy adhatod el.' },
          { h: 'Fejlesztés', list: [
            'Csillagporba és egy kevés Holdezüstbe kerül, és minden lépés drágább az előzőnél.',
            'Minden fokozat kicsit erősebbé teszi a tárgy alapértékeit.',
            'A határ a ritkaságtól függ: a szürke tárgyat lehet a legkevésbé, a legendást a legtovább fejleszteni.'
          ] },
          { h: 'Újrasorsolás', list: [
            'A kék vagy ritkább tárgy különleges tulajdonságait Holdezüstért újrasorsolhatod.',
            'Minden újabb próba drágább az előzőnél.'
          ] },
          { h: 'A táska', list: [
            'Legfeljebb {INV_MAX} tárgy fér bele. Felveszem: a tárgy a helyére kerül, a régi a táskába.',
            'Szétszedés: Csillagport ad (ez beleszámít a heti keretbe). Eladás: Holdezüstöt ad.',
            'Mindkettőnél visszajár a fejlesztésre költött Csillagpor {REFUND}%-a, a heti kereten felül.',
            'Ha a táska tele van, az új tárgyat a játék automatikusan szétszedi, még a választott jutalomtárgyat is.',
            'Bekapcsolhatod a gyengébb szürke és zöld tárgyak automatikus szétszedését. A mitikus tárgyat sosem szedi szét magától.'
          ] },
          { tip: 'Amíg van hely a heti Csillagpor-keretben, a szétszedés éri meg. Ha betelt, inkább add el. A Táska ezt ki is írja.' }
        ] },

      { id: 'penzek', title: 'Pénzek és erőforrások', short: 'Holdezüst, Csillagpor, fáklya, Frissesség, tapasztalat.',
        fig: 'currencies', figCaption: 'Holdezüst, Csillagpor, Fáklya, Frissesség',
        blocks: [
          { p: 'A Nyxoriában kétféle pénz van, és két dolog, ami az időddel gazdálkodik. A felső sávban mindig látod, mennyi van belőlük.' },
          { list: [
            'Holdezüst: szinte mindenből jön. Ebből vásárolsz, fizetsz az árusoknak, és kell a fejlesztéshez, az újrasorsoláshoz, az ösvényváltáshoz és a céhalapításhoz.',
            'Csillagpor: a tárgyak fejlesztéséhez kell. Győzelmekből, őrjáratból, ládákból és szétszedésből jön.',
            'Fáklya: egy kaland egy fáklya. Magától újratöltődik.',
            'Frissesség: tele fáklyáknál gyűlik, és dupla tapasztalatot ad.',
            'Tapasztalat (TP): ettől lépsz szintet.'
          ] },
          { h: 'A heti Csillagpor-keret', list: [
            'Hetente csak bizonyos mennyiségű Csillagport gyűjthetsz. A keret a szinteddel nő, és hétfőn indul újra.',
            'A Hős és a Táska képernyő mindig kiírja, mennyi fér még bele.',
            'Nem számít bele: a fejlesztés visszatérítése, a napi ajándék és az Eredmények jutalma.'
          ] }
        ] },

      { id: 'szintek', title: 'Szintlépés és ösvények', short: 'Tapasztalat, új képességek, és a {PATH_LEVEL}. szinttől ösvény.',
        fig: 'paths', figCaption: 'Három ösvény kasztonként', go: 'hos',
        blocks: [
          { p: 'Tapasztalatot szinte mindenért kapsz: kalandért, őrjáratért, küldetésekért, tekercsekért. Szintlépéskor nő minden jellemződ, és bizonyos szinteken új képességet tanulsz. A legmagasabb szint az 50.' },
          { h: 'Ösvények', list: [
            'A {PATH_LEVEL}. szinttől a Karakter képernyőn a kasztod három ösvénye közül választhatsz egyet.',
            'Mindegyik mást erősít: például több védelmet, több telitalálatot vagy erősebb gyógyítást.',
            'Az első választás ingyenes, később Holdezüstért bármikor válthatsz.',
            'Harcos: Védelmező, Dühöngő, Zászlóvivő. Vadász: Mesterlövész, Vadonjáró, Árnyvadász.',
            'Mágus: Csillagmágus, Árnymágus, Elemek ura. Gyógyító: Holdpap, Csatapap, Csillagőrző.',
            'Orgyilkos: Árnyéktáncos, Méregkeverő, Fejvadász. Idéző: Holdszellem-hívó, Csontidéző, Elemi idéző.',
            'Dalnok: Harci dalnok, Altatódalnok, Krónikás. Alakváltó: Medvebőrű, Farkasszívű, Bagolylelkű.'
          ] },
          { h: 'Tapasztalat-bónuszok', list: [
            'Frissesség: dupla tapasztalat fáklyás kalandért.',
            'Győzelmi lendület: a heti szörny győzelmi ládája után egy napig több tapasztalat.',
            'Felzárkózó szél (közös szerver): ha a szerver többi hőséhez képest le vagy maradva, több tapasztalatot kapsz, akár a duplát.'
          ] }
        ] },

      // ===================== NAPI TEENDŐK =====================
      { id: 'holdkronika', title: 'Holdkrónika', short: 'A fő történet tíz fejezetben, mindegyik végén egy főellenféllel.',
        fig: 'story', figCaption: 'Minden fejezet végén különleges ellenfél vár', go: 'holdkronika',
        blocks: [
          { p: 'A Holdkrónika a Nyxoria fő története. Bubóval, Lenkével és a többiekkel együtt nyomozol a fakuló hold titka után. Nagyjából ötszintenként nyílik új fejezet, és mindegyik végén egy egyedi ellenfél vár.' },
          { list: [
            'Egyes fejezetekben döntened kell. A döntésed a történet folytatását is színezi.',
            'A győzelemért egyszeri, bőséges jutalom jár: Holdezüst, Csillagpor és egy tárgy, néha lila is.',
            'Az utolsó fejezet jutalma egy egyedi, névvel ellátott legendás tárgy.',
            'A vereség nem visz el semmit, de naponta legfeljebb {STORY_TRIES}-szor kaphatsz ki a fejezet ellenfelétől.',
            'Harc előtt legyen hely a táskádban, hogy a jutalom beférjen.'
          ] },
          { tip: 'A főellenfél erős: ha alacsony az esélyed, előbb erősödj pár kalanddal, és fejleszd a felszerelésedet.' }
        ] },

      { id: 'megbizasok', title: 'Megbízások', short: 'A tábor lakóinak kérései, plusz jutalomért.',
        fig: 'quests', figCaption: 'Egy megbízás a haladással és a jutalommal', go: 'megbizasok',
        blocks: [
          { p: 'A tábor lakói (Teca néni, Garas kapitány, Kósza Fülöp és a többiek) mindig kérnek tőled valamit. Egyszerre {QUEST_SLOTS} megbízásod lehet. A haladás magától számolódik, miközben játszol, neked csak át kell venned a jutalmat.' },
          { h: 'Milyen feladatok vannak?', list: [
            'Győzz le őrzőket egy adott tájon (vagy annál későbbin), győzz le elit őrzőt, vagy nyerj Nehéz kalandot.',
            'Nyerj tisztásharcokat, kutass sikeresen, imádkozz szentélyben, vásárolj vándorárustól, fejts meg rejtvényt.',
            'Győzz a Holdtoronyban (a gyors mászás nem számít), vagy nyerj párbajt az Arénában.'
          ] },
          { h: 'Szabályok', list: [
            'A jutalom Holdezüst, Csillagpor és tapasztalat.',
            'Az átvett megbízás helyére másnap jön új.',
            'Naponta egy megbízást lemondhatsz: a helyére azonnal jön egy másik.'
          ] }
        ] },

      { id: 'ajandek', title: 'Napi ajándék', short: 'Minden nap egy ajándék; a hetedik nap a legjobb.',
        fig: 'gift', figCaption: 'Hét napos sor: minél tovább jössz, annál jobb',
        blocks: [
          { p: 'Minden nap átvehetsz egy ajándékot a Naponta menüből. Az ajándékok hét napos sort alkotnak: ha egymás után jössz, egyre jobbak lesznek. Ha kihagysz egy napot, a sor elölről kezdődik; a hetedik nap után újra az első jön.' },
          { list: [
            'Az ajándék lehet Holdezüst, Csillagpor, tapasztalat vagy tárgy (zöld, majd kék).',
            'A hetedik napon egy nagy adag Holdezüst és egy ritka tárgy jár: a {GATE_KEK}. szinttől legalább kék, szerencsével még jobb.',
            'Az ajándékból kapott Csillagpor nem számít bele a heti keretbe.',
            'Az ajándék a fiókodhoz tartozik: több hős esetén is naponta egy jár.'
          ] }
        ] },

      { id: 'kereskedo', title: 'Vándorkereskedő', short: 'Naponta új áru Holdezüstért, a szintedhez igazítva.',
        fig: 'shop', figCaption: 'Mindegyik áruból egy darab van', go: 'bolt',
        blocks: [
          { p: 'A Vándorkereskedő minden nap négy új tárgyat hoz, a szintedhez és a kasztodhoz igazítva. Mindegyikből egy darab van, és Holdezüstért veheted meg. Éjfélkor új árut hoz.' },
          { list: [
            'Az áru többnyire zöld vagy kék, nagy ritkán lila is akad.',
            'Ha nem tetszik a kínálat, az Új árut kérek gombbal kis díjért újrapakoltathatod, naponta háromszor.',
            'Vásárlás előtt legyen hely a táskádban.',
            'A zöld nyíl itt is jelzi, ha egy áru erősebb a mostani tárgyadnál.'
          ] }
        ] },

      { id: 'orjarat', title: 'Őrjárat', short: 'Amíg nem vagy itt, a hősöd felderít, és jutalommal tér vissza.',
        fig: 'patrol', figCaption: 'Őrjárat: 1, 2, 4 vagy 8 óra', go: 'kaland',
        blocks: [
          { p: 'Naponta egyszer őrjáratra küldheted a hősödet a táborból: 1, 2, 4 vagy 8 órára. Közben nyugodtan kalandozhatsz is, az őrjárat semmit nem akaszt meg.' },
          { list: [
            'A jutalom tapasztalat, Holdezüst és Csillagpor; minél hosszabb az őrjárat, annál több.',
            'A 4 órás őrjárat 50% eséllyel tárgyat is hoz, a 8 órás biztosan.',
            'Ha letelt az idő, a táborban a Jutalom átvétele gombbal veheted át.'
          ] },
          { tip: 'Esti lefekvés előtt indíts egy 8 órásat: reggelre ott a tárgy!' }
        ] },

      // ===================== KIHÍVÁSOK ÉS KÖZÖSSÉG =====================
      { id: 'torony', title: 'Holdtorony', short: 'Emeletről emeletre egyre erősebb ellenfelek, hetente elölről.',
        fig: 'tower', figCaption: 'Minden ötödik emelet kincses', go: 'torony',
        blocks: [
          { p: 'A Holdtorony az 5. szinttől nyílik. Emeletről emeletre egyre erősebb ellenfelek várnak. Amíg nyersz, mászhatsz tovább; csak a vereség visz el egy próbálkozást, és naponta {TOWER_TRIES} fér bele. Hétfőn elölről kezded.' },
          { h: 'Jutalmak', list: [
            'Minden új emeletért Holdezüst és Csillagpor jár, minden ötödikért tárgy (kék, minden tizediken lila).',
            'A 30., 40. és 50. emeletért legendás tárgy jár (a legendás szintkapu után).',
            'A teljes jutalom csak a valaha elért legjobb eredményed feletti emeletekért jár. A heti újramászásért kevesebb, tárgy nélkül.'
          ] },
          { h: 'Gyors mászás', list: [
            'A hősödnél jóval gyengébb emeleteket egyben, harcjelenet nélkül is megmászhatod.',
            'Ha közben kikapsz, megáll, és ez is egy próbálkozásnak számít. A Megbízásokba nem számít bele.'
          ] },
          { tip: 'A közös szerveren heti toronyranglista is van: ki jutott a legmagasabbra ezen a héten.' }
        ] },

      { id: 'heti-esemeny', title: 'Heti esemény', short: 'Minden héten más szörny és egy csak akkor megszerezhető díj.',
        fig: 'event', figCaption: 'Pontgyűjtés a heti díjért', go: 'esemeny',
        blocks: [
          { p: 'Minden héten más esemény van saját szörnnyel, például a Vérhold-vadászat vagy a Csillageső. Naponta {EVENT_TRIES} harcod van. A szörny mindig a mostani erődhöz igazodik, nagyjából 60% győzelmi eséllyel.' },
          { list: [
            'Győzelemért 10, vereségért 3 pont jár. A vereség sem hiábavaló!',
            'A pontokért lépcsőzetes jutalom jár: Holdezüst, Csillagpor, egy tárgy, végül az esemény díja.',
            'A díj egy egyedi nevű lila tárgy, ami csak azon a héten szerezhető meg. Alacsonyabb szinten kék.',
            'A jutalmakat a pontsáv alatt, az Átveszem gombbal veheted át. Hétfőn új esemény jön, a pontok elvesznek.'
          ] },
          { tip: 'A díj nagyjából öt nap alatt jön össze, így egy kihagyott nap még belefér.' }
        ] },

      { id: 'arena', title: 'Aréna', short: 'Párbaj más hősök ellen, pontszámért.',
        fig: 'arena', figCaption: 'Két hős, egy győztes', go: 'arena',
        blocks: [
          { p: 'Az Arénában más hősökkel párbajozol. A hősöd itt is magától harcol: a felszerelés, a képességek sorrendje és a taktika dönt. Naponta {ARENA_FIGHTS} párbajod van.' },
          { list: [
            'Az Ellenfelet keresek gomb három, hozzád hasonló erejű ellenfelet hoz.',
            'Minden jelöltnél látod a győzelmi esélyt, és azt, hány pontot nyerhetsz vagy veszíthetsz.',
            'A pontszámod 1000-ről indul. Erősebb ellenfél legyőzése több pontot ér.',
            'Győzelemért pont, Holdezüst és Csillagpor jár, vereségért kevesebb Holdezüst.',
            'Minden párbaj után új ellenfelek jönnek. Ha a felkínált hármat nem szeretnéd, naponta egyszer lecserélheted őket.',
            'A közös szerveren valódi, hasonló erejű játékosok hősei jönnek, gyakorló módban gépi ellenfelek.'
          ] }
        ] },

      { id: 'csapat', title: 'Csapatküldetések', short: 'Egy-két társsal egy erős őrző ellen, bőkezűbb jutalomért.',
        fig: 'team', figCaption: 'Együtt erősebbek vagytok', go: 'csapat',
        blocks: [
          { p: 'A csapatküldetésen egy vagy két társat viszel magaddal egy erős őrző ellen. A társak minden körben veled együtt ütnek, az őrző pedig a csapat erejéhez igazodik. Naponta {TEAM_RUNS} küldetésed van.' },
          { list: [
            'Társakat keresek: négy jelölt közül kattintással választasz egyet vagy kettőt, aztán Indulunk.',
            'Az esélyetek nagyjából 50–55%.',
            'Győzelemért több tapasztalat, Holdezüst és Csillagpor jár, és jó eséllyel legalább kék tárgy.',
            'A közös szerveren a hasonló szintű játékosok hősei jönnek, a céhtársaid előnyben.',
            'A valódi társak gazdái is kapnak egy kis részt, amit a következő belépésükkor kapnak meg.'
          ] }
        ] },

      { id: 'boss', title: 'A heti szörny', short: 'Az egész szerver együtt üti; ládák és címek járnak érte.',
        fig: 'boss', figCaption: 'Közös ellenség az egész szervernek', go: 'boss', online: true,
        blocks: [
          { p: 'Minden héten egy hatalmas szörny érkezik, és az egész szerver együtt üti. Hétfő reggel 6-kor jön, és vasárnap este 10-ig marad, ha addig le nem győzitek. Naponta {BOSS_HITS} ütésed van.' },
          { h: 'Az ütés', list: [
            'Egy ütés egy rövid, háromkörös harc. A kiosztott sebzés számít; itt nem lehet kikapni.',
            'Minden ütésért kapsz egy kis tapasztalatot, Holdezüstöt és Csillagport.',
            'A szörnynek van egy gyenge pontja: ha azzal a taktikával ütsz, amelyikre gyenge (a képernyő kiírja), többet sebzel.',
            'Péntektől dühödt lesz: erősebben üt vissza, de több Csillagport ad.'
          ] },
          { h: 'Ládák', list: [
            'Részvételi láda 3 ütés után: Holdezüst, Csillagpor és egy tárgy.',
            'Ezüst láda 9 ütés után: legalább zöld tárgy. Arany láda 15 ütés után: legalább kék, néha lila, szerencsével legendás.',
            'Győzelmi láda, ha a szerver legyőzi a szörnyet, és te is ütöttél: még egy tárgy, és egy napig több tapasztalat.',
            'A múlt heti ki nem nyitott ládáidat a következő héten is kinyithatod.'
          ] },
          { tip: 'A hét végén a három legnagyobb sebző címet kap. Az ütések és a ládák a fiókodhoz tartoznak, nem a hőshöz.' }
        ] },

      { id: 'ceh', title: 'Céh és céhháború', short: 'Közös heti célok, és minden héten egy ellenfél céh.',
        fig: 'guild', figCaption: 'Saját zászló, jelvény és mottó', go: 'ceh', online: true,
        blocks: [
          { p: 'A céhben a tagok győzelmei összeadódnak. Csatlakozhatsz egy meglévőhöz, vagy az 5. szinttől 1000 Holdezüstért alapíthatsz sajátot, saját névvel, céhjellel, színnel, jelvénnyel és mottóval. Egy céhnek legfeljebb 20 tagja lehet.' },
          { h: 'Heti közös célok', list: [
            'Beleszámít minden győzelem fáklyás kalandon, az Arénában, a heti eseményen, a csapatküldetésen és a Holdkrónikában. A torony nem.',
            'Egy fiók naponta legfeljebb 25 győzelemmel járulhat hozzá, több hőssel sem halmozható.',
            'Három cél van, a létszámhoz igazítva. A jutalmat mindenki magának veszi át, ha a héten legalább egyszer nyert.'
          ] },
          { h: 'Céhháború', list: [
            'Minden héten két hasonló erejű céh kerül össze. Amelyik vasárnap éjfélig több győzelmet gyűjt, az nyer.',
            'A győztes céh zászlójára csillag kerül. Döntetlennél senki sem kap csillagot.',
            'A jutalmat a következő héten veheti át, aki a háború hetében legalább egyszer nyert, és legkésőbb szerdán csatlakozott.',
            'Ha páratlan számú céh van, valamelyik céh pihen azon a héten.'
          ] }
        ] },

      // ===================== HŐS ÉS FIÓK =====================
      { id: 'eredmenyek', title: 'Eredmények és album', short: 'Trófeák fokozatokkal, gyűjtőalbum és bestiárium.',
        fig: 'album', figCaption: 'Akit legyőzöl, az előkerül a bestiáriumban', go: 'eredmenyek',
        blocks: [
          { p: 'Az Eredmények képernyőn gyűlnek a trófeáid. Minden eredménynek több fokozata van (pl. szint, győzelmek, toronyemeletek, őrjáratok, fejlesztések), és minden fokozatért egyszer jár jutalom.' },
          { list: [
            'A jutalom Csillagpor és Holdezüst; ez a Csillagpor nem számít bele a heti keretbe.',
            'A legendás tárgyakhoz kötött eredmények címet is adnak, ami a profilodon látszik.',
            'Gyűjtőalbum: minden legyőzött őrző, és minden kék, lila, legendás és mitikus tárgyad neve bekerül.',
            'Bestiárium: minden lény, akivel találkoztál. Akit legyőzöl, annak a leírása is előkerül.'
          ] }
        ] },

      { id: 'hosok', title: 'Több hős', short: 'Legfeljebb {HERO_SLOTS} hősöd lehet, bármikor válthatsz.',
        fig: 'heroes', figCaption: 'A Hőseim oldal', go: 'hosok',
        blocks: [
          { p: 'Legfeljebb {HERO_SLOTS} hősöd lehet, és a Hős menü Hőseim oldalán bármikor válthatsz köztük. Kipróbálhatsz egy másik kasztot anélkül, hogy a régi hősödet elveszítenéd.' },
          { list: [
            'Mindegyik hős külön fejlődik: saját szint, felszerelés, fáklyák, táska, heti Csillagpor-keret és aréna-pontszám.',
            'Közös a napi ajándék, és a közös szerveren a heti szörny ütései, ládái, címei, valamint a céhed.',
            'Ha kaland közben váltasz, a félbehagyott kaland megvárja a hősödet.',
            'Pihenő hőst törölni csak úgy lehet, ha beírod a nevét. Ezt nem lehet visszacsinálni!'
          ] }
        ] },

      { id: 'kozosseg', title: 'Profil, ranglista, krónika', short: 'Ezt látják rólad mások, és ki hol tart a szerveren.',
        fig: 'heroes', figCaption: 'A profilod a hősöd névjegye', go: 'kozosseg',
        blocks: [
          { p: 'A Profil a hősöd névjegye: kinézet, felszerelés, Harcerő, győzelmek, aréna-pontszám, a torony legjobbja, legendás és mitikus tárgyak, címek és trófeák. A közös szerveren a ranglistán bárki nevére kattintva megnézheted az ő profilját.' },
          { h: 'Ranglisták (közös szerver)', list: [
            'Szint, Heti szörny, Aréna, Holdtorony (heti), Céhek (heti győzelmek).',
            'Újoncok: csak a 14 napnál fiatalabb hősök. Gyűjtők: legendás tárgyak. Harcerő.'
          ] },
          { h: 'Krónika', list: [
            'A Saját krónikában a hősöd története olvasható: szintek, győzelmek, ritka zsákmány.',
            'A Közös krónikában az egész szerver hírei. A mitikus tárgyak, a legnagyobb fejlesztések, a nagy szintek és a heti szörny hírei a Discordra is kikerülnek.',
            'Ha valaki jutalmat küld neked (pl. egy csapatküldetésből), a következő belépéskor megkapod, és a krónikában is látod.'
          ] }
        ] },

      { id: 'beallitasok', title: 'Beállítások és játékmódok', short: 'Harcsebesség, Bubó tippjei, mentés; gyakorló és közös szerver.',
        fig: 'settings', figCaption: 'A Beállítások képernyő', go: 'beallitas',
        blocks: [
          { list: [
            'Alapértelmezett harcsebesség: 1×, 2× vagy 4×.',
            'Bubó tippjei: be- és kikapcsolhatod, az Újra mind gombbal pedig elölről láthatod őket.',
            'A gyengébb tárgyak automatikus szétszedését a Táskában kapcsolhatod be.'
          ] },
          { h: 'Közös szerver', list: [
            'Discorddal lépsz be (a Nyxoria Discord-szerver tagjaként), és a hősöd a szerveren mentődik, bármelyik gépről elérheted.',
            'Itt van heti szörny, céh, céhháború, ranglisták, közös krónika, és valódi játékosok az Arénában és a csapatküldetéseken.'
          ] },
          { h: 'Gyakorló mód', list: [
            'A hőseid csak ebben a böngészőben élnek. Másik gépre a Mentés kimásolása és az Importálás gombbal viheted át.',
            'Nincs heti szörny, céh és ranglista; az Arénában és a csapatküldetéseken gépi hősök szerepelnek.'
          ] }
        ] }
    ],

    faq: [
      { q: 'Miért változott meg a győzelmi esélyem?', a: 'Az esély a hősöd és a szörny erejéből számolódik. Ha taktikát váltasz, átöltözöl, fejlesztesz vagy más Hold-fokozatot választasz, újraszámolódik. Kaland közben az útközbeni sérülés és áldás is beleszól.' },
      { q: 'Miért nem kaptam tárgyat?', a: 'Valószínűleg fáradtan, fáklya nélkül mentél: akkor tárgy nem jár, helyette kevesebb Holdezüst. Fáklyával is csak bizonyos eséllyel jön tárgy; ezt az ajánlaton látod. Nehéz kalandon a legnagyobb.' },
      { q: 'Hogyan szerezhetek legendás tárgyat?', a: 'A {GATE_LEG}. szinttől főleg Nehéz kalandokból. A szerencsevédelem legkésőbb {PITY_LEG} sorsolásonként ad egyet. Jöhet még a heti szörny Arany ládájából, a torony 30., 40. és 50. emeletéről és a Holdkrónika fináléjából.' },
      { q: 'Mi történik, ha tele a táskám?', a: 'Az új tárgyat, még a jutalomként választott jobbat is, a játék automatikusan szétszedi Csillagporrá. Vásárolni és a Holdkrónika ellenfelét megtámadni csak szabad hellyel lehet. Szedd szét vagy add el a gyengébbeket a Táskában.' },
      { q: 'Elveszítek valamit, ha kikapok?', a: 'Nem. Vereségért is jár a tapasztalat fele, és amit útközben gyűjtöttél, megmarad. Csak az őrző jutalma marad el.' },
      { q: 'Miért nem kapok Csillagport?', a: 'Valószínűleg betelt a heti Csillagpor-keret. Hétfőn indul újra, és a szinteddel nő. Addig a tárgyakat érdemes inkább eladni Holdezüstért.' },
      { q: 'Mikor jön új fáklya?', a: '{TORCH_MIN} percenként gyullad egy újra, legfeljebb {TORCH_MAX}-ig. Ha mind ég, a többlet Frissességgé alakul, ami dupla tapasztalatot ad.' },
      { q: 'Miért lett erősebb az őrző, amikor átöltöztem?', a: 'Kaland közben átöltözés, fejlesztés, újrasorsolás vagy taktikaváltás után az őrző csak erősebb lehet, gyengébb nem. Mindent a táborban, indulás előtt érdemes beállítani.' },
      { q: 'Mit jelent az elit őrző?', a: 'Feldühödött, erősebb őrző a {ELITE_MIN}. szinttől, a Közepes és Nehéz kalandok egy részében. Kisebb az esély, de több Holdezüst, Csillagpor, tapasztalat és tárgy jár, és nagyobb a mitikus esély.' },
      { q: 'Melyik taktikát válasszam?', a: 'Kezdetnek az „ajánlottat”, az illik a kasztodhoz. Ha egy harc sokáig elhúzódik, próbáld a Rohamot; ha túl sokat kapsz, a Kitartást. Az ajánlatokon azonnal látod, melyiknél nagyobb az esély.' },
      { q: 'Mi az a mitikus tárgy?', a: 'Legendás erejű, egyedi ragyogású tárgy. Csak Nehéz kaland győzelméért jöhet, a {GATE_LEG}. szinttől. Az erősebb hold és az elit őrző növeli az esélyét. A közös szerveren a Discordon is kihirdetik.' },
      { q: 'Megéri szétszedni a fejlesztett tárgyat?', a: 'Igen: szétszedéskor és eladáskor is visszajár a beletett Csillagpor {REFUND}%-a, ráadásul a heti kereten felül. A szétszedés maga is ad port, az eladás Holdezüstöt.' },
      { q: 'Mikor indulnak újra a napi és heti dolgok?', a: 'A napiak (ajándék, Aréna, esemény- és toronypróbák, megbízások, őrjárat) budapesti idő szerint éjfélkor. A hetiek (Holdtorony, heti esemény, Csillagpor-keret, céhcélok) hétfőn. A heti szörny hétfő reggel 6-kor érkezik.' },
      { q: 'Átvihetem a hősömet másik gépre?', a: 'A közös szerveren a hősöd a fiókodhoz tartozik, bárhonnan eléred. Gyakorló módban a Beállításokban a Mentés kimásolása és az Importálás gombbal viheted át.' },
      { q: 'Miért nem látom a heti szörnyet és a céhet?', a: 'Ezek csak a közös szerveren érhetők el. Gyakorló módban (a fejlécben GYAKORLÓ felirat) nincsenek, és az Arénában is gépi ellenfelek vannak.' },
      { q: 'Megváltoztathatom a kasztomat vagy a nevemet?', a: 'Nem, a név, a faj és a kaszt örökre szól. A kinézetet viszont bármikor átszabhatod. Ha más kaszttal játszanál, készíts egy új hőst a Hőseim oldalon (legfeljebb {HERO_SLOTS} lehet).' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);

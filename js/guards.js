// Nyxoria – további kalandőrök (régiónként +3), a történet bosszainak külseje, valamint minden őr elit változatának sora
(function (root) {
  var D = root.NYX.data;
  D.GUARD_EXTRA = {
    regions: {
      kodlap: ['Gyékény néne', 'Az Iszapóriás', 'Szipóka, a nagypióca'],
      holdfeny: ['Tobozapó, a koboldok öregje', 'A Holdtó Tündére', 'Agancsos Szarvasbogár'],
      arnyromok: ['Porszövő, a levéltár pókja', 'A Toronyvízköpő', 'A Régi Éjjeliőr'],
      szirtek: ['Szikladöngető Kos', 'A Kráter Remetéje', 'Csillagtüzes Hiúz'],
      ejkatlan: ['Éjfél Bajnoka', 'Obszidiánóriás', 'Szurokszárnyú sárkány']
    },

    art: {
      // új őrök
      'Gyékény néne': { kind: 'priest', tint: '#9aa860' },
      'Az Iszapóriás': { kind: 'golem', tint: '#6a5236', scale: 1.12 },
      'Szipóka, a nagypióca': { kind: 'worm', tint: '#3e3a30' },
      'Tobozapó, a koboldok öregje': { kind: 'imp', acc: 'pine', tint: '#c0a060', scale: 1.1 },
      'A Holdtó Tündére': { kind: 'wisp', acc: 'queen', tint: '#c8d8ff' },
      'Agancsos Szarvasbogár': { kind: 'beetle', tint: '#5a3a2a', scale: 1.08 },
      'Porszövő, a levéltár pókja': { kind: 'spider', acc: 'web', tint: '#a8a090' },
      'A Toronyvízköpő': { kind: 'griffin', tint: '#7a7a80' },
      'A Régi Éjjeliőr': { kind: 'wisp', acc: 'lantern', tint: '#c8c0a0' },
      'Szikladöngető Kos': { kind: 'ram', tint: '#9aa0c0', scale: 1.1 },
      'A Kráter Remetéje': { kind: 'priest', tint: '#d8c8ff' },
      'Csillagtüzes Hiúz': { kind: 'beast', acc: 'ember', tint: '#ffd0a0' },
      'Éjfél Bajnoka': { kind: 'knight', variant: 'fallen', tint: '#5f86e0', scale: 1.08 },
      'Obszidiánóriás': { kind: 'golem', acc: 'shards', tint: '#1e1a2e', scale: 1.1 },
      'Szurokszárnyú sárkány': { kind: 'drake', tint: '#2a1a40', scale: 1.15 },
      // a történet bosszai
      'A Lámpaoltó Varangy': { kind: 'frog', tint: '#8a7a3a', scale: 1.15 },
      'A Vándor Ködkutyája': { kind: 'beast', tint: '#d8e4ec', scale: 1.08 },
      'Fakószőrű Ordas': { kind: 'beast', acc: 'spikes', tint: '#8a8478', scale: 1.12 },
      'Gyantaszívű Öregfenyő': { kind: 'priest', variant: 'dryad', tint: '#c08a3a', scale: 1.15 },
      'A Harangkongató Kísértet': { kind: 'wisp', acc: 'scream', tint: '#d8d0c0' },
      'Tükörszülött Árny': { kind: 'knight', variant: 'shadow', tint: '#3a3460' },
      'Viharszárnyú Griffanya': { kind: 'griffin', tint: '#7a8aa8', scale: 1.15 },
      'Az Ébredő Csillagláng': { kind: 'wisp', acc: 'star', tint: '#ffffff', scale: 1.15 },
      'A Feneketlen Éhség': { kind: 'worm', tint: '#0e0a18', scale: 1.15 },
      'A Fekete Hold': { kind: 'wisp', acc: 'queen', tint: '#14102a', scale: 1.15 }
    },

    texts: {
      'Gyékény néne': {
        intro: 'Görbe hátú anyóka szedi a gyógyfüveket a nádas szélén. Felnéz, és megmarkolja a botját. „Ezt a füvet nem neked szedem, kedveském.”',
        win: 'Gyékény néne lehuppan egy zsombékra, és fújtat. „No jó, ügyes vagy. Ebből főzz teát, ha megfázol.” A kezedbe nyom egy csokor füvet.',
        lose: 'A néne kétszer fejbe koppint a botjával, aztán megitat egy bögre teával, és kitessékel a nádasból. Fáj a fejed, de legalább nem fázol.'
      },
      'Az Iszapóriás': {
        intro: 'Az egyik sárdomb megmozdul, aztán feláll, és csak nő és nő. A szeme helyén mocsárgáz pislákol. A gázlón nem enged át, ezt elég világosan jelzi.',
        win: 'Az óriás lassan visszaroskad a lápba, és újra csak egy sárdomb lesz belőle. Még feljön belőle egy buborék. Egy nagyon sértett buborék.',
        lose: 'Az óriás egyszerűen rád ül. Nem bánt, csak nagyon nehéz és nagyon büdös. Mire kiásod magad, ráun az egészre, és visszacsusszan a lápba.'
      },
      'Szipóka, a nagypióca': {
        intro: 'Valami rátapad a csizmádra. Lenézel: egy pióca, akkora, mint egy cipó. Szipóka a Fekete-tó vénje, és láthatóan régóta nem evett.',
        win: 'Szipóka elengedi a csizmádat, és sértődötten visszacsusszan a tóba. Egy cuppanós nyomot hagyott rajta emlékbe.',
        lose: 'Szipóka addig szívja az erődet, amíg le nem ülsz pihenni a partra. Ő is jóllakott, el is szunnyad. Csendben elsomfordálsz.'
      },
      'Tobozapó, a koboldok öregje': {
        intro: 'Fehér szakállas kobold ül egy tönkön, és tobozt majszol. Mögötte a koboldok kincses odva. „Ide csak az jön be, aki legyőz. Vagyis senki.”',
        win: 'Tobozapó leteszi a tobozt, és megvakarja a szakállát. „Nahát. Ilyet utoljára a nagyapám látott.” Bekukucskálhatsz az odúba.',
        lose: 'Tobozapó egy tobozzal pont homlokon talál. Mire elszámolod a csillagokat, a koboldok mind visszabújnak. Csak kuncogást hallasz.'
      },
      'A Holdtó Tündére': {
        intro: 'A tó vize fodrozódni kezd, és ezüst fátyolban halvány alak emelkedik ki belőle. „A tavam vizéből csak az ihat, aki kiállja a próbát.”',
        win: 'A tündér mosolyogva visszasüllyed, a víz egy pillanatra ezüstösen felragyog. Iszol egy kortyot: hideg és édes, mint a holdfény.',
        lose: 'A tündér egy hullámmal kisodor a partra, aztán vizes tenyérrel megpaskolja az arcodat. „Majd legközelebb, kis hős.”'
      },
      'Agancsos Szarvasbogár': {
        intro: 'Zúgás, reccsenés, és egy kutyányi szarvasbogár landol az ösvényen. Az agancsa olyan, mint egy kétkezes harapófogó. Ez az ő tölgye, és nem osztozik.',
        win: 'A bogár a hátára fordul, és kalimpál. Visszafordítod. Kicsit szégyenkezve elzúg a tölgy koronája felé.',
        lose: 'A bogár felemel az agancsával, és udvariasan arrébb tesz. Nagyon arrébb. Egy bokorban landolsz, ő meg elégedetten zümmög.'
      },
      'Porszövő, a levéltár pókja': {
        intro: 'A régi levéltárat vastag háló borítja. A közepén Porszövő ül, és nyolc lábbal lapozgat a tekercsekben. „Olvasni jöttél? Vagy porosodni?”',
        win: 'Porszövő felhúzódik a mennyezetre. „Jól van, olvass, ha akarsz. Csak a lapok sarkát ne hajtsd be!” Egy tekercset ejt eléd.',
        lose: 'Porszövő gondosan begubóz, mint egy becses könyvet, és kitesz a levéltár elé. A gubóból kiszabadulsz, de a por napokig a hajadban marad.'
      },
      'A Toronyvízköpő': {
        intro: 'Az eresz alatt kőszörny guggol, tátott szájjal. Ahogy elhaladsz alatta, megreccsen a nyaka. Aztán a szárnya. Aztán leugrik.',
        win: 'A vízköpő visszakapaszkodik az eresz alá, és megdermed. A szájából csak vékony csorgás jön. Talán sóhajt.',
        lose: 'A vízköpő egy vödörnyi régi esővizet zúdít a nyakadba, aztán visszaül a helyére. Csuromvizesen, kissé megszégyenülten távozol.'
      },
      'A Régi Éjjeliőr': {
        intro: 'Lámpás imbolyog a sötét utcán. Áttetsző öregember viszi, pedig a város háromszáz éve kihalt. „Takarodó van! Ki jár itt ilyenkor?”',
        win: 'Az éjjeliőr csóválja a fejét. „Hát jó, de éjfélre otthon légy!” Aztán továbbballag, a lámpása fénye pedig elhalványul a falak között.',
        lose: 'Az éjjeliőr a lámpásával kerget végig a fél városon, egészen a romok széléig. „Takarodó van!” – kiabálja utánad. Most már tudod.'
      },
      'Szikladöngető Kos': {
        intro: 'Bumm. Bumm. Egy hatalmas kos döngeti a sziklát, csak úgy, magának. Aztán észrevesz, és láthatóan örül, hogy végre valami puhább jött.',
        win: 'A kos megáll, megrázza a fejét, és leül. Kicsit szédül. Te is. Biccentetek egymásnak, aztán mindenki megy a dolgára.',
        lose: 'Egy döngetés, és már a szirt aljáról nézed a csillagokat. A kos fentről elégedetten béget le rád. Legalább puhán értél földet.'
      },
      'A Kráter Remetéje': {
        intro: 'Rongyos köpenyes öregember ül a kráter peremén, és a csillagot nézi. Harminc éve őrzi. „Ne gyere közelebb. Még nem ébredt fel.”',
        win: 'A remete leengedi a botját. „Talán épp téged várt.” Félreáll, és megmutatja a kráterhez vezető ösvényt. A szeme könnyes, de mosolyog.',
        lose: 'A remete botjából fény villan, és a lábad magától indul visszafelé. „Nem rossz szándékból teszem!” – kiáltja utánad. Elhiszed neki.'
      },
      'Csillagtüzes Hiúz': {
        intro: 'Két izzó szem a sziklák között. Hiúz lép elő, a bundájában apró szikrák pattognak, mintha csillagpor ragadt volna rá. Ez az ő vadászterülete.',
        win: 'A hiúz fújva hátrál, aztán egy ugrással eltűnik a sziklák között. Egy pillanatig még látod a szikráit, aztán csend lesz.',
        lose: 'A hiúz villámgyors: mire meglendítenéd a fegyvered, már a hátad mögött van. Megböki az orrával a tarkódat, és elszalad. Csak játszott.'
      },
      'Éjfél Bajnoka': {
        intro: 'Fekete páncélos alak áll a katlan hídján. Csak akkor mozdul, amikor odaérsz. „Évszázadok óta senki sem jutott át. Lássuk, te mire mész.”',
        win: 'A Bajnok kardja kettétörik, és a lovag letérdel. „Átjuthatsz.” A hangjában nincs harag, csak meglepetés. Talán egy kis megkönnyebbülés is.',
        lose: 'A Bajnok a kardja lapjával visszatol a híd elejére. „Még nem” – mondja, és visszaáll a helyére. Évszázadok óta mindenkinek ezt mondja.'
      },
      'Obszidiánóriás': {
        intro: 'Megmozdul a katlan fala. Fekete, üvegfényű kőből rakott óriás lép ki belőle, a szilánkjai csilingelnek. Valaki régen őrnek faragta.',
        win: 'Az óriás megreped, és lassan visszahátrál a falba. Csak egy fekete szilánk marad utána, tükörsimára csiszolva.',
        lose: 'Az óriás felemel, és gondosan kitesz a katlan peremére, mint egy rossz helyre került kavicsot. Aztán visszasétál a falba.'
      },
      'Szurokszárnyú sárkány': {
        intro: 'Sárkány ereszkedik le a katlan pereméről, a szárnya fekete, mint a szurok. Nagy levegőt vesz. Gyanítod, hogy tüzet akar fújni. Jól gyanítod.',
        win: 'A sárkány prüszköl egyet, és sértett pillantással elrepül. Egy fekete pikkely libben le eléd, még langyos.',
        lose: 'A sárkány egy szárnycsapással felkap a forró széllel együtt, és a katlan szélén ejt le. Kormos vagy, de egyben vagy.'
      }
    },

    elite: {
      // Ködláp
      'Öreg Brekus, a lápkirály': 'A lápkirály ma különösen rossz kedvű, és a koronája vészjóslóan ragyog.',
      'Ködanya': 'Ma egész nap meg sem mozdult a köd, és Ködanya ebből táplálkozik: sűrűbb és hidegebb, mint valaha.',
      'Ezüstpikkelyű kígyó': 'Most vedlett: az új ezüstpikkelyei kőkemények, a fegyvered csak lecsúszik róluk.',
      'Gyékény néne': 'Ma szedte a legerősebb füveket: a néne ivott egy kortyot a saját főzetéből, és húsz évvel fiatalabbnak érzi magát.',
      'Az Iszapóriás': 'Három napig esett, és az Iszapóriás jóllakott friss sárral: kétszer akkorára hízott.',
      'Szipóka, a nagypióca': 'Langyos ma a tó vize, és Szipóka ilyenkor teljesen felébred: villámgyorsan tekeredik és tapad.',
      // Holdfény-erdő
      'Ezüstszarvú kos': 'Frissen köszörülte a szarvát egy holdkövön: most vakítóan csillog, és kétszer akkorát üt.',
      'A Fenyőkirálynő': 'Tavasz van, a fák új gyantától duzzadnak: most minden gyökér és ág a királynő szavára mozdul.',
      'Holdvadász': 'Ma a vadász legjobb éjszakája: egyetlen nyila sem téveszt célt.',
      'Tobozapó, a koboldok öregje': 'Tobozhullás ideje van: Tobozapó zsebei dugig, és az egész kobold nép neki adogatja a lőszert.',
      'A Holdtó Tündére': 'Ma épp a tó fölött áll a hold: a tündér fátyla ezüstbe borult, és minden hulláma neki engedelmeskedik.',
      'Agancsos Szarvasbogár': 'Párzási idő van, és a szarvasbogár mindenkiben vetélytársat lát. Téged is. Főleg téged.',
      // Árnyromok
      'A Romok Kapuőre': 'Valaki elárulta neki, hogy a jelszót már mindenki tudja. Most megsértődött, és duplán vigyáz a kapura.',
      'Árnypap': 'Az árnyékok ma különösen sűrűk, és mind vele együtt mormolják az imát.',
      'Bukott lovag': 'A lovag ma megtalálta a romok közt a régi pajzsát, és vele együtt a régi esküjét is.',
      'Porszövő, a levéltár pókja': 'Tegnap rábukkant a város tiltott könyveire: a hálója most rúnákkal teli, és minden szála éget.',
      'A Toronyvízköpő': 'Esik az eső, a vízköpő torka tele van: ilyenkor ébred fel igazán, és minden csapása özönvíz.',
      'A Régi Éjjeliőr': 'Éjfélt üt a romos harang: ilyenkor kezdődik az öreg szolgálata, és a lámpása vakítóan ég.',
      // Csillaghullás-szirtek
      'A Lehullott Csillag Őre': 'A csillag ma különösen erősen lüktet, és az Őr pajzsa minden lüktetéssel fényesebben izzik.',
      'Kristálysárkány-fióka': 'A fióka ma evett először csillagkristályt: a lehelete már nem szikrázik, hanem lángol.',
      'Griffkirály': 'Vihar tombol a szirtek fölött, és a Griffkirály ilyenkor a legerősebb: a szárnycsapása köveket sodor.',
      'Szikladöngető Kos': 'Egész reggel kristálysziklákat döngetett, és csillagpor ivódott a szarvába: minden öklelése szikrát hány.',
      'A Kráter Remetéje': 'Ma éjjel csillageső van: a remete botja minden lehulló szikrát elnyel, és most csordultig van fénnyel.',
      'Csillagtüzes Hiúz': 'Most hempergett meg a frissen hullott csillagporban: lángol a bundája, és kétszer olyan gyors, mint máskor.',
      // Éjkatlan
      'Az Éjkatlan Ura': 'Holdfogyatkozás van, és az Úr köpenye elnyeli az utolsó fénycsíkot is: most teljes az ereje.',
      'Fekete Holdpap': 'A pap ma fejezte be háromnapos imáját, és a sötét holdja teljesen kikerekedett.',
      'Az Utolsó Árnyék': 'Ma minden fény kihunyt a katlanban: az Utolsó Árnyék beitta magát a sötétbe, és nagyobb, mint valaha.',
      'Éjfél Bajnoka': 'Éjfél van, a Bajnok órája: ilyenkor a sötétség beköltözik a páncéljába, és nem fog rajta a vágás.',
      'Obszidiánóriás': 'A katlan mélyén ma felforrt a láva: az óriás szilánkjai vörösen izzanak, és minden ütése perzsel.',
      'Szurokszárnyú sárkány': 'A sárkány ma a tojását őrzi a katlan peremén, ilyenkor senkit sem enged a közelébe, és kétszer olyan vadul harcol.'
    }
  };
  // beépítés: az új őrzők a tájegységük listájába, a szövegeik a kalandszövegek közé kerülnek
  var X = D.GUARD_EXTRA;
  D.REGIONS.forEach(function (r) { (X.regions[r.id] || []).forEach(function (g) { if (r.guards.indexOf(g) < 0) r.guards.push(g); }); });
  if (D.ADVENTURE && D.ADVENTURE.guards) Object.keys(X.texts).forEach(function (k) { D.ADVENTURE.guards[k] = X.texts[k]; });
})(typeof window !== 'undefined' ? window : globalThis);

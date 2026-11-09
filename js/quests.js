// Nyxoria – megbízások: visszatérő megbízók a tábor körül, megbízássablonok és a szörnyek bestiáriumi leírása
(function (root) {
  var D = root.NYX.data;
  D.QUESTS = {
    givers: {
      fogados:   { name: 'Teca néni, a fogadósné', line: 'A tábori fogadó gazdája. Mindent hall, mindent tud, és a gulyása messze földön híres.' },
      fuves:     { name: 'Hanga, a füvesasszony', line: 'Gyógyfüveket szárít a sátra előtt. Minden bajra tud egy teát, a nagyobbakra kettőt.' },
      kapitany:  { name: 'Garas kapitány', line: 'Nyugalmazott őrkapitány. A térde már nem a régi, a hangja viszont igen.' },
      terkepesz: { name: 'Kósza Fülöp, a térképész', line: 'Mindent lerajzol, amit látott. Amit nem látott, arról addig kérdez, amíg látja.' },
      novicius:  { name: 'Ince, a novícius', line: 'A tábori holdszentély növendéke. Buzgó, szórakozott, és folyton elhagyja a kulcsokat.' },
      kalmar:    { name: 'Menyhért, a kalmár', line: 'Szekérrel járja a vidéket. Mindent megvesz, mindent elad, és mindenen nyer egy kicsit.' }
    },

    templates: [
      // ---------- őrzők egy tájegységen ----------
      { id: 'gw_kapitany', type: 'guardWin', giver: 'kapitany', title: 'Őrjárat a régi módon',
        text: 'Régen én jártam körbe a vidéket, de már nem bírja a térdem. A kereskedők panaszkodnak, hogy {regioban} nem lehet járni az őrzőktől. Győzz le ott {n} őrzőt, hadd lássák, ki az úr!',
        done: 'Na ugye! Már a szekeresek is mernek arra járni. Mintha magam lettem volna ott, csak jobb térddel.' },
      { id: 'gw_terkepesz', type: 'guardWin', giver: 'terkepesz', title: 'Fehér folt a térképen',
        text: 'Van még egy fehér folt a térképemen, mert ahányszor {regioban} rajzolni kezdek, elkerget egy őrző. Győzz le ott {n} őrzőt, hogy végre befejezhessem!',
        done: 'Kész, végre minden patak a helyén van! A térkép sarkába téged is lerajzoltalak. Kicsit szebb lettél, mint a valóságban.' },
      { id: 'gw_fogados', type: 'guardWin', giver: 'fogados', title: 'Gomba nélkül nincs paprikás',
        text: 'A gombász addig nem hoz több gombát, amíg {regioban} őrzők garázdálkodnak. Intézz el ott {n} őrzőt, különben gomba nélkül marad a paprikás!',
        done: 'Ma reggel megjött a gombász egy teli kosárral! Este gombapaprikás lesz, és a te tányérodba merem a legnagyobb adagot.' },

      // ---------- elit őrzők ----------
      { id: 'ew_kapitany', type: 'eliteWin', giver: 'kapitany', title: 'Ha az őrző bepöccen',
        text: 'Az elit őrző dühösebb és erősebb a többinél. Harminc év alatt rengeteg legényt láttam előle hazaszaladni. Győzz le {n} elit őrzőt, és mutasd meg, hogy te másból vagy gyúrva!',
        done: 'Ezt én sem csináltam volna jobban. Na jó, talán egy kicsit. De tényleg csak egy kicsit!' },
      { id: 'ew_fuves', type: 'eliteWin', giver: 'fuves', title: 'Dühfű a teába',
        text: 'Ahol elit őrző tanyázik, ott mindig nő egy furcsa fű, a dühfű. Abból lesz a legjobb erősítő tea. Győzz le {n} elit őrzőt, és hozz nekem belőle egy marékkal!',
        done: 'Micsoda illat! Ebből fél télre jut tea az egész tábornak. Az első bögre a tiéd, akkor is, ha keserű.' },
      { id: 'ew_novicius', type: 'eliteWin', giver: 'novicius', title: 'Csendesítsd le őket!',
        text: 'A főpapnő szerint a dühös elit őrzőket nem gyűlölni kell, hanem lecsendesíteni. Néha csak úgy megy, ha legyőzzük őket. Legyőznél helyettem {n} elit őrzőt? Én nem merek.',
        done: 'Gyújtottam egy gyertyát az őrzőért. Meg egyet érted is, biztos, ami biztos.' },

      // ---------- Nehéz kalandok ----------
      { id: 'hw_fogados', type: 'hardWin', giver: 'fogados', title: 'Egy hordó sör a tét',
        text: 'A törzsvendégeim fogadást kötöttek, hogy nem bírsz el a Nehéz kalandokkal. Én egy hordó sört tettem rád. Teljesíts {n} Nehéz kalandot, és ne hozz szégyent rám!',
        done: 'Megnyertem a hordót! A felét a tiszteletedre csapolom meg, a másik felét meg eldugom a fiúk elől.' },
      { id: 'hw_kalmar', type: 'hardWin', giver: 'kalmar', title: 'Biztos befektetés',
        text: 'Én csak biztos dologba fektetek, és úgy látom, te biztos befektetés vagy. Teljesíts {n} Nehéz kalandot, és nem leszek szűkmarkú.',
        done: 'Megérte, nem is vártam mást! Ez volt a hét legjobb üzletem, és még árulnom sem kellett hozzá semmit.' },
      { id: 'hw_kapitany', type: 'hardWin', giver: 'kapitany', title: 'Próbatétel',
        text: 'Az én kapitányom minden újoncot a legnehezebb útra küldött. Aki visszajött, az kapott kardot. Teljesíts {n} Nehéz kalandot, aztán beszélünk.',
        done: 'Visszajöttél, és még csak nem is sántítasz. Én annak idején ezt nem mondhattam el magamról. Szép munka.' },

      // ---------- harc a tisztásokon ----------
      { id: 'cf_kapitany', type: 'clearFight', giver: 'kapitany', title: 'Bemelegítés',
        text: 'A nagy csatákról mindenki beszél, pedig az ember az apró csetepatékból tanul. Nyerj meg {n} harcot a tisztásokon, hadd lássam, hogy áll a kezedben a kard!',
        done: 'Ez az, kezd beállni a kezed. Még néhány ilyen hét, és még én is félni fogok tőled.' },
      { id: 'cf_fuves', type: 'clearFight', giver: 'fuves', title: 'Nyugalom a kamillásban',
        text: 'A tisztásokon nő a legszebb kamilla, csak hát ott mindig ólálkodik valami. Nyerj meg {n} harcot a tisztásokon, hogy végre nyugodtan szedhessem!',
        done: 'Tegnap végre teli kosárral jöttem haza! Egyetlen szörny sem mutatkozott. Úgy látszik, híre ment, ki jár arra.' },
      { id: 'cf_kalmar', type: 'clearFight', giver: 'kalmar', title: 'Szabad utat a szekérnek!',
        text: 'A tisztásokon át szoktam levágni az utat a szekérrel, de mostanában mindig rám ugrik ott valami. Nyerj meg {n} harcot a tisztásokon, hogy újra arra mehessek!',
        done: 'Két nappal hamarabb értem be a vásárba, és mindent eladtam! Ebből neked is jár a részed.' },

      // ---------- kutatás a tisztásokon ----------
      { id: 'so_terkepesz', type: 'searchOk', giver: 'terkepesz', title: 'Mi van a bokor mögött?',
        text: 'A jó térképen az is rajta van, hol mit rejt a bozót. Kutass a tisztásokon, és ha {n} kutatásod is sikerrel jár, mondd el, mit hol találtál!',
        done: 'Mindet bejelöltem egy kis kereszttel. Most már az én térképemmel is lehet kincset keresni!' },
      { id: 'so_kalmar', type: 'searchOk', giver: 'kalmar', title: 'Elgurult portéka',
        text: 'Tavaly felborult a szekerem, és a portékám szanaszét gurult a tisztásokon. Kutass ott egy kicsit! Ha {n} kutatásod is sikerrel jár, talán az én ládáim is előkerülnek.',
        done: 'Ez az én ládám! Na jó, nem biztos, de mostantól az enyém. A jutalmad persze jár.' },
      { id: 'so_fuves', type: 'searchOk', giver: 'fuves', title: 'Gyökerek és gumók',
        text: 'A bokrok alá hasalni már nem nekem való, pedig ott nő a legjobb gyökér. Kutass a tisztásokon, és ha {n} kutatásod is sikerrel jár, hozd el, amit találtál!',
        done: 'Ez bizony mandragóra, és nem is sikított! Ügyes kezed van, akár füvesnek is beállhatnál.' },

      // ---------- szentélyek ----------
      { id: 'sh_novicius', type: 'shrine', giver: 'novicius', title: 'A szentélyek jegyzéke',
        text: 'A főpapnő rám bízta, hogy írjam össze a vadon szentélyeit. Csak hát én még a saját sátramhoz menet is eltévedek. Térj be helyettem {n} szentélybe!',
        done: 'Beírtam a nagykönyvbe. A főpapnő azt hiszi, én jártam ott, úgyhogy a nevedet kihagytam. Ugye nem árulsz el?' },
      { id: 'sh_fuves', type: 'shrine', giver: 'fuves', title: 'Ami az oltár mellett nő',
        text: 'A szentélyek körül másképp nőnek a füvek, mintha valaki vigyázna rájuk. Térj be {n} szentélybe, és mondd el, mi nő körülötte!',
        done: 'Ha jól értem, kakukkfű nő az oltár mellett. Akkor már tudom, hová megyek tavasszal.' },
      { id: 'sh_fogados', type: 'shrine', giver: 'fogados', title: 'Áldás a fogadóra',
        text: 'Az uram szerint a fogadónak nem áldás kell, hanem tűzifa. Én azért egy kis szerencsének is örülnék. Térj be {n} szentélybe, és kérj áldást ránk is!',
        done: 'Azóta nem savanyodott meg a bor, és a kémény sem füstöl. Az uram mondhat, amit akar.' },

      // ---------- vándorárusok ----------
      { id: 've_kalmar', type: 'vendor', giver: 'kalmar', title: 'Kémkedés a konkurenciánál',
        text: 'A tisztásokon vándorárusok járnak, és azt beszélik, olcsóbbak nálam. Ezt erősen kétlem. Vásárolj valamit {n} vándorárustól, és mondd el, mit árul!',
        done: 'Mit nem mondasz, holdfény üvegben? Ezt én is árulni fogom. Drágábban, de szebb üvegben.' },
      { id: 've_fogados', type: 'vendor', giver: 'fogados', title: 'A titkos fűszer',
        text: 'Egyszer egy vándorárustól vettem egy fűszert, attól lett híres a gulyásom. Azóta se láttam sehol. Vegyél valamit {n} vándorárustól, hátha nála akad belőle!',
        done: 'Ez az, pontosan ez az illat! Ma este olyan gulyás lesz, hogy a hold is lejön megkóstolni.' },
      { id: 've_terkepesz', type: 'vendor', giver: 'terkepesz', title: 'Az árusok titkos ösvényei',
        text: 'A vándorárusok ismerik a legrövidebb utakat, csak sosem árulják el. Vegyél valamit {n} vándorárustól, és közben lesd meg, merről jött!',
        done: 'Szóval van egy ösvény a nádas mögött! Negyven éve keresem. Az árusok morogni fognak, de hát ez a tudomány.' },

      // ---------- talányok ----------
      { id: 'ri_novicius', type: 'riddle', giver: 'novicius', title: 'Puska a vizsgára',
        text: 'A szentélyi vizsgán rejtvényeket adnak fel, és én egyet sem tudok megfejteni. Válaszolj {n} rejtvényre a tisztásokon, aztán súgd meg, mi volt a megfejtés!',
        done: 'Megjegyeztem! Vagyis felírtam a kezemre. Remélem, a vizsga előtt nem kell kezet mosni.' },
      { id: 'ri_terkepesz', type: 'riddle', giver: 'terkepesz', title: 'A rejtvények ösvénye',
        text: 'A vadonban furcsa alakok adnak fel rejtvényeket, és aki felel nekik, annak megmutatják az utat. Válaszolj {n} rejtvényre, én meg lejegyzem, merre mutatnak.',
        done: 'Így már megvan egy ösvény, ami egyik térképen sincs rajta. Rögtön be is rajzolom!' },
      { id: 'ri_fogados', type: 'riddle', giver: 'fogados', title: 'Fejtörő a pultnál',
        text: 'Csütörtökönként fejtörőket adok fel a vendégeknek, de kifogytam a kérdésekből. Válaszolj {n} rejtvényre odakint, aztán mondd el nekem is, mit kérdeztek!',
        done: 'A fiúk egész este a fejüket vakarták, a fogadó meg dugig volt. Jövő héten is számítok rád!' },

      // ---------- Holdtorony ----------
      { id: 'tw_novicius', type: 'towerWin', giver: 'novicius', title: 'Közelebb a holdhoz',
        text: 'A szentélyben azt tanítják, hogy minden lépcsőfok közelebb visz a holdhoz. Juss feljebb {n} emelettel a Holdtoronyban, és mondd meg, igaz-e!',
        done: 'Szóval tényleg közelebb visz, csak közben kifullad az ember. Ezt majd odaírom a tanítás alá, apró betűvel.' },
      { id: 'tw_terkepesz', type: 'towerWin', giver: 'terkepesz', title: 'A torony alaprajza',
        text: 'Mindenhová eljutok, csak a Holdtorony tetejére nem: a harmadik emeleten mindig elszédülök. Juss feljebb {n} emelettel helyettem, és mondd el, mit láttál!',
        done: 'Ez a rajz mindent visz! A lépcső kicsit ferdére sikerült, de az a te leírásod hibája.' },
      { id: 'tw_kapitany', type: 'towerWin', giver: 'kapitany', title: 'Bírod szusszal?',
        text: 'Az őrségben minden reggel háromszor futottunk fel a bástyára, de a Holdtorony annál is magasabb. Harcold ki, hogy {n} emelettel feljebb juss! A gyors mászás nem ér.',
        done: 'Még csak nem is lihegsz? Akkor jól csináltad. Én a felénél már a lépcsőn ültem volna.' },

      // ---------- Aréna ----------
      { id: 'ar_kalmar', type: 'arenaWin', giver: 'kalmar', title: 'Fogadás a párbajokra',
        text: 'A párbajokra az egész tábor fogad, és szeretném, ha végre egyszer én nyernék. Nyerj meg {n} párbajt az Arénában, a többit bízd rám!',
        done: 'Ez gyönyörű volt! Enyém a kassza, tiéd a dicsőség. Na jó, a kasszából is kapsz egy részt.' },
      { id: 'ar_novicius', type: 'arenaWin', giver: 'novicius', title: 'Tisztességes küzdelem',
        text: 'A szentély tanítása szerint a tisztességes küzdelem is ima. Én ehhez túl ügyetlen vagyok, te viszont nem. Nyerj meg {n} párbajt az Arénában!',
        done: 'Láttam a lelátóról! Úgy szurkoltam, hogy elejtettem az imakönyvemet, és valaki ráült. Megérte.' },
      { id: 'ar_fuves', type: 'arenaWin', giver: 'fuves', title: 'Kenőcs a vesztesnek',
        text: 'Új zúzódáskenőcsöt kevertem, csak nincs kin kipróbálni. Nyerj meg {n} párbajt az Arénában, és küldd hozzám, akit legyőztél!',
        done: 'Bekentem őket, és már csak egy kicsit lilák. Szerintem működik. Ők szerint büdös.' }
    ],

    lore: {
      // ---------- Ködláp ----------
      'Mocsári lidérc': 'Kék fényecske, amely mindig rövidebb utat ígér. A rövidebb út mindig a mocsárba vezet. Aki kifordítja a ruháját, azt nem tudja tévútra csalni.',
      'Iszapmanó': 'Térdig érő sármanó, aki a lápba ragadt csizmákat gyűjti. Mindig csak a bal csizmát viszi el, a jobbat udvariasan otthagyja.',
      'Ködpók': 'A hálóját ködből szövi, ezért éjjel senki sem látja. Reggelre viszont mindenki benne van. A lápiak szerint a harmatos hálójából jósolni is lehet.',
      'Nádi farkas': 'Sovány, nádszínű farkas, amely hason csúszva lopakodik a sásban. Ha megzörren a nád, de nem fúj a szél, jobb visszafordulni.',
      'Öreg Brekus, a lápkirály': 'A láp önjelölt királya, nádkoronával. Uralkodni ritkán szokott, inkább pislog és brekeg. Ha legyőzik, másnap újra megkoronázza magát.',
      'Ködanya': 'Arctalan asszony, akit a láp ködéből gyúrt össze az éjszaka. Ha mérges, megfagyaszt, ha jókedvű, betakar. Előre sosem lehet tudni, melyik lesz.',
      'Ezüstpikkelyű kígyó': 'A tó mélyén alszik, és csak holdfényes éjjeleken emelkedik ki. A levedlett bőrét oltáron őrzik a lápiak, és senki sem mer hozzányúlni.',
      'Gyékény néne': 'A nádas szélén szedi a gyógyfüveket, és nem szeret osztozni. A botja kemény, a teája jó. Aki az útjába áll, mindkettőből kap.',
      'Az Iszapóriás': 'Nappal sima sárdomb, éjjel a gázló őre. Esős napokon hízik, száraz nyáron sértődötten összemegy. A szaga messzebbre ér, mint a keze.',
      'Szipóka, a nagypióca': 'A Fekete-tó vénje, akkora, mint egy cipó. Ritkán eszik, de akkor alaposan. Nem rosszindulatú, csak éhes, és jóllakva rögtön elszunnyad.',

      // ---------- Holdfény-erdő ----------
      'Vándorló lidérc': 'Lámpást hordó lidérc, aki saját bevallása szerint csak sétálgat. Valójában az eltévedteket követi, és ha unatkozik, kísérteni kezd.',
      'Holdfarkas': 'Ezüstbundájú farkas, amelyet a hold fénye táplál. Teliholdkor énekel, újholdkor morog. A falka a holddal együtt erősödik és gyengül.',
      'Fenyőkobold': 'Gyantaszagú, tobozdobáló kis nép. Szerintük minden toboz kincs, ezért a kincses odvuk tele van tobozzal. Meg egy kevés ezüsttel.',
      'Éjbagoly-raj': 'Egy bagoly bölcs, száz bagoly lárma. A raj éjjelente zúgva söpör végig az erdőn, és mindent elvisz, ami csillog. Bubó letagadja, hogy rokonok.',
      'Ezüstszarvú kos': 'Holdkövön köszörüli a szarvát, attól ragyog ezüstösen. Beszélgetni nem szokott, csak öklelni. A tisztás túlsó végéről nekifut, és sosem fékez.',
      'A Fenyőkirálynő': 'Az erdő legöregebb fenyőjében lakik, tűlevélkoronát visel. Aki az erdő álmát zavarja, azt a gyökerei kitessékelik. A tisztességes harcost tiszteli.',
      'Holdvadász': 'Ezüstíjas, köpenyes vadász, aki napokig követi a prédáját, mielőtt megszólítja. Sosem téveszt célt. Ha mégis, akkor szándékosan.',
      'Tobozapó, a koboldok öregje': 'Fehér szakállú kobold, a kincses odú őre. Egész nap tobozt majszol, és ha kell, tobozzal dob. Azt mondják, még sosem tévesztette el a homlokot.',
      'A Holdtó Tündére': 'A Holdtó mélyén lakik, ezüst fátyolban. A vizéből csak az ihat, aki kiállja a próbát. Aki ivott, azt mondja: hideg és édes, mint a holdfény.',
      'Agancsos Szarvasbogár': 'Kutyányi bogár, harapófogóra emlékeztető agancsokkal. Egyetlen tölgy az övé, de azt az egész erdővel szemben is megvédi. Ha hanyatt esik, segíts neki.',

      // ---------- Árnyromok ----------
      'Árnyőr': 'A rég kihalt város őrségének árnyéka. Még mindig járőrözik, még mindig igazoltat, és még mindig nem tudja, hogy nincs kit megvédenie.',
      'Kőgólem': 'Egykor kapukat és hidakat építettek vele. A gazdái elmentek, a parancs maradt: őrizd a követ. Ezt teszi, kíméletlen alapossággal.',
      'Sikoltó szellem': 'Áttetsző alak, aki minden idegen láttán felsikolt. Senki sem tudja, ő ijed meg, vagy téged akar megijeszteni. Valószínűleg mindkettő.',
      'Rúnatolvaj': 'Fürge kis manó, aki lefeszegeti a falakról a világító rúnákat. A zsebében úgy zörögnek, mint a dió. Hogy mire kellenek neki, sosem árulja el.',
      'A Romok Kapuőre': 'Kőszobor a romváros kapujában. Mindenkitől jelszót kér, és szinte senki sem tudja. A jelszó egyébként „kérem”, de ezt nem tőlünk hallottad.',
      'Árnypap': 'Fekete csuhás pap, aki a ledőlt oltár előtt mormolja az imáit, és az árnyékok vele imádkoznak. Ha elhallgat, szétszaladnak, mint a megriadt macskák.',
      'Bukott lovag': 'Rozsdás páncélú lovag, aki hű maradt egy régi eskühöz, csak azt nem tudja már, kinek tette. Méltó ellenfélre vár, és tisztességesen harcol.',
      'Porszövő, a levéltár pókja': 'A régi levéltár pókja, nyolc lábbal lapozgatja a tekercseket. Ki nem állhatja, ha valaki behajtja a lapok sarkát. A port viszont sosem törli le.',
      'A Toronyvízköpő': 'Kőszörny az eresz alatt. Száraz időben alszik, esőben felébred. Egész évben gyűjti a vizet, hogy egyszerre zúdítsa a gyanútlanok nyakába.',
      'A Régi Éjjeliőr': 'Háromszáz éve halt meg a várossal együtt, de a szolgálatot nem hagyta abba. Lámpással járja az utcákat, és mindenkit hazazavar. Takarodó van!',

      // ---------- Csillaghullás-szirtek ----------
      'Csillagszilánk-elementál': 'A lehullott csillag szilánkjaiból összeállt lény. Zümmög, szikrázik, és nem tűri, ha valaki a kráter közelébe megy. A darabjai évekig világítanak.',
      'Szirti griff': 'A szél hátán vadászó griff, a szirtek peremén fészkel. A Griffkirály alattvalója, és ezt minden csőrcsattogásával a tudtodra adja.',
      'Kristálybogár': 'Kristálypáncélos bogár, a hátán minden irányba másképp törik meg a holdfény. Ha ezrével vonulnak, szivárványban úszik a szirt. Egyenként harapnak.',
      'Hullócsillag-szellem': 'Egy lehullott csillag apró, eltévedt fénye. Vissza szeretne jutni az égre, és nagyon mérges, hogy nem megy. Aki útjába áll, azt megperzseli.',
      'A Lehullott Csillag Őre': 'Fénylő páncélos alak a kráter szélén. Azt mondják, a csillag maga teremtette, hogy vigyázzon rá. A fényéhez csak azt engedi, akit méltónak tart.',
      'Kristálysárkány-fióka': 'Kutyányi sárkány, csilingel, ha mozog. Csillagkristályt eszik, és amíg kicsi, inkább szikrát fúj. Ha hanyatt fekszik, vagy feladja, vagy vakarást kér.',
      'Griffkirály': 'Aranytollú griff, a szirtek ura. Viharban a legerősebb, a szárnycsapása köveket sodor. Nem hajol meg akárki előtt, de a méltó ellenfélnek biccent.',
      'Szikladöngető Kos': 'Egész nap sziklákat döngöl, csak úgy, magának. Hogy miért, azt ő sem tudja. Minden látogatónak örül, mert a látogató puhább, mint a szikla.',
      'A Kráter Remetéje': 'Rongyos köpenyű öreg, aki harminc éve ül a kráter peremén, és a csillagot őrzi. Azt mondja, még nem ébredt fel. Hogy kire vár, nem árulja el.',
      'Csillagtüzes Hiúz': 'A bundájába ragadt csillagpor szikrázik, ahogy lopakodik. Villámgyors, és sokszor csak játszik. Ha megböki a tarkódat, akkor éppen játszott.',

      // ---------- Éjkatlan ----------
      'Éjszövő': 'Óriáspók, amely a sötétségből sző hálót. Ahol dolgozik, ott a fáklya is halványabban ég. Azt beszélik, minden szála egy elfelejtett éjszakából készül.',
      'Sötét lovas': 'Lángsörényű lidércló hátán vágtató páncélos alak. Senki sem látott még a sisakja alá, és aki megpróbálta, többé nem is akarja. A lova nem hagy nyomot.',
      'Üresség-vándor': 'Valaha ember volt, aki túl sokáig maradt a katlanban, és elfelejtette a nevét. Céltalanul bolyong. Ha kérdez valamit, érdemes válaszolni neki.',
      'Holdfaló féreg': 'Járatokat fúr a katlan alatt, és lenyel mindent, ami fényes, az érméktől a csillagporig. Ha hullámzik a talaj, éppen alattad jár.',
      'Az Éjkatlan Ura': 'Trónon ül a katlan mélyén, és a köpenye maga az éjszaka. Ha felnéz, kialszanak a csillagok. Ritkán áll fel, de akkor az egész katlan elcsendesedik.',
      'Fekete Holdpap': 'Sötét holdat emel a fekete oltár fölé, és háromnapos imákkal táplálja. Ha a hold eltörik, egy pillanatra ezüst fény önti el a katlant.',
      'Az Utolsó Árnyék': 'Ő az a pillanat, amikor a saját árnyékod már nem követ. Pontosan úgy harcol, mint te, csak sötétebben. Ha legyőzöd, csendben visszasimul a lábad elé.',
      'Éjfél Bajnoka': 'Fekete páncélos lovag a katlan hídján. Évszázadok óta őrzi az átkelőt, és mindenkinek azt mondja: még nem. Éjfélkor a sötét beköltözik a páncéljába.',
      'Obszidiánóriás': 'Fekete, üvegfényű kőből faragott őr, a katlan falából lép elő, és csilingelnek a szilánkjai. Aki megfaragta, rég eltűnt, a parancsot viszont itt hagyta.',
      'Szurokszárnyú sárkány': 'Szurokfekete szárnyú sárkány, a katlan peremén fészkel. Tüzet fúj, és nem érti a tréfát. Ha a tojását őrzi, akkor még annyira sem.',

      // ---------- a történet bosszai ----------
      'A Lámpaoltó Varangy': 'Szénásszekérnyi varangy a Ködlápon, amely lámpásokat nyel le, ezért azóta világít a böfögése. A lápiak éjszakára elrejtik előle a mécseseiket.',
      'A Vándor Ködkutyája': 'Borjúnyi kutya, amelyet a köd formált meg. Nem ugat, csak morog, és minden morgásnál köd száll ki a pofájából. A gazdája hagyta itt őrnek.',
      'Fakószőrű Ordas': 'Egykor ezüstbundájú falkavezér volt a Holdfény-erdőben. Ahogy fogyott a hold, a bundája hamuszínűre fakult, a szemében csak düh maradt.',
      'Gyantaszívű Öregfenyő': 'Ötszáz éve áll a Holdfény-erdőben, és sosem bántott senkit. Most valami fáj neki a kérge alatt, ezért csapkod. Nem gonosz, csak hangosan kér segítséget.',
      'A Harangkongató Kísértet': 'Csontsovány szellem, aki az Árnyromok harangkötelén csüng, és vigyorogva rángatja. Fizetségért dolgozik, de hogy kinek, arról hallgat.',
      'Tükörszülött Árny': 'Tükörből lépett elő, és olyan, mint aki belenézett, csak sötétebb és magabiztosabb. Valahogy mindig a te fegyvered van nála.',
      'Viharszárnyú Griffanya': 'A szirtek legnagyobb griffje, a szárnya a holdat is eltakarja. Nem gonosz, csak anya, és a fészke közelében minden idegenben veszélyt lát.',
      'Az Ébredő Csillagláng': 'Fehéren izzó, arctalan alak, amely a kráter mélyéről emelkedik ki. Mindig azt választja ellenfélnek, aki a legközelebb áll hozzá. Érdemes nem ott állni.',
      'A Feneketlen Éhség': 'Az Éjkatlan mélyén lakik. Alakja nincs, csak étvágya: ahol megmozdul, kialszik a fény, a hang, még a gondolat is. Senki sem tudja, mióta éhes.',
      'A Fekete Hold': 'A holdfogyatkozás árnyéka, amely testet öltött, és nem hajlandó eltűnni, amikor a hold visszatér. Régóta éhezik, és ezt nem is titkolja.',

      // ---------- heti szörnyek ----------
      'A Fenevad': 'Tüskés hátú, szarvas szörnyeteg a Holdfény-erdő legsötétebb zugából. Hetente előjön, és ilyenkor az egész tábornak együtt kell visszazavarnia.',
      'Ködkirálynő': 'Ködanya jóval mogorvább nővére, a Ködláp jeges úrnője. Ha megérkezik, a köd dérré fagy, és a békák is elhallgatnak. Egyedül még senki sem bírt vele.',
      'A Holdfaló': 'A holdfaló férgek ősanyja vagy ősapja, ezt még senki sem merte megnézni. Ha a katlan alatt megfordul, remeg az egész Éjkatlan. Állítólag a holdba is beleharapott.',
      'Árnyékcsőr': 'Fekete tollú griff, a romváros tornyain fészkel, és árnyékokkal táplálkozik. Ahol elrepül, ott egy pillanatra minden árnyék eltűnik a földről.',
      'A Hamuszarvú': 'Hamuszürke kos a Csillaghullás-szirtekről. A szarva megperzselődött, amikor lehullott a csillag, és azóta is parázslik. Ahol öklel, ott hamu hull.',
      'Csillagrém': 'Lila fényben izzó kristályszörny, a lehullott csillag legrosszabb álma. Zúgva járja a szirteket, és mindent szilánkokra tör, ami az útjába kerül.',
      'A Mocsárkirály': 'Öreg Brekus szerint a láp királya ő maga. A Mocsárkirály szerint Brekus legfeljebb a helyettese. A vitát senki sem meri eldönteni, főleg nem a közelükben.',
      'Éjanya': 'Óriáspók az Éjkatlan mélyén, minden éjszövő anyja. A hátán hordja a petéit, és ha valaki közelít, az egész fészekalj vele együtt harcol.'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

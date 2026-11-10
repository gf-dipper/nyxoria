(function (root) {
  var D = root.NYX.data;
  D.ADVENTURE = {
    intros: {
      any: [
        'Kiérsz a fák közül egy kerek tisztásra. Három dolog néz vissza rád, és mindegyik azt súgja: „Engem válassz!”',
        'A hold épp kibújik a felhők mögül, és három helyre világít rá. Mintha direkt mutatná, merre érdemes menni.',
        'Leülsz egy tönkre kifújni magad. Mire felnézel, három dolog is történik körülötted. Ennyit a pihenésről.',
        'A fáklyád lángja megremeg. Három irányból is hívogat valami: egy nesz, egy csillogás és egy furcsa illat.',
        'Egy öreg útjelző kőhöz érsz. A felirata szerint: „Erre is, arra is, amarra is.” Hát, ez sokat segít.',
        'Kis tisztás, nagy csend. Túl nagy csend. Aztán egyszerre három helyről is megmozdul valami.'
      ],
      kodlap: [
        'A köd itt bokáig ér, a nád suttog. A pára három helyen ritkul meg, mintha meg akarna mutatni valamit.',
        'Egy korhadt pallóhoz érsz. Balra bugyog a víz, jobbra lámpás dereng, előtted pedig valaki horkol a nádasban.',
        'A láp békái egyszerre elhallgatnak. Ilyenkor érdemes körülnézni. Három dolgot is látsz, ami eddig nem volt itt.',
        'Végre szilárd talaj! A kis zsombékszigeten három dolog vár rád, a csizmád viszont tele van vízzel.'
      ],
      holdfeny: [
        'Ezüstös fény szűrődik át a lombokon. A tisztáson három fénynyaláb ér földet, mindegyik máshol.',
        'Puha a talaj, gyantaillat lebeg. Valahol bagoly huhog, valahol csengettyű szól, valahol valaki dudorászik.',
        'Holdfényben fürdő rétre érsz. Szentjánosbogarak rajzanak három kupacban, mintha útjelzők volnának.',
        'A fenyők olyan magasak, hogy a hold csak résnyire lát be közéjük. Ebben a résben három dologon is megakad a szemed.'
      ],
      arnyromok: [
        'Ledőlt oszlopok között jársz. A kövek hidegek, az árnyékok hosszabbak a kelleténél. Három dolog vonja magára a figyelmedet.',
        'Beomlott csarnokba érsz. Fent hiányzik a tető, lent a padló fele. A kettő között azért akad pár érdekesség.',
        'Rúnák gyúlnak fel a falon, aztán kialszanak. Három helyen viszont tovább világítanak. Ez biztosan jelent valamit.',
        'A romok közt visszhangzik a lépted. Háromszor, pedig csak egyet léptél. Mindhárom visszhang máshonnan jön.'
      ],
      szirtek: [
        'Fent süvít a szél, lent szikrázik a tenger. Köztük egy keskeny párkány, rajta három különös dolog.',
        'Egy hullócsillag húz el a fejed fölött, és valahol a közelben csapódik be. Füst, csillogás és furcsa zümmögés.',
        'A kristályok zenélnek a szélben. Ahogy körülnézel, három helyen is megcsillan valami.',
        'Széles sziklapadra érsz. A kilátás lélegzetelállító, de most fontosabb az a három dolog, ami a lábad előtt van.'
      ],
      ejkatlan: [
        'Itt még a sötétnek is van árnyéka. A fáklyád fénye három dolgot ragad ki a feketeségből.',
        'A föld langyos, mintha alattad lélegezne valami. Három halvány fény pislákol, és mind téged figyel.',
        'Fekete hamu ropog a talpad alatt. Előtted három út, egyik sem barátságos. Na de melyik a legkevésbé?',
        'A hold innen csak egy vékony ezüstkarcolás az égen. Alatta három dolog dereng, mintha rád várna.'
      ]
    },

    searches: {
      any: [
        { title: 'Rókalyuk', text: 'A róka nincs itthon. A lyuka viszont tele van mindenféle holmival, amit ő kincsnek gondol.' },
        { title: 'Ágra akasztott batyu', text: 'A gazdája vagy visszajön érte, vagy már rég elfelejtette. Inkább az utóbbi.' },
        { title: 'Odvas fa', text: 'Az odúban zörög valami. Remélhetőleg dió. Remélhetőleg nem harap.' },
        { title: 'Gondos kőrakás', text: 'Valaki szépen egymásra rakta a köveket. Ilyet csak az csinál, aki meg akar jelölni valamit.' },
        { title: 'Felborult kosár', text: 'Gomba, bogyó és egy elgurult, gyanúsan fényes golyó. A gombát inkább hagyd.' },
        { title: 'Gyökerek ölelése', text: 'A fa gyökerei körbefonnak egy ládikát. Mintha vigyáznának rá. Vagy nem akarnák visszaadni.' }
      ],
      kodlap: [
        { title: 'Iszapba ragadt láda', text: 'Csak a sarka áll ki a sárból. Ha jó erősen húzod, talán kijön. Vagy te mész be.' },
        { title: 'Cölöpös halászkunyhó', text: 'Bent hálók, horgok és egy furcsán nehéz bögre. A halász rég nem járt erre.' },
        { title: 'Nádas rejtek', text: 'Valaki kitaposott magának egy kis fészket a nádban. Elég kényelmes, és nem is üres.' },
        { title: 'Elsüllyedt harang', text: 'A víz alól egy harang teteje kandikál ki. Ki tudja, mi lapul alatta.' }
      ],
      holdfeny: [
        { title: 'Bagolyodú', text: 'A gazdája vadászni ment. A fészek alján csillog valami, amit egy bagoly sem tud megenni.' },
        { title: 'Ezüstpáfrányos', text: 'A páfrányok levele ezüstös. Alattuk toboz, avar, és talán valami értékesebb is.' },
        { title: 'Rozoga vadászles', text: 'A létrája nyikorog, de fent senki sincs. Csak egy ottfelejtett tarisznya.' },
        { title: 'Tündérkör', text: 'Gombák kerek körben. Középen lelapult a fű, mintha valaki épp most táncolt volna ott.' }
      ],
      arnyromok: [
        { title: 'Beomlott kripta', text: 'A fedőlap félrecsúszott. Bent por, pókháló és egy gondosan becsomagolt valami.' },
        { title: 'Rúnás ládika', text: 'A rúnák elhalványultak, a zár viszont még mindig makacs. Ez jó jel.' },
        { title: 'Ledőlt szobor', text: 'A szobor feje leesett, a nyakában pedig egy rejtett rekesz tátong.' },
        { title: 'Poros könyvtárszoba', text: 'A könyvek nagy része porrá lett. A maradék között még lapulhat valami hasznos.' }
      ],
      szirtek: [
        { title: 'Friss kráter', text: 'A kráter alján még izzik a kő. Körülötte apró, csillogó szilánkok hevernek.' },
        { title: 'Elhagyott griffészek', text: 'Ágakból, csontokból és egy szakadt nyeregből épült. A griffeknek fura az ízlésük.' },
        { title: 'Kristálybarlang', text: 'A falon kristályok nőnek. Némelyik annyira laza, hogy szinte kínálja magát.' },
        { title: 'Remetelak a sziklában', text: 'Egy remete lakott itt valaha. A falba vájt polcokon még maradt néhány üvegcse.' }
      ],
      ejkatlan: [
        { title: 'Kihűlt üst', text: 'Hatalmas üst. Az alján odaszáradt valami, ami egykor nagyon fontos lehetett.' },
        { title: 'Lépcső a sötétbe', text: 'Hét lépcsőfok lefelé, utána csak sötét. Az első fokokon valaki otthagyott valamit.' },
        { title: 'Fekete obeliszk', text: 'Az obeliszk tövében áldozati tálak. A legtöbb üres, de nem mind.' },
        { title: 'Megkövült vándor', text: 'Kőszobor, de nagyon olyan, mintha élt volna. A tarisznyája viszont még valódi.' }
      ]
    },

    events: [
      // ===================== BÁRHOL =====================
      { id: 'any_gazdatlan_lampas', region: 'any', kind: 'esemeny', title: 'A gazdátlan lámpás',
        text: 'Egy viharlámpa ugrál az ösvényen, magától. Néha megáll, és visszanéz rád. Mármint visszanézne, ha lenne szeme.',
        options: [
          { label: 'Követem', result: 'A lámpás egy odvas fához vezet, aztán kialszik. Az odúban valaki régi megtakarítása lapul.', effect: 'silver' },
          { label: 'Elkapom', check: { stat: 'fur', base: 0.6 },
            result: 'Sikerül! A lámpás megadóan pislákol a kezedben, aztán csillagport szór rád.', effect: 'dust',
            fail: { result: 'A lámpás kicsúszik a kezedből, te pedig hasra esel a mohában. Ő közben vidáman elugrál.', effect: 'hurt' } },
          { label: 'Megkérdezem, hová siet', needs: { trait: 'kivancsi' },
            result: 'Kiderül, hogy a gazdáját keresi. Elmeséli, merre járt eddig, és közben rengeteget megtudsz a környékről.', effect: 'xp', amount: 1.5 }
        ] },

      { id: 'any_szoszatyar_ko', region: 'any', kind: 'esemeny', title: 'A szószátyár kő',
        text: 'Egy út menti kő megszólít, és azóta sem hallgat el. Háromszáz éve senki sem állt meg mellette, úgyhogy van mit bepótolnia.',
        options: [
          { label: 'Végighallgatom', result: 'Két órán át mesél. A fele unalmas, a másik felében viszont hasznos titkok vannak a környék szörnyeiről.', effect: 'xp' },
          { label: 'Közben arrébb gurítom', result: 'A kő észre sem veszi, annyira belemerült a mesélésbe. Alatta egy kis üreg, benne csillagpor.', effect: 'dust' },
          { label: 'Rámordulok, hogy elég', needs: { trait: 'mogorva' },
            result: 'A kő döbbenten elhallgat. Végre valaki, aki kimondja, amit gondol! Tiszteletből elárulja, hová rejtették a vándorok a pénzüket.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_holdtukor_kut', region: 'any', kind: 'szentely', title: 'A holdtükör kútja',
        text: 'Kerek kis kút a fűben, a vize mozdulatlan, mint a tükör. Nem az arcodat mutatja, hanem a holdat, pedig az most felhő mögött van.',
        options: [
          { label: 'Iszom a vizéből', result: 'Hideg és édes. A fáradtság lassan kiszivárog a tagjaidból.', effect: 'heal' },
          { label: 'Beledobok egy érmét', result: 'Az érme nem csobban, egyszerűen elnyeli a fény. Cserébe egy kevés belőle a karodba költözik.', effect: 'blessing' },
          { label: 'Elmondom a holdköszöntőt', needs: { origin: 'templom' },
            result: 'A templomban ezerszer elmondtad. Most először felel is rá valaki: a víz felragyog, és te is vele ragyogsz.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'any_korhado_pallo', region: 'any', kind: 'csapda', title: 'A korhadó palló',
        text: 'Egy patak fölött vékony, korhadt palló vezet át. Már attól recseg, hogy ránézel.',
        options: [
          { label: 'Átszaladok rajta', check: { stat: 'fur', base: 0.6 },
            result: 'Mire a palló beszakad, te már a túlparton vagy. A deszkák közül kiesik egy régi erszény.', effect: 'silver',
            fail: { result: 'Félúton beszakad alattad. A patak hideg, a köveken ráadásul jól beütöd a térdedet.', effect: 'hurt' } },
          { label: 'Lejjebb átgázolok', result: 'Lassú és vizes, de biztonságos. A mederben pár csillagporos kavics csillan meg.', effect: 'dust', amount: 0.5 },
          { label: 'Megkeresem a rejtett gázlót', needs: { origin: 'csempesz' },
            result: 'Ahol csempészek járnak, ott mindig van titkos gázló. Itt is akad, és valaki a rakománya egy részét is ottfelejtette.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_fekete_ko', region: 'any', kind: 'csapda', title: 'A fekete kő',
        text: 'Egy sötét tavacskán lapos kövek vezetnek át. Mind szürke, csak a középső fekete. És persze pont arra kellene lépni.',
        options: [
          { label: 'Végigugrálok rajtuk', check: { stat: 'fur', base: 0.6 },
            result: 'Kőről kőre szökkensz, mint egy kecske. A túlparton egy marék csillagpor vár, mintha jutalom volna.', effect: 'dust',
            fail: { result: 'A fekete kő megbillen, és derékig merülsz. A tó nem mély, csak nagyon hideg. És a kövek élesek.', effect: 'hurt' } },
          { label: 'Megkerülöm a tavat', result: 'Egy órába telik, de legalább száraz maradsz. Útközben szedsz egy marék erdei szamócát.', effect: 'heal', amount: 0.5 },
          { label: 'Fekete kőre nem lépek!', needs: { trait: 'babonas' },
            result: 'Átugrod, pedig nagy a táv. Kiderül, hogy ez volt az egyetlen billegő kő. A túlparton még egy erszény is vár. Mindig tudtad.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_teazo_mano', region: 'any', kind: 'arus', title: 'A teázó manó',
        text: 'Egy gyökér alatt pici teázó működik. A gazdája, egy apró manó, csészéket törölget, és már tölt is. „Ez nem ingyen van ám!”',
        options: [
          { label: 'Kérek egy kamillát', cost: 0.5, result: 'Forró, illatos, és meglepően sok fér abba a pici csészébe. Jobban leszel tőle.', effect: 'heal' },
          { label: 'A ház különlegességét kérem', cost: 1, result: 'Fogalmad sincs, mi volt benne, de a karod most erősebbnek tűnik. A manó sokatmondóan kacsint.', effect: 'blessing' },
          { label: 'Köszönöm, majd máskor', result: 'A manó vállat von, de azért ad egy kockacukrot az útra. Ingyen. Csak most az egyszer.', effect: 'heal', amount: 0.5 },
          { label: 'Kifizetem a következő vendég teáját', cost: 1, needs: { trait: 'joszivu' },
            result: 'A manó meghatódik, és egy zacskó csillagporos cukrot nyom a kezedbe. „Ilyen vendég ritkán jön” – mondja, és megtörli a szemét.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_terkeparus', region: 'any', kind: 'arus', title: 'A térképárus',
        text: 'Egy öregúr térképeket árul egy tönkön. „Mind pontos!” – bizonygatja. Az egyiken a hold a térkép közepén van.',
        options: [
          { label: 'Veszek egy térképet', cost: 0.5, result: 'Meglepő módon tényleg pontos. Egy csomó ösvényt és rejtekhelyet ismersz meg belőle.', effect: 'xp' },
          { label: 'Kincses térképet kérek', cost: 1.5, result: 'Az X tényleg ott van, ahol a térkép mutatja. Alatta egy kis láda csillagpor.', effect: 'dust', amount: 1.5 },
          { label: 'Kösz, eltévedek magamtól is', result: 'Az öreg nevet, és ad egy szem csillagport a szerencse kedvéért. „Ha eltévedsz, menj a hold felé.”', effect: 'dust', amount: 0.5 },
          { label: 'Szólok, hogy rossz a csillagállás', needs: { origin: 'tanonc' },
            result: 'Az öreg elsápad, aztán hálásan javítgat. A helyes égboltért busásan megfizet. Térképet persze nem kérsz tőle.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_kerdezo_varju', region: 'any', kind: 'rejtveny', title: 'A kérdező varjú',
        text: 'Egy varjú ül az utat elzáró rúdon. „Csak az mehet tovább, aki megmondja: mi az, ami a tiéd, mégis mások használják gyakrabban?”',
        options: [
          { label: '„A nevem”', result: 'A varjú elégedetten károg, felbillenti a rudat, és egy fényes gombot dob utánad. Csillagporból van.', effect: 'dust' },
          { label: '„A kardom”', result: 'A varjú hosszan néz. „Akkor jobban kéne vigyáznod rá.” Végül átenged, de láthatóan csalódott.', effect: 'none' },
          { label: '„A tarisznyám”', result: '„Akkor rossz helyen hordod” – károgja a varjú. Végül átenged, mert ráunt a vitára.', effect: 'none' }
        ] },

      { id: 'any_csillageso', region: 'any', kind: 'arany', title: 'Csillageső',
        text: 'A tisztás fölött megnyílik az ég, és apró csillagok kezdenek hullani, puhán, mint a hó. Ahol földet érnek, ezüstösen világít a fű.',
        options: [
          { label: 'Elkapok egyet', result: 'A csillag meleg, és dorombol, mint egy macska. Aztán finom porrá omlik a tenyeredben. Rengeteg porrá.', effect: 'dust', amount: 2 },
          { label: 'Kívánok valamit', result: 'Nem mondod ki hangosan, úgy nem teljesülne. A karodba áramló erő viszont elárulja, hogy valaki így is meghallotta.', effect: 'blessing', amount: 2 },
          { label: 'Csak nézem', result: 'Leülsz a fűbe, és nézed, amíg az utolsó csillag is földet ér. Ilyet kevesen láttak. Most már te is.', effect: 'xp', amount: 1.5 }
        ] },

      { id: 'any_postagalamb', region: 'any', kind: 'esemeny', title: 'Az eltévedt postagalamb',
        text: 'Egy kimerült galamb pottyan eléd. A lábán levél, a pecsétje kissé megolvadt. Nagyon szeretné, ha végre kézbesítené valaki.',
        options: [
          { label: 'Elolvasom a levelet', result: 'Egy öreg kalandor írja a tanítványának: tippek, trükkök, a szörnyek gyenge pontjai. Neked is jól jön.', effect: 'xp' },
          { label: 'Útba igazítom', result: 'A galamb hálásan búg, és otthagyja a postadíjat. Úgy látszik, nála ez fordítva működik.', effect: 'silver' },
          { label: 'Felismerem a pecsétet', needs: { origin: 'nemes' },
            result: 'A régi házad intézőjének pecsétje! A levél neked szól, és pénz is van benne. A galamb végre célba ért.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_kettetort_kard', region: 'any', kind: 'esemeny', title: 'A kettétört kard',
        text: 'Egy kard hever két darabban egy tönk mellett. A pengéjén még látszik a kovácsjegy. Szép munka volt, amíg egyben volt.',
        options: [
          { label: 'Elteszem a markolatot', result: 'A markolatra ezüstszálat fontak. A következő vásáron szép pénzt kapsz érte.', effect: 'silver' },
          { label: 'Tisztességgel elásom', result: 'Ahogy a gödröt ásod, csillagporos kavicsokra bukkansz. Mintha a kard egykori gazdája így köszönné meg.', effect: 'dust' },
          { label: 'Összekovácsolom a tűznél', needs: { origin: 'kovacs' },
            result: 'Egy lapos kő az üllő, egy másik a kalapács. Otthon tanultad. Nem lesz legendás, de újra egyben van, és a tiéd.', effect: 'item' }
        ] },

      { id: 'any_vandorok_tuznel', region: 'any', kind: 'esemeny', title: 'Vándorok a tűz körül',
        text: 'Néhány vándor ül egy tűz körül, és épp azon vitatkoznak, ki mesél a legjobban. Helyet szorítanak neked is.',
        options: [
          { label: 'Leülök melegedni', result: 'A tűz meleg, a leves sűrű, a társaság jókedvű. Kipihenten indulsz tovább.', effect: 'heal' },
          { label: 'Elmesélem a kalandjaimat', result: 'Kicsit kiszínezed, de csak egy kicsit. A vándorok cserébe elárulják, mire figyelj a környéken.', effect: 'xp' },
          { label: 'Elsütöm a legjobb viccemet', needs: { trait: 'trefas' },
            result: 'Akkorát nevetnek, hogy az egyikük leesik a farönkről. Összedobnak neked egy kis pénzt, hogy mondd el még egyszer.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_gyanus_pite', region: 'any', kind: 'esemeny', title: 'A gyanús pite',
        text: 'Egy erdei kunyhó ablakában pite hűl. Az illata mennyei, a gazdája sehol. Kicsit túl könnyű ez így.',
        options: [
          { label: 'Bekopogok', result: 'Egy apró anyóka nyit ajtót, és úgy örül a vendégnek, hogy kapsz egy szeletet. Nem gyanús, csak isteni.', effect: 'heal' },
          { label: 'Elveszek egy szeletet, és fizetek', result: 'A helyére egy érmét teszel. A kunyhóból elégedett kuncogás hallatszik, és furcsa erő árad szét benned.', effect: 'blessing' },
          { label: 'Megeszem az egészet', needs: { trait: 'falanks' },
            result: 'Gyanús volt, de megérte. Utána egy darabig mozdulni sem bírsz, viszont olyan jóllakott vagy, hogy minden fájdalmad elmúlik.', effect: 'heal', amount: 1.5 }
        ] },

      { id: 'any_sebzett_hollo', region: 'any', kind: 'esemeny', title: 'A sebzett holló',
        text: 'Egy holló gubbaszt a földön, a szárnya furcsán lóg. Gyanakodva néz rád, de nem repül el. Talán nem is tudna.',
        options: [
          { label: 'Bekötöm a szárnyát', setFlag: 'hollo_megmentve',
            result: 'Csíp egyet, de hagyja. Mire végzel, már a szárnyát próbálgatja. Kiköp egy szem csillagport, és hosszan néz utánad.', effect: 'dust', amount: 0.5 },
          { label: 'Adok neki pár morzsát', result: 'Mohón eszik, aztán a csőrével odapöccint neked egy fényes érmét. Ki tudja, kitől csente.', effect: 'silver' }
        ] },

      { id: 'any_hollo_visszater', region: 'any', kind: 'esemeny', title: 'A holló visszatér', follow: 'hollo_megmentve',
        text: 'Ismerős károgás. Az a holló az, akinek bekötötted a szárnyát, és egy egész csapatot hozott magával. Mindegyik csőrében van valami.',
        options: [
          { label: 'Elfogadom az ajándékokat', result: 'Gyűrű, gomb, kanál, csillagporos kavics. A hollók szerint ez mind kincs. A kavicsokban igazuk van.', effect: 'dust', amount: 1.5 },
          { label: 'Megkérem, mutasson utat', result: 'A hollók olyan ösvényre vezetnek, amelyről a szörnyek sem tudnak. Felkészülten, magabiztosan haladsz tovább.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'any_szakadt_hur', region: 'any', kind: 'esemeny', title: 'A szakadt húr',
        text: 'Egy vándorlantos ül a tisztáson, és kétségbeesetten hangolja a lantját. Elszakadt egy húrja, és vele együtt az önbizalma is.',
        options: [
          { label: 'Odaadom a cipőfűzőmet', result: 'A fűzőből húr lesz, a húrból dal. Nem szép, de lelkes. Jókedvűen indulsz tovább.', effect: 'heal' },
          { label: 'Megkérem, játsszon valamit', result: 'Öt húron is meglepően jól játszik. Arra járó vándorok állnak meg, pénzt dobnak a kalapjába, és a lantos megfelezi veled.', effect: 'silver' },
          { label: 'Írok hozzá egy új versszakot', needs: { trait: 'almodozo' },
            result: 'Egy holdfényes versszak jut eszedbe, a lantos meghatottan jegyzi le. Cserébe megtanít neked pár régi legendát.', effect: 'xp', amount: 1.5 }
        ] },

      // ----- második adag: bárhol előforduló esetek -----
      { id: 'any_alvo_orias', region: 'any', kind: 'csapda', title: 'Az alvó óriás',
        text: 'Az ösvény egy dombon vezet át. A domb horkol. Közelebbről nézve nem is domb, hanem egy óriás, aki valamikor tavaly dőlt le egy kicsit pihenni.',
        options: [
          { label: 'Lábujjhegyen átosonok rajta', check: { stat: 'fur', base: 0.6 },
            result: 'Egy fűszál sem rezzen. Az óriás mellényzsebéből menet közben kigurul egy ezüstgomb, akkora, mint egy tányér.', effect: 'silver',
            fail: { result: 'Ráléptél a fülére. Az óriás álmában odacsap, mint aki szúnyogot hesseget. Te vagy a szúnyog.', effect: 'hurt' } },
          { label: 'Megkerülöm az egészet', result: 'Hosszú kerülő, az óriás ugyanis elég nagy. Legalább kényelmesen végiggondolod közben, mit tanultál az úton.', effect: 'xp', amount: 0.5 },
          { label: 'Betakarom, mert fázik', needs: { trait: 'joszivu' },
            result: 'Ráhúzol egy lehullott ponyvát a vállára. Az óriás álmában elmosolyodik, és a markából a lábad elé pereg egy halom csillagpor.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_visszhang_szurdok', region: 'any', kind: 'esemeny', title: 'A visszhang',
        text: 'A szurdokban minden szavadra felel valaki. Csakhogy nem azt mondja vissza, amit te mondtál. Hanem azt, amit gondoltál.',
        options: [
          { label: 'Kikérdezem magamat', result: 'Furcsa beszélgetés, de tanulságos. Kiderül, hogy a múltkori őrzőnél végig tudtad, mit rontasz el.', effect: 'xp' },
          { label: 'Befogom a fülem, és átsietek', result: 'Vannak dolgok, amiket az ember nem akar hallani saját magától. A túloldalon legalább találsz pár elgurult érmét.', effect: 'silver', amount: 0.5 },
          { label: 'Viccet mesélek neki', needs: { trait: 'trefas' },
            result: 'A visszhang a csattanónál felnevet, pedig azt még ki sem mondtad. Hálából megsúgja, mit rejtettek el a sziklahasadékban.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_holdgyujto', region: 'any', kind: 'esemeny', title: 'A holdfénygyűjtő',
        text: 'Egy asszony fordított esernyőt tart az ég felé, pedig hét ágra süt a hold. „Holdfényt gyűjtök – mondja. – Lassan megy, de megéri.”',
        options: [
          { label: 'Segítek tartani', result: 'Egy óra múlva már zsibbad a karod, de az esernyő alján tényleg összegyűlik valami fényes. Megfelezi veled.', effect: 'dust' },
          { label: 'Megkóstolom, amit gyűjtött', result: 'Hűvös, és olyan íze van, mint a mentának meg a csendnek. A sebeid viszketni kezdenek, aztán összehúzódnak.', effect: 'heal' },
          { label: 'Megmutatom, hogy kell ezt rendesen', needs: { origin: 'tanonc' },
            result: 'A mestered ugyanezt csinálta, csak tölcsérrel. Átszabjátok az esernyőt, és negyedóra alatt megtelik. A fele a tiéd.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_elveszett_arnyek', region: 'any', kind: 'esemeny', title: 'A kóbor árnyék',
        text: 'Egy árnyék bandukol az úton, gazda nélkül. Amikor meglát, reménykedve odaáll a lábadhoz, hátha nem veszed észre, hogy már van egy.',
        options: [
          { label: 'Hagyom, hadd jöjjön', result: 'Két árnyékkal jársz egy darabig. A szörnyek ettől láthatóan elbizonytalanodnak, te meg egyre magabiztosabb vagy.', effect: 'blessing' },
          { label: 'Segítek megkeresni a gazdáját', result: 'Egy bokor alatt alszik egy vándor, árnyék nélkül. Mire felébred, már megvan az árnyéka. Az árnyék hálából a markodba nyom pár érmét. Hogy honnan van egy árnyéknak pénze, azt jobb nem firtatni.', effect: 'silver' },
          { label: 'Megnézem, mi van a zsebében', needs: { trait: 'kivancsi' },
            result: 'Az árnyékoknak is van zsebük, csak senki sem szokott belenézni. Ebben egy árnyék-érme lapul, ami a kezedben igazivá válik. Aztán még egy. Meg még egy.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_harom_ajto', region: 'any', kind: 'rejtveny', title: 'Három ajtó a réten',
        text: 'A rét közepén három ajtó áll, fal nélkül. Az elsőn kilincs van, a másodikon kopogtató, a harmadik résnyire nyitva. Egy tábla szerint: „Csak az egyik udvarias.”',
        options: [
          { label: 'Kopogok a másodikon', result: 'Az ajtó kinyílik, mögötte ugyanaz a rét, csak egy kis asztalkával, rajta csillagporral teli tálka. „Végre valaki, aki tud viselkedni.”', effect: 'dust', amount: 1.5 },
          { label: 'Benyitok az elsőn', result: 'Az ajtó sértődötten nyikorog. Mögötte ugyanaz a rét van, csak valahogy barátságtalanabb.', effect: 'none' },
          { label: 'Belesek a harmadikon', result: 'Valaki belülről becsapja az orrod előtt. Jogos. Leskelődni tényleg nem szép dolog.', effect: 'hurt', amount: 0.5 }
        ] },

      { id: 'any_merleges_ember', region: 'any', kind: 'arus', title: 'A mérleges ember',
        text: 'Egy sovány alak ül az útszélen egy rézmérleg mögött. „Bármit lemérek – mondja. – Bátorságot, szerencsét, lelkiismeretet. Darabja két ezüst, illetve nálad annál kicsit több.”',
        options: [
          { label: 'Mérje le a bátorságomat', cost: 1, result: 'A serpenyő nagyot koppan. „Ejha” – mondja az ember. Nem tudod, mennyi az annyi, de kihúzod magad, és a kardod is könnyebbnek tűnik.', effect: 'blessing' },
          { label: 'Mérje le, mit tanultam eddig', cost: 0.5, result: 'Hosszan méricskél, közben sorolja, mit lát. A felére már nem is emlékeztél. Most megint igen.', effect: 'xp' },
          { label: 'Nem kérek belőle', result: '„A takarékosságod viszont elég nehéz” – jegyzi meg, és ingyen megmutatja a mérleg nyelvét. Balra áll. Ez állítólag jó.', effect: 'none' },
          { label: 'A mérlege hamis', needs: { origin: 'csempesz' },
            result: 'Az ilyet egy csempész csukott szemmel kiszúrja: ólom van a bal serpenyő alatt. Az ember elsápad, és inkább fizet, csak ne mondd el senkinek.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_vamszedo_beka', region: 'any', kind: 'esemeny', title: 'A vámszedő béka',
        text: 'A hídon egy béka ül, félrecsapott vámszedősapkában. „Hídvám! – brekegi. – Egy légy, vagy azzal egyenértékű szolgáltatás.”',
        options: [
          { label: 'Fogok neki egy legyet', check: { stat: 'fur', base: 0.65 },
            result: 'Elsőre megvan. A béka elismerően bólint, és a sapkája alól előhúz neked egy fényes kis követ. Csillagporrá omlik a tenyeredben.', effect: 'dust',
            fail: { result: 'Negyedóráig csapkodsz a levegőben, közben a korlátba is belevered a könyököd. A béka végül megszán, és átenged.', effect: 'hurt', amount: 0.5 } },
          { label: 'Megvakarom a hátát', result: 'Ez pontosan egy léggyel egyenértékű. A béka elégedetten lehunyja a szemét, te pedig kipihenten sétálsz át a hídon.', effect: 'heal', amount: 0.5 },
          { label: 'Felség, egy nemes nem fizet vámot', needs: { origin: 'nemes' },
            result: 'A béka végigmér, aztán vigyázzba vágja magát. A szabályzat szerint az ilyen vendégnek még jár is valami a vámkasszából.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_kovacs_ullo', region: 'any', kind: 'esemeny', title: 'Az elhagyott üllő',
        text: 'Az erdő közepén egy üllő áll, mellette kalapács, a parázs még meleg. A kovács sehol. Az üllőn félkész penge hűl.',
        options: [
          { label: 'Megélezem rajta a fegyverem', result: 'A kő is ott van mellette. Pár húzás, és a pengéd úgy vág, mint új korában.', effect: 'blessing' },
          { label: 'Megvárom a kovácsot', result: 'Nem jön. Viszont a parázs mellett jólesik megmelegedni, és a tarisznyádból is előkerül egy elfelejtett pogácsa.', effect: 'heal' },
          { label: 'Befejezem a pengét', needs: { origin: 'kovacs' },
            result: 'A kezed emlékszik a mozdulatra. Mire kész, a fák közül előlép az öreg kovács, aki végig figyelt. „Ezt kerestem” – mondja, és megfizeti a vizsgamunkát.', effect: 'silver', amount: 2 }
        ] },

      { id: 'any_almatlan_bagoly', region: 'any', kind: 'esemeny', title: 'Az álmatlan bagoly',
        text: 'Egy bagoly gubbaszt az ágon telihold idején, karikás szemmel. „Nem tudok aludni – panaszolja. – Számoltam már egeret, nem használ.”',
        options: [
          { label: 'Elmesélem neki a kalandjaimat', result: 'A harmadik szörnynél már horkol. Ettől függetlenül jó volt elmondani az egészet: közben rájössz egy-két dologra.', effect: 'xp' },
          { label: 'Adok neki a teámból', result: 'A bagoly kortyol egyet, pislog kettőt, és elalszik. A fészkéből közben a fejedre potyog a gyűjteménye: csupa fényes holmi.', effect: 'silver' },
          { label: 'Elmondom, miről szoktam álmodni', needs: { trait: 'almodozo' },
            result: 'Olyan szépen meséled, hogy a bagoly csukott szemmel hallgatja, aztán már nem is hallgatja. Álmában egy csillagporos tollat ejt a kezedbe.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_mohos_oltarko', region: 'any', kind: 'szentely', title: 'A mohos oltárkő',
        text: 'Az útelágazásnál lapos kő áll, rajta félig kiégett gyertyák és pár hervadt virág. Valaki nemrég még járt itt. A kő enyhén langyos.',
        options: [
          { label: 'Meggyújtok egy gyertyát', result: 'A láng ezüstösen ég, és nem lobog a szélben. Amíg nézed, a vállad elnehezül, aztán egyszerre nagyon könnyű lesz.', effect: 'blessing' },
          { label: 'Leülök mellé pihenni', result: 'A kő melege átjárja a hátadat. Mire felállsz, a horzsolásaid fele eltűnt.', effect: 'heal' },
          { label: 'Előbb háromszor körbejárom', needs: { trait: 'babonas' },
            result: 'Balról jobbra, ahogy kell. A harmadik körnél az összes gyertya magától lángra kap. Ilyen áldást az kap, aki tudja a rendjét.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'any_parbajozo_lovag', region: 'any', kind: 'esemeny', title: 'A rozsdás lovag',
        text: 'Egy páncélos alak állja el az utat, tetőtől talpig rozsdásan. „Állj! Itt csak az megy át, aki legyőz!” A hangja kong. A sisakrostélya mögött nincs senki.',
        options: [
          { label: 'Kiállok ellene', check: { stat: 'tam', base: 0.6 },
            result: 'Három csapás, és a páncél darabokra hullik. A mellvért alól kigurul minden, amit az elmúlt száz év vesztesei itt hagytak.', effect: 'silver', amount: 1.5,
            fail: { result: 'A páncél üres, de az ökle nem az. Mire észbe kapsz, az árokban ülsz. „Jöhet a következő!” – kongja elégedetten.', effect: 'hurt' } },
          { label: 'Megolajozom a térdét', result: 'A lovag meghatottan nyikorog egy utolsót, aztán hangtalanul félreáll. „Száz éve erre várok” – mondja. Megmutat pár fogást búcsúzóul.', effect: 'xp' },
          { label: 'Kiröhögöm, és átsétálok mellette', needs: { trait: 'vakmero' },
            result: 'A lovag annyira megdöbben, hogy elfelejt megütni. Ilyet még senki sem mert. Tisztelete jeléül utánad dobja a kesztyűjét, tele csillagporral.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'any_holdfeny_piac', region: 'any', kind: 'arany', title: 'Az éjféli vásár',
        text: 'A tisztáson, ahol tegnap még semmi sem volt, most sátrak állnak, lampionok égnek, és valaki fuvolázik. Egy tábla hirdeti: „Éjféli vásár. Évente egyszer. Az első vendégnek minden ingyen.”',
        options: [
          { label: 'A csillagporos sátorhoz megyek', result: 'Az árus egy merőkanállal méri a port, és nem sajnálja. „Vidd csak, hajnalra úgyis elolvad, ami marad.”', effect: 'dust', amount: 2 },
          { label: 'A pénzváltóhoz megyek', result: 'Becseréli a zsebedben lévő kavicsot ezüstre. Aztán a gombodat is. Aztán a tegnapi rossz kedvedet. Jól váltanak ma.', effect: 'silver', amount: 2 },
          { label: 'Beülök a mesemondó sátrába', result: 'Az öreg mesemondó a te történetedet meséli, csak a végét is tudja. Nem mondja el, de eleget hallasz ahhoz, hogy okosabban menj tovább.', effect: 'xp', amount: 2 }
        ] },

      { id: 'any_kotelhid', region: 'any', kind: 'csapda', title: 'A kötélhíd',
        text: 'A szakadék fölött kötélhíd leng. A deszkák fele megvan. A másik feléről egy tábla annyit mond: „Javítás alatt, türelmüket kérjük. Kelt: negyven éve.”',
        options: [
          { label: 'Nekifutok, és átugrálok', check: { stat: 'fur', base: 0.55 },
            result: 'A hiányzó deszkáknál egyszerűen nem nézel le. Bevált. A túloldali oszlopra valaki egy erszényt akasztott az ügyeseknek.', effect: 'silver', amount: 1.5,
            fail: { result: 'Az utolsó előtti deszka is javítás alatt volt. A kötélbe kapaszkodva húzod át magad, lehorzsolt tenyérrel.', effect: 'hurt' } },
          { label: 'Lemászom, és odalent kelek át', result: 'Fél nap, de a szakadék alján meglepően sok leesett holmi hever. Az előtted járók nem voltak ilyen megfontoltak.', effect: 'silver', amount: 0.5 },
          { label: 'Előbb minden csomót megnézek', needs: { trait: 'ovatos' },
            result: 'A harmadik csomó kioldva, valaki így hagyta. Megkötöd, a többit is meghúzod, és úgy sétálsz át, mint a főutcán. A híd tövében ott a javítók elfelejtett bére.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'any_mogorva_remete', region: 'any', kind: 'esemeny', title: 'A remete kerítése',
        text: 'Az ösvény egy kerítésnél véget ér. Mögötte kunyhó, előtte tábla: „Nem veszek semmit. Nem kérek tanácsot. A kutya harap. Nincs kutyám, de harap.”',
        options: [
          { label: 'Bekopogok, és útbaigazítást kérek', result: 'A remete morog, de elmagyarázza az utat, sőt azt is, melyik szörnyet honnan érdemes megközelíteni. Közben végig azt mondja, hogy siet.', effect: 'xp' },
          { label: 'Csendben megkerülöm a kertet', result: 'A kerítés tövében gyógyfű nő. Abból, ami kilóg az ösvényre, szedsz egy csokorral. Az már közterület.', effect: 'heal' },
          { label: 'Kiírom mellé, hogy „Helyes.”', needs: { trait: 'mogorva' },
            result: 'Kinyílik az ajtó. A remete elolvassa, bólint, és szó nélkül a kezedbe nyom egy üveg házi gyógyfőzetet. Egyikőtök sem köszön el. Tökéletes találkozás volt.', effect: 'heal', amount: 2 }
        ] },

      // ===================== KÖDLÁP =====================
      { id: 'kodlap_ingovany', region: 'kodlap', kind: 'csapda', title: 'Az ingovány',
        text: 'Az ösvény elfogy, előtted csak zsombékok és csillogó, fekete víz. Az egyik zsombék gyanúsan bugyborékol.',
        options: [
          { label: 'Átugrálok a zsombékokon', check: { stat: 'fur', base: 0.55 },
            result: 'Szökkensz, egyensúlyozol, és átérsz. Az utolsó zsombékba valaki egy erszényt dugott.', effect: 'silver',
            fail: { result: 'Egy zsombék elsüllyed alattad. Derékig merülsz, és mire kikecmeregsz, minden porcikád sajog.', effect: 'hurt' } },
          { label: 'Megvárom, míg felszáll a köd', result: 'Ahogy oszlik a pára, előbukkan egy keskeny gát. Kényelmesen átsétálsz, és közben ki is pihened magad.', effect: 'heal', amount: 0.5 },
          { label: 'Követem a köd rajzolatát', needs: { origin: 'arva' },
            result: 'Ködben nőttél fel, úgy olvasol belőle, mint más a könyvből. A biztos úton haladva egy elhagyott pénzeszsákra is rábukkansz.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'kodlap_lapi_anyoka', region: 'kodlap', kind: 'rejtveny', title: 'A horgászó anyóka',
        text: 'Egy anyóka horgászik a lápon, pedig itt hal sincs. „Mondd meg nekem, mi az: folyton fut, mégsem fárad el, van ága, mégsem fa?”',
        options: [
          { label: '„A folyó”', result: '„Na végre valaki!” – kuncog az anyóka. A horgára épp ekkor akad fel valami csillogó, és neked adja.', effect: 'dust', amount: 1.5 },
          { label: '„A szél”', result: '„A szélnek nincs ága, legfeljebb szárnya” – feleli az anyóka, és horgászik tovább. Ennyi volt.', effect: 'none' },
          { label: '„A mókus”', result: 'Az anyóka olyan jót nevet, hogy majdnem beleesik a vízbe. „Fáradhatatlan, az igaz.” Aztán elhessent.', effect: 'none' }
        ] },

      { id: 'kodlap_segitokesz_liderc', region: 'kodlap', kind: 'esemeny', title: 'A segítőkész lidérc',
        text: 'Kék lidércfény lebeg előtted. „Erre, erre! Mutatom a rövidebb utat!” Nagyon igyekszik. Kicsit túlságosan is.',
        options: [
          { label: 'Követem', check: { stat: 'fur', base: 0.55 },
            result: 'A rövidebb út tényleg rövidebb, csak épp ingoványos. Ügyesen átjutsz, és a túloldalon egy elhagyott erszényt találsz.', effect: 'silver',
            fail: { result: 'A rövidebb út egyenesen a mocsárba vezet. A lidérc kuncogva eltűnik, te pedig vizesen, horzsolásokkal mászol ki.', effect: 'hurt' } },
          { label: 'Szólok, hogy menjen haza', result: 'A lidérc elszégyelli magát, és ellebeg. Bocsánatkérésképp egy kis csillagport hagy maga után.', effect: 'dust' },
          { label: 'Kifordítom a köpenyemet', needs: { trait: 'babonas' },
            result: 'Ősi trükk: aki kifordítja a ruháját, azt a lidérc nem vezetheti tévútra. A fény bosszúsan szétpukkan, és rád szórja az erejét.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'kodlap_bekakorus', region: 'kodlap', kind: 'esemeny', title: 'Békakórus-próba',
        text: 'Nagy a sürgés a lápon: a békák a lápkirály születésnapjára gyakorolnak. Csak a basszus hiányzik. Mindenki rád néz.',
        options: [
          { label: 'Beállok brummogni', result: 'Mélyen és hamisan brummogsz, de a karmester béka elégedett. A végén megtapsolnak, és ettől egészen jókedvű leszel.', effect: 'heal' },
          { label: 'Inkább vezényelek', result: 'Kiderül, hogy a ritmus nem a békák erőssége. A tiéd sem. Közben viszont sok mindent megtudsz a lápkirály szokásairól.', effect: 'xp' },
          { label: 'Beállok szólistának', needs: { trait: 'trefas' },
            result: 'Akkorát brekegsz, hogy a kórus elnémul, aztán tapsvihar tör ki. A közönség soraiból még pár érme is a lábad elé gurul.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'kodlap_pikkelyoltar', region: 'kodlap', kind: 'szentely', title: 'A vedlett bőr oltára',
        text: 'Egy mohos kőre valaki ezüstös kígyóbőrt terített, mint egy abroszt. Körülötte apró áldozati tálkák. A levegő hűvös és csendes.',
        options: [
          { label: 'Megérintem a kígyóbőrt', result: 'A pikkelyek hidegek, de a bizsergés egészen a válladig fut. A kezedet most fürgébbnek érzed.', effect: 'blessing' },
          { label: 'Megmosakodom a tálban', result: 'A víz csíp egy kicsit, aztán minden karcolásod begyógyul. Az Ezüstpikkely ezek szerint jókedvében van.', effect: 'heal' },
          { label: 'Magamra terítem a bőrt', needs: { trait: 'vakmero' },
            result: 'Bárki más szerint őrültség. Neked pont jó: a bőr szétporlik rajtad, és a kígyó ereje egy időre a tiéd.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'kodlap_beragadt_reves', region: 'kodlap', kind: 'esemeny', title: 'A beragadt révész',
        text: 'Egy öreg révész toporog a sárban, a csónakja félig elmerült. „Hé, vándor! Segíts már egy öregembernek!”',
        options: [
          { label: 'Kihúzom a csónakot', setFlag: 'reves_kihuzva',
            result: 'Nyögsz, húzol, a sár nagyot cuppan, és a csónak kiszabadul. A révész hálásan a markodba nyom pár érmét.', effect: 'silver' },
          { label: 'Tanácsot adok neki', result: 'Elmagyarázod, hogyan lazítsa meg a sarat. Működik. A révész a tanácsért is fizet, igaz, csak félárat.', effect: 'silver', amount: 0.5 },
          { label: 'Bevetem a csempészfogást', needs: { origin: 'csempesz' }, setFlag: 'reves_kihuzva',
            result: 'Az evezővel megemeled a csónak orrát, és már csúszik is. Az öreg kacsint: „Ismerem ezt a fogást.” És duplán fizet.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'kodlap_reves_fuvar', region: 'kodlap', kind: 'esemeny', title: 'A révész fuvarja', follow: 'reves_kihuzva',
        text: 'Csónak siklik elő a ködből. A révész az, akit kihúztál a sárból. „Szállj be, ingyen viszlek. Amíg evezek, pihenj csak!”',
        options: [
          { label: 'Beszállok és pihenek', result: 'A csónak ringat, a köd betakar. Mire kikötsz, teljesen kipihented magad.', effect: 'heal', amount: 1.5 },
          { label: 'Kifaggatom a láp őreiről', result: 'Az öreg mindegyiket ismeri, és a gyenge pontjaikat is elárulja. Brekusról például azt, hogy csiklandós.', effect: 'blessing', amount: 1.5 }
        ] },

      // ===================== HOLDFÉNY-ERDŐ =====================
      { id: 'holdfeny_kobold_vam', region: 'holdfeny', kind: 'esemeny', title: 'Kobold-vámszedők',
        text: 'Három fenyőkobold állja el az ösvényt, kezükben tobozos lándzsa. „Vám! Ez itt királyi út, egy toboz a díja!”',
        options: [
          { label: 'Fizetek egy tobozzal', result: 'A koboldok alaposan megvizsgálják, aztán visszajárót adnak. Ezüstben. A kobold-gazdaság rejtély, de nem panaszkodsz.', effect: 'silver' },
          { label: 'Elzavarom őket', check: { stat: 'tam', base: 0.6 },
            result: 'Nagyot dobbantasz, és a koboldok fejvesztve menekülnek, a vámpénzt is otthagyják. A hangerő néha fél győzelem.', effect: 'silver',
            fail: { result: 'A koboldok összezárnak, és addig bökdösnek, amíg el nem hátrálsz. Kicsik, de kitartóak.', effect: 'hurt' } },
          { label: 'Felmutatom a pecsétgyűrűmet', needs: { origin: 'nemes' },
            result: 'A koboldok meglátják a családi címert, és mélyen meghajolnak. Királyi vendégnek járó ajándékkal engednek tovább.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'holdfeny_remete', region: 'holdfeny', kind: 'rejtveny', title: 'Az ezüstszakállú remete',
        text: 'Egy remete ül egy kidőlt fenyőn, és a holdat bámulja. „Felelj, és mehetsz: hol kerek, hol sarló, hol meg el is bújik. Mi az?”',
        options: [
          { label: '„A hold”', result: 'A remete elmosolyodik. „Pedig ott volt az orrod előtt.” Cserébe megtanít pár régi holdvadász-trükkre.', effect: 'xp' },
          { label: '„A sajt”', result: '„A hold nem sajtból van – sóhajt a remete. – Pedig milyen jó lenne.” Aztán szó nélkül elenged.', effect: 'none' },
          { label: '„A bagoly szeme”', result: 'A remete gyanakodva felnéz a fára, ahol épp egy bagoly pislog. „Hát, félig talált” – mondja. Többet nem.', effect: 'none' }
        ] },

      { id: 'holdfeny_tuskes_mancs', region: 'holdfeny', kind: 'esemeny', title: 'A tüskés mancs',
        text: 'Egy ezüstbundás holdfarkas fekszik az ösvényen, és a mancsát nyalogatja. Morog, de nem áll fel. Valami beleállt a talpába.',
        options: [
          { label: 'Kihúzom a tüskét', setFlag: 'farkas_baratsag', check: { stat: 'ved', base: 0.6 },
            result: 'A farkas felnyüszít, aztán hálásan megnyalja a kezedet. Mielőtt elfut, hosszan a szemedbe néz. Erőt ad ez a pillantás.', effect: 'blessing',
            fail: { result: 'A farkas ijedtében a karodba kap. Nem harap meg komolyan, és a tüske is kijött. Most mindketten sántítotok egy kicsit.', effect: 'hurt' } },
          { label: 'Lassan hátrálok', result: 'A farkas utánad néz, de nem mozdul. A bokorban, ahová hátrálsz, valaki egy kis erszényt rejtett el.', effect: 'silver' },
          { label: 'Visszamorgok rá', needs: { trait: 'mogorva' },
            result: 'Egy darabig farkasszemet néztek, aztán ő hajtja le a fejét. Most te vagy a falkavezér, és ettől nagyon erősnek érzed magad.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'holdfeny_farkasfalka', region: 'holdfeny', kind: 'esemeny', title: 'A farkasfalka', follow: 'farkas_baratsag',
        text: 'Ezüst bundák villannak a fák között. Az a holdfarkas az, akinek kihúztad a tüskét, és most az egész falkát elhozta. Csóválják a farkukat.',
        options: [
          { label: 'Futok velük egy kört', result: 'Együtt rohantok át az éjszakai erdőn, szinte repülsz. A végére minden izmod tele van erővel.', effect: 'blessing', amount: 1.5 },
          { label: 'Hagyom, hogy vezessenek', result: 'A falka egy barlanghoz visz, ahol évek óta gyűjtik a fényes holmikat. Egy részét neked adják.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'holdfeny_gyantakonny', region: 'holdfeny', kind: 'szentely', title: 'A gyantakönny-oltár',
        text: 'Egy öreg fenyő tövében kis oltár áll, a kérgén aranyló gyanta csorog. Azt mondják, ez a Fenyőkirálynő könnye.',
        options: [
          { label: 'Gyantát kenek a fegyveremre', result: 'A gyanta megkeményedik, és halványan dereng a fegyvereden. Minden ütésed súlyosabb lesz tőle.', effect: 'blessing' },
          { label: 'Lefekszem a fa tövébe', result: 'Puha a tűlevél, bódító a gyantaillat. Csak egy kicsit szundítasz, mégis olyan, mintha egész éjjel aludtál volna.', effect: 'heal' },
          { label: 'Elültetek egy fenyőmagot', needs: { trait: 'joszivu' },
            result: 'A mag azonnal kicsírázik, a kis hajtás feléd hajol. Az öreg fenyő megremeg, mintha megköszönné, és erővel tölt el.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'holdfeny_lengo_ronk', region: 'holdfeny', kind: 'csapda', title: 'A lengő rönk',
        text: 'Az ösvény fölött kötélen lóg egy rönk. A fűben vékony zsinór fut keresztben. Valaki nagyon szeretné, ha belebotlanál.',
        options: [
          { label: 'Átszökkenek a zsinóron', check: { stat: 'fur', base: 0.6 },
            result: 'Könnyedén átugrod. A zsinór végén ott lóg a csalétek is: egy zacskó csillagpor. Most már a tiéd.', effect: 'dust',
            fail: { result: 'A lábad beleakad, a rönk meglendül. Az utolsó pillanatban hasra vágódsz előle, de a földet már nem tudod kikerülni.', effect: 'hurt' } },
          { label: 'Kerülök egyet a fák között', result: 'Hosszabb út, de csendes. A mohában egy elveszett ezüstérmére bukkansz.', effect: 'silver', amount: 0.5 },
          { label: 'Megnézem, ki állította', needs: { trait: 'kivancsi' },
            result: 'A zsinórt követve egy kobold-rejtekhez érsz. A gazdája elszalad, a zsákmánya viszont itt marad.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'holdfeny_feher_szarvas', region: 'holdfeny', kind: 'arany', title: 'A fehér szarvas',
        text: 'Hófehér szarvas lép ki a fák közül, és egy forrásnál iszik. Ahol a patája földet ér, virág nyílik. Rád néz, és nem fut el.',
        options: [
          { label: 'Iszom a forrásból, ahol ivott', result: 'A víz édes, mint a holdfény. Minden fáradtságod elszáll, mintha csak most indultál volna útnak.', effect: 'heal', amount: 2 },
          { label: 'Megérintem az agancsát', result: 'Az agancs meleg és ezüstös. A fény átköltözik a karodba, és ott is marad.', effect: 'blessing', amount: 2 },
          { label: 'Követem a nyomait', result: 'A szarvas egy patakhoz vezet, amelynek medrében ezüstérmék csillognak. Aztán eltűnik, mintha ott sem lett volna.', effect: 'silver', amount: 2 }
        ] },

      // ===================== ÁRNYROMOK =====================
      { id: 'arnyromok_nema_kapu', region: 'arnyromok', kind: 'rejtveny', title: 'A néma kapu',
        text: 'Zárt kőkapu, rajta vésett felirat: „Mi az, ami megtörik, ha kimondod a nevét?” Alá valaki odakarcolta: „Én se tudom.”',
        options: [
          { label: '„A csend”', result: 'Ahogy kimondod, a kapu hangtalanul kinyílik. Mögötte kis kamra, tele régi feljegyzésekkel.', effect: 'xp', amount: 1.5 },
          { label: '„A tükör”', result: 'Semmi. A kapu zárva marad, a tükrök pedig ezek szerint bírják, ha a nevükön szólítják őket. Kerülővel mész tovább.', effect: 'none' },
          { label: '„A kapu”', result: 'Kimondod. A kapu nem törik meg. Kicsit butának érzed magad, amiért egy kapuval vitatkozol.', effect: 'none' }
        ] },

      { id: 'arnyromok_runatolvaj', region: 'arnyromok', kind: 'esemeny', title: 'A beszorult rúnatolvaj',
        text: 'Egy ledőlt gerenda alól egy rúnatolvaj kalimpál, a zsákja tele lopott rúnakővel. „Segíts ki, és nem felejtem el!”',
        options: [
          { label: 'Kiszabadítom', setFlag: 'tolvaj_kiszabaditva',
            result: 'Megemeled a gerendát, ő kicsusszan. „Tartozom neked!” – kiáltja, hátradob egy érmét, és már el is tűnt.', effect: 'silver', amount: 0.5 },
          { label: 'Elveszem a zsákját', result: 'A tolvaj szitkozódik, te pedig elégedetten méregeted a rúnaköveket. Mindegyikre csillagpor tapad.', effect: 'dust' },
          { label: 'Vasrúddal kiemelem a gerendát', needs: { origin: 'kovacs' }, setFlag: 'tolvaj_kiszabaditva',
            result: 'Egy rozsdás vasrúdból emelőt csinálsz, ahogy a műhelyben tanultad. A tolvaj meghatódik, és megoszt veled pár rúnát.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'arnyromok_suttogas', region: 'arnyromok', kind: 'esemeny', title: 'Suttogás a sötétből', follow: 'tolvaj_kiszabaditva',
        text: '„Pszt!” A rúnatolvaj az, akit kiszabadítottál. „Előtted csapda van, üreges a padló. De tudok egy jobb utat, sőt egy rejteket is.”',
        options: [
          { label: 'Megfogadom a tanácsát', result: 'Kikerülöd a csapdát, a tolvaj pedig még a környék őreinek szokásait is elárulja. Felkészülten mész tovább.', effect: 'blessing', amount: 1.5 },
          { label: 'Megosztozunk a rejteken', result: 'A rejtek tele van régi érmékkel, és a tolvaj becsületesen megfelezi. Tolvajhoz képest egész rendes.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'arnyromok_holdszobor', region: 'arnyromok', kind: 'szentely', title: 'A fejetlen holdszobor',
        text: 'Egy holdpapnőt ábrázoló szobor áll a romok közt, fej nélkül. A feje ott hever mellette a fűben, és mintha szemrehányóan nézne.',
        options: [
          { label: 'Visszateszem a fejét', result: 'Nehéz, de sikerül. A szobor szeme felvillan, és áldást mormol, amit a karodban érzel.', effect: 'blessing' },
          { label: 'Leülök a talapzatára', result: 'A kő langyos, mintha valaki épp most kelt volna fel róla. Ahogy pihensz, a sebeid begyógyulnak.', effect: 'heal' },
          { label: 'Elmondom az esti imát', needs: { origin: 'templom' },
            result: 'Ezt az imát a Holdtemplomban tanultad. A szobor ráismer, és a legerősebb áldását adja neked.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'arnyromok_csillagos_padlo', region: 'arnyromok', kind: 'csapda', title: 'A csillagos padló',
        text: 'A folyosó padlóját kőlapok borítják, mindegyiken egy csillagkép. Néhány lap kicsit mélyebben ül a többinél. Gyanúsan.',
        options: [
          { label: 'Átszökkenek a gyanúsakon', check: { stat: 'fur', base: 0.55 },
            result: 'Úgy ugrálsz, mint gyerekkorodban az ugróiskolában. Egyetlen lapot sem nyomsz be, és a túloldalon egy marék csillagpor vár.', effect: 'dust',
            fail: { result: 'Egy lap kattan, és a falból ősi por meg pár tompa nyílvessző zúdul rád. Inkább kellemetlen, mint veszélyes, de fáj.', effect: 'hurt' } },
          { label: 'A fal mentén araszolok', result: 'Lassú, de a fal mellett tömörek a lapok. Útközben egy repedésben pár régi ezüstpénzt találsz.', effect: 'silver', amount: 0.5 },
          { label: 'A csillagképek szerint lépek', needs: { origin: 'tanonc' },
            result: 'A csillagképek az évszakok sorrendjét követik, ezt minden tanonc tudja. Biztosan átérsz, a végén pedig egy rejtett fülke vár.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'arnyromok_szellemkalmar', region: 'arnyromok', kind: 'arus', title: 'A szellemkalmár',
        text: 'Áttetsző kalmár ül egy áttetsző pult mögött. „Mindent eladok! Csak megfogni nem tudom.” Az áruját te sem, de érezni igen.',
        options: [
          { label: 'Veszek egy régi áldást', cost: 1, result: 'A kalmár rád fújja. Előbb hideg, aztán meleg, aztán nagyon erősnek érzed magad tőle.', effect: 'blessing' },
          { label: 'Veszek egy emléket', cost: 0.5, result: 'Egy rég elhunyt vívómester emléke költözik beléd. Egy pillanatra tudod, amit ő tudott, és valami meg is marad belőle.', effect: 'xp' },
          { label: 'Csak nézelődöm', result: 'A kalmár sóhajt: kétszáz éve mindenki csak nézelődik. Azért eléd gurít egy érmét. Ő úgysem tudná elkölteni.', effect: 'silver', amount: 0.5 },
          { label: 'Elbeszélgetek vele', needs: { trait: 'almodozo' },
            result: 'Órákig meséltek egymásnak régi időkről és meg nem történt kalandokról. Búcsúzóul a kalmár megtanít egy régi trükkre.', effect: 'xp', amount: 1.5 }
        ] },

      { id: 'arnyromok_sopro_golem', region: 'arnyromok', kind: 'esemeny', title: 'A söprögető gólem',
        text: 'Egy kőgólem söpri a romokat, megállás nélkül. A por felszáll, aztán visszaszáll, ő pedig kezdi elölről. Évszázadok óta.',
        options: [
          { label: 'Segítek neki', result: 'Együtt söpritek fel a csarnokot. A gólem nem szól, de a végén eléd tol egy marék csillagport, amit a por alatt talált.', effect: 'dust' },
          { label: 'Megkérdezem, miért csinálja', result: 'A gólem megáll, és gondolkodik. Sokáig. Végül annyit mond: „Rend.” Valahogy mégis sokat tanulsz ebből.', effect: 'xp' },
          { label: 'Megmutatom, hogy kell igazán', needs: { trait: 'buszke' },
            result: 'Olyan tökéletesen söpörsz, hogy a gólem meghajol előtted. Kőből van, ez neki nem könnyű. Aztán neked adja az évszázadok alatt összesöpört érméket.', effect: 'silver', amount: 1.5 }
        ] },

      // ===================== CSILLAGHULLÁS-SZIRTEK =====================
      { id: 'szirtek_griffcsibe', region: 'szirtek', kind: 'esemeny', title: 'A kiesett griffcsibe',
        text: 'Pihés griffcsibe csipog a sziklán. Fent, a szirt peremén üres fészek. Az anyja valószínűleg vadászik. Valószínűleg.',
        options: [
          { label: 'Visszaviszem a fészekbe', setFlag: 'griff_segitve', check: { stat: 'fur', base: 0.6 },
            result: 'A mászás nehéz, a csibe csipked, de felérsz. A fészek szélén pár csillogó kristályszilánk hever.', effect: 'dust',
            fail: { result: 'Félúton megcsúszol, és visszahuppansz. A csibének semmi baja, neked annál inkább. Másodszorra azért sikerül.', effect: 'hurt' } },
          { label: 'Megvárom az anyját', result: 'Az anyja hamar megérkezik, és gyanakodva méreget. Aztán biccent. Közben sokat tanulsz a griffekről.', effect: 'xp' },
          { label: 'Odaadom neki a kolbászomat', needs: { trait: 'falanks' }, setFlag: 'griff_segitve',
            result: 'Nehezen válsz meg tőle. A csibe egyben lenyeli, böfög egyet, és felköhög egy csillogó kavicsot. A griffek így köszönik meg.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'szirtek_anyagriff', region: 'szirtek', kind: 'esemeny', title: 'Az anyagriff', follow: 'griff_segitve',
        text: 'Hatalmas szárnyak suhognak, és egy griff ereszkedik le eléd. A csibe anyja, és láthatóan hallott rólad. Lehajtja a fejét, és a hátára mutat.',
        options: [
          { label: 'Felülök a hátára', result: 'Fentről mindent látsz: a szörnyek ösvényeit, az őrök rejtekét. Ezzel a tudással sokkal könnyebb lesz a harc.', effect: 'blessing', amount: 1.5 },
          { label: 'Elfogadom a tollát', result: 'Aranyló tollat ad. A szirti kufárok szép summát fizetnek egy ilyenért.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'szirtek_omlo_parkany', region: 'szirtek', kind: 'csapda', title: 'Az omladozó párkány',
        text: 'A szirtfalon keskeny párkány vezet körbe. A széléről apró kövek peregnek le a mélybe. Hosszan peregnek.',
        options: [
          { label: 'Végigfutok rajta', check: { stat: 'fur', base: 0.55 },
            result: 'Mire a kövek utánad omlanak, te már a túloldalon vagy. A párkány végén egy gazdátlan erszény lapul.', effect: 'silver',
            fail: { result: 'Leszakad alattad egy darab, de egy bokorba kapaszkodva visszahúzod magad. Lehorzsolt tenyérrel, de megvagy.', effect: 'hurt' } },
          { label: 'A falhoz simulva araszolok', result: 'Lassú és ijesztő, de épségben átérsz. A fal egyik repedésében valaki pár érmét rejtett el.', effect: 'silver', amount: 0.5 },
          { label: 'Előbb lerugdosom a laza köveket', needs: { trait: 'ovatos' },
            result: 'Ahol a kövek leomlanak, kristályerek bukkannak elő, a párkány pedig biztonságosabb lett. Az óvatosság megtérült.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'szirtek_csillagporkufar', region: 'szirtek', kind: 'arus', title: 'A csillagporkufár',
        text: 'Viharvert kufár árul csillagport egy szirti pihenőn. „Frissen hullott, garantáltan égi!” A zsákja alja mintha homokos lenne.',
        options: [
          { label: 'Veszek egy marékkal', cost: 1, result: 'A por nagyobb része tényleg csillagpor. A kisebbik része homok. Ennyi belefér.', effect: 'dust' },
          { label: 'Veszek egy szélamulettet', cost: 1.5, result: 'Az amulett halkan fütyül, ha megmozdulsz. Furcsa, de a karod tőle könnyebb és gyorsabb.', effect: 'blessing', amount: 1.5 },
          { label: 'Nem kérek, köszönöm', result: 'A kufár vállat von. Közben észreveszed, hogy a zsák fele tényleg homok. Ezt jó tudni a következő vásárra.', effect: 'xp', amount: 0.5 },
          { label: 'Előbb megvizsgálom az árut', cost: 1, needs: { trait: 'ovatos' },
            result: 'Kiszúrod a homokot, a kufár pedig szégyenében a jobbik zsákból mér. Ugyanannyiért, csak bővebben.', effect: 'dust', amount: 1.5 }
        ] },

      { id: 'szirtek_bogarvonulas', region: 'szirtek', kind: 'esemeny', title: 'Kristálybogár-vonulás',
        text: 'Kristálybogarak ezrei kelnek át az ösvényen. Mindegyik páncélja másképp töri meg a holdfényt, az egész szirt szivárványban úszik.',
        options: [
          { label: 'Megvárom, míg átkelnek', result: 'Leülsz egy kőre, és gyönyörködsz. Mire az utolsó bogár is átér, kipihented magad.', effect: 'heal' },
          { label: 'Felszedek pár levedlett páncélt', result: 'Az üres páncélok könnyűek, és a markodban csillagporrá morzsolódnak.', effect: 'dust' },
          { label: 'Átsétálok a hátukon', needs: { trait: 'vakmero' },
            result: 'A bogarak meg sem érzik. Úgy lépdelsz rajtuk, mint egy szivárványhídon. Ezt kevesen mondhatják el magukról.', effect: 'xp', amount: 1.5 }
        ] },

      { id: 'szirtek_meteorko', region: 'szirtek', kind: 'szentely', title: 'A meteorkő oltára',
        text: 'Fekete meteorkő áll a szirt peremén, a felszíne még langyos. Valaki virágot hagyott a tövében.',
        options: [
          { label: 'Rátenyerelek', result: 'A kő melege átjárja a tagjaidat, a fáradtság kiolvad belőled.', effect: 'heal' },
          { label: 'Hozzáérintem a fegyveremet', result: 'A fegyvered felizzik, mintha egy darabka csillag ragadt volna rá. Egy darabig így is marad.', effect: 'blessing' },
          { label: 'Kimondom a kő égi nevét', needs: { origin: 'tanonc' },
            result: 'Tanoncként megtanultad a hullócsillagok nevét. Ahogy kimondod, a kő felragyog, és minden erejét neked adja.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'szirtek_kristalykert', region: 'szirtek', kind: 'arany', title: 'A zengő kristálykert',
        text: 'A szirten nálad is magasabb kristályok nőnek. A szél végigsimít rajtuk, és dallam szólal meg, mintha a csillagok énekelnének.',
        options: [
          { label: 'Hallgatom a dalt', result: 'A dallam végigfolyik rajtad, és minden sebed, minden fáradtságod elsimul.', effect: 'heal', amount: 1.5 },
          { label: 'Felszedek egy letört ágat', result: 'A kristályág a kezedben csillagporrá omlik. Annyi lesz belőle, hogy alig fér a tarisznyádba.', effect: 'dust', amount: 2 },
          { label: 'Megtanulom a dallamot', result: 'Mire indulsz, már fütyülni is tudod. A dallamban régi tudás rejlik, és most már a tiéd.', effect: 'xp', amount: 1.5 }
        ] },

      // ===================== ÉJKATLAN =====================
      { id: 'ejkatlan_arnyek_kerdese', region: 'ejkatlan', kind: 'rejtveny', title: 'Az árnyék kérdése',
        text: 'Egy árnyék ül az út szélén, de nincs senki, akihez tartozna. „Felelj: minél több van belőle, annál kevesebbet látsz. Mi az?”',
        options: [
          { label: '„A sötétség”', result: 'Az árnyék elégedetten bólint. „Itt aztán van belőle bőven.” Félreáll, és egy marék csillagport hagy hátra.', effect: 'dust' },
          { label: '„A pénz”', result: '„Az inkább a kalmárok baja” – mondja az árnyék. Azért továbbenged, mert jót nevetett.', effect: 'none' },
          { label: '„A fáklya”', result: 'Épp fordítva. Az árnyék sajnálkozva összemegy, és szó nélkül elenged.', effect: 'none' }
        ] },

      { id: 'ejkatlan_feregjarat', region: 'ejkatlan', kind: 'csapda', title: 'A féregjárat',
        text: 'Hullámzik a talaj a lábad alatt. Valahol mélyen egy Holdfaló féreg fúrja a járatait. Előtted megnyílik egy repedés.',
        options: [
          { label: 'Átvetődöm a repedésen', check: { stat: 'fur', base: 0.55 },
            result: 'Épp időben érsz át. A túloldalon a felszakadt föld csillagport hozott a felszínre.', effect: 'dust',
            fail: { result: 'A perem beomlik, és félig belecsúszol. Kikapaszkodsz, de a térded és a könyököd is megsínyli.', effect: 'hurt' } },
          { label: 'Messziről megkerülöm', result: 'Hosszú kerülő, de a féreg észre sem vesz. Egy kihűlt tűzrakás mellett pár érmét is találsz.', effect: 'silver', amount: 0.5 },
          { label: 'Beugrom a járatba', needs: { trait: 'vakmero' },
            result: 'A féreg épp nincs otthon. A kincsei viszont igen: fényes érmék, amiket a felszínről nyelt le. Gyorsan kimászol.', effect: 'silver', amount: 1.5 }
        ] },

      { id: 'ejkatlan_utolso_mecses', region: 'ejkatlan', kind: 'szentely', title: 'Az utolsó mécses',
        text: 'Egy fülkében mécses pislákol. Rajta kívül semmi fény nincs a környéken. A lángja aprócska, de esze ágában sincs kialudni.',
        options: [
          { label: 'Olajat töltök bele', result: 'A láng magasra csap, és egy része átkúszik a fegyveredre. Így már nem félsz a sötétben.', effect: 'blessing' },
          { label: 'Melegedem a lángjánál', result: 'Apró láng, mégis csontig átmelegít. Ide nem ér el a sötét.', effect: 'heal' },
          { label: 'Esküt teszek a lángra', needs: { trait: 'buszke' },
            result: 'Megesküszöl, hogy nem hátrálsz meg a sötét elől. A láng mintha elhinné, és veled együtt lobog tovább.', effect: 'blessing', amount: 1.5 }
        ] },

      { id: 'ejkatlan_arnyekarus', region: 'ejkatlan', kind: 'arus', title: 'Az árnyékárus',
        text: 'Hosszú, vékony árnyék köszön rád egy kőfal tövéből. „Holdfényt, bátorságot, titkokat! Jó áron, mert idelent ritka portéka.”',
        options: [
          { label: 'Veszek egy üveg holdfényt', cost: 1, result: 'Kinyitod, és a fény végigfolyik rajtad. A sebeid bezárulnak, a fáradtságod elillan.', effect: 'heal' },
          { label: 'Megveszem egy titkát', cost: 1.5, result: 'Az árnyék a füledbe súgja a katlan őreinek gyenge pontját. Hidegrázós, de hasznos.', effect: 'blessing', amount: 1.5 },
          { label: 'Kösz, inkább nem', result: 'Az árnyék sértődötten összemegy, és közben elejt egy szem csillagport. Most te vagy a magasabb.', effect: 'dust', amount: 0.5 }
        ] },

      { id: 'ejkatlan_nevtelen_vandor', region: 'ejkatlan', kind: 'esemeny', title: 'A névtelen vándor',
        text: 'Egy Üresség-vándor ül egy kövön. Nem támad, csak üres szemmel bámul maga elé. „Elfelejtettem a nevemet – mondja. – Te tudod?”',
        options: [
          { label: 'Adok neki egy új nevet', result: 'Gondolkodsz egy kicsit, aztán kimondasz egy szép nevet. A vándor ízlelgeti, és elmosolyodik. Ezt a pillanatot nem felejted el.', effect: 'xp' },
          { label: 'Mesélek neki magamról', result: 'Hallgat, bólogat, és mire a végére érsz, már nem olyan üres a tekintete. Hálából elárulja, hová rejtette a régi kincseit.', effect: 'silver' },
          { label: 'Elmondom, milyen név nélkül élni', needs: { origin: 'arva' },
            result: 'Te is a ködből jöttél, név és múlt nélkül. A vándor megérti. Megölel, és a sötétben melegség marad utána.', effect: 'heal', amount: 1.5 }
        ] },

      { id: 'ejkatlan_mecsesmano', region: 'ejkatlan', kind: 'esemeny', title: 'Az eltévedt mécsesmanó',
        text: 'Aprócska manó pityereg a sötétben, a kezében kialudt mécses. „Kialudt a lángom, és nem találok haza!”',
        options: [
          { label: 'Meggyújtom a fáklyámmal', setFlag: 'mano_langja',
            result: 'A mécses felragyog, a manó pedig örömében körbeugrál. „Elmondom mindenkinek!” – kiabálja, és elszalad. Rád is átragad a jókedve.', effect: 'heal', amount: 0.5 },
          { label: 'Megmutatom az irányt', result: 'Elmagyarázod, merre van a fény. A manó bólint, és ad egy szem csillagport. Nála ez a legnagyobb kincs.', effect: 'dust' }
        ] },

      { id: 'ejkatlan_mecsesmanok', region: 'ejkatlan', kind: 'esemeny', title: 'Mécsesmanók serege', follow: 'mano_langja',
        text: 'Apró fények gyúlnak a sötétben, egy tucat is. Mécsesmanók, és az élükön ott ugrál az, akinek meggyújtottad a lángját.',
        options: [
          { label: 'Velük tartok', result: 'Fényes kis menet kísér. A sötét lények csak messziről figyelnek, te pedig erőt merítesz a fényből.', effect: 'blessing', amount: 1.5 },
          { label: 'Kérek tőlük egy lángot', result: 'Minden manó ad egy szikrát a lángjából. Melegítenek, gyógyítanak, és nem alszanak ki.', effect: 'heal', amount: 1.5 }
        ] }
    ],

    guards: {
      'Öreg Brekus, a lápkirály': {
        intro: 'Hatalmas, mohos béka ül a láp közepén, a fején nádkorona. Unottan pislog rád, aztán megszólal: „Megint egy hős? Hát jó. Brekk.”',
        win: 'Brekus elnyúlik a sárban, és megadóan brekeg egyet. „Jól van, jól van. Ma te vagy a láp ura. Holnap megint én.”',
        lose: 'Brekus akkorát huppan melléd, hogy a hullám kimos a partra. Csuromvizesen kászálódsz fel, és jobbnak látod hazamenni.'
      },
      'Ködanya': {
        intro: 'A köd sűrűsödni kezd, és lassan magas, fátylas alakká áll össze. Nincs arca, mégis érzed, hogy mosolyog. Nem túl barátságosan.',
        win: 'Ködanya szétfoszlik, mint reggel a pára. Csak a hangja marad utána: „Ügyes vagy, kicsim. De a köd mindig visszajön.”',
        lose: 'A köd körbeölel, és mire kitisztul, a láp szélén ébredsz, betakarva. Ködanya ezek szerint mégsem olyan szívtelen.'
      },
      'Ezüstpikkelyű kígyó': {
        intro: 'A vízből lassan, tekeregve emelkedik ki egy óriási kígyó. Ezüstpikkelyein megcsillan a hold. A szeme nem pislog, és rád szegeződik.',
        win: 'A kígyó visszasiklik a mélybe. A víz tetején csak egy csillogó pikkely marad utána, mint valami búcsúajándék.',
        lose: 'A kígyó egy laza farokcsapással kipöccint a partra. Mire feltápászkodsz, már nyoma sincs. Csak a büszkeséged sajog.'
      },
      'Ezüstszarvú kos': {
        intro: 'A tisztás túlsó végén egy kos kaparja a földet. A szarva ezüstösen ragyog. Lehajtja a fejét. Ebből nem beszélgetés lesz.',
        win: 'A kos megtorpan, megrázza a fejét, és sértődötten elballag. Ilyen kitartóan még senki sem nézett vele farkasszemet.',
        lose: 'Egy jól irányzott öklelés, és már repülsz is. Puhán érkezel egy bokorba. A kos elégedetten bégetve távozik.'
      },
      'A Fenyőkirálynő': {
        intro: 'A legöregebb fenyő kérge megnyílik, és kilép belőle a Fenyőkirálynő. Tűlevélkoronája zizeg. „Ki zavarja az erdőm álmát?”',
        win: 'A királynő biccent. „Erős vagy, és tisztességesen harcoltál. Mehetsz.” A fák utat nyitnak előtted.',
        lose: 'A gyökerek gyengéden, de határozottan kitessékelnek az erdőből. Egy toboz még utánad gurul. Talán búcsúzóul.'
      },
      'Holdvadász': {
        intro: 'Köpenyes alak lép elő a fák közül, a kezében ezüstíj. „Régóta követlek – mondja. – Lássuk, mennyit érsz.”',
        win: 'A Holdvadász leereszti az íját, és elismerően biccent. „Jó préda lettél volna. Szerencsére nem az vagy.”',
        lose: 'Egy nyílvessző a fához szegezi a köpenyedet. Mire kiszabadulsz, a vadász már messze jár. Tisztességes volt: nem beléd célzott.'
      },
      'A Romok Kapuőre': {
        intro: 'A kapu két oldalán kőszobrok állnak. Az egyik megmozdul, és leporolja magát. „Jelszó?” A jelszót persze nem tudod.',
        win: 'A Kapuőr visszadermed a helyére. „A jelszó egyébként »kérem« volt” – morogja még. Na, ezt is jó tudni.',
        lose: 'A kőkéz finoman, de ellentmondást nem tűrően kitol a kapun. „Majd ha megtanultad a jelszót” – szól utánad.'
      },
      'Árnypap': {
        intro: 'Fekete csuhás alak mormol a ledőlt oltár előtt. Körülötte hajladoznak az árnyékok, mintha vele imádkoznának. Most feléd fordul.',
        win: 'Az Árnypap imája elakad, a csuhája üresen hullik a kövekre. Az árnyékok szétszaladnak, mint a megriadt macskák.',
        lose: 'Az árnyékok körülfonnak, és kituszkolnak a romok közül. Mire észhez térsz, a pap mormolása már csak távoli zümmögés.'
      },
      'Bukott lovag': {
        intro: 'Rozsdás páncélú lovag áll a csarnok közepén. A sisakrostélya mögött két halvány fény ég. Lassan feléd fordítja a kardját.',
        win: 'A lovag fél térdre ereszkedik, és leteszi a kardját. „Végre egy méltó ellenfél” – suttogja, aztán porrá omlik.',
        lose: 'A lovag egyetlen lapos csapással leültet. Többet nem üt. „Gyere vissza, ha erősebb leszel” – mondja, és visszaáll az őrhelyére.'
      },
      'A Lehullott Csillag Őre': {
        intro: 'Fénylő páncélos alak őrködik a kráter szélén. Mögötte még izzik a lehullott csillag. „Ezt a fényt senki nem viheti el.”',
        win: 'Az Őr leengedi a pajzsát. „Talán te méltó vagy rá” – mondja, és félreáll. A csillag fénye egy pillanatra rád ragyog.',
        lose: 'Az Őr pajzsa felvillan, és a vakító fénytől hátratántorodsz. Mire újra látsz, a szirt alján ülsz. Elég kínos.'
      },
      'Kristálysárkány-fióka': {
        intro: 'Kutyányi sárkány bújik elő a kristályok közül. Csilingel, ahogy mozog. Aranyos. Aztán tüzet fúj, és már kevésbé aranyos.',
        win: 'A fióka hanyatt fekszik, és kidugja a nyelvét. Sárkányul ez valószínűleg azt jelenti: „Feladom.” Vagy azt: „Vakarj meg.”',
        lose: 'A fióka addig fújja rád a szikrázó leheletét, amíg el nem menekülsz. Utánad csilingel. Nagyon úgy hangzik, mintha nevetne.'
      },
      'Griffkirály': {
        intro: 'Árnyék vetül rád, aztán egy hatalmas griff ereszkedik le a szirt csúcsára. Aranytollú, büszke, és egyáltalán nem örül neked.',
        win: 'A Griffkirály összecsukja a szárnyát, és meghajtja a fejét. Ritka pillanat: a griffek nem hajolnak meg akárki előtt.',
        lose: 'A griff a karmai közé kap, tesz veled egy tiszteletkört, aztán szépen letesz a szirt aljánál. Királyi gesztus volt.'
      },
      'Az Éjkatlan Ura': {
        intro: 'A katlan mélyén trón áll, rajta egy alak, akinek a köpenye maga az éjszaka. Felnéz rád, és kialszanak a csillagok.',
        win: 'Az Éjkatlan Ura felemelkedik a trónjáról, aztán szétfoszlik. Az égen egyenként gyúlnak ki újra a csillagok, mintha számolnák magukat.',
        lose: 'Az Úr csak felemeli a kezét, és a sötétség kisodor a katlanból. Messziről még hallod: „Majd ha készen állsz.”'
      },
      'Fekete Holdpap': {
        intro: 'Egy pap áll a fekete oltárnál, és egy sötét holdat emel a magasba. Holdfény helyett hideg árnyék árad belőle.',
        win: 'A sötét hold kicsúszik a pap kezéből, és szilánkokra törik. Egy pillanatra ezüstös fény önti el a katlant. Jólesik.',
        lose: 'A pap sötét holdja beárnyékolja az eget, és a lábad magától indul hazafelé. Csak a katlan szélén tudsz megállni.'
      },
      'Az Utolsó Árnyék': {
        intro: 'Nincs ott semmi. Aztán rájössz, hogy a saját árnyékod nem követ. Előtted áll, és pontosan úgy tartja a fegyverét, mint te.',
        win: 'Az árnyék leengedi a fegyverét, aztán halkan visszasimul a lábad elé. Mostantól megint követ, mintha mi sem történt volna.',
        lose: 'Az árnyékod a földre visz, aztán leül melléd, és megvárja, míg összeszeded magad. Együtt mentek haza. Kicsit kínos.'
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

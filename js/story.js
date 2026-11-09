(function (root) {
  var D = root.NYX.data;
  // Holdkrónika – a fő történet. A {nev} helyére a hős neve kerül.
  D.STORY = {
    characters: {
      bubo:   { name: 'Bubó', line: 'Holdbagoly és kalauz. Mindent tud a világról, csak azt nem, mikor kéne csendben maradnia.' },
      lenke:  { name: 'Lenke', line: 'Ködlápi révészlány. Ismeri a nádas összes ösvényét, és esze ágában sincs kimaradni a kalandból.' },
      ambrus: { name: 'Ambrus mester', line: 'Öreg csillagjós a Holdfény-erdőben, a Holdkrónika őrzője. Több titka van, mint szakálla.' },
      ozsvat: { name: 'A Halvány Vándor', later: { from: 5, name: 'Ozsvát' }, line: 'Csuklyás alak ezüst lámpással. Éjjelente holdfényt gyűjt, és senkinek sem mondja el, miért.' },
      csilla: { name: 'Csilla', line: 'Egy hang az Éjkatlan mélyéről. Régóta vár valakire, aki végre meghallja.' }
    },
    chapters: [
      { id: 'ch1', level: 1, region: 'kodlap', title: 'Fogyó fény a lápon',
        teaser: 'A ködlápi lámpások egymás után alszanak ki. Valami ellopja a fényüket.',
        scenes: [
          { who: null, text: 'Teliholdnak kéne lennie, de a hold fakó, mint egy kopott bádogtányér. A Ködláp szélén állsz, a csizmád már most vizes. Szép kezdet.' },
          { who: 'bubo', text: '– Huhu! Te vagy az új kalandor? Bubó vagyok, a kalauzod. Ne ijedj meg a sötéttől. Na jó, egy kicsit azért ijedj meg. Mostanában tényleg sötétebb van.' },
          { who: 'lenke', text: '– Lenke vagyok, a révész. Nálunk minden éjjel kialszik egy-két lámpás a lápon. Nem a szél fújja el őket. Valami lenyeli. Reggelre csak a kampójuk marad.' },
          { who: 'lenke', text: '– Nagyapám szerint a holdfény tartja távol a lápi dögöket. Ha a hold fakul, ők bátrabbak. Gyere, átviszlek a Nagy Zsombékhoz. Ott tűnt el a legtöbb lámpás.' },
          { who: null, text: 'A zsombék mögül két hatalmas, sárga szem villan elő. Alattuk egy még hatalmasabb száj. A száj sarkából egy lámpás kampója lóg ki.' }
        ],
        boss: { name: 'A Lámpaoltó Varangy',
          intro: 'Akkora, mint egy szénásszekér. Böfög egyet, és a böfögése halványan világít. Aztán rád mered, mintha te lennél a következő lámpás.',
          special: 'kinyújtja ragacsos nyelvét' },
        win: 'A varangy köhög, és kiköp egy rakás lámpást. Köztük más is csillan: egy ezüst lámpás letört füle, rajta apró holdjel. Bubó elkerekedett szemmel nézi. – Ilyet csak a Holdfény-erdőben készítenek.',
        lose: 'Lenke az evezőjével kihalász a vízből, mielőtt a varangy másodszor is bekapna. – Szárítkozz meg, aztán próbáld újra. A varangy nem megy sehová. Sajnos.',
        reward: 'Lenke hálából neked adja a nagyapja régi ködlámpását.' },

      { id: 'ch2', level: 5, region: 'kodlap', title: 'A Halvány Vándor',
        teaser: 'Éjfélkor valaki a tóparton áll, és a hold tükörképét meríti egy lámpásba.',
        scenes: [
          { who: null, text: 'Legutóbb legyőzted a Lámpaoltó Varangyot, és egy holdjeles ezüst lámpásdarabot találtál. A lápon azóta sem lett világosabb.' },
          { who: 'lenke', text: '– Tegnap éjjel láttam valakit a Tükör-tónál. Csuklyás volt, és egy lámpást tartott a víz fölé. A hold tükörképe meg egyszerűen belefolyt. Mint a tej a bögrébe.' },
          { who: null, text: 'Éjfél van. A parton tényleg ott áll egy alak. Amikor meglát, nem menekül. Csak leengedi a lámpását, és fáradtan rád néz a csuklya alól.' },
          { who: 'ozsvat', text: '– Ne gyere utánam. Nem rosszból csinálom, és nem is miattad. Menj haza, amíg még van, ami világítson az úton.' },
          { who: null, text: 'Eltűnik a ködben, de a parton felejt egy kis üvegcsét. Holdfény kavarog benne, és furcsa módon olyan, mintha szomorú volna.' }
        ],
        choice: { prompt: 'Az üvegcsében lopott holdfény kavarog. Mit kezdesz vele?',
          a: { label: 'Visszaengedem az égre', reply: 'Kihúzod a dugót. A fény lassan felszáll, és egy pillanatra a hold is fényesebb lesz. Bubó elérzékenyülve huhog. – Ez szép volt. Haszontalan, de szép.' },
          b: { label: 'Elviszem bizonyítéknak', reply: 'Óvatosan elteszed. Bubó bólint. – Okos. Ambrus mester majd megmondja, mi ez. Ő mindent megmond. Néha akkor is, ha nem kérdezik.' } },
        boss: { name: 'A Vándor Ködkutyája',
          intro: 'A ködből egy borjúnyi kutya formálódik. Nem ugat, csak morog, és minden morgásnál köd száll ki a pofájából. A gazdája hagyta itt, hogy ne kövesd.',
          special: 'ködöt lehel rád' },
        win: 'A ködkutya szétfoszlik, csak a nyakörve marad a sárban. Rajta egy név: Ozsvát. Bubó sokáig hallgat. – Gyere, elviszlek Ambrus mesterhez a Holdfény-erdőbe. Ezt neki látnia kell.',
        lose: 'Bubó addig huhog a ködkutya fülébe, amíg az zavartan elkocog. – Na, ezt megúsztuk. Pihenj egy kicsit, aztán mutasd meg neki, ki a kalandor ezen a lápon.',
        reward: 'Bubó a csőrével eléd tol egy kopott térképet a Holdfény-erdőről.' },

      { id: 'ch3', level: 10, region: 'holdfeny', title: 'A Holdkrónika',
        teaser: 'Az erdő mélyén áll egy torony, benne egy könyv, amely magától írja magát.',
        scenes: [
          { who: null, text: 'Legutóbb a Halvány Vándor elmenekült a lápról, a ködkutyája nyakörvén pedig egy név állt: Ozsvát. Most Ambrus mester tornyához tartasz.' },
          { who: 'ambrus', text: '– Ozsvát? Sose hallottam. – Ezt túl gyorsan mondja, és közben a szakállát gyűrögeti. – Inkább ezt nézd. A Holdkrónika. Minden éjjel a hold maga írja bele, mi történt.' },
          { who: null, text: 'A lapokon ezüst betűk derengenek. Az utolsó hét oldal viszont üres. Mintha a hold egy hétre elfelejtett volna emlékezni. Vagy nem lett volna hozzá ereje.' },
          { if: 'ch2:a', who: 'ambrus', text: '– Az üvegcse fényét visszaengedtétek az égre? Jól tettétek – bólint Ambrus. – A lopott holdfény nem maradhat a földön. Megbetegszik tőle minden, ami körülötte él.' },
          { if: 'ch2:b', who: 'ambrus', text: 'Ambrus a lámpa elé tartja az üvegcsét, és elsápad. – Ezt a fényt nem kapzsiság gyűjtötte, hanem vágyakozás. Ilyet csak az gyűjt, aki elvesztett valakit.' },
          { who: null, text: 'A torony alól vonítás hallatszik. A holdfarkasok sosem jönnek ilyen közel. Csak akkor, ha a hold már nem vigyáz rájuk.' }
        ],
        choice: { prompt: 'Ambrus a kezedbe adja a tollat. – Aki látta, hogy fogy a hold, írja be a nevét tanúnak. Beírod?',
          a: { label: 'Beírom a nevemet', reply: 'Ezüst tintával írod be a nevedet. A betűk egy pillanatra felizzanak, mintha a könyv megjegyezne. Ambrus elégedetten bólint. – A Krónika vigyáz a tanúira.' },
          b: { label: 'Inkább kimaradok belőle', reply: '– Ahogy gondolod – mondja Ambrus, és visszadugja a tollat a tartóba. – A Krónika így is figyel rád. Csak nem tudja, hogyan szólítson.' } },
        boss: { name: 'Fakószőrű Ordas',
          intro: 'A falkavezér bundája valaha ezüstösen ragyogott. Most fakó, mint a hamu, és a szemében csak düh van. A hold elengedte, és ő nem érti, miért.',
          special: 'felvonít, és rád veti magát' },
        win: 'Az Ordas megtántorodik, aztán leül, és csak néz. A dühe elpárolgott, már csak fáradt. Ambrus megsimítja a fejét. – Szegény pára. Ha a hold tovább fogy, az egész erdő így jár. Holnap elmondok valamit, {nev}.',
        lose: 'Bubó az Ordas orrára csap, és amíg az prüszköl, Ambrus felrángat a toronylépcsőn. – Most teát iszol, aztán újra próbálod. Ez a sorrend.',
        reward: 'Ambrus egy ezüstfűvel tömött kis párnát ad. – Rémálmok ellen. Lesz rá szükséged.' },

      { id: 'ch4', level: 15, region: 'holdfeny', title: 'Ambrus titka',
        teaser: 'Az öreg csillagjós végre elmondja, ki a Halvány Vándor. Nem lesz könnyű hallgatni.',
        scenes: [
          { who: null, text: 'Legutóbb megnyugtattad a fakó falkavezért, Ambrus mester pedig megígérte, hogy elárul valamit. Most a torony tetején vár rád.' },
          { who: 'ambrus', text: '– Hazudtam. Ozsvát a tanítványom volt, a legjobb, akit valaha tanítottam. Volt egy húga, Csilla. Mindenhová magával vitte, mert a kicsi úgyis mindenhová követte volna.' },
          { who: 'ambrus', text: '– Egy holdfogyatkozás éjjelén lementek az Éjkatlanba. Ozsvát a legsötétebb helyről akarta megmutatni neki a csillagokat. Csak ő jött vissza. Azóta keresi a húgát.' },
          { who: 'ambrus', text: '– Most fényt gyűjt, hogy bevilágítsa vele a katlan alját. De ha elveszi a hold fényét, a hold kialszik. És akkor semmi sem tartja vissza azt, ami a sötétben lakik.' },
          { who: 'bubo', text: '– Huhu… és ezt eddig miért nem mondta el? – Ambrus lehajtja a fejét. – Mert én tanítottam meg neki, hogyan kell holdfényt gyűjteni. Szégyelltem.' },
          { who: null, text: 'Lent recseg valami. A torony melletti öreg fenyő kérgében ezüst fény lüktet, és az ágai lassan megmozdulnak. Ozsvát holdfénygyűjtőt rejtett a fába.' }
        ],
        boss: { name: 'Gyantaszívű Öregfenyő',
          intro: 'Ötszáz éve áll itt, és eddig senkit sem bántott. Most a kérge alatt lopott holdfény ég, és a fa csapkod a fájdalomtól. Segítséget kér, csak nagyon hangosan.',
          special: 'rád zúdítja a tobozait' },
        win: 'A holdfénygyűjtő kifordul a kéregből, és a fenyő nagy sóhajjal elcsendesedik. Az aljába egy szót karcoltak: Árnyromok. Ambrus elsápad. – Hazament. Ott nőttek fel a húgával, mielőtt a város romba dőlt.',
        lose: 'Ambrus a botjával kihúz a tobozkupac alól. – A fa nem gonosz, csak fáj neki. Ezt jegyezd meg, és legközelebb okosabban üss.',
        reward: 'Ambrus odaadja a régi távcsövét. – Én már úgysem látok vele messzire.' },

      { id: 'ch5', level: 20, region: 'arnyromok', title: 'Levelek a romok közt',
        teaser: 'Az Árnyromok egyik házában valaki évek óta leveleket ír. Egyet sem küldött el.',
        scenes: [
          { who: null, text: 'Legutóbb kiderült, hogy a Vándor Ozsvát, aki az elveszett húgát, Csillát keresi. A nyom az Árnyromokba vezet, ahol egykor együtt éltek.' },
          { who: 'bubo', text: '– Huhu, nem szeretem ezt a helyet. A falon kacsingatnak a rúnák. Vagy csak én kacsingatok idegességemben? Mindegy, maradj közel.' },
          { who: null, text: 'Egy félig beomlott házban gyertyacsonkokat találsz, és egy ládát, tele levelekkel. Mindegyik így kezdődik: „Kedves Csillagom!” A legfelsőn még meg sem száradt a tinta.' },
          { who: null, text: 'A romok fölött harang kondul, pedig a toronyban évszázadok óta nincs harangozó. Minden kondulásra fakóbb lesz a hold, mintha a hang húzná le az égről.' }
        ],
        choice: { prompt: 'A legfelső levél összehajtva vár a láda tetején. Elolvasod?',
          a: { label: 'Elolvasom', reply: '„Kedves Csillagom! Ma is fényt gyűjtöttem, már nem sok kell. Ne félj a sötétben. Megígérem, most az egyszer nem késem el.” Nehéz szívvel teszed vissza.' },
          b: { label: 'Nem olvasom el', reply: 'Visszateszed a ládát úgy, ahogy volt. Ez nem a te leveled. Bubó csendben a válladra ül, és most az egyszer nem mond semmit.' } },
        boss: { name: 'A Harangkongató Kísértet',
          intro: 'Egy csontsovány szellem csüng a harangkötélen, és vigyorogva rángatja. – Fényt a harangba! A csuklyás fizet nekem! – Úgy tűnik, Ozsvát segítséget fogadott.',
          special: 'megkongatja a harangot' },
        win: 'A harang elhallgat, a kísértet szétfoszlik. A toronyból valaki lassan lesétál: Ozsvát, csuklya nélkül. Fiatalabb, mint hitted, és nagyon fáradt. – Ambrus elmondta, ugye? Akkor érted, miért nem állhatok meg.',
        lose: 'Bubó a szárnyával befogja a füledet, amíg kitámolyogsz a harang hangja elől. – Fülvédő kéne. Vagy egy nagyobb kalapács. Pihenj, aztán újra.',
        reward: 'A harang alól egy ezüstcsengettyűt hozol el. Halkan megcsendül, ha veszély közeleg.' },

      { id: 'ch6', level: 25, region: 'arnyromok', title: 'A holdtükör',
        teaser: 'Ozsvát óriási tükröt állított a romok tornyába. A hold már alig látszik.',
        scenes: [
          { who: null, text: 'Legutóbb elhallgattattad a kísértet harangját, és szemtől szemben álltál Ozsváttal. Most a romváros legmagasabb tornyában vár rád.' },
          { who: 'ozsvat', text: '– Gyere fel, ha már úgyis jössz. – A torony tetején óriási tükör áll, és lassan belefolyik a holdfény. – Holdfogyatkozáskor ez a fény leér a katlan aljáig. És akkor megtalálom.' },
          { if: 'ch5:a', who: 'ozsvat', text: 'Idézel a leveléből. Ozsvát összerezzen. – Azt nem neked írtam. – Aztán halkabban: – Ugye, hogy nem hangzik őrültségnek? Csak be akarom tartani, amit ígértem.' },
          { if: 'ch5:b', who: 'ozsvat', text: '– A leveleimet nem olvastad el. Láttam. – Ozsvát egy pillanatra elmosolyodik. – Köszönöm. Azok a levelek az egyetlenek, amik még az enyémek.' },
          { who: 'ozsvat', text: '– Hét éve minden holdfogyatkozáskor hallom a hangját a katlan felől. Ha hallom, akkor él. Te itt hagynád?' },
          { who: null, text: 'Mielőtt felelhetnél, a tükörben megmozdul valami. A te tükörképed. Csak éppen nem te mozgatod.' }
        ],
        boss: { name: 'Tükörszülött Árny',
          intro: 'Pont olyan, mint te, csak sötétebb, és sokkal magabiztosabban vigyorog. Kilép a tükörből, és lassan felemeli a fegyveredet. A tiédet. Hogy került hozzá?',
          special: 'rád veti a tükörképedet' },
        win: 'A tükör megreped, a gyűjtött fény szétfröccsen. Ozsvát felkapja a szilánkokat, és elfut. Bubó Ambrus üzenetével érkezik: – A szirtekre megy, a Csillagszívért! Ha elviszi, a hold nem gyógyul meg többé.',
        lose: 'Ozsvát ránt ki a tükörképed kezéből. – Nem akarom, hogy bajod essen. Csak azt, hogy ne állj az utamba. – Már ott sincs. Bubó szerint ez félig bocsánatkérés volt.',
        reward: 'Egy szilánk a holdtükörből. Ha belenézel, egy pillanatra a hold is visszanéz.' },

      { id: 'ch7', level: 30, region: 'szirtek', title: 'A griffek fészke',
        teaser: 'Ozsvát a lehullott csillag szívéért indult. Az út a griffek fészkein át vezet.',
        scenes: [
          { who: null, text: 'Legutóbb széttört Ozsvát holdtükre, ő pedig a Csillaghullás-szirtekre indult, hogy megszerezze a Csillagszívet.' },
          { who: 'bubo', text: '– A Csillagszív egy darab a holdból. Réges-régen pottyant le ide. Amíg itt van, a hold tudja, merre van a föld. Ha elviszik, a hold eltéved. Ilyen egyszerű. És ilyen ijesztő.' },
          { who: 'lenke', text: '– Szia! Igen, utánad jöttem. A lápon már egy lámpás sem ég, a falu fél. Nem ülök otthon, amíg te mászol. Tudok kötelet kötni, és nem félek a magasban. Nagyon.' },
          { who: null, text: 'A szirtfal fölött griffek köröznek. Aludniuk kéne, de holdfény nélkül a fiókák nem alszanak el, a szülők pedig idegesek. Mint minden szülő éjfél után.' }
        ],
        choice: { prompt: '– Veled megyek! – jelenti ki Lenke. Odafönt veszélyes, de ő makacs. Mit felelsz?',
          a: { label: 'Gyere, együtt megyünk', reply: 'Lenke felragyog, és már köti is a kötelet. – Nem fogod megbánni. Legfeljebb egy kicsit.' },
          b: { label: 'Fuss Ambrushoz, szólj neki', reply: 'Lenke duzzog, de belátja, hogy valakinek szólnia kell. – Jó. De ha nélkülem mentesz meg mindent, megsértődöm. – Azzal elindul lefelé.' } },
        boss: { name: 'Viharszárnyú Griffanya',
          intro: 'Akkora a szárnya, hogy eltakarja a fakó holdat. Rikolt egyet, a fiókái mögé húzódnak. Nem gonosz, csak anya. És te túl közel jöttél a fészekhez.',
          special: 'lecsap a felhők közül' },
        win: 'A griffanya végül megnyugszik, és hagyja, hogy elmenj a fészek mellett. A szirt pereméről már látod a krátert, a közepén vakító fény. Mellette egy csuklyás alak térdel. Ozsvát odaért.',
        lose: 'Bubó a griffanya elé röppen, és olyan mélyen hajlong előtte, hogy a griff zavarában leszáll. – Bocsánat, még tanul! – Közben te biztonságba kúszol.',
        reward: 'A griffanya egy viharszürke tollat ejt eléd. Talán bocsánatkérés, talán tisztelet.' },

      { id: 'ch8', level: 35, region: 'szirtek', title: 'A Csillagszív',
        teaser: 'A kráter közepén lüktet a hold elveszett darabja. Ozsvát már nyúl érte.',
        scenes: [
          { who: null, text: 'Legutóbb elosontál a griffek fészke mellett, és megláttad a kráterben Ozsvátot, ahogy a Csillagszív fölé hajol.' },
          { if: 'ch7:a', who: 'lenke', text: '– Én elterelem, te meg odaszaladsz! – suttogja Lenke, és mielőtt szólhatnál, már kiabál is Ozsvátnak a túloldalról. Bátor, és meglehetősen hangos.' },
          { if: 'ch7:b', who: 'ambrus', text: 'Lihegve felér Ambrus mester is, mögötte Lenke. – Lenke szólt – zihálja az öreg. – Ozsvát! Fiam, ezt ne! – Ozsvát megdermed. Évek óta nem hallotta a mestere hangját.' },
          { who: 'ozsvat', text: '– Három éjszaka múlva holdfogyatkozás. Akkor van a legközelebb a katlan alja az éghez. Ennyi idő alatt nem gyűjthetek elég fényt. Ezért kell ez. Sajnálom.' },
          { who: null, text: 'Felemeli a Csillagszívet. A kráter megrázkódik, a kövekből láng csap ki, és a láng alakot ölt. A csillag nem akarja, hogy elvigyék a szívét.' }
        ],
        boss: { name: 'Az Ébredő Csillagláng',
          intro: 'Fehéren izzó alak emelkedik ki a kráterből. Arca nincs, csak fénye. Ozsvát már a peremen fut, a láng pedig téged választ, mert te maradtál a legközelebb.',
          special: 'csillagtüzet zúdít rád' },
        win: 'A láng kialszik, de Ozsvát már eltűnt a Csillagszívvel. A hold vékony, mint egy köröm, pedig telinek kéne lennie. Bubó halkan huhog. – Az Éjkatlanba ment, {nev}. Három éjszakánk van.',
        lose: 'Lenke egy vödör havas vízzel lelocsolja a lángot, épp annyira, hogy kihúzhasson. – Erre nem számított, mi? Na, szedd össze magad.',
        reward: 'A kráter alján maradt egy szikra a Csillagszívből. Még most is meleg.' },

      { id: 'ch9', level: 40, region: 'ejkatlan', title: 'Hang a mélyből',
        teaser: 'Az Éjkatlanban még a nevedet is elfelejtheted. De valaki vár odalent.',
        scenes: [
          { who: null, text: 'Legutóbb Ozsvát elvitte a Csillagszívet, és az Éjkatlanba menekült. Három éjszaka maradt a holdfogyatkozásig.' },
          { if: 'ch3:a', who: 'bubo', text: '– Itt a sötét a neveket is elnyeli – figyelmeztet Bubó. – De a tiéd benne van a Holdkrónikában, {nev}. Odafönt emlékeznek rád. Ez akkor is világít, ha minden más kialszik.' },
          { if: 'ch3:b', who: 'bubo', text: '– Itt a sötét a neveket is elnyeli – figyelmeztet Bubó. – A tiédet nem írtad be a Krónikába, úgyhogy majd én mondogatom egész úton. {nev}, {nev}, {nev}. Szólj, ha idegesít.' },
          { who: 'csilla', text: '– Hallasz? Végre valaki, aki hall! – Gyerekhang, pedig nem lehet gyerek. – Csilla vagyok. Nem tévedtem el. Azon az éjjelen kitört a sötét, és valakinek vissza kellett tartania.' },
          { who: 'csilla', text: '– Azóta itt őrzöm. Minden fény, amit a holdtól elvesz, engem gyengít. Ha lehozza az egészet, a sötét kiszabadul. Állítsd meg. De kérlek, ne bántsd. Mindig túl makacs volt.' },
          { who: null, text: 'A hang elhalkul. A sötétből valami éhes kúszik elő, és úgy nézi a fáklyád fényét, ahogy a farkas a bárányt.' }
        ],
        choice: { prompt: 'Csilla arra kér, állítsd meg a bátyját. Hogyan tudja meg Ozsvát az igazat?',
          a: { label: 'Én mondom el neki, kerek perec', reply: '– Jó – sóhajt Csilla. – Csak azt is mondd meg neki, hogy nem haragszom rá. Soha nem haragudtam.' },
          b: { label: 'Te mondd el neki, Csilla', reply: '– Megpróbálom – suttogja Csilla. – Ha elég közel hozod, talán meghall. Évek óta kiabálok neki, csak a saját fájdalma mindig hangosabb volt.' } },
        boss: { name: 'A Feneketlen Éhség',
          intro: 'Alakja nincs, csak étvágya. Ahol megmozdul, kialszik a fény, a hang, még a gondolat is. Csilla ereje fogy, és ez a valami ezt pontosan tudja.',
          special: 'elnyeli a fényt körülötted' },
        win: 'Az Éhség visszahúzódik a mélybe, mögötte pedig lépcső bukkan elő, egyenesen le a katlan aljára. Lent ezüstös fény dereng: Ozsvát ott állítja fel a Csillagszívet. A holdból már csak egy vékony karéj maradt.',
        lose: 'Csilla az utolsó erejével fényt gyújt köréd, Bubó pedig kivezet a peremig. – Nem adjuk fel – mondja a hang. – Én hét éve kitartok.',
        reward: 'Csilla egy apró, meleg fénygolyót nyom a markodba. – Hogy ne tévedj el.' },

      { id: 'ch10', level: 45, region: 'ejkatlan', title: 'Holdfogyatkozás',
        teaser: 'Elsötétül a hold. Ma éjjel kiderül, mit ér egy ígéret, amit hét évig őriztek.',
        scenes: [
          { who: null, text: 'Legutóbb kiderült, hogy Csilla él, és ő tartja vissza a sötétet. Ozsvát a katlan alján várja a holdfogyatkozást a Csillagszívvel.' },
          { if: 'ch7:a', who: 'lenke', text: 'Lenke ott liheg melletted, kezében egy pislákoló ködlámpással. – Végig jöttem. Nem hagyom, hogy egyedül mentsd meg a világot. Így egyeztünk meg. Na jó, így én egyeztem meg.' },
          { if: 'ch7:b', who: null, text: 'Fönt, a katlan peremén Ambrus és Lenke máglyát gyújt, hogy legyen, ami hazafelé mutatja az utat. Idelentről is látszik, mint egy második hold.' },
          { if: 'ch9:a', who: 'ozsvat', text: 'Elmondod neki, hogy Csilla él, és ő őrzi a katlant. Ozsvát keserűen felnevet. – Hazudsz. – De remeg a keze, és vele együtt remeg a Csillagszív fénye is.' },
          { if: 'ch9:b', who: 'csilla', text: '– Ozsi. – Csak ennyit mond a hang, és Ozsvát térdre rogy. Hét éve nem hívta így senki. – Itt vagyok. Mindig itt voltam. Most te jössz, hogy végre meghallgass.' },
          { who: null, text: 'Ekkor a hold teljesen elsötétül. A Csillagszív fénye elhalványul, a katlan alján felnyílik a sötét, és kiemelkedik belőle valami, ami pont olyan kerek, mint a hold. Csak fekete.' }
        ],
        boss: { name: 'A Fekete Hold',
          intro: 'A fogyatkozás árnyéka testet öltött, és nem akar eltűnni, amikor a hold visszatér. Hét éve éhezik. Ozsvát melléd lép, és most először nem ellened emeli a lámpását.',
          special: 'eltakarja előled a holdat' },
        win: 'Ozsvát visszaengedi a Csillagszív fényét az égre, és a hold újra telin ragyog. Csilla kilép a sötétből, igazi lányként, nem hangként. Valakinek őriznie kell a katlant. Ozsvát marad. – Hét évig te őrizted. Most én jövök.',
        lose: 'Ozsvát fényt vet köréd a lámpásával, és visszaránt a fekete hold elől. – Most senkit sem hagyok itt. Senkit többé. Szedd össze magad, {nev}, újra megpróbáljuk.',
        reward: 'Ozsvát rád bízza a lámpását. A Krónika új sora: „A hold túloldalán valaki kopog.”' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);

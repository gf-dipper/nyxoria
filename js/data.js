/* Nyxoria RPG – játékadatok. Csak adat, logika nincs benne. */
(function (root) {
  'use strict';

  // Kasztok: alapérték + szintenkénti növekedés (játékterv, "A hős" szakasz)
  var CLASSES = {
    harcos:    { name: 'Harcos',    role: 'Elöl véd',          diff: 'könnyű',  tactic: 'kitartas', color: '#c9a45c', weapon: 'kard',
                 base: { elet: [110.4, 22.1], tam: [10.67, 2.13], ved: [12, 2.4], fur: [8, 0.8] },
                 style: 'Sokat bír, a társait védi. Biztos választás, ha nem akarsz sokat gondolkodni.',
                 basic: 'kardcsapas', skills: ['lenduletes_roham', 'pajzscsapas', 'harci_kialtas', 'kitarto_allas'],
                 paths: 'Védelmező · Dühöngő · Zászlóvivő' },
    vadasz:    { name: 'Vadász',    role: 'Messziről lő',         diff: 'könnyű',  tactic: 'roham', color: '#7fb87a', weapon: 'íj',
                 base: { elet: [93.6, 18.7], tam: [13.91, 2.78], ved: [7, 1.4], fur: [14, 1.4] },
                 style: 'Biztos, egyenletes sebzés, jó kitérés. Egyedül is magabiztos.',
                 basic: 'ijlovesz', skills: ['celzott_loves', 'kettos_loves', 'csapda', 'kitero_ugras'],
                 paths: 'Mesterlövész · Vadonjáró · Árnyvadász' },
    magus:     { name: 'Mágus',     role: 'Varázslattal sebez',             diff: 'közepes', tactic: 'roham', color: '#7f9cff', weapon: 'bot',
                 base: { elet: [89.2, 17.9], tam: [15.54, 3.11], ved: [7, 1.4], fur: [10, 1.0] },
                 style: 'Nagy robbanások, több ellenfél egyszerre. Törékeny, de messziről üt.',
                 basic: 'holdnyil', skills: ['csillagszilank', 'fagyrog', 'magikus_pajzs', 'lancvillam'],
                 paths: 'Csillagmágus · Árnymágus · Elemek ura' },
    gyogyito:  { name: 'Gyógyító',  role: 'Gyógyít és véd',                diff: 'közepes', tactic: 'kitartas', color: '#f2e2a0', weapon: 'jogar',
                 base: { elet: [102, 20.4], tam: [12.6, 2.52], ved: [9, 1.8], fur: [10, 1.0] },
                 style: 'Gyógyít és véd. Egyedül lassabb, de csapatban és bossnál aranyat ér.',
                 basic: 'fenyszuras', skills: ['gyogyito_feny', 'aldas', 'holdfeny_pajzs', 'tisztito_ima'],
                 paths: 'Holdpap · Csatapap · Csillagőrző' },
    orgyilkos: { name: 'Orgyilkos', role: 'Lesből üt nagyot',          diff: 'haladó',  tactic: 'roham', color: '#b07cff', weapon: 'tőr',
                 base: { elet: [80, 14.8], tam: [12.1, 2.29], ved: [6, 1.2], fur: [15, 1.5] },
                 style: 'Gyors és kockázatos: az első ütése a legnagyobb, de keveset bír.',
                 basic: 'tordofes', skills: ['arnyekdofes', 'fustbomba', 'meregpenge', 'hatbaszuras'],
                 paths: 'Árnyéktáncos · Méregkeverő · Fejvadász', firstStrike: 1.5 },
    idezo:     { name: 'Idéző',     role: 'Lényeket idéz',        diff: 'közepes', tactic: 'roham', color: '#8fe9ff', weapon: 'lámpás',
                 base: { elet: [88.4, 17.7], tam: [11.66, 2.33], ved: [7, 1.4], fur: [10, 1.0] },
                 style: 'Lényeket idéz, akik vele együtt ütnek. Sosem harcol egyedül.',
                 basic: 'szellemcsapas', skills: ['lelekrobbanas', 'vedoszellem', 'falka', 'lelekcsere'],
                 paths: 'Holdszellem-hívó · Csontidéző · Elemi idéző', pet: 0.5 },
    dalnok:    { name: 'Dalnok',    role: 'Erősít és gyengít',     diff: 'haladó',  tactic: 'kitartas', color: '#ffb38a', weapon: 'lant',
                 base: { elet: [95, 19], tam: [11.22, 2.24], ved: [9, 1.8], fur: [12, 1.2] },
                 style: 'Dalaival az ellenfelet gyengíti, a csapatot erősíti. Csapatban tündököl.',
                 basic: 'lantutes', skills: ['altatodal', 'harci_indulo', 'gunydal', 'hosenek'],
                 paths: 'Harci dalnok · Altatódalnok · Krónikás' },
    alakvalto: { name: 'Alakváltó', role: 'Mindenes',                  diff: 'közepes', tactic: 'kitartas', color: '#9fd17a', weapon: 'karmok',
                 base: { elet: [101.2, 20.2], tam: [11.4, 2.28], ved: [10, 2.0], fur: [9, 0.9] },
                 style: 'Medve-, farkas- vagy bagolyalakban mást tud: lehet belőle védő, sebző vagy gyógyító.',
                 basic: 'karmos_csapas', skills: ['medveforma', 'farkasforma', 'gyokerfonat', 'holdfeny_ujjaszuletes'],
                 paths: 'Medvebőrű · Farkasszívű · Bagolylelkű' }
  };
  var CLASS_ORDER = ['harcos', 'vadasz', 'magus', 'gyogyito', 'orgyilkos', 'idezo', 'dalnok', 'alakvalto'];

  // Képességszintek: alap (1.), majd 3., 6., 10., 13. szint
  var SKILL_LEVELS = [3, 6, 10, 13];

  // Képességek. type: a motor ezt érti. cd: töltés körökben.
  var SKILLS = {
    // Harcos
    kardcsapas:        { name: 'Kardcsapás', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima kardcsapás.' },
    lenduletes_roham:  { name: 'Lendületes roham', type: 'hit', mult: 2.2, cd: 3, desc: 'Nekiront az ellenfélnek, és nagyot üt (a sima ütésed kétszeresénél is többet).' },
    pajzscsapas:       { name: 'Pajzscsapás', type: 'stun', mult: 1.3, chance: 0.5, cd: 3, desc: 'Pajzzsal üt, és jó eséllyel elkábítja az ellenfelet, aki így kihagy egy kört.' },
    harci_kialtas:     { name: 'Harci kiáltás', type: 'buff', dmg: 0.35, rounds: 3, cd: 4, desc: 'Üt egyet, aztán felbátorodik: 3 körig erősebben üt (kb. harmadával).' },
    kitarto_allas:     { name: 'Kitartó állás', type: 'guard', taken: 0.60, rounds: 2, cd: 4, desc: 'Üt egyet, aztán beássa magát: 2 körig sokkal kisebbet kap (közel a felét).' },
    // Vadász
    ijlovesz:          { name: 'Íjlövés', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima nyílvessző.' },
    celzott_loves:     { name: 'Célzott lövés', type: 'hit', mult: 1.6, crit: 0.20, cd: 3, desc: 'Hosszan céloz, és nagyot lő; ilyenkor gyakrabban talál telibe.' },
    kettos_loves:      { name: 'Kettős lövés', type: 'multi', mult: 0.8, hits: 2, cd: 3, desc: 'Két nyilat lő ki gyorsan egymás után.' },
    csapda:            { name: 'Csapda', type: 'skip', mult: 0.5, cd: 5, desc: 'Csapdát vet: kis sebzés, de az ellenfél kihagy egy kört.' },
    kitero_ugras:      { name: 'Kitérő ugrás', type: 'dodge', bonus: 0.30, rounds: 2, cd: 4, desc: 'Lő, aztán hátraugrik: 2 körig könnyebben kitér az ütések elől.' },
    // Mágus
    holdnyil:          { name: 'Holdnyíl', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima varázslövés.' },
    csillagszilank:    { name: 'Csillagszilánk', type: 'hit', mult: 2.1, cd: 3, desc: 'Csillagokat hullat az ellenfélre: a sima ütésed kétszeresét sebzi.' },
    fagyrog:           { name: 'Dermesztő jég', type: 'slow', mult: 1.2, fur: 0.30, rounds: 2, cd: 3, desc: 'Jéggel üt, és megdermeszti az ellenfelet: 2 körig lassabb lesz.' },
    magikus_pajzs:     { name: 'Varázspajzs', type: 'shield', pct: 0.15, cd: 4, desc: 'Üt egyet, és varázspajzsot von maga köré, ami felfog egy jókora ütést.' },
    lancvillam:        { name: 'Láncvillám', type: 'multi', mult: 0.85, hits: 2, cd: 3, desc: 'Két villámot küld az ellenfélre.' },
    // Gyógyító
    fenyszuras:        { name: 'Fényszúrás', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima fénylándzsa.' },
    gyogyito_feny:     { name: 'Gyógyító fény', type: 'heal', pct: 0.16, mult: 1.0, cd: 3, desc: 'Üt egyet, és visszagyógyít az életéből.' },
    aldas:             { name: 'Áldás', type: 'guard', taken: 0.93, rounds: 3, cd: 4, desc: 'Üt egyet, aztán áldás védi: 3 körig kicsit kisebbet kap.' },
    holdfeny_pajzs:    { name: 'Holdfény-pajzs', type: 'shield', pct: 0.10, cd: 4, desc: 'Üt egyet, és holdfénypajzsot kap, ami felfog egy ütést.' },
    tisztito_ima:      { name: 'Tisztító ima', type: 'heal', pct: 0.05, mult: 1.0, cd: 3, desc: 'Üt egyet, és egy kicsit gyógyul.' },
    // Orgyilkos
    tordofes:          { name: 'Tőrdöfés', type: 'hit', mult: 1.0, cd: 0, desc: 'Gyors tőrdöfés; a harc első ütése nagyobbat sebez.' },
    arnyekdofes:       { name: 'Árnyékdöfés', type: 'hit', mult: 2.1, cd: 3, desc: 'Az árnyékból az ellenfél elé suhan, és nagyot döf (a sima ütése kétszeresét).' },
    fustbomba:         { name: 'Füstbomba', type: 'dodge', bonus: 0.45, rounds: 2, cd: 4, desc: 'Füstbe burkolózik: 2 körig sokkal nehezebb eltalálni.' },
    meregpenge:        { name: 'Méregpenge', type: 'dot', mult: 1.0, dot: 0.45, rounds: 3, cd: 3, desc: 'Megmérgezi az ellenfelet, aki utána még 3 körig sebződik.' },
    hatbaszuras:       { name: 'Hátbaszúrás', type: 'execute', mult: 1.7, bonusMult: 2.2, cd: 4, desc: 'Az ellenfél mögé kerül, és nagyot szúr; ha az ellenfél kábult vagy lassú, még nagyobbat.' },
    // Idéző
    szellemcsapas:     { name: 'Szellemcsapás', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima szellemcsapás; a kísérő szellem minden körben vele üt.' },
    lelekrobbanas:     { name: 'Lélekrobbanás', type: 'hit', mult: 1.4, cd: 3, desc: 'Lélekenergiát robbant az ellenfélen: nagyobbat üt a sima ütésnél.' },
    vedoszellem:       { name: 'Védőszellem', type: 'shield', pct: 0.18, cd: 4, desc: 'Üt egyet, és egy védőszellem felfog helyette egy nagy ütést.' },
    falka:             { name: 'Falka', type: 'pack', rounds: 2, cd: 5, desc: 'Üt egyet, és két szellemfarkas 2 körig vele harcol.' },
    lelekcsere:        { name: 'Lélekcsere', type: 'sacrifice', mult: 2.5, rounds: 2, cd: 5, desc: 'A kísérő szellem feláldozza magát egy hatalmas robbanással, és 2 kör múlva visszatér.' },
    // Dalnok
    lantutes:          { name: 'Lantütés', type: 'hit', mult: 1.0, cd: 0, desc: 'Rácsap a lanttal.' },
    altatodal:         { name: 'Altatódal', type: 'weaken', mult: 1.0, enemyDmg: 0.60, rounds: 2, cd: 3, desc: 'Elálmosítja az ellenfelet: 2 körig jóval kisebbeket üt.' },
    harci_indulo:      { name: 'Harci induló', type: 'buff', dmg: 0.22, rounds: 3, cd: 4, desc: 'Lelkesítő indulót játszik: 3 körig erősebben üt.' },
    gunydal:           { name: 'Gúnydal', type: 'armorbreak', mult: 1.2, ved: 0.35, rounds: 2, cd: 4, desc: 'Kigúnyolja az ellenfelet, aki dühében elfelejt védekezni: 2 körig kevesebb páncélja van.' },
    hosenek:           { name: 'Hősének', type: 'heal', pct: 0.20, mult: 1.0, cd: 5, desc: 'Hősi éneket zeng, és sokat gyógyul.' },
    // Alakváltó
    karmos_csapas:     { name: 'Karmos csapás', type: 'hit', mult: 1.0, cd: 0, desc: 'Sima karmolás.' },
    medveforma:        { name: 'Medveforma', type: 'heal', pct: 0.10, mult: 1.6, cd: 3, desc: 'Medvévé változik: nagyot üt, és kicsit gyógyul.' },
    farkasforma:       { name: 'Farkasforma', type: 'haste', fur: 0.30, rounds: 2, mult: 1.2, cd: 4, desc: 'Farkassá változik: üt, és 2 körig gyorsabb lesz.' },
    gyokerfonat:       { name: 'Gyökérfonat', type: 'skip', mult: 0.5, cd: 5, desc: 'Gyökerekkel fonja be az ellenfelet, aki kihagy egy kört.' },
    holdfeny_ujjaszuletes: { name: 'Holdfény-újjászületés', type: 'regen', pct: 0.08, rounds: 3, cd: 5, desc: 'Holdfény járja át: 3 körön át minden körben gyógyul.' }
  };

  var TACTICS = {
    roham:    { name: 'Roham', out: 1.15, inc: 1.12, desc: 'Többet ütsz, többet kapsz.' },
    kiegy:    { name: 'Kiegyensúlyozott', out: 1.0, inc: 1.0, desc: 'A biztos középút.' },
    kitartas: { name: 'Kitartás', out: 0.85, inc: 0.85, desc: 'Kevesebbet ütsz, de kevesebbet is kapsz.' }
  };

  var PEOPLES = {
    ember:        { name: 'Ember',        skin: '#e8b994', ears: 'round', note: 'Kitartó és alkalmazkodó.' },
    holdtunde:    { name: 'Holdtünde',    skin: '#b9c7f0', ears: 'pointy', note: 'Holdfényben finoman dereng a bőre.' },
    koszivu:      { name: 'Kőszívű',      skin: '#a3a1ad', ears: 'round', note: 'Bőrén kőerezet fut végig.' },
    arnyszulott:  { name: 'Árnyszülött',  skin: '#7a6ea6', ears: 'pointy', note: 'Halvány árnyék lengi körül.' },
    csillagfenyu: { name: 'Csillagfényű', skin: '#f6e7b0', ears: 'round', note: 'A szemében apró csillagok csillognak.' }
  };
  var PEOPLE_ORDER = ['ember', 'holdtunde', 'koszivu', 'arnyszulott', 'csillagfenyu'];

  var HAIR_COLORS = [['Ezüst', '#e8e8ff'], ['Éjfekete', '#24203a'], ['Gesztenye', '#7a4a2a'], ['Arany', '#e3b25a'],
                     ['Vörös', '#c2412d'], ['Holdkék', '#7f8cff'], ['Ibolya', '#b06bff'], ['Menta', '#5fd39a']];

  var ORIGINS = {
    arva:     { name: 'Ködből jött árva', line: 'Senki sem tudja, honnan jött. Ő maga sem.' },
    nemes:    { name: 'Elűzött nemes', line: 'Egykor kastélyban élt, most a csizmája is lyukas. De a tartása megmaradt.' },
    tanonc:   { name: 'Csillagjós tanonc', line: 'A mestere szerint nagy sors vár rá. A mestere sokat téved.' },
    kovacs:   { name: 'Kovács gyermeke', line: 'Mindent megjavít, ami eltörik. Főleg azt, amit ő tört el.' },
    csempesz: { name: 'Folyami csempész', line: 'Ismeri a folyó minden kanyarját és minden őrét.' },
    templom:  { name: 'A Holdtemplom neveltje', line: 'A papok szerint áldott gyermek. A papok szerint mindenki az.' }
  };
  var ORIGIN_ORDER = ['arva', 'nemes', 'tanonc', 'kovacs', 'csempesz', 'templom'];

  var TRAITS = {
    vakmero:  { name: 'Vakmerő',  win: 'Ez meg sem kottyant neki. Legalábbis ezt mondja.', lose: 'Legközelebb még nagyobb lendülettel megy neki. Ez a terve.' },
    ovatos:   { name: 'Óvatos',   win: 'Minden úgy ment, ahogy eltervezte. Háromszor is.', lose: 'Tudta, hogy ez lesz. Le is írta előre.' },
    trefas:   { name: 'Tréfás',   win: 'A győzelem után elmesélt egy viccet. Senki nem nevetett, de ő igen.', lose: 'Még a földön fekve is elsütött egy poént.' },
    kivancsi: { name: 'Kíváncsi', win: 'Győzelem után megvizsgálta a legyőzött ellenfél zsebeit. Tudományos célból.', lose: 'Legalább megtudta, milyen az, amikor nem jön össze.' },
    mogorva:  { name: 'Mogorva',  win: 'Morgott egyet. Ez nála az ünneplés.', lose: 'Morgott egyet. Ez nála a gyász.' },
    joszivu:  { name: 'Jószívű',  win: 'A végén felajánlott egy almát a legyőzött ellenfélnek.', lose: 'Nem haragszik. Nagyon nem.' },
    buszke:   { name: 'Büszke',   win: 'Kihúzta magát. Megérdemelte.', lose: 'Ezt senki nem látta. Ugye senki nem látta?' },
    almodozo: { name: 'Álmodozó', win: 'Egy pillanatra elképzelte, ahogy balladát írnak róla.', lose: 'Gondolatban már a következő kalandon jár.' },
    falanks:  { name: 'Falánk',   win: 'Az ünnepi vacsorát már tervezi.', lose: 'Erre most egy nagy tál leves kell.' },
    babonas:  { name: 'Babonás',  win: 'Szerencsehozó kavicsának köszöni. Megpuszilta.', lose: 'A fekete macska tehet róla. Biztos volt itt egy.' }
  };
  var TRAIT_ORDER = ['vakmero', 'ovatos', 'trefas', 'kivancsi', 'mogorva', 'joszivu', 'buszke', 'almodozo', 'falanks', 'babonas'];

  // Területek szintsávokkal; a motor a szörnyszint alapján választ
  var REGIONS = [
    { id: 'kodlap', name: 'Ködláp', min: 1, max: 9, scene: 'kod',
      intro: 'Sűrű köd üli meg a lápot. Valahol béka brekeg. Remélhetőleg béka.',
      monsters: ['Mocsári lidérc', 'Iszapmanó', 'Ködpók', 'Nádi farkas'],
      guards: ['Öreg Brekus, a lápkirály', 'Ködanya', 'Ezüstpikkelyű kígyó'] },
    { id: 'holdfeny', name: 'Holdfény-erdő', min: 8, max: 18, scene: 'erdo',
      intro: 'A fák között ezüst fény szűrődik át. Gyönyörű. És valami figyel.',
      monsters: ['Vándorló lidérc', 'Holdfarkas', 'Fenyőkobold', 'Éjbagoly-raj'],
      guards: ['Ezüstszarvú kos', 'A Fenyőkirálynő', 'Holdvadász'] },
    { id: 'arnyromok', name: 'Árnyromok', min: 16, max: 28, scene: 'rom',
      intro: 'Egy régi város romjai. A falakon furcsa jelek világítanak.',
      monsters: ['Árnyőr', 'Kőgólem', 'Sikoltó szellem', 'Rúnatolvaj'],
      guards: ['A Romok Kapuőre', 'Árnypap', 'Bukott lovag'] },
    { id: 'szirtek', name: 'Csillaghullás-szirtek', min: 26, max: 38, scene: 'szirt',
      intro: 'Itt hullott le egykor egy csillag. Azóta semmi sem normális.',
      monsters: ['Csillagszilánk-elementál', 'Szirti griff', 'Kristálybogár', 'Hullócsillag-szellem'],
      guards: ['A Lehullott Csillag Őre', 'Kristálysárkány-fióka', 'Griffkirály'] },
    { id: 'ejkatlan', name: 'Éjkatlan', min: 36, max: 99, scene: 'katlan',
      intro: 'A világ legsötétebb pontja. Még a hold is félve néz ide.',
      monsters: ['Éjszövő', 'Sötét lovas', 'Üresség-vándor', 'Holdfaló féreg'],
      guards: ['Az Éjkatlan Ura', 'Fekete Holdpap', 'Az Utolsó Árnyék'] }
  ];

  var MONSTER_SPECIALS = ['erősen lecsap', 'nekiront', 'dühösen támad', 'megrohamozza', 'teljes erejéből üt'];

  // Tisztáskártyák
  var CLEARING_INTROS = [
    'Egy holdfényes tisztásra érsz. Három dolgot veszel észre egyszerre, de csak egyre van időd.',
    'Az ösvény három felé ágazik. Mindegyik másféle kalandot ígér.',
    'Megállsz egy kidőlt fa mellett. Körülötted három dolog kelti fel a figyelmedet.',
    'Halk zajt hallasz, közben valami csillog a bokorban, és egy furcsa alak integet a távolból.'
  ];

  var SEARCHES = [
    { title: 'Elhagyott csónak', text: 'A parton egy félig elsüllyedt csónak. Valami csillog benne.' },
    { title: 'Régi kút', text: 'A kút mélyén halvány fény dereng. Le lehetne mászni.' },
    { title: 'Bedőlt vadászlak', text: 'A tető félig beszakadt, de a ládák még a helyükön vannak.' },
    { title: 'Mohos sírkő', text: 'A felirat már olvashatatlan, de a kő mögött mintha üreg lenne.' },
    { title: 'Kidőlt szekér', text: 'Valaki nagyon sietett innen. A rakomány egy része még itt van.' },
    { title: 'Szarkafészek', text: 'A szarkák mindent elhordanak, ami fényes. Egészen sok mindent.' },
    { title: 'Furcsa szikla', text: 'A szikla repedésében valami kék fény lüktet.' },
    { title: 'Elhagyott tábortűz', text: 'A parázs még meleg. A gazdája nem lehet messze. Vagy igen.' }
  ];

  // Események: két választással
  var EVENTS = [
    { title: 'A koronás béka', text: 'Egy béka koronát visel, és azt állítja, ő az erdő királya. Meghajolsz?',
      a: { label: 'Meghajolok', result: 'A béka elégedetten brekeg, és megáldja a kardodat. Vagy a botodat. A béka nem tudja a különbséget.', effect: 'blessing' },
      b: { label: 'Elveszem a koronát', result: 'A korona csak egy aranyozott kupak. A béka sértődötten elugrál.', effect: 'silver' } },
    { title: 'Vándor kereskedő', text: 'Egy öreg kereskedő azt mondja, minden áruja varázslatos. A legtöbb egyértelműen egy kavics.',
      a: { label: 'Veszek egy kavicsot', result: 'A kavics tényleg varázslatos! Legalábbis szépen csillog.', effect: 'dust' },
      b: { label: 'Megköszönöm, nem', result: 'A kereskedő vállat von, és odaad egy kis aprót „az udvariasságért”.', effect: 'silver' } },
    { title: 'A holdoltár', text: 'Egy mohos oltár áll a tisztás közepén. Halványan dereng.',
      a: { label: 'Letérdelek', result: 'Az oltár felizzik. Erőt érzel a karodban.', effect: 'blessing' },
      b: { label: 'Átkutatom', result: 'Az oltár mögött valaki elrejtett egy kis zsákot.', effect: 'silver' } },
    { title: 'Elveszett kisróka', text: 'Egy kisróka nyüszít egy bokor alatt. Úgy tűnik, eltévedt.',
      a: { label: 'Hazakísérem', result: 'A rókamama hálásan néz rád, és odagörget egy fényes követ.', effect: 'dust' },
      b: { label: 'Adok neki enni', result: 'A kisróka jóllakik, és követ egy darabig. Jó érzés.', effect: 'heal' } },
    { title: 'Daloló gomba', text: 'Egy óriási gomba hamisan énekel. Nagyon hamisan.',
      a: { label: 'Vele éneklek', result: 'Kettesben még hamisabb. Viszont jól érzed magad.', effect: 'heal' },
      b: { label: 'Megkérem, hogy hagyja abba', result: 'A gomba megsértődik, és elhallgat. Végre csend van. Erőt gyűjtesz.', effect: 'blessing' } },
    { title: 'A rejtvényes szellem', text: 'Egy szellem elzárja az utat: „Mi az, ami minél többet veszel el belőle, annál nagyobb?”',
      a: { label: '„A gödör”', result: 'A szellem bólint, és félreáll. Még egy kis ajándékot is hagy.', effect: 'dust' },
      b: { label: '„A szellem türelme”', result: 'A szellem nevet egyet, és elenged. Ez is egyfajta győzelem.', effect: 'silver' } },
    { title: 'A kőbe szúrt kard', text: 'Egy kard áll a kőbe szúrva. Nem túl mélyen. Kifejezetten sekélyen.',
      a: { label: 'Kihúzom', result: 'Könnyen kijön. Nem legendás, de jól jön.', effect: 'item' },
      b: { label: 'Otthagyom', result: 'Lehet, hogy csapda. Bölcs döntés, és közben találsz pár érmét.', effect: 'silver' } }
  ];

  // Tárgyak
  var SLOTS = {
    fegyver: { name: 'Fegyver' }, pancel: { name: 'Páncél' }, sisak: { name: 'Sisak' }, gyuru: { name: 'Gyűrű' }, amulett: { name: 'Amulett' }
  };
  var SLOT_ORDER = ['fegyver', 'pancel', 'sisak', 'gyuru', 'amulett'];
  // Az átlagos referenciahős alapértékének hányada (ritkaság ×1,0, +0)
  var SLOT_BUDGET = {
    fegyver: { tam: 0.20 },
    pancel:  { elet: 0.10, ved: 0.12 },
    sisak:   { ved: 0.08, elet: 0.06 },
    gyuru:   { tam: 0.06, fur: 1 },
    amulett: { elet: 0.09, fur: 1 }
  };
  var RARITIES = {
    szurke: { name: 'szürke', long: 'Szürke (hétköznapi)', mult: 1.00, affixes: 0, color: '#a9adc4' },
    zold:   { name: 'zöld',   long: 'Zöld (jobb a szokásosnál)',     mult: 1.08, affixes: 0, color: '#6fd39a' },
    kek:    { name: 'kék',    long: 'Kék (ritka)',          mult: 1.16, affixes: 1, color: '#6fa8ff' },
    lila:   { name: 'lila',   long: 'Lila (epikus)',        mult: 1.25, affixes: 2, color: '#b48cff' },
    legendas: { name: 'legendás', long: 'Legendás (aranyló)', mult: 1.40, affixes: 3, affixMult: 1.25, color: '#f2c14e' }
  };
  var RARITY_ORDER = ['szurke', 'zold', 'kek', 'lila', 'legendas'];
  var RARITY_TABLE = {
    konnyu:  { szurke: 0.60, zold: 0.30, kek: 0.09, lila: 0.01 },
    kozepes: { szurke: 0.45, zold: 0.35, kek: 0.16, lila: 0.04 },
    nehez:   { szurke: 0.30, zold: 0.35, kek: 0.25, lila: 0.10 }
  };
  // Őrzők természete: minden őrzőnek van egy sajátossága, ami ellen más képességsorrend és taktika válik be.
  // A motor (engine.js simulateFight) a mon.trait alapján alkalmazza. A számok úgy vannak hangolva, hogy átlagos
  // felállás ellen az esély a kitűzött érték körül maradjon; aki alkalmazkodik, jobb esélyt kap.
  var GUARD_TRAITS = {
    pancelos: { name: 'Páncélos', armorRounds: 3, armor: 0.3, hp: 0.9, desc: 'Az első 3 körben a páncélja a sebzés közel harmadát felfogja, utána megreped.', tip: 'A legnagyobb ütéseid általában a 4. körtől érnek a legtöbbet; a páncéltörő képesség rögtön áttöri.' },
    furge:    { name: 'Fürge', dodgeBig: 0.22, dodge: 0.02, big: 1.7, hp: 0.97, desc: 'Nehéz eltalálni: a nagy, lassú csapások elől különösen gyakran kitér.', tip: 'A sok kisebb ütés, a méreg és a kísérő lény biztosabban talál, mint egyetlen hatalmas csapás.' },
    duhongo:  { name: 'Dühöngő', rage: 0.025, start: 0.92, cap: 1.12, desc: 'Körről körre egyre nagyobbat üt.', tip: 'Minél rövidebb a harc, annál jobb: a gyors sebzés és a kábítás segít.' },
    szivos:   { name: 'Szívós', regen: 0.022, regenRounds: 8, hp: 0.9, desc: 'Az első 8 körben minden körben visszagyógyul valamennyit.', tip: 'A sok sebzés egyszerre többet ér ellene, mint a lassú őrlés.' },
    lesbol:   { name: 'Lesből támad', ambush: 1.6, rest: 0.93, desc: 'Az első csapása jóval nagyobb a szokásosnál.', tip: 'Ha az első helyen pajzs, kitérés vagy védekezés áll, az felfogja a javát.' },
    tuskes:   { name: 'Tüskés', thorns: 0.12, tam: 0.92, desc: 'Minden találatod egy részét visszakapod.', tip: 'A pajzs a tüskéket is felfogja, a gyógyítás pótolja; a méreg és a kísérő lény ütése után nem jár visszaszúrás.' }
  };
  var TRAIT_MIN_LEVEL = 6;
  var AFFIXES = [
    { id: 'dmg',   text: '+{v}% sebzés',            min: 4, max: 8 },
    { id: 'crit',  text: '+{v}% telitalálat-esély',    min: 2, max: 4 },
    { id: 'dodge', text: '+{v}% kitérés',           min: 2, max: 3 },
    { id: 'hp',    text: '+{v}% életerő',           min: 4, max: 8 },
    { id: 'heal',  text: '+{v}% gyógyítás',         min: 8, max: 15 },
    { id: 'first', text: '+{v}% sebzés az első körben', min: 10, max: 20 }
  ];
  var ITEM_NAMES = {
    fegyver: { kard: ['kard', 'pallos', 'szablya'], 'íj': ['íj', 'hosszúíj', 'számszeríj'], bot: ['bot', 'pálca', 'varázsbot'],
               jogar: ['jogar', 'szent bot', 'fénypálca'], 'tőr': ['tőr', 'penge', 'kés'], 'lámpás': ['lámpás', 'szellemlámpás', 'idézőkönyv'],
               lant: ['lant', 'hárfa', 'furulya'], karmok: ['karmok', 'agyarbuzogány', 'vadonbot'] },
    pancel:  ['köpeny', 'mellvért', 'köntös', 'zeke', 'páncéling'],
    sisak:   ['csuklya', 'sisak', 'fejpánt', 'kalap', 'korona'],
    gyuru:   ['gyűrű', 'pecsétgyűrű', 'karika'],
    amulett: ['amulett', 'talizmán', 'medál', 'nyaklánc']
  };
  var ITEM_ADJ = {
    szurke: ['Kopott', 'Egyszerű', 'Ócska', 'Megviselt', 'Viharvert'],
    zold:   ['Erős', 'Vándor', 'Megbízható', 'Ügyes', 'Edzett'],
    kek:    ['Holdfényes', 'Ezüstös', 'Ködszövésű', 'Csillagjáró', 'Rúnás'],
    lila:   ['Éjszemű', 'Csillaghulló', 'Árnyékszívű', 'Holdkoronás', 'Ősi'],
    legendas: ['Legendás']
  };
  // A legendás tárgyak saját, egyedi nevet és egy rövid leírást kapnak
  var LEGEND_NAMES = {
    fegyver: { kard: ['Hajnalhasító', 'Éjfél Pallosa', 'Csillagtörő Szablya'], 'íj': ['Holdsugár-íj', 'Szélsuttogó', 'Hullócsillag Hosszúíja'],
               bot: ['Az Örök Láng Botja', 'Ködfaló Pálca', 'Csillagszövő Bot'], jogar: ['Hajnalpír Jogar', 'Az Első Fény', 'Holdkút Jogara'],
               'tőr': ['Árnyékcsók', 'Éjféli Fullánk', 'Suttogó Penge'], 'lámpás': ['Lidércfény Lámpás', 'A Néma Könyv', 'Szellemhívó Mécses'],
               lant: ['Csillagdal Lant', 'Az Ébredés Hárfája', 'Holdhívó Furulya'], karmok: ['Farkasfog Karmok', 'Ősvadon Agyarai', 'Vihartépő Karmok'] },
    pancel:  ['Holdpáncél', 'Éjszövet Köpeny', 'Sárkánypikkely Mellvért', 'Csillagfátyol Köntös'],
    sisak:   ['Hajnalkorona', 'Viharsisak', 'Ködlátó Csuklya', 'Holdfény Diadém'],
    gyuru:   ['Az Örök Eskü Gyűrűje', 'Csillagszem Gyűrű', 'Holdkarika'],
    amulett: ['Szívkő Amulett', 'Hajnalcsillag Medál', 'Az Ősök Talizmánja']
  };
  var LEGEND_LINES = ['Régi dalok szólnak róla.', 'Aki viseli, nem fél az éjszakától.', 'Mellette a holdfény is fényesebbnek látszik.',
    'Kevesen tartották már a kezükben.', 'Minden karcolásának története van.', 'Azt mondják, a csillagok kovácsolták.', 'Halkan zümmög, ha veszély közeleg.'];
  // Ösvények a 15. szinttől: kasztonként három, mindegyik más játékstílust erősít (kb. azonos összértékkel).
  // Százalékok: elet/tam/ved/fur a jellemzőt növeli; dmg, crit, dodge, heal, first ugyanúgy hat, mint a tárgyak különleges tulajdonságai.
  var PATH_LEVEL = 15;
  var PATHS = {
    harcos:    [{ name: 'Védelmező', line: 'Pajzs és páncél, nehéz rajta sebet ejteni.', b: { ved: 10, elet: 6 } },
                { name: 'Dühöngő', line: 'Kevesebb védekezés, több és nagyobb ütés.', b: { tam: 10, crit: 4 } },
                { name: 'Zászlóvivő', line: 'Kitartó és lelkes – tovább bírja, és jobban gyógyul.', b: { elet: 6, dmg: 3, heal: 6 } }],
    vadasz:    [{ name: 'Mesterlövész', line: 'Gyakran talál telibe, és akkor nagyot sebez.', b: { crit: 8, dmg: 8 } },
                { name: 'Vadonjáró', line: 'Fürge és nehéz eltalálni.', b: { fur: 24, dodge: 6 } },
                { name: 'Árnyvadász', line: 'Az első lövése a legkeményebb.', b: { first: 30, tam: 6 } }],
    magus:     [{ name: 'Csillagmágus', line: 'Erősebb varázslatok, gyakoribb telitalálat.', b: { dmg: 8, crit: 3 } },
                { name: 'Árnymágus', line: 'Erősebb támadás, és ügyesebben tér ki.', b: { tam: 8, dodge: 3 } },
                { name: 'Elemek ura', line: 'Kiegyensúlyozott – több sebzés és több életerő.', b: { dmg: 5, elet: 7 } }],
    gyogyito:  [{ name: 'Holdpap', line: 'Sokkal erősebb gyógyítás.', b: { heal: 9, elet: 3 } },
                { name: 'Csatapap', line: 'Harcos pap, aki nagyobbat üt és jobban bírja.', b: { tam: 10, ved: 6 } },
                { name: 'Csillagőrző', line: 'Védelem és gyógyítás egyszerre.', b: { ved: 15, heal: 10 } }],
    orgyilkos: [{ name: 'Árnyéktáncos', line: 'Szinte megfoghatatlan.', b: { dodge: 8, fur: 13 } },
                { name: 'Méregkeverő', line: 'Minden szúrása többet sebez.', b: { dmg: 7, tam: 3 } },
                { name: 'Fejvadász', line: 'Az első csapás és a telitalálat mestere.', b: { first: 22, crit: 3 } }],
    idezo:     [{ name: 'Holdszellem-hívó', line: 'Szívós és jobban gyógyul.', b: { heal: 12, elet: 12 } },
                { name: 'Csontidéző', line: 'Keményebb ütések, több telitalálat.', b: { tam: 7, crit: 2 } },
                { name: 'Elemi idéző', line: 'Több sebzés és fürgeség.', b: { dmg: 7, fur: 6 } }],
    dalnok:    [{ name: 'Harci dalnok', line: 'A dal erőt ad, így nagyobbat üt.', b: { tam: 7, dmg: 3 } },
                { name: 'Altatódalnok', line: 'Ügyesen kitér, és jobban bírja a csapást.', b: { dodge: 5, ved: 8 } },
                { name: 'Krónikás', line: 'Hosszú harcokra termett – több életerő, jobb gyógyulás.', b: { elet: 6, heal: 8 } }],
    alakvalto: [{ name: 'Medvebőrű', line: 'Hatalmas és szívós.', b: { elet: 6, ved: 4 } },
                { name: 'Farkasszívű', line: 'Gyors és könyörtelen.', b: { fur: 19, crit: 6 } },
                { name: 'Bagolylelkű', line: 'Éles szemű – többet sebez, és ügyesebben tér ki.', b: { dmg: 6, dodge: 3 } }]
  };
  var MYTHIC_NAMES = ['Csillagpenge', 'Holdkorona-ékkő', 'Az Éj Lehelete', 'Ezüstszarv-amulett', 'Csillaghullás-köpeny'];
  // a mitikus tárgy helye a nevéhez illik (a penge fegyver, a köpeny páncél…)
  var MYTHIC_SLOTS = ['fegyver', 'sisak', 'amulett', 'amulett', 'pancel'];

  // Holdbagoly kalauz tippjei
  var OWL_TIPS = {
    fokepernyo: 'Huhu! Én vagyok Bubó, a kalauzod. Itt választod ki, hová indulsz. Kezdetnek a középső, AJÁNLOTT jelű jó választás.',
    expedicio:  'Minden tisztáson három kártyából választasz egyet. A harc tapasztalatot ad, a kutatás kincset, az esemény meglepetést.',
    harc:       'A harc magától zajlik. Ha unod, gyorsíthatod, vagy ugorhatsz az eredményre. A taktikát a következő útnál átállíthatod.',
    eredmeny:   'Győzelem után egy jutalmat választhatsz a háromból. A zöld nyíl azt jelzi, hogy a tárgy jobb a mostaninál.',
    hos:        'Itt látod a felszerelésedet és a képességeidet. A Csillagporral a tárgyaidat erősítheted.',
    faklya:     'Elfogyott a fáklyád? 90 percenként jön új. Ha tele van, a többletből Frissességet gyűjtesz, ami dupla tapasztalatot ad.',
    torony:     'Ez a Holdtorony. Emeletről emeletre mászol: amíg nyersz, mehetsz tovább, naponta 5 vereség fér bele. Hétfőn elölről kezded.',
    esemeny:    'Ez a heti esemény. Minden harc pontot ér, a győzelem többet. A pontokért itt lent veszed át a jutalmakat, a díjat is.',
    arena:      'Itt más hősök ellen párbajozol. A győzelem pontot hoz, a vereség elvesz belőle. Naponta 5 párbajod van.',
    csapat:     'Válassz egy-két társat, és együtt mentek egy erős őrző ellen. Nagyobb a zsákmány, és a társak gazdái is kapnak belőle.',
    ceh:        'A céhben a tagok győzelmei összeadódnak. Ha elérik a heti célt, mindenki átveheti a jutalmat.',
    bolt:       'A vándorkereskedő naponta új árut hoz Holdezüstért. Ha nem tetszik a kínálat, kis díjért újrapakoltathatod.',
    eredmenyek: 'Itt gyűlnek a trófeáid. Minden fokozatért jutalom jár, az albumba pedig a legyőzött őrzők és a ritka tárgyak kerülnek.'
  };

  // ---------- a hős kinézete (2. változat, a js/rig.js rajzolja) ----------
  // A szerver is ez alapján ellenőriz: csak az itt felsorolt értékek mehetnek át. A rig.js választéka és ez a lista
  // egyezését teszt figyeli (tools/teszt-kinezet.js).
  var LOOK_ENUMS = {
    sex: ['no', 'ferfi'], body: ['karcsu', 'atlagos', 'eros'], height: ['alacsony', 'kozepes', 'magas'], face: ['ovalis', 'kerek', 'szogletes', 'sziv', 'hosszu'],
    eyeShape: ['kerek', 'nagy', 'mandula', 'macska', 'almos', 'eles'], brows: ['ivelt', 'egyenes', 'vastag', 'vekony', 'mergues'],
    mouth: ['mosoly', 'vigyor', 'magabiztos', 'huncut', 'komoly', 'meglepett'], nose: ['pici', 'gomb', 'egyenes'],
    ears: ['ember', 'tunde', 'hosszutunde', 'roka', 'macska'],
    hairBack: ['rovid', 'vallig', 'hosszu', 'hullamos', 'copf', 'ketcopf', 'konty', 'nincs'],
    hairFront: ['egyenes', 'oldal', 'tuskes', 'kozep', 'kocos', 'hatra', 'aszim', 'katonai', 'felnyirt', 'felfesult', 'oldalvalasztott', 'irokez', 'kopasz'],
    beard: ['nincs', 'borosta', 'bajusz', 'kecske', 'teli'], horns: ['nincs', 'kicsi', 'kos', 'sarlo', 'agancs', 'demon'],
    mark: ['nincs', 'holdjel', 'csillagok', 'csikok', 'szeplok', 'forradas', 'harcifestek', 'konnycsepp'],
    feature: ['nincs', 'koerezet', 'arnyrajz', 'csillagkep', 'holdfeny'], clsAcc: ['be', 'ki'],
    headwear: ['nincs', 'diadem', 'abroncs', 'csuklya', 'suveg', 'koszoru', 'szemkoto', 'sisak'], earring: ['nincs', 'karika', 'kristaly'],
    metal: ['arany', 'ezust', 'bronz', 'ejacel'], cape: ['nincs', 'rovid', 'hosszu', 'rongyos', 'csillagos'],
    wings: ['nincs', 'tunder', 'denever', 'feny', 'toll', 'kristaly', 'lang', 'holdezust', 'csillag', 'arny'], tail: ['nincs', 'roka', 'macska', 'sarkany'], aura: ['nincs', 'holdfeny', 'parazs', 'arny', 'csillagpor', 'villam']
  };
  var LOOK_COLORS = ['skin', 'eye', 'hair', 'hornColor', 'c1', 'c2'], LOOK_COLORS_OPT = ['eye2', 'tip'], LOOK_INTS = { outfit: 1, weapon: 2 };
  var LOOK_BASE = {
    sex: 'no', body: 'atlagos', height: 'kozepes', skin: '#f0c8a8', face: 'ovalis', eyeShape: 'nagy', eye: '#3d8cf0', eye2: null, eyeGlow: false,
    brows: 'ivelt', mouth: 'mosoly', nose: 'pici', ears: 'ember', hairBack: 'vallig', hairFront: 'oldal', hair: '#e9ecff', tip: '#7f8cff',
    beard: 'nincs', horns: 'nincs', hornColor: '#efe4cc', mark: 'nincs', feature: 'nincs', clsAcc: 'be', headwear: 'nincs', earring: 'nincs',
    outfit: 0, c1: '#2c3a8c', c2: '#5a3e9e', metal: 'arany', cape: 'nincs', weapon: 0, wings: 'nincs', tail: 'nincs', aura: 'nincs'
  };
  var CLASS_LOOK = {
    harcos: { c1: '#8e2448', c2: '#4a4a5e', metal: 'ezust' }, vadasz: { c1: '#2f6b4f', c2: '#5a3e2a', metal: 'bronz' },
    magus: { c1: '#2c3a8c', c2: '#5a3e9e', metal: 'arany' }, gyogyito: { c1: '#e8e6f2', c2: '#c8a46a', metal: 'arany' },
    orgyilkos: { c1: '#24203a', c2: '#5a3e9e', metal: 'ejacel' }, idezo: { c1: '#5a3e9e', c2: '#1f6f8a', metal: 'ezust' },
    dalnok: { c1: '#8e2448', c2: '#c8a46a', metal: 'arany' }, alakvalto: { c1: '#3f5a2a', c2: '#7a5232', metal: 'bronz' }
  };
  // a faj kiinduló bőrszíne és füle (a készítőben utána szabadon módosítható)
  var PEOPLE_LOOK = {
    ember: { skin: '#f0c8a8', ears: 'ember', feature: 'nincs' }, holdtunde: { skin: '#d9def5', ears: 'tunde', feature: 'holdfeny' }, koszivu: { skin: '#a7a3ad', ears: 'ember', feature: 'koerezet' },
    arnyszulott: { skin: '#8f8aa6', ears: 'hosszutunde', feature: 'arnyrajz' }, csillagfenyu: { skin: '#f2d79a', ears: 'tunde', feature: 'csillagkep' }
  };

  root.NYX = root.NYX || {};
  root.NYX.data = {
    CLASSES: CLASSES, CLASS_ORDER: CLASS_ORDER, SKILLS: SKILLS, SKILL_LEVELS: SKILL_LEVELS, TACTICS: TACTICS,
    PEOPLES: PEOPLES, PEOPLE_ORDER: PEOPLE_ORDER, HAIR_COLORS: HAIR_COLORS, ORIGINS: ORIGINS, ORIGIN_ORDER: ORIGIN_ORDER,
    TRAITS: TRAITS, TRAIT_ORDER: TRAIT_ORDER, REGIONS: REGIONS, MONSTER_SPECIALS: MONSTER_SPECIALS,
    CLEARING_INTROS: CLEARING_INTROS, SEARCHES: SEARCHES, EVENTS: EVENTS, SLOTS: SLOTS, SLOT_ORDER: SLOT_ORDER,
    SLOT_BUDGET: SLOT_BUDGET, RARITIES: RARITIES, RARITY_ORDER: RARITY_ORDER, RARITY_TABLE: RARITY_TABLE, AFFIXES: AFFIXES, GUARD_TRAITS: GUARD_TRAITS, TRAIT_MIN_LEVEL: TRAIT_MIN_LEVEL,
    ITEM_NAMES: ITEM_NAMES, ITEM_ADJ: ITEM_ADJ, LEGEND_NAMES: LEGEND_NAMES, LEGEND_LINES: LEGEND_LINES, MYTHIC_NAMES: MYTHIC_NAMES, MYTHIC_SLOTS: MYTHIC_SLOTS, PATHS: PATHS, PATH_LEVEL: PATH_LEVEL, OWL_TIPS: OWL_TIPS,
    LOOK_ENUMS: LOOK_ENUMS, LOOK_COLORS: LOOK_COLORS, LOOK_COLORS_OPT: LOOK_COLORS_OPT, LOOK_INTS: LOOK_INTS, LOOK_BASE: LOOK_BASE, CLASS_LOOK: CLASS_LOOK, PEOPLE_LOOK: PEOPLE_LOOK
  };
})(typeof window !== 'undefined' ? window : globalThis);

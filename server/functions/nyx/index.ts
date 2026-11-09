// Nyxoria RPG – szerverfüggvény. EZT A FÁJLT A tools/build-server.js KÉSZÍTI, ne szerkeszd kézzel!
// Supabase → Edge Functions → nyx → illeszd be az egészet az index.ts helyére.
import postgres from 'npm:postgres@3.4.9';

// ===== js/data.js =====
/* Nyxoria RPG – játékadatok. Csak adat, logika nincs benne. */
(function (root) {
  'use strict';

  // Kasztok: alapérték + szintenkénti növekedés (játékterv, "A hős" szakasz)
  var CLASSES = {
    harcos:    { name: 'Harcos',    role: 'Elöl véd',          diff: 'könnyű',  tactic: 'kitartas', color: '#c9a45c', weapon: 'kard',
                 base: { elet: [120, 24], tam: [11, 2.2], ved: [12, 2.4], fur: [8, 0.8] },
                 style: 'Sokat bír, a társait védi. Biztos választás, ha nem akarsz sokat gondolkodni.',
                 basic: 'kardcsapas', skills: ['lenduletes_roham', 'pajzscsapas', 'harci_kialtas', 'kitarto_allas'],
                 paths: 'Védelmező · Dühöngő · Zászlóvivő' },
    vadasz:    { name: 'Vadász',    role: 'Messziről lő',         diff: 'könnyű',  tactic: 'roham', color: '#7fb87a', weapon: 'íj',
                 base: { elet: [90, 18], tam: [13, 2.6], ved: [7, 1.4], fur: [14, 1.4] },
                 style: 'Biztos, egyenletes sebzés, jó kitérés. Egyedül is magabiztos.',
                 basic: 'ijlovesz', skills: ['celzott_loves', 'kettos_loves', 'csapda', 'kitero_ugras'],
                 paths: 'Mesterlövész · Vadonjáró · Árnyvadász' },
    magus:     { name: 'Mágus',     role: 'Varázslattal sebez',             diff: 'közepes', tactic: 'roham', color: '#7f9cff', weapon: 'bot',
                 base: { elet: [85, 17], tam: [14, 2.8], ved: [7, 1.4], fur: [10, 1.0] },
                 style: 'Nagy robbanások, több ellenfél egyszerre. Törékeny, de messziről üt.',
                 basic: 'holdnyil', skills: ['csillagszilank', 'fagyrog', 'magikus_pajzs', 'lancvillam'],
                 paths: 'Csillagmágus · Árnymágus · Elemek ura' },
    gyogyito:  { name: 'Gyógyító',  role: 'Gyógyít és véd',                diff: 'közepes', tactic: 'kitartas', color: '#f2e2a0', weapon: 'jogar',
                 base: { elet: [100, 20], tam: [12, 2.4], ved: [9, 1.8], fur: [10, 1.0] },
                 style: 'Gyógyít és véd. Egyedül lassabb, de csapatban és bossnál aranyat ér.',
                 basic: 'fenyszuras', skills: ['gyogyito_feny', 'aldas', 'holdfeny_pajzs', 'tisztito_ima'],
                 paths: 'Holdpap · Csatapap · Csillagőrző' },
    orgyilkos: { name: 'Orgyilkos', role: 'Lesből üt nagyot',          diff: 'haladó',  tactic: 'roham', color: '#b07cff', weapon: 'tőr',
                 base: { elet: [80, 16], tam: [12, 2.4], ved: [6, 1.2], fur: [15, 1.5] },
                 style: 'Gyors és kockázatos: az első ütése a legnagyobb, de keveset bír.',
                 basic: 'tordofes', skills: ['arnyekdofes', 'fustbomba', 'meregpenge', 'hatbaszuras'],
                 paths: 'Árnyéktáncos · Méregkeverő · Fejvadász', firstStrike: 1.5 },
    idezo:     { name: 'Idéző',     role: 'Lényeket idéz',        diff: 'közepes', tactic: 'roham', color: '#8fe9ff', weapon: 'lámpás',
                 base: { elet: [85, 17], tam: [11, 2.2], ved: [7, 1.4], fur: [10, 1.0] },
                 style: 'Lényeket idéz, akik vele együtt ütnek. Sosem harcol egyedül.',
                 basic: 'szellemcsapas', skills: ['lelekrobbanas', 'vedoszellem', 'falka', 'lelekcsere'],
                 paths: 'Holdszellem-hívó · Csontidéző · Elemi idéző', pet: 0.5 },
    dalnok:    { name: 'Dalnok',    role: 'Erősít és gyengít',     diff: 'haladó',  tactic: 'kitartas', color: '#ffb38a', weapon: 'lant',
                 base: { elet: [95, 19], tam: [11, 2.2], ved: [9, 1.8], fur: [12, 1.2] },
                 style: 'Dalaival az ellenfelet gyengíti, a csapatot erősíti. Csapatban tündököl.',
                 basic: 'lantutes', skills: ['altatodal', 'harci_indulo', 'gunydal', 'hosenek'],
                 paths: 'Harci dalnok · Altatódalnok · Krónikás' },
    alakvalto: { name: 'Alakváltó', role: 'Mindenes',                  diff: 'közepes', tactic: 'kitartas', color: '#9fd17a', weapon: 'karmok',
                 base: { elet: [110, 22], tam: [12, 2.4], ved: [10, 2.0], fur: [9, 0.9] },
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
      b: { label: 'Otthagyom', result: 'Lehet, hogy csapda. Bölcs döntés, és közben találsz pár érmét.', effect: 'silver' } },
    { title: 'Alvó óriás', text: 'Egy óriás alszik az út közepén. Hangosan horkol.',
      a: { label: 'Óvatosan átlépek rajta', result: 'Sikerült! Az óriás zsebéből közben kiesett valami.', effect: 'dust' },
      b: { label: 'Megvárom, amíg felébred', result: 'Az óriás felébred, és megköszöni, hogy nem keltetted fel. Kedves óriás.', effect: 'heal' } }
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
               lant: ['lant', 'hárfa', 'furulya'], karmok: ['karmok', 'agyarnyaklánc', 'vadonbot'] },
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
    sex: ['no', 'ferfi'], body: ['karcsu', 'atlagos', 'eros'], height: ['alacsony', 'kozepes', 'magas'], face: ['ovalis', 'kerek', 'szogletes'],
    eyeShape: ['kerek', 'nagy', 'mandula', 'macska', 'almos', 'eles'], brows: ['ivelt', 'egyenes', 'vastag', 'vekony', 'mergues'],
    mouth: ['mosoly', 'vigyor', 'magabiztos', 'huncut', 'komoly', 'meglepett'], nose: ['pici', 'gomb', 'egyenes'],
    ears: ['ember', 'tunde', 'hosszutunde', 'roka', 'macska'],
    hairBack: ['rovid', 'vallig', 'hosszu', 'hullamos', 'copf', 'ketcopf', 'konty', 'nincs'],
    hairFront: ['egyenes', 'oldal', 'tuskes', 'kozep', 'kocos', 'hatra', 'aszim', 'katonai', 'felnyirt', 'felfesult', 'oldalvalasztott', 'irokez', 'kopasz'],
    beard: ['nincs', 'borosta', 'bajusz', 'kecske', 'teli'], horns: ['nincs', 'kicsi', 'kos', 'sarlo', 'agancs', 'demon'],
    mark: ['nincs', 'holdjel', 'csillagok', 'csikok', 'szeplok', 'forradas', 'harcifestek', 'konnycsepp'],
    headwear: ['nincs', 'diadem', 'abroncs', 'csuklya', 'suveg', 'koszoru', 'szemkoto', 'sisak'], earring: ['nincs', 'karika', 'kristaly'],
    metal: ['arany', 'ezust', 'bronz', 'ejacel'], cape: ['nincs', 'rovid', 'hosszu', 'rongyos', 'csillagos'],
    wings: ['nincs', 'tunder', 'denever', 'feny'], tail: ['nincs', 'roka', 'macska', 'sarkany'], aura: ['nincs', 'holdfeny', 'parazs', 'arny', 'csillagpor', 'villam']
  };
  var LOOK_COLORS = ['skin', 'eye', 'hair', 'hornColor', 'c1', 'c2'], LOOK_COLORS_OPT = ['eye2', 'tip'], LOOK_INTS = { outfit: 1, weapon: 2 };
  var LOOK_BASE = {
    sex: 'no', body: 'atlagos', height: 'kozepes', skin: '#f0c8a8', face: 'ovalis', eyeShape: 'nagy', eye: '#3d8cf0', eye2: null, eyeGlow: false,
    brows: 'ivelt', mouth: 'mosoly', nose: 'pici', ears: 'ember', hairBack: 'vallig', hairFront: 'oldal', hair: '#e9ecff', tip: '#7f8cff',
    beard: 'nincs', horns: 'nincs', hornColor: '#efe4cc', mark: 'nincs', headwear: 'nincs', earring: 'nincs',
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
    ember: { skin: '#f0c8a8', ears: 'ember' }, holdtunde: { skin: '#d9def5', ears: 'tunde' }, koszivu: { skin: '#a7a3ad', ears: 'ember' },
    arnyszulott: { skin: '#8f8aa6', ears: 'hosszutunde' }, csillagfenyu: { skin: '#f2d79a', ears: 'tunde' }
  };

  root.NYX = root.NYX || {};
  root.NYX.data = {
    CLASSES: CLASSES, CLASS_ORDER: CLASS_ORDER, SKILLS: SKILLS, SKILL_LEVELS: SKILL_LEVELS, TACTICS: TACTICS,
    PEOPLES: PEOPLES, PEOPLE_ORDER: PEOPLE_ORDER, HAIR_COLORS: HAIR_COLORS, ORIGINS: ORIGINS, ORIGIN_ORDER: ORIGIN_ORDER,
    TRAITS: TRAITS, TRAIT_ORDER: TRAIT_ORDER, REGIONS: REGIONS, MONSTER_SPECIALS: MONSTER_SPECIALS,
    CLEARING_INTROS: CLEARING_INTROS, SEARCHES: SEARCHES, EVENTS: EVENTS, SLOTS: SLOTS, SLOT_ORDER: SLOT_ORDER,
    SLOT_BUDGET: SLOT_BUDGET, RARITIES: RARITIES, RARITY_ORDER: RARITY_ORDER, RARITY_TABLE: RARITY_TABLE, AFFIXES: AFFIXES,
    ITEM_NAMES: ITEM_NAMES, ITEM_ADJ: ITEM_ADJ, LEGEND_NAMES: LEGEND_NAMES, LEGEND_LINES: LEGEND_LINES, MYTHIC_NAMES: MYTHIC_NAMES, MYTHIC_SLOTS: MYTHIC_SLOTS, PATHS: PATHS, PATH_LEVEL: PATH_LEVEL, OWL_TIPS: OWL_TIPS,
    LOOK_ENUMS: LOOK_ENUMS, LOOK_COLORS: LOOK_COLORS, LOOK_COLORS_OPT: LOOK_COLORS_OPT, LOOK_INTS: LOOK_INTS, LOOK_BASE: LOOK_BASE, CLASS_LOOK: CLASS_LOOK, PEOPLE_LOOK: PEOPLE_LOOK
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ===== js/engine.js =====
/* Nyxoria RPG – játéklogika. Tiszta függvények, nincs benne DOM.
   Később változtatás nélkül a szerverre költöztethető (Supabase Edge Function). */
(function (root) {
  'use strict';
  var D = root.NYX.data;

  // ---------- Véletlen ----------
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function newSeed(rng) { return Math.floor((rng ? rng() : Math.random()) * 4294967296) >>> 0; }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- Alapértékek ----------
  var MAX_ROUNDS = 15, GEAR_AVG = 1.25, MAX_LEVEL = 50;
  var DIFF = {
    konnyu:  { name: 'Könnyű',  band: [0.85, 0.95], target: 0.90, xp: 0.8, itemChance: 0.40, silver: 0.8, dust: 0.8 },
    kozepes: { name: 'Közepes', band: [0.65, 0.80], target: 0.72, xp: 1.0, itemChance: 0.55, silver: 1.0, dust: 1.0 },
    nehez:   { name: 'Nehéz',   band: [0.30, 0.45], target: 0.38, xp: 1.2, itemChance: 0.70, silver: 1.25, dust: 1.3 }
  };
  var DIFF_ORDER = ['konnyu', 'kozepes', 'nehez'];
  var MOONS = {
    // az erősebb holdnál a szörny erősebb, de az ajánlatok ehhez igazodnak; cserébe több Holdezüst, tapasztalat, Csillagpor és mitikus esély jár
    // risk: ennyivel kisebb a győzelmi esély az ajánlatoknál (kockázat a nagyobb jutalomért cserébe)
    ujhold:   { name: 'Újhold',   power: 1.00, dust: 1.00, mythic: 1.00, silver: 1.00, xp: 1.00, risk: 0.00, minLevel: 1 },
    felhold:  { name: 'Félhold',  power: 1.04, dust: 1.25, mythic: 1.25, silver: 1.10, xp: 1.05, risk: 0.05, minLevel: 20 },
    telihold: { name: 'Telihold', power: 1.08, dust: 1.50, mythic: 1.50, silver: 1.20, xp: 1.10, risk: 0.10, minLevel: 20 },
    verhold:  { name: 'Vérhold',  power: 1.12, dust: 2.00, mythic: 2.00, silver: 1.35, xp: 1.15, risk: 0.15, minLevel: 20 }
  };
  var MOON_ORDER = ['ujhold', 'felhold', 'telihold', 'verhold'];
  var TORCH = { max: 8, regenMs: 90 * 60 * 1000, restedMax: 16 };
  var DUST_WEEKLY = 1500, WEEK_MS = 7 * 24 * 3600 * 1000; // DUST_WEEKLY: a régi, fix keret (már csak tájékoztatásul); az új: dustCap(szint)
  // Ritkaság-kapuk és lila esély (független szimulációval hangolva: első lila kb. a 16. szinten, utána heti ~2–3, teljes lila szett kb. a 32. szint körül)
  var PITY_PURPLE = 80;   // ennyi (Közepes/Nehéz kalandos vagy csapatos) tárgysorsolásból legalább egy lila, de csak a lila kapu után
  var RARITY_GATE = { kek: 5, lila: 12, legendas: 25 };
  var LILA_CHANCE = { konnyu: [0, 0], kozepes: [0.004, 0.012], nehez: [0.015, 0.045] }; // a 12. szinttől a 40.-ig nő
  // Legendás: a 25. szinttől, főleg Nehéz kalandokból (első kb. a 28. szinten, teljes szett a 46–50. szint körül)
  var LEGEND_CHANCE = { konnyu: [0, 0], kozepes: [0.001, 0.002], nehez: [0.008, 0.016] }; // a 25. szinttől az 50.-ig nő
  var PITY_LEGEND = 300;
  // a fejlesztés felső határa ritkaság szerint
  var MAX_PLUS = { szurke: 4, zold: 6, kek: 8, lila: 10, legendas: 12 };
  var REFUND = 0.7; // szétszedéskor és eladáskor a fejlesztésre költött Csillagpor ennyi része jár vissza (a heti kereten felül)
  var MYTHIC = { base: 0.002, rampFrom: 850, guaranteed: 1000 };
  var INVENTORY_MAX = 40;

  // Referenciahős: az eredeti 4 kaszt átlaga, felszerelés nélkül
  function refBase(L) {
    return { elet: 98.75 + 19.75 * L, tam: 12.5 + 2.5 * L, ved: 8.75 + 1.75 * L, fur: 10.5 + 1.05 * L };
  }

  // a szintlépés tempója: napi egy alkalommal kb. két hónap az 50. szintig
  function xpNeeded(L) { return Math.round(24 * Math.pow(L, 1.7)); }
  function xpBase(L) { return 20 + 8 * L; }
  function silverBase(L) { return 10 + 4 * L; }

  // ---------- Tárgyak ----------
  function itemStats(item) {
    var b = refBase(item.level), budget = D.SLOT_BUDGET[item.slot];
    var m = D.RARITIES[item.rarity].mult * (1 + 0.03 * (item.plus || 0));
    var s = { elet: 0, tam: 0, ved: 0, fur: 0 };
    if (budget.tam) s.tam = b.tam * budget.tam * m;
    if (budget.elet) s.elet = b.elet * budget.elet * m;
    if (budget.ved) s.ved = b.ved * budget.ved * m;
    if (budget.fur) s.fur = b.fur * 0.10 * m;
    return s;
  }

  function itemName(rng, slot, rarity, classId) {
    var adj = pick(rng, D.ITEM_ADJ[rarity]);
    var noun;
    if (slot === 'fegyver') noun = pick(rng, D.ITEM_NAMES.fegyver[D.CLASSES[classId].weapon]);
    else noun = pick(rng, D.ITEM_NAMES[slot]);
    return adj + ' ' + noun;
  }

  var _itemCounter = 0;
  // a legendás tárgy olyan helyre kerül, ahol még nincs legendás (amíg a szett nem teljes)
  function legendSlot(rng, hero) {
    var has = {};
    D.SLOT_ORDER.forEach(function (s) { var e = hero.equipped && hero.equipped[s]; if (e && e.rarity === 'legendas') has[s] = 1; });
    (hero.inventory || []).forEach(function (it) { if (it.rarity === 'legendas') has[it.slot] = 1; });
    var free = D.SLOT_ORDER.filter(function (s) { return !has[s]; });
    return pick(rng, free.length ? free : D.SLOT_ORDER);
  }
  function rollAffix(rng, a, rarity) {
    var m = D.RARITIES[rarity].affixMult || 1;
    return { id: a.id, v: Math.round((a.min + Math.floor(rng() * (a.max - a.min + 1))) * m) };
  }
  function makeItem(rng, opts) {
    var rarity = opts.rarity || 'szurke';
    var slot = opts.slot || (rarity === 'legendas' && opts.hero ? legendSlot(rng, opts.hero) : pick(rng, D.SLOT_ORDER));
    var affixes = [];
    var pool = shuffle(rng, D.AFFIXES);
    for (var i = 0; i < D.RARITIES[rarity].affixes; i++) affixes.push(rollAffix(rng, pool[i], rarity));
    var name = opts.name, line = opts.line;
    if (!name && rarity === 'legendas') {
      var ln = slot === 'fegyver' ? D.LEGEND_NAMES.fegyver[D.CLASSES[opts.classId] ? D.CLASSES[opts.classId].weapon : 'kard'] : D.LEGEND_NAMES[slot];
      name = pick(rng, ln || D.LEGEND_NAMES.pancel);
    }
    if (!line && rarity === 'legendas') line = pick(rng, D.LEGEND_LINES);
    _itemCounter++;
    var it = {
      id: 'i' + Date.now().toString(36) + _itemCounter.toString(36) + Math.floor(rng() * 1e6).toString(36),
      slot: slot, rarity: rarity, level: Math.max(1, Math.round(opts.level || 1)), plus: 0,
      name: name || itemName(rng, slot, rarity, opts.classId), affixes: affixes,
      mythic: !!opts.mythic
    };
    if (line) it.line = line;
    return it;
  }

  function affixText(a) {
    var def = D.AFFIXES.filter(function (x) { return x.id === a.id; })[0];
    return def ? def.text.replace('{v}', a.v) : '';
  }

  // a szinthez még nem nyílt ritkaság a legjobb elérhetőre csökken
  function gateRarity(r, level) {
    if (r === 'legendas' && level < RARITY_GATE.legendas) r = 'lila';
    if (r === 'lila' && level < RARITY_GATE.lila) r = 'kek';
    if (r === 'kek' && level < RARITY_GATE.kek) r = 'zold';
    return r;
  }
  function lilaChance(diff, level) {
    var g = LILA_CHANCE[diff] || LILA_CHANCE.kozepes;
    if (level < RARITY_GATE.lila) return 0;
    var f = Math.min(1, (level - RARITY_GATE.lila) / (40 - RARITY_GATE.lila));
    return g[0] + (g[1] - g[0]) * f;
  }
  // közös tárgysorsolás minden forráshoz. opts.pity: számít-e a lila védelembe (csak Közepes/Nehéz kaland és csapat); opts.floor: legalább ilyen ritka
  function legendChance(diff, level) {
    var g = LEGEND_CHANCE[diff] || LEGEND_CHANCE.kozepes;
    if (level < RARITY_GATE.legendas) return 0;
    var f = Math.min(1, (level - RARITY_GATE.legendas) / (50 - RARITY_GATE.legendas));
    return g[0] + (g[1] - g[0]) * f;
  }
  function rollLoot(rng, diff, hero, opts) {
    opts = opts || {};
    var L = hero.level, t = D.RARITY_TABLE[diff] || D.RARITY_TABLE.kozepes;
    if (L < RARITY_GATE.lila) hero.pityPurple = 0;
    if (L < RARITY_GATE.legendas) hero.pityLegend = 0;
    // a legendás külön réteg, ezt nézzük meg először (saját védelemmel)
    var legOn = opts.pity && L >= RARITY_GATE.legendas && diff !== 'konnyu';
    if (L >= RARITY_GATE.legendas && ((legOn && (hero.pityLegend || 0) >= PITY_LEGEND - 1) || rng() < legendChance(diff, L))) {
      if (legOn) hero.pityLegend = 0;
      return 'legendas';
    }
    if (legOn) hero.pityLegend = (hero.pityLegend || 0) + 1;
    var pityOn = opts.pity && L >= RARITY_GATE.lila && diff !== 'konnyu', r;
    if (pityOn && (hero.pityPurple || 0) >= PITY_PURPLE - 1) r = 'lila';
    else {
      var x = rng(), pl = lilaChance(diff, L);
      r = x < pl ? 'lila' : x < 1 - t.szurke - t.zold ? 'kek' : x < 1 - t.szurke ? 'zold' : 'szurke';
    }
    if (opts.floor && D.RARITY_ORDER.indexOf(r) < D.RARITY_ORDER.indexOf(opts.floor)) r = opts.floor;
    r = gateRarity(r, L);
    if (pityOn) hero.pityPurple = r === 'lila' ? 0 : (hero.pityPurple || 0) + 1;
    return r;
  }

  function mythicChance(tries) {
    if (tries + 1 >= MYTHIC.guaranteed) return 1;
    if (tries < MYTHIC.rampFrom) return MYTHIC.base;
    var f = (tries - MYTHIC.rampFrom) / (MYTHIC.guaranteed - MYTHIC.rampFrom);
    return MYTHIC.base + f * f * 0.25;
  }

  // Szétszedés: Csillagpor (beleszámít a heti keretbe). Eladás: Holdezüst. Mindkettőnél visszajár a fejlesztésre költött por 70%-a (a kereten felül).
  function salvageValue(item) {
    var r = Math.max(0, D.RARITY_ORDER.indexOf(item.rarity));
    return Math.round((6 + item.level) * [1, 2, 4, 8, 16][r]);
  }
  function sellValue(item) {
    var r = Math.max(0, D.RARITY_ORDER.indexOf(item.rarity));
    return Math.max(1, Math.round(silverBase(item.level) * [0.3, 0.6, 1.2, 3, 8][r]));
  }
  function refundValue(item) { return Math.round(REFUND * (item.spent || 0)); }
  function maxPlus(item) { return MAX_PLUS[item.rarity] || 10; }
  // a következő fejlesztés ára: Csillagpor és egy kevés Holdezüst (egyre meredekebb)
  function upgradeCost(item) {
    var t = (item.plus || 0) + 1;
    if (t > maxPlus(item)) return null;
    return Math.round(20 * Math.pow(t, 1.7) * (1 + item.level / 10));
  }
  function upgradeSilver(item) {
    var t = (item.plus || 0) + 1;
    if (t > maxPlus(item)) return null;
    return Math.round(1.5 * Math.pow(t, 1.7) * silverBase(item.level));
  }

  // ---------- Hős ----------
  function newHero(opts) {
    var rng = mulberry32(opts.seed || newSeed());
    var hero = {
      name: opts.name, classId: opts.classId, people: opts.people, look: opts.look || {},
      origin: opts.origin, trait: opts.trait, motto: opts.motto || '',
      level: 1, xp: 0, silver: 50, dust: 0, tactic: D.CLASSES[opts.classId].tactic,
      loadout: [], equipped: {}, inventory: [],
      pityPurple: 0, pityLegend: 0, mythicTries: 0, stats: { expeditions: 0, wins: 0, losses: 0, bestWinNehez: 0, mythics: 0 },
      createdAt: opts.now || Date.now()
    };
    D.SLOT_ORDER.forEach(function (slot) {
      var it = makeItem(rng, { slot: slot, rarity: 'szurke', level: 1, classId: opts.classId });
      hero.equipped[slot] = it;
    });
    hero.loadout = unlockedSkills(hero).slice(1);
    return hero;
  }

  function unlockedSkills(hero) {
    var c = D.CLASSES[hero.classId], list = [c.basic];
    for (var i = 0; i < D.SKILL_LEVELS.length; i++) if (hero.level >= D.SKILL_LEVELS[i]) list.push(c.skills[i]);
    return list;
  }
  function nextSkillUnlock(hero) {
    var c = D.CLASSES[hero.classId];
    for (var i = 0; i < D.SKILL_LEVELS.length; i++) if (hero.level < D.SKILL_LEVELS[i]) return { level: D.SKILL_LEVELS[i], skill: c.skills[i] };
    return null;
  }

  function heroStats(hero, equippedOverride) {
    var c = D.CLASSES[hero.classId], L = hero.level, eq = equippedOverride || hero.equipped;
    var s = { elet: c.base.elet[0] + c.base.elet[1] * L, tam: c.base.tam[0] + c.base.tam[1] * L,
              ved: c.base.ved[0] + c.base.ved[1] * L, fur: c.base.fur[0] + c.base.fur[1] * L,
              dmg: 0, crit: 0, dodge: 0, hp: 0, heal: 0, first: 0 };
    D.SLOT_ORDER.forEach(function (slot) {
      var it = eq[slot];
      if (!it) return;
      var is = itemStats(it);
      s.elet += is.elet; s.tam += is.tam; s.ved += is.ved; s.fur += is.fur;
      (it.affixes || []).forEach(function (a) { s[a.id] += a.v; });
    });
    // ösvény (a 15. szinttől): százalékos jellemző-növelés és különleges tulajdonságok
    var path = hero.path != null && D.PATHS && D.PATHS[hero.classId] ? D.PATHS[hero.classId][hero.path] : null;
    if (path && L >= D.PATH_LEVEL) {
      var b = path.b;
      ['elet', 'tam', 'ved', 'fur'].forEach(function (k) { if (b[k]) s[k] *= 1 + b[k] / 100; });
      ['dmg', 'crit', 'dodge', 'heal', 'first'].forEach(function (k) { if (b[k]) s[k] += b[k]; });
    }
    s.elet *= 1 + s.hp / 100;
    s.level = L;
    return s;
  }

  function powerRaw(s) { // ÉLET/4 + TÁM×3 + VÉD×2 + FÜR, plusz a tárgyjellemzők becsült értéke
    return s.elet / 4 + s.tam * 3 + s.ved * 2 + s.fur + s.tam * 3 * (s.dmg + s.crit * 0.75 + s.first * 0.2) / 100 + s.elet / 4 * (s.dodge + s.heal * 0.4) / 100; }
  function power(s) { return Math.round(powerRaw(s)); }
  function lootLevel(hero, lm) { return Math.max(1, Math.min(hero.level, Math.max(hero.level - 2, Math.round(lm)))); }

  function fighterFromHero(hero, extra) {
    var s = heroStats(hero);
    extra = extra || {};
    return {
      side: 'h', name: hero.name, classId: hero.classId, level: hero.level,
      maxHp: s.elet, hpStart: s.elet * (extra.hpFactor || 1),
      tam: s.tam, ved: s.ved, fur: s.fur,
      dmgPct: s.dmg + (extra.blessing ? 10 : 0), critPct: s.crit, dodgePct: s.dodge, healPct: s.heal, firstPct: s.first,
      loadout: (hero.loadout || []).slice(), basic: D.CLASSES[hero.classId].basic,
      pet: D.CLASSES[hero.classId].pet || 0, firstStrike: D.CLASSES[hero.classId].firstStrike || 1
    };
  }

  function monsterFighter(Lm, opts) {
    opts = opts || {};
    var r = refBase(Lm), pw = opts.power || 1;
    return {
      side: 'm', name: opts.name || 'Szörny', level: Math.max(1, Math.round(Lm)), lm: Lm,
      maxHp: r.elet * GEAR_AVG * pw, hpStart: r.elet * GEAR_AVG * pw,
      tam: r.tam * GEAR_AVG * pw, ved: r.ved * GEAR_AVG, fur: r.fur,
      dmgPct: 0, critPct: 0, dodgePct: 0, healPct: 0, firstPct: 0
    };
  }

  // ---------- Harc ----------
  function scaleFor(L) { return 40 + 8 * L; }

  function simulateFight(hero, mon, tacticId, seed, withLog, opts) {
    var maxR = (opts && opts.maxRounds) || MAX_ROUNDS;
    var rng = mulberry32(seed);
    var T = D.TACTICS[tacticId] || D.TACTICS.kiegy;
    var L = Math.max(1, Math.round((hero.level + mon.level) / 2));
    var K = 50 + 10 * L, sc = scaleFor(L);
    var hp = hero.hpStart, mhp = mon.hpStart;
    var log = withLog ? [] : null;
    var st = { buffDmg: 0, buffUntil: 0, guard: 1, guardUntil: 0, shield: 0, dodge: 0, dodgeUntil: 0,
               haste: 0, hasteUntil: 0, regen: 0, regenUntil: 0, packUntil: 0, petGoneUntil: 0 };
    var ms = { stunned: false, slow: 0, slowUntil: 0, weak: 1, weakUntil: 0, armor: 0, armorUntil: 0, dot: 0, dotUntil: 0 };
    var ready = {};
    hero.loadout.forEach(function (id) { ready[id] = D.SKILLS[id].cd; });
    var firstHitDone = false, rnd, dmgDealt = 0, dmgTaken = 0, dodged = 0, crits = 0;

    function emit(e) { if (log) { e.r = rnd; e.hp = Math.max(0, hp); e.mhp = Math.max(0, mhp); log.push(e); } }

    function attackRoll(att, def, mult, opts) {
      opts = opts || {};
      var defFur = def.side === 'm' ? def.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1) : def.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var attFur = att.side === 'm' ? att.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1) : att.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var dodgeP = 0.03 + 0.12 * defFur / (defFur + sc) + def.dodgePct / 100;
      if (def.side === 'h' && rnd <= st.dodgeUntil) dodgeP += st.dodge;
      if (rng() < dodgeP) return { dmg: 0, dodge: true };
      var ved = def.ved * (def.side === 'm' && rnd <= ms.armorUntil ? 1 - ms.armor : 1);
      var d = att.tam * 2 * mult * K / (K + ved) * (0.7 + rng() * 0.6);
      d *= 1 + att.dmgPct / 100;
      if (att.side === 'h') {
        d *= T.out;
        if (rnd <= st.buffUntil) d *= 1 + st.buffDmg;
        if (rnd === 1) d *= 1 + att.firstPct / 100;
      } else {
        d *= T.inc;
        if (rnd <= ms.weakUntil) d *= ms.weak;
        if (rnd <= st.guardUntil) d *= st.guard;
      }
      var critP = 0.05 + 0.25 * attFur / (attFur + sc) + att.critPct / 100 + (opts.crit || 0);
      var crit = rng() < critP;
      if (crit) d *= 1.75;
      return { dmg: d, crit: crit };
    }

    function heroHit(mult, skillId, extra) {
      var res = attackRoll(hero, mon, mult, extra);
      if (!res.dodge && !firstHitDone && hero.firstStrike > 1) { res.dmg *= hero.firstStrike; res.first = true; }
      if (!res.dodge) firstHitDone = true;
      mhp -= res.dmg; dmgDealt += res.dmg;
      if (res.dodge) dodged++; if (res.crit) crits++;
      emit({ who: 'h', kind: 'hit', skill: skillId, dmg: Math.round(res.dmg), crit: !!res.crit, dodge: !!res.dodge, first: !!res.first });
      return res;
    }

    function heal(amount, skillId) {
      var a = amount * (1 + hero.healPct / 100);
      var before = hp; hp = Math.min(hero.maxHp, hp + a);
      emit({ who: 'h', kind: 'heal', skill: skillId, amount: Math.round(hp - before) });
    }

    function heroTurn() {
      // folyamatos hatások
      if (rnd <= st.regenUntil && st.regen > 0) heal(hero.maxHp * st.regen, 'regen');
      var skillId = null;
      for (var i = 0; i < hero.loadout.length; i++) {
        var id = hero.loadout[i];
        if (rnd >= ready[id]) { skillId = id; break; }
      }
      if (!skillId) { heroHit(1.0, hero.basic); }
      else {
        var sk = D.SKILLS[skillId];
        ready[skillId] = rnd + sk.cd;
        var mult = sk.mult == null ? 1.0 : sk.mult;
        emit({ who: 'h', kind: 'skill', skill: skillId });
        switch (sk.type) {
          case 'hit': heroHit(mult, skillId, { crit: sk.crit || 0 }); break;
          case 'multi': for (var h = 0; h < sk.hits && mhp > 0; h++) heroHit(mult, skillId); break;
          case 'stun': var r1 = heroHit(mult, skillId); if (!r1.dodge && rng() < sk.chance) { ms.stunned = true; emit({ who: 'h', kind: 'stun', skill: skillId }); } break;
          case 'skip': var r2 = heroHit(mult, skillId); ms.stunned = true; emit({ who: 'h', kind: 'stun', skill: skillId }); break;
          case 'buff': st.buffDmg = sk.dmg; st.buffUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'guard': st.guard = sk.taken; st.guardUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'shield': st.shield += hero.maxHp * sk.pct * (1 + hero.healPct / 100); emit({ who: 'h', kind: 'shield', skill: skillId, amount: Math.round(st.shield) }); heroHit(mult, skillId); break;
          case 'dodge': st.dodge = sk.bonus; st.dodgeUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'slow': ms.slow = sk.fur; ms.slowUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'dot': heroHit(mult, skillId); ms.dot = sk.dot; ms.dotUntil = rnd + sk.rounds; break;
          case 'execute': var weak = ms.stunned || rnd <= ms.slowUntil; heroHit(weak ? sk.bonusMult : mult, skillId); break;
          case 'pack': st.packUntil = rnd + sk.rounds; heroHit(1.0, skillId); break;
          case 'sacrifice': st.petGoneUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'weaken': ms.weak = sk.enemyDmg; ms.weakUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'armorbreak': ms.armor = sk.ved; ms.armorUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'heal': if (mult > 0) heroHit(mult, skillId); heal(hero.maxHp * sk.pct, skillId); break;
          case 'haste': st.haste = sk.fur; st.hasteUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          case 'regen': st.regen = sk.pct; st.regenUntil = rnd + sk.rounds; heroHit(mult, skillId); break;
          default: heroHit(mult, skillId);
        }
      }
      // idézett társ(ak)
      if (hero.pet && mhp > 0 && rnd > st.petGoneUntil) {
        var pets = rnd <= st.packUntil ? 2 : 1;
        for (var p = 0; p < pets && mhp > 0; p++) {
          var pr = attackRoll(hero, mon, hero.pet);
          mhp -= pr.dmg; dmgDealt += pr.dmg;
          emit({ who: 'pet', kind: 'hit', dmg: Math.round(pr.dmg), crit: !!pr.crit, dodge: !!pr.dodge });
        }
      }
      // méreg
      if (mhp > 0 && rnd <= ms.dotUntil && ms.dot > 0) {
        var dd = hero.tam * 2 * ms.dot * K / (K + mon.ved) * T.out;
        mhp -= dd; dmgDealt += dd;
        emit({ who: 'h', kind: 'dot', dmg: Math.round(dd) });
      }
    }

    function monTurn() {
      if (ms.stunned) { ms.stunned = false; emit({ who: 'm', kind: 'skip' }); return; }
      var special = rnd % 4 === 0;
      var res = attackRoll(mon, hero, special ? 1.6 : 1.0);
      var d = res.dmg;
      if (st.shield > 0 && d > 0) { var ab = Math.min(st.shield, d); st.shield -= ab; d -= ab; res.absorbed = Math.round(ab); }
      hp -= d; dmgTaken += d;
      emit({ who: 'm', kind: 'hit', special: special, dmg: Math.round(d), crit: !!res.crit, dodge: !!res.dodge, absorbed: res.absorbed || 0 });
    }

    for (rnd = 1; rnd <= maxR; rnd++) {
      var hf = hero.fur * (rnd <= st.hasteUntil ? 1 + st.haste : 1);
      var mf = mon.fur * (rnd <= ms.slowUntil ? 1 - ms.slow : 1);
      // a fürgébb gyakrabban kezd, de nem mindig (súlyozott véletlen): így egy hajszálnyi különbség nem dönti el a harcot
      var heroFirst = rng() < clamp(0.5 + 1.5 * (hf - mf) / Math.max(1, hf + mf), 0.2, 0.8);
      emit({ kind: 'round' });
      var order = heroFirst ? ['h', 'm'] : ['m', 'h'];
      for (var o = 0; o < 2; o++) {
        if (hp <= 0 || mhp <= 0) break;
        if (order[o] === 'h') heroTurn(); else monTurn();
      }
      if (hp <= 0 || mhp <= 0) break;
    }
    var rounds = Math.min(rnd, maxR), win, timeout = false;
    if (hp > 0 && mhp > 0) { timeout = true; win = hp / hero.maxHp > mhp / mon.maxHp; }
    else win = hp > 0;
    return { win: win, rounds: rounds, timeout: timeout, hpLeft: Math.max(0, hp), hpPct: Math.max(0, hp) / hero.maxHp,
             monHpPct: Math.max(0, mhp) / mon.maxHp, dmgDealt: dmgDealt, dmgTaken: dmgTaken, dodged: dodged, crits: crits,
             log: log, seed: seed };
  }

  function winChance(hero, mon, tacticId, n, seed) {
    var rng = mulberry32(seed || 12345), w = 0;
    for (var i = 0; i < n; i++) if (simulateFight(hero, mon, tacticId, newSeed(rng), false).win) w++;
    return w / n;
  }

  // Az a szörnyszint, amelynél a győzelmi esély a célértékhez esik (bináris keresés, közös véletlenmagokkal)
  function findMonsterLevel(heroF, tacticId, target, opts) {
    opts = opts || {};
    var lo = opts.min != null ? opts.min : 0.3, hi = opts.max != null ? opts.max : heroF.level + 35;
    var n = opts.n || 200, seed = opts.seed || 777;
    function chanceAt(lm) { return winChance(heroF, monsterFighter(lm, { power: opts.power }), tacticId, n, seed); }
    if (chanceAt(lo) < target) return lo;
    // nagyon erős hősnél a felső határ tovább tolódik, amíg az esély a cél alá nem esik
    for (var ext = 0; ext < 4 && chanceAt(hi) > target; ext++) { lo = hi; hi += 15; }
    if (chanceAt(hi) > target) return hi;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2;
      if (chanceAt(mid) > target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function regionFor(Lm, diff) {
    var lv = Math.max(1, Math.round(Lm)), fits = D.REGIONS.filter(function (r) { return lv >= r.min && lv <= r.max; });
    if (!fits.length) return lv < D.REGIONS[0].min ? D.REGIONS[0] : D.REGIONS[D.REGIONS.length - 1];
    if (fits.length > 1 && diff === 'nehez') return fits[fits.length - 1];
    return fits[0];
  }

  // ---------- Expedíció-ajánlatok ----------
  // a hold kockázata a célesélyhez arányos: a Közepesnél teljes, a Nehéznél kisebb (különben a Nehéz Vérhold csapda lenne)
  function offerTarget(d, moon) { return DIFF[d].target - (moon.risk || 0) * DIFF[d].target / DIFF.kozepes.target; }
  function makeOffers(hero, moonId, seed) {
    var rng = mulberry32(seed || newSeed());
    var heroF = fighterFromHero(hero);
    var moon = MOONS[moonId] || MOONS.ujhold;
    var used = {};
    return DIFF_ORDER.map(function (d, idx) {
      var Lm = findMonsterLevel(heroF, hero.tactic, offerTarget(d, moon), { seed: 1000 + idx, n: 240, power: moon.power });
      var region = regionFor(Lm, d);
      var guards = region.guards.filter(function (g) { return !used[g]; });
      var guard = pick(rng, guards.length ? guards : region.guards); used[guard] = 1;
      var mon = monsterFighter(Lm, { power: moon.power, name: guard });
      var chance = winChance(heroF, mon, hero.tactic, 500, 4242); // rögzített próbaharcok: ugyanarra a helyzetre mindig ugyanazt az esélyt mutatja
      return { diff: d, lm: Lm, level: mon.level, region: region.id, guard: guard, moon: moonId || 'ujhold',
               chance: chance, seed: newSeed(rng), rewards: expeditionRewardsPreview(hero, d, Lm, moonId) };
    });
  }

  // taktikaváltáskor nem jön új kaland, csak az esélyek számolódnak újra ugyanazokra az őrzőkre
  function offerChance(hero, o) {
    var moon = MOONS[o.moon] || MOONS.ujhold;
    return winChance(fighterFromHero(hero), monsterFighter(o.lm, { power: moon.power, name: o.guard }), hero.tactic, 500, 4242);
  }
  function expeditionRewardsPreview(hero, d, Lm, moonId) {
    var D2 = DIFF[d];
    var mo = MOONS[moonId || 'ujhold'] || MOONS.ujhold;
    return { xp: Math.round(xpBase(hero.level) * D2.xp * mo.xp), silver: Math.round(silverBase(Math.max(1, Lm)) * D2.silver * mo.silver), itemChance: D2.itemChance };
  }

  // ---------- Expedíció menete ----------
  function startExpedition(hero, offer, state) {
    var rng = mulberry32(offer.seed);
    var region = D.REGIONS.filter(function (r) { return r.id === offer.region; })[0];
    var exp = {
      offer: offer, step: 0, clearings: [], blessing: false, hpFactor: 1, bonusXp: 0, loot: [], silver: 0, dust: 0,
      log: [], seed: newSeed(rng), done: false
    };
    for (var i = 0; i < 3; i++) exp.clearings.push(makeClearing(rng, hero, offer, region, i));
    return exp;
  }

  function searchChance(hero) {
    var s = heroStats(hero), sc = scaleFor(hero.level);
    return clamp(0.62 + 0.3 * s.fur / (s.fur + sc * 0.5), 0.62, 0.92);
  }

  function makeClearing(rng, hero, offer, region, idx) {
    var ev = pick(rng, D.EVENTS), se = pick(rng, D.SEARCHES), mname = pick(rng, region.monsters);
    var cards = [
      { type: 'harc', title: mname, text: 'Könnyebb ellenfél, de tapasztalatot ad.', monster: mname, seed: newSeed(rng) },
      { type: 'kutatas', title: se.title, text: se.text, chance: searchChance(hero), seed: newSeed(rng) },
      { type: 'esemeny', title: ev.title, text: ev.text, event: ev, seed: newSeed(rng) }
    ];
    return { intro: pick(rng, D.CLEARING_INTROS), cards: shuffle(rng, cards) };
  }

  function expeditionMonster(exp, power) {
    var moon = MOONS[exp.offer.moon] || MOONS.ujhold;
    return monsterFighter(exp.offer.lm, { power: (power || 1) * moon.power, name: exp.offer.guard });
  }

  // Egy tisztás-kártya feloldása. Visszaadja az eredményt; az exp állapotát módosítja.
  function resolveCard(hero, exp, card, choice) {
    var rng = mulberry32(card.seed);
    var out = { type: card.type, card: card };
    var lm = exp.offer.lm;
    if (card.type === 'harc') {
      var heroF = fighterFromHero(hero, { hpFactor: 1 });
      var mon = monsterFighter(lm, { power: 0.8 * (MOONS[exp.offer.moon] || MOONS.ujhold).power, name: card.monster });
      var fight = simulateFight(heroF, mon, hero.tactic, card.seed, true);
      out.fight = fight; out.heroF = heroF; out.mon = mon;
      if (fight.win) { out.xp = Math.round(xpBase(hero.level) * 0.08); exp.bonusXp += out.xp; out.silver = Math.round(silverBase(lm) * 0.2); exp.silver += out.silver; }
      else { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.1); out.hpLoss = true; }
    } else if (card.type === 'kutatas') {
      out.success = rng() < card.chance;
      if (out.success) {
        if (rng() < 0.45 && !(exp.torchInfo && exp.torchInfo.tired)) { // fáradtan nincs tárgy, helyette Holdezüst
          var rarity = rollLoot(rng, exp.offer.diff, hero, { pity: true });
          var it = makeItem(rng, { rarity: rarity, level: lootLevel(hero, lm), classId: hero.classId, hero: hero });
          exp.loot.push(it); out.item = it;
        } else { out.silver = Math.round(silverBase(lm) * (0.6 + rng() * 0.6)); exp.silver += out.silver; }
      } else { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.04); out.hpLoss = true; } // a sikertelen kutatás csak kis sérülés (különben csapda lenne)
    } else if (card.type === 'esemeny') {
      var opt = choice === 'b' ? card.event.b : card.event.a;
      out.result = opt.result; out.effect = opt.effect;
      if (opt.effect === 'blessing') exp.blessing = true;
      else if (opt.effect === 'silver') { out.silver = Math.round(silverBase(lm) * 0.5); exp.silver += out.silver; }
      else if (opt.effect === 'dust') { out.dust = Math.round((6 + lm) * 0.8); exp.dust += out.dust; }
      else if (opt.effect === 'heal') { exp.hpFactor = Math.min(1, exp.hpFactor + 0.1); out.healed = true; }
      else if (opt.effect === 'item' && exp.torchInfo && exp.torchInfo.tired) { out.silver = Math.round(silverBase(lm) * 0.5); exp.silver += out.silver; }
      else if (opt.effect === 'item') {
        var it2 = makeItem(rng, { slot: 'fegyver', rarity: rng() < 0.5 ? 'zold' : 'szurke', level: lootLevel(hero, lm), classId: hero.classId });
        exp.loot.push(it2); out.item = it2;
      }
    }
    exp.step++;
    return out;
  }

  function guardPreview(hero, exp) {
    var heroF = fighterFromHero(hero, { hpFactor: exp.hpFactor, blessing: exp.blessing });
    var mon = expeditionMonster(exp);
    return { heroF: heroF, mon: mon, chance: winChance(heroF, mon, hero.tactic, 500, exp.seed ^ 0x5bd1e995) };
  }

  function fightGuard(hero, exp) {
    var p = guardPreview(hero, exp);
    var fight = simulateFight(p.heroF, p.mon, hero.tactic, exp.seed, true);
    return { fight: fight, heroF: p.heroF, mon: p.mon, chance: p.chance };
  }

  // A tanács vereség után: egy mondat
  function lossAdvice(hero, fight) {
    var c = D.CLASSES[hero.classId];
    if (fight.timeout) return 'Kifutottál az időből. Több sebzés kellene: próbáld a Rohamot, vagy fejleszd a fegyvered.';
    if (hero.tactic === 'roham' && fight.dmgTaken > fight.dmgDealt * 0.9) return 'Túl sok sebzést kaptál. Próbáld a Kitartást, vagy válassz Könnyebb utat.';
    if (hero.tactic === 'kitartas' && fight.monHpPct < 0.25) return 'Nagyon kevés hiányzott! A Roham taktikával talán meglett volna.';
    if (c.tactic !== hero.tactic) return 'A ' + c.name + ' kaszthoz a ' + D.TACTICS[c.tactic].name + ' taktika illik a legjobban. Érdemes kipróbálni.';
    if (fight.monHpPct < 0.2) return 'Hajszálon múlt! Egy kis szerencsével legközelebb meglesz.';
    return 'Ez most erős ellenfél volt. Fejleszd a felszerelésed Csillagporral, vagy válassz Könnyebb utat.';
  }

  // ---------- Jutalmak ----------
  function torchState(save, now) {
    var t = save.torches;
    if (t.count >= TORCH.max) {
      // tele: a túlcsorduló idő Pihent-töltéssé válik
      var extra = Math.floor((now - t.last) / TORCH.regenMs);
      if (extra > 0) { t.rested = Math.min(TORCH.restedMax, t.rested + extra); t.last += extra * TORCH.regenMs; }
    } else {
      var gained = Math.floor((now - t.last) / TORCH.regenMs);
      if (gained > 0) {
        var toFull = TORCH.max - t.count;
        if (gained >= toFull) {
          t.count = TORCH.max; t.last += toFull * TORCH.regenMs;
          var over = Math.floor((now - t.last) / TORCH.regenMs);
          if (over > 0) { t.rested = Math.min(TORCH.restedMax, t.rested + over); t.last += over * TORCH.regenMs; }
        } else { t.count += gained; t.last += gained * TORCH.regenMs; }
      }
    }
    if (t.count >= TORCH.max) t.nextIn = TORCH.regenMs - ((now - t.last) % TORCH.regenMs);
    else t.nextIn = TORCH.regenMs - (now - t.last);
    return t;
  }

  function spendTorch(save, now) {
    var t = torchState(save, now), info = { tired: false, rested: false, xpMult: 1 };
    if (t.count > 0) {
      if (t.count === TORCH.max) t.last = now; // tele volt: innentől indul az óra
      t.count--;
      if (t.rested > 0) { t.rested--; info.rested = true; info.xpMult = 2; }
      save.tiredToday = 0;
    } else {
      info.tired = true;
      var n = save.tiredRun || 0;
      info.xpMult = n < 8 ? 0.5 : n < 16 ? 0.25 : 0.1;
      save.tiredRun = n + 1;
    }
    if (!info.tired) save.tiredRun = 0;
    return info;
  }

  // heti Csillagpor-keret: 1000 + 100 × szint, minden hétfőn (budapesti idő) újraindul
  function dustCap(level) { return 1000 + 100 * Math.max(1, level || 1); }
  function weekOf(t) {
    var d = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date(t)), x = new Date(d + 'T12:00:00Z');
    return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
  }
  function dustWeek(save, now) { var wk = weekOf(now); if (save.dustWeek !== wk) { save.dustWeek = wk; save.dustWeekEarned = 0; } return wk; }
  function dustRoom(save, now) { dustWeek(save, now); return Math.max(0, dustCap(save.hero ? save.hero.level : 1) - (save.dustWeekEarned || 0)); }
  function addDust(save, hero, amount, now) {
    var room = dustRoom(save, now), got = Math.min(room, Math.max(0, Math.round(amount)));
    hero.dust += got; save.dustEarned = (save.dustEarned || 0) + got; save.dustWeekEarned = (save.dustWeekEarned || 0) + got;
    return got;
  }

  function addXp(hero, amount) {
    var ups = [];
    hero.xp += Math.round(amount);
    while (hero.level < MAX_LEVEL && hero.xp >= xpNeeded(hero.level)) {
      hero.xp -= xpNeeded(hero.level); hero.level++;
      var c = D.CLASSES[hero.classId], idx = D.SKILL_LEVELS.indexOf(hero.level), sk = idx >= 0 ? c.skills[idx] : null;
      if (sk && hero.loadout.indexOf(sk) < 0) hero.loadout.push(sk);
      ups.push({ level: hero.level, skill: sk });
    }
    if (hero.level >= MAX_LEVEL) hero.xp = Math.min(hero.xp, xpNeeded(MAX_LEVEL));
    return ups;
  }

  // Az őrző-harc utáni jutalmak kiszámítása (a választás még a játékosé)
  function finishExpedition(save, hero, exp, guardFight, torchInfo, now) {
    var rng = mulberry32(exp.seed ^ 0x9e3779b9);
    var d = exp.offer.diff, D2 = DIFF[d], lm = exp.offer.lm, moon = MOONS[exp.offer.moon] || MOONS.ujhold;
    var win = guardFight.fight.win;
    var res = { win: win, diff: d, xp: 0, silver: exp.silver, dust: 0, items: torchInfo.tired ? [] : exp.loot.slice(), choices: [], levelUps: [], mythic: null,
                xpMult: torchInfo.xpMult, rested: torchInfo.rested, tired: torchInfo.tired };
    var baseXp = xpBase(hero.level) * D2.xp * (moon.xp || 1);
    var xp = (win ? baseXp : baseXp * 0.5) + exp.bonusXp;
    res.xp = Math.round(xp * torchInfo.xpMult);
    hero.stats.expeditions++;
    if (win) {
      hero.stats.wins++;
      res.silver += Math.round(silverBase(lm) * D2.silver * (moon.silver || 1));
      res.dust = Math.round((8 + 1.5 * lm) * D2.dust * moon.dust);
      // zsákmány: 3 választás
      var itemLv = lootLevel(hero, lm);
      var choices = [];
      if (!torchInfo.tired && rng() < D2.itemChance) { // fáradtan (fáklya nélkül) nincs tárgy
        var rarity = rollLoot(rng, d, hero, { pity: true });
        choices.push({ kind: 'item', item: makeItem(rng, { rarity: rarity, level: itemLv, classId: hero.classId, hero: hero }) });
        if (rng() < 0.35) {
          var r2 = rollLoot(rng, d, hero, { pity: true });
          choices.push({ kind: 'item', item: makeItem(rng, { rarity: r2, level: itemLv, classId: hero.classId, hero: hero }) });
        }
      }
      choices.push({ kind: 'silver', amount: Math.round(silverBase(lm) * D2.silver * 1.5 * (moon.silver || 1)) });
      if (choices.length < 3) choices.push({ kind: 'dust', amount: Math.round((8 + 1.5 * lm) * D2.dust * moon.dust * 2) });
      if (choices.length < 3) choices.push({ kind: 'xp', amount: Math.round(baseXp * 0.35 * torchInfo.xpMult) });
      res.choices = choices.slice(0, 3);
      // mitikus kinézet: csak Nehéz győzelemnél
      if (d === 'nehez' && hero.level >= RARITY_GATE.legendas) { // a mitikus tárgy legendás erejű, ezért ugyanaz a kapu
        var ch = mythicChance(hero.mythicTries) * moon.mythic * (torchInfo.tired ? 0.25 : 1);
        if (rng() < ch) {
          hero.mythicTries = 0; hero.stats.mythics++;
          var mi = Math.floor(rng() * D.MYTHIC_NAMES.length);
          res.mythic = makeItem(rng, { rarity: 'legendas', line: 'Egyedi ragyogású tárgy: kevés hős látott még ilyet.', level: itemLv, classId: hero.classId, mythic: true, name: D.MYTHIC_NAMES[mi], slot: D.MYTHIC_SLOTS[mi] });
        } else hero.mythicTries++;
      }
      if (d === 'nehez') hero.stats.bestWinNehez = Math.max(hero.stats.bestWinNehez, Math.round(lm));
    } else {
      hero.stats.losses++;
      res.advice = lossAdvice(hero, guardFight.fight);
    }
    // fáradtan a Holdezüst is ugyanúgy csökken, mint a tapasztalat
    if (torchInfo.tired) {
      res.silver = Math.round(res.silver * torchInfo.xpMult);
      res.choices = res.choices.filter(function (c) { return c.kind !== 'item'; }).map(function (c) { if (c.kind === 'silver' || c.kind === 'dust') c.amount = Math.round(c.amount * torchInfo.xpMult); return c; });
    }
    hero.silver += res.silver;
    res.dust = addDust(save, hero, Math.round((res.dust + exp.dust) * (torchInfo.tired ? torchInfo.xpMult : 1)), now);
    res.levelUps = addXp(hero, res.xp);
    return res;
  }

  function applyChoice(save, hero, choice, now) {
    if (!choice) return null;
    if (choice.kind === 'item') return addItem(save, hero, choice.item, now);
    if (choice.kind === 'silver') { hero.silver += choice.amount; return { silver: choice.amount }; }
    if (choice.kind === 'dust') return { dust: addDust(save, hero, choice.amount, now) };
    if (choice.kind === 'xp') return { levelUps: addXp(hero, choice.amount), xp: choice.amount };
  }

  // Tárgy a táskába; ha be van kapcsolva, a gyengébb szürke/zöld tárgyat azonnal szétszedi
  function addItem(save, hero, item, now) {
    if (save.settings && save.settings.autoSalvage && !item.mythic && (item.rarity === 'szurke' || item.rarity === 'zold') && !isUpgrade(hero, item)) {
      return { salvaged: item, dust: addDust(save, hero, salvageValue(item), now) };
    }
    if (hero.inventory.length >= INVENTORY_MAX) {
      var rf = refundValue(item); hero.dust += rf;
      return { salvaged: item, dust: addDust(save, hero, salvageValue(item), now) + rf, full: true };
    }
    hero.inventory.push(item);
    return { added: item };
  }

  function powerDelta(hero, item) {
    var before = powerRaw(heroStats(hero));
    var eq = {}; D.SLOT_ORDER.forEach(function (s) { eq[s] = hero.equipped[s]; });
    eq[item.slot] = item;
    return powerRaw(heroStats(hero, eq)) - before;
  }
  function isUpgrade(hero, item) { return powerDelta(hero, item) > 0.05; }

  function equip(hero, itemId) {
    var idx = -1;
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) idx = i;
    if (idx < 0) return false;
    var it = hero.inventory[idx], old = hero.equipped[it.slot];
    hero.inventory.splice(idx, 1);
    hero.equipped[it.slot] = it;
    if (old) hero.inventory.push(old);
    return true;
  }

  function salvage(save, hero, itemId, now) {
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) {
      var it = hero.inventory.splice(i, 1)[0], rf = refundValue(it);
      hero.dust += rf; // a fejlesztés visszatérítése nem számít bele a heti keretbe
      return addDust(save, hero, salvageValue(it), now) + rf;
    }
    return 0;
  }
  function sell(hero, itemId) {
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) {
      var it = hero.inventory.splice(i, 1)[0], v = sellValue(it);
      hero.silver += v; hero.dust += refundValue(it); return v;
    }
    return 0;
  }

  function findItem(hero, itemId) {
    for (var s in hero.equipped) if (hero.equipped[s] && hero.equipped[s].id === itemId) return hero.equipped[s];
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) return hero.inventory[i];
    return null;
  }

  function upgrade(hero, itemId) {
    var it = findItem(hero, itemId);
    if (!it) return { ok: false, reason: 'nincs' };
    var cost = upgradeCost(it), sc = upgradeSilver(it);
    if (cost == null) return { ok: false, reason: 'max' };
    if (hero.dust < cost) return { ok: false, reason: 'kevés', cost: cost };
    if (hero.silver < sc) return { ok: false, reason: 'ezüst', cost: sc };
    hero.dust -= cost; hero.silver -= sc; it.spent = (it.spent || 0) + cost; it.plus = (it.plus || 0) + 1;
    return { ok: true, cost: cost, silver: sc, plus: it.plus, max: it.plus >= maxPlus(it) };
  }


  // Tárgyjellemző újrasorsolása Holdezüstért: 100 × tárgyszint, minden újabb alkalom +50%
  function rerollCost(item) { return Math.round(100 * item.level * Math.pow(1.5, item.rerolls || 0)); }
  function reroll(hero, itemId, rng) {
    var it = findItem(hero, itemId);
    if (!it || !it.affixes.length) return { ok: false, reason: 'nincs' };
    var cost = rerollCost(it);
    if (hero.silver < cost) return { ok: false, reason: 'kevés', cost: cost };
    rng = rng || mulberry32(newSeed());
    hero.silver -= cost; it.rerolls = (it.rerolls || 0) + 1;
    var pool = shuffle(rng, D.AFFIXES);
    it.affixes = it.affixes.map(function (_, i) { return rollAffix(rng, pool[i], it.rarity); });
    return { ok: true, cost: cost };
  }


  // ---------- Heti világboss ----------
  // Egy ütés: 3 körös harc a boss ellen; a kiosztott sebzés számít.
  function bossFighter(level, opts) {
    opts = opts || {};
    var m = monsterFighter(level, { power: 1.15 * (opts.rage ? 1.2 : 1), name: opts.name || 'Heti szörny' });
    m.maxHp = m.hpStart = 1e12;
    return m;
  }
  function bossHit(heroF, bossF, tacticId, seed, opts) {
    opts = opts || {};
    var f = simulateFight(heroF, bossF, tacticId, seed, !!opts.log, { maxRounds: 3 });
    var mult = (opts.weakness && opts.weakness === tacticId ? 1.3 : 1) * (1 + (opts.bonusPct || 0) / 100);
    f.damage = Math.round(f.dmgDealt * mult);
    f.weak = mult > 1.0001 && opts.weakness === tacticId;
    return f;
  }
  // Átlagos ütés a medián szinten, átlagos (szürke, azonos szintű) felszereléssel, mind a 8 kaszttal
  function averageBossHit(level, n) {
    n = n || 60;
    var total = 0, count = 0, rng = mulberry32(4242 + level);
    D.CLASS_ORDER.forEach(function (cid) {
      var h = newHero({ name: 'Ref', classId: cid, people: 'ember', seed: 99 });
      h.level = level; h.loadout = unlockedSkills(h).slice(1);
      D.SLOT_ORDER.forEach(function (s) { h.equipped[s].level = level; });
      var hf = fighterFromHero(h), bf = bossFighter(level + 2);
      for (var i = 0; i < n; i++) { total += bossHit(hf, bf, D.CLASSES[cid].tactic, newSeed(rng)).damage; count++; }
    });
    return total / count;
  }

  function newSave(hero, now) {
    return {
      version: 1, hero: hero, createdAt: now, seasonStart: now, dustEarned: 0,
      torches: { count: TORCH.max, rested: 8, last: now }, tiredRun: 0,
      settings: { autoSalvage: false, speed: 1, owl: true, moon: 'ujhold' },
      seenTips: {}, chronicle: [], offers: null, offersKey: null, expedition: null
    };
  }

  root.NYX.engine = {
    bossFighter: bossFighter, bossHit: bossHit, averageBossHit: averageBossHit,
    mulberry32: mulberry32, newSeed: newSeed, pick: pick, shuffle: shuffle, clamp: clamp,
    MAX_ROUNDS: MAX_ROUNDS, MAX_LEVEL: MAX_LEVEL, DIFF: DIFF, DIFF_ORDER: DIFF_ORDER, MOONS: MOONS, MOON_ORDER: MOON_ORDER,
    TORCH: TORCH, DUST_WEEKLY: DUST_WEEKLY, PITY_PURPLE: PITY_PURPLE, PITY_LEGEND: PITY_LEGEND, MAX_PLUS: MAX_PLUS, REFUND: REFUND, maxPlus: maxPlus, refundValue: refundValue, upgradeSilver: upgradeSilver, legendChance: legendChance, RARITY_GATE: RARITY_GATE, gateRarity: gateRarity, rollLoot: rollLoot, lilaChance: lilaChance, INVENTORY_MAX: INVENTORY_MAX,
    refBase: refBase, xpNeeded: xpNeeded, xpBase: xpBase, silverBase: silverBase,
    itemStats: itemStats, makeItem: makeItem, affixText: affixText, salvageValue: salvageValue, sellValue: sellValue, upgradeCost: upgradeCost,
    newHero: newHero, unlockedSkills: unlockedSkills, nextSkillUnlock: nextSkillUnlock, heroStats: heroStats, power: power, powerRaw: powerRaw, lootLevel: lootLevel,
    fighterFromHero: fighterFromHero, monsterFighter: monsterFighter, simulateFight: simulateFight, winChance: winChance,
    findMonsterLevel: findMonsterLevel, regionFor: regionFor, makeOffers: makeOffers, offerTarget: offerTarget, offerChance: offerChance,
    startExpedition: startExpedition, resolveCard: resolveCard, guardPreview: guardPreview, fightGuard: fightGuard,
    finishExpedition: finishExpedition, applyChoice: applyChoice, lossAdvice: lossAdvice,
    torchState: torchState, spendTorch: spendTorch, dustRoom: dustRoom, dustCap: dustCap, weekOf: weekOf, addDust: addDust, addXp: addXp,
    addItem: addItem, powerDelta: powerDelta, isUpgrade: isUpgrade, equip: equip, salvage: salvage, sell: sell, upgrade: upgrade,
    findItem: findItem, rerollCost: rerollCost, reroll: reroll, searchChance: searchChance, mythicChance: mythicChance, newSave: newSave
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ===== js/game.js =====
/* Nyxoria RPG – a játékos műveletei. Ugyanez a kód fut a böngészőben (gyakorló mód)
   és a szerveren (Supabase Edge Function), így a szerver dönt mindenről. */
(function (root) {
  'use strict';
  const D = root.NYX.data, E = root.NYX.engine;
  const SAVE_VERSION = 1;
  const PATROL_HOURS = [1, 2, 4, 8];
  const CHRON_MAX = 60;
  const MILESTONES = [10, 20, 30, 40, 50];

  // ---------- segédek ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmt(n) { return Math.round(n).toLocaleString('hu-HU'); }
  function budapestDate(t) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date(t)); }
  function az(word) { return /^[aáeéiíoóöőuúüű]/i.test(String(word)) ? 'az' : 'a'; }
  function regionName(id) { const r = D.REGIONS.filter(x => x.id === id)[0]; return r ? r.name : ''; }
  function fail(code, msg) { const e = new Error(msg); e.code = code; throw e; }

  // Felzárkózó szél: 10+ szinttel a medián alatt ×2, a mediánig fokozatosan ×1
  function wind(level, median) {
    if (!median || level >= median) return 1;
    const gap = median - level;
    return gap >= 10 ? 2 : 1 + gap / 10;
  }

  // ---------- hős létrehozása (ellenőrzéssel, mert a szerveren is ez fut) ----------
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  // csak valódi szöveg lehet szín (egy ["#aabbcc"] tömb is átmenne a reguláris kifejezésen)
  const HEX = { test: v => typeof v === 'string' && HEX_RE.test(v) };
  const HAIR_STYLES = ['hosszu', 'rovid', 'copf', 'konty', 'tuskes'];
  const EYES = ['sotet', 'kek', 'zold', 'arany', 'tunde'];
  const MARKS = ['nincs', 'holdjel', 'csillag', 'heg', 'szeplo'];
  function validName(n) { return typeof n === 'string' && n.length >= 2 && n.length <= 16 && /^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u.test(n); }
  function cleanLook(look) {
    look = look || {};
    return {
      hairStyle: HAIR_STYLES.indexOf(look.hairStyle) >= 0 ? look.hairStyle : 'hosszu',
      hair: HEX.test(look.hair) ? look.hair : '#e8e8ff', tip: HEX.test(look.tip) ? look.tip : '#7f8cff',
      eyes: EYES.indexOf(look.eyes) >= 0 ? look.eyes : 'sotet', mark: MARKS.indexOf(look.mark) >= 0 ? look.mark : 'nincs',
      outfit: HEX.test(look.outfit) ? look.outfit : '#3a3f9c'
    };
  }
  // ---------- új kinézet (hero.rig): ellenőrzés és a régi kinézet átalakítása ----------
  // Csak ismert mezők, ismert értékek és #rrggbb színek maradnak; minden hiányzó mező alapértéket kap.
  function cleanRig(rig, classId) {
    rig = rig && typeof rig === 'object' ? rig : {};
    const out = Object.assign({}, D.LOOK_BASE, D.CLASS_LOOK[classId] || {});
    Object.keys(D.LOOK_ENUMS).forEach(k => { if (D.LOOK_ENUMS[k].indexOf(rig[k]) >= 0) out[k] = rig[k]; });
    D.LOOK_COLORS.forEach(k => { if (HEX.test(rig[k])) out[k] = rig[k].toLowerCase(); });
    D.LOOK_COLORS_OPT.forEach(k => { if (rig[k] === null) out[k] = null; else if (HEX.test(rig[k])) out[k] = rig[k].toLowerCase(); });
    Object.keys(D.LOOK_INTS).forEach(k => { const v = +rig[k]; if (Number.isInteger(v) && v >= 0 && v <= D.LOOK_INTS[k]) out[k] = v; });
    if (typeof rig.eyeGlow === 'boolean') out.eyeGlow = rig.eyeGlow;
    return out;
  }
  // régi (1. változatú) kinézet → új. Ugyanazt adja minden híváskor, a mentést nem kell átírni.
  const OLD_HAIR = { hosszu: ['oldal', 'hosszu'], rovid: ['kozep', 'rovid'], copf: ['egyenes', 'copf'], konty: ['oldal', 'konty'], tuskes: ['tuskes', 'rovid'] };
  const OLD_EYE = { sotet: '#2b2350', kek: '#3f6fd8', zold: '#2f9e6a', arany: '#c98a1c', tunde: '#7ff3ff' };
  const OLD_MARK = { nincs: 'nincs', holdjel: 'holdjel', csillag: 'csillagok', heg: 'forradas', szeplo: 'szeplok' };
  function migrateLook(hero) {
    if (!hero) return cleanRig(null, 'magus');
    if (hero.rig) return cleanRig(hero.rig, hero.classId);
    const o = hero.look || {}, p = D.PEOPLE_LOOK[hero.people] || D.PEOPLE_LOOK.ember, hs = OLD_HAIR[o.hairStyle] || OLD_HAIR.hosszu;
    return cleanRig({
      skin: p.skin, ears: p.ears, hairFront: hs[0], hairBack: hs[1], hair: o.hair, tip: o.tip,
      eye: OLD_EYE[o.eyes] || OLD_EYE.sotet, eyeGlow: o.eyes === 'tunde', mark: OLD_MARK[o.mark] || 'nincs', c1: o.outfit
    }, hero.classId);
  }
  function createSave(opts, now) {
    const name = String(opts.name || '').trim().replace(/\s+/g, ' ');
    if (!validName(name)) fail('name', 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (!D.CLASSES[opts.classId]) fail('class', 'Ismeretlen kaszt.');
    if (!D.PEOPLES[opts.people]) fail('people', 'Ismeretlen faj.');
    const origin = D.ORIGINS[opts.origin] ? opts.origin : 'arva', trait = D.TRAITS[opts.trait] ? opts.trait : 'kivancsi';
    const motto = String(opts.motto || '').trim().slice(0, 40);
    const hero = E.newHero({ name: name, classId: opts.classId, people: opts.people, look: cleanLook(opts.look), origin: origin, trait: trait, motto: motto, now: now });
    // az új kliens a teljes új kinézetet küldi; a régi kliens csak a régit (akkor a rajzoló átalakítja)
    if (opts.rig) hero.rig = cleanRig(opts.rig, hero.classId);
    const save = E.newSave(hero, now);
    save.version = SAVE_VERSION;
    save.patrol = null; save.patrolDay = null; save.buffs = {};
    personal(save, now, `<b>${esc(hero.name)}</b>, ${az(D.PEOPLES[hero.people].name)} ${D.PEOPLES[hero.people].name.toLowerCase()} ${D.CLASSES[hero.classId].name.toLowerCase()} útnak indult. ${esc(D.ORIGINS[hero.origin].line)}`, 'level');
    return save;
  }

  function personal(save, now, html, kind) {
    save.chronicle.unshift({ t: now, text: html, kind: kind || '' });
    if (save.chronicle.length > CHRON_MAX) save.chronicle.length = CHRON_MAX;
  }

  // ---------- ajánlatok ----------
  function offersKey(save) {
    const h = save.hero;
    const eq = D.SLOT_ORDER.map(s => h.equipped[s] ? h.equipped[s].id + ':' + (h.equipped[s].plus || 0) + ':' + (h.equipped[s].rerolls || 0) : '').join(',');
    return [h.level, h.loadout.join('.'), save.settings.moon, eq, h.path == null ? '' : h.path].join('|'); // a taktika nem hoz új kalandot, csak az esélyt számolja újra
  }
  function refreshOffers(save) {
    if (save.expedition) return;
    const key = offersKey(save);
    if (!save.offers || save.offersKey !== key) {
      save.offers = E.makeOffers(save.hero, save.settings.moon, E.newSeed());
      save.offersKey = key; save.offersTactic = save.hero.tactic;
    } else if (save.offersTactic !== save.hero.tactic) {
      save.offers.forEach(o => { o.chance = E.offerChance(save.hero, o); });
      save.offersTactic = save.hero.tactic;
    }
  }

  // ---------- XP-szorzó ----------
  function xpBonus(save, ctx) {
    let m = wind(save.hero.level, ctx.median);
    if (save.buffs && save.buffs.xpUntil && save.buffs.xpUntil > ctx.now) m *= 1.25;
    return m;
  }

  function levelEvents(save, ups, ctx) {
    const h = save.hero;
    ups.forEach(u => {
      personal(save, ctx.now, `<b>${esc(h.name)}</b> elérte a ${u.level}. szintet!${u.skill ? ' Új képesség: ' + esc(D.SKILLS[u.skill].name) + '.' : ''}`, 'level');
      if (MILESTONES.indexOf(u.level) >= 0) ctx.events.push({ kind: 'level', level: u.level, html: `<b>${esc(h.name)}</b> elérte a ${u.level}. szintet!` });
    });
  }
  function itemEvent(save, it, ctx, how) {
    const h = save.hero;
    if (it.mythic) {
      personal(save, ctx.now, `✦ <b>${esc(h.name)}</b> mitikus tárgyat talált: <b>${esc(it.name)}</b>!`, 'mythic');
      ctx.events.push({ kind: 'mythic', html: `✦ <b>${esc(h.name)}</b> mitikus tárgyat talált: <b>${esc(it.name)}</b>!`, announce: true });
    }
    if (it.rarity === 'legendas') { h.stats.legendaries = (h.stats.legendaries || 0) + 1; }
    if (it.mythic) { /* fent már kihirdettük */ } else if (it.rarity === 'legendas') {
      personal(save, ctx.now, `★ <b>${esc(h.name)}</b> legendás tárgyat szerzett${how ? ' (' + how + ')' : ''}: <span class="r-legendas">${esc(it.name)}</span>!`, 'legend');
      ctx.events.push({ kind: 'legendas', html: `★ <b>${esc(h.name)}</b> legendás tárgyat szerzett: <span class="r-legendas">${esc(it.name)}</span>!` });
    } else if (it.rarity === 'lila' || it.rarity === 'kek') {
      personal(save, ctx.now, `<b>${esc(h.name)}</b> ${it.rarity === 'lila' ? 'epikus' : 'ritka'} tárgyat szerzett${how ? ' (' + how + ')' : ''}: <span class="r-${it.rarity}">${esc(it.name)}</span>.`, 'loot');
    }
  }

  function findOffer(save, diff) { return (save.offers || []).filter(o => o.diff === diff)[0]; }
  function needExp(save, phases) {
    const exp = save.expedition;
    if (!exp) fail('state', 'Most nem vagy kalandon.');
    if (phases && phases.indexOf(exp.phase) < 0) fail('state', 'Ezt most nem lehet.');
    return exp;
  }
  function summarizeOut(save, out, card) {
    const tr = D.TRAITS[save.hero.trait];
    const o = { type: out.type, title: card.title };
    if (out.type === 'harc') { o.win = out.fight.win; o.monster = card.monster; o.xp = out.xp || 0; o.silver = out.silver || 0; o.traitLine = out.fight.win ? tr.win : tr.lose; }
    if (out.type === 'kutatas') { o.success = out.success; o.item = out.item || null; o.silver = out.silver || 0; }
    if (out.type === 'esemeny') { o.result = out.result; o.effect = out.effect; o.silver = out.silver || 0; o.dust = out.dust || 0; o.item = out.item || null; o.title = card.event.title; }
    return o;
  }
  function fightPayload(f, heroF, mon) {
    return { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon };
  }

  // ---------- műveletek ----------
  const A = {};

  // a kinézet átszabása bármikor (a név, a faj és a kaszt nem változik)
  A.restyle = (save, a) => { save.hero.rig = cleanRig(Object.assign({}, migrateLook(save.hero), a.rig && typeof a.rig === 'object' ? a.rig : {}), save.hero.classId); };
  A.tactic = (save, a) => { if (!D.TACTICS[a.v]) fail('arg', 'Ismeretlen taktika.'); save.hero.tactic = a.v; };
  A.moon = (save, a) => {
    if (!E.MOONS[a.v]) fail('arg', 'Ismeretlen Hold-fokozat.');
    if (save.hero.level < E.MOONS[a.v].minLevel) fail('level', 'A Hold-fokozatok a 20. szinttől nyílnak.');
    save.settings.moon = a.v;
  };
  A.settings = (save, a) => {
    if ([1, 2, 4].indexOf(a.speed) >= 0) save.settings.speed = a.speed;
    if (typeof a.owl === 'boolean') save.settings.owl = a.owl;
    if (typeof a.autoSalvage === 'boolean') save.settings.autoSalvage = a.autoSalvage;
    if (a.resetTips) save.seenTips = {};
  };
  A.tip = (save, a) => { if (D.OWL_TIPS[a.v]) save.seenTips[a.v] = true; };

  A.start = (save, a, ctx) => {
    if (save.expedition) fail('state', 'Már úton vagy.');
    refreshOffers(save);
    const offer = findOffer(save, a.diff);
    if (!offer) fail('arg', 'Nincs ilyen kaland.');
    const ti = E.spendTorch(save, ctx.now);
    const exp = E.startExpedition(save.hero, offer, save);
    exp.phase = 'clearing'; exp.torchInfo = ti; exp.lastOut = null; exp.id = 'x' + ctx.now.toString(36);
    save.expedition = exp; save.offers = null; save.offersKey = null; save.pendingResult = null;
  };

  A.card = (save, a) => {
    const exp = needExp(save, ['clearing']);
    const cl = exp.clearings[exp.step], card = cl && cl.cards[a.i];
    if (!card) fail('arg', 'Nincs ilyen kártya.');
    if (card.type === 'esemeny') { exp.phase = 'event'; exp.pendingCard = a.i; return {}; }
    const out = E.resolveCard(save.hero, exp, card);
    exp.lastOut = summarizeOut(save, out, card);
    exp.phase = 'cardResult';
    return out.fight ? { fight: fightPayload(out.fight, out.heroF, out.mon) } : {};
  };
  A.event = (save, a) => {
    const exp = needExp(save, ['event']);
    const card = exp.clearings[exp.step].cards[exp.pendingCard];
    const out = E.resolveCard(save.hero, exp, card, a.v === 'b' ? 'b' : 'a');
    exp.lastOut = summarizeOut(save, out, card); exp.pendingCard = null; exp.phase = 'cardResult';
  };
  A.next = (save) => {
    const exp = needExp(save, ['cardResult']);
    exp.phase = exp.step >= 3 ? 'guard' : 'clearing'; exp.lastOut = null;
  };

  A.fight = (save, a, ctx) => {
    const exp = needExp(save, ['guard']), h = save.hero;
    const g = E.fightGuard(h, exp);
    const ti = Object.assign({}, exp.torchInfo || { xpMult: 1 });
    const bonus = xpBonus(save, ctx);
    ti.xpMult = (ti.xpMult || 1) * bonus;
    const res = E.finishExpedition(save, h, exp, g, ti, ctx.now);
    res.windMult = bonus;
    res.items.forEach(it => { E.addItem(save, h, it, ctx.now); itemEvent(save, it, ctx, 'útközben'); });
    if (res.mythic) { E.addItem(save, h, res.mythic, ctx.now); itemEvent(save, res.mythic, ctx); }
    const r = regionName(exp.offer.region);
    personal(save, ctx.now, res.win ? `<b>${esc(h.name)}</b> diadalt aratott ${esc(exp.offer.guard)} felett (${esc(r)}, ${E.DIFF[exp.offer.diff].name}).` : `<b>${esc(h.name)}</b> elbukott ${esc(exp.offer.guard)} ellen (${esc(r)}).`, res.win ? 'win' : 'lose');
    levelEvents(save, res.levelUps, ctx);
    res.expId = exp.id;
    save.pendingResult = res;
    exp.phase = 'result';
    return { fight: fightPayload(g.fight, g.heroF, g.mon) };
  };

  A.choose = (save, a, ctx) => {
    const res = save.pendingResult, h = save.hero;
    if (!res || !res.win || res.chosen) fail('state', 'Most nincs választható jutalom.');
    const ch = res.choices[a.i];
    if (!ch) fail('arg', 'Nincs ilyen jutalom.');
    if (ch.kind === 'xp') ch.amount = Math.round(ch.amount * xpBonus(save, ctx));
    const out = E.applyChoice(save, h, ch, ctx.now) || {};
    res.chosen = true; res.chosenIdx = a.i;
    const info = { kind: ch.kind };
    if (ch.kind === 'item') {
      itemEvent(save, ch.item, ctx);
      if (out.salvaged) { info.salvaged = true; info.dust = out.dust; }
      else if (E.isUpgrade(h, ch.item)) { E.equip(h, ch.item.id); info.equipped = true; }
      info.name = ch.item.name;
    } else if (ch.kind === 'dust') info.dust = out.dust;
    else if (ch.kind === 'silver') info.silver = ch.amount;
    else if (ch.kind === 'xp') { info.xp = ch.amount; info.levelUps = out.levelUps || []; levelEvents(save, info.levelUps, ctx); }
    return info;
  };
  A.camp = (save) => {
    if (save.expedition && save.expedition.phase !== 'result') fail('state', 'Előbb fejezd be a kalandot.');
    save.expedition = null; save.pendingResult = null;
  };
  A.retreat = (save, a, ctx) => {
    const exp = needExp(save, ['clearing', 'cardResult', 'event', 'guard']), h = save.hero;
    exp.loot.forEach(it => E.addItem(save, h, it, ctx.now));
    h.silver += exp.silver;
    E.addDust(save, h, exp.dust, ctx.now);
    const ups = E.addXp(h, exp.bonusXp * ((exp.torchInfo && exp.torchInfo.xpMult) || 1) * xpBonus(save, ctx));
    personal(save, ctx.now, `<b>${esc(h.name)}</b> visszafordult: ${esc(regionName(exp.offer.region))}.`, '');
    levelEvents(save, ups, ctx);
    save.expedition = null;
    return { levelUps: ups };
  };

  // felszerelés
  A.equip = (save, a) => { if (save.expedition && save.expedition.phase === 'guard') { /* az őrző előtt is szabad */ } if (!E.equip(save.hero, a.id)) fail('arg', 'Nincs ilyen tárgy a táskában.'); };
  A.salvage = (save, a, ctx) => ({ dust: E.salvage(save, save.hero, a.id, ctx.now) });
  A.sell = (save, a) => ({ silver: E.sell(save.hero, a.id) });
  A.salvageWeak = (save, a, ctx) => {
    const h = save.hero; let sum = 0;
    h.inventory.filter(it => !it.mythic && (it.rarity === 'szurke' || it.rarity === 'zold') && !E.isUpgrade(h, it)).forEach(it => { sum += E.salvage(save, h, it.id, ctx.now); });
    return { dust: sum };
  };
  A.upgrade = (save, a, ctx) => {
    const r = E.upgrade(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Nincs ilyen tárgy.' : r.reason === 'max' ? 'Ez a tárgy már a legmagasabb szinten van.' : r.reason === 'ezüst' ? 'Nincs elég Holdezüst.' : 'Nincs elég Csillagpor.');
    if (r.plus === 5 || r.max) personal(save, ctx.now, `<b>${esc(save.hero.name)}</b> +${r.plus}-re fejlesztett egy tárgyat${r.max ? ' – tovább már nem lehet' : ''}.`, 'loot');
    if (r.max && r.plus >= 10) ctx.events.push({ kind: 'plus10', html: `<b>${esc(save.hero.name)}</b> +${r.plus}-re, a legmagasabb szintre fejlesztett egy tárgyat!` });
    return r;
  };
  A.reroll = (save, a) => {
    const r = E.reroll(save.hero, a.id);
    if (!r.ok) fail('cost', r.reason === 'nincs' ? 'Ennek a tárgynak nincs jellemzője.' : 'Nincs elég Holdezüst.');
    return r;
  };
  A.skillMove = (save, a) => {
    const l = save.hero.loadout, i = a.i | 0, j = i + (a.dir < 0 ? -1 : 1);
    if (i < 0 || j < 0 || i >= l.length || j >= l.length) fail('arg', 'Nem mozgatható.');
    const t = l[i]; l[i] = l[j]; l[j] = t;
  };

  // őrjárat: naponta egyszer, 1–8 órára; közben az expedíciók is mennek
  function patrolReward(h, hours) {
    return {
      xp: Math.round(E.xpBase(h.level) * 2 * hours / 8),
      silver: Math.round(E.silverBase(h.level) * hours / 2),
      dust: Math.round((8 + 1.5 * h.level) * hours / 4),
      itemChance: hours >= 8 ? 1 : hours >= 4 ? 0.5 : 0
    };
  }
  A.patrolStart = (save, a, ctx) => {
    const hours = a.hours | 0;
    if (PATROL_HOURS.indexOf(hours) < 0) fail('arg', 'Ennyi órára nem lehet őrjáratra menni.');
    if (save.patrol) fail('state', 'Már őrjáraton vagy.');
    const day = budapestDate(ctx.now);
    if (save.patrolDay === day) fail('state', 'Ma már voltál őrjáraton. Holnap újra mehetsz.');
    save.patrol = { start: ctx.now, end: ctx.now + hours * 3600 * 1000, hours: hours, seed: E.newSeed() };
    save.patrolDay = day;
  };
  A.patrolClaim = (save, a, ctx) => {
    const p = save.patrol, h = save.hero;
    if (!p) fail('state', 'Nem vagy őrjáraton.');
    if (p.end > ctx.now) fail('state', 'Az őrjárat még nem ért véget.');
    const rng = E.mulberry32(p.seed), rw = patrolReward(h, p.hours), bonus = xpBonus(save, ctx);
    const out = { hours: p.hours, xp: Math.round(rw.xp * bonus), silver: rw.silver, dust: 0, item: null };
    h.silver += out.silver;
    out.dust = E.addDust(save, h, rw.dust, ctx.now);
    if (rng() < rw.itemChance) {
      const rar = E.makeItem(rng, { rarity: E.rollLoot(rng, 'kozepes', h), level: h.level, classId: h.classId, hero: h });
      out.item = rar; out.itemResult = E.addItem(save, h, rar, ctx.now);
      itemEvent(save, rar, ctx, 'őrjárat');
    }
    out.levelUps = E.addXp(h, out.xp);
    levelEvents(save, out.levelUps, ctx);
    personal(save, ctx.now, `<b>${esc(h.name)}</b> visszatért egy ${p.hours} órás őrjáratról.`, '');
    save.patrol = null;
    return out;
  };

  // ---------- futtatás ----------
  const FREE_DURING_EXPEDITION = ['tactic', 'restyle', 'settings', 'tip', 'equip', 'salvage', 'sell', 'salvageWeak', 'upgrade', 'reroll', 'skillMove', 'patrolStart', 'patrolClaim'];

  // tárgyak átállítása az új rendszerre (legendás fokozat, fejlesztés-visszatérítés): egyszer, minden régi mentésen
  function migrateItems(save) {
    if (!save || !save.hero || save.itemsV >= 2) return;
    const h = save.hero, all = D.SLOT_ORDER.map(s => h.equipped[s]).filter(Boolean).concat(h.inventory || []);
    all.forEach(it => {
      // a régi fejlesztések ára (20 × t × (1 + szint/10)) visszamenőleg is számít a visszatérítésbe
      if (it.spent == null) { let sp = 0; for (let t = 1; t <= (it.plus || 0); t++) sp += Math.round(20 * t * (1 + it.level / 10)); it.spent = sp; }
      // a mitikus tárgy mostantól legendás erejű
      if (it.mythic && it.rarity === 'lila') {
        it.rarity = 'legendas'; it.converted = true; h.stats.legendaries = (h.stats.legendaries || 0) + 1;
        it.affixes = (it.affixes || []).map(a => ({ id: a.id, v: Math.round(a.v * 1.25) }));
        const have = it.affixes.map(a => a.id), extra = D.AFFIXES.filter(a => have.indexOf(a.id) < 0)[0];
        if (extra) it.affixes.push({ id: extra.id, v: Math.round(extra.max * 1.25) });
      }
    });
    if (h.pityLegend == null) h.pityLegend = 0;
    save.itemsV = 2;
  }
  function run(save, action, args, ctx) {
    const fn = A[action];
    if (!fn) fail('action', 'Ismeretlen művelet.');
    migrateItems(save);
    ctx = Object.assign({ events: [], median: 0 }, ctx);
    ctx.events = ctx.events || [];
    E.torchState(save, ctx.now);
    if (!save.buffs) save.buffs = {};
    const result = fn(save, args || {}, ctx) || {};
    refreshOffers(save);
    return { result: result, events: ctx.events };
  }

  // A kliens nem láthatja előre a véletlenmagokat (különben kiszámolhatná a harcok kimenetelét)
  function sanitize(save) {
    return JSON.parse(JSON.stringify(save, (k, v) => (k === 'seed' ? undefined : v)));
  }

  function summary(save) {
    const h = save.hero, s = E.heroStats(h);
    return { name: h.name, classId: h.classId, level: h.level, xp: h.xp, power: E.power(s), mythics: h.stats.mythics || 0, legendaries: h.stats.legendaries || 0, wins: h.stats.wins || 0 };
  }

  root.NYX.game = {
    run: run, actions: A, createSave: createSave, refreshOffers: refreshOffers, offersKey: offersKey, sanitize: sanitize, summary: summary,
    wind: wind, xpBonus: xpBonus, patrolReward: patrolReward, PATROL_HOURS: PATROL_HOURS, budapestDate: budapestDate, validName: validName,
    cleanRig: cleanRig, migrateLook: migrateLook,
    esc: esc, az: az, fmt: fmt, personal: personal, itemEvent: itemEvent, levelEvents: levelEvents, FREE_DURING_EXPEDITION: FREE_DURING_EXPEDITION
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ===== js/extra.js =====
/* Nyxoria – új, egyszemélyes funkciók: napi ajándék, vándorkereskedő, Holdtorony, heti esemény, eredmények + gyűjtőalbum.
   A szerveren is fut (tools/build-server.js a game.js után fűzi be), ezért minden szabály és véletlen itt dől el.
   Minden új adat a mentés saját mezőjében él (gift, shop, tower, event, ach, album); régi mentésnél üresen indul. */
(function (root) {
  'use strict';
  const D = root.NYX.data, E = root.NYX.engine, G = root.NYX.game, A = G.actions;
  const DAY = 24 * 3600 * 1000;
  function fail(code, msg) { const e = new Error(msg); e.code = code; throw e; }
  const day = t => G.budapestDate(t);
  // a hét kulcsa: annak a hétfőnek a dátuma (budapesti idő szerint), amelyikkel a hét kezdődik
  function weekKey(t) {
    const d = new Date(day(t) + 'T12:00:00Z'), wd = (d.getUTCDay() + 6) % 7;
    return new Date(d.getTime() - wd * DAY).toISOString().slice(0, 10);
  }
  function weekEnds(t) { return Date.parse(weekKey(t) + 'T00:00:00Z') + 7 * DAY; } // közelítő (UTC éjfél); csak kijelzésre
  const stats = h => { h.stats = h.stats || {}; return h.stats; };
  const bump = (h, k, n) => { const s = stats(h); s[k] = (s[k] || 0) + (n == null ? 1 : n); };
  function giveItem(save, ctx, rng, rarity, how, extra) {
    const h = save.hero, it = E.makeItem(rng, Object.assign({ rarity: rarity, level: h.level, classId: h.classId, hero: h }, extra || {}));
    const r = E.addItem(save, h, it, ctx.now);
    G.itemEvent(save, it, ctx, how);
    return { item: it, salvaged: !!(r && r.salvaged), dust: r && r.dust };
  }

  // ===================== Napi ajándék =====================
  // 7 napos sor: ha kimarad egy nap, elölről kezdődik; a 7. nap után újra az 1. jön.
  const GIFT = [
    { k: 'silver', m: 3 }, { k: 'dust', m: 1 }, { k: 'xp', m: 1.5 }, { k: 'item', r: 'zold' },
    { k: 'silver+dust', m: 5 }, { k: 'item', r: 'kek' }, { k: 'item+silver', r: 'lila', m: 8 }
  ];
  function giftState(save, now) {
    // tegnap = a mai budapesti dátum előtti nap (óraátállításkor is helyes)
    const g = save.gift || { day: null, streak: 0 }, today = day(now), yest = new Date(Date.parse(today + 'T12:00:00Z') - DAY).toISOString().slice(0, 10);
    const can = g.day !== today;
    const next = !can ? g.streak : (g.day === yest ? g.streak % 7 + 1 : 1);
    return { can: can, streak: g.streak || 0, next: next, today: today };
  }
  function giftPreview(h, n) {
    const L = h.level, g = GIFT[n - 1], out = {};
    if (g.k.indexOf('silver') >= 0) out.silver = Math.round(E.silverBase(L) * g.m);
    if (g.k.indexOf('dust') >= 0) out.dust = Math.round(20 + 3 * L) * (g.k === 'dust' ? 1 : 1.5) | 0;
    if (g.k === 'xp') out.xp = Math.round(E.xpBase(L) * g.m);
    if (g.k.indexOf('item') >= 0) { out.item = E.gateRarity(g.r === 'lila' ? 'kek' : g.r, L); if (g.r === 'lila') out.orBetter = true; } // a 7. nap: legalább kék, szerencsével lila
    return out;
  }
  A.gift = (save, a, ctx) => {
    const st = giftState(save, ctx.now), h = save.hero;
    if (!st.can) fail('state', 'A mai ajándékot már elvitted. Holnap jön a következő.');
    const pv = giftPreview(h, st.next), out = { day: st.next };
    const rng = E.mulberry32(E.newSeed());
    if (pv.silver) { h.silver += pv.silver; out.silver = pv.silver; }
    if (pv.dust) { h.dust += pv.dust; out.dust = pv.dust; } // az ajándék nem számít bele a heti Csillagpor-plafonba
    if (pv.xp) { out.xp = pv.xp; out.levelUps = E.addXp(h, pv.xp); G.levelEvents(save, out.levelUps, ctx); }
    if (pv.item) { const r = giveItem(save, ctx, rng, pv.orBetter ? E.rollLoot(rng, 'nehez', h, { floor: 'kek' }) : pv.item, 'napi ajándék'); out.item = r.item; out.salvaged = r.salvaged; }
    save.gift = { day: st.today, streak: st.next };
    bump(h, 'gifts');
    return out;
  };

  // ===================== Vándorkereskedő =====================
  // Naponta 4 új áru, a hős szintjéhez és kasztjához; mindegyikből egy darab.
  const SHOP_PRICE = { zold: 6, kek: 14, lila: 34 }; // × a szinthez tartozó alap-Holdezüst (egy kalandnyi)
  function refreshShop(save, now) {
    const today = day(now);
    if (save.shop && save.shop.day === today) return;
    const h = save.hero, rng = E.mulberry32(E.newSeed()), slots = E.shuffle(rng, D.SLOT_ORDER.slice());
    const items = [0, 1, 2, 3].map(i => {
      const x = rng(), rar = E.gateRarity(i === 3 && h.level >= E.RARITY_GATE.lila && x < 0.03 ? 'lila' : x < 0.55 ? 'zold' : 'kek', h.level);
      const it = E.makeItem(rng, { slot: slots[i], rarity: rar, level: h.level, classId: h.classId });
      return { item: it, price: Math.round(E.silverBase(h.level) * SHOP_PRICE[rar]), sold: false };
    });
    save.shop = { day: today, items: items };
  }
  A.shopOpen = (save, a, ctx) => { refreshShop(save, ctx.now); };
  // újrapakolás Holdezüstért (naponta legfeljebb 3×): értelmes költési lehetőség a felgyűlt ezüstnek
  const SHOP_REROLLS = 3, shopRerollCost = h => Math.round(E.silverBase(h.level) * 3);
  A.shopReroll = (save, a, ctx) => {
    refreshShop(save, ctx.now);
    const h = save.hero, n = save.shop.rerolls || 0, cost = shopRerollCost(h);
    if (n >= SHOP_REROLLS) fail('state', 'Ma már nem pakol újra a kereskedő.');
    if (h.silver < cost) fail('state', 'Ehhez nincs elég Holdezüstöd.');
    h.silver -= cost;
    save.shop.day = null; refreshShop(save, ctx.now); save.shop.rerolls = n + 1;
  };
  A.shopBuy = (save, a, ctx) => {
    refreshShop(save, ctx.now);
    const s = save.shop.items[a.i | 0], h = save.hero;
    if (!s) fail('arg', 'Nincs ilyen áru.');
    if (s.sold) fail('state', 'Ezt már megvetted.');
    if (h.silver < s.price) fail('state', 'Ehhez nincs elég Holdezüstöd.');
    if (h.inventory.length >= E.INVENTORY_MAX) fail('state', 'Tele a táskád. Szedj szét vagy adj el valamit.');
    h.silver -= s.price; s.sold = true;
    const it = JSON.parse(JSON.stringify(s.item));
    E.addItem(save, h, it, ctx.now);
    G.itemEvent(save, it, ctx, 'vándorkereskedő');
    bump(h, 'bought');
    return { item: it };
  };

  // ===================== Holdtorony =====================
  // Emeletről emeletre: az n. emelet szörnye (2 + 0,9·n) szintű, egyre erősebb. Hetente (hétfőn) újraindul.
  // Amíg nyersz, mászhatsz tovább; naponta 5 vereség fér bele. Egy emelet első legyőzéséért (az adott héten) jutalom jár; minden 5. emeleten tárgy.
  const TOWER_TRIES = 5;
  function towerState(save, now) {
    const wk = weekKey(now), today = day(now);
    let t = save.tower;
    if (!t || t.week !== wk) t = { week: wk, floor: 0, best: (t && t.best) || 0, day: today, tries: 0 };
    if (t.day !== today) { t.day = today; t.tries = 0; }
    return t;
  }
  function towerMonster(n) {
    const lm = 2 + 0.9 * n, names = D.REGIONS.reduce((a, r) => a.concat(r.monsters), []);
    return E.monsterFighter(lm, { power: 1 + 0.012 * n, name: names[(n * 7) % names.length] });
  }
  function towerRegion(n) { return D.REGIONS[Math.min(D.REGIONS.length - 1, Math.floor((n - 1) / 6) % D.REGIONS.length)].id; }
  // teljes jutalom csak a legjobb eredményed feletti (új) emeletekért; a heti újramászásért negyed annyi, tárgy nélkül
  function towerReward(h, n, best) {
    const fresh = n > (best || 0), k = fresh ? 1 : 0.25;
    return { silver: Math.round(E.silverBase(Math.min(h.level, n + 3)) * (0.4 + n / 30) * k), dust: Math.round((5 + n) * k), item: fresh && n % 5 === 0 ? E.gateRarity(n % 10 === 0 ? (n >= 30 && n <= 50 ? 'legendas' : 'lila') : 'kek', h.level) : null, fresh: fresh };
  }
  const TOWER_MIN_LEVEL = 5;
  A.towerFight = (save, a, ctx) => {
    if (save.hero.level < TOWER_MIN_LEVEL) fail('state', `A Holdtorony ${TOWER_MIN_LEVEL}. szinttől nyílik.`);
    const t = towerState(save, ctx.now), h = save.hero;
    if (t.tries >= TOWER_TRIES) fail('state', 'Mára elfogytak a próbálkozásaid a toronyban. Holnap újra mehetsz.');
    if (t.floor >= 200) fail('state', 'Elérted a torony tetejét.');
    const n = t.floor + 1, mon = towerMonster(n), heroF = E.fighterFromHero(h);
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    if (!f.win) t.tries++; // csak a vereség visz el egy próbálkozást
    const out = { floor: n, win: f.win, region: towerRegion(n) };
    if (f.win) {
      t.floor = n; t.best = Math.max(t.best || 0, n);
      const rw = towerReward(h, n, stats(h).towerMax || 0), rng = E.mulberry32(E.newSeed());
      h.silver += rw.silver; out.silver = rw.silver;
      out.dust = E.addDust(save, h, rw.dust, ctx.now);
      if (rw.item) { const r = giveItem(save, ctx, rng, rw.item, `Holdtorony, ${n}. emelet`); out.item = r.item; out.salvaged = r.salvaged; }
      if (n > (stats(h).towerMax || 0)) stats(h).towerMax = n;
      if (n % 5 === 0) G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> feljutott a Holdtorony ${n}. emeletére.`, 'win');
    }
    save.tower = t;
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: out };
  };

  // gyors mászás: a hősnél jóval gyengébb emeleteket animáció nélkül, egymás után vívja meg (vereségnél vagy a határnál megáll)
  function rushLimit(h) { return Math.floor((h.level - 6) / 0.9); } // eddig az emeletig (2 + 0,9·n ≤ szint − 4)
  A.towerRush = (save, a, ctx) => {
    if (save.hero.level < TOWER_MIN_LEVEL) fail('state', `A Holdtorony ${TOWER_MIN_LEVEL}. szinttől nyílik.`);
    const t = towerState(save, ctx.now), h = save.hero, lim = rushLimit(h), heroF = E.fighterFromHero(h);
    if (t.floor >= lim) fail('state', 'Innen már csak rendes harccal mehetsz tovább.');
    if (t.tries >= TOWER_TRIES) fail('state', 'Mára elfogytak a próbálkozásaid a toronyban.');
    const out = { from: t.floor, silver: 0, dust: 0, items: [], lost: false };
    while (t.floor < lim) {
      const n = t.floor + 1, f = E.simulateFight(heroF, towerMonster(n), h.tactic, E.newSeed(), false);
      if (!f.win) { t.tries++; out.lost = n; break; }
      t.floor = n;
      const rw = towerReward(h, n, stats(h).towerMax || 0);
      h.silver += rw.silver; out.silver += rw.silver; out.dust += E.addDust(save, h, rw.dust, ctx.now);
      if (rw.item) out.items.push(giveItem(save, ctx, E.mulberry32(E.newSeed()), rw.item, `Holdtorony, ${n}. emelet`).item);
    }
    t.best = Math.max(t.best || 0, t.floor); if (t.floor > (stats(h).towerMax || 0)) stats(h).towerMax = t.floor;
    out.to = t.floor; save.tower = t;
    return out;
  };

  // ===================== Heti esemény =====================
  // Minden héten más esemény, saját szörnnyel. Naponta 3 harc; győzelem 10 pont, vereség 3.
  // A pontokért járó jutalmak közül a legfelső tárgy csak az adott esemény hetében szerezhető meg.
  const EVENTS = [
    { id: 'verhold', name: 'Vérhold-vadászat', monster: 'Vérholdas fenevad', region: 'ejkatlan', prize: { name: 'Vérhold-agyar', slot: 'amulett' },
      line: 'Vörösen kel a hold, és vele ébred a fenevad. Aki sokszor szembeszáll vele, megkapja az agyarát.' },
    { id: 'kodkiraly', name: 'A Ködkirály udvara', monster: 'A Ködkirály lovagja', region: 'kodlap', prize: { name: 'Ködkirály-sisak', slot: 'sisak' },
      line: 'A lápból lovagok lépnek elő. A legkitartóbbak a Ködkirály sisakját nyerhetik el.' },
    { id: 'csillageso', name: 'Csillageső', monster: 'Hulló csillagszellem', region: 'szirtek', prize: { name: 'Csillageső-gyűrű', slot: 'gyuru' },
      line: 'Csillagok hullanak a szirtekre, és mindegyikben szellem lakik. Gyűjtsd a fényüket!' },
    { id: 'arnyvasar', name: 'Árnyvásár', monster: 'Árnyvásári csempész', region: 'arnyromok', prize: { name: 'Árnyvásári köpeny', slot: 'pancel' },
      line: 'A romok között éjjel vásár nyílik. A csempészek nem adják ingyen az áruikat.' }
  ];
  // várhatóan napi ~21 pont (3 harc, 60% esély): a díj kb. 5 nap alatt jön össze, így egy kihagyott nap belefér
  // a díj szerdai kezdéssel is elérhető (napi ~19 pont × 5 nap)
  const EVENT_TIERS = [{ p: 20, k: 'silver', m: 6 }, { p: 45, k: 'dust', n: 120 }, { p: 70, k: 'item', r: 'kek' }, { p: 90, k: 'prize' }];
  const EVENT_TRIES = 3;
  function currentEvent(now) {
    const wk = weekKey(now), idx = Math.floor(Date.parse(wk + 'T00:00:00Z') / (7 * DAY)) % EVENTS.length;
    const wd = (new Date(day(now) + 'T12:00:00Z').getUTCDay() + 6) % 7; // hétfő = 0
    return Object.assign({ week: wk, ends: weekEnds(now), daysLeft: 7 - wd }, EVENTS[(idx + EVENTS.length) % EVENTS.length]);
  }
  function eventState(save, now) {
    const ev = currentEvent(now), today = day(now);
    let s = save.event;
    if (!s || s.week !== ev.week) s = { week: ev.week, id: ev.id, points: 0, claimed: [], day: today, tries: 0, lm: null };
    if (s.day !== today) { s.day = today; s.tries = 0; s.lm = null; }
    return { ev: ev, s: s };
  }
  A.eventFight = (save, a, ctx) => {
    const x = eventState(save, ctx.now), s = x.s, h = save.hero;
    if (s.tries >= EVENT_TRIES) fail('state', 'Mára elfogytak az eseményharcaid. Holnap újra jöhetsz.');
    const heroF = E.fighterFromHero(h);
    s.lm = +E.findMonsterLevel(heroF, h.tactic, 0.6, { n: 120, power: 1.1 }).toFixed(2); // minden harc előtt a mostani felszereléshez: kb. 60% győzelmi esély
    const mon = E.monsterFighter(s.lm, { power: 1.1, name: x.ev.monster });
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    s.tries++;
    const pts = f.win ? 10 : 3;
    s.points += pts;
    if (f.win) bump(h, 'eventWins');
    save.event = s;
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: { win: f.win, points: pts, total: s.points, region: x.ev.region } };
  };
  A.eventClaim = (save, a, ctx) => {
    const x = eventState(save, ctx.now), s = x.s, h = save.hero, i = a.i | 0, tier = EVENT_TIERS[i];
    if (!tier) fail('arg', 'Nincs ilyen jutalom.');
    if (s.points < tier.p) fail('state', `Ehhez ${tier.p} pont kell.`);
    if (s.claimed.indexOf(i) >= 0) fail('state', 'Ezt már átvetted.');
    const out = {}, rng = E.mulberry32(E.newSeed());
    if (tier.k === 'silver') { out.silver = Math.round(E.silverBase(h.level) * tier.m); h.silver += out.silver; }
    if (tier.k === 'dust') out.dust = E.addDust(save, h, tier.n, ctx.now);
    if (tier.k === 'item') { const r = giveItem(save, ctx, rng, E.gateRarity(tier.r, h.level), x.ev.name); out.item = r.item; }
    if (tier.k === 'prize') {
      const pr = E.gateRarity('lila', h.level); // a 12. szint alatt ugyanez a tárgy kék változatban
      const r = giveItem(save, ctx, rng, pr, x.ev.name, { slot: x.ev.prize.slot, name: x.ev.prize.name });
      r.item.event = x.ev.id; out.item = r.item;
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> megszerezte az esemény díját: <span class="r-${pr}">${G.esc(x.ev.prize.name)}</span>.`, 'loot');
    }
    s.claimed.push(i); save.event = s;
    return out;
  };

  // ===================== Eredmények és gyűjtőalbum =====================
  // Minden eredménynek fokozatai vannak; minden fokozatért egyszer jár jutalom (Csillagpor + Holdezüst).
  const ACH = [
    { id: 'szint', name: 'Tapasztalt kalandor', unit: 'szint', tiers: [5, 10, 20, 30, 40, 50], v: s => s.hero.level },
    { id: 'gyozelem', name: 'Őrzők réme', unit: 'győzelem', tiers: [5, 25, 100, 250, 500], v: s => s.hero.stats.wins || 0 },
    { id: 'kaland', name: 'Fáradhatatlan', unit: 'kaland', tiers: [10, 50, 150, 400, 1000], v: s => s.hero.stats.expeditions || 0 },
    { id: 'nehez', name: 'A nehezét keresi', unit: 'nehéz győzelem', tiers: [1, 10, 50, 150], v: s => s.hero.stats.hardWins || 0 },
    { id: 'torony', name: 'Toronymászó', unit: 'emelet', tiers: [5, 10, 20, 30, 45], v: s => s.hero.stats.towerMax || 0 },
    { id: 'orjarat', name: 'Éber őrszem', unit: 'őrjárat', tiers: [5, 25, 75, 200], v: s => s.hero.stats.patrols || 0 },
    { id: 'ajandek', name: 'Hűséges vendég', unit: 'ajándék', tiers: [7, 30, 90, 180], v: s => s.hero.stats.gifts || 0 },
    { id: 'kovacs', name: 'Csillagkovács', unit: 'fejlesztés', tiers: [5, 25, 100, 300], v: s => s.hero.stats.upgrades || 0 },
    { id: 'gyujto', name: 'Gyűjtő', unit: 'lap az albumban', tiers: [5, 15, 30, 60, 100], v: s => albumCount(s) },
    { id: 'mitikus', name: 'Legendák nyomában', unit: 'mitikus tárgy', tiers: [1, 3, 5], v: s => s.hero.stats.mythics || 0 },
    // mérföldkövek a legendás tárgyakhoz: a fokozatok címet is adnak, ami a profilon látszik
    { id: 'legendas', name: 'Aranyláz', unit: 'legendás tárgy', tiers: [1, 5, 10, 20], titles: ['Az arany nyomában', 'Aranykezű', 'Legendák gyűjtője', 'Élő legenda'], v: s => s.hero.stats.legendaries || 0 },
    { id: 'aranyszett', name: 'Aranyba öltözve', unit: 'legendás tárgy egyszerre rajtad', tiers: [3, 5], titles: ['Aranyló vándor', 'Aranypáncélos'], v: s => D.SLOT_ORDER.filter(k => s.hero.equipped[k] && s.hero.equipped[k].rarity === 'legendas').length }
  ];
  // a jutalom a fokozattól függ, nem attól, hányas szinten veszed át (nem éri meg gyűjtögetni)
  function achReward(h, t) { return { dust: 25 + 25 * t, silver: Math.round(E.silverBase(5 + 8 * t) * (2 + 2 * t)) }; }
  function albumCount(save) { const a = save.album || {}; return Object.keys(a.mon || {}).length + Object.keys(a.items || {}).length; }
  function achList(save) {
    const cl = save.ach || {};
    return ACH.map(x => {
      const v = x.v(save), got = cl[x.id] || 0, reached = x.tiers.filter(t => v >= t).length;
      return { id: x.id, name: x.name, unit: x.unit, tiers: x.tiers, titles: x.titles || null, value: v, claimed: got, reached: reached, next: x.tiers[got], reward: got < x.tiers.length ? achReward(save.hero, got) : null };
    });
  }
  A.achClaim = (save, a) => {
    const x = achList(save).filter(r => r.id === a.id)[0], h = save.hero;
    if (!x) fail('arg', 'Nincs ilyen eredmény.');
    if (x.claimed >= x.reached) fail('state', 'Ehhez a fokozathoz még nem értél el.');
    const rw = achReward(h, x.claimed);
    h.dust += rw.dust; h.silver += rw.silver;
    save.ach = save.ach || {}; save.ach[x.id] = x.claimed + 1;
    if (x.titles && x.titles[x.claimed]) {
      const t = x.titles[x.claimed]; save.achTitles = (save.achTitles || []).filter(y => y !== t).concat([t]); rw.title = t;
      G.personal(save, Date.now(), `<b>${G.esc(h.name)}</b> új címet kapott: <b>${G.esc(t)}</b>.`, 'legend');
    }
    return rw;
  };
  // a gyűjtőalbum: minden legyőzött őrző és minden kék/lila/mitikus tárgy neve egyszer kerül be
  function albumNote(save) {
    const a = save.album = save.album || { mon: {}, items: {} }, h = save.hero;
    const all = h.inventory.concat(Object.keys(h.equipped).map(k => h.equipped[k]).filter(Boolean));
    all.forEach(it => { if (it.mythic || it.rarity === 'legendas' || it.rarity === 'lila' || it.rarity === 'kek') { if (!a.items[it.name]) a.items[it.name] = { r: it.mythic ? 'mitikus' : it.rarity, slot: it.slot }; } });
  }

  // ===================== Más hősök „szellemei” (Aréna, csapat) =====================
  // A motor a szörnyet egyszerű (képesség nélküli) harcosként kezeli. Egy másik hős ezért úgy áll ki ellened,
  // hogy a TÁM-ját és az ÉLET-ét egy szorzóval igazítjuk: akkora, hogy a hős a saját szellemével szemben 50%-ot érjen el.
  // Így a képességek, a háziállat és a taktika értéke is benne van, és az ellenfél pont olyan erős, mint valójában.
  function ghostFighter(hero) {
    const f = E.fighterFromHero(hero), base = Object.assign({}, f, { side: 'm', lm: f.level });
    const mk = m => Object.assign({}, base, { tam: base.tam * m, maxHp: base.maxHp * m, hpStart: base.hpStart * m });
    let lo = 0.6, hi = 2.6;
    for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (E.winChance(f, mk(mid), hero.tactic, 240, 3131) > 0.5) lo = mid; else hi = mid; }
    const g = mk((lo + hi) / 2); g.name = hero.name; g.ghostOf = { classId: hero.classId };
    return g;
  }
  const scaleGhost = (g, m) => Object.assign({}, g, { tam: g.tam * m, maxHp: g.maxHp * m, hpStart: g.hpStart * m });
  // gépi ellenfél hangolása: akkorára állítjuk, hogy ellened épp a kívánt esélyed legyen (a kasztok közti különbség így nem számít)
  function tuneFor(myF, tactic, g, target) {
    let lo = 0.3, hi = 3;
    for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (E.winChance(myF, scaleGhost(g, mid), tactic, 160, 777) > target) lo = mid; else hi = mid; }
    return +((lo + hi) / 2).toFixed(3);
  }
  // gépi ellenfél (gyakorló módban, vagy ha a szerveren nincs elég hasonló hős): a te szintedhez közeli, véletlen kasztú hős
  const BOT_NAMES = ['Árnyék', 'Vándor', 'Holdlovag', 'Ködjáró', 'Csillagvadász', 'Éjfarkas', 'Szürke Bárd', 'Lápi Boszorka', 'Ezüstszem', 'Hamvas', 'Rozsdás Kard', 'Éji Dalnok'];
  const SKINS = ['#f6d7c3', '#e8b896', '#c98e66', '#8a5a3a', '#5a3a28', '#d9def5', '#b8e0c8'], CLOTH = ['#2f6b4f', '#8e2448', '#3a3f9c', '#5a3e2a', '#4a2a7a', '#2a5a7a', '#7a5a2a', '#3a3a4a'];
  // gépi hős véletlen (de érvényes) kinézettel, hogy ne egyformák legyenek
  function botRig(rng, cls) {
    const pk = a => a[Math.floor(rng() * a.length)], rig = {};
    ['sex', 'body', 'face', 'eyeShape', 'brows', 'mouth', 'nose', 'hairBack', 'hairFront'].forEach(k => { rig[k] = pk(D.LOOK_ENUMS[k]); });
    rig.ears = rng() < 0.5 ? 'ember' : pk(D.LOOK_ENUMS.ears); rig.headwear = rng() < 0.6 ? 'nincs' : pk(D.LOOK_ENUMS.headwear);
    rig.hair = pk(D.HAIR_COLORS)[1]; rig.skin = pk(SKINS); rig.c1 = pk(CLOTH); rig.c2 = pk(CLOTH); rig.weapon = Math.floor(rng() * 3);
    return G.cleanRig(rig, cls);
  }
  // a gépi ellenfél felszerelése a tiédhez igazodik (azonos tárgyszint és ritkaság), így az ereje is hasonló
  function gearProfile(h) {
    const items = D.SLOT_ORDER.map(k => h.equipped[k]).filter(Boolean), cnt = {};
    items.forEach(it => { cnt[it.rarity] = (cnt[it.rarity] || 0) + 1; });
    const rar = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'szurke';
    const lvl = items.length ? Math.round(items.reduce((t, it) => t + it.level, 0) / items.length) : h.level;
    return { rarity: rar, level: Math.max(1, lvl) };
  }
  function botHero(rng, level, rarity, i, used, itemLevel) {
    const cls = D.CLASS_ORDER[Math.floor(rng() * D.CLASS_ORDER.length)];
    let name; do { name = BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)]; } while (used && used.indexOf(name) >= 0 && used.length < BOT_NAMES.length);
    if (used) used.push(name);
    const h = E.newHero({ name: name, classId: cls, people: 'ember' });
    h.rig = botRig(rng, cls);
    h.level = Math.max(1, level); h.loadout = E.unlockedSkills(h).slice(1, 4); // az alaptámadás nem kerül a sorba
    D.SLOT_ORDER.forEach(sl => { h.equipped[sl] = E.makeItem(rng, { slot: sl, rarity: rarity, level: itemLevel || h.level, classId: cls }); });
    h.bot = true;
    return h;
  }
  function snap(hero, uid, rating) {
    return { uid: uid || null, name: hero.name, classId: hero.classId, level: hero.level, power: E.power(E.heroStats(hero)), rating: rating || 1000, rig: hero.rig || null, look: hero.look || null, people: hero.people, bot: !!hero.bot };
  }

  // ===================== Aréna =====================
  // Naponta 5 párbaj. Három ellenfél közül választasz (hasonló erejűek). Pontszám: Élő-rendszer (K = 32), 1000-ről indul.
  const ARENA_FIGHTS = 5;
  function arenaState(save, now) {
    const today = day(now), wk = weekKey(now);
    let s = save.arena || { rating: 1000, wins: 0, losses: 0, day: today, fights: 0, cands: [], week: wk, weekWins: 0 };
    if (s.day !== today) { s.day = today; s.fights = 0; s.cands = []; s.rerolls = 0; }
    if (s.week !== wk) { s.week = wk; s.weekWins = 0; }
    return s;
  }
  A.arenaFind = (save, a, ctx) => {
    const s = arenaState(save, ctx.now), h = save.hero;
    if (s.fights >= ARENA_FIGHTS) fail('state', 'Mára elfogytak a párbajaid. Holnap újra jöhetsz.');
    // új ellenfeleket akkor kérhetsz, ha nincs jelölted, vagy naponta egyszer ingyen cserélhetsz
    if (s.cands && s.cands.length) { if ((s.rerolls || 0) >= 1) fail('state', 'Ma már cseréltél ellenfeleket. Válassz a mostaniak közül.'); s.rerolls = (s.rerolls || 0) + 1; }
    let pool = (ctx.arenaPool || []).slice(0, 3);
    const rng = E.mulberry32(E.newSeed());
    const used = pool.map(c => c.name), myF = E.fighterFromHero(h), TARGET = [0.65, 0.5, 0.35];
    while (pool.length < 3) { // gépi ellenfelek pótolják a hiányt: egy könnyebb, egy kiegyenlített, egy nehezebb
      const i = pool.length, gp = gearProfile(h), b = botHero(rng, h.level + [-1, 0, 1][i], gp.rarity, i, used, gp.level);
      const sn = snap(b, null, 1000); sn.hero = b; sn.target = TARGET[i]; sn.tune = tuneFor(myF, h.tactic, ghostFighter(b), TARGET[i]);
      pool.push(sn);
    }
    // minden jelöltnél kiszámoljuk a győzelmi esélyt és azt, hány pont jár a győzelemért / vész el vereségnél
    pool = pool.map(c => {
      const out = Object.assign({}, c);
      if (c.hero) { const g = ghostFighter(c.hero); out.chance = +E.winChance(myF, c.tune ? scaleGhost(g, c.tune) : g, h.tactic, 200, 2024).toFixed(2); }
      // a gépi ellenfél pontszáma az esélyből adódik (Élő-képlet visszafelé), így a nyerhető pont is igazságos
      // gépi ellenfél: a pontszáma a kitűzött esélyből adódik (Élő-képlet visszafelé), így a tét mindig ehhez az esélyhez illik
      if (c.target) { out.rating = Math.round(s.rating + 400 * Math.log10((1 - c.target) / c.target)); out.power = Math.round(out.power * c.tune); }
      // a tét a két pontszámból jön (Élő-rendszer): idővel mindenki a valódi erejének megfelelő helyre kerül
      const ex = 1 / (1 + Math.pow(10, (out.rating - s.rating) / 400));
      out.gain = Math.round(32 * (1 - ex)); out.loss = Math.round(32 * ex);
      if (c.uid) delete out.hero; // a valódi hős adatait nem tároljuk el, a harc előtt frissen töltjük be
      return out;
    });
    s.cands = pool; save.arena = s;
    return { cands: pool.map(c => Object.assign({}, c, { hero: undefined })) };
  };
  A.arenaFight = (save, a, ctx) => {
    const s = arenaState(save, ctx.now), h = save.hero, c = s.cands[a.i | 0];
    if (s.fights >= ARENA_FIGHTS) fail('state', 'Mára elfogytak a párbajaid.');
    if (!c) fail('state', 'Előbb keress ellenfelet.');
    const opp = c.hero || ctx.arenaOpp;
    if (!opp) fail('state', 'Ez az ellenfél már nem elérhető. Keress újat.');
    const heroF = E.fighterFromHero(h), g0 = ghostFighter(opp);
    // gépi ellenfél: a harc előtt a mostani felszereléshez hangoljuk újra (keresés előtti átöltözéssel nem lehet csalni)
    const tune = c.target ? tuneFor(heroF, h.tactic, g0, c.target) : c.tune;
    const mon = tune ? Object.assign(scaleGhost(g0, tune), { name: g0.name }) : g0;
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    const oppRating = c.target ? Math.round(s.rating + 400 * Math.log10((1 - c.target) / c.target)) : c.rating;
    const exp = 1 / (1 + Math.pow(10, (oppRating - s.rating) / 400)), delta = Math.round(32 * ((f.win ? 1 : 0) - exp));
    s.rating = Math.max(100, s.rating + delta); s.fights++;
    if (f.win) { s.wins++; s.weekWins++; } else s.losses++;
    const silver = Math.round(E.silverBase(h.level) * (f.win ? 1 : 0.3)), dust = f.win ? Math.round(6 + h.level / 2) : 0;
    h.silver += silver; const dGot = dust ? E.addDust(save, h, dust, ctx.now) : 0;
    s.cands = []; save.arena = s;
    if (f.win && !c.bot) G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> legyőzte az arénában: <b>${G.esc(c.name)}</b>.`, 'win');
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: { win: f.win, delta: delta, rating: s.rating, opp: Object.assign({}, c, { hero: undefined }), silver: silver, dust: dGot } };
  };

  // ===================== Csapatküldetések =====================
  // Naponta 3 küldetés. 1–2 társat viszel (más játékosok hősei, vagy gépi társak); a társak minden körben veled ütnek.
  // A szörny a csapat erejéhez igazodik (kb. 60% győzelmi esély), a jutalom bőkezűbb; a valódi társak gazdái is kapnak részt.
  const TEAM_RUNS = 3;
  function teamState(save, now) {
    const today = day(now);
    let s = save.team || { day: today, runs: 0, cands: [] };
    if (s.day !== today) { s.day = today; s.runs = 0; s.cands = []; }
    return s;
  }
  function allyShare(myF, allyHero) { // egy társ ereje a te ütéseidhez mérve (0,25–0,8)
    const a = E.fighterFromHero(allyHero);
    return Math.max(0.25, Math.min(0.8, 0.5 * (a.tam * a.maxHp) / Math.max(1, myF.tam * myF.maxHp) * 1));
  }
  A.teamFind = (save, a, ctx) => {
    const s = teamState(save, ctx.now), h = save.hero;
    if (s.runs >= TEAM_RUNS) fail('state', 'Mára elfogytak a csapatküldetéseid.');
    let pool = (ctx.teamPool || []).slice(0, 4);
    const rng = E.mulberry32(E.newSeed());
    const used = pool.map(c => c.name);
    while (pool.length < 4) { const i = pool.length, gp = gearProfile(h), b = botHero(rng, h.level, gp.rarity, i + 3, used, gp.level); const sn = snap(b, null); sn.hero = b; pool.push(sn); }
    s.cands = pool; save.team = s;
    return { cands: pool.map(c => Object.assign({}, c, { hero: undefined })) };
  };
  A.teamFight = (save, a, ctx) => {
    const s = teamState(save, ctx.now), h = save.hero;
    if (s.runs >= TEAM_RUNS) fail('state', 'Mára elfogytak a csapatküldetéseid.');
    const ids = Array.isArray(a.ids) ? a.ids.map(x => x | 0).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2) : [];
    if (!ids.length) fail('arg', 'Válassz legalább egy társat.');
    const allies = ids.map(i => s.cands[i]);
    if (allies.some(x => !x)) fail('state', 'Előbb keress társakat.');
    const heroes = allies.map((c, k) => c.hero || (ctx.teamHeroes && ctx.teamHeroes[k]));
    if (heroes.some(x => !x)) fail('state', 'Az egyik társ már nem elérhető. Keress újakat.');
    const heroF = E.fighterFromHero(h);
    heroF.pet = (heroF.pet || 0) + heroes.reduce((t, x) => t + allyShare(heroF, x), 0);
    const names = allies.map(x => x.name);
    const lm = E.findMonsterLevel(heroF, h.tactic, 0.53, { n: 160, power: 1.25 });
    const region = E.regionFor(lm, 'nehez'), reg = D.REGIONS.filter(r => r.id === region)[0] || D.REGIONS[0];
    const mon = E.monsterFighter(lm, { power: 1.25, name: reg.guards[Math.floor(Math.random() * reg.guards.length)] });
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    s.runs++; s.cands = []; save.team = s;
    const out = { win: f.win, allies: allies.map(x => Object.assign({}, x, { hero: undefined })), region: region, xp: 0, silver: 0, dust: 0 };
    if (f.win) {
      const bonus = G.xpBonus(save, ctx);
      out.xp = Math.round(E.xpBase(h.level) * 1.5 * bonus); out.silver = Math.round(E.silverBase(h.level) * 2);
      h.silver += out.silver; out.dust = E.addDust(save, h, Math.round(15 + h.level), ctx.now);
      out.levelUps = E.addXp(h, out.xp); G.levelEvents(save, out.levelUps, ctx);
      const rng = E.mulberry32(E.newSeed());
      if (rng() < 0.6) { const r = giveItem(save, ctx, rng, E.rollLoot(rng, 'kozepes', h, { pity: true, floor: 'kek' }), 'csapatküldetés'); out.item = r.item; out.salvaged = r.salvaged; }
      bump(h, 'teamWins');
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> és ${names.map(n => '<b>' + G.esc(n) + '</b>').join(', ')} legyőzték: ${G.esc(mon.name)}.`, 'win');
    }
    // a valódi társak gazdái is kapnak egy kis részt (a szerver külön írja jóvá nekik)
    out.share = f.win ? allies.filter(x => x.uid).map(x => ({ uid: x.uid, silver: Math.round(E.silverBase(x.level) * 0.5), dust: 8 })) : [];
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon, allies: names }, out: out };
  };

  // ===================== Ösvények =====================
  // A 15. szinttől kasztonként három ösvény közül választhatsz; az első választás ingyenes, a későbbi váltás Holdezüstbe kerül.
  const pathCost = h => Math.round(E.silverBase(h.level) * 15);
  A.pathPick = (save, a) => {
    const h = save.hero, list = D.PATHS[h.classId], i = a.i | 0;
    if (h.level < D.PATH_LEVEL) fail('state', `Ösvényt a ${D.PATH_LEVEL}. szinttől választhatsz.`);
    if (!list || !list[i]) fail('arg', 'Nincs ilyen ösvény.');
    if (h.path === i) fail('state', 'Már ezen az ösvényen jársz.');
    const cost = h.path == null ? 0 : pathCost(h);
    if (h.silver < cost) fail('state', 'Az ösvényváltáshoz nincs elég Holdezüstöd.');
    h.silver -= cost; h.path = i;
    G.personal(save, Date.now(), `<b>${G.esc(h.name)}</b> ${G.az(list[i].name)} ${G.esc(list[i].name)} ösvényére lépett.`, 'level');
    return { path: i, cost: cost };
  };

  // ===================== Profil =====================
  // A hős nyilvános adatai: ezt látják mások (a szerveren), és ezt látod te is a saját profilodon.
  function profileOf(save) {
    const h = save.hero, st = h.stats || {}, ach = achList(save);
    return {
      name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null,
      path: h.path != null && D.PATHS[h.classId] ? D.PATHS[h.classId][h.path].name : null, origin: h.origin, trait: h.trait, motto: h.motto || '',
      power: E.power(E.heroStats(h)), wins: st.wins || 0, expeditions: st.expeditions || 0, mythics: st.mythics || 0, legendaries: st.legendaries || 0, achTitles: (save.achTitles || []).slice(-3),
      towerMax: st.towerMax || 0, arena: save.arena ? save.arena.rating : 1000, arenaWins: save.arena ? save.arena.wins : 0,
      album: albumCount(save), trophies: ach.reduce((t, x) => t + x.claimed, 0), trophyMax: ach.reduce((t, x) => t + x.tiers.length, 0),
      topAch: ach.filter(x => x.claimed > 0).sort((x, y) => y.claimed / y.tiers.length - x.claimed / x.tiers.length).slice(0, 4).map(x => ({ name: x.name, tier: x.claimed, of: x.tiers.length })),
      mythicItems: Object.keys((save.album || {}).items || {}).filter(n => save.album.items[n].r === 'mitikus'),
      equipped: D.SLOT_ORDER.map(k => h.equipped[k]).filter(Boolean).map(it => ({ name: it.name, slot: it.slot, rarity: it.rarity, mythic: !!it.mythic, plus: it.plus || 0 }))
    };
  }

  // ---------- meglévő műveletek kiegészítése (számlálók, album) ----------
  const wrap = (name, after) => { const orig = A[name]; A[name] = (save, a, ctx) => { const r = orig(save, a, ctx); after(save, a, ctx, r); return r; }; };
  wrap('fight', save => {
    const exp = save.expedition, res = save.pendingResult;
    if (exp && res && res.win) {
      save.album = save.album || { mon: {}, items: {} };
      save.album.mon[exp.offer.guard] = exp.offer.region;
      if (exp.offer.diff === 'nehez') bump(save.hero, 'hardWins');
    }
  });
  wrap('patrolClaim', save => bump(save.hero, 'patrols'));
  // kaland közben a felszerelés/taktika cseréje csak felfelé igazíthatja a szörnyeket (gyenge szettel indulni, aztán átöltözni nem éri meg)
  function recalibrate(save) {
    const exp = save.expedition, h = save.hero;
    if (!exp || exp.phase === 'result' || !exp.offer) return;
    const moon = E.MOONS[exp.offer.moon] || E.MOONS.ujhold;
    if (!E.DIFF[exp.offer.diff]) return;
    // ugyanazzal a céllal (a hold kockázatával együtt) és ugyanazokkal a próbaharcokkal, mint az ajánlat
    const lm = E.findMonsterLevel(E.fighterFromHero(h), h.tactic, E.offerTarget(exp.offer.diff, moon), { seed: 1000 + E.DIFF_ORDER.indexOf(exp.offer.diff), n: 240, power: moon.power });
    if (lm > exp.offer.lm) { exp.offer.lm = lm; exp.offer.level = Math.max(1, Math.round(lm)); }
  }
  ['equip', 'tactic', 'skillMove', 'upgrade', 'reroll', 'pathPick'].forEach(n => wrap(n, save => recalibrate(save)));
  wrap('upgrade', save => bump(save.hero, 'upgrades'));
  ['gift', 'pathPick', 'shopOpen', 'shopReroll', 'shopBuy', 'towerFight', 'towerRush', 'arenaFind', 'arenaFight', 'teamFind', 'teamFight', 'eventFight', 'eventClaim', 'achClaim'].forEach(n => G.FREE_DURING_EXPEDITION.push(n));
  const run0 = G.run;
  G.run = function (save, action, args, ctx) {
    const r = run0(save, action, args, ctx);
    try { albumNote(save); } catch (e) { /* az album sosem akaszthatja meg a játékot */ }
    return r;
  };

  G.extra = {
    weekKey: weekKey, day: day, giftState: giftState, giftPreview: giftPreview, GIFT: GIFT, SHOP_PRICE: SHOP_PRICE, SHOP_REROLLS: SHOP_REROLLS, shopRerollCost: shopRerollCost,
    towerState: towerState, rushLimit: rushLimit, towerMonster: towerMonster, towerReward: towerReward, towerRegion: towerRegion, TOWER_TRIES: TOWER_TRIES,
    EVENTS: EVENTS, EVENT_TIERS: EVENT_TIERS, EVENT_TRIES: EVENT_TRIES, currentEvent: currentEvent, eventState: eventState,
    ghostFighter: ghostFighter, botHero: botHero, snap: snap, ARENA_FIGHTS: ARENA_FIGHTS, arenaState: arenaState, TEAM_RUNS: TEAM_RUNS, teamState: teamState, allyShare: allyShare,
    pathCost: pathCost, profileOf: profileOf,
    ACH: ACH, achList: achList, achReward: achReward, albumCount: albumCount
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ===== server/nyx.js =====
const NYX = globalThis.NYX;
// ===== Nyxoria RPG – szerverfüggvény (Supabase Edge Function: "nyx") =====
// A játéklogika (data.js, engine.js, game.js) a build során e fölé kerül, így a szerver
// pontosan ugyanazt a szabálykönyvet futtatja, mint a böngésző gyakorló módja.
//
// Beállítások (Edge Functions → Secrets):
//   NYXORIA_GUILD_ID    – a Nyxoria Discord-szerver azonosítója (tagság-ellenőrzéshez)
//   DISCORD_WEBHOOK_URL – a krónika-csatorna webhookja (nem kötelező)
//   ADMIN_DISCORD_IDS   – vesszővel elválasztott Discord-azonosítók, akik adminok
//   ALLOWED_ORIGIN      – a játék webcíme, pl. https://nyxoria.pages.dev (nem kötelező)
// A SUPABASE_URL, SUPABASE_ANON_KEY és SUPABASE_DB_URL értékeket a Supabase magától adja.

const env = (k) => Deno.env.get(k) || '';
const D = NYX.data, E = NYX.engine, G = NYX.game;
const sql = postgres(env('SUPABASE_DB_URL'), { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
const TZ = 'Europe/Budapest';
const DAY = 24 * 3600 * 1000;
const BOSSES = [
  { name: 'A Fenevad', region: 'holdfeny' }, { name: 'Ködkirálynő', region: 'kodlap' }, { name: 'A Holdfaló', region: 'ejkatlan' },
  { name: 'Árnyékcsőr', region: 'arnyromok' }, { name: 'A Hamuszarvú', region: 'szirtek' }, { name: 'Csillagrém', region: 'szirtek' },
  { name: 'A Mocsárkirály', region: 'kodlap' }, { name: 'Éjanya', region: 'ejkatlan' }
];
const TACTIC_IDS = ['roham', 'kiegy', 'kitartas'];
const CHESTS = { 3: { k: 2, min: null }, 9: { k: 3, min: 'zold' }, 15: { k: 4, min: 'kek' }, 0: { k: 3, min: 'zold' } }; // 0 = a boss legyőzéséért járó láda
const BOSS_HITS_PER_DAY = 3;

function cors(origin) {
  const allowed = env('ALLOWED_ORIGIN');
  return {
    'Access-Control-Allow-Origin': allowed ? (allowed.split(',').map(s => s.trim()).indexOf(origin) >= 0 ? origin : allowed.split(',')[0].trim()) : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin)) });
}
class GameError extends Error { constructor(code, msg, status) { super(msg); this.code = code; this.status = status || 400; } }

// ---------- idő Budapesten ----------
function tzOffsetMin(t) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(t)).forEach(x => { p[x.type] = x.value; });
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t) / 60000);
}
function zoned(y, m, d, hh, mm) { // budapesti idő → UTC ms
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMin(guess) * 60000;
  const o2 = tzOffsetMin(t);
  t = guess - o2 * 60000;
  return t;
}
function bpParts(t) {
  const local = new Date(t + tzOffsetMin(t) * 60000);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate(), wd: (local.getUTCDay() + 6) % 7, hh: local.getUTCHours() };
}
// A boss-hét: hétfő 6:00-tól vasárnap 22:00-ig. Visszaadja az aktuális (vagy épp lezárult) hetet.
function bossWeek(now) {
  const p = bpParts(now);
  let monday = new Date(Date.UTC(p.y, p.m - 1, p.d) - p.wd * DAY);
  let starts = zoned(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 6, 0);
  if (now < starts) { monday = new Date(monday.getTime() - 7 * DAY); starts = zoned(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 6, 0); }
  const md = (off) => { const x = new Date(monday.getTime() + off * DAY); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; };
  const fri = md(4), sun = md(6);
  return {
    weekStart: monday.toISOString().slice(0, 10), startsAt: starts,
    rageAt: zoned(fri[0], fri[1], fri[2], 0, 0), endsAt: zoned(sun[0], sun[1], sun[2], 22, 0),
    index: Math.floor(monday.getTime() / (7 * DAY))
  };
}

// ---------- hitelesítés ----------
async function authUser(req) {
  const h = req.headers.get('Authorization') || '';
  const token = h.replace(/^Bearer\s+/i, '');
  if (!token) throw new GameError('auth', 'Jelentkezz be újra.', 401);
  if (env('TEST_AUTH') === '1' && token.startsWith('test:')) { // csak helyi teszthez
    const [, id, name, did] = token.split(':');
    return { id: id, name: decodeURIComponent(name || 'Teszt'), discordId: did || id.slice(0, 8), avatar: '' };
  }
  const apikey = env('SUPABASE_ANON_KEY') || req.headers.get('apikey') || '';
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { Authorization: 'Bearer ' + token, apikey: apikey } });
  if (!r.ok) throw new GameError('auth', 'Lejárt a belépés, jelentkezz be újra.', 401);
  const u = await r.json();
  const md = u.user_metadata || {}, ident = (u.identities || []).filter(i => i.provider === 'discord')[0];
  return {
    id: u.id, name: (md.custom_claims && md.custom_claims.global_name) || md.full_name || md.name || md.user_name || 'Ismeretlen',
    discordId: md.provider_id || md.sub || (ident && ident.id) || '', avatar: md.avatar_url || md.picture || ''
  };
}
function isAdminId(discordId) { return env('ADMIN_DISCORD_IDS').split(',').map(s => s.trim()).filter(Boolean).indexOf(String(discordId)) >= 0; }

// ---------- világállapot ----------
async function worldState(tx) {
  const [w] = await tx`select median_level, active_players, updated_at from world_state where id = 1`;
  if (w && Date.now() - new Date(w.updated_at).getTime() < 3600 * 1000) return { median: w.median_level, active: w.active_players };
  const [r] = await tx`select coalesce(percentile_disc(0.5) within group (order by level), 0)::int as median, count(*)::int as active
                       from heroes where active_at > now() - interval '14 days'`;
  await tx`update world_state set median_level = ${r.median}, active_players = ${r.active}, updated_at = now() where id = 1`;
  return { median: r.median, active: r.active };
}

async function ensureBoss(world) {
  const now = Date.now(), wk = bossWeek(now);
  let [boss] = await sql`select * from world_bosses where week_start = ${wk.weekStart}`;
  if (boss) return boss;
  if (now >= wk.endsAt) return null;
  await finalizeOld();
  const def = BOSSES[wk.index % BOSSES.length];
  const median = Math.max(3, world.median || 1), level = median + 2;
  const avg = E.averageBossHit(median, 40);
  const hp = Math.round(Math.max(5, world.active) * 12 * avg);
  const weakness = TACTIC_IDS[(wk.index * 7) % 3];
  await sql`insert into world_bosses (week_start, name, region, level, max_hp, hp, weakness, starts_at, rage_at, ends_at)
            values (${wk.weekStart}, ${def.name}, ${def.region}, ${level}, ${hp}, ${hp}, ${weakness},
                    ${new Date(wk.startsAt)}, ${new Date(wk.rageAt)}, ${new Date(wk.endsAt)})
            on conflict (week_start) do nothing`;
  [boss] = await sql`select * from world_bosses where week_start = ${wk.weekStart}`;
  await chronicle(null, 'boss', `<b>${G.esc(boss.name)}</b> megérkezett! Ezen a héten az egész szerver együtt küzd ellene.`, true);
  return boss;
}

// A lejárt bossok lezárása: a 3 legnagyobb sebző címet kap
async function finalizeOld() {
  const old = await sql`select * from world_bosses where finalized = false and ends_at < now() order by id`;
  for (const b of old) {
    const top = await sql`select p.user_id, p.damage, h.name from boss_participants p join heroes h on h.user_id = p.user_id
                          where p.boss_id = ${b.id} and p.damage > 0 order by p.damage desc limit 3`;
    const titles = [`${b.name} réme`, `${b.name} ostora`, `${b.name} vadásza`];
    for (let i = 0; i < top.length; i++) await sql`update boss_participants set title = ${titles[i]} where boss_id = ${b.id} and user_id = ${top[i].user_id}`;
    await sql`update world_bosses set finalized = true where id = ${b.id}`;
    if (top.length) {
      await chronicle(null, 'boss', `${G.esc(b.name)} hete lezárult. A legnagyobb sebzők: ${top.map((t, i) => `${i + 1}. <b>${G.esc(t.name)}</b> (${G.fmt(Number(t.damage))})`).join(', ')}.`, true);
    }
  }
}

function bossPublic(b, now) {
  if (!b) return null;
  return {
    id: Number(b.id), name: b.name, region: b.region, level: b.level, maxHp: Number(b.max_hp), hp: Number(b.hp), weakness: b.weakness,
    startsAt: new Date(b.starts_at).getTime(), rageAt: new Date(b.rage_at).getTime(), endsAt: new Date(b.ends_at).getTime(),
    killedAt: b.killed_at ? new Date(b.killed_at).getTime() : null,
    active: now >= new Date(b.starts_at).getTime() && now < new Date(b.ends_at).getTime() && !b.killed_at,
    rage: now >= new Date(b.rage_at).getTime()
  };
}

// ---------- krónika és Discord ----------
function plain(html) { return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
async function chronicle(userId, kind, html, announce) {
  await sql`insert into chronicle (user_id, kind, html) values (${userId}, ${kind}, ${html})`;
  const hook = env('DISCORD_WEBHOOK_URL');
  if (announce && hook) {
    const p = fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Nyxoria Krónika', content: plain(html).slice(0, 1900), allowed_mentions: { parse: [] } }) }).catch(() => {});
    try { if (globalThis.EdgeRuntime && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(p); else await p; } catch (e) { /* a krónika így is mentve */ }
  }
}
// a legendás tárgy a közös krónikába kerül (mindenki látja), Discordra csak a mitikus megy
const ANNOUNCE = { mythic: true, plus10: true, level: (e) => e.level >= 30, lila: false, legendas: false };
async function publishEvents(userId, events) {
  for (const e of events) {
    const a = ANNOUNCE[e.kind];
    await chronicle(userId, e.kind, e.html, typeof a === 'function' ? a(e) : !!a);
  }
}

// ---------- hős betöltése és mentése ----------
async function loadHero(tx, userId, lock) {
  const rows = lock ? await tx`select save from heroes where user_id = ${userId} for update` : await tx`select save from heroes where user_id = ${userId}`;
  return rows[0] ? rows[0].save : null;
}
async function storeHero(tx, userId, save) {
  const s = G.summary(save);
  await tx`update heroes set save = ${tx.json(save)}, level = ${s.level}, xp = ${s.xp}, power = ${s.power}, mythics = ${s.mythics}, legendaries = ${s.legendaries}, wins = ${s.wins},
           version = version + 1, updated_at = now(), active_at = now() where user_id = ${userId}`;
}

async function myBossRows(userId, boss) {
  if (!boss) return [];
  const rows = await sql`select p.boss_id, p.damage, p.hits, p.day, p.hits_day, p.claimed, p.title, b.name, b.killed_at, b.ends_at
                         from boss_participants p join world_bosses b on b.id = p.boss_id
                         where p.user_id = ${userId} and p.boss_id >= ${Number(boss.id) - 1} order by p.boss_id desc`;
  const today = G.budapestDate(Date.now());
  return rows.map(r => ({ bossId: Number(r.boss_id), name: r.name, damage: Number(r.damage), hits: r.hits, hitsToday: r.day === today ? r.hits_day : 0,
    claimed: r.claimed || [], title: r.title, killed: !!r.killed_at, ended: new Date(r.ends_at).getTime() < Date.now() }));
}

// a pihenő hősök rövid adatai (a hősválasztóhoz)
async function heroSlots(userId) {
  const rows = await sql`select slot, save from hero_slots where user_id = ${userId} order by slot`;
  return rows.map(r => { const h = r.save.hero; return { slot: r.slot, name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null, path: h.path }; });
}
const MAX_HEROES = 3;
async function nameTaken(tx, name) {
  const [a] = await tx`select 1 as x from heroes where lower(name) = lower(${name}) union all select 1 from hero_slots where lower(name) = lower(${name}) limit 1`;
  return !!a;
}
// hőscsere: a mostani hős a pihenőhelyre kerül, a választott (vagy az új) lesz a játszott. A napi ajándék a fiókhoz tartozik, ezért átkerül.
async function heroAction(user, action, args) {
  return sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(hashtext(${'hero:' + user.id}))`;
    const cur = await loadHero(tx, user.id, true);
    if (!cur) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const slots = await tx`select slot from hero_slots where user_id = ${user.id}`;
    const used = slots.map(r => r.slot);
    const park = async (slot, save) => {
      const s = G.summary(save);
      const [c] = await tx`select created_at from heroes where user_id = ${user.id}`;
      await tx`insert into hero_slots (user_id, slot, name, class_id, level, xp, power, mythics, legendaries, save, created_at)
               values (${user.id}, ${slot}, ${save.hero.name}, ${save.hero.classId}, ${s.level}, ${s.xp}, ${s.power}, ${s.mythics}, ${s.legendaries}, ${tx.json(save)}, ${c.created_at})`;
    };
    const activate = async (save, createdAt) => {
      save.gift = cur.gift; // a napi ajándék fiókonként jár
      const s = G.summary(save);
      await tx`update heroes set name = ${save.hero.name}, class_id = ${save.hero.classId}, save = ${tx.json(save)}, level = ${s.level}, xp = ${s.xp}, power = ${s.power},
               mythics = ${s.mythics}, legendaries = ${s.legendaries}, wins = ${s.wins}, version = version + 1, updated_at = now(), active_at = now(),
               created_at = ${createdAt || new Date()} where user_id = ${user.id}`;
      return save;
    };
    if (action === 'heroNew') {
      if (used.length + 1 >= MAX_HEROES) throw new GameError('state', `Egy fiókhoz legfeljebb ${MAX_HEROES} hős tartozhat. Előbb törölj egyet a pihenő hőseid közül.`);
      const save = G.createSave(args, Date.now());
      save.settings = Object.assign({}, save.settings, cur.settings || {}); save.seenTips = Object.assign({}, cur.seenTips || {}); // a beállítások és a már látott tippek maradnak
      if (await nameTaken(tx, save.hero.name)) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
      G.refreshOffers(save);
      await park([1, 2].filter(n => used.indexOf(n) < 0)[0], cur);
      await activate(save, null);
      await chronicle(user.id, 'new', `Új hős érkezett: <b>${G.esc(save.hero.name)}</b>, ${G.az(D.PEOPLES[save.hero.people].name)} ${D.PEOPLES[save.hero.people].name.toLowerCase()} ${D.CLASSES[save.hero.classId].name.toLowerCase()}. Üdv a Nyxorián!`, true);
      return save;
    }
    const slot = Number(args.slot) | 0;
    const [row] = await tx`select save, created_at from hero_slots where user_id = ${user.id} and slot = ${slot} for update`;
    if (!row) throw new GameError('arg', 'Ezen a helyen nincs hős.');
    if (action === 'heroDelete') {
      if (String(args.confirm || '').trim().toLowerCase() !== row.save.hero.name.toLowerCase()) throw new GameError('arg', 'A törléshez írd be pontosan a hős nevét.');
      await tx`delete from hero_slots where user_id = ${user.id} and slot = ${slot}`;
      return cur;
    }
    // heroSwitch
    await tx`delete from hero_slots where user_id = ${user.id} and slot = ${slot}`;
    await park(slot, cur);
    return activate(row.save, row.created_at);
  });
}
async function statePayload(user, player) {
  await applyPending(user.id).catch(() => 0);
  const world = await worldState(sql);
  const boss = await ensureBoss(world);
  const save = await loadHero(sql, user.id, false);
  const chron = await sql`select created_at, kind, html from chronicle order by id desc limit 30`;
  const mine = await myBossRows(user.id, boss);
  const titles = await sql`select title from boss_participants where user_id = ${user.id} and title is not null order by boss_id desc limit 5`;
  let rank = null;
  if (save) {
    const [r] = await sql`select count(*)::int + 1 as rank from ${ALLH(sql)} h where (level, xp) > (${save.hero.level}, ${save.hero.xp})`;
    rank = r.rank;
  }
  if (save) G.refreshOffers(save);
  return {
    me: { name: user.name, avatar: user.avatar, admin: player.is_admin || isAdminId(user.discordId), verified: !!player.verified_at },
    save: save ? G.sanitize(save) : null,
    world: { median: world.median, active: world.active, wind: save ? G.wind(save.hero.level, world.median) : 1, rank: rank },
    heroes: await heroSlots(user.id),
    notice: await sql`select notice, notice_at from world_state where id = 1`.then(r => r[0] && r[0].notice ? { text: r[0].notice, at: new Date(r[0].notice_at).getTime() } : null),
    boss: bossPublic(boss, Date.now()), bossMine: mine, titles: titles.map(t => t.title), guild: guildPublic(await guildOf(user.id)),
    chronicle: chron.map(c => ({ t: new Date(c.created_at).getTime(), kind: c.kind, text: c.html }))
  };
}

// ---------- boss-ütés és ládák ----------
// a ládák is a közös sorsolást használják (Nehéz tábla, szintkapukkal), legalább a láda alsó ritkaságával
function rollMinRarity(rng, min, h) { return E.rollLoot(rng, 'nehez', h, { floor: min || null }); }
async function bossHit(user, args) {
  return await sql.begin(async tx => {
    const save = await loadHero(tx, user.id, true);
    if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const [b] = await tx`select * from world_bosses where id = ${args.bossId | 0} for update`;
    const now = Date.now();
    const bp = bossPublic(b, now);
    if (!bp || !bp.active) throw new GameError('boss', 'A heti szörny most nem támadható.');
    const today = G.budapestDate(now);
    const [p0] = await tx`select * from boss_participants where boss_id = ${b.id} and user_id = ${user.id}`;
    const hitsToday = p0 && p0.day === today ? p0.hits_day : 0;
    if (hitsToday >= BOSS_HITS_PER_DAY) throw new GameError('limit', 'Ma már mindhárom ütésedet felhasználtad. Holnap újra jöhetsz!');
    E.torchState(save, now);
    const h = save.hero, heroF = E.fighterFromHero(h), bossF = E.bossFighter(b.level, { rage: bp.rage, name: b.name });
    const fight = E.bossHit(heroF, bossF, h.tactic, E.newSeed(), { weakness: b.weakness, log: true });
    const dmg = Math.min(fight.damage, Number(b.hp));
    const newHp = Number(b.hp) - dmg;
    const ctx = { now: now, events: [], median: (await worldState(tx)).median };
    const xp = Math.round(E.xpBase(h.level) * 0.25 * G.xpBonus(save, ctx));
    const dust = E.addDust(save, h, (8 + 1.5 * h.level) * 0.5 * (bp.rage ? 1.25 : 1), now);
    const silver = Math.round(E.silverBase(h.level) * 0.3);
    h.silver += silver;
    const ups = E.addXp(h, xp);
    G.levelEvents(save, ups, ctx);
    G.personal(save, now, `<b>${G.esc(h.name)}</b> ${G.fmt(dmg)} sebzést vitt be a heti szörnynek (${G.esc(b.name)}).`, 'win');
    await tx`insert into boss_participants (boss_id, user_id, damage, hits, day, hits_day) values (${b.id}, ${user.id}, ${dmg}, 1, ${today}, 1)
             on conflict (boss_id, user_id) do update set damage = boss_participants.damage + ${dmg}, hits = boss_participants.hits + 1,
             hits_day = case when boss_participants.day = ${today} then boss_participants.hits_day + 1 else 1 end, day = ${today}`;
    let killed = false;
    if (newHp <= 0) {
      killed = true;
      await tx`update world_bosses set hp = 0, killed_at = now() where id = ${b.id}`;
    } else await tx`update world_bosses set hp = ${newHp} where id = ${b.id}`;
    await storeHero(tx, user.id, save);
    await tx`insert into action_log (user_id, action, info) values (${user.id}, 'bossHit', ${tx.json({ boss: Number(b.id), dmg: dmg })})`;
    return { save, ctx, killed, b, out: { damage: dmg, weak: fight.weak, xp: xp, dust: dust, silver: silver, levelUps: ups, killed: killed,
      fight: { log: fight.log, win: true, timeout: false, rounds: fight.rounds, heroF: heroF, mon: Object.assign({}, bossF, { maxHp: Number(b.max_hp), hpStart: Number(b.hp) }), boss: true } } };
  }).then(async r => {
    await publishEvents(user.id, r.ctx.events);
    if (r.killed) await chronicle(user.id, 'boss', `A közösség legyőzte: <b>${G.esc(r.b.name)}</b>! Az utolsó csapást <b>${G.esc(r.save.hero.name)}</b> mérte. Mindenki, aki ütött, kap egy győzelmi ládát.`, true);
    return r;
  });
}

async function bossClaim(user, args) {
  const tier = args.tier | 0;
  if (!CHESTS[tier]) throw new GameError('arg', 'Nincs ilyen láda.');
  return await sql.begin(async tx => {
    const save = await loadHero(tx, user.id, true);
    if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    const [p] = await tx`select p.*, b.killed_at, b.name from boss_participants p join world_bosses b on b.id = p.boss_id
                         where p.boss_id = ${args.bossId | 0} and p.user_id = ${user.id} for update of p`;
    if (!p) throw new GameError('state', 'Ezen a héten még nem támadtad meg a heti szörnyet.');
    if ((p.claimed || []).indexOf(tier) >= 0) throw new GameError('state', 'Ezt a ládát már kinyitottad.');
    if (tier === 0 ? !p.killed_at : p.hits < tier) throw new GameError('state', 'Ez a láda még nem jár.');
    const now = Date.now(), h = save.hero, c = CHESTS[tier], rng = E.mulberry32(E.newSeed());
    const ctx = { now: now, events: [] };
    const out = { tier: tier, silver: Math.round(E.silverBase(h.level) * c.k), dust: 0, item: null };
    h.silver += out.silver;
    out.dust = E.addDust(save, h, (8 + 1.5 * h.level) * c.k, now);
    // az Arany láda a hét fő célja: a 25. szinttől 3% legendás, a 12.-től 12% biztos lila
    const roll = rng();
    const rar = tier === 15 && h.level >= E.RARITY_GATE.legendas && roll < 0.03 ? 'legendas' : tier === 15 && h.level >= E.RARITY_GATE.lila && roll < (h.level >= E.RARITY_GATE.legendas ? 0.15 : 0.12) ? 'lila' : rollMinRarity(rng, c.min, h);
    const it = E.makeItem(rng, { rarity: rar, level: h.level, classId: h.classId, hero: h });
    out.item = it; out.itemResult = E.addItem(save, h, it, now);
    G.itemEvent(save, it, ctx, 'szörnyláda');
    if (tier === 0) { save.buffs = save.buffs || {}; save.buffs.xpUntil = now + DAY; out.buff = true; }
    G.personal(save, now, `<b>${G.esc(h.name)}</b> kinyitott egy ${tier === 0 ? 'győzelmi' : tier === 3 ? 'részvételi' : tier === 9 ? 'ezüst' : 'arany'} ládát.`, 'loot');
    await tx`update boss_participants set claimed = array_append(claimed, ${tier}) where boss_id = ${p.boss_id} and user_id = ${user.id}`;
    G.refreshOffers(save);
    await storeHero(tx, user.id, save);
    return { save, ctx, out };
  }).then(async r => { await publishEvents(user.id, r.ctx.events); return r; });
}

// ---------- ranglisták ----------
// minden hős (az épp játszott és a pihenők is) a ranglistákhoz és a profilhoz
const ALLH = sql => sql`(select user_id, name, class_id, level, xp, power, mythics, legendaries, save, created_at from heroes
                         union all select user_id, name, class_id, level, xp, power, mythics, legendaries, save, created_at from hero_slots)`;
async function ranks(user, args) {
  const tab = args.tab;
  const [mine] = await sql`select lower(name) as n from heroes where user_id = ${user.id}`, myName = mine ? mine.n : null; // csak a most játszott hős a „te”
  if (tab === 'boss') {
    const [b] = await sql`select id from world_bosses order by id desc limit 1`;
    if (!b) return { rows: [] };
    const rows = await sql`select h.name, h.class_id, h.level, p.damage as value, p.user_id from boss_participants p join heroes h on h.user_id = p.user_id
                           where p.boss_id = ${b.id} order by p.damage desc limit 50`;
    return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id })) };
  }
  if (tab === 'arena' || tab === 'torony') {
    const wk = weekNow();
    const rows = tab === 'arena'
      ? await sql`select name, class_id, level, (save->'arena'->>'rating')::int as value, user_id from ${ALLH(sql)} h where save ? 'arena' order by value desc limit 50`
      : await sql`select name, class_id, level, (save->'tower'->>'floor')::int as value, user_id from ${ALLH(sql)} h where save->'tower'->>'week' = ${wk} order by value desc, level asc limit 50`;
    return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id && (!myName || r.name.toLowerCase() === myName) })) };
  }
  if (tab === 'ceh') {
    const rows = await sql`select g.name, g.tag, count(m.user_id)::int as members, coalesce(sum(case when m.week = ${weekNow()} then m.week_wins else 0 end), 0)::int as value,
                           bool_or(m.user_id = ${user.id}) as mine from guilds g join guild_members m on m.guild_id = g.id group by g.id order by value desc limit 50`;
    return { rows: rows.map(r => ({ name: `${r.name} [${r.tag}]`, classId: null, level: r.members, value: r.value, me: !!r.mine, guild: true })) };
  }
  let rows;
  if (tab === 'ujonc') rows = await sql`select name, class_id, level, xp as value, user_id from ${ALLH(sql)} h where created_at > now() - interval '14 days' order by level desc, xp desc limit 50`;
  else if (tab === 'gyujto') rows = await sql`select name, class_id, level, legendaries as value, user_id from ${ALLH(sql)} h order by legendaries desc, mythics desc, power desc limit 50`;
  else if (tab === 'ero') rows = await sql`select name, class_id, level, power as value, user_id from ${ALLH(sql)} h order by power desc limit 50`;
  else rows = await sql`select name, class_id, level, xp as value, user_id from ${ALLH(sql)} h order by level desc, xp desc limit 50`;
  return { rows: rows.map(r => ({ name: r.name, classId: r.class_id, level: r.level, value: Number(r.value), me: r.user_id === user.id && (!myName || r.name.toLowerCase() === myName) })) };
}

// ---------- admin ----------
async function admin(user, player, args) {
  if (!(player.is_admin || isAdminId(user.discordId))) throw new GameError('admin', 'Ehhez nincs jogod.', 403);
  if (args.op === 'stats') {
    const [s] = await sql`select (select count(*) from ${ALLH(sql)} h)::int as heroes, count(*) filter (where active_at > now() - interval '1 day')::int as active1,
                          count(*) filter (where active_at > now() - interval '14 days')::int as active14, coalesce(sum((save->'hero'->>'silver')::bigint), 0)::bigint as silver,
                          (select coalesce(max(level), 0) from ${ALLH(sql)} h)::int as maxlevel from heroes`;
    const [p] = await sql`select count(*)::int as players, count(*) filter (where banned)::int as banned from players`;
    const recent = await sql`select at, action, info, (select name from heroes h where h.user_id = l.user_id) as name from action_log l order by id desc limit 20`;
    return { stats: Object.assign({}, s, p, { silver: Number(s.silver) }), recent: recent.map(r => ({ at: new Date(r.at).getTime(), action: r.action, name: r.name, info: r.info })) };
  }
  const alog = (target, action, info) => sql`insert into admin_log (admin_id, target, action, info) values (${user.id}, ${target || null}, ${action}, ${sql.json(info || {})})`;
  const uidOf = async () => {
    if (args.uid) { const [p] = await sql`select user_id from players where user_id = ${String(args.uid)}`; if (p) return p.user_id; }
    if (args.name) { const [h] = await sql`select user_id from ${ALLH(sql)} h where lower(name) = lower(${String(args.name)}) limit 1`; if (h) return h.user_id; }
    throw new GameError('arg', 'Nincs ilyen játékos.');
  };
  // ---- játékoslista és adatlap ----
  if (args.op === 'players') {
    const q = String(args.q || '').trim(), like = '%' + q.toLowerCase() + '%';
    const rows = await sql`select p.user_id, p.discord_name, p.avatar_url, p.banned, p.is_admin, p.created_at, h.name, h.class_id, h.level, h.power, h.active_at,
                           (h.save->'hero'->>'silver')::bigint as silver, (h.save->'hero'->>'dust')::bigint as dust,
                           (select count(*) from hero_slots s where s.user_id = p.user_id)::int as slots, g.name as gname, g.tag
                           from players p left join heroes h on h.user_id = p.user_id left join guild_members m on m.user_id = p.user_id left join guilds g on g.id = m.guild_id
                           where ${q} = '' or lower(coalesce(p.discord_name, '')) like ${like} or lower(coalesce(h.name, '')) like ${like}
                              or exists (select 1 from hero_slots s where s.user_id = p.user_id and lower(s.name) like ${like})
                           order by h.active_at desc nulls last limit 100`;
    return { players: rows.map(r => ({ uid: r.user_id, discord: r.discord_name, avatar: r.avatar_url, banned: r.banned, admin: r.is_admin, joined: new Date(r.created_at).getTime(),
      hero: r.name, classId: r.class_id, level: r.level, power: r.power, active: r.active_at ? new Date(r.active_at).getTime() : null, silver: Number(r.silver || 0), dust: Number(r.dust || 0), slots: r.slots, guild: r.gname ? `${r.gname} [${r.tag}]` : null })) };
  }
  if (args.op === 'player') {
    const uid = await uidOf();
    const [p] = await sql`select * from players where user_id = ${uid}`;
    const [h] = await sql`select save, active_at, created_at from heroes where user_id = ${uid}`;
    const slots = await sql`select slot, name, class_id, level, power from hero_slots where user_id = ${uid} order by slot`;
    const g = await guildOf(uid);
    const acts = await sql`select at, action, info from action_log where user_id = ${uid} order by id desc limit 40`;
    const adm = await sql`select at, action, info from admin_log where target = ${uid} order by id desc limit 20`;
    const [cnt] = await sql`select count(*) filter (where at > now() - interval '1 day')::int as d1, count(*)::int as total from action_log where user_id = ${uid}`;
    let hero = null;
    if (h) { const x = h.save.hero; hero = { name: x.name, classId: x.classId, people: x.people, level: x.level, xp: x.xp, silver: x.silver, dust: x.dust, rig: x.rig || null, look: x.look || null,
      power: E.power(E.heroStats(x)), path: x.path, torches: h.save.torches ? h.save.torches.count : null, stats: x.stats || {}, equipped: D.SLOT_ORDER.map(k => x.equipped[k]).filter(Boolean),
      inventory: (x.inventory || []).length, arena: h.save.arena ? h.save.arena.rating : 1000, tower: x.stats && x.stats.towerMax || 0, created: new Date(h.created_at).getTime(), active: new Date(h.active_at).getTime() }; }
    return { player: { uid: uid, discord: p.discord_name, discordId: p.discord_id, avatar: p.avatar_url, banned: p.banned, banReason: p.ban_reason, admin: p.is_admin, joined: new Date(p.created_at).getTime() },
      hero: hero, slots: slots.map(s => ({ slot: s.slot, name: s.name, classId: s.class_id, level: s.level, power: s.power })), guild: g ? { id: Number(g.id), name: g.name, tag: g.tag, role: g.role } : null,
      actions: acts.map(a => ({ at: new Date(a.at).getTime(), action: a.action, info: a.info })), adminLog: adm.map(a => ({ at: new Date(a.at).getTime(), action: a.action, info: a.info })), counts: cnt };
  }
  // ---- játékos kezelése (minden lépés az admin-naplóba kerül) ----
  if (args.op === 'ban' || args.op === 'unban') {
    const uid = await uidOf();
    if (uid === user.id) throw new GameError('arg', 'Saját magadat nem tilthatod ki.');
    const reason = String(args.reason || '').slice(0, 200);
    await sql`update players set banned = ${args.op === 'ban'}, ban_reason = ${args.op === 'ban' ? reason : null} where user_id = ${uid}`;
    await alog(uid, args.op, { reason: reason });
    return { ok: true };
  }
  if (args.op === 'setAdmin') {
    const uid = await uidOf();
    if (uid === user.id && !args.on) throw new GameError('arg', 'Saját magadtól nem veheted el az admin jogot.');
    await sql`update players set is_admin = ${!!args.on} where user_id = ${uid}`;
    await alog(uid, 'setAdmin', { on: !!args.on });
    return { ok: true };
  }
  if (args.op === 'grant') {
    const uid = await uidOf();
    const silver = Math.round(Number(args.silver) || 0), dust = Math.round(Number(args.dust) || 0), torches = Math.round(Number(args.torches) || 0);
    const item = args.item && D.RARITIES[args.item.rarity] ? { rarity: args.item.rarity, slot: D.SLOTS[args.item.slot] ? args.item.slot : null } : null;
    const note = String(args.note || '').slice(0, 200);
    if (Math.abs(silver) > 1e7 || Math.abs(dust) > 1e6 || Math.abs(torches) > 50) throw new GameError('arg', 'Túl nagy érték.');
    const out = await sql.begin(async tx => {
      const save = await loadHero(tx, uid, true);
      if (!save) throw new GameError('arg', 'Ennek a játékosnak nincs hőse.');
      const h = save.hero, now = Date.now();
      h.silver = Math.max(0, h.silver + silver); h.dust = Math.max(0, h.dust + dust);
      if (torches) { E.torchState(save, now); save.torches.count = Math.max(0, Math.min(E.TORCH.max, save.torches.count + torches)); }
      let it = null;
      if (item) { it = E.makeItem(E.mulberry32(E.newSeed()), { rarity: item.rarity, slot: item.slot || undefined, level: h.level, classId: h.classId, hero: h }); E.addItem(save, h, it, now); }
      const parts = [silver ? `${silver > 0 ? '+' : ''}${silver} Holdezüst` : '', dust ? `${dust > 0 ? '+' : ''}${dust} Csillagpor` : '', torches ? `${torches > 0 ? '+' : ''}${torches} fáklya` : '', it ? G.esc(it.name) : ''].filter(Boolean);
      if (parts.length) G.personal(save, now, `Az adminoktól: ${parts.join(', ')}${note ? ` – ${G.esc(note)}` : ''}.`, 'loot');
      await storeHero(tx, uid, save);
      return { item: it ? it.name : null };
    });
    await alog(uid, 'grant', { silver: silver, dust: dust, torches: torches, item: out.item, note: note });
    return out;
  }
  if (args.op === 'rename') {
    const uid = await uidOf(), name = String(args.newName || '').trim().replace(/\s+/g, ' ');
    if (!G.validName(name)) throw new GameError('arg', 'A név 2–16 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (await nameTaken(sql, name)) throw new GameError('arg', 'Ez a név már foglalt.');
    let old = '';
    await sql.begin(async tx => { const save = await loadHero(tx, uid, true); if (!save) throw new GameError('arg', 'Nincs hőse.'); old = save.hero.name; save.hero.name = name;
      await tx`update heroes set name = ${name} where user_id = ${uid}`; await storeHero(tx, uid, save); });
    await alog(uid, 'rename', { from: old, to: name });
    return { ok: true };
  }
  // ---- bejelentés és ajándék mindenkinek ----
  if (args.op === 'notice') {
    const text = String(args.text || '').trim().slice(0, 400);
    await sql`update world_state set notice = ${text || null}, notice_at = ${text ? new Date() : null} where id = 1`;
    if (text && args.chronicle) await chronicle(null, 'admin', `📣 ${G.esc(text)}`, !!args.discord);
    await alog(null, 'notice', { text: text, chronicle: !!args.chronicle });
    return { ok: true };
  }
  if (args.op === 'giftAll') {
    const silver = Math.max(0, Math.round(Number(args.silver) || 0)), dust = Math.max(0, Math.round(Number(args.dust) || 0)), note = String(args.note || '').trim().slice(0, 200);
    if (!silver && !dust) throw new GameError('arg', 'Adj meg Holdezüstöt vagy Csillagport.');
    if (silver > 1e6 || dust > 1e5) throw new GameError('arg', 'Túl nagy érték.');
    const html = `Ajándék mindenkinek az adminoktól${note ? `: ${G.esc(note)}` : ''} (${[silver ? `+${silver} Holdezüst` : '', dust ? `+${dust} Csillagpor` : ''].filter(Boolean).join(', ')}).`;
    const r = await sql`insert into pending_rewards (user_id, silver, dust, html) select user_id, ${silver}, ${dust}, ${html} from players where not banned returning id`;
    await alog(null, 'giftAll', { silver: silver, dust: dust, note: note, count: r.length });
    return { count: r.length };
  }
  // ---- világ: heti szörny, céhek, gyanús aktivitás ----
  if (args.op === 'world') {
    const [b] = await sql`select * from world_bosses order by id desc limit 1`;
    const [bp] = b ? await sql`select count(*)::int as n, coalesce(sum(damage), 0)::bigint as dmg from boss_participants where boss_id = ${b.id}` : [null];
    const guilds = await sql`select g.id, g.name, g.tag, g.stars, g.created_at, count(m.user_id)::int as members from guilds g left join guild_members m on m.guild_id = g.id group by g.id order by members desc, g.id limit 100`;
    const [w] = await sql`select notice, notice_at from world_state where id = 1`;
    // gyanús: sok művelet egy nap alatt, vagy a fiók korához képest nagyon gyors szintlépés
    const sus = await sql`select p.user_id, p.discord_name, h.name, h.level, h.created_at, (select count(*) from action_log l where l.user_id = p.user_id and l.at > now() - interval '1 day')::int as d1
                          from players p join heroes h on h.user_id = p.user_id where not p.banned`;
    const flagged = sus.map(r => { const days = Math.max(1, (Date.now() - new Date(r.created_at).getTime()) / 864e5), why = [];
      if (r.d1 > 600) why.push(`${r.d1} művelet 24 óra alatt`); if (r.level > 8 && r.level / days > 7) why.push(`${r.level}. szint ${Math.ceil(days)} nap alatt`);
      return why.length ? { uid: r.user_id, discord: r.discord_name, hero: r.name, level: r.level, why: why } : null; }).filter(Boolean);
    const recent = await sql`select a.at, a.action, a.info, p.discord_name as admin, t.discord_name as target from admin_log a left join players p on p.user_id = a.admin_id left join players t on t.user_id = a.target order by a.id desc limit 30`;
    return { boss: b ? { id: Number(b.id), name: b.name, level: b.level, hp: Number(b.hp), maxHp: Number(b.max_hp), killed: !!b.killed_at, ends: new Date(b.ends_at).getTime(), participants: bp.n, damage: Number(bp.dmg) } : null,
      guilds: guilds.map(g => ({ id: Number(g.id), name: g.name, tag: g.tag, stars: g.stars, members: g.members, created: new Date(g.created_at).getTime() })), notice: w ? w.notice : null,
      flagged: flagged.slice(0, 40), adminLog: recent.map(a => ({ at: new Date(a.at).getTime(), action: a.action, info: a.info, admin: a.admin, target: a.target })) };
  }
  if (args.op === 'bossReset') {
    const [b] = await sql`select id, name from world_bosses order by id desc limit 1`;
    if (!b) throw new GameError('arg', 'Nincs heti szörny.');
    await sql`update world_bosses set hp = max_hp, killed_at = null, finalized = false where id = ${b.id}`;
    await sql`update boss_participants set damage = 0, hits = 0, hits_day = 0, claimed = '{}', title = null where boss_id = ${b.id}`;
    await alog(null, 'bossReset', { boss: b.name });
    return { ok: true };
  }
  if (args.op === 'guildRename') {
    const gid = Number(args.gid) | 0, name = String(args.newName || '').trim(), tag = String(args.tag || '').trim().toUpperCase();
    if (name.length < 3 || name.length > 24 || tag.length < 2 || tag.length > 4) throw new GameError('arg', 'A név 3–24, a jel 2–4 karakter legyen.');
    try { await sql`update guilds set name = ${name}, tag = ${tag} where id = ${gid}`; } catch (e) { throw new GameError('arg', 'Ez a céhnév vagy jel már foglalt.'); }
    await alog(null, 'guildRename', { gid: gid, name: name, tag: tag });
    return { ok: true };
  }
  if (args.op === 'guildDisband') {
    const gid = Number(args.gid) | 0, [g] = await sql`select name from guilds where id = ${gid}`;
    if (!g) throw new GameError('arg', 'Nincs ilyen céh.');
    await sql`delete from guilds where id = ${gid}`;
    await alog(null, 'guildDisband', { gid: gid, name: g.name });
    return { ok: true };
  }
  throw new GameError('arg', 'Ismeretlen admin-művelet.');
}

// ---------- belépési kör ----------
const LOGGED = ['start', 'fight', 'choose', 'retreat', 'upgrade', 'reroll', 'patrolStart', 'patrolClaim', 'equip', 'salvageWeak'];

// ---------- Aréna, csapat, céh ----------
const X = G.extra;
const GUILD_MAX = 20, GUILD_COST = 1000;
const GUILD_GOALS = [{ w: 50, silver: 3, dust: 40 }, { w: 150, silver: 6, dust: 80 }, { w: 350, silver: 10, dust: 150 }]; // heti közös győzelmek; jutalom: × alap-Holdezüst, Csillagpor
const GUILD_EMBLEMS = ['hold', 'csillag', 'kard', 'pajzs', 'farkas', 'fa', 'korona', 'lang'];
const WIN_ACTIONS = ['fight', 'arenaFight', 'teamFight', 'eventFight']; // a torony emeletei nem számítanak (túl sok, túl könnyű „győzelem”)
const weekNow = () => X.weekKey(Date.now());
function heroSnap(save, uid) { return X.snap(save.hero, uid, save.arena ? save.arena.rating : 1000); }

async function arenaPool(userId, save) {
  // a hasonló pontszámú ellenfelek jönnek (a pontszám idővel a valódi erőt mutatja, a kasztok közti különbséggel együtt)
  const p = G.summary(save).power, rt = (save.arena && save.arena.rating) || 1000;
  const rows = await sql`select user_id, save from heroes where user_id <> ${userId} and active_at > now() - interval '30 days'
                         and power between ${Math.floor(p * 0.6)} and ${Math.ceil(p * 1.6)}
                         order by abs(coalesce((save->'arena'->>'rating')::int, 1000) - ${rt}) + random() * 60 limit 3`;
  return rows.map(r => Object.assign(heroSnap(r.save, r.user_id), { hero: r.save.hero })); // a hős csak az esély kiszámításához kell
}
async function teamPool(userId, save) {
  const L = save.hero.level;
  const rows = await sql`select h.user_id, h.save from heroes h
                         left join guild_members gm on gm.user_id = h.user_id
                         left join guild_members me on me.user_id = ${userId}
                         where h.user_id <> ${userId} and h.active_at > now() - interval '14 days' and h.level between ${L - 5} and ${L + 5}
                         order by (gm.guild_id is not null and gm.guild_id = me.guild_id) desc, random() limit 4`;
  return rows.map(r => heroSnap(r.save, r.user_id));
}
// a jelöltként mutatott hős (név szerint): ha a játékos azóta hőst váltott, a pihenő hőse áll ki, nem a mostani
async function heroOf(uid, name) { if (!uid) return null; const [r] = await sql`select save from ${ALLH(sql)} h where user_id = ${uid} and lower(name) = lower(${String(name || '')})`; return r ? r.save.hero : null; }

async function guildOf(userId) {
  const [m] = await sql`select g.*, m.role, m.week, m.week_wins, m.claimed, m.joined_at from guild_members m join guilds g on g.id = m.guild_id where m.user_id = ${userId}`;
  return m || null;
}
// a céhcél a létszámhoz igazodik: 5 tagnál a megadott érték, kisebb céhnél kevesebb (legalább 40%), nagyobbnál több (legfeljebb 2×)
function goalFor(g, members) { return Math.round(g.w * Math.max(0.4, Math.min(2, members / 5))); }
async function guildProgress(guildId) {
  const [r] = await sql`select coalesce(sum(week_wins), 0)::int as wins, count(*)::int as members from guild_members where guild_id = ${guildId} and week = ${weekNow()}`;
  const [c] = await sql`select count(*)::int as n from guild_members where guild_id = ${guildId}`;
  return { wins: r.wins, members: c.n };
}
async function guildLog(guildId, html) { await sql`insert into guild_log (guild_id, html) values (${guildId}, ${html})`; }
function guildPublic(g) { return g ? { id: Number(g.id), name: g.name, tag: g.tag, color: g.color, emblem: g.emblem, motto: g.motto, stars: g.stars || 0 } : null; }
const GUILD_DAILY_WINS = 25; // egy fiók naponta legfeljebb ennyi győzelemmel járulhat hozzá a céhhez (több hőssel sem lehet halmozni)
async function noteWin(userId) {
  const wk = weekNow(), dk = X.day(Date.now());
  const [d] = await sql`update guild_members set day_wins = case when day = ${dk} then day_wins + 1 else 1 end, day = ${dk} where user_id = ${userId} returning day_wins`;
  if (!d || d.day_wins > GUILD_DAILY_WINS) return;
  const rows = await sql`update guild_members set week_wins = case when week = ${wk} then week_wins + 1 else 1 end,
            claimed = case when week = ${wk} then claimed else '{}' end, week = ${wk} where user_id = ${userId} returning guild_id`;
  if (!rows.length) return;
  const gid = rows[0].guild_id;
  await sql`insert into guild_weeks (guild_id, week, wins) values (${gid}, ${wk}, 1) on conflict (guild_id, week) do update set wins = guild_weeks.wins + 1`;
  await sql`insert into member_weeks (user_id, guild_id, week, wins) values (${userId}, ${gid}, ${wk}, 1) on conflict (user_id, week) do update set wins = case when member_weeks.guild_id = excluded.guild_id then member_weeks.wins + 1 else 1 end, guild_id = excluded.guild_id`;
  // a heti párosítás (és a múlt heti csillagok kiosztása) akkor is megtörténik, ha senki sem nyitja meg a céh oldalát
  await ensureWars(wk).catch(() => {});
}
// ---------- céhháború: heti párosítás, állás, jutalom ----------
const WAR_REWARD = { silver: 8, dust: 100 };
const prevWeek = () => new Date(Date.parse(weekNow() + 'T12:00:00Z') - 7 * DAY).toISOString().slice(0, 10);
async function ensureWars(wk) {
  const [has] = await sql`select 1 as x from guild_wars where week = ${wk} limit 1`;
  if (has) return;
  await sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(hashtext(${'wars' + wk}))`;
    const [again] = await tx`select 1 as x from guild_wars where week = ${wk} limit 1`;
    if (again) return;
    // a céhek az előző heti erejük szerint sorba állnak, és a szomszédok kerülnek össze (hasonló erejű ellenfél)
    const gs = await tx`select g.id, coalesce(w.wins, 0) as w from guilds g left join guild_weeks w on w.guild_id = g.id and w.week = ${prevWeek()}
                        where exists (select 1 from guild_members m where m.guild_id = g.id) order by w desc, g.id`;
    // páratlan számnál hétről hétre más céh pihen (nem mindig a leggyengébb)
    if (gs.length % 2) gs.splice(Math.abs([...wk].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)) % gs.length, 1);
    for (let i = 0; i + 1 < gs.length; i += 2) await tx`insert into guild_wars (week, a, b) values (${wk}, ${gs[i].id}, ${gs[i + 1].id}) on conflict do nothing`;
    // a múlt heti háborúk győztesei csillagot kapnak a zászlójukra (akkor is, ha senki sem veszi át a jutalmat)
    const pw = prevWeek();
    const done = await tx`select w.a, w.b, coalesce(x.wins, 0) as wa, coalesce(y.wins, 0) as wb from guild_wars w
                          left join guild_weeks x on x.guild_id = w.a and x.week = w.week left join guild_weeks y on y.guild_id = w.b and y.week = w.week where w.week = ${pw}`;
    for (const d of done) {
      if (d.wa === d.wb) continue;
      const win = d.wa > d.wb ? d.a : d.b, lose = d.wa > d.wb ? d.b : d.a;
      const st = await tx`update guilds set stars = stars + 1, star_week = ${pw} where id = ${win} and (star_week is distinct from ${pw}) returning id`;
      const [lg] = await tx`select name from guilds where id = ${lose}`;
      if (st.length) await tx`insert into guild_log (guild_id, html) values (${win}, ${`Megnyertük a céhháborút${lg ? ` ${G.az(lg.name)} <b>${G.esc(lg.name)}</b> ellen` : ''}! Új csillag került a zászlóra.`})`;
    }
  });
}
async function warOf(gid, wk) {
  const [w] = await sql`select a, b from guild_wars where week = ${wk} and (a = ${gid} or b = ${gid})`;
  if (!w) return null;
  const opp = Number(w.a) === Number(gid) ? w.b : w.a;
  const [g] = await sql`select * from guilds where id = ${opp}`;
  const wins = await sql`select guild_id, wins from guild_weeks where week = ${wk} and guild_id in (${gid}, ${opp})`;
  const of = id => { const r = wins.find(x => Number(x.guild_id) === Number(id)); return r ? r.wins : 0; };
  return { week: wk, opponent: g ? Object.assign(guildPublic(g), { stars: g.stars || 0 }) : null, mine: of(gid), theirs: of(opp) };
}
// a többi játékostól kapott jutalmak jóváírása (a mentésbe), egyszer
async function applyPending(userId) {
  return sql.begin(async tx => {
    const rows = await tx`delete from pending_rewards where user_id = ${userId} returning silver, dust, html`;
    if (!rows.length) return 0;
    const save = await loadHero(tx, userId, true);
    if (!save) return 0;
    rows.forEach(r => { save.hero.silver += r.silver; E.addDust(save, save.hero, r.dust, Date.now()); if (r.html) G.personal(save, Date.now(), r.html, 'loot'); });
    await storeHero(tx, userId, save);
    return rows.length;
  });
}

async function guildAction(user, action, args) {
  const me = await guildOf(user.id);
  if (action === 'guildList') {
    const rows = await sql`select g.id, g.name, g.tag, g.color, g.emblem, g.motto, g.stars, count(m.user_id)::int as members,
                           coalesce(sum(case when m.week = ${weekNow()} then m.week_wins else 0 end), 0)::int as wins
                           from guilds g left join guild_members m on m.guild_id = g.id group by g.id order by wins desc, members desc limit 50`;
    return { guilds: rows.map(r => Object.assign(guildPublic(r), { members: r.members, wins: r.wins })), mine: guildPublic(me), max: GUILD_MAX, cost: GUILD_COST, emblems: GUILD_EMBLEMS };
  }
  if (action === 'guildInfo') {
    if (!me) return { guild: null };
    const members = await sql`select h.name, h.class_id, h.level, h.save->'hero'->'rig' as rig, h.save->'hero'->'look' as look, m.role, m.user_id,
                              case when m.week = ${weekNow()} then m.week_wins else 0 end as wins
                              from guild_members m join heroes h on h.user_id = m.user_id where m.guild_id = ${me.id} order by wins desc, h.level desc`;
    const log = await sql`select created_at, html from guild_log where guild_id = ${me.id} order by id desc limit 20`;
    const pr = await guildProgress(me.id);
    await ensureWars(weekNow());
    const [stars] = await sql`select stars from guilds where id = ${me.id}`; me.stars = stars ? stars.stars : me.stars;
    const war = await warOf(me.id, weekNow()), last = await warOf(me.id, prevWeek());
    if (last) { last.won = last.mine > last.theirs; const [mw] = await sql`select wins from member_weeks where user_id = ${user.id} and week = ${prevWeek()} and guild_id = ${me.id}`;
      last.eligible = !!(mw && mw.wins > 0) && Date.parse(me.joined_at) <= Date.parse(prevWeek() + 'T00:00:00Z') + 3 * DAY; last.claimed = !!(await sql`select 1 from guild_claims where user_id = ${user.id} and week = ${prevWeek()} and goal = 100`).length; }
    return { guild: Object.assign(guildPublic(me), { stars: me.stars || 0 }), war: war, lastWar: last, warReward: WAR_REWARD, role: me.role, owner: me.owner === user.id, progress: pr, goals: GUILD_GOALS.map((g, i) => ({ w: goalFor(g, pr.members), i: i, silverM: g.silver, dust: g.dust })),
      claimed: (await sql`select goal from guild_claims where user_id = ${user.id} and week = ${weekNow()}`).map(r => r.goal), max: GUILD_MAX,
      members: members.map(m => ({ name: m.name, classId: m.class_id, level: m.level, rig: m.rig, look: m.look, role: m.role, wins: m.wins, me: m.user_id === user.id, uid: m.user_id })),
      log: log.map(l => ({ t: new Date(l.created_at).getTime(), html: l.html })) };
  }
  if (action === 'guildCreate') {
    if (me) throw new GameError('state', 'Már tagja vagy egy céhnek.');
    const name = String(args.name || '').trim().replace(/\s+/g, ' '), tag = String(args.tag || '').trim().toUpperCase();
    if (!/^[\p{L}\p{N}][\p{L}\p{N} '\-]{2,23}$/u.test(name)) throw new GameError('arg', 'A céh neve 3–24 karakter legyen: betűk, számok, szóköz vagy kötőjel.');
    if (!/^[\p{L}\p{N}]{2,4}$/u.test(tag)) throw new GameError('arg', 'A céhjel 2–4 betű vagy szám legyen.');
    const color = /^#[0-9a-fA-F]{6}$/.test(args.color) ? args.color : '#7f8cff', emblem = GUILD_EMBLEMS.indexOf(args.emblem) >= 0 ? args.emblem : 'hold';
    const motto = String(args.motto || '').trim().slice(0, 80);
    return sql.begin(async tx => {
      const save = await loadHero(tx, user.id, true);
      if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
      if (save.hero.level < 5) throw new GameError('state', 'Céhet az 5. szinttől alapíthatsz.');
      if (save.hero.silver < GUILD_COST) throw new GameError('state', `A céh alapítása ${GUILD_COST} Holdezüstbe kerül.`);
      let g;
      try { [g] = await tx`insert into guilds (name, tag, color, emblem, motto, owner) values (${name}, ${tag}, ${color}, ${emblem}, ${motto}, ${user.id}) returning *`; }
      catch (e) { if (/guilds_(name|tag)_key/.test(String(e.message))) throw new GameError('name', 'Ez a céhnév vagy céhjel már foglalt.'); throw e; }
      await tx`insert into guild_members (user_id, guild_id, role, week) values (${user.id}, ${g.id}, 'vezeto', ${weekNow()})`;
      save.hero.silver -= GUILD_COST;
      G.personal(save, Date.now(), `<b>${G.esc(save.hero.name)}</b> megalapította ${G.az(name)} <b>${G.esc(name)}</b> céhet.`, 'win');
      await storeHero(tx, user.id, save);
      await tx`insert into guild_log (guild_id, html) values (${g.id}, ${`<b>${G.esc(save.hero.name)}</b> megalapította a céhet.`})`;
      await tx`insert into chronicle (user_id, kind, html) values (${user.id}, 'guild', ${`Új céh alakult: <b>${G.esc(name)}</b> [${G.esc(tag)}].`})`;
      return { save: save, guild: guildPublic(g) };
    });
  }
  if (action === 'guildJoin') {
    if (me) throw new GameError('state', 'Már tagja vagy egy céhnek. Előbb lépj ki.');
    const [h] = await sql`select name from heroes where user_id = ${user.id}`;
    if (!h) throw new GameError('nohero', 'Előbb hozz létre hőst.');
    return sql.begin(async tx => { // a céh sorát zároljuk, így egyszerre érkező csatlakozások sem lépik túl a létszámot
      const [g] = await tx`select * from guilds where id = ${Number(args.id) || 0} for update`;
      if (!g) throw new GameError('arg', 'Nincs ilyen céh.');
      const [c] = await tx`select count(*)::int as n from guild_members where guild_id = ${g.id}`;
      if (c.n >= GUILD_MAX) throw new GameError('state', 'Ez a céh betelt.');
      try { await tx`insert into guild_members (user_id, guild_id, week) values (${user.id}, ${g.id}, ${weekNow()})`; }
      catch (e) { if (/guild_members_pkey/.test(String(e.message))) throw new GameError('state', 'Már tagja vagy egy céhnek.'); throw e; }
      await tx`insert into guild_log (guild_id, html) values (${g.id}, ${`<b>${G.esc(h.name)}</b> csatlakozott a céhhez.`})`;
      return { guild: guildPublic(g) };
    });
  }
  if (action === 'guildLeave' || action === 'guildKick') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const target = action === 'guildKick' ? String(args.uid || '') : user.id;
    if (!/^[0-9a-f-]{36}$/i.test(target)) throw new GameError('arg', 'Nincs ilyen tag.');
    if (action === 'guildKick' && me.owner !== user.id) throw new GameError('state', 'Csak a céh vezetője küldhet el tagot.');
    if (target === me.owner && action === 'guildKick') throw new GameError('state', 'Saját magadat nem küldheted el.');
    const [h] = await sql`select name from heroes where user_id = ${target}`;
    const del = await sql`delete from guild_members where user_id = ${target} and guild_id = ${me.id} returning user_id`;
    if (!del.length) throw new GameError('arg', 'Nincs ilyen tag.');
    if (target === me.owner) { // a vezető kilépett: a legrégebbi tag lesz az új vezető; ha senki nem maradt, a céh megszűnik
      const [next] = await sql`select user_id from guild_members where guild_id = ${me.id} order by joined_at limit 1`;
      if (next) { await sql`update guilds set owner = ${next.user_id} where id = ${me.id}`; await sql`update guild_members set role = 'vezeto' where user_id = ${next.user_id}`; }
      else { await sql`delete from guilds where id = ${me.id}`; return { left: true, disbanded: true }; }
    }
    await guildLog(me.id, action === 'guildKick' ? `<b>${G.esc(h ? h.name : '?')}</b> már nem tagja a céhnek.` : `<b>${G.esc(h ? h.name : '?')}</b> kilépett a céhből.`);
    return { left: true };
  }
  if (action === 'guildClaim') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const i = Number(args.i) | 0, goal = GUILD_GOALS[i];
    if (!goal) throw new GameError('arg', 'Nincs ilyen cél.');
    const pr = await guildProgress(me.id);
    if (pr.wins < goalFor(goal, pr.members)) throw new GameError('state', `Ehhez a céhnek ${goalFor(goal, pr.members)} győzelem kell ezen a héten.`);
    if (!(me.week === weekNow() && me.week_wins > 0)) throw new GameError('state', 'A céhcél jutalmához ezen a héten legalább egy győzelemmel hozzá kell járulnod.');
    return sql.begin(async tx => {
      const [m] = await tx`select week, claimed from guild_members where user_id = ${user.id} for update`;
      if (!m) throw new GameError('state', 'Nem vagy tagja céhnek.');
      const claimed = m.week === weekNow() ? (m.claimed || []) : [];
      // a jutalom felhasználónként, hetente, célonként egyszer jár (külön táblában, így ki- és visszalépéssel sem kérhető újra)
      const ins = await tx`insert into guild_claims (user_id, week, goal) values (${user.id}, ${weekNow()}, ${i}) on conflict do nothing returning goal`;
      if (!ins.length) throw new GameError('state', 'Ezt a jutalmat ezen a héten már átvetted.');
      const save = await loadHero(tx, user.id, true);
      const out = { silver: Math.round(E.silverBase(save.hero.level) * goal.silver), dust: goal.dust };
      save.hero.silver += out.silver; out.dust = E.addDust(save, save.hero, out.dust, Date.now());
      await storeHero(tx, user.id, save);
      await tx`update guild_members set week = ${weekNow()}, claimed = ${claimed.concat([i])} where user_id = ${user.id}`;
      return { save: save, out: out };
    });
  }
  if (action === 'guildWarClaim') {
    if (!me) throw new GameError('state', 'Nem vagy tagja céhnek.');
    const pw = prevWeek(), last = await warOf(me.id, pw);
    if (!last) throw new GameError('state', 'A céhed múlt héten nem harcolt.');
    if (!(last.mine > last.theirs)) throw new GameError('state', 'A múlt heti céhháborút nem ti nyertétek.');
    const [mw] = await sql`select wins from member_weeks where user_id = ${user.id} and week = ${pw} and guild_id = ${me.id}`;
    if (!(mw && mw.wins > 0)) throw new GameError('state', 'A jutalom azoknak jár, akik a múlt héten legalább egy győzelemmel hozzájárultak.');
    // céhugrálás ellen: a háború hetének csütörtökéig csatlakozni kellett
    if (Date.parse(me.joined_at) > Date.parse(pw + 'T00:00:00Z') + 3 * DAY) throw new GameError('state', 'A jutalom azoknak jár, akik a háború hetének csütörtökéig csatlakoztak a céhhez.');
    return sql.begin(async tx => {
      const ins = await tx`insert into guild_claims (user_id, week, goal) values (${user.id}, ${pw}, 100) on conflict do nothing returning goal`;
      if (!ins.length) throw new GameError('state', 'Ezt a jutalmat már átvetted.');
      const save = await loadHero(tx, user.id, true);
      const out = { silver: Math.round(E.silverBase(save.hero.level) * WAR_REWARD.silver) };
      save.hero.silver += out.silver; out.dust = E.addDust(save, save.hero, WAR_REWARD.dust, Date.now());
      await storeHero(tx, user.id, save);
      return { save: save, out: out };
    });
  }
  throw new GameError('action', 'Ismeretlen művelet.');
}

// ---------- profil: egy másik hős nyilvános adatai ----------
async function profile(user, args) {
  const name = String(args.name || '').trim();
  const [r] = await sql`select h.user_id, h.save, g.name as gname, g.tag, g.color, g.emblem, g.stars, g.id as gid from ${ALLH(sql)} h
                        left join guild_members m on m.user_id = h.user_id left join guilds g on g.id = m.guild_id where lower(h.name) = lower(${name})`;
  if (!r) throw new GameError('arg', 'Nincs ilyen hős.');
  const titles = await sql`select title from boss_participants where user_id = ${r.user_id} and title is not null order by boss_id desc limit 5`;
  return Object.assign(X.profileOf(r.save), { guild: r.gid ? { id: Number(r.gid), name: r.gname, tag: r.tag, color: r.color, emblem: r.emblem, stars: r.stars || 0 } : null, titles: titles.map(t => t.title), me: r.user_id === user.id });
}

async function handle(req) {
  const origin = req.headers.get('Origin') || '';
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Csak POST.' }, 405, origin);
  try {
    const user = await authUser(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || ''), args = body.args || {};
    await sql`insert into players (user_id, discord_id, discord_name, avatar_url) values (${user.id}, ${user.discordId}, ${user.name}, ${user.avatar})
              on conflict (user_id) do update set discord_name = excluded.discord_name, avatar_url = excluded.avatar_url, discord_id = excluded.discord_id`;
    const [player] = await sql`select * from players where user_id = ${user.id}`;
    if (player.banned) throw new GameError('banned', `A fiókodat egy admin felfüggesztette.${player.ban_reason ? ' Indok: ' + player.ban_reason : ''}`, 403);

    if (action === 'verify') {
      const guild = env('NYXORIA_GUILD_ID');
      if (!guild) { await sql`update players set verified_at = coalesce(verified_at, now()) where user_id = ${user.id}`; return json({ ok: true, verified: true }, 200, origin); }
      if (!args.providerToken) return json({ ok: false, code: 'token', error: 'Jelentkezz be újra Discorddal.' }, 200, origin);
      const r = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: 'Bearer ' + args.providerToken } });
      if (!r.ok) return json({ ok: false, code: 'token', error: 'A Discord most nem válaszolt. Jelentkezz be újra.' }, 200, origin);
      const guilds = await r.json();
      const member = Array.isArray(guilds) && guilds.some(g => g.id === guild);
      if (!member) return json({ ok: false, code: 'not_member', error: 'Ezzel a Discord-fiókkal nem vagy tagja a Nyxoria szervernek.' }, 200, origin);
      await sql`update players set verified_at = now() where user_id = ${user.id}`;
      return json({ ok: true, verified: true }, 200, origin);
    }
    if (env('NYXORIA_GUILD_ID') && !player.verified_at) throw new GameError('verify', 'Előbb ellenőrizzük a Nyxoria-tagságodat.', 403);

    if (action === 'state') return json(await statePayload(user, player), 200, origin);
    if (action === 'ranks') return json(await ranks(user, args), 200, origin);
    if (action === 'profile') return json({ result: await profile(user, args) }, 200, origin);
    if (action === 'admin') return json(await admin(user, player, args), 200, origin);

    if (action === 'create') {
      const now = Date.now();
      const save = G.createSave(args, now);
      G.refreshOffers(save);
      if (await nameTaken(sql, save.hero.name)) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
      try {
        await sql`insert into heroes (user_id, name, class_id, save) values (${user.id}, ${save.hero.name}, ${save.hero.classId}, ${sql.json(save)})`;
      } catch (e) {
        if (String(e.message).indexOf('heroes_name_key') >= 0) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.');
        if (String(e.message).indexOf('heroes_pkey') >= 0) throw new GameError('state', 'Neked már van hősöd.');
        throw e;
      }
      await storeHero(sql, user.id, save);
      await chronicle(user.id, 'new', `Új hős érkezett: <b>${G.esc(save.hero.name)}</b>, ${G.az(D.PEOPLES[save.hero.people].name)} ${D.PEOPLES[save.hero.people].name.toLowerCase()} ${D.CLASSES[save.hero.classId].name.toLowerCase()}. Üdv a Nyxorián!`, true);
      return json({ save: G.sanitize(save), result: {} }, 200, origin);
    }
    if (action === 'heroNew' || action === 'heroSwitch' || action === 'heroDelete') {
      try { await heroAction(user, action, args); }
      catch (e) { if (String(e.message).indexOf('name_key') >= 0) throw new GameError('name', 'Ez a név már foglalt, válassz másikat.'); throw e; }
      return json(await statePayload(user, player), 200, origin);
    }
    if (action === 'bossHit') { const r = await bossHit(user, args); return json({ save: G.sanitize(r.save), result: r.out }, 200, origin); }
    if (action.indexOf('guild') === 0) {
      const r = await guildAction(user, action, args);
      if (r && r.save) { const sv = r.save; delete r.save; return json(Object.assign({ save: G.sanitize(sv), result: r.out || r }, {}), 200, origin); }
      return json({ result: r }, 200, origin);
    }
    if (action === 'bossClaim') { const r = await bossClaim(user, args); return json({ save: G.sanitize(r.save), result: r.out }, 200, origin); }

    if (!G.actions[action]) throw new GameError('action', 'Ismeretlen művelet.');
    const r = await sql.begin(async tx => {
      const save = await loadHero(tx, user.id, true);
      if (!save) throw new GameError('nohero', 'Előbb hozz létre hőst.');
      const world = await worldState(tx);
      const ctx = { now: Date.now(), median: world.median };
      if (action === 'arenaFind') ctx.arenaPool = await arenaPool(user.id, save);
      if (action === 'arenaFight') { const c = save.arena && save.arena.cands && save.arena.cands[Number(args.i) | 0]; if (c && c.uid) ctx.arenaOpp = await heroOf(c.uid, c.name); }
      if (action === 'teamFind') ctx.teamPool = await teamPool(user.id, save);
      if (action === 'teamFight' && Array.isArray(args.ids)) args.ids = args.ids.map(x => Number(x) | 0).filter((x, k, a) => a.indexOf(x) === k).slice(0, 2);
      if (action === 'teamFight' && save.team && Array.isArray(args.ids)) ctx.teamHeroes = await Promise.all(args.ids.map(i => { const c = save.team.cands[Number(i) | 0]; return c && c.uid ? heroOf(c.uid, c.name) : null; }));
      const out = G.run(save, action, args, ctx);
      await storeHero(tx, user.id, save);
      if (LOGGED.indexOf(action) >= 0) {
        const info = action === 'fight' ? { win: save.pendingResult && save.pendingResult.win, diff: save.expedition && save.expedition.offer.diff, lvl: save.hero.level } : args;
        await tx`insert into action_log (user_id, action, info) values (${user.id}, ${action}, ${tx.json(info)})`;
      }
      return { save, out };
    });
    await publishEvents(user.id, r.out.events);
    const res = r.out.result || {};
    // céh: minden győzelem beleszámít a heti közös célba
    const won = action === 'fight' ? !!(r.save.pendingResult && r.save.pendingResult.win && !r.save.pendingResult.tired) : !!(res.out && res.out.win);
    if (WIN_ACTIONS.indexOf(action) >= 0 && won) await noteWin(user.id);
    // csapatküldetés: a valódi társak gazdái is kapnak részt (a következő belépéskor íródik jóvá)
    if (action === 'teamFight' && res.out && res.out.share) for (const sh of res.out.share) {
      await sql`insert into pending_rewards (user_id, silver, dust, html) values (${sh.uid}, ${sh.silver}, ${sh.dust}, ${`<b>${G.esc(r.save.hero.name)}</b> magával vitt egy csapatküldetésre, és győztetek: +${sh.silver} Holdezüst, +${sh.dust} Csillagpor.`})`;
    }
    if (res.out) delete res.out.share;
    return json({ save: G.sanitize(r.save), result: res }, 200, origin);
  } catch (e) {
    if (e instanceof GameError) return json({ error: e.message, code: e.code }, e.status, origin);
    if (e && e.code && typeof e.message === 'string' && !e.severity) return json({ error: e.message, code: e.code }, 400, origin); // a játéklogika hibái
    console.error(e);
    return json({ error: 'Valami elromlott a szerveren. Próbáld újra egy kicsit később.' }, 500, origin);
  }
}

Deno.serve(handle);

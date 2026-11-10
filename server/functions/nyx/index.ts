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
    wings: ['nincs', 'tunder', 'denever', 'feny', 'toll', 'kristaly', 'lang', 'holdezust', 'csillag', 'arny'], tail: ['nincs', 'roka', 'macska', 'sarkany'], aura: ['nincs', 'holdfeny', 'parazs', 'arny', 'csillagpor', 'villam']
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

// ===== js/content.js =====
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

// ===== js/story.js =====
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
        reward: 'Ozsvát a lámpása utolsó fényét egy tárgyba zárja, és neked adja. A Krónika új sora: „A hold túloldalán valaki kopog.”' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ===== js/guards.js =====
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

// ===== js/quests.js =====
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
  var MAX_ROUNDS = 25, GEAR_AVG = 1.25, MAX_LEVEL = 50;
  // a harc tempója: minden ütés ekkora részét viszi be (hosszabb harc → több képesség jut szóhoz);
  // a képességek a harc elején sorban készen állnak (1., 2., 3. … kör), utána a saját újratöltésük szerint jönnek
  // dmg: a hős (és társai) ütése; a szörny ütése ehhez képest képességenként perSkill-lel erősebb, hogy a
  // harc elején sorban kész képességek többlete ne billentse el az erőviszonyokat (független szimulációval hangolva)
  // boss: a heti szörnynél az ütést visszaskálázzuk, hogy átlagosan ugyanannyit vigyen be, mint a régi rendszerben (mérve: ×1,146)
  var COMBAT = { dmg: 0.55, perSkill: 0.06, readyAtStart: true, boss: 1 / (0.55 * 1.146) };
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
  // elit őrző: a Közepes és Nehéz ajánlatok egy része (az 5. szinttől) feldühödött, megerősödött őrzővel jön.
  // Az esély ennyivel kisebb (risk), cserébe több Holdezüst, Csillagpor, tapasztalat, és nagyobb eséllyel jár tárgy.
  var ELITE = { chance: 0.2, minLevel: 5, risk: 0.08, silver: 1.2, dust: 1.2, xp: 1.15, item: 0.15, mythic: 1.3 };
  function offerMoon(o) {
    var m = MOONS[o && o.moon] || MOONS.ujhold;
    if (!o || !o.elite) return m;
    return { name: m.name, power: m.power, dust: m.dust * ELITE.dust, mythic: m.mythic * ELITE.mythic, silver: m.silver * ELITE.silver, xp: m.xp * ELITE.xp, risk: m.risk, minLevel: m.minLevel };
  }
  // a kockázat a célesélyhez arányos, mint a holdaknál (Nehéznél kisebb levonás, különben az elit Nehéz csapda lenne)
  function eliteTarget(d, moon, elite) { return offerTarget(d, moon) - (elite ? ELITE.risk * DIFF[d].target / DIFF.kozepes.target : 0); }
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
  function setForLevel(L) { var f = D.REGIONS.filter(function (r) { return L >= r.min && L <= r.max; }); return (f[0] || (L < D.REGIONS[0].min ? D.REGIONS[0] : D.REGIONS[D.REGIONS.length - 1])).id; }
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
    // a tárgy szettje (kinézete): ahonnan származik; ha nem tudjuk, a szintjéhez illő tájegység
    it.set = opts.set && D.REGIONS.some(function (r) { return r.id === opts.set; }) ? opts.set : setForLevel(it.level);
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
      dmgPct: s.dmg + (extra.blessing === true ? 10 : (+extra.blessing || 0)), critPct: s.crit, dodgePct: s.dodge, healPct: s.heal, firstPct: s.first,
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
    // egy másik hős szelleme a saját képességszámával üt (azzal is lett hangolva)
    var ready = {}, monMul = COMBAT.dmg + COMBAT.perSkill * ((mon.ghostOf && mon.loadout) || hero.loadout || []).length;
    (hero.loadout || []).forEach(function (id, i) { ready[id] = COMBAT.readyAtStart ? i + 1 : D.SKILLS[id].cd; });
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
      return { dmg: d * (att.side === 'm' ? monMul : COMBAT.dmg), crit: crit };
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
      // csapattársak (csapatküldetés): a kasztjuk szerint segítenek. A gyógyító gyógyít, a harcos pajzsot ad, a dalnok
      // a hős képességeit hamarabb tölti újra (legfeljebb eggyel, és sosem ad plusz lépést ugyanabban a körben); közben
      // ők is ütnek (a támogatók gyengébben), a többiek teljes erővel. Az ellenfelet a teljes csapathoz méri a motor.
      if (hero.allies && mhp > 0) {
        var tempoDone = false;
        for (var k = 0; k < hero.allies.length && mhp > 0; k++) {
          var al = hero.allies[k], role = ALLY_ROLE[al.classId] || 'dmg', sh = al.share || 0.4, w = sh / 0.5;
          if (role === 'heal' && rnd % 2 === 0 && hp < hero.maxHp) { var hb = hp; hp = Math.min(hero.maxHp, hp + hero.maxHp * 0.08 * w); emit({ who: 'ally', ally: k, kind: 'heal', amount: Math.round(hp - hb) }); }
          else if (role === 'shield' && rnd % 3 === 1) { var sa = hero.maxHp * 0.1 * w; st.shield += sa; emit({ who: 'ally', ally: k, kind: 'shield', amount: Math.round(st.shield) }); }
          else if (role === 'tempo' && rnd % 2 === 0 && !tempoDone) {
            tempoDone = true; (hero.loadout || []).forEach(function (id) { ready[id] = Math.max(rnd + 1, ready[id] - 1); });
            emit({ who: 'ally', ally: k, kind: 'tempo' });
          }
          var ar = attackRoll(hero, mon, role === 'dmg' || role === 'tempo' ? sh : sh * 0.5); // a dalnok gyorsítása kicsi, ezért ő teljes erővel üt
          mhp -= ar.dmg; dmgDealt += ar.dmg;
          emit({ who: 'ally', ally: k, kind: 'hit', dmg: Math.round(ar.dmg), crit: !!ar.crit, dodge: !!ar.dodge });
        }
      }
      // méreg
      if (mhp > 0 && rnd <= ms.dotUntil && ms.dot > 0) {
        var dd = hero.tam * 2 * ms.dot * K / (K + mon.ved) * T.out * COMBAT.dmg;
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
      emit({ kind: 'round', rd: log ? (hero.loadout || []).map(function (id) { return ready[id]; }) : null }); // a képességsáv ebből mutatja, mikor lesz kész
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

  var ALLY_ROLE = { gyogyito: 'heal', harcos: 'shield', dalnok: 'tempo' };
  // ---------- párbaj: két hős, mindkét oldal a saját képességeivel (csak az Arénában) ----------
  // Ugyanazok a képesség-hatások, mint a szörny elleni harcban, de szimmetrikusan: a másik hős is gyógyít, pajzsot húz,
  // kábít, mérgez, és az idézett társa is támad. A napló „h” (te) és „m” (az ellenfél) oldalra bontva készül,
  // ugyanúgy, mint a szörnyharcban, így a lejátszás és a HP-sávok változatlanul működnek.
  // Párbajban a gyógyítás és a pajzs gyengébb (ahogy a legtöbb szerepjáték PvP-jében), különben a gyógyító fél
  // egyszerűen kivárná a körlimitet; ezt mérésekkel hangoltuk, hogy egyik kasztpárosítás se legyen eleve eldöntött.
  var PVP = { heal: 1, shield: 1, fatigueFrom: 12, fatigue: 0.15 };
  function simulateDuel(a, b, tacA, tacB, seed, withLog, opts) {
    var maxR = (opts && opts.maxRounds) || MAX_ROUNDS;
    var rng = mulberry32(seed);
    var L = Math.max(1, Math.round((a.level + b.level) / 2)), K = 50 + 10 * L, sc = scaleFor(L);
    var log = withLog ? [] : null, rnd = 0, dmgDealt = 0, dmgTaken = 0, dodged = 0, crits = 0;
    function side(f, tac, who) {
      var sd = { f: f, hp: f.hpStart, T: D.TACTICS[tac] || D.TACTICS.kiegy, who: who, petWho: who === 'h' ? 'pet' : 'mpet', ready: {}, firstDone: false,
        st: { buffDmg: 0, buffUntil: 0, guard: 1, guardUntil: 0, shield: 0, dodge: 0, dodgeUntil: 0, haste: 0, hasteUntil: 0, regen: 0, regenUntil: 0, packUntil: 0, petGoneUntil: 0 },
        deb: { stunned: false, slow: 0, slowUntil: 0, weak: 1, weakUntil: 0, armor: 0, armorUntil: 0, dot: 0, dotUntil: 0 } };
      (f.loadout || []).forEach(function (id, i) { if (D.SKILLS[id]) sd.ready[id] = COMBAT.readyAtStart ? i + 1 : D.SKILLS[id].cd; });
      return sd;
    }
    var A = side(a, tacA, 'h'), B = side(b, tacB, 'm');
    function emit(e) { if (log) { e.r = rnd; e.hp = Math.max(0, A.hp); e.mhp = Math.max(0, B.hp); log.push(e); } }
    // kifáradás: a 12. kör után minden körben erősebbek az ütések és gyengébb a gyógyulás, így két gyógyító sem
    // húzhatja a párbajt a körlimitig eredmény nélkül
    function fatigue() { return rnd > PVP.fatigueFrom ? 1 + PVP.fatigue * (rnd - PVP.fatigueFrom) : 1; }
    function fur(sd) { return sd.f.fur * (rnd <= sd.deb.slowUntil ? 1 - sd.deb.slow : 1) * (rnd <= sd.st.hasteUntil ? 1 + sd.st.haste : 1); }
    function roll(att, def, mult, o) {
      o = o || {};
      var dF = fur(def), aF = fur(att);
      var dodgeP = 0.03 + 0.12 * dF / (dF + sc) + (def.f.dodgePct || 0) / 100 + (rnd <= def.st.dodgeUntil ? def.st.dodge : 0);
      if (rng() < dodgeP) return { dmg: 0, dodge: true };
      var ved = def.f.ved * (rnd <= def.deb.armorUntil ? 1 - def.deb.armor : 1);
      var d = att.f.tam * 2 * mult * K / (K + ved) * (0.7 + rng() * 0.6);
      d *= 1 + (att.f.dmgPct || 0) / 100;
      d *= att.T.out * def.T.inc * fatigue();
      if (rnd <= att.st.buffUntil) d *= 1 + att.st.buffDmg;
      if (rnd === 1) d *= 1 + (att.f.firstPct || 0) / 100;
      if (rnd <= att.deb.weakUntil) d *= att.deb.weak;
      if (rnd <= def.st.guardUntil) d *= def.st.guard;
      var crit = rng() < 0.05 + 0.25 * aF / (aF + sc) + (att.f.critPct || 0) / 100 + (o.crit || 0);
      if (crit) d *= 1.75;
      return { dmg: d * COMBAT.dmg, crit: crit };
    }
    function land(att, def, res) {
      var d = res.dmg;
      if (def.st.shield > 0 && d > 0) { var ab = Math.min(def.st.shield, d); def.st.shield -= ab; d -= ab; res.absorbed = Math.round(ab); }
      def.hp -= d;
      if (att === A) { dmgDealt += d; if (res.dodge) dodged++; if (res.crit) crits++; } else dmgTaken += d;
      return d;
    }
    function hit(att, def, mult, skillId, extra) {
      var res = roll(att, def, mult, extra);
      if (!res.dodge && !att.firstDone && att.f.firstStrike > 1) { res.dmg *= att.f.firstStrike; res.first = true; }
      if (!res.dodge) att.firstDone = true;
      var d = land(att, def, res);
      emit({ who: att.who, kind: 'hit', skill: skillId, dmg: Math.round(d), crit: !!res.crit, dodge: !!res.dodge, first: !!res.first, absorbed: res.absorbed || 0 });
      return res;
    }
    function heal(sd, amount, skillId) {
      var x = amount * (1 + (sd.f.healPct || 0) / 100) * PVP.heal / fatigue(), before = sd.hp; sd.hp = Math.min(sd.f.maxHp, sd.hp + x);
      emit({ who: sd.who, kind: 'heal', skill: skillId, amount: Math.round(sd.hp - before) });
    }
    function turn(me, foe) {
      if (me.deb.stunned) { me.deb.stunned = false; emit({ who: me.who, kind: 'skip' }); return; }
      if (rnd <= me.st.regenUntil && me.st.regen > 0) heal(me, me.f.maxHp * me.st.regen, 'regen');
      var lo = me.f.loadout || [], skillId = null;
      for (var i = 0; i < lo.length; i++) if (D.SKILLS[lo[i]] && rnd >= me.ready[lo[i]]) { skillId = lo[i]; break; }
      if (!skillId) hit(me, foe, 1.0, me.f.basic);
      else {
        var sk = D.SKILLS[skillId], mult = sk.mult == null ? 1.0 : sk.mult, st = me.st, fd = foe.deb;
        me.ready[skillId] = rnd + sk.cd;
        emit({ who: me.who, kind: 'skill', skill: skillId });
        switch (sk.type) {
          case 'hit': hit(me, foe, mult, skillId, { crit: sk.crit || 0 }); break;
          case 'multi': for (var h = 0; h < sk.hits && foe.hp > 0; h++) hit(me, foe, mult, skillId); break;
          case 'stun': var r1 = hit(me, foe, mult, skillId); if (!r1.dodge && rng() < sk.chance) { fd.stunned = true; emit({ who: me.who, kind: 'stun', skill: skillId }); } break;
          case 'skip': hit(me, foe, mult, skillId); fd.stunned = true; emit({ who: me.who, kind: 'stun', skill: skillId }); break;
          case 'buff': st.buffDmg = sk.dmg; st.buffUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'guard': st.guard = sk.taken; st.guardUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'shield': st.shield += me.f.maxHp * sk.pct * (1 + (me.f.healPct || 0) / 100) * PVP.shield; emit({ who: me.who, kind: 'shield', skill: skillId, amount: Math.round(st.shield) }); hit(me, foe, mult, skillId); break;
          case 'dodge': st.dodge = sk.bonus; st.dodgeUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'slow': fd.slow = sk.fur; fd.slowUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'dot': hit(me, foe, mult, skillId); fd.dot = sk.dot; fd.dotUntil = rnd + sk.rounds; fd.dotTam = me.f.tam; fd.dotOut = me.T.out; break;
          case 'execute': hit(me, foe, (fd.stunned || rnd <= fd.slowUntil) ? sk.bonusMult : mult, skillId); break;
          case 'pack': st.packUntil = rnd + sk.rounds; hit(me, foe, 1.0, skillId); break;
          case 'sacrifice': st.petGoneUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'weaken': fd.weak = sk.enemyDmg; fd.weakUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'armorbreak': fd.armor = sk.ved; fd.armorUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'heal': if (mult > 0) hit(me, foe, mult, skillId); heal(me, me.f.maxHp * sk.pct, skillId); break;
          case 'haste': st.haste = sk.fur; st.hasteUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          case 'regen': st.regen = sk.pct; st.regenUntil = rnd + sk.rounds; hit(me, foe, mult, skillId); break;
          default: hit(me, foe, mult, skillId);
        }
      }
      if (me.f.pet && foe.hp > 0 && rnd > me.st.petGoneUntil) {
        var pets = rnd <= me.st.packUntil ? 2 : 1;
        for (var p = 0; p < pets && foe.hp > 0; p++) {
          var pr = roll(me, foe, me.f.pet), pd = land(me, foe, pr);
          emit({ who: me.petWho, kind: 'hit', dmg: Math.round(pd), crit: !!pr.crit, dodge: !!pr.dodge, absorbed: pr.absorbed || 0 });
        }
      }
      // a rajtam lévő méreg az én körömben mar (ahogy a szörnyharcban is a szörny körével együtt)
      if (foe.hp > 0 && rnd <= foe.deb.dotUntil && foe.deb.dot > 0) {
        var dd = me.f.tam * 2 * foe.deb.dot * K / (K + foe.f.ved) * me.T.out * COMBAT.dmg;
        foe.hp -= dd; if (me === A) dmgDealt += dd; else dmgTaken += dd;
        emit({ who: me.who, kind: 'dot', dmg: Math.round(dd) });
      }
    }
    for (rnd = 1; rnd <= maxR; rnd++) {
      var af = fur(A), bf = fur(B);
      var aFirst = rng() < clamp(0.5 + 1.5 * (af - bf) / Math.max(1, af + bf), 0.2, 0.8);
      emit({ kind: 'round', rd: log ? (a.loadout || []).map(function (id) { return A.ready[id]; }) : null });
      var order = aFirst ? [A, B] : [B, A];
      for (var o = 0; o < 2; o++) {
        if (A.hp <= 0 || B.hp <= 0) break;
        turn(order[o], order[o] === A ? B : A);
      }
      if (A.hp <= 0 || B.hp <= 0) break;
    }
    var rounds = Math.min(rnd, maxR), win, timeout = false;
    var tie = false;
    if (A.hp > 0 && B.hp > 0) {
      timeout = true; var pa = A.hp / a.maxHp, pb = B.hp / b.maxHp;
      // egyenlő életerőnél a több bevitt sebzés dönt (nem a véletlen és nem automatikusan a védekező fél)
      if (Math.abs(pa - pb) < 1e-9) { tie = true; win = dmgDealt >= dmgTaken; } else win = pa > pb;
    }
    else win = A.hp > 0;
    return { win: win, rounds: rounds, timeout: timeout, tie: tie, hpLeft: Math.max(0, A.hp), hpPct: Math.max(0, A.hp) / a.maxHp,
             monHpPct: Math.max(0, B.hp) / b.maxHp, dmgDealt: dmgDealt, dmgTaken: dmgTaken, dodged: dodged, crits: crits,
             log: log, seed: seed, duel: true };
  }
  function duelChance(a, b, tacA, tacB, n, seed) {
    var rng = mulberry32(seed || 777), w = 0; n = n || 200;
    for (var i = 0; i < n; i++) if (simulateDuel(a, b, tacA, tacB, newSeed(rng), false).win) w++;
    return w / n;
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
      // az elit sorsolás független a felszereléstől: a szint és a megtett kalandok száma dönti el (felszerelés-cserével nem lehet „horgászni”)
      var elite = d !== 'konnyu' && hero.level >= ELITE.minLevel && mulberry32(((hero.level * 7919) ^ ((hero.stats && hero.stats.expeditions || 0) * 104729) ^ (idx * 31 + 0x51ed)) >>> 0)() < ELITE.chance;
      var Lm = findMonsterLevel(heroF, hero.tactic, eliteTarget(d, moon, elite), { seed: 1000 + idx, n: 240, power: moon.power });
      var region = regionFor(Lm, d);
      var guards = region.guards.filter(function (g) { return !used[g]; });
      var guard = pick(rng, guards.length ? guards : region.guards); used[guard] = 1;
      var mon = monsterFighter(Lm, { power: moon.power, name: guard });
      var chance = winChance(heroF, mon, hero.tactic, 500, 4242); // rögzített próbaharcok: ugyanarra a helyzetre mindig ugyanazt az esélyt mutatja
      var o = { diff: d, lm: Lm, level: mon.level, region: region.id, guard: guard, moon: moonId || 'ujhold',
               chance: chance, seed: newSeed(rng) };
      if (elite) o.elite = true;
      o.rewards = expeditionRewardsPreview(hero, d, Lm, moonId, elite);
      return o;
    });
  }

  // taktikaváltáskor nem jön új kaland, csak az esélyek számolódnak újra ugyanazokra az őrzőkre
  function offerChance(hero, o) {
    var moon = MOONS[o.moon] || MOONS.ujhold;
    return winChance(fighterFromHero(hero), monsterFighter(o.lm, { power: moon.power, name: o.guard }), hero.tactic, 500, 4242);
  }
  function expeditionRewardsPreview(hero, d, Lm, moonId, elite) {
    var D2 = DIFF[d];
    var mo = offerMoon({ moon: moonId || 'ujhold', elite: elite });
    return { xp: Math.round(xpBase(hero.level) * D2.xp * mo.xp), silver: Math.round(silverBase(Math.max(1, Lm)) * D2.silver * mo.silver), itemChance: D2.itemChance + (elite ? ELITE.item : 0) };
  }

  // ---------- Expedíció menete ----------
  function startExpedition(hero, offer, state) {
    var rng = mulberry32(offer.seed);
    var region = D.REGIONS.filter(function (r) { return r.id === offer.region; })[0];
    var exp = {
      offer: offer, step: 0, clearings: [], blessing: false, hpFactor: 1, bonusXp: 0, loot: [], silver: 0, dust: 0,
      log: [], seed: newSeed(rng), done: false
    };
    var used = {};
    for (var i = 0; i < 3; i++) exp.clearings.push(makeClearing(rng, hero, offer, region, i, used));
    return exp;
  }

  function searchChance(hero) {
    var s = heroStats(hero), sc = scaleFor(hero.level);
    return clamp(0.62 + 0.3 * s.fur / (s.fur + sc * 0.5), 0.62, 0.92);
  }

  // ---------- kalandtartalom (js/content.js bővíti; ha nincs, a régi lista marad) ----------
  // a régi események (a/b) is ugyanabban a formában: options tömb
  function normEvent(ev) {
    if (!ev || ev.options) return ev;
    return { id: ev.id || ev.title, region: 'any', kind: 'esemeny', title: ev.title, text: ev.text, options: [ev.a, ev.b] };
  }
  function advPool(key, regionId, legacy) {
    var A = D.ADVENTURE, out = (legacy || []).slice();
    if (A && A[key]) out = out.concat(A[key].any || [], A[key][regionId] || []);
    return out;
  }
  function eventPool(regionId) {
    var list = D.EVENTS.map(normEvent);
    if (D.ADVENTURE && D.ADVENTURE.events) list = list.concat(D.ADVENTURE.events.filter(function (e) { return !e.follow && (e.region === 'any' || e.region === regionId); }));
    return list;
  }
  // súlyozott választás: az „arany tisztás” ritka; egy kalandon belül nem ismétlődik esemény
  function pickEvent(rng, regionId, used) {
    var last = used.__n >= 2; used.__n = (used.__n || 0) + 1;
    // az utolsó tisztáson nem indulhat lánc (nem lenne hol folytatódnia)
    var pool = eventPool(regionId).filter(function (e) { return !used[e.id || e.title] && !(last && e.options.some(function (o) { return o.setFlag; })); });
    if (!pool.length) pool = eventPool(regionId);
    var tot = 0, w = pool.map(function (e) { var x = e.kind === 'arany' ? 0.12 : 1; tot += x; return x; }), r = rng() * tot;
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function makeClearing(rng, hero, offer, region, idx, used) {
    used = used || {};
    var ev = pickEvent(rng, region.id, used); used[ev.id || ev.title] = 1;
    var se = pick(rng, advPool('searches', region.id, D.SEARCHES)), mname = pick(rng, region.monsters);
    var cards = [
      { type: 'harc', title: mname, text: 'Könnyebb ellenfél, de tapasztalatot ad.', monster: mname, seed: newSeed(rng) },
      { type: 'kutatas', title: se.title, text: se.text, chance: searchChance(hero), seed: newSeed(rng) },
      { type: 'esemeny', title: ev.title, text: ev.text, event: ev, seed: newSeed(rng) }
    ];
    return { intro: pick(rng, advPool('intros', region.id, D.CLEARING_INTROS)), cards: shuffle(rng, cards) };
  }
  // a láncesemény: ha az előző tisztáson valami elindult, a következő tisztás eseménye annak a folytatása
  function applyFollow(exp) {
    var f = exp.pendingFollow, cl = exp.clearings[exp.step];
    exp.pendingFollow = null;
    if (!f || !cl || !D.ADVENTURE) return;
    var ev = (D.ADVENTURE.events || []).filter(function (e) { return e.follow === f; })[0];
    if (!ev) return;
    cl.cards.forEach(function (c) { if (c.type === 'esemeny') { c.event = ev; c.title = ev.title; c.text = ev.text; } });
  }
  // a választható lehetőségek (a származáshoz vagy jellemhez kötöttek csak annak, akire illik)
  function eventOptions(hero, ev) {
    ev = normEvent(ev);
    return ev.options.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) {
      var n = x.o.needs; if (!n) return true;
      return (n.origin && n.origin === hero.origin) || (n.trait && n.trait === hero.trait);
    });
  }
  function eventCost(lm, o) { return o && o.cost ? Math.round(silverBase(lm) * 0.35 * o.cost) : 0; }
  // próba (pl. fürgeség): az alapesély a jellemzővel nő, de 30% és 92% között marad
  function eventCheckChance(hero, check) {
    var s = heroStats(hero), k = ['tam', 'ved', 'elet'].indexOf(check.stat) >= 0 ? check.stat : 'fur';
    var ref = refBase(hero.level)[k];
    return clamp(check.base - 0.12 + 0.3 * s[k] / (s[k] + ref), 0.3, 0.92);
  }
  function applyEventEffect(hero, exp, rng, eff, amount, out) {
    var lm = exp.offer.lm, m = clamp(amount == null ? 1 : +amount, 0.5, 2);
    if (eff === 'heal' && exp.hpFactor >= 1) { eff = 'xp'; out.healToXp = true; } // teljes életerőnél a pihenő tapasztalatot ad, hogy ne vesszen el
    out.effect = eff;
    if (eff === 'blessing') { exp.blessing = Math.min(20, (exp.blessing === true ? 10 : (+exp.blessing || 0)) + Math.round(10 * m)); out.blessPct = Math.round(10 * m); }
    else if (eff === 'silver') { out.silver = Math.round(silverBase(lm) * 0.5 * m); exp.silver += out.silver; }
    else if (eff === 'dust') { out.dust = Math.round((6 + lm) * 0.8 * m); exp.dust += out.dust; }
    else if (eff === 'heal') { exp.hpFactor = Math.min(1, exp.hpFactor + 0.1 * m); out.healed = true; }
    else if (eff === 'hurt') { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.06 * m); out.hpLoss = true; }
    else if (eff === 'xp') { out.xp = Math.round(xpBase(hero.level) * 0.08 * m); exp.bonusXp += out.xp; }
    else if (eff === 'item' && exp.torchInfo && exp.torchInfo.tired) { out.effect = 'silver'; out.silver = Math.round(silverBase(lm) * 0.5); exp.silver += out.silver; }
    else if (eff === 'item') {
      var it2 = makeItem(rng, { slot: 'fegyver', rarity: rng() < 0.5 ? 'zold' : 'szurke', level: lootLevel(hero, lm), classId: hero.classId, set: exp.offer.region });
      exp.loot.push(it2); out.item = it2;
    }
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
          var it = makeItem(rng, { rarity: rarity, level: lootLevel(hero, lm), classId: hero.classId, hero: hero, set: exp.offer.region });
          exp.loot.push(it); out.item = it;
        } else { out.silver = Math.round(silverBase(lm) * (0.6 + rng() * 0.6)); exp.silver += out.silver; }
      } else { exp.hpFactor = Math.max(0.7, exp.hpFactor - 0.04); out.hpLoss = true; } // a sikertelen kutatás csak kis sérülés (különben csapda lenne)
    } else if (card.type === 'esemeny') {
      var ev = normEvent(card.event), idx = choice === 'a' ? 0 : choice === 'b' ? 1 : +choice;
      var opt = ev.options[idx];
      out.result = opt.result; out.kind = ev.kind || 'esemeny';
      if (opt.check) {
        out.checkChance = eventCheckChance(hero, opt.check);
        out.checkOk = rng() < out.checkChance;
        // a kockázatért több jár: sikernél legalább másfélszeres jutalom, kudarcnál csak kisebb baj
        if (!out.checkOk && opt.fail) { out.result = opt.fail.result; applyEventEffect(hero, exp, rng, opt.fail.effect, (opt.fail.effect === 'hurt' ? 0.5 : 1) * (opt.fail.amount == null ? 1 : opt.fail.amount), out); }
        else applyEventEffect(hero, exp, rng, opt.effect, Math.max(1.5, opt.amount == null ? 1 : opt.amount), out);
      } else applyEventEffect(hero, exp, rng, opt.effect, opt.amount, out);
      if (opt.setFlag) { exp.flags = exp.flags || {}; exp.flags[opt.setFlag] = 1; exp.pendingFollow = opt.setFlag; out.follow = true; }
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
    var d = exp.offer.diff, D2 = DIFF[d], lm = exp.offer.lm, moon = offerMoon(exp.offer), itemChance = D2.itemChance + (exp.offer.elite ? ELITE.item : 0);
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
      if (!torchInfo.tired && rng() < itemChance) { // fáradtan (fáklya nélkül) nincs tárgy
        var rarity = rollLoot(rng, d, hero, { pity: true });
        choices.push({ kind: 'item', item: makeItem(rng, { rarity: rarity, level: itemLv, classId: hero.classId, hero: hero, set: exp.offer.region }) });
        if (rng() < 0.35) {
          var r2 = rollLoot(rng, d, hero, { pity: true });
          choices.push({ kind: 'item', item: makeItem(rng, { rarity: r2, level: itemLv, classId: hero.classId, hero: hero, set: exp.offer.region }) });
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
          res.mythic = makeItem(rng, { rarity: 'legendas', line: 'Egyedi ragyogású tárgy: kevés hős látott még ilyet.', level: itemLv, classId: hero.classId, mythic: true, name: D.MYTHIC_NAMES[mi], slot: D.MYTHIC_SLOTS[mi], set: exp.offer.region });
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
  // a legnagyobb harcerejű összeállítás a felvett és a táskában lévő tárgyakból: az egész összeállítást értékeli
  // (helyenként próbál cserét, amíg javul), így a tárgyak közti kölcsönhatás is számít
  function bestGear(hero) {
    var eq = {}; D.SLOT_ORDER.forEach(function (s) { eq[s] = hero.equipped[s] || null; });
    var score = function () { return powerRaw(heroStats(hero, eq)); }, cur = score(), start = cur;
    for (var pass = 0; pass < 4; pass++) {
      var improved = false;
      D.SLOT_ORDER.forEach(function (s) {
        var cands = hero.inventory.filter(function (i) { return i.slot === s; }).concat(hero.equipped[s] ? [hero.equipped[s]] : []);
        cands.forEach(function (it) { var keep = eq[s]; eq[s] = it; var v = score(); if (v > cur + 0.05) { cur = v; improved = true; } else eq[s] = keep; });
      });
      if (!improved) break;
    }
    var changes = D.SLOT_ORDER.filter(function (s) { return eq[s] && eq[s] !== hero.equipped[s]; }).map(function (s) { return { slot: s, to: eq[s], from: hero.equipped[s] || null }; });
    return { changes: changes, before: start, after: cur };
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
      if (hero.inventory[i].locked) return 0; // zárolt tárgyat nem lehet szétszedni
      var it = hero.inventory.splice(i, 1)[0], rf = refundValue(it);
      hero.dust += rf; // a fejlesztés visszatérítése nem számít bele a heti keretbe
      return addDust(save, hero, salvageValue(it), now) + rf;
    }
    return 0;
  }
  function sell(hero, itemId) {
    for (var i = 0; i < hero.inventory.length; i++) if (hero.inventory[i].id === itemId) {
      if (hero.inventory[i].locked) return 0; // zárolt tárgyat nem lehet eladni
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
    var k = COMBAT.boss * mult;
    f.damage = Math.round(f.dmgDealt * k);
    // a lejátszás számlálója is ugyanazt mutassa, mint a végeredmény
    if (f.log) f.log.forEach(function (e) {
      if (e.mhp != null) e.mhp = 1e12 - (1e12 - e.mhp) * k;
      if (e.dmg != null && e.who !== 'm') e.dmg = Math.round(e.dmg * k);
    });
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
    mulberry32: mulberry32, newSeed: newSeed, setForLevel: setForLevel, pick: pick, shuffle: shuffle, clamp: clamp,
    MAX_ROUNDS: MAX_ROUNDS, MAX_LEVEL: MAX_LEVEL, DIFF: DIFF, DIFF_ORDER: DIFF_ORDER, MOONS: MOONS, MOON_ORDER: MOON_ORDER,
    TORCH: TORCH, DUST_WEEKLY: DUST_WEEKLY, PITY_PURPLE: PITY_PURPLE, PITY_LEGEND: PITY_LEGEND, MAX_PLUS: MAX_PLUS, REFUND: REFUND, maxPlus: maxPlus, refundValue: refundValue, upgradeSilver: upgradeSilver, legendChance: legendChance, RARITY_GATE: RARITY_GATE, gateRarity: gateRarity, rollLoot: rollLoot, lilaChance: lilaChance, INVENTORY_MAX: INVENTORY_MAX,
    refBase: refBase, xpNeeded: xpNeeded, xpBase: xpBase, silverBase: silverBase,
    itemStats: itemStats, makeItem: makeItem, affixText: affixText, salvageValue: salvageValue, sellValue: sellValue, upgradeCost: upgradeCost,
    newHero: newHero, unlockedSkills: unlockedSkills, nextSkillUnlock: nextSkillUnlock, heroStats: heroStats, power: power, powerRaw: powerRaw, lootLevel: lootLevel,
    fighterFromHero: fighterFromHero, monsterFighter: monsterFighter, simulateFight: simulateFight, simulateDuel: simulateDuel, duelChance: duelChance, PVP: PVP, winChance: winChance,
    findMonsterLevel: findMonsterLevel, COMBAT: COMBAT, regionFor: regionFor, makeOffers: makeOffers, offerTarget: offerTarget, ELITE: ELITE, offerMoon: offerMoon, eliteTarget: eliteTarget, normEvent: normEvent, eventOptions: eventOptions, eventCost: eventCost, eventCheckChance: eventCheckChance, applyFollow: applyFollow, offerChance: offerChance,
    startExpedition: startExpedition, resolveCard: resolveCard, guardPreview: guardPreview, fightGuard: fightGuard,
    finishExpedition: finishExpedition, applyChoice: applyChoice, lossAdvice: lossAdvice,
    torchState: torchState, spendTorch: spendTorch, dustRoom: dustRoom, dustCap: dustCap, weekOf: weekOf, addDust: addDust, addXp: addXp,
    addItem: addItem, powerDelta: powerDelta, bestGear: bestGear, isUpgrade: isUpgrade, equip: equip, salvage: salvage, sell: sell, upgrade: upgrade,
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
  // a szerver által kiszámolt (felszerelés szerinti) kinézet szűrése megjelenítéshez: a felszerelés-mezőket is átengedi.
  // A mentésbe (készítés, átszabás) a szigorú cleanRig kerül, így ezeket a mezőket a kliens nem csempészheti be.
  function cleanWorn(rig, classId) {
    const out = cleanRig(rig, classId); rig = rig && typeof rig === 'object' ? rig : {};
    if (GLOW_OK.indexOf(rig.wGlow) >= 0) out.wGlow = rig.wGlow;
    if (rig.wSpark === true) out.wSpark = true;
    if ([1, 2, 3, 4].indexOf(rig.wGlowLv) >= 0) out.wGlowLv = rig.wGlowLv;
    ['gset', 'hset', 'wset'].forEach(k => { if (SET_PAL[rig[k]]) out[k] = rig[k]; });
    ['gtier', 'htier', 'wtier'].forEach(k => { if ([0, 1, 2, 3].indexOf(rig[k]) >= 0) out[k] = rig[k]; });
    ['uniqP', 'uniqH', 'uniqW', 'uniqA'].forEach(k => { if (typeof rig[k] === 'string' && rig[k].length < 60 && /^(pancel|sisak|fegyver|mitikus):/.test(rig[k])) out[k] = rig[k]; });
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
  // ---------- a felszerelés kinézete (WoW/AION mintára) ----------
  // A hős arca, haja, teste, fegyvertípusa és ruhaszabása a készítőből jön (ő maga). A tárgyak a tájegységük
  // SZETTJÉT adják: ahonnan a tárgy származik, olyan a stílusa; a ritkaság egyre gazdagabb formát ad, a névvel
  // ellátott legendás és a mitikus tárgyak egyedi rajzot kapnak. A fegyver fénye a fejlesztésből jön (+4, +8, +10, +12),
  // a szárny és az aura eredményekért jár (csak dísz). Amit egyszer viseltél, a ruhatáradba kerül (hero.looks).
  const SET_TIER = { zold: 0, kek: 1, lila: 2, legendas: 3 };
  // szett-színek ritkaságonként: [fő szín, kiegészítő szín, fém]
  const SET_PAL = {
    kodlap:    [['#4f6b44', '#6a5236', 'bronz'], ['#3f6a5a', '#5a4630', 'bronz'], ['#2f5a4a', '#8fbf9a', 'ezust'], ['#2f5a46', '#e0b44a', 'arany']],
    holdfeny:  [['#5a6a8e', '#3f5a3a', 'ezust'], ['#46609e', '#cfd6ea', 'ezust'], ['#3a4a9e', '#cfe0ff', 'ezust'], ['#2c3a8c', '#e0b44a', 'arany']],
    arnyromok: [['#5e5a68', '#3e3a46', 'ejacel'], ['#4f4a6a', '#7a6aa8', 'ejacel'], ['#4a2f8a', '#c79bff', 'ejacel'], ['#3a2a6a', '#e0b44a', 'arany']],
    szirtek:   [['#3f6e88', '#5a5f78', 'ezust'], ['#2f6a8a', '#8ff6ff', 'ezust'], ['#1f5a78', '#8ff6ff', 'ejacel'], ['#1f4a6a', '#e0b44a', 'arany']],
    ejkatlan:  [['#3a2a36', '#5a1f30', 'ejacel'], ['#2a2030', '#8a2f56', 'ejacel'], ['#24182a', '#ff6a8a', 'ejacel'], ['#24182a', '#e0b44a', 'arany']]
  };
  const SET_NAME = { kodlap: 'Ködlápi', holdfeny: 'Holdfény-erdei', arnyromok: 'Árnyromoki', szirtek: 'Szirti', ejkatlan: 'Éjkatlani' };
  const GEAR_CAPE = { zold: 'nincs', kek: 'rovid', lila: 'hosszu', legendas: 'hosszu' };
  const GEAR_HELM = {
    nehez: { zold: 'csuklya', kek: 'sisak', lila: 'sisak', legendas: 'sisak' },
    konnyu: { zold: 'csuklya', kek: 'csuklya', lila: 'abroncs', legendas: 'diadem' },
    varazs: { zold: 'suveg', kek: 'koszoru', lila: 'abroncs', legendas: 'diadem' }
  };
  const HELM_FAMILY = { harcos: 'nehez', alakvalto: 'konnyu', vadasz: 'konnyu', orgyilkos: 'konnyu', magus: 'varazs', gyogyito: 'varazs', idezo: 'varazs', dalnok: 'varazs' };
  // a fejlesztés fénye (AION-módra): +4 halvány, +8 erős, +10 a ritkaság színében, +12 szikrázik
  const GLOW_PLAIN = '#cfe0ff';
  const GLOW_RAR = { szurke: '#cfe0ff', zold: '#7be3a0', kek: '#7fb8ff', lila: '#c79bff', legendas: '#ffd76a' };
  const GLOW_OK = [GLOW_PLAIN, '#7be3a0', '#7fb8ff', '#c79bff', '#ffd76a'];
  function glowOf(it) {
    const p = (it && it.plus) || 0, lv = p >= 12 ? 4 : p >= 10 ? 3 : p >= 8 ? 2 : p >= 4 ? 1 : 0;
    if (!lv) return null;
    return { wGlow: lv >= 3 ? GLOW_RAR[it.rarity] || GLOW_PLAIN : GLOW_PLAIN, wGlowLv: lv, wSpark: lv >= 4 };
  }
  const RAR_RANK = { szurke: 0, zold: 1, kek: 2, lila: 3, legendas: 4 };
  function strHash(t) { let h = 0; t = String(t || ''); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
  function uniqueName(it) {
    if (!it) return null;
    if (it.mythic && (D.MYTHIC_NAMES || []).indexOf(it.name) >= 0) return 'mitikus:' + it.name;
    if (it.rarity !== 'legendas' || !D.LEGEND_NAMES) return null;
    const L = D.LEGEND_NAMES, list = it.slot === 'fegyver' ? Object.keys(L.fegyver).reduce((a, k) => a.concat(L.fegyver[k]), []) : (L[it.slot] || []);
    return list.indexOf(it.name) >= 0 ? it.slot + ':' + it.name : null;
  }
  // a kinézet kulcsa: „szett:ritkaság” vagy „u|egyedi név”; a régi (ritkaság.változat) kulcsok is működnek
  function lookKey(it) {
    if (!it || !RAR_RANK.hasOwnProperty(it.rarity)) return null;
    const u = uniqueName(it);
    if (u) return 'u|' + u;
    return (it.set || (E.setForLevel ? E.setForLevel(it.level || 1) : 'kodlap')) + ':' + it.rarity;
  }
  function lookPiece(slot, key, classId) {
    const out = {};
    key = String(key || '');
    if (key.indexOf('u|') === 0) { // egyedi legendás / mitikus
      const u = key.slice(2), sl = u.split(':')[0] === 'mitikus' ? slot : u.split(':')[0];
      if (sl === 'pancel') { out.uniqP = u; out.gtier = 3; out.cape = 'hosszu'; }
      else if (sl === 'sisak') { out.uniqH = u; out.htier = 3; out.headwear = GEAR_HELM[HELM_FAMILY[classId] || 'varazs'].legendas; }
      else if (sl === 'fegyver') { out.uniqW = u; out.wtier = 3; }
      else if (sl === 'amulett' && u.indexOf('mitikus:') === 0) out.uniqA = u;
      else if (sl === 'gyuru') out.earring = 'kristaly';
      return out;
    }
    if (key.indexOf(':') < 0) return out; // régi formájú kulcs (az előző rendszerből): nincs szett-adata
    const p = key.split(':'), set = p[0], r = p[1], t = SET_TIER[r];
    if (!SET_PAL[set] || t == null) return out; // szürke: a saját, készítőbeli ruhád
    const pal = SET_PAL[set][t];
    if (slot === 'pancel') { out.gset = set; out.gtier = t; out.c1 = pal[0]; out.c2 = pal[1]; out.metal = pal[2]; out.cape = GEAR_CAPE[r]; }
    if (slot === 'sisak') { out.hset = set; out.htier = t; out.headwear = GEAR_HELM[HELM_FAMILY[classId] || 'varazs'][r]; out._metal = pal[2]; }
    if (slot === 'fegyver') { out.wset = set; out.wtier = t; }
    if (slot === 'gyuru') out.earring = t >= 2 ? 'kristaly' : t === 1 ? 'karika' : 'nincs';
    return out;
  }
  function lookVisible(slot, key) {
    key = String(key || '');
    if (key.indexOf('u|') === 0) return slot === 'amulett' ? key.indexOf('u|mitikus:') === 0 : true;
    if (key.indexOf(':') < 0) return false;
    const t = SET_TIER[key.split(':')[1]];
    if (t == null) return false;
    if (slot === 'amulett') return false;
    if (slot === 'gyuru') return t >= 1;
    return true;
  }
  function lookName(key) {
    key = String(key || '');
    if (key.indexOf('u|') === 0) return key.slice(2).split(':').slice(1).join(':');
    const p = key.split(':');
    return SET_NAME[p[0]] ? `${SET_NAME[p[0]]} szett (${(D.RARITIES[p[1]] || {}).name || p[1]})` : key;
  }

  // ---------- szárnyak és aurák: eredményekért (csak dísz) ----------
  const COSMETICS = [
    { id: 'toll', kind: 'wings', name: 'Tollszárny', how: '100 győzelem', val: s => (s.hero.stats.wins || 0), goal: 100 },
    { id: 'tunder', kind: 'wings', name: 'Tündérszárny', how: '30 teljesített megbízás', val: s => (s.hero.stats.quests || 0), goal: 30 },
    { id: 'denever', kind: 'wings', name: 'Denevérszárny', how: 'Az Árnyromok mind a 6 őrzőjének legyőzése', val: s => regionGuards(s, 'arnyromok'), goal: 6 },
    { id: 'kristaly', kind: 'wings', name: 'Kristályszárny', how: 'A Holdtorony 30. emelete', val: s => (s.hero.stats.towerMax || 0), goal: 30 },
    { id: 'lang', kind: 'wings', name: 'Lángszárny', how: '25 elit őrző legyőzése', val: s => (s.hero.stats.eliteWins || 0), goal: 25 },
    { id: 'arny', kind: 'wings', name: 'Árnyszárny', how: '50 győzelem az Arénában', val: s => (s.arena && s.arena.wins) || 0, goal: 50 },
    { id: 'feny', kind: 'wings', name: 'Fényszárny', how: 'A Holdkrónika befejezése', val: s => (s.story && s.story.done) || 0, goal: 10 },
    { id: 'holdezust', kind: 'wings', name: 'Holdezüst szárny', how: 'Az 50. szint', val: s => s.hero.level, goal: 50 },
    { id: 'csillag', kind: 'wings', name: 'Csillagszárny', how: 'Egy mitikus tárgy megszerzése', val: s => (s.hero.stats.mythics || 0), goal: 1 },
    { id: 'holdfeny', kind: 'aura', name: 'Holdfény-aura', how: '20 győzelem Nehéz kalandon', val: s => (s.hero.stats.hardWins || 0), goal: 20 },
    { id: 'csillagpor', kind: 'aura', name: 'Csillagpor-aura', how: 'Egy legendás tárgy megszerzése', val: s => (s.hero.stats.legendaries || 0), goal: 1 },
    { id: 'arny', kind: 'aura', name: 'Árnyaura', how: '40 lény a bestiáriumban', val: s => Object.keys(((s.album || {}).kills) || {}).length, goal: 40 },
    { id: 'parazs', kind: 'aura', name: 'Parázsaura', how: 'Az Éjkatlan mind a 6 őrzőjének legyőzése', val: s => regionGuards(s, 'ejkatlan'), goal: 6 },
    { id: 'villam', kind: 'aura', name: 'Villámaura', how: 'A Holdtorony 50. emelete', val: s => (s.hero.stats.towerMax || 0), goal: 50 }
  ];
  function regionGuards(save, rid) { const r = D.REGIONS.filter(x => x.id === rid)[0], m = (save.album || {}).mon || {}; return r ? r.guards.filter(g => m[g]).length : 0; }
  function cosmeticList(save) { return COSMETICS.map(c => { const v = Math.min(c.goal, c.val(save) || 0); return Object.assign({}, c, { have: v, done: ((save.hero.cosm || {})[c.kind] || []).indexOf(c.id) >= 0 }); }); }
  function unlockCosmetics(save, now) {
    const h = save.hero; if (!h) return;
    const C = h.cosm = h.cosm || { wings: [], aura: [] };
    // a régi, készítőben választott szárny és aura megmarad (régi hősöknél)
    const old = h.rig || {};
    if (!C.legacy) { C.legacy = 1; if (old.wings && old.wings !== 'nincs' && C.wings.indexOf(old.wings) < 0) C.wings.push(old.wings); if (old.aura && old.aura !== 'nincs' && C.aura.indexOf(old.aura) < 0) C.aura.push(old.aura);
      h.lookPick = h.lookPick || {}; if (old.wings && old.wings !== 'nincs' && !h.lookPick.szarny) h.lookPick.szarny = old.wings; if (old.aura && old.aura !== 'nincs' && !h.lookPick.aura) h.lookPick.aura = old.aura; }
    COSMETICS.forEach(c => {
      if (C[c.kind].indexOf(c.id) >= 0 || (c.val(save) || 0) < c.goal) return;
      C[c.kind].push(c.id);
      h.lookPick = h.lookPick || {}; const pk = c.kind === 'wings' ? 'szarny' : 'aura';
      if (!h.lookPick[pk]) h.lookPick[pk] = c.id; // az első megszerzettet rögtön fel is veszi
      if (now) personal(save, now, `<b>${esc(h.name)}</b> kiérdemelte: ${esc(c.name)} (${esc(c.how)}).`, 'win');
    });
  }
  // festés: a páncél színe a játékos választása szerint (Csillagporért)
  const DYES = ['#8e2448', '#c0503a', '#c8a46a', '#e8b94a', '#3f6b3a', '#2f6b4f', '#1f6f8a', '#2c3a8c', '#5a3e9e', '#7a3a8e', '#e8e6f2', '#9aa0b8', '#4a4a5e', '#24203a', '#5a3e2a', '#3a2418'];
  const DYE_COST = 150;

  function unlockLooks(hero) {
    if (!hero || !hero.equipped) return;
    const L = hero.looks = hero.looks || {};
    const N = hero.lookNames = hero.lookNames || {};
    (D.SLOT_ORDER || []).forEach(sl => { const it = hero.equipped[sl], k = lookKey(it); if (k) { L[sl] = L[sl] || []; if (L[sl].indexOf(k) < 0) { L[sl].push(k); N[sl + ':' + k] = String(it.name).slice(0, 40); } } });
  }
  function wornLook(hero) {
    const base = migrateLook(hero), eq = hero.equipped || {}, pick = hero.lookPick || {}, own = hero.looks || {};
    if (Array.isArray(hero.equipped)) return base;
    // a szárny és az aura eredményekért jár; a készítőbeliek a régi hősöknél gyűjteményként élnek tovább
    const C = hero.cosm;
    if (C && C.legacy) { // a régi hősök készítőbeli szárnya/aurája az első lépésükig a régi helyén marad
      base.wings = pick.szarny && C.wings.indexOf(pick.szarny) >= 0 ? pick.szarny : 'nincs';
      base.aura = pick.aura && C.aura.indexOf(pick.aura) >= 0 ? pick.aura : 'nincs';
    }
    if (pick.gyuru !== 'alap' && eq.gyuru) base.earring = 'nincs';
    let metal = null, mr = -1;
    (D.SLOT_ORDER || []).forEach(sl => {
      const pk = pick[sl];
      if (pk === 'alap') return;
      const okPk = pk && pk !== 'auto' && (own[sl] || []).indexOf(pk) >= 0 && (pk.indexOf(':') > 0 || pk.indexOf('u|') === 0); // a régi (előző rendszerbeli) kulcs „auto”
      const key = okPk ? pk : lookKey(eq[sl]);
      if (!key) return;
      const pc = lookPiece(sl, key, hero.classId);
      const m = pc._metal || pc.metal; delete pc._metal; delete pc.metal;
      const rk = pc.gtier != null ? pc.gtier : pc.htier != null ? pc.htier : -1;
      if (m && rk > mr && (sl === 'pancel' || sl === 'sisak')) { mr = rk; metal = m; }
      Object.assign(base, pc);
    });
    if (metal) base.metal = metal;
    // festés: a páncél színeit felülírja
    if (hero.dye && (base.gset || base.uniqP)) { if (hero.dye.c1) base.c1 = hero.dye.c1; if (hero.dye.c2) base.c2 = hero.dye.c2; }
    // a fegyver fénye a viselt fegyver fejlesztéséből (a ruhatárbeli kinézettől függetlenül, mint az AION-ban)
    const g = glowOf(eq.fegyver);
    if (g) Object.assign(base, g);
    return base;
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
    if (opts.rig) { hero.rig = cleanRig(opts.rig, hero.classId); hero.rig.aura = 'nincs'; hero.rig.wings = 'nincs'; } // a szárny és az aura kiérdemelhető, nem választható
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
    if (out.type === 'esemeny') { o.result = out.result; o.effect = out.effect; o.silver = out.silver || 0; o.dust = out.dust || 0; o.xp = out.xp || 0; o.item = out.item || null; o.title = card.event.title; o.kind = out.kind || 'esemeny'; if (out.blessPct) o.blessPct = out.blessPct; if (out.healToXp) o.healToXp = true;
      if (out.checkChance != null) { o.checkOk = out.checkOk; o.checkChance = out.checkChance; } if (out.cost) o.cost = out.cost; if (out.follow) o.follow = true; }
    return o;
  }
  function fightPayload(f, heroF, mon) {
    return { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon };
  }

  // ---------- műveletek ----------
  const A = {};
  A.lookPick = (save, a) => {
    const h = save.hero, sl = a.slot, k = String(a.key || 'auto');
    h.lookPick = h.lookPick || {};
    if (sl === 'szarny' || sl === 'aura') { // szárny / aura: csak a megszerzettek közül
      const C = h.cosm || { wings: [], aura: [] }, list = sl === 'szarny' ? C.wings : C.aura;
      if (k !== 'nincs' && list.indexOf(k) < 0) fail('arg', 'Ezt még nem érdemelted ki.');
      h.lookPick[sl] = k; return { ok: true };
    }
    if ((D.SLOT_ORDER || []).indexOf(sl) < 0) fail('arg', 'Ismeretlen hely.');
    if (k !== 'auto' && k !== 'alap' && ((h.looks || {})[sl] || []).indexOf(k) < 0) fail('arg', 'Ez a kinézet még nincs meg.');
    if (k === 'auto') delete h.lookPick[sl]; else h.lookPick[sl] = k;
    return { ok: true };
  };
  A.dye = (save, a) => {
    const h = save.hero;
    if (a.clear) { delete h.dye; return { ok: true }; }
    const c1 = DYES.indexOf(a.c1) >= 0 ? a.c1 : null, c2 = DYES.indexOf(a.c2) >= 0 ? a.c2 : null;
    if (!c1 && !c2) fail('arg', 'Válassz színt.');
    const w = wornLook(h); if (!w.gset && !w.uniqP) fail('state', 'Festeni csak szett- vagy egyedi páncélt lehet. Előbb vegyél fel egyet (a zöldtől felfelé).');
    if ((h.dust || 0) < DYE_COST) fail('cost', `A festés ${DYE_COST} Csillagporba kerül.`);
    h.dust -= DYE_COST;
    h.dye = { c1: c1 || (h.dye && h.dye.c1) || null, c2: c2 || (h.dye && h.dye.c2) || null };
    return { ok: true };
  };

  // a kinézet átszabása bármikor (a név, a faj és a kaszt nem változik)
  A.restyle = (save, a) => { const old = migrateLook(save.hero), r = cleanRig(Object.assign({}, old, a.rig && typeof a.rig === 'object' ? a.rig : {}), save.hero.classId); ['wGlow', 'wSpark', 'wGlowLv', 'gset', 'hset', 'wset', 'gtier', 'htier', 'wtier', 'uniqP', 'uniqH', 'uniqW', 'uniqA'].forEach(k => delete r[k]); r.aura = old.aura; r.wings = old.wings; save.hero.rig = r; };
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
    const h = save.hero, ev = E.normEvent(card.event), idx = a.v === 'a' ? 0 : a.v === 'b' ? 1 : (a.v | 0);
    const ok = E.eventOptions(h, ev).some(x => x.i === idx);
    if (!ok || !ev.options[idx]) fail('arg', 'Ez a lehetőség most nem választható.');
    const cost = E.eventCost(exp.offer.lm, ev.options[idx]);
    if (cost > h.silver) fail('cost', 'Nincs elég Holdezüstöd.');
    h.silver -= cost;
    const out = E.resolveCard(h, exp, card, idx);
    if (cost) out.cost = cost;
    exp.lastOut = summarizeOut(save, out, card); exp.pendingCard = null; exp.phase = 'cardResult';
  };
  A.next = (save) => {
    const exp = needExp(save, ['cardResult']);
    exp.phase = exp.step >= 3 ? 'guard' : 'clearing'; exp.lastOut = null;
    if (exp.phase === 'clearing') E.applyFollow(exp);
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
  // több tárgy felvétele egyszerre (a „Legnagyobb harcerő felvétele” és a visszavonása): csak a táskában lévő,
  // különböző helyre szóló tárgyak; a lecserélt darabok a táskába kerülnek, semmi nem vész el
  A.equipIds = (save, a) => {
    // unequip: visszavonáskor a korábban üres helyek újra üresek lesznek (a tárgy a táskába kerül)
    const ids = Array.isArray(a.ids) ? a.ids.map(String) : [], h = save.hero;
    const off = Array.isArray(a.unequip) ? a.unequip.map(String).filter(s => D.SLOT_ORDER.indexOf(s) >= 0) : [];
    if ((!ids.length && !off.length) || ids.length > D.SLOT_ORDER.length || new Set(ids).size !== ids.length || new Set(off).size !== off.length) fail('arg', 'Érvénytelen tárgylista.');
    const its = ids.map(id => h.inventory.find(i => i.id === id));
    if (its.some(i => !i)) fail('arg', 'Nincs ilyen tárgy a táskában.');
    if (new Set(its.map(i => i.slot)).size !== its.length || its.some(i => off.indexOf(i.slot) >= 0)) fail('arg', 'Egy helyre csak egy tárgy kerülhet.');
    const freed = off.filter(s => h.equipped[s]).length;
    if (h.inventory.length - its.length + its.length + freed > E.INVENTORY_MAX) fail('state', 'Nincs elég hely a táskában.');
    its.forEach(i => E.equip(h, i.id));
    off.forEach(s => { if (h.equipped[s]) { h.inventory.push(h.equipped[s]); delete h.equipped[s]; } });
    return { ids: ids };
  };
  // tárgy zárolása: a zárolt tárgyat sem egyenként, sem tömegesen nem lehet szétszedni vagy eladni (felvenni lehet)
  const lockedItem = (h, id) => h.inventory.find(i => i.id === id && i.locked);
  A.lockItem = (save, a) => {
    const h = save.hero, it = h.inventory.find(i => i.id === a.id) || D.SLOT_ORDER.map(s => h.equipped[s]).find(i => i && i.id === a.id);
    if (!it) fail('arg', 'Nincs ilyen tárgy.');
    if (it.locked) delete it.locked; else it.locked = true;
    return { locked: !!it.locked };
  };
  A.salvage = (save, a, ctx) => { if (lockedItem(save.hero, a.id)) fail('state', 'Ez a tárgy zárolva van: előbb oldd fel a zárolást.'); return { dust: E.salvage(save, save.hero, a.id, ctx.now) }; };
  A.sell = (save, a) => { if (lockedItem(save.hero, a.id)) fail('state', 'Ez a tárgy zárolva van: előbb oldd fel a zárolást.'); return { silver: E.sell(save.hero, a.id) }; };
  A.salvageWeak = (save, a, ctx) => {
    const h = save.hero; let sum = 0;
    h.inventory.filter(it => !it.mythic && !it.locked && (it.rarity === 'szurke' || it.rarity === 'zold') && !E.isUpgrade(h, it)).forEach(it => { sum += E.salvage(save, h, it.id, ctx.now); });
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
  // a teljes sorrend egyszerre (pl. az „Ajánlott sorrend” átvétele): csak a meglévő képességek átrendezése lehet
  A.skillOrder = (save, a) => {
    const l = save.hero.loadout, o = Array.isArray(a.order) ? a.order.map(String) : null;
    if (!o || o.length !== l.length || o.some(id => l.indexOf(id) < 0) || new Set(o).size !== o.length) fail('arg', 'Érvénytelen sorrend.');
    save.hero.loadout = o;
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
  const FREE_DURING_EXPEDITION = ['tactic', 'restyle', 'lookPick', 'dye', 'settings', 'tip', 'equip', 'salvage', 'sell', 'salvageWeak', 'upgrade', 'reroll', 'skillMove', 'skillOrder', 'equipIds', 'lockItem', 'patrolStart', 'patrolClaim'];

  // tárgyak átállítása az új rendszerre (legendás fokozat, fejlesztés-visszatérítés): egyszer, minden régi mentésen
  function migrateItems(save) {
    if (!save || !save.hero || save.itemsV >= 2) return migrateItems3(save);
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
    migrateItems3(save);
  }
  // a Holdkrónika finálé-tárgya: a neve a helyéhez (fegyvernél a kaszt fegyveréhez) illik
  const FINAL_NOUN = { pancel: 'köpeny', sisak: 'korona', gyuru: 'gyűrű', amulett: 'medál' };
  function storyFinalName(slot, classId) {
    const c = D.CLASSES[classId];
    return 'Csillagszív-' + (slot === 'fegyver' ? ((c && c.weapon) || 'kard') : (FINAL_NOUN[slot] || 'medál'));
  }
  // az alakváltó „agyarnyaklánc” fegyvere nyakláncnak látszott: agyarbuzogány lett belőle (név, gyűjtemény, bolt)
  const OLD_NOUN = /agyarnyaklánc$/i;
  function renameNoun(n) { return String(n).replace(/Agyarnyaklánc$/, 'Agyarbuzogány').replace(/agyarnyaklánc$/, 'agyarbuzogány'); }
  function migrateItems3(save) {
    if (!save || !save.hero || save.itemsV >= 3) return migrateItems4(save);
    const h = save.hero, fix = it => { if (it && it.slot === 'fegyver' && OLD_NOUN.test(it.name || '')) it.name = renameNoun(it.name); };
    D.SLOT_ORDER.forEach(s => fix(h.equipped[s])); (h.inventory || []).forEach(fix);
    if (save.shop && save.shop.items) save.shop.items.forEach(x => fix(x && x.item ? x.item : x));
    const al = save.album && save.album.items;
    if (al) Object.keys(al).forEach(n => { if (OLD_NOUN.test(n) && al[n].slot === 'fegyver') { const nn = renameNoun(n); if (!al[nn]) al[nn] = al[n]; delete al[n]; } });
    save.itemsV = 3;
    migrateItems4(save);
  }
  // v4: a régi „Csillagszív-lámpás” bármelyik helyre eshetett (lámpásként gyűrű, sisak…); a nevet a helyéhez igazítjuk.
  // A „Vérhold-agyar” amulett pedig fegyvernek hangzott: Vérhold-medál lett.
  function migrateItems4(save) {
    if (!save || !save.hero || save.itemsV >= 4) return;
    const h = save.hero, ren = {};
    const fix = it => {
      if (!it) return;
      if (it.name === 'Csillagszív-lámpás') { const nn = storyFinalName(it.slot, h.classId); if (nn !== it.name) { ren[it.name + '|' + it.slot] = nn; it.name = nn; } }
      else if (it.name === 'Vérhold-agyar' && it.slot === 'amulett') { ren['Vérhold-agyar|amulett'] = 'Vérhold-medál'; it.name = 'Vérhold-medál'; }
    };
    D.SLOT_ORDER.forEach(s => fix(h.equipped[s])); (h.inventory || []).forEach(fix);
    const al = save.album && save.album.items;
    if (al) Object.keys(al).forEach(n => { const nn = ren[n + '|' + al[n].slot] || (n === 'Vérhold-agyar' ? 'Vérhold-medál' : n === 'Csillagszív-lámpás' ? storyFinalName(al[n].slot, h.classId) : n); if (nn !== n) { if (!al[nn]) al[nn] = al[n]; delete al[n]; } });
    save.itemsV = 4;
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
    run: run, migrateItems: migrateItems, storyFinalName: storyFinalName, actions: A, createSave: createSave, refreshOffers: refreshOffers, offersKey: offersKey, sanitize: sanitize, summary: summary,
    wind: wind, xpBonus: xpBonus, patrolReward: patrolReward, PATROL_HOURS: PATROL_HOURS, budapestDate: budapestDate, validName: validName,
    cleanRig: cleanRig, cleanWorn: cleanWorn, migrateLook: migrateLook, wornLook: wornLook, lookVisible: lookVisible, lookName: lookName, cosmeticList: cosmeticList, unlockCosmetics: unlockCosmetics, DYES: DYES, DYE_COST: DYE_COST, SET_NAME: SET_NAME, lookKey: lookKey, lookPiece: lookPiece, unlockLooks: unlockLooks,
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
    { id: 'verhold', name: 'Vérhold-vadászat', monster: 'Vérholdas fenevad', region: 'ejkatlan', prize: { name: 'Vérhold-medál', slot: 'amulett' },
      line: 'Vörösen kel a hold, és vele ébred a fenevad. Aki sokszor szembeszáll vele, megkapja az agyarából faragott medált.' },
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
  // Párbaj (Aréna): az ellenfél hőse a saját képességeivel harcol (E.simulateDuel). Hogy a kasztpárosítás ne döntse el
  // előre a párbajt, az ellenfél erejét úgy igazítjuk, hogy az esélyed ugyanannyi legyen, mint az erőalapú
  // összevetésben (a hős a saját szelleme ellen 50%); a gépi ellenfél pedig a kitűzött esélyhez igazodik.
  function duelBase(hero) {
    const f = E.fighterFromHero(hero);
    return Object.assign(f, { side: 'm', lm: f.level, name: hero.name, ghostOf: { classId: hero.classId }, tactic: hero.tactic || (D.CLASSES[hero.classId] || {}).tactic || 'kiegy' });
  }
  function duelTune(myF, tactic, g, target) {
    let lo = 0.35, hi = 2.6; // pontosabb mérés (több párbaj), szűkebb keresési tartomány
    for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; if (E.duelChance(myF, scaleGhost(g, mid), tactic, g.tactic, 220, 777 + i) > target) lo = mid; else hi = mid; }
    return +((lo + hi) / 2).toFixed(3);
  }
  // valódi ellenfél: az erőalapú esély (a régi, kasztfüggetlen összevetés) a cél
  const fairTarget = (myF, tactic, opp) => Math.min(0.95, Math.max(0.05, E.winChance(myF, ghostFighter(opp), tactic, 200, 2024)));
  const DUEL_V = 3;
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
    return { uid: uid || null, name: hero.name, classId: hero.classId, level: hero.level, power: E.power(E.heroStats(hero)), rating: rating || 1000, rig: hero.equipped && !Array.isArray(hero.equipped) ? G.wornLook(hero) : (hero.rig || null), look: hero.look || null, people: hero.people, bot: !!hero.bot };
  }

  // ===================== Aréna =====================
  // Naponta 5 párbaj. Három ellenfél közül választasz (hasonló erejűek). Pontszám: Élő-rendszer (K = 32), 1000-ről indul.
  const ARENA_FIGHTS = 5;
  function arenaState(save, now) {
    const today = day(now), wk = weekKey(now);
    let s = save.arena || { rating: 1000, wins: 0, losses: 0, day: today, fights: 0, cands: [], week: wk, weekWins: 0 };
    if (s.day !== today) { s.day = today; s.fights = 0; s.cands = []; s.rerolls = 0; }
    if (s.week !== wk) { s.week = wk; s.weekWins = 0; }
    if (s.v !== DUEL_V) { s.v = DUEL_V; s.cands = []; } // a régi (képesség nélküli) harcra számolt esélyek elavultak
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
      const sn = snap(b, null, 1000); sn.hero = b; sn.target = TARGET[i]; sn.tune = duelTune(myF, h.tactic, duelBase(b), TARGET[i]);
      pool.push(sn);
    }
    // minden jelöltnél kiszámoljuk a győzelmi esélyt és azt, hány pont jár a győzelemért / vész el vereségnél
    pool = pool.map(c => {
      const out = Object.assign({}, c);
      if (c.hero) {
        const g = duelBase(c.hero), tune = c.tune || duelTune(myF, h.tactic, g, fairTarget(myF, h.tactic, c.hero));
        out.chance = +E.duelChance(myF, scaleGhost(g, tune), h.tactic, g.tactic, 200, 2024).toFixed(2);
      }
      // a gépi ellenfél pontszáma az esélyből adódik (Élő-képlet visszafelé), így a nyerhető pont is igazságos
      // gépi ellenfél: a pontszáma a kitűzött esélyből adódik (Élő-képlet visszafelé), így a tét mindig ehhez az esélyhez illik
      // gépi ellenfél: a pontszáma a ténylegesen mért (és kiírt) esélyből adódik, így a tét pontosan ehhez illik
      if (c.target) { const pc = Math.min(0.95, Math.max(0.05, out.chance != null ? out.chance : c.target)); out.rating = Math.round(s.rating + 400 * Math.log10((1 - pc) / pc)); out.power = Math.round(out.power * c.tune); }
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
    const heroF = E.fighterFromHero(h), g0 = duelBase(opp);
    // a harc előtt a mostani felszerelésekhez hangolunk újra (keresés előtti átöltözéssel nem lehet csalni)
    const tune = duelTune(heroF, h.tactic, g0, c.target || fairTarget(heroF, h.tactic, opp));
    const mon = Object.assign(scaleGhost(g0, tune), { name: g0.name });
    const f = E.simulateDuel(heroF, mon, h.tactic, g0.tactic, E.newSeed(), true);
    const oppRating = c.rating;
    const exp = 1 / (1 + Math.pow(10, (oppRating - s.rating) / 400)), delta = Math.round(32 * ((f.win ? 1 : 0) - exp));
    s.rating = Math.max(100, s.rating + delta); s.fights++;
    if (f.win) { s.wins++; s.weekWins++; } else s.losses++;
    const silver = Math.round(E.silverBase(h.level) * (f.win ? 1 : 0.3)), dust = f.win ? Math.round(6 + h.level / 2) : 0;
    h.silver += silver; const dGot = dust ? E.addDust(save, h, dust, ctx.now) : 0;
    s.cands = []; save.arena = s;
    if (f.win && !c.bot) G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> legyőzte az arénában: <b>${G.esc(c.name)}</b>.`, 'win');
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, tie: f.tie, rounds: f.rounds, heroF: heroF, mon: mon, duel: true }, out: { win: f.win, delta: delta, rating: s.rating, opp: Object.assign({}, c, { hero: undefined }), silver: silver, dust: dGot } };
  };

  // ===================== Csapatküldetések =====================
  // Naponta 3 küldetés. 1–2 társat viszel (más játékosok hősei, vagy gépi társak); a társak minden körben veled ütnek.
  // A szörny a csapat erejéhez igazodik (kb. 53% győzelmi esély), a jutalom bőkezűbb; a valódi társak gazdái is kapnak részt.
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
    // a társak külön harcolnak a kasztjuk szerepében (gyógyít, véd, gyorsít vagy sebez); a hős saját társa (idéző) megmarad
    heroF.allies = heroes.map(x => ({ classId: x.classId, share: allyShare(heroF, x) }));
    const names = allies.map(x => x.name);
    const lm = E.findMonsterLevel(heroF, h.tactic, 0.53, { n: 160, power: 1.25 });
    const reg = E.regionFor(lm, 'nehez') || D.REGIONS[0], region = reg.id;
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
      name: h.name, classId: h.classId, people: h.people, level: h.level, rig: h.rig || null, look: h.look || null, worn: G.wornLook(h),
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

  // ===================== Megbízások (mellékküldetések) és bestiárium =====================
  // Egyszerre 3 megbízás; amit átvettél, annak a helyére másnap jön új. Naponta egyet lemondhatsz (azonnal jön helyette másik).
  // A haladást a meglévő műveletek számolják (a harc, kártya, esemény, torony, aréna után). Minden a mentés quests mezőjében él.
  const QUEST_SLOTS = 3;
  // effort: kb. hány átlagos kalandnyi „plusz figyelmet” kér egy egység; a jutalom ehhez arányos (lásd questReward)
  const QUEST_TYPES = {
    guardWin:   { n: [2, 3], effort: 0.5, min: 1 },
    eliteWin:   { n: [1, 1], effort: 2.0, min: 5 },
    hardWin:    { n: [1, 2], effort: 1.6, min: 5 },
    clearFight: { n: [3, 5], effort: 0.25, min: 1 },
    searchOk:   { n: [2, 3], effort: 0.45, min: 1 },
    shrine:     { n: [1, 1], effort: 2.0, min: 1 },
    vendor:     { n: [1, 1], effort: 2.0, min: 1 },
    riddle:     { n: [1, 1], effort: 2.0, min: 1 },
    towerWin:   { n: [1, 2], effort: 0.5, min: 7 },
    arenaWin:   { n: [2, 2], effort: 0.6, min: 1 }
  };
  const REGION_IN = { kodlap: 'a Ködlápon', holdfeny: 'a Holdfény-erdőben', arnyromok: 'az Árnyromokban', szirtek: 'a Csillaghullás-szirteken', ejkatlan: 'az Éjkatlanban' };
  function questTpls() { return (D.QUESTS && D.QUESTS.templates) || []; }
  // a megbízás tájegysége az, amelyiket a Közepes ajánlat épp kínál (a valódi szörnyszint kb. 1,15–1,3 × a hős szintje);
  // ennél későbbi tájegység is beszámít, hogy a megbízás ne ragadhasson be, ha a hős közben továbblép
  const regIdx = id => D.REGIONS.findIndex(r => r.id === id);
  function questLm(save) { const o = (save.offers || []).filter(x => x.diff === 'kozepes')[0]; return o ? o.lm : Math.max(1, save.hero.level * 1.15); }
  function questRegion(save) { const o = (save.offers || []).filter(x => x.diff === 'kozepes')[0]; return o ? o.region : E.regionFor(questLm(save), 'kozepes').id; }
  // független ellenőrzéssel hangolva: a napi 3 megbízás kb. 10–20% plusz egy átlagos játéknaphoz képest
  function questReward(h, q, lm) {
    const T = QUEST_TYPES[q.type], e = T.effort * q.n, L = h.level; lm = lm || Math.max(1, L * 1.15);
    return { silver: Math.round(E.silverBase(lm) * 0.9 * e), dust: Math.round((8 + 1.5 * lm) * 0.35 * e), xp: Math.round(E.xpBase(L) * 0.45 * e) };
  }
  function newQuest(save, rng, avoid) {
    const h = save.hero;
    const types = Object.keys(QUEST_TYPES).filter(t => h.level >= QUEST_TYPES[t].min && avoid.indexOf(t) < 0);
    const type = types[Math.floor(rng() * types.length)] || 'clearFight', T = QUEST_TYPES[type];
    const tpls = questTpls().filter(t => t.type === type), tpl = tpls[Math.floor(rng() * tpls.length)];
    const n = T.n[0] + Math.floor(rng() * (T.n[1] - T.n[0] + 1));
    const q = { id: E.newSeed(rng).toString(36), type: type, tpl: tpl ? tpl.id : null, n: n, prog: 0 };
    if (type === 'guardWin') q.region = questRegion(save);
    return q;
  }
  function questState(save, now) {
    const today = day(now), h = save.hero;
    let s = save.quests;
    if (!s) s = { list: [], day: null, dropped: 0 };
    if (s.day !== today) {
      s = JSON.parse(JSON.stringify(s)); // tiszta függvény: a mentést csak a hívó írja vissza
      s.day = today; s.dropped = 0;
      const rng = E.mulberry32(E.newSeed());
      while (s.list.length < QUEST_SLOTS) s.list.push(newQuest(save, rng, s.list.map(q => q.type)));
    }
    return s;
  }
  function questText(q, k) {
    const t = questTpls().filter(x => x.id === q.tpl)[0];
    if (!t) return '';
    const reg = q.region ? (D.REGIONS.filter(r => r.id === q.region)[0] || {}).name || '' : '';
    const num = ['nulla', 'egy', 'két', 'három', 'négy', 'öt'][q.n] || q.n;
    return String(t[k] || '').replace(/\{n\}/g, num).replace(/\{regioban\}/g, REGION_IN[q.region] || reg).replace(/\{regio\}/g, reg);
  }
  function questBump(save, type, cnt, region) {
    const s = save.quests; if (!s || !s.list) return;
    s.list.forEach(q => { if (q.type === type && q.prog < q.n && (!q.region || regIdx(region) >= regIdx(q.region))) q.prog = Math.min(q.n, q.prog + (cnt || 1)); });
  }
  function killNote(save, name) {
    if (!name) return;
    save.album = save.album || { mon: {}, items: {} };
    const k = save.album.kills = save.album.kills || {};
    k[name] = (k[name] || 0) + 1;
  }
  A.questClaim = (save, a, ctx) => {
    const s = questState(save, ctx.now); save.quests = s;
    const i = s.list.findIndex(q => q.id === a.id);
    if (i < 0) fail('state', 'Ez a megbízás már nincs meg.');
    const q = s.list[i], h = save.hero;
    if (q.prog < q.n) fail('state', 'Ez még nincs kész.');
    const rw = questReward(h, q, questLm(save));
    h.silver += rw.silver;
    const dust = E.addDust(save, h, rw.dust, ctx.now);
    const lv = E.addXp(h, rw.xp); G.levelEvents(save, lv, ctx);
    s.list.splice(i, 1); bump(h, 'quests');
    G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> teljesített egy megbízást: ${G.esc(questText(q, 'title'))}.`, 'win');
    return { silver: rw.silver, dust: dust, xp: rw.xp, done: questText(q, 'done'), levelUps: lv || [] };
  };
  A.questDrop = (save, a, ctx) => {
    const s = questState(save, ctx.now); save.quests = s;
    if (s.dropped >= 1) fail('state', 'Ma már lemondtál egy megbízást. Holnap újra lehet.');
    const i = s.list.findIndex(q => q.id === a.id);
    if (i < 0) fail('state', 'Ez a megbízás már nincs meg.');
    s.dropped++;
    s.list[i] = newQuest(save, E.mulberry32(E.newSeed()), s.list.map(q => q.type).concat([s.list[i].type]));
    return { ok: true };
  };
  A.questView = (save, a, ctx) => { save.quests = questState(save, ctx.now); return { ok: true }; };
  // haladás a meglévő műveletekből
  wrap('fight', save => {
    const exp = save.expedition, res = save.pendingResult;
    if (!exp || !res || !res.win) return;
    questBump(save, 'guardWin', 1, exp.offer.region);
    if (exp.offer.elite) { questBump(save, 'eliteWin', 1); bump(save.hero, 'eliteWins'); }
    if (exp.offer.diff === 'nehez') questBump(save, 'hardWin', 1);
    killNote(save, exp.offer.guard);
  });
  wrap('card', save => {
    const exp = save.expedition, o = exp && exp.lastOut;
    if (!o || exp.phase !== 'cardResult') return;
    if (o.type === 'harc' && o.win) { questBump(save, 'clearFight', 1); killNote(save, o.monster); }
    if (o.type === 'kutatas' && o.success) questBump(save, 'searchOk', 1);
  });
  wrap('event', save => {
    const o = save.expedition && save.expedition.lastOut; if (!o) return;
    if (o.kind === 'szentely') questBump(save, 'shrine', 1);
    if (o.kind === 'arus' && o.cost > 0) questBump(save, 'vendor', 1); // csak ha tényleg vettél valamit
    if (o.kind === 'rejtveny') questBump(save, 'riddle', 1);
  });
  wrap('towerFight', (save, a, ctx, r) => { if (r && r.out && r.out.win) questBump(save, 'towerWin', 1); }); // a gyors mászás nem számít
  wrap('arenaFight', (save, a, ctx, r) => { if (r && r.out && r.out.win) questBump(save, 'arenaWin', 1); });
  // kaland közben a felszerelés/taktika cseréje csak felfelé igazíthatja a szörnyeket (gyenge szettel indulni, aztán átöltözni nem éri meg)
  function recalibrate(save) {
    const exp = save.expedition, h = save.hero;
    if (!exp || exp.phase === 'result' || !exp.offer) return;
    const moon = E.MOONS[exp.offer.moon] || E.MOONS.ujhold;
    if (!E.DIFF[exp.offer.diff]) return;
    // ugyanazzal a céllal (a hold kockázatával együtt) és ugyanazokkal a próbaharcokkal, mint az ajánlat
    const lm = E.findMonsterLevel(E.fighterFromHero(h), h.tactic, E.eliteTarget(exp.offer.diff, moon, exp.offer.elite), { seed: 1000 + E.DIFF_ORDER.indexOf(exp.offer.diff), n: 240, power: moon.power });
    if (lm > exp.offer.lm) { exp.offer.lm = lm; exp.offer.level = Math.max(1, Math.round(lm)); }
  }
  ['equip', 'equipIds', 'tactic', 'skillMove', 'skillOrder', 'upgrade', 'reroll', 'pathPick'].forEach(n => wrap(n, save => recalibrate(save)));
  wrap('upgrade', save => bump(save.hero, 'upgrades'));
  // ===================== Holdkrónika (fő történet) =====================
  // 10 fejezet; a következő a fejezet szintjétől nyílik. Minden fejezet végén egyedi főellenfél, egyszeri jutalommal.
  // A vereség nem visz el semmit, de naponta legfeljebb STORY_TRIES vereség fér bele (különben a próbálkozás ingyen lenne).
  const STORY_TRIES = 3;
  const STORY_RARITY = ['zold', 'kek', 'kek', 'kek', 'lila', 'kek', 'lila', 'kek', 'lila', 'legendas'];
  // a finálé jutalma egyedi, névvel ellátott legendás tárgy
  // a hely a szokásos legendás sorsolásból jön, a név pedig a helyhez (fegyvernél a kaszt fegyveréhez) illik
  const STORY_FINAL_LINE = 'Ozsvát lámpásának fénye van benne. Már nem lopott fény: a holdé, és most a tiéd is.';
  const storyFinalName = G.storyFinalName;
  // a főellenfelek ereje (független ellenőrzéssel kalibrálva, minden kaszt átlaga): a fejezet szintjén, reálisan fejlesztett
  // felszereléssel kb. 60–72% győzelmi esély, lemaradt felszereléssel 31–56%; az 1. fejezet barátságos (~78%).
  // a hosszabb, képességdúsabb harcokhoz újramérve: ugyanaz a győzelmi esély (78–94%), mint korábban
  const STORY_BOSS = [{ lm: 0.56, pw: 0.96 }, { lm: 3.89, pw: 1.1 }, { lm: 9.19, pw: 1.1 }, { lm: 14.8, pw: 1.1 }, { lm: 21.25, pw: 1.1 },
    { lm: 26.72, pw: 1.1 }, { lm: 33.75, pw: 1.1 }, { lm: 40.98, pw: 1.1 }, { lm: 48.14, pw: 1.1 }, { lm: 53.15, pw: 1.1 }];
  function storyChapters() { return (D.STORY && D.STORY.chapters) || []; }
  function storyState(save, now) {
    const today = day(now);
    let s = save.story;
    if (!s) s = { done: 0, choices: {}, day: today, losses: 0 };
    if (s.day !== today) { s.day = today; s.losses = 0; }
    s.choices = s.choices || {};
    return s;
  }
  function storyBoss(i) {
    const ch = storyChapters()[i];
    const b = STORY_BOSS[i] || { lm: ch && ch.level, pw: 1.1 };
    return ch ? E.monsterFighter(b.lm, { power: b.pw, name: ch.boss.name }) : null;
  }
  function storyReward(h, i) {
    const ch = storyChapters()[i], L = Math.min(h.level, ch.level + 3);
    return { silver: Math.round(E.silverBase(L) * 3), dust: Math.round((6 + L) * 3), item: E.gateRarity(STORY_RARITY[i] || 'kek', h.level) };
  }
  function storyNext(save) {
    const s = save.story || { done: 0 }, ch = storyChapters()[s.done];
    if (!ch) fail('state', 'A Holdkrónika minden fejezetét befejezted.');
    if (save.hero.level < ch.level) fail('state', `A következő fejezet a ${ch.level}. szinttől nyílik.`);
    return ch;
  }
  A.storyChoice = (save, a, ctx) => {
    const s = storyState(save, ctx.now); save.story = s;
    const ch = storyNext(save);
    if (!ch.choice) fail('state', 'Ebben a fejezetben nincs döntés.');
    if (s.choices[ch.id]) fail('state', 'Itt már döntöttél.');
    if (a.v !== 'a' && a.v !== 'b') fail('arg', 'Érvénytelen választás.');
    s.choices[ch.id] = a.v;
    return { reply: ch.choice[a.v].reply };
  };
  A.storyFight = (save, a, ctx) => {
    const s = storyState(save, ctx.now); save.story = s;
    const ch = storyNext(save), i = s.done, h = save.hero;
    if (ch.choice && !s.choices[ch.id]) fail('state', 'Előbb dönts a fejezetben.');
    if (s.losses >= STORY_TRIES) fail('state', 'Mára elég volt a harcból ezzel az ellenféllel. Holnap újra próbálhatod.');
    if (h.inventory.length >= E.INVENTORY_MAX) fail('state', 'Tele a táskád: előbb csinálj helyet, hogy a fejezet jutalma beférjen.');
    const mon = storyBoss(i), heroF = E.fighterFromHero(h);
    const f = E.simulateFight(heroF, mon, h.tactic, E.newSeed(), true);
    const out = { chapter: i + 1, win: f.win, region: ch.region, boss: ch.boss.name };
    if (!f.win) s.losses++;
    else {
      const rw = storyReward(h, i), rng = E.mulberry32(E.newSeed());
      s.done = i + 1;
      h.silver += rw.silver; out.silver = rw.silver;
      out.dust = E.addDust(save, h, rw.dust, ctx.now);
      // a fejezet tárgya sosem bomlik szét automatikusan (a táska helyét a harc előtt ellenőriztük)
      const it = E.makeItem(rng, { rarity: rw.item, level: h.level, classId: h.classId, hero: h });
      if (i === storyChapters().length - 1 && rw.item === 'legendas') { it.name = storyFinalName(it.slot, h.classId); it.line = STORY_FINAL_LINE; }
      h.inventory.push(it); G.itemEvent(save, it, ctx, `Holdkrónika, ${i + 1}. fejezet`); out.item = it;
      killNote(save, ch.boss.name);
      G.personal(save, ctx.now, `<b>${G.esc(h.name)}</b> befejezte a Holdkrónika ${i + 1}. fejezetét: ${G.esc(ch.title)}.`, 'win');
    }
    return { fight: { log: f.log, win: f.win, timeout: f.timeout, rounds: f.rounds, heroF: heroF, mon: mon }, out: out };
  };

  ['gift', 'pathPick', 'shopOpen', 'shopReroll', 'shopBuy', 'towerFight', 'towerRush', 'storyChoice', 'storyFight', 'lookPick', 'dye', 'questClaim', 'questDrop', 'questView', 'arenaFind', 'arenaFight', 'teamFind', 'teamFight', 'eventFight', 'eventClaim', 'achClaim'].forEach(n => G.FREE_DURING_EXPEDITION.push(n));
  const run0 = G.run;
  G.run = function (save, action, args, ctx) {
    try { if (save.hero && ctx && ctx.now) save.quests = questState(save, ctx.now); } catch (e) { /* a megbízások sosem akaszthatják meg a játékot */ }
    const r = run0(save, action, args, ctx);
    try { albumNote(save); } catch (e) { /* az album sosem akaszthatja meg a játékot */ }
    try { G.unlockLooks(save.hero); G.unlockCosmetics(save, ctx && ctx.now); } catch (e) { /* a kinézet-gyűjtemény sem */ }
    return r;
  };

  G.extra = {
    weekKey: weekKey, day: day, giftState: giftState, giftPreview: giftPreview, GIFT: GIFT, SHOP_PRICE: SHOP_PRICE, SHOP_REROLLS: SHOP_REROLLS, shopRerollCost: shopRerollCost,
    questState: questState, questReward: questReward, questLm: questLm, questText: questText, QUEST_TYPES: QUEST_TYPES, QUEST_SLOTS: QUEST_SLOTS,
    storyState: storyState, storyBoss: storyBoss, storyReward: storyReward, storyChapters: storyChapters, STORY_TRIES: STORY_TRIES,
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
  return rows.map(r => { const h = r.save.hero; return { slot: r.slot, name: h.name, classId: h.classId, people: h.people, level: h.level, rig: G.wornLook(h), look: h.look || null, path: h.path }; });
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
    save.album = save.album || { mon: {}, items: {} }; save.album.seen = save.album.seen || {}; save.album.seen[b.name] = 1; // a bestiáriumba
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
    if (h) { const x = h.save.hero; hero = { name: x.name, classId: x.classId, people: x.people, level: x.level, xp: x.xp, silver: x.silver, dust: x.dust, rig: G.wornLook(x), look: x.look || null,
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
  // ---- bármelyik hős (a játszott vagy egy pihenő) részletes kezelése ----
  // hslot: 0 = a most játszott hős, 1–2 = pihenő hős. Minden módosítás a hős mentésén történik, zárolva.
  const withHero = async (fn) => {
    const uid = await uidOf(), hs = Number(args.hslot) | 0;
    return sql.begin(async tx => {
      let save;
      if (hs === 0) save = await loadHero(tx, uid, true);
      else { const [r] = await tx`select save from hero_slots where user_id = ${uid} and slot = ${hs} for update`; save = r && r.save; }
      if (!save) throw new GameError('arg', 'Ezen a helyen nincs hős.');
      const now = Date.now(), out = fn(save, save.hero, now) || {};
      if (hs === 0) await storeHero(tx, uid, save);
      else { const sm = G.summary(save); await tx`update hero_slots set save = ${tx.json(save)}, name = ${save.hero.name}, level = ${sm.level}, xp = ${sm.xp}, power = ${sm.power}, mythics = ${sm.mythics}, legendaries = ${sm.legendaries} where user_id = ${uid} and slot = ${hs}`; }
      return { uid: uid, out: out, hero: save.hero.name };
    });
  };
  const num = (v, lo, hi) => { const n = Math.round(Number(v) || 0); if (n < lo || n > hi) throw new GameError('arg', 'Túl nagy érték.'); return n; };
  if (args.op === 'heroData') { // egy hős teljes adatai (táska és felszerelés is) az admin felülethez
    const r = await withHero((save, h, now) => { E.torchState(save, now); return { hero: { name: h.name, classId: h.classId, people: h.people, level: h.level, xp: h.xp, xpNeed: E.xpNeeded(h.level), silver: h.silver, dust: h.dust, rig: h.rig || null, look: h.look || null, path: h.path,
      torches: save.torches.count, rested: save.torches.rested, arena: save.arena ? save.arena.rating : 1000, towerBest: (save.tower && save.tower.best) || 0, equipped: h.equipped, inventory: h.inventory, stats: h.stats || {}, power: E.power(E.heroStats(h)) } }; });
    return r.out;
  }
  if (args.op === 'resources') { // erőforrások hozzáadása vagy levonása (negatív szám levon)
    const d = { silver: num(args.silver, -1e7, 1e7), dust: num(args.dust, -1e6, 1e6), torches: num(args.torches, -50, 50), rested: num(args.rested, -50, 50), xp: num(args.xp, -1e7, 1e7) }, note = String(args.note || '').slice(0, 200);
    const r = await withHero((save, h, now) => {
      E.torchState(save, now);
      h.silver = Math.max(0, h.silver + d.silver); h.dust = Math.max(0, h.dust + d.dust);
      save.torches.count = Math.max(0, Math.min(E.TORCH.max, save.torches.count + d.torches)); save.torches.rested = Math.max(0, Math.min(E.TORCH.restedMax, save.torches.rested + d.rested));
      let ups = [];
      if (d.xp > 0) ups = E.addXp(h, d.xp); else if (d.xp < 0) h.xp = Math.max(0, h.xp + d.xp);
      const parts = [d.silver && `${d.silver > 0 ? '+' : ''}${d.silver} Holdezüst`, d.dust && `${d.dust > 0 ? '+' : ''}${d.dust} Csillagpor`, d.torches && `${d.torches > 0 ? '+' : ''}${d.torches} fáklya`, d.rested && `${d.rested > 0 ? '+' : ''}${d.rested} Frissesség`, d.xp && `${d.xp > 0 ? '+' : ''}${d.xp} TP`].filter(Boolean);
      if (parts.length) G.personal(save, now, `Az adminoktól: ${parts.join(', ')}${note ? ` – ${G.esc(note)}` : ''}.`, 'loot');
      save.offers = null; G.refreshOffers(save);
      return { levelUps: ups.length };
    });
    await alog(r.uid, 'resources', Object.assign({ hero: r.hero, note: note }, d));
    return r.out;
  }
  if (args.op === 'itemCreate') { // bármilyen tárgy: ritkaság, hely, szint, név, tulajdonságok, fejlesztés, mitikus
    const it0 = args.item || {};
    if (!D.RARITIES[it0.rarity]) throw new GameError('arg', 'Ismeretlen ritkaság.');
    const slot = D.SLOTS[it0.slot] ? it0.slot : null, lvl = num(it0.level || 1, 1, 99), plus = num(it0.plus || 0, 0, 12);
    const name = String(it0.name || '').trim().slice(0, 40), line = String(it0.line || '').trim().slice(0, 120);
    const ids = D.AFFIXES.map(a => a.id), affixes = Array.isArray(it0.affixes) ? it0.affixes.filter(a => a && ids.indexOf(a.id) >= 0).slice(0, 4).map(a => ({ id: a.id, v: num(a.v, 1, 100) })) : null;
    const r = await withHero((save, h, now) => {
      const it = E.makeItem(E.mulberry32(E.newSeed()), { rarity: it0.rarity, slot: slot || undefined, level: lvl, classId: h.classId, hero: h, name: name || undefined, line: line || undefined, mythic: !!it0.mythic });
      if (affixes) { const seen = {}; it.affixes = affixes.filter(a => !seen[a.id] && (seen[a.id] = 1)); }
      if (plus) { it.plus = plus; it.spent = 0; }
      const res = E.addItem(save, h, it, now);
      G.personal(save, now, `Az adminoktól kaptál egy tárgyat: <span class="r-${it.rarity}">${G.esc(it.name)}</span>.`, 'loot');
      return { item: it.name, full: !!(res && res.full) };
    });
    if (r.out.full) throw new GameError('state', 'A hős táskája tele van, a tárgy nem fért el (szét lett szedve). Előbb szabadíts fel helyet.');
    await alog(r.uid, 'itemCreate', { hero: r.hero, item: r.out.item, rarity: it0.rarity, level: lvl, plus: plus });
    return r.out;
  }
  if (args.op === 'itemEdit' || args.op === 'itemRemove') {
    const id = String(args.itemId || '');
    const r = await withHero((save, h) => {
      let it = null, where = null;
      D.SLOT_ORDER.forEach(k => { if (h.equipped[k] && h.equipped[k].id === id) { it = h.equipped[k]; where = k; } });
      if (!it) { const i = h.inventory.findIndex(x => x.id === id); if (i >= 0) { it = h.inventory[i]; where = i; } }
      if (!it) throw new GameError('arg', 'Nincs ilyen tárgy.');
      if (args.op === 'itemRemove') { if (typeof where === 'string') delete h.equipped[where]; else h.inventory.splice(where, 1); return { removed: it.name }; }
      if (args.plus != null) it.plus = num(args.plus, 0, 12);
      if (args.name) it.name = String(args.name).trim().slice(0, 40);
      if (args.level != null) it.level = num(args.level, 1, 99);
      return { edited: it.name };
    });
    await alog(r.uid, args.op, Object.assign({ hero: r.hero }, r.out));
    return r.out;
  }
  if (args.op === 'heroSet') { // szint, ösvény, aréna-pontszám, torony-legjobb
    const r = await withHero((save, h, now) => {
      const ch = {};
      if (args.level != null) { const L = num(args.level, 1, E.MAX_LEVEL || 99); h.level = L; h.xp = 0; const un = E.unlockedSkills(h).slice(1); h.loadout = h.loadout.filter(x => un.indexOf(x) >= 0).concat(un.filter(x => h.loadout.indexOf(x) < 0)); ch.level = L; }
      if (args.path !== undefined) { const p = args.path === null || args.path === '' ? null : num(args.path, 0, 2); if (p != null && h.level < D.PATH_LEVEL) throw new GameError('arg', `Ösvény a ${D.PATH_LEVEL}. szinttől adható.`); h.path = p; ch.path = p; }
      if (args.arena != null) { const a = X.arenaState(save, now); a.rating = num(args.arena, 0, 5000); save.arena = a; ch.arena = a.rating; }
      if (args.towerBest != null) { const t = X.towerState(save, now); t.best = num(args.towerBest, 0, 500); save.tower = t; h.stats = h.stats || {}; h.stats.towerMax = Math.max(h.stats.towerMax || 0, t.best); ch.towerBest = t.best; }
      save.offers = null; G.refreshOffers(save);
      return ch;
    });
    await alog(r.uid, 'heroSet', Object.assign({ hero: r.hero }, r.out));
    return r.out;
  }
  if (args.op === 'resetDaily') { // napi keretek visszaállítása (újra mehet)
    const what = Array.isArray(args.what) ? args.what : [];
    const r = await withHero((save, h, now) => {
      const today = X.day(now), done = [];
      if (what.indexOf('gift') >= 0 && save.gift) { save.gift.day = new Date(Date.parse(today + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10); done.push('ajándék'); }
      if (what.indexOf('arena') >= 0) { const a = X.arenaState(save, now); a.fights = 0; a.rerolls = 0; save.arena = a; done.push('aréna'); }
      if (what.indexOf('team') >= 0) { const t = X.teamState(save, now); t.runs = 0; save.team = t; done.push('csapat'); }
      if (what.indexOf('tower') >= 0) { const t = X.towerState(save, now); t.tries = 0; save.tower = t; done.push('torony'); }
      if (what.indexOf('event') >= 0 && save.event) { save.event.tries = 0; done.push('esemény'); }
      if (what.indexOf('patrol') >= 0) { save.patrolDay = null; save.patrol = null; done.push('őrjárat'); }
      if (what.indexOf('shop') >= 0) { save.shop = null; done.push('vándorkereskedő'); }
      if (what.indexOf('expedition') >= 0) { save.expedition = null; save.pendingResult = null; save.offers = null; G.refreshOffers(save); done.push('félbehagyott kaland'); }
      return { done: done };
    });
    await alog(r.uid, 'resetDaily', { hero: r.hero, what: r.out.done });
    return r.out;
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
const LOGGED = ['start', 'fight', 'choose', 'retreat', 'upgrade', 'reroll', 'patrolStart', 'patrolClaim', 'equip', 'equipIds', 'salvageWeak'];

// ---------- Aréna, csapat, céh ----------
const X = G.extra;
const GUILD_MAX = 20, GUILD_COST = 1000;
const GUILD_GOALS = [{ w: 50, silver: 3, dust: 40 }, { w: 150, silver: 6, dust: 80 }, { w: 350, silver: 10, dust: 150 }]; // heti közös győzelmek; jutalom: × alap-Holdezüst, Csillagpor
const GUILD_EMBLEMS = ['hold', 'csillag', 'kard', 'pajzs', 'farkas', 'fa', 'korona', 'lang'];
const WIN_ACTIONS = ['fight', 'arenaFight', 'teamFight', 'eventFight', 'storyFight']; // a torony emeletei nem számítanak (túl sok, túl könnyű „győzelem”)
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
    const members = await sql`select h.name, h.class_id, h.level, h.save->'hero' as hx, h.save->'hero'->'look' as look, m.role, m.user_id,
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
      members: members.map(m => ({ name: m.name, classId: m.class_id, level: m.level, rig: G.wornLook(m.hx), look: m.look, role: m.role, wins: m.wins, me: m.user_id === user.id, uid: m.user_id })),
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

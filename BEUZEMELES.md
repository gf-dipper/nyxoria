# Nyxoria RPG – beüzemelés lépésről lépésre

Ezzel a leírással a játék felkerül az internetre: Discorddal lehet belépni, és mindenki ugyanazon a közös szerveren játszik. Minden ingyenes, bankkártya nem kell. Kb. 45–60 perc, és kódot írni nem kell, csak másolni és beilleszteni.

**Mire lesz szükség:**

- egy GitHub- vagy Google-fiók (ezzel lehet belépni a Supabase-be);
- a Discord-fiókod, amivel a Nyxoria szerveren vagy;
- a gépeden a **Nyxoria RPG → jatek** mappa.

**A lépések sorrendje számít**, mert az egyik lépésben kapott címet a következőben kell beírni:

1. Supabase-projekt: az adatbázis és a szerver.
2. Az adatbázis táblái.
3. A szerverfüggvény.
4. A játék feltöltése a webre.
5. Discord-alkalmazás a belépéshez.
6. A Discord-belépés bekapcsolása.
7. A titkos beállítások.
8. Próba.

Írd fel egy jegyzetbe az alábbi értékeket, mert többször kellenek:

| Mi ez | Honnan jön | Példa |
| --- | --- | --- |
| Project URL | 1. lépés | `https://abcdefghijkl.supabase.co` |
| Publishable key | 1. lépés | `sb_publishable_...` |
| A játék webcíme | 4. lépés | `https://nyxoria.pages.dev` |
| Discord Client ID és Secret | 5. lépés | számok és betűk |

## 1. Supabase-projekt létrehozása

1. Nyisd meg a [supabase.com](https://supabase.com) oldalt, kattints a **Start your project** gombra, és lépj be GitHubbal vagy Google-lel.
2. Kattints a **New project** gombra:
   - **Name:** `nyxoria`
   - **Database Password:** kattints a **Generate a password** gombra. Ezt nem kell megjegyezned, a játék nem használja.
   - **Region:** `Central EU (Frankfurt)`. Ez van hozzánk a legközelebb.
3. Kattints a **Create new project** gombra, és várj 1–2 percet, amíg elkészül.
4. Bal oldalt menj a **Project Settings** (fogaskerék) → **API Keys** oldalra. Másold ki ezeket:
   - a **Project URL**-t (ha itt nem látod, a **Data API** oldalon van);
   - a **Publishable key**-t. Ha csak „anon public” kulcsot látsz, az is jó.

> **Fontos:** a **secret** vagy **service_role** kulcsot soha ne másold sehova. A publishable kulcs nem titkos, az nyugodtan kerülhet a játékba.

## 2. Az adatbázis táblái

1. Bal oldalt kattints az **SQL Editor** menüre.
2. Nyisd meg a gépeden a `jatek/server/schema.sql` fájlt Jegyzettömbbel, jelölj ki mindent (Ctrl+A), és másold ki (Ctrl+C).
3. Illeszd be az SQL Editorba, és kattints a **Run** gombra.
4. Akkor jó, ha alul ez jelenik meg: „Success. No rows returned”.

A **Table Editor** menüben most 7 táblát látsz: `players`, `heroes`, `chronicle`, `world_bosses`, `boss_participants`, `world_state` és `action_log`.

## 3. A szerverfüggvény

Ez a játék „agya”: ez dönt a harcokról, a zsákmányról és a bossról, így senki nem tud csalni.

1. Bal oldalt kattints az **Edge Functions** menüre, majd a **Deploy a new function** → **Via Editor** gombra.
2. A függvény neve legyen pontosan: `nyx`
3. Az editorban töröld ki a mintakódot.
4. Nyisd meg a gépeden a `jatek/server/functions/nyx/index.ts` fájlt Jegyzettömbbel, másold ki az egészet, és illeszd be az editorba.
5. Kattints a **Deploy function** gombra, és várd meg, amíg kész lesz.
6. Ugyanitt menj a függvény **Details** vagy **Settings** fülére, és **kapcsold ki** az **Enforce JWT verification** (vagy „Verify JWT”) kapcsolót, majd mentsd el.
   - Ez nem gyengíti a védelmet: a függvény maga ellenőrzi a belépést, csak így az új Supabase-kulcsokkal is működik.

## 4. A játék feltöltése a webre (Cloudflare Pages)

1. Nyisd meg a gépeden a `jatek/js/config.js` fájlt Jegyzettömbbel, és írd be a két értéket az idézőjelek közé:

   ```js
   supabaseUrl: 'https://abcdefghijkl.supabase.co',
   supabaseKey: 'sb_publishable_...',
   ```

   Mentsd el (Ctrl+S).
2. Nyisd meg a [dash.cloudflare.com](https://dash.cloudflare.com) oldalt, és regisztrálj ingyen.
3. Bal oldalt menj ide: **Compute (Workers)** → **Workers & Pages** → **Create** → **Pages** → **Upload assets** (vagy „Drag and drop your files”).
4. **Project name:** `nyxoria`. Ebből lesz a cím, pl. `https://nyxoria.pages.dev`. Ha foglalt, válassz mást, pl. `nyxoria-rpg`.
5. Húzd rá a **jatek** mappát, és kattints a **Deploy site** gombra.
6. Írd fel a kapott webcímet.

> **Ha később frissítést kapsz tőlem:** Workers & Pages → nyxoria → **Create deployment**, és húzd rá újra a mappát. A `config.js`-ben a beírt értékeid maradjanak meg.

## 5. Discord-alkalmazás a belépéshez

1. Nyisd meg a [discord.com/developers/applications](https://discord.com/developers/applications) oldalt, és lépj be.
2. Kattints a **New Application** gombra. Név: `Nyxoria RPG`. Fogadd el a feltételeket, és kattints a **Create** gombra.
3. Itt be is állíthatsz egy ikont. Ez jelenik meg a belépéskor.
4. Bal oldalt kattints az **OAuth2** menüre:
   - Másold ki a **Client ID**-t.
   - A **Client Secret** alatt kattints a **Reset Secret** gombra, és másold ki a titkos kulcsot. Ezt csak egyszer mutatja meg!
5. Ugyanitt a **Redirects** résznél kattints az **Add Redirect** gombra, és írd be ezt (a saját Project URL-eddel):
   `https://abcdefghijkl.supabase.co/auth/v1/callback`
6. Kattints a **Save Changes** gombra.

## 6. A Discord-belépés bekapcsolása a Supabase-ben

1. A Supabase-ben bal oldalt menj ide: **Authentication** → **Sign In / Providers** (régebben „Providers”).
2. Keresd meg a **Discord**-ot, és kapcsold be. Ide írd be:
   - a **Client ID**-t;
   - a **Client Secret**-et.

   Kattints a **Save** gombra.
3. Menj ide: **Authentication** → **URL Configuration**.
   - **Site URL:** a játék webcíme, pl. `https://nyxoria.pages.dev`
   - A **Redirect URLs** listához kattints az **Add URL** gombra, és írd be a webcímet `/**` végződéssel, pl. `https://nyxoria.pages.dev/**`. A végén a két csillag azt jelenti, hogy a cím bármelyik oldaláról vissza lehet térni.
   - Mentsd el.

## 7. A titkos beállítások

A Supabase-ben menj ide: **Edge Functions** → **Secrets** (vagy „Manage secrets”), és add hozzá ezeket egyenként:

| Név | Érték | Honnan |
| --- | --- | --- |
| `NYXORIA_GUILD_ID` | a Nyxoria szerver azonosítója | Discord → Beállítások → Speciális → kapcsold be a **Fejlesztői módot** → jobb klikk a Nyxoria szerver ikonjára → **Szerverazonosító másolása** |
| `ADMIN_DISCORD_IDS` | a saját Discord-azonosítód (többet vesszővel) | jobb klikk a saját nevedre → **Felhasználói azonosító másolása** |
| `ALLOWED_ORIGIN` | a játék webcíme, pl. `https://nyxoria.pages.dev` | 4. lépés |
| `DISCORD_WEBHOOK_URL` | nem kötelező: a krónika-csatorna webhookja | Discord → a csatorna beállításai → **Integrációk** → **Webhookok** → **Új webhook** → **Webhook URL másolása** |

A webhook-csatornába a játék bejelenti például a mitikus találatokat, a +10-es tárgyakat, a 30., 40. és 50. szintet, valamint a heti boss érkezését és legyőzését.

> **Ha a `NYXORIA_GUILD_ID` hiányzik**, bárki beléphet, akinek van Discord-fiókja. A zárt teszthez mindenképp add meg.

## 8. Próba

1. Nyisd meg a játék webcímét, és kattints a **Belépés Discorddal** gombra.
2. A Discord megkérdezi, engedélyezed-e a hozzáférést. A játék a neved, a profilképed és a szervereid listáját kéri, mást nem lát.
3. Ha a Nyxoria tagja vagy, jön a karakterkészítő. Hozz létre egy hőst, és indulj el egy expedícióra.
4. A **Boss** fülön látod a heti világbosst. A **Beállítások** (jobb felső kör) alján megjelenik az **Admin** rész, mert a te azonosítód benne van az `ADMIN_DISCORD_IDS`-ben.

**Ha valami nem megy:**

| Mit látsz | Mit nézz meg |
| --- | --- |
| A belépés után visszadob a belépő oldalra | 6. lépés: a Site URL és a Redirect URLs pontosan a játék webcíme legyen, `https://`-sel |
| „redirect_uri” hiba a Discordon | 5. lépés: a Redirect a Supabase-es `/auth/v1/callback` cím legyen |
| „Nem érem el a szervert” | 3. lépés: `nyx` a függvény neve? Ki van kapcsolva a JWT-ellenőrzés? A `config.js`-ben jó a cím? |
| „Nem vagy tagja a Nyxoria szervernek”, pedig az vagy | 7. lépés: a `NYXORIA_GUILD_ID` a szerver azonosítója legyen, ne egy csatornáé |
| Bármi más | Supabase → Edge Functions → nyx → **Logs**. Másold ki nekem a piros sorokat. |

## Jó tudni

- **Ingyenes keretek:**
  - A Supabase ingyenes csomagja bőven elég egy Discord-közösségnek: 500 MB adatbázis és havi 500 000 függvényhívás.
  - Az ingyenes projektet a Supabase 7 nap teljes inaktivitás után szünetelteti. Ha játszanak vele, ez nem történik meg. Ha mégis, a Supabase-ben egy kattintással újraindítható.
- **A játék frissítése:**
  - Ha a játéklogika változik, két dolgot kell lecserélni: a `server/functions/nyx/index.ts` tartalmát (3. lépés, csak a beillesztés és a Deploy) és a feltöltött mappát (4. lépés).
  - **Ha az adatbázis is bővült** (például a céhek érkezésével): a `server/schema.sql` egészét futtasd le újra a Supabase SQL Editorában (2. lépés). Bátran futtathatod többször is: a meglévő táblákat és adatokat nem bántja, csak a hiányzókat hozza létre. Ezt a szerverfüggvény frissítése **előtt** tedd.
  - **A sorrend számít: mindig előbb a szerverfüggvényt frissítsd, és csak utána a játékot.** Az új játék olyan adatot is küld (például a hős új kinézetét), amit a régi szerver még nem ismer, és ilyenkor elveszne.
  - A hősök és a mentések megmaradnak. A régi hősök kinézete magától átalakul az új grafikára, és a játékosok a Hős → **Kinézet átszabása** gombbal bármikor átszabhatják.
  - A böngészők a régi fájlokat néha emlékezetből töltik be. Ezért az `index.html` minden fájl mögé egy verziószámot ír (`?v=...`), amit frissítéskor én átírok, így mindenki az újat kapja.
- **Gyakorló mód:** ha a `config.js` üres, a játék helyben fut, belépés nélkül. Ez fejlesztéshez és kipróbáláshoz jó, de az itt létrehozott hős nem kerül át a közös szerverre.

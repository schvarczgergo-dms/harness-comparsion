# Harness-összehasonlítás (HF2)

> Robot Dreams / LABA — AI-ágensfejlesztés az alapoktól · 5. óra: Az agent kilép a terminálból

Ugyanazt a kis backend projektet építjük meg **kétszer, két különböző agentic harness-szel, két külön branchen**, majd összevetjük, melyikkel milyen volt dolgozni. A cél nem a sebesség, hanem hogy megérezzük, melyik eszköz mire való — és ezt indokolni is tudjuk.

## A feladat

- A projektet kétszer kell megépíteni, külön branchen (ne ugyanabban a branchben szülessen a két megoldás).
- Alapból: az egyik branch **Superpowers**-szel, a másik **BMAD-METHOD**-dal készül.
- Választható csere: az egyik harness lecserélhető egy általad hozott harmadikra — a dolgozatban indokold, mit és miért.
- Mindkét branchen ugyanaz a feladat fut le, ugyanezekkel a követelményekkel.

Harness-ek:

- Superpowers — [github.com/obra/superpowers](https://github.com/obra/superpowers)
- BMAD-METHOD — [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)

Telepítés és használat az adott repo README-je szerint.

## A megépítendő projekt (brief)

Kicsi, önálló **REST szolgáltatás Postgres fölött**, seedelt ügyféladattal és két GET végponttal. A csavar: betöltéskor minden ügyfélhez a településéből `lat/lon` készül, és az egyik végpont **Budapesthez viszonyított távolság** szerint rendezi az ügyfeleket.

**Benne van:** adatmodell + migráció, idempotens seed geokódolással, 2 GET végpont, unit teszt a távolságszámításra.

**Nincs benne:** auth, write végpontok (a seeden túl), frontend, külső geokódoló API, LLM.

> A szolgáltatásnak **offline** kell futnia: nincs külső geokódoló API, nincs LLM-hívás futásidőben.

## Specifikáció

### Adat

A seed adat a repóban lévő `seed-customers.json` fájlban van (15 ügyfél: `name`, `budget`, `location.city`, `location.countryCode`, `note`). A `location.city` a település.

### Adatmodell (minimum)

`customers`: `id`, `name`, `telepules`, `lat` (nullable), `lon` (nullable). A `budget` és a `note` eltárolható, de nem kötelező.

### Betöltés (idempotens seed + geokódolás)

- Töltsd be a `seed-customers.json`-t. Kétszer lefuttatva ne duplázzon (idempotens legyen).
- Minden ügyfél településéhez rendelj `lat/lon`-t egy lokális, a repóba bundle-olt `telepules -> lat/lon` referenciából. A referenciát a seedben előforduló városokra állítod elő, ismert koordinátákkal. **Nincs külső hívás.**
- A település-egyeztetés robusztus: ékezet- és kis/nagybetű-független, trimmelt whitespace. A „Budapest" (és opcionálisan a kerületei) a fővárosra esik.
- Ha egy település nincs a referenciában: `lat/lon = null`. Ez nem hiba, ne crasheljen — logold, és menj tovább.

### Végpontok

- `GET /customers/count` → `{ "count": <egesz> }` (a tényleges sorszámmal egyezik).
- `GET /customers/by-distance` → ügyféllista **növekvő** távolság szerint Budapesthez képest.
  - Minden elem tartalmazza a `distanceKm` mezőt (1 tizedesre kerekítve).
  - Budapesti ügyfelek elöl (`0` km).
  - Ismeretlen koordinátájú ügyfelek a lista végén, `distanceKm: null`.
  - Holtverseny esetén `name` szerint.

### Teszt

Unit teszt a távolságszámításra (haversine):

- egy ismert táv (pl. Budapest–Bécs kb. 214 km),
- a 0 km-es eset (Budapest),
- a null-koordináta kezelése.

### Minőség

- Kis, fókuszált commitok, hogy a folyamat is látszódjon.
- README a futtatáshoz: Postgres indítás, migráció, seed, szerver, tesztek.
- Kösd be a Postgres MCP-t, hogy fejlesztés közben lásd a sémát és az adatot.

## Futtatás

> Az itteni lépések kitöltése az adott branch (harness) megvalósításától függ. Tölts ki minden lépést a konkrét parancsokkal.

```bash
# 1. Postgres indítása
# 2. Migráció
# 3. Seed betöltése (idempotens)
# 4. Szerver indítása
# 5. Tesztek futtatása
```

## Leadandó

1. **Két branch** a repóban, felcommitolva, hogy a folyamat is látszódjon (a commit history is számít). Javasolt elnevezés: `harness/superpowers`, `harness/bmad` (vagy `harness/<sajat-eszkoz>`).
2. **Rövid dolgozat** (`dolgozat.md`, kb. fél-1 oldal): melyik eszközzel milyen volt a munka, melyiket használnád hosszú távon, pro-kontra. Térjen ki (legalább) ezekre:
   - **Setup és tanulási görbe:** mennyi idő volt beüzemelni, mennyire volt átlátható.
   - **Steering:** mennyit kellett terelni/javítani manuálisan, hány iteráció.
   - **Tervezési fázis:** volt-e értelmes terv a kód előtt, mennyire tartotta magát hozzá.
   - **Kód minősége:** elsőre működött-e, írt-e magától tesztet, kezelte-e az edge case-eket (ismeretlen település, null-koordináta).
   - **Kontroll:** mennyire kellett kézzel átvenni az irányítást.
   - **Összegzés:** hosszú távú fejlesztésre melyiket választanád, és miért.

## Beadás

GitHub repo link (triage-meghívás: `github.com/sajtosistvan`), plusz ZIP export az LMS-be. A repo tartalmazza a két branchet, a működő projektet és a dolgozatot.

**Melléklet:** `seed-customers.json` (a seed ügyféladat).

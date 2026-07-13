# Dolgozat – Superpowers vs. BMAD-METHOD

Ugyanazt a feladatot (offline REST-szolgáltatás Postgres fölött: ügyfélszám és
Budapesttől mért távolság szerinti rendezés, idempotens seed + geokódolás) két
ágon, két eszközzel építettem fel: `harness/superpowers` és `harness/bmad`. A tech
stack szándékosan azonos (Node.js + TypeScript, Express, node-postgres, Vitest,
Docker/Postgres 16), hogy a folyamat, ne a technológia legyen összemérve.

## Setup és tanulási görbe
- **Superpowers:** natív **Cursor-plugin**, azaz pont abba az eszközbe illeszkedik,
  amit nálunk alapból használunk. A beüzemelés körülményesebb volt (kézzel a
  `~/.cursor/plugins`-ba klónozni, a registry nem ismerte fel automatikusan,
  Cursor-újraindítás / `/add-plugin` kellett), de utána a metodológia a Cursoron
  belül, a `SKILL.md` fájlokból követhető – „csináld magad" aktiválás, viszont teljes
  Cursor-integráció.
- **BMAD:** `npx bmad-method install`, nem-interaktív módban is lement, és sok
  strukturált fájlt generált (`_bmad`, `.agents`, `.claude`, 46 skill + config) több
  szerkesztőre egyszerre (cursor + claude-code). A telepítés gördülékenyebb, de
  editor-agnosztikusabb és inkább dokumentum-/CLI-vezérelt, nem Cursor-specifikus.
  Windows alatt a `uv`-szkriptek cp1250 kódolási hibát dobtak emojik miatt – ezt
  `PYTHONUTF8=1`-gyel kellett kézzel megkerülni.

## Steering (mennyit kellett terelni)
- **Superpowers:** két érdemi gate (design spec, majd a részletes terv jóváhagyása),
  utána subagentek dolgoztak, a review lépés magától elkapta a hibákat. Kevés
  kézi terelés a kódban; a fő manuális beavatkozás maga a plugin-aktiválás volt.
- **BMAD:** több fázishatár, de a folyamat végig fegyelmezett és önjáró. Egyetlen
  valódi „terelés" a stack megerősítése volt (a workflow felajánlotta a döntést). A
  kézi beavatkozás inkább környezeti (kódolás, docker-port), nem tartalmi.

## Tervezési fázis
- **Superpowers:** egy tömör design + egy nagyon konkrét, kódközeli TDD-terv (taskok
  verbatim kóddal és parancsokkal). A terv erősen vezette a végrehajtást, és tartotta
  is magát hozzá.
- **BMAD:** rétegzett, szerep-alapú dokumentumlánc: brief → PRD (számozott FR-ek) →
  architecture spine (AD-invariánsok, gépi `lint`-tel) → epics/stories → readiness →
  sprint-status. Sokkal több „ceremónia", de kiváló a nyomonkövethetőség
  (FR → story → architektúra-döntés). Egy ilyen kis feladatra kissé túlméretezett,
  viszont skálázódásra és csapatmunkára látványosan jobban felkészít.

## Kód minősége
- Mindkét eszköz **magától TDD-zett** (red-green-refactor), és magától kezelte az
  edge case-eket: ismeretlen település → `null` (nem hibázik, logol), null-koordináta,
  Budapest-kerületek a fővárosra, ékezet-/kisbetű-független illesztés.
- **Superpowers:** a review-lépés elkapott egy valós hibát – a `key in obj` az
  öröklött prototípus-kulcsokra (`toString`) is illeszkedett; `Object.hasOwn`-nal
  javította és regressziós tesztet írt rá.
- **BMAD:** ezt a csapdát eleve `Object.hasOwn` + külön regressziós teszt zárta ki.
- Mindkét ág lényegében **elsőre működött**; a végállapot 23 zöld teszt, idempotens
  seed (kétszer futtatva 15 sor), és élőben ellenőrzött végpontok.

## Kontroll
- **Superpowers:** subagent-vezérelt, a fejlesztő a gate-eknél és a
  plugin-beüzemelésnél vette át kézzel az irányítást – egyébként autonóm.
- **BMAD:** több explicit döntési pontot ad a kezembe (fázisonként), és lényegében
  **architect szerepkörbe helyezi a felhasználót**: a PRD, az architektúra-invariánsok
  és a sztorik jóváhagyása az én felelősségem, az ágensek ezt hajtják végre. Erős
  kontroll, de több „vezetői" figyelmet és ceremóniát is igényel; a végrehajtás közben
  a kézi beavatkozás főleg a környezeti gikszereknél kellett.

## Összegzés
A saját kontextusunkban – **Cursor a fő fejlesztőeszköz** és **kis csapat** – hosszú
távra a **Superpowers**-t választanám. Egyrészt natív Cursor-plugin, tehát a
támogatottság és az integráció közvetlen; nem kell külön, editor-agnosztikus,
dokumentum-/CLI-vezérelt réteget fenntartani. Másrészt kis csapatnál a Superpowers
kódközeli, kevés ceremóniás, review-erős folyamata egyszerűen hatékonyabb: gyorsabb a
terv→kód út, kevesebb a fenntartandó melléktermék.

A **BMAD** ettől még értékes: erős a traceability-je (FR → story → AD-invariáns), a
szerep-szeparációja és a sprint-követése, viszont **inkább architect szerepkörbe
helyezi a felhasználót** – sok terv- és jóváhagyási ceremóniával. Ez nagyobb, több
emberes, spec-vezérelt projekteknél kifizetődik, a mi kis, Cursor-központú
csapatunknál viszont túl nehézkes a hozadékához képest. Röviden: **nálunk a
Superpowers a nyerő; a BMAD-ot inkább nagy, architect-nehéz projektekre tartogatnám.**

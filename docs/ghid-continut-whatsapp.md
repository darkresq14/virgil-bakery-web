# Ghid: unde apare WhatsApp în conținut (și unde se editează)

Comenzile se fac acum **doar pe site** — butonul din coș trimite comanda direct, iar
clientul ajunge pe pagina de mulțumire. WhatsApp rămâne doar pentru întrebări și
anunțuri (grup).

Acest ghid listează toate locurile din conținutul de producție care menționează
WhatsApp. Le editezi tu, din Payload (admin), fără ajutor tehnic.

---

## 1. „Politici & condiții” — confirmarea comenzii

- **Unde apare:** pagina „Cum Comanzi”, secțiunea „Politici & condiții”
- **Unde editezi:** Payload → Site Config → tab **General** → câmpul **Politici & condiții**
- **Textul curent:** „…lista pentru livrarea de marți se închide duminică la ora 17:00,
  iar pentru vineri miercuri la ora 17:00. **După ora aceea primești confirmarea pe WhatsApp.**”
- **Recomandare:** dacă mai confirmi pe WhatsApp, poți lăsa textul așa cum este. Dacă
  confirmi altfel (telefon, SMS), schimbă în „După ora aceea primești confirmarea.”
  Site-ul nu promite metoda de confirmare în locul tău.

## 2. „Politici & condiții” — pauze și concedii

- **Unde apare:** pagina „Cum Comanzi”, secțiunea „Politici & condiții”
- **Unde editezi:** Payload → Site Config → **General** → **Politici & condiții**
- **Textul curent:** „**Pauze și concedii:** scrie-mi pe WhatsApp de când până când.”
- **Recomandare:** OK să rămână — este un canal de întrebări, nu de comandat. Nu necesită schimbare.

## 3. „Politici & condiții” — last minute (grup)

- **Unde apare:** pagina „Cum Comanzi”, secțiunea „Politici & condiții”
- **Unde editezi:** Payload → Site Config → **General** → **Politici & condiții**
- **Textul curent:** „**Last minute:** după ce se închide lista, dacă îmi rămân pâini,
  pun în grupul de WhatsApp linkul cu ce mai am. Rezervi direct din pagină….”
- **Recomandare:** păstrează — descrie grupul de anunțuri, care rămâne activ.

## 4. „Metode de plată” — întrebări despre plată

- **Unde apare:** pagina „Cum Comanzi”, secțiunea „Metode de plată”
- **Unde editezi:** Payload → Site Config → **General** → **Metode de plată**
- **Textul curent:** „Ai întrebări despre plată? Scrie-mi pe WhatsApp.”
- **Recomandare:** OK să rămână — invită la întrebări, nu la comandat.

## 5. „Pași comandare” — pasul 3 (confirmarea)

- **Unde apare:** pagina „Cum Comanzi”, secțiunea „Pașii pentru a comanda”, pasul 3
- **Unde editezi:** Payload → Site Config → **General** → **Pași comandare** → pasul
  „Primești confirmarea”
- **Textul curent:** „După ora 17:00 îți confirm comanda pe WhatsApp.”
- **Recomandare:** la fel ca la pct. 1 — lasă textul dacă confirmi pe WhatsApp, altfel
  scoate „pe WhatsApp”.

## 6. Articol de blog — grupul de WhatsApp

- **Unde apare:** articolul „De ce am făcut o maia de la zero…”
  (`/posts/17-ani-de-maia`)
- **Unde editezi:** Payload → colecția **Posts** → articolul respectiv
- **Textul curent:** „Dacă vrei să guști, intri în grupul nostru de WhatsApp — link mai jos.”
- **Recomandare:** păstrează — promovează grupul de anunțuri.

## 7. Valori WhatsApp din Site Config

- **Unde apar:** butonul plutitor, linkul din subsol, CTA-ul „Întrebări? Scrie-ne” din
  meniul mobil, cardul „WhatsApp” de pe prima pagină, secțiunea de contact
- **Unde editezi:** Payload → Site Config → **General**:
  - **Număr WhatsApp** — `+40746245391` (folosit de butoanele de contact)
  - **URL grup WhatsApp** — linkul de join la grupul de anunțuri
  - **Teaser: WhatsApp** — textul cardului de pe prima pagină
- **Recomandare:** păstrează toate — sunt canale de întrebări/anunțuri, nu de comandat.

---

## Bonus: pagina de mulțumire (nouă)

După ce clientul trimite comanda, ajunge pe `/multumim`. Textele se editează din
Payload → Site Config → **General** → câmpurile **Mulțumire: Titlu** și
**Mulțumire: Mesaj**. Dacă le lași goale, se afișează un text implicit care
mulțumește pentru comandă fără să promită cum confirmi comanda.

## Verificat curat

- Pagina „Politica de Confidențialitate” nu menționează WhatsApp (verificat în
  producție la data acestui ghid) — nu necesită nicio editare.

---

*Audit realizat pe baza de date de producție. Listă generată odată cu implementarea
#45/#48 (`docs/` în repo).*

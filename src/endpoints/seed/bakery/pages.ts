import { textToLexical, heading, paragraph, richTextFromNodes } from './helpers'

export const privacyPolicyPage = {
  title: 'Politica de Confidențialitate',
  slug: 'politica-de-confidentialitate',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Politica de Confidențialitate',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: textToLexical(
            `Ultima actualizare: Mai 2026

Pâine cu Maia by Virgil ("noi", "nostru", sau "serviciul") respectă confidențialitatea utilizatorilor site-ului nostru painecumaya-byvirgil.ro ("site-ul"). Această politică de confidențialitate explică ce informații colectăm, cum le folosim și cum le protejăm.

Informații pe care le colectăm

Colectăm următoarele tipuri de informații:
— Numele și datele de contact (telefon, adresă de livrare) pe care le furnizați atunci când plasați o comandă prin WhatsApp
— Informații despre comenzile efectuate
— Date de utilizare a site-ului (cookie-uri anonime, date de trafic)

Cum folosim informațiile

Folosim informațiile colectate pentru:
— Procesarea și livrarea comenzilor
— Comunicarea cu clienții privind starea comenzilor
— Îmbunătățirea site-ului și a serviciilor noastre
— Trimite informații despre produse noi sau oferte speciale (doar cu acordul dumneavoastră)

Nu vindem, nu închiriem și nu partajăm informațiile personale ale clienților noștri cu terțe părți.

Comenzi prin WhatsApp

Comenzile sunt plasate prin WhatsApp. Informațiile pe care le trimiteți prin WhatsApp (nume, telefon, adresă, detalii comandă) sunt procesate de noi exclusiv în scopul livrării comenzii. WhatsApp aparține Meta Platforms, Inc. și este guvernat de politica de confidențialitate a Meta.

Cookie-uri

Site-ul nostru poate folosi cookie-uri pentru:
— Analiza traficului (Google Analytics sau servicii similare)
— Funcționarea corectă a site-ului

Puteți controla cookie-urile prin setările browserului dumneavoastră.

Drepturile dumneavoastră

Conform Regulamentului General privind Protecția Datelor (GDPR), aveți următoarele drepturi:
— Dreptul de a accesa datele personale pe care le deținem despre dumneavoastră
— Dreptul de a rectifica datele inexacte
— Dreptul la ștergerea datelor personale
— Dreptul de a vă retrage consimțământul în orice moment
— Dreptul de a depune o plângere la autoritatea de protecție a datelor

Contact

Pentru orice întrebări legate de confidențialitate, ne puteți contacta la:
— Email: bucsavirgil@yahoo.com
— Telefon: +40 746 245 391
— WhatsApp: +40 746 245 391`,
          ),
        },
      ],
    },
  ],
  _status: 'published',
}

export const maiauaMeaPage = {
  title: 'Maiaua Mea',
  slug: 'maiaua-mea',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h1',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Maiaua Mea',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richTextFromNodes([
            heading('Cine sunt eu?', 'h2'),
            paragraph(
              'Sunt Bucșa Virgil, inginer de profesie, căsătorit, tatăl a doi băieți, iar după 23 de ani de carieră în domeniul construcțiilor am simțit că pasiunea mea pentru painea cu maia sălbatică poate să stea la baza unei mici afaceri de familie.',
            ),
            heading('Care sunt principiile?', 'h2'),
            paragraph(
              'Onestitate, consecvență, pasiune și "fără niciun rabat de la calitate"!',
            ),
            heading('Cum a început totul?', 'h2'),
            paragraph(
              'Mereu am fost preocupat ca în alimentația familiei mele să existe produse de origine controlată, cât mai curate și mai apropiate de ceea ce consumau bunicii noștri odinioară. Plecând de la această preocupare, am dezvoltat o idee, o pasiune pentru pâinea autentică, cu maia sălbatică, iar acum, după 5 ani, pot să marturisesc că sunt un om împlinit. Fac ceea ce îmi place, sunt neobosit în a mă dezvolta și a-mi îmbunătății în permanență produsele iar oamenii ma creditează, cumpărând și recomandându-mă.',
            ),
            heading('Despre maiaua mea', 'h2'),
            paragraph(
              'Maiaua mea are 17 ani. Este o cultură sălbatică, făcută de la zero, fără drojdie adăugată — doar apă, făină și microorganismele care colonizează natural bobul de cereală. Am crescut-o și am hrănit-o zi de zi, iar acum este inima fiecărei pâini pe care o fac.',
            ),
            paragraph(
              'În 2024, un studiu european coordonat de ETH Zürich a analizat maiaua mea și a descoperit că este una dintre cele mai rare și stabile culturi din Europa — cu un profil microbian unic.',
            ),
          ]),
        },
      ],
    },
  ],
  _status: 'published',
}

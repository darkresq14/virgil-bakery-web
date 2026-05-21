import { textToLexical } from './helpers'

export const siteConfigData = {
  whatsappNumber: '+40746245391',
  contactEmail: 'bucsavirgil@yahoo.com',
  contactPhone: '+40746245391',
  facebookUrl: 'https://www.facebook.com/painecumaia',
  instagramUrl: 'https://www.instagram.com/painecumaia',
  deliveryInfo: textToLexical(
    'Livrare în Sibiu: marți și vineri\n\nLivrare națională prin curier',
  ),
  orderingProcess: textToLexical(
    'Cum se comandă:\n\n1. Adaugă produsele dorite în coș pe site\n2. Completează datele de livrare\n3. Trimite comanda prin WhatsApp\n4. Vei primi confirmarea și detaliile de livrare\n\nPlata se face la livrare (numerar) sau prin transfer bancar.',
  ),
}

export const homepageData = {
  heroHeading: 'Pâine cu Maia by Virgil',
  heroSubheading: 'Pâine artizanală, fermentată lent, coaptă pe vatră',
  aboutHeading: textToLexical(
    'Când totul se face cu multă **pasiune**, timpul parcă stă în loc, **natura** te ajută și totul se armonizează atât de **simplu** și **perfect**!',
  ),
  aboutDescription: textToLexical(
    'Sunt Bucșa Virgil, inginer de profesie, căsătorit, tatăl a doi băieți, iar după 23 de ani de carieră în domeniul construcțiilor am simțit că pasiunea mea pentru painea cu maia sălbatică poate să stea la baza unei mici afaceri de familie.\n\nOnestitate, consecvență, pasiune și "fără niciun rabat de la calitate"!\n\nMereu am fost preocupat ca în alimentația familiei mele să existe produse de origine controlată, cât mai curate și mai apropiate de ceea ce consumau bunicii noștri odinioară.',
  ),
  contactSection: {
    address: 'Sibiu, România',
    deliverySchedule: 'Marți și Vineri în Sibiu. Național prin curier.',
  },
}

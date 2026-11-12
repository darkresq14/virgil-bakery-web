import Link from 'next/link';

const FALLBACK_TITLE = 'Mulțumim pentru comandă!';
// No promise about HOW the baker confirms (phone, SMS, anything) — the baker
// stays free to confirm however he wants (see #45).
const FALLBACK_MESSAGE =
  'Comanda ta a fost înregistrată. Pâinile pleacă spre tine în ziua de livrare aleasă.';

interface ThankYouContentProps {
  /** SiteConfig `thankYouTitle`. Empty/whitespace → warm fallback. */
  title?: string | null;
  /** SiteConfig `thankYouMessage`. Empty/whitespace → warm fallback. */
  message?: string | null;
}

/** Presentational thank-you page body — rendered by /multumim/page.tsx. */
export function ThankYouContent({ title, message }: ThankYouContentProps) {
  const resolvedTitle = title?.trim() || FALLBACK_TITLE;
  const resolvedMessage = message?.trim() || FALLBACK_MESSAGE;

  return (
    <div className="py-20">
      <div className="container max-w-2xl text-center">
        <h1 className="text-3xl md:text-4xl font-heading mb-6">{resolvedTitle}</h1>
        <p className="text-lg text-muted-foreground font-sans leading-relaxed mb-10">
          {resolvedMessage}
        </p>
        <Link
          href="/produse"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 font-sans font-medium hover:bg-primary/90 transition-colors"
        >
          Înapoi la produse
        </Link>
      </div>
    </div>
  );
}

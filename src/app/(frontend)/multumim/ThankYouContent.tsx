import Link from 'next/link';

const FALLBACK_TITLE = 'Mulțumim pentru comandă!';
// No promise beyond registration — neither how the baker confirms (phone,
// SMS, anything) nor that every ordered item ships as ordered (see #45:
// "thanks only, no confirmation-method promise").
const FALLBACK_MESSAGE = 'Comanda ta a fost înregistrată. Mulțumim că ai ales pâinea noastră!';

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

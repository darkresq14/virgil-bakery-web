import type { NextConfig } from 'next';

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)',
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)',
  };

  return [
    internetExplorerRedirect,

    // Blog redirect
    { source: '/blog', destination: '/posts', permanent: true },
    { source: '/blog/:slug*', destination: '/posts/:slug*', permanent: true },
    { source: '/blog-vechi', destination: '/posts', permanent: true },

    // `/posts/page/1` is a duplicate of the `/posts` listing. The pagination
    // route's generateStaticParams starts at page 2, so page 1 is never
    // generated; this redirect collapses any inbound link or stale crawl to the
    // canonical listing. See ADR 0005.
    { source: '/posts/page/1', destination: '/posts', permanent: true },

    // Old WordPress page redirects
    { source: '/home', destination: '/', permanent: true },
    { source: '/acasa', destination: '/', permanent: true },
    {
      source: '/privacy-policy',
      destination: '/politica-de-confidentialitate',
      permanent: true,
    },
    { source: '/despre-mine', destination: '/maiaua-mea', permanent: true },
    { source: '/produsele-mele', destination: '/produse', permanent: true },
    { source: '/produsele-mele-2', destination: '/produse', permanent: true },
    { source: '/shop', destination: '/produse', permanent: true },
    { source: '/cart', destination: '/cos', permanent: true },
    { source: '/checkout', destination: '/cos', permanent: true },
    { source: '/my-account', destination: '/#contact', permanent: true },

    // Old WordPress product redirects
    {
      source: '/paine-cu-nuca',
      destination: '/produse/paine-cu-nuca',
      permanent: true,
    },
    {
      source: '/paine-mixta-cu-maia',
      destination: '/produse/paine-mixta',
      permanent: true,
    },
    {
      source: '/paine-mixta',
      destination: '/produse/paine-mixta',
      permanent: true,
    },
    {
      source: '/paine-integrala-cu-maia',
      destination: '/produse/paine-integrala',
      permanent: true,
    },
    {
      source: '/paine-integrala',
      destination: '/produse/paine-integrala',
      permanent: true,
    },
    {
      source: '/paine-fara-gluten',
      destination: '/produse/paine-fara-gluten',
      permanent: true,
    },
    {
      source: '/paine-san-joaquin-cu-maia',
      destination: '/produse/paine-san-joaquin',
      permanent: true,
    },
    {
      source: '/paine-de-secara-cu-maia',
      destination: '/produse/paine-de-secara',
      permanent: true,
    },
    {
      source: '/chifle-cu-maia',
      destination: '/produse/chifle',
      permanent: true,
    },
    {
      source: '/bagheta-mixta-cu-piper',
      destination: '/produse/bagheta-mixta-cu-piper',
      permanent: true,
    },
    {
      source: '/bagheta-integrala-cu-piper',
      destination: '/produse/bagheta-integrala-cu-piper',
      permanent: true,
    },
    {
      source: '/bagheta-cu-unt',
      destination: '/produse/bagheta-cu-unt',
      permanent: true,
    },

    // Old WordPress blog post redirects
    {
      source:
        '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu',
      destination: '/posts/17-ani-de-maia',
      permanent: true,
    },
    {
      source:
        '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu-2',
      destination: '/posts/17-ani-de-maia',
      permanent: true,
    },
    {
      source: '/maia-de-17-ani-analizata-healthferm',
      destination: '/posts/17-ani-de-maia',
      permanent: true,
    },
    {
      source: '/despre-painea-cu-maia-repetitie-si-lucruri-care-nu-se-invata-din-retete',
      destination: '/posts/17-ani-de-maia',
      permanent: true,
    },

    // Old WordPress archive redirects
    { source: '/tag/:slug*', destination: '/posts', permanent: true },
    { source: '/category/:slug*', destination: '/posts', permanent: true },
    { source: '/author/:slug*', destination: '/', permanent: true },

    // Testimonials
    { source: '/testimonial/:path*', destination: '/', permanent: true },
  ];
};

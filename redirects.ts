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

    // Old WordPress page redirects
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
      source: '/paine-mixta-cu-maia',
      destination: '/produse/paine-mixta',
      permanent: true,
    },
    {
      source: '/paine-integrala-cu-maia',
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

    // Old WordPress blog post redirect
    {
      source:
        '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu',
      destination: '/posts/17-ani-de-maia',
      permanent: true,
    },

    // Testimonials
    { source: '/testimonial/:path*', destination: '/', permanent: true },
  ];
};

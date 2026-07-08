import { CreditCard, MessageCircle, Truck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import RichText from '@/components/RichText';
import { ScrollReveal } from '@/components/ScrollReveal';
import { getCachedGlobal } from '@/utilities/getGlobals';
import PageClient from './page.client';

export const metadata: Metadata = {
  title: 'Cum Comanzi | Pâine cu Maia by Virgil',
  description:
    'Ghid complet pentru a comanda pâine artizanală: pași simpli, livrare rapidă, plata cum vrei tu.',
};

export const revalidate = 86400;

export default async function CumComandPage() {
  const siteConfig = await getCachedGlobal('siteConfig', 1)();

  const {
    orderingSteps,
    deliveryCourier,
    deliveryPersonal,
    paymentMethods,
    whatsappGroupUrl,
    policies,
    whatsappNumber,
  } = siteConfig || {};

  return (
    <div>
      <PageClient />
      {/* 1. Hero Banner */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-secondary/60 via-secondary/30 to-transparent" />
        <div className="container text-center relative">
          <span className="inline-block text-sm font-sans uppercase tracking-[0.2em] text-primary/60 mb-4">
            Ghid de comandare
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Cum Comanzi</h1>
          <div className="w-16 h-0.5 bg-primary/30 mx-auto mb-6" />
          <p className="text-lg font-serif text-muted-foreground max-w-2xl mx-auto">
            Comanzi simplu și rapid. Urmează pașii de mai jos și primești pâine proaspătă direct la
            ușa ta.
          </p>
        </div>
      </section>

      {/* 2. Ordering Steps */}
      {orderingSteps && orderingSteps.length > 0 && (
        <ScrollReveal>
          <section className="py-20">
            <div className="container">
              <h2 className="text-3xl font-heading text-center mb-16">Pașii pentru a comanda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {orderingSteps.map((step: { title?: string; description?: string }, i: number) => (
                  <div
                    key={step.title ?? i}
                    className="flex flex-col items-center text-center bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Step number — uses font-sans (Inter) for reliable centering */}
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-sans font-bold mb-4 shadow-sm">
                      {i + 1}
                    </div>
                    <h3 className="font-heading text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground font-sans">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 3. Delivery Zones */}
      {(deliveryCourier || deliveryPersonal) && (
        <ScrollReveal>
          <section id="livrare" className="py-20 bg-secondary/30">
            <div className="container">
              <h2 className="text-3xl font-heading text-center mb-12">Livrare</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {deliveryCourier && (
                  <div className="bg-card rounded-xl p-6 shadow-sm border-l-4 border-primary hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-heading">Livrare prin curier</h3>
                    </div>
                    <RichText data={deliveryCourier} enableGutter={false} enableProse={true} />
                  </div>
                )}
                {deliveryPersonal && (
                  <div className="bg-card rounded-xl p-6 shadow-sm border-l-4 border-accent hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-heading">Livrare personală</h3>
                    </div>
                    <RichText data={deliveryPersonal} enableGutter={false} enableProse={true} />
                  </div>
                )}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 4. Payment Methods */}
      {paymentMethods && (
        <ScrollReveal>
          <section id="plata" className="py-20">
            <div className="container">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-heading">Metode de plată</h2>
                </div>
                <div className="bg-card rounded-xl p-6 shadow-sm border-l-4 border-primary/40 hover:shadow-md transition-shadow">
                  <RichText data={paymentMethods} enableGutter={false} enableProse={true} />
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 5. WhatsApp Group */}
      <ScrollReveal>
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-[#25D366]/5 via-[#25D366]/10 to-transparent" />
          <div className="container text-center relative">
            <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-[#25D366]" />
            </div>
            <h2 className="text-3xl font-heading mb-4">Grupul nostru de WhatsApp</h2>
            <p className="text-lg font-serif text-muted-foreground max-w-xl mx-auto mb-8">
              Alătură-te grupului pentru a primi noutăți, oferte și a comanda rapid.
            </p>
            {whatsappGroupUrl ? (
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Alătură-te grupului
              </a>
            ) : (
              <a
                href={`https://wa.me/${whatsappNumber?.replace(/[^0-9]/g, '') || '40746245391'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Scrie-ne pe WhatsApp
              </a>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* 6. Policies */}
      {policies && (
        <ScrollReveal>
          <section className="py-20">
            <div className="container">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-heading text-center mb-6">Politici & condiții</h2>
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <RichText data={policies} enableGutter={false} enableProse={true} />
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 7. Final CTA */}
      <ScrollReveal>
        <section className="py-20 bg-primary relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="container text-center relative">
            <h2 className="text-3xl md:text-4xl font-heading text-primary-foreground mb-3">
              Ești gata să comanzi?
            </h2>
            <p className="text-primary-foreground/70 font-serif mb-8 max-w-lg mx-auto">
              Alege din gama noastră de produse artizanale și bucură-te de pâine proaspătă, direct
              la tine acasă.
            </p>
            <Link
              href="/produse"
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-8 py-3 font-sans font-medium hover:bg-primary-foreground hover:shadow-lg hover:scale-105 transition-all"
            >
              Comandă acum
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

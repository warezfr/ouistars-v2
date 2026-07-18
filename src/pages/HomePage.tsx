import { useState } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Services from '@/components/home/Services';
import Fleet from '@/components/home/Fleet';
import Experience from '@/components/home/Experience';
import GoldWaves from '@/components/ui/GoldWaves';
import SepDune from '@/components/ui/SepDune';
import ScrollNav from '@/components/ui/ScrollNav';
import MeetGreeter from '@/components/home/MeetGreeter';
import Packages from '@/components/home/Packages';
import PricingTables from '@/components/home/PricingTables';
import PrestigiousAddresses from '@/components/home/PrestigiousAddresses';
import { Events, About, Faq } from '@/components/home/Editorial';
import { BookingModal, QuoteModal, ChauffeurModal, WhatsAppCTA } from '@/components/modals/Modals';

export default function HomePage() {
  const [booking, setBooking] = useState(false);
  const [quote, setQuote] = useState(false);
  const [chauffeur, setChauffeur] = useState(false);
  const [prefill, setPrefill] = useState('');

  const openBooking = (p?: string) => { setPrefill(p ?? ''); setBooking(true); };

  return (
    <>
      <GoldWaves />
      <Nav onBook={() => openBooking()} />
      <main>
        <Hero />
        <Services />
        <SepDune variant="croisee" />
        <MeetGreeter />
        <SepDune variant="houle" />
        <Fleet />
        <Experience />
        <SepDune variant="diagonale" />
        <Packages onBook={openBooking} />
        <PricingTables onBook={openBooking} />
        <SepDune variant="contre" />
        <Events onQuote={() => setQuote(true)} />
        <PrestigiousAddresses />
        <About />
        <SepDune variant="pic" />
        <Faq />
      </main>
      <Footer onJoin={() => setChauffeur(true)} />
      <ScrollNav />
      <WhatsAppCTA />
      <BookingModal open={booking} prefill={prefill} onClose={() => setBooking(false)} />
      <QuoteModal open={quote} onClose={() => setQuote(false)} />
      <ChauffeurModal open={chauffeur} onClose={() => setChauffeur(false)} />
    </>
  );
}

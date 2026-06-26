import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Mission } from "./components/Mission";
import { WhatWeDo } from "./components/WhatWeDo";
import { Events } from "./components/Events";
import { Join } from "./components/Join";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <div id="top">
      <Navbar />

      <main>
        <Hero />
        <Mission />
        <WhatWeDo />
        <Events />
        <Join />
      </main>

      <Footer />
    </div>
  );
}

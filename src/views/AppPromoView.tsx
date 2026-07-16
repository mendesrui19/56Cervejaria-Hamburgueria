"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingMobileBar } from "@/components/landing/LandingMobileBar";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import {
  LandingLocaleProvider,
  useLandingLocale,
} from "@/contexts/LandingLocaleContext";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CHAPTERS = [
  {
    id: "cartao",
    kicker: "CARTÃO DE SELOS",
    title: "O teu cartão, no telemóvel.",
    body: "Cada visita conta no cartão digital. Junta selos e acompanha o progresso — sem papel nem cartão físico.",
  },
  {
    id: "recompensas",
    kicker: "RECOMPENSAS",
    title: "Desbloqueia prémios.",
    body: "À medida que acumulas selos, desbloqueias recompensas para usares na caixa quando quiseres.",
  },
  {
    id: "desafios",
    kicker: "DESAFIOS",
    title: "Ganha selos extra.",
    body: "Desafios, sequências semanais e convites a amigos — formas simples de acelerar o teu cartão.",
  },
  {
    id: "qr",
    kicker: "NA CAIXA",
    title: "Mostra o teu QR.",
    body: "Apresenta o código ao empregado para registar a visita e ganhar selos na hora.",
  },
] as const;

const SEAL_SRCS = [
  "/brand/selo-stamp.png",
  "/brand/selo-cerveja.png",
  "/brand/selo-burger.png",
] as const;

const SEALS: Array<{
  src: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: number;
  depth: number;
}> = [
  { src: SEAL_SRCS[0], top: "4%", left: "0%", size: 118, delay: 0, depth: 1.2 },
  { src: SEAL_SRCS[1], top: "12%", right: "-2%", size: 150, delay: 0.35, depth: 2 },
  { src: SEAL_SRCS[2], top: "48%", left: "-6%", size: 168, delay: 0.7, depth: 2.4 },
  { src: SEAL_SRCS[0], top: "56%", right: "0%", size: 96, delay: 1.05, depth: 1.4 },
  { src: SEAL_SRCS[1], top: "74%", left: "10%", size: 132, delay: 1.4, depth: 1.8 },
  { src: SEAL_SRCS[2], top: "6%", left: "42%", size: 110, delay: 0.2, depth: 2.8 },
  { src: SEAL_SRCS[1], top: "34%", right: "8%", size: 100, delay: 0.9, depth: 1.6 },
  { src: SEAL_SRCS[2], top: "82%", right: "18%", size: 120, delay: 1.6, depth: 2.1 },
];

function AppPromoContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { copy } = useLandingLocale();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from(".app-promo-hero-copy > *", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.from(".app-promo-hero-visual", {
        y: 60,
        scale: 0.92,
        opacity: 0,
        duration: 1.15,
        delay: 0.15,
        ease: "power3.out",
      });

      gsap.to(".app-promo-seal", {
        y: "+=14",
        rotation: "+=4",
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.28, from: "random" },
      });

      const mm = gsap.matchMedia();

      mm.add("(min-width: 900px)", () => {
        const screens = gsap.utils.toArray<HTMLElement>(".app-promo-screen");
        gsap.set(screens, { autoAlpha: 0, scale: 0.96 });
        if (screens[0]) gsap.set(screens[0], { autoAlpha: 1, scale: 1 });

        function showScreen(index: number) {
          screens.forEach((screen, i) => {
            gsap.to(screen, {
              autoAlpha: i === index ? 1 : 0,
              scale: i === index ? 1 : 0.96,
              duration: 0.45,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
        }

        gsap.utils.toArray<HTMLElement>(".app-promo-chapter").forEach((chapter, i) => {
          gsap.from(chapter.querySelectorAll(".app-promo-chapter-inner > *"), {
            y: 20,
            opacity: 0,
            duration: 0.55,
            stagger: 0.05,
            ease: "power2.out",
            scrollTrigger: {
              trigger: chapter,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          });

          ScrollTrigger.create({
            trigger: chapter,
            start: "top 55%",
            end: "bottom 45%",
            onEnter: () => showScreen(i),
            onEnterBack: () => showScreen(i),
          });
        });

        gsap.to(".app-promo-mockup", {
          y: -36,
          rotate: -2.5,
          ease: "none",
          scrollTrigger: {
            trigger: ".app-promo-stage",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
          },
        });
      });

      mm.add("(max-width: 899px)", () => {
        gsap.set(".app-promo-screen", { clearProps: "all" });
        gsap.set(".app-promo-screen", { autoAlpha: 1, scale: 1 });
        gsap.set(".app-promo-screen:not(:first-child)", { autoAlpha: 0 });

        const screens = gsap.utils.toArray<HTMLElement>(".app-promo-screen");
        gsap.utils.toArray<HTMLElement>(".app-promo-chapter").forEach((chapter, i) => {
          gsap.from(chapter.querySelectorAll(".app-promo-chapter-inner > *"), {
            y: 28,
            opacity: 0,
            duration: 0.65,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: {
              trigger: chapter,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          });

          ScrollTrigger.create({
            trigger: chapter,
            start: "top 70%",
            end: "bottom 40%",
            onEnter: () => {
              screens.forEach((screen, si) => {
                gsap.to(screen, {
                  autoAlpha: si === i ? 1 : 0,
                  duration: 0.35,
                  overwrite: "auto",
                });
              });
            },
            onEnterBack: () => {
              screens.forEach((screen, si) => {
                gsap.to(screen, {
                  autoAlpha: si === i ? 1 : 0,
                  duration: 0.35,
                  overwrite: "auto",
                });
              });
            },
          });
        });
      });

      gsap.utils.toArray<HTMLElement>(".app-promo-seal").forEach((seal) => {
        const depth = Number(seal.dataset.depth || 1);
        gsap.to(seal, {
          y: -42 * depth,
          x: (depth % 2 === 0 ? 1 : -1) * 18 * depth,
          rotate: (depth % 2 === 0 ? 1 : -1) * 16,
          ease: "none",
          scrollTrigger: {
            trigger: ".app-promo",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <main ref={rootRef} className="landing-page app-promo landing-has-mobile-bar">
      <LandingNavbar
        sectionPrefix="/"
        openAppHref="/app"
        openAppLabel="Abrir app"
      />

      <section className="app-promo-hero">
        <div className="app-promo-hero-copy">
          <p className="app-promo-eyebrow">APP CINQUENTA &amp; SEIS</p>
          <h1>
            A Cinquenta &amp; Seis
            <br />
            no teu bolso!
          </h1>
          <p className="app-promo-lead">
            Cartão de selos, desafios, QR na caixa e recompensas — com o mesmo
            espírito da casa, agora em app.
          </p>
          <div className="app-promo-hero-actions">
            <Link href="/app" className="app-promo-btn-primary">
              Clica aqui e abre a app
            </Link>
            <a href="#experiencia" className="app-promo-btn-ghost">
              Ver experiência
            </a>
          </div>
        </div>

        <div className="app-promo-hero-visual" aria-hidden="true">
          {SEALS.slice(0, 5).map((seal, i) => (
            <img
              key={`hero-seal-${i}`}
              src={seal.src}
              alt=""
              className="app-promo-seal app-promo-seal--hero"
              data-depth={seal.depth}
              style={{
                top: seal.top,
                left: seal.left,
                right: seal.right,
                width: seal.size * 0.9,
                animationDelay: `${seal.delay}s`,
              }}
            />
          ))}
          <Image
            src="/brand/app56-mockup.png"
            alt="Mockup da App 56 Cinquenta & Seis com selos a flutuar"
            width={449}
            height={556}
            className="app-promo-hero-mock"
            priority
          />
        </div>
      </section>

      <section className="app-promo-intro">
        <p className="app-promo-eyebrow">JÁ DISPONÍVEL</p>
        <h2>Cartão de selos, desafios, QR e recompensas.</h2>
        <p>
          Junta selos em cada visita, completa desafios e desbloqueia
          recompensas — tudo na App 56.
        </p>
      </section>

      <section id="experiencia" className="app-promo-stage">
        <div className="app-promo-sticky">
          <div className="app-promo-phone-wrap">
            {SEALS.map((seal, i) => (
              <img
                key={i}
                src={seal.src}
                alt=""
                className="app-promo-seal"
                data-depth={seal.depth}
                style={{
                  top: seal.top,
                  left: seal.left,
                  right: seal.right,
                  width: seal.size,
                  animationDelay: `${seal.delay}s`,
                }}
              />
            ))}

            <div className="app-promo-mockup">
              {CHAPTERS.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="app-promo-screen"
                  data-screen={chapter.id}
                >
                  <div className="app-promo-phone">
                    <div className="app-promo-phone-notch" />
                    <div className="app-promo-phone-screen">
                      <PhoneScreen index={index} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="app-promo-chapters">
          {CHAPTERS.map((chapter) => (
            <article key={chapter.id} className="app-promo-chapter">
              <div className="app-promo-chapter-inner">
                <p className="app-promo-kicker">{chapter.kicker}</p>
                <h2>{chapter.title}</h2>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-promo-cta">
        <p className="app-promo-eyebrow">ABRIU-TE O APETITE?</p>
        <h2>Entra na app e começa a coleccionar selos.</h2>
        <Link href="/app" className="app-promo-btn-primary">
          Abrir App 56
        </Link>
      </section>

      <LandingMobileBar />

      <footer className="border-t border-[#f4efe6]/10 bg-[#14100c] text-[#8b7d6b] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain opacity-80"
            />
            <p className="text-xs">{copy.footer.rights}</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/#sobre" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.about}
            </Link>
            <Link href="/#opinioes" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.reviews}
            </Link>
            <Link href="/#contacto" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.contact}
            </Link>
            <Link href="/sistema" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.staff}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function AppPromoView() {
  return (
    <LandingLocaleProvider>
      <AppPromoContent />
    </LandingLocaleProvider>
  );
}

function PhoneChrome({
  level,
  activeTab,
  children,
}: {
  level: "Bronze" | "Prata" | "Ouro";
  activeTab: "cartao" | "desafios" | "qr" | "perfil";
  children: ReactNode;
}) {
  const tabs = [
    { id: "cartao", label: "Cartão" },
    { id: "desafios", label: "Desafios" },
    { id: "qr", label: "QR" },
    { id: "perfil", label: "Perfil" },
  ] as const;

  return (
    <>
      <div className="app-promo-phone-top">
        <Image src="/brand/selo-stamp.png" alt="" width={28} height={28} />
        <strong>Cinquenta &amp; Seis</strong>
        <span>{level}</span>
      </div>
      <div className="app-promo-phone-body">{children}</div>
      <nav className="app-promo-phone-tabs" aria-hidden="true">
        {tabs.map((tab) => (
          <span
            key={tab.id}
            className={tab.id === activeTab ? "is-active" : undefined}
          >
            {tab.label}
          </span>
        ))}
      </nav>
    </>
  );
}

function PhoneScreen({ index }: { index: number }) {
  if (index === 0) {
    return (
      <PhoneChrome level="Bronze" activeTab="cartao">
        <div className="app-promo-phone-hello">
          <div className="app-promo-phone-avatar">R</div>
          <div>
            <p>Olá, Rui</p>
            <h3>
              5<span>/10</span>
            </h3>
            <small>Continua a juntar selos</small>
          </div>
          <em className="app-promo-phone-qr-fab">QR</em>
        </div>
        <div className="app-promo-phone-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`app-promo-phone-slot ${i < 5 ? "is-filled" : ""}`}
            >
              {i < 5 ? (
                <Image src="/brand/selo-stamp.png" alt="" width={36} height={36} />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
          ))}
        </div>
        <div className="app-promo-phone-card">
          <span>RECOMPENSAS</span>
          <p>Por selos totais</p>
        </div>
        <div className="app-promo-phone-card">
          <span>DESAFIOS</span>
          <p>Ver progresso e bónus</p>
        </div>
        <div className="app-promo-phone-card app-promo-phone-card--teal">
          <span>DELIVERY</span>
          <p>Pede em casa na Glovo</p>
          <em>Abrir Glovo</em>
        </div>
      </PhoneChrome>
    );
  }

  if (index === 1) {
    return (
      <PhoneChrome level="Bronze" activeTab="cartao">
        <p className="app-promo-phone-kicker">Recompensas</p>
        <h3 className="app-promo-phone-section-title">Os teus prémios</h3>
        <div className="app-promo-phone-card">
          <span>RECOMPENSA</span>
          <p>Desbloqueada com selos</p>
        </div>
        <div className="app-promo-phone-card">
          <span>RECOMPENSA</span>
          <p>Mais visitas, mais prémios</p>
        </div>
        <div className="app-promo-phone-card">
          <span>RECOMPENSA</span>
          <p>Usa na caixa quando quiseres</p>
        </div>
        <div className="app-promo-phone-card app-promo-phone-card--teal">
          <span>DISPONÍVEL</span>
          <p>Prémio pronto a usar</p>
          <em>Usar</em>
        </div>
      </PhoneChrome>
    );
  }

  if (index === 2) {
    return (
      <PhoneChrome level="Prata" activeTab="desafios">
        <p className="app-promo-phone-kicker">Actividade</p>
        <h3 className="app-promo-phone-section-title">Desafios</h3>
        <p className="app-promo-phone-meta">12 visitas · última 3 jul</p>
        <div className="app-promo-phone-card">
          <span>DESAFIO MENSAL</span>
          <p>Visita este mês e ganha bónus</p>
          <div className="app-promo-phone-progress">
            <i style={{ width: "60%" }} />
          </div>
        </div>
        <div className="app-promo-phone-card">
          <span>SEQUÊNCIA SEMANAL</span>
          <p>Mantém o ritmo e ganha selo extra</p>
          <div className="app-promo-phone-progress app-promo-phone-progress--green">
            <i style={{ width: "66%" }} />
          </div>
        </div>
        <div className="app-promo-phone-card app-promo-phone-card--teal">
          <span>CONVIDAR AMIGOS</span>
          <p>Ganha selos a partilhar</p>
          <em>Partilhar convite</em>
        </div>
      </PhoneChrome>
    );
  }

  return (
    <PhoneChrome level="Bronze" activeTab="qr">
      <p className="app-promo-phone-kicker">Na caixa</p>
      <h3 className="app-promo-phone-section-title">Mostra o teu QR</h3>
      <p className="app-promo-phone-meta">
        Apresenta este código ao empregado para registar a visita e ganhar selos.
      </p>
      <div className="app-promo-phone-qr" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="app-promo-phone-code">CS7K2M9P</p>
    </PhoneChrome>
  );
}

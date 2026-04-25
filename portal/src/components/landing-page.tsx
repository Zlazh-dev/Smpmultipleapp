"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* ── Custom cursor ─────────────────────────────── */
function useCustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const leave = () => setVisible(false);

    const addHover = () => {
      document.querySelectorAll("a, button, [data-hover]").forEach((el) => {
        el.addEventListener("mouseenter", () => setHovering(true));
        el.addEventListener("mouseleave", () => setHovering(false));
      });
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    setTimeout(addHover, 500);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  return { pos, hovering, visible };
}

/* ── Grain overlay ─────────────────────────────── */
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.04]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}

/* ── Nav ───────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-5 transition-all duration-500 ${
        scrolled ? "bg-black/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="text-white font-medium tracking-wider text-sm uppercase">
        Portal
      </div>
      <div className="hidden md:flex items-center gap-8">
        {["Dashboard", "Tata Usaha", "Rapor Digital"].map((item) => (
          <span
            key={item}
            className="text-white/60 text-xs uppercase tracking-[0.2em] hover:text-white transition-colors duration-300 cursor-default"
          >
            {item}
          </span>
        ))}
      </div>
      <Link
        href="/login"
        className="text-xs uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors duration-300 border border-white/20 rounded-full px-5 py-2 hover:border-white/50"
        data-hover="true"
      >
        Masuk
      </Link>
    </nav>
  );
}

/* ── Features data ─────────────────────────────── */
const features = [
  {
    num: "01",
    title: "Tata Usaha",
    tags: ["Presensi", "Face Recognition", "Administrasi", "Surat"],
    desc: "Kelola presensi guru dengan face recognition, administrasi kepegawaian, cetak surat, dan pengajuan cuti.",
  },
  {
    num: "02",
    title: "Rapor Digital",
    tags: ["Penilaian", "Kurikulum Merdeka", "Cetak Rapor", "Leger"],
    desc: "Sistem rapor digital lengkap dengan penilaian berbasis kurikulum merdeka, cetak rapor, dan analisis leger.",
  },
  {
    num: "03",
    title: "Portal Guru",
    tags: ["Profil", "Jadwal", "Kinerja", "Dashboard"],
    desc: "Dashboard personal guru untuk mengelola profil, melihat jadwal mengajar, dan memantau kinerja.",
  },
];

const services = [
  {
    title: "Akademik",
    items: ["Rapor Digital", "Penilaian", "Kurikulum Merdeka", "Kokurikuler", "Ekstrakurikuler", "Leger"],
  },
  {
    title: "Administrasi",
    items: ["Presensi Guru", "Face Recognition", "Kepegawaian", "Surat Menyurat", "Pengajuan Cuti", "e-Filing"],
  },
  {
    title: "Manajemen",
    items: ["Data Siswa", "Data Guru", "Kenaikan Kelas", "Mutasi", "Import Data", "Laporan"],
  },
];

/* ── Main Landing Page ─────────────────────────── */
export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pos, hovering, visible } = useCustomCursor();

  useEffect(() => {
    // ── Lenis smooth scroll ─────────────────────
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // ── GSAP ScrollTrigger animations ───────────
    const ctx = gsap.context(() => {
      const container = containerRef.current;
      if (!container) return;

      // --- Hero parallax: title lines move at different speeds ---
      gsap.to("[data-hero-line1]", {
        yPercent: -30,
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to("[data-hero-line2]", {
        yPercent: -15,
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to("[data-hero-subtitle]", {
        yPercent: -50,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "80% top",
          scrub: 1,
        },
      });
      gsap.to("[data-hero-label]", {
        yPercent: -80,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "60% top",
          scrub: 0.8,
        },
      });

      // --- Scroll indicator fades out ---
      gsap.to("[data-scroll-indicator]", {
        opacity: 0,
        yPercent: 100,
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "5% top",
          end: "20% top",
          scrub: 0.5,
        },
      });

      // --- About section: text scrub reveal ---
      gsap.from("[data-about-heading]", {
        yPercent: 40,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-about]",
          start: "top 85%",
          end: "top 35%",
          scrub: 1,
        },
      });
      gsap.from("[data-about-desc]", {
        yPercent: 60,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-about]",
          start: "top 75%",
          end: "top 30%",
          scrub: 1,
        },
      });
      gsap.from("[data-about-circle]", {
        scale: 0.5,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-about]",
          start: "top 80%",
          end: "top 40%",
          scrub: 1,
        },
      });

      // --- Feature items: each scrubs in as you scroll ---
      container.querySelectorAll("[data-feature]").forEach((el, i) => {
        const num = el.querySelector("[data-feature-num]");
        const title = el.querySelector("[data-feature-title]");
        const tags = el.querySelector("[data-feature-tags]");
        const desc = el.querySelector("[data-feature-desc]");
        const line = el.querySelector("[data-feature-line]");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 25%",
            scrub: 1.2,
          },
        });

        tl.from(num, { xPercent: -20, opacity: 0, duration: 0.4 }, 0)
          .from(title, { yPercent: 60, opacity: 0, duration: 0.5 }, 0.1)
          .from(tags, { yPercent: 40, opacity: 0, duration: 0.4 }, 0.2)
          .from(desc, { yPercent: 40, opacity: 0, duration: 0.4 }, 0.3)
          .from(line, { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, 0.3);
      });

      // --- Services section: heading scrub ---
      gsap.from("[data-services-heading]", {
        yPercent: 30,
        opacity: 0,
        scrollTrigger: {
          trigger: "[data-services]",
          start: "top 85%",
          end: "top 45%",
          scrub: 1,
        },
      });

      // --- Service columns stagger scrub ---
      container.querySelectorAll("[data-service-col]").forEach((el, i) => {
        gsap.from(el, {
          yPercent: 50 + i * 15,
          opacity: 0,
          scrollTrigger: {
            trigger: "[data-services]",
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        });
      });

      // --- Footer CTA: dramatic scrub entrance ---
      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-footer]",
          start: "top 85%",
          end: "top 30%",
          scrub: 1.5,
        },
      });
      footerTl
        .from("[data-footer-sub]", { yPercent: 40, opacity: 0, duration: 0.3 }, 0)
        .from("[data-footer-line1]", { yPercent: 80, opacity: 0, duration: 0.5 }, 0.1)
        .from("[data-footer-line2]", { yPercent: 80, opacity: 0, duration: 0.5 }, 0.2)
        .from("[data-footer-cta]", { yPercent: 60, opacity: 0, duration: 0.4 }, 0.35);

      // --- Horizontal line in footer grows ---
      gsap.from("[data-footer-divider]", {
        scaleX: 0,
        transformOrigin: "left center",
        scrollTrigger: {
          trigger: "[data-footer-divider]",
          start: "top 90%",
          end: "top 60%",
          scrub: 1,
        },
      });

    }, containerRef);

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Custom cursor (desktop only) */}
      <div
        className="hidden md:block pointer-events-none fixed z-[9999] rounded-full transition-transform duration-150 ease-out"
        style={{
          left: pos.x - (hovering ? 20 : 6),
          top: pos.y - (hovering ? 20 : 6),
          width: hovering ? 40 : 12,
          height: hovering ? 40 : 12,
          backgroundColor: hovering ? "transparent" : "rgb(52, 211, 153)",
          border: hovering ? "1.5px solid rgba(52, 211, 153, 0.5)" : "none",
          opacity: visible ? 1 : 0,
          mixBlendMode: "difference",
        }}
      />

      <GrainOverlay />

      <div ref={containerRef} className="bg-black text-white cursor-none md:cursor-none">
        <Nav />

        {/* ════════ HERO ════════ */}
        <section data-hero className="relative h-[100dvh] flex items-end pb-16 md:pb-24 px-8 md:px-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-black to-[#0d0d0d]" />
          <div className="absolute top-0 right-0 w-[70%] h-[80%] bg-gradient-to-bl from-emerald-900/20 via-teal-900/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-gradient-to-tr from-emerald-950/30 to-transparent" />

          <div className="relative z-10 w-full max-w-[90rem] mx-auto">
            <p data-hero-label className="text-emerald-400/80 text-sm uppercase tracking-[0.3em] mb-6">
              SMPIT Asy-Syadzili
            </p>
            <div data-hero-line1 className="overflow-hidden">
              <h1 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] text-white tracking-tight">
                Portal Akademik
              </h1>
            </div>
            <div data-hero-line2 className="overflow-hidden">
              <h1 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] text-white/40 tracking-tight italic">
                Terpadu
              </h1>
            </div>

            <div data-hero-subtitle className="mt-10 flex items-center gap-6">
              <span className="text-white/40 text-sm max-w-xs leading-relaxed">
                Sistem terintegrasi untuk pengelolaan data guru, siswa, rapor digital, dan administrasi sekolah.
              </span>
              <div className="w-12 h-[1px] bg-white/20" />
            </div>
          </div>

          <div data-scroll-indicator className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-white/30 text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ════════ ABOUT ════════ */}
        <section data-about className="relative py-32 md:py-48 px-8 md:px-12 bg-black">
          <div className="max-w-[90rem] mx-auto grid md:grid-cols-[1fr_1.2fr] gap-16 md:gap-24 items-start">
            <div>
              <p className="text-emerald-400/60 text-xs uppercase tracking-[0.3em] mb-6">
                Tentang Kami
              </p>
              <div data-about-circle>
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center w-28 h-28 rounded-full border border-white/20 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all duration-500"
                  data-hover="true"
                >
                  <span className="text-white/60 text-xs uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors">
                    Masuk
                  </span>
                </Link>
              </div>
            </div>

            <div>
              <h2 data-about-heading className="font-serif text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.15] text-white tracking-tight mb-8">
                Kami adalah{" "}
                <span className="italic text-white/50">Portal Akademik</span>{" "}
                SMPIT Asy-Syadzili yang menghubungkan seluruh ekosistem sekolah.
              </h2>
              <p data-about-desc className="text-white/40 text-sm leading-relaxed max-w-sm">
                Mengelola data guru, siswa, rapor digital, presensi face recognition, dan administrasi sekolah dalam satu platform terpadu.
              </p>
            </div>
          </div>
        </section>

        {/* ════════ FEATURES ════════ */}
        <section className="relative py-32 md:py-48 px-8 md:px-12 bg-black">
          <div className="max-w-[90rem] mx-auto">
            <p className="text-emerald-400/60 text-xs uppercase tracking-[0.3em] mb-20">
              Layanan
            </p>

            <div className="space-y-24 md:space-y-40">
              {features.map((f) => (
                <div
                  key={f.num}
                  data-feature
                  className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-start group"
                >
                  <span
                    data-feature-num
                    className="font-serif text-[clamp(4rem,10vw,8rem)] leading-none text-white/[0.06] group-hover:text-emerald-400/10 transition-colors duration-700"
                  >
                    {f.num}
                  </span>

                  <div>
                    <h3
                      data-feature-title
                      className="font-serif text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white tracking-tight mb-4 group-hover:text-emerald-300 transition-colors duration-500"
                    >
                      {f.title}
                    </h3>
                    <div data-feature-tags className="flex flex-wrap gap-2 mb-6">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase tracking-[0.15em] text-white/30 border border-white/10 rounded-full px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p data-feature-desc className="text-white/40 text-sm leading-relaxed max-w-lg">
                      {f.desc}
                    </p>
                    <div data-feature-line className="mt-12 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ SERVICES ════════ */}
        <section data-services className="relative py-32 md:py-48 px-8 md:px-12 bg-black border-t border-white/[0.06]">
          <div className="max-w-[90rem] mx-auto">
            <h2
              data-services-heading
              className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.2] text-white tracking-tight max-w-2xl mb-16"
            >
              Sistem terintegrasi untuk seluruh kebutuhan{" "}
              <span className="italic text-white/40">operasional sekolah</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {services.map((s) => (
                <div key={s.title} data-service-col>
                  <Link href="/login" className="group block" data-hover="true">
                    <h3 className="text-emerald-400/80 text-xs uppercase tracking-[0.3em] mb-6 group-hover:text-emerald-300 transition-colors">
                      {s.title}
                    </h3>
                    <ul className="space-y-3">
                      {s.items.map((item) => (
                        <li
                          key={item}
                          className="text-white/30 text-sm group-hover:text-white/50 transition-colors duration-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FOOTER CTA ════════ */}
        <footer data-footer className="relative py-32 md:py-48 px-8 md:px-12 bg-black border-t border-white/[0.06]">
          <div className="max-w-[90rem] mx-auto">
            <p data-footer-sub className="text-white/30 text-sm mb-6">Siap untuk memulai?</p>
            <h2 data-footer-line1 className="font-serif text-[clamp(2rem,6vw,5rem)] leading-[1] text-white tracking-tight">
              Mari kelola sekolah
            </h2>
            <h2 data-footer-line2 className="font-serif text-[clamp(2rem,6vw,5rem)] leading-[1] text-white/40 italic tracking-tight">
              secara digital!
            </h2>

            <div data-footer-cta className="mt-12">
              <Link
                href="/login"
                className="inline-flex items-center gap-4 text-emerald-400 hover:text-emerald-300 transition-colors duration-300 group"
                data-hover="true"
              >
                <span className="text-lg md:text-xl font-medium">
                  Masuk ke Portal
                </span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <div data-footer-divider className="mt-32 pt-8 border-t border-white/[0.06]" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
              <p className="text-white/20 text-xs">
                &copy; {new Date().getFullYear()} SMPIT Asy-Syadzili
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-white/20 text-xs uppercase tracking-[0.2em] hover:text-white/50 transition-colors cursor-pointer"
                data-hover="true"
              >
                Kembali ke atas ↑
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

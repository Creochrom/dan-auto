"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock,
  Cog,
  Disc,
  ExternalLink,
  Gauge,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Settings2,
  Sparkles,
  Star,
  Timer,
  Truck,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DanAutoCentreLogo } from "@/components/brand/DanAutoCentreLogo";
import { PremiumHero } from "@/components/hero/PremiumHero";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlateInput } from "@/components/PlateInput";
import { PlatformHub } from "@/components/platform/PlatformHub";
import { VipMembership } from "@/components/platform/VipMembership";
import { ServiceGridPremium } from "@/components/services/ServiceGridPremium";
import { useI18n } from "@/components/providers/I18nProvider";
import type { SavedVehicle } from "@/lib/platform/types";
import type { VehicleResult } from "@/lib/types/vehicle";
import { formatPlate, stripPlate } from "@/lib/format-plate";
import { readMemberStatus, setMemberStatus } from "@/lib/membership";
import { mockVehicleLookup, SCAN_STEPS } from "@/lib/vehicle-data";
import type { VehicleReport } from "@/lib/types/vehicle-report";

/* ─────────────────────────── Data ─────────────────────────── */

const BUSINESS = {
  name: "Dan Auto Centre LTD",
  shortName: "Dan Auto Centre",
  tagline: "One-stop garage for car repair & maintenance in Southampton",
  phone: "023 8023 3552",
  phoneHref: "tel:02380233552",
  email: "contact@danautocentre.co.uk",
  address: "9 Park Rd, Southampton SO15 3AS",
  mapsHref:
    "https://www.google.com/maps/dir//Dan+Auto+Centre+Ltd/@50.9104006,-1.463707,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48747697f33e1945:0x31049542cb368570!2m2!1d-1.4224711!2d50.9104121",
  googleReviewsHref:
    "https://maps.google.com/?cid=3532112121875039600",
  hours: "Mon–Sat 8:00–17:00",
  hoursDetail: "Sunday closed",
  experience: "25+",
  googleRating: "4.9",
  googleReviewCount: "80",
} as const;

const PHONE = BUSINESS.phone;
const PHONE_HREF = BUSINESS.phoneHref;
const EMAIL = BUSINESS.email;
const WHATSAPP_HREF = "https://wa.me/442380233552";

const FOOTER_LINKS = [
  { href: "#mot", label: "MOT" },
  { href: "#services", label: "Repairs & servicing" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#about", label: "About" },
  { href: "#members", label: "Members" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
  { href: "#booking", label: "Book" },
] as const;

const WHY_CHOOSE = [
  {
    title: "Complimentary vehicle pickup",
    description:
      "Non-runner collection within a 20-mile radius of Southampton — we come to you.",
    icon: Truck,
  },
  {
    title: "Online booking & reg lookup",
    description:
      "Book MOT, servicing, or repairs online. Enter your plate for instant vehicle details.",
    icon: Calendar,
  },
  {
    title: "Skilled, experienced mechanics",
    description:
      "Fully qualified team with 25+ years working on cars and vans of every make.",
    icon: Wrench,
  },
  {
    title: "Prompt, honest service",
    description:
      "Clear communication, competitive pricing, and work completed to a high standard.",
    icon: CheckCircle2,
  },
] as const;

const SERVICING_TIERS = [
  {
    name: "Basic service",
    description: "Essential checks and oil change to keep your car running smoothly.",
  },
  {
    name: "Full service",
    description:
      "Comprehensive check including fluid top-ups and filter replacements.",
  },
  {
    name: "Major service",
    description:
      "Thorough maintenance covering safety, fluids, filters, and wear items.",
  },
] as const;

type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  from: string;
  duration: string;
  tag?: string;
};

const SERVICES: Service[] = [
  {
    icon: ClipboardCheck,
    title: "MOT Testing",
    description:
      "Comprehensive MOT to meet safety and environmental standards. Pre-check available so you pass first time.",
    from: "£54.85",
    duration: "45–60 min",
    tag: "Book online",
  },
  {
    icon: Gauge,
    title: "Vehicle Diagnostics",
    description:
      "Check engine light? Our diagnostics team finds faults fast with dealer-level scan tools and clear reports.",
    from: "Quote",
    duration: "1–2 hrs",
    tag: "Call team",
  },
  {
    icon: Wind,
    title: "DPF Deep Clean",
    description:
      "Full dismantle and deep-clean of diesel particulate filters — not a quick in-situ pressure blast.",
    from: "£299",
    duration: "1–2 days",
    tag: "Premium",
  },
  {
    icon: Settings2,
    title: "Car Servicing",
    description:
      "Basic, full, and major servicing for cars and vans — routine maintenance to protect your engine.",
    from: "Quote",
    duration: "2–5 hrs",
  },
  {
    icon: Disc,
    title: "Brakes",
    description:
      "Expert brake inspections, repairs, and replacements so your car stops safely every time.",
    from: "Quote",
    duration: "2–3 hrs",
  },
  {
    icon: Cog,
    title: "Clutches",
    description:
      "Clutch diagnosis and replacement — smooth gear changes, same-day turnaround on many vehicles.",
    from: "Quote",
    duration: "1 day",
  },
  {
    icon: Timer,
    title: "Timing Belts",
    description:
      "Cambelt / timing belt replacement and inspection to prevent costly engine damage.",
    from: "Quote",
    duration: "Half–1 day",
  },
  {
    icon: CircleDot,
    title: "Tyres",
    description:
      "Tyre supply, fitting, and safety checks — keep grip and compliance on Southampton roads.",
    from: "Quote",
    duration: "30–60 min",
  },
  {
    icon: Wind,
    title: "Air Conditioning",
    description:
      "A/C recharge, leak testing, and repairs — stay cool and comfortable year-round.",
    from: "Quote",
    duration: "1 hr",
  },
  {
    icon: Car,
    title: "Exhaust Repairs",
    description:
      "Exhaust system repairs and replacements — reduce noise, emissions, and MOT failures.",
    from: "Quote",
    duration: "1–3 hrs",
  },
  {
    icon: Wrench,
    title: "General Repairs",
    description:
      "From oil changes to complex faults — honest quotes, quality parts, cars and vans welcome.",
    from: "Quote",
    duration: "Varies",
  },
];

const WORKSHOP_JOBS = [
  {
    bay: "Ramp 1",
    reg: "HV14 KPL",
    job: "Clutch replacement · Ford Fiesta",
    status: "Technician on ramp",
    eta: "15:00",
  },
  {
    bay: "MOT bay",
    reg: "SO15 DAC",
    job: "Class 4 MOT test",
    status: "Awaiting retest",
    eta: "14:15",
  },
  {
    bay: "Diagnostics",
    reg: "WN67 EGR",
    job: "EGR fault · live data scan",
    status: "Fault tracing",
    eta: "16:30",
  },
  {
    bay: "Ramp 2",
    reg: "GK18 VW1",
    job: "Full service · VW Golf",
    status: "Oil & filters",
    eta: "13:45",
  },
] as const;

const REVIEWS = [
  {
    name: "Google reviewer",
    vehicle: "Regular customer",
    text: "Very quick to get work done from dropping my car off, and all to a good standard. Kept me updated promptly and pricing very good too.",
  },
  {
    name: "Google reviewer",
    vehicle: "Multiple vehicles",
    text: "Since Dan Auto opened I've been taking all my cars there for repairs, service and MOT. They always do a fantastic job. Friendly, flexible and competitive pricing.",
  },
  {
    name: "Google reviewer",
    vehicle: "EGR repair",
    text: "Had an EGR failure — DAC came back with an extremely competitive quote. They collected the car, completed the work, and communication was excellent with no silly extras.",
  },
  {
    name: "Google reviewer",
    vehicle: "Gearbox repair",
    text: "Best quote around and got the job done quickly. Quoted £2,800 elsewhere — Dan's garage did the job for under £1k. Lovely people — will definitely return.",
  },
  {
    name: "Google reviewer",
    vehicle: "Southampton",
    text: "The best garage in Southampton. Really good prices — fixed my gearbox problem in one day. Driving now feels like a brand new car.",
  },
  {
    name: "Google reviewer",
    vehicle: "MOT & service",
    text: "Excellent service — had an MOT and service with them. Would highly recommend.",
  },
];

const SERVICE_OPTIONS = [
  "MOT",
  "Air conditioning",
  "Servicing — basic",
  "Servicing — full",
  "Servicing — major",
  "Brakes",
  "Clutches",
  "Timing belt / cambelt",
  "Tyres",
  "Diagnostics",
  "Exhaust repair",
  "General repair",
];

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

const BOOKING_DURATIONS = [
  { value: "1", label: "1 hour" },
  { value: "1.5", label: "1 hour 30 min" },
  { value: "3", label: "3 hours" },
  { value: "5", label: "5 hours" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────── Helpers ─────────────────────────── */

function mockQuote(reg: string, service: string) {
  const base = 95 + reg.length * 8 + service.length * 3;
  return `Dan Auto Centre · ${reg}\n${service}\n\nEstimated labour & parts: £${base} – £${base + 85}\n\nSouthampton workshop estimate — final price confirmed after inspection. Includes digital report where applicable.\n\nCall ${BUSINESS.phone} to speak to our diagnostics team.`;
}

function parseMotDays(motLine: string): number | undefined {
  const m = motLine.match(/(\d+)\s*days?/i);
  return m ? Number(m[1]) : undefined;
}

function toSavedVehicle(v: VehicleResult): SavedVehicle {
  return {
    reg: v.reg,
    makeModel: v.makeModel,
    meta: v.meta,
    motExpiresDays: v.motDays ?? parseMotDays(v.motLine),
  };
}

function GlobalNoise() {
  return (
    <div
      className="noise-overlay pointer-events-none fixed inset-0 z-[100] mix-blend-overlay"
      aria-hidden
    />
  );
}

function SectionGlow({
  position = "top",
}: {
  position?: "top" | "center" | "bottom";
}) {
  const pos =
    position === "top"
      ? "top-0"
      : position === "bottom"
        ? "bottom-0"
        : "top-1/2 -translate-y-1/2";
  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 ${pos} h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(201,162,39,0.08),transparent)]`}
      aria-hidden
    />
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: EASE }}
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl"
      }
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-section mt-4 text-white">{title}</h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function Home() {
  const { isLocalizedExperience, messages, returnToEnglish } = useI18n();

  const [heroPlate, setHeroPlate] = useState("");
  const [heroScanPhase, setHeroScanPhase] = useState<"idle" | "scanning" | "done">(
    "idle"
  );
  const [heroScanStep, setHeroScanStep] = useState(0);
  const [heroVehicle, setHeroVehicle] = useState<VehicleResult | null>(null);
  const [isVipMember, setIsVipMember] = useState(false);

  useEffect(() => {
    setIsVipMember(readMemberStatus());
  }, []);

  const [quoteReg, setQuoteReg] = useState("");
  const [quoteService, setQuoteService] = useState(SERVICE_OPTIONS[0]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteText, setQuoteText] = useState<string | null>(null);
  const [quoteDisplayed, setQuoteDisplayed] = useState("");

  const [bookReg, setBookReg] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookSlot, setBookSlot] = useState("");
  const [bookService, setBookService] = useState(SERVICE_OPTIONS[0]);
  const [bookDuration, setBookDuration] = useState<string>(BOOKING_DURATIONS[0].value);
  const [bookName, setBookName] = useState("");
  const [bookEmail, setBookEmail] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookDone, setBookDone] = useState(false);
  const [bookDoneTick, setBookDoneTick] = useState(0);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const [plateFocus, setPlateFocus] = useState<"hero" | "quote" | "book" | null>(
    null
  );
  const [accountSignupFocus, setAccountSignupFocus] = useState(false);

  const handlePlateBlur = useCallback(() => setPlateFocus(null), []);
  const handleHeroPlateFocus = useCallback(() => setPlateFocus("hero"), []);
  const handleQuotePlateFocus = useCallback(() => setPlateFocus("quote"), []);
  const handleBookPlateFocus = useCallback(() => setPlateFocus("book"), []);

  const handleHeroPlateChange = useCallback((v: string) => setHeroPlate(v), []);
  const handleQuotePlateChange = useCallback((v: string) => setQuoteReg(v), []);
  const handleBookPlateChange = useCallback((v: string) => setBookReg(v), []);

  useEffect(() => {
    if (!quoteText) return;
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setQuoteDisplayed(quoteText.slice(0, i));
      if (i >= quoteText.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [quoteText]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const runQuote = useCallback(() => {
    const q = stripPlate(quoteReg);
    if (q.length < 2) return;
    setQuoteLoading(true);
    setQuoteText(null);
    setQuoteDisplayed("");
    setTimeout(() => {
      setQuoteText(mockQuote(q, quoteService));
      setQuoteLoading(false);
    }, 1300);
  }, [quoteReg, quoteService]);

  const onHeroLookup = useCallback((reg: string) => {
    const canon = stripPlate(reg);
    if (canon.length < 2) return;
    setHeroVehicle(null);
    setHeroScanPhase("scanning");
    setHeroScanStep(0);
    setQuoteReg(formatPlate(canon));

    const stepTimer = window.setInterval(() => {
      setHeroScanStep((s) => (s < SCAN_STEPS.length - 1 ? s + 1 : s));
    }, 380);

    window.setTimeout(() => {
      window.clearInterval(stepTimer);
      setHeroVehicle(mockVehicleLookup(canon).vehicle);
      setHeroScanPhase("done");
      setHeroScanStep(SCAN_STEPS.length - 1);
      setBookReg(formatPlate(canon));
    }, 1200);
  }, []);

  const onBookSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (stripPlate(bookReg) && bookDate && bookSlot && bookName && bookPhone) {
      setBookDone(true);
      setBookDoneTick((t) => t + 1);
    }
  };

  const onContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (contactName && contactPhone && contactMessage) setContactSent(true);
  };

  const scrollToBooking = useCallback((service?: string) => {
    if (service) setBookService(service);
    scrollTo("booking");
  }, [scrollTo]);

  const openAccountSignup = useCallback(() => {
    setMemberStatus(true);
    setIsVipMember(true);
    setAccountSignupFocus(true);
    scrollTo("members");
  }, [scrollTo]);

  const onHeroReportReady = useCallback((report: VehicleReport) => {
    setHeroVehicle(report.legacy);
  }, []);

  const onHeroDiscussAI = useCallback(() => {
    scrollTo("members");
    setAccountSignupFocus(true);
  }, [scrollTo]);

  const onHeroEstimateRepair = useCallback(() => {
    if (heroVehicle) {
      setQuoteReg(heroVehicle.reg);
      setQuoteService("General repair");
    }
    scrollTo("ai-quote");
    if (heroVehicle) {
      window.setTimeout(() => runQuote(), 400);
    }
  }, [heroVehicle, scrollTo, runQuote]);

  const onHeroBookInspection = useCallback(() => {
    if (heroVehicle) {
      const label =
        heroVehicle.suggestedRepairs[0]?.toLowerCase().includes("brake")
          ? "Brakes"
          : heroVehicle.suggestedRepairs[0]?.toLowerCase().includes("service")
            ? "Servicing — full"
            : "Diagnostics";
      scrollToBooking(label);
      return;
    }
    scrollToBooking();
  }, [heroVehicle, scrollToBooking]);

  const handleHeroPlateChangeWithReset = useCallback(
    (v: string) => {
      setHeroPlate(v);
      if (heroScanPhase !== "idle") {
        setHeroScanPhase("idle");
        setHeroVehicle(null);
        setHeroScanStep(0);
      }
    },
    [heroScanPhase]
  );

  return (
    <>
      <GlobalNoise />

      <SiteHeader phone={PHONE} phoneHref={PHONE_HREF} />

      <main>
        <PremiumHero
          badge="SOUTHAMPTON'S TRUSTED CAR SPECIALISTS"
          experience={BUSINESS.experience}
          googleRating={BUSINESS.googleRating}
          googleReviewCount={BUSINESS.googleReviewCount}
          heroPlate={heroPlate}
          onPlateChange={handleHeroPlateChangeWithReset}
          onLookup={onHeroLookup}
          onReportReady={onHeroReportReady}
          scanPhase={heroScanPhase}
          scanStep={heroScanStep}
          vehicle={heroVehicle}
          isMember={isVipMember}
          plateFocused={plateFocus === "hero"}
          onPlateFocus={handleHeroPlateFocus}
          onPlateBlur={handlePlateBlur}
          onCreateAccount={openAccountSignup}
          onBookNow={() => scrollToBooking()}
          onHeroServiceSelect={(label) => scrollToBooking(label)}
          onDiscussAI={onHeroDiscussAI}
          onEstimateRepair={onHeroEstimateRepair}
          onBookInspection={onHeroBookInspection}
          onMembershipNote={openAccountSignup}
        />

        {/* ── MOT ── */}
        <section id="mot" className="section-future relative scroll-mt-28 py-20 sm:py-28">
          <SectionGlow position="top" />
          <motion.div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="eyebrow">MOT testing</p>
              <h2 className="display-section mt-4 text-white">
                Pass your MOT with confidence
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
                Ensure your vehicle meets required safety and environmental
                standards with our comprehensive MOT testing. Saturday slots
                available — book your reg online and we&apos;ll confirm your
                appointment.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-zinc-300">
                {[
                  "Pre-MOT checks available",
                  "Cars and vans",
                  "Clear advisories explained",
                  "Retest support if required",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => scrollToBooking("MOT")}
                className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black"
              >
                Book MOT online
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="premium-card glow-cyan rounded-3xl p-8 sm:p-10"
            >
              <ClipboardCheck className="h-10 w-10 text-cyan" />
              <p className="mt-6 text-3xl font-light text-white">From £54.85</p>
              <p className="mt-2 text-sm text-zinc-400">Maximum MOT test fee</p>
              <p className="mt-8 border-t border-white/10 pt-6 text-sm text-zinc-400">
                Need an oil change or service at the same time? Combine MOT with
                servicing when you book — our team will advise on the best package.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="section-deep relative scroll-mt-28 py-24 sm:py-32">
          <SectionGlow position="top" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: EASE }}
              className="max-w-2xl"
            >
              <p className="eyebrow">Vehicle repair services</p>
              <h2 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl">
                Everything your car needs in Southampton
              </h2>
              <p className="mt-4 text-base text-zinc-400 sm:text-lg">
                Top-notch automotive services to keep your vehicle running smoothly.
                Experienced technicians, competitive pricing, and professional
                friendly service — your car is in safe hands.
              </p>
            </motion.div>

            <ServiceGridPremium services={SERVICES} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-14"
            >
              <p className="eyebrow">Servicing packages</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {SERVICING_TIERS.map((tier, i) => (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="premium-card rounded-2xl p-5 sm:p-6"
                  >
                    <h3 className="text-base font-medium text-white">{tier.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {tier.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Diagnostics ── */}
        <section id="diagnostics" className="section-future relative scroll-mt-28 py-20 sm:py-28">
          <SectionGlow position="center" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div className="premium-panel overflow-hidden rounded-3xl">
              <div className="grid lg:grid-cols-2">
                <div className="relative border-b border-white/8 p-8 sm:p-12 lg:border-b-0 lg:border-r">
                  <p className="eyebrow-diagnostic">Diagnostics</p>
                  <h2 className="display-section mt-4 text-white">Check engine light on?</h2>
                  <p className="mt-5 text-base leading-relaxed text-zinc-400">
                    Speak to our diagnostics team at{" "}
                    <a href={PHONE_HREF} className="font-medium text-cyan hover:underline">
                      {PHONE}
                    </a>
                    . With {BUSINESS.experience} years of experience, we diagnose faults on
                    all makes — warning lights to complex engine and emissions issues.
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToBooking("Diagnostics")}
                    className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black"
                  >
                    Book diagnostics
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <ul className="space-y-4 text-sm text-zinc-300">
                    {[
                      "OBD fault code reading & live data",
                      "EGR, DPF & emissions faults",
                      "Engine, gearbox & electrical tracing",
                      "Written report — no jargon",
                      "German & performance marques welcome",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── About ── */}
        <section id="about" className="section-deep relative scroll-mt-28 py-24 sm:py-32">
          <SectionGlow position="top" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="About the workshop"
              title="Dan Auto Centre — Southampton"
              description="Welcome to our Southampton car repairs garage. We take pride in providing top-notch automotive services — quality repairs and maintenance from a fully qualified team dedicated to all types of cars and vans."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Routine maintenance",
                  text: "Servicing, oil changes, and scheduled care to protect your investment.",
                },
                {
                  title: "MOT & safety",
                  text: "MOT testing plus brakes, tyres, and safety-critical repairs.",
                },
                {
                  title: "Complex repairs",
                  text: "Clutches, timing belts, exhausts, air conditioning, and diagnostics.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="premium-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-medium text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why choose us ── */}
        <section id="why-us" className="relative scroll-mt-28 py-24 sm:py-32">
          <SectionGlow position="bottom" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Why choose us"
              title="Reliable, professional vehicle care"
              description="Trust Dan Auto Centre for dependable diagnostics and repairs — competitive pricing, prompt service, and a team that keeps you informed every step of the way."
              align="center"
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {WHY_CHOOSE.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card group flex gap-5 rounded-2xl p-6 sm:p-7"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan ring-1 ring-cyan/20 transition group-hover:bg-cyan/20">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Workshop ── */}
        <section id="workshop" className="relative py-24 sm:py-32">
          <SectionGlow position="center" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Live workshop today"
              title="What's on the ramps right now"
              description="Real jobs in progress across our MOT bay and diagnostic bays — updated throughout the day."
            />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {WORKSHOP_JOBS.map((job, i) => (
                <motion.div
                  key={job.reg}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.45, ease: EASE }}
                  className="workshop-job-card rounded-2xl p-5 sm:p-6"
                >
                  <motion.div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="live-pulse h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          {job.bay}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-lg font-bold tracking-wider text-[#F9D71C]">
                        {job.reg}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">{job.job}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        ETA
                      </p>
                      <p className="text-lg font-light text-cyan">{job.eta}</p>
                    </div>
                  </motion.div>
                  <p className="mt-4 text-xs text-amber-200/80">{job.status}</p>
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center text-sm text-zinc-500"
            >
              Walk-ins welcome subject to availability —{" "}
              <a href="#booking" className="text-cyan hover:underline">
                book ahead to guarantee your bay
              </a>
            </motion.p>
          </div>
        </section>

        {/* ── AI Quote ── */}
        <section id="ai-quote" className="section-future relative py-24 sm:py-32">
          <SectionGlow position="center" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan/[0.05] via-transparent to-transparent" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Workshop estimate"
              title="Ballpark pricing before you visit"
              description="Cross-references your registration with labour times and parts data from our workshop system — honest ranges, confirmed on inspection."
              align="center"
            />

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE }}
              className="premium-panel glow-cyan relative z-10 mx-auto mt-14 max-w-xl overflow-hidden rounded-3xl"
            >
              <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5 sm:px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    Workshop pricing engine
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    Based on reg lookup & service selection
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                <PlateInput
                  id="quote"
                  value={quoteReg}
                  onChange={handleQuotePlateChange}
                  onSubmit={runQuote}
                  compact
                  focused={plateFocus === "quote"}
                  onFocus={handleQuotePlateFocus}
                  onBlur={handlePlateBlur}
                />
                <select
                  value={quoteService}
                  onChange={(e) => setQuoteService(e.target.value)}
                  className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                >
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o} value={o} className="bg-zinc-900">
                      {o}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={runQuote}
                  disabled={quoteLoading || stripPlate(quoteReg).length < 2}
                  className="btn-glow flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {quoteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analysing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate estimate
                    </>
                  )}
                </button>

                <AnimatePresence mode="wait">
                  {(quoteLoading || quoteDisplayed) && (
                    <motion.div
                      key={quoteLoading ? "load" : "out"}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl border border-white/8 bg-black/60 p-4"
                    >
                      {quoteLoading ? (
                        <div className="flex gap-1.5 py-1">
                          {[0, 1, 2].map((d) => (
                            <motion.span
                              key={d}
                              className="h-2 w-2 rounded-full bg-cyan/60"
                              animate={{ opacity: [0.25, 1, 0.25] }}
                              transition={{
                                duration: 0.9,
                                repeat: Infinity,
                                delay: d * 0.15,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line font-mono text-[13px] leading-relaxed text-zinc-300">
                          {quoteDisplayed}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.45, repeat: Infinity }}
                            className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-cyan"
                          />
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section id="reviews" className="section-deep relative scroll-mt-28 py-24 sm:py-32">
          <SectionGlow position="top" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Reviews"
              title="What our customers say"
              description={`${BUSINESS.googleRating}★ rating on Google from ${BUSINESS.googleReviewCount}+ reviews — trusted by drivers across Southampton.`}
              align="center"
            />

            <motion.a
              href={BUSINESS.googleReviewsHref}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="premium-card mx-auto mt-10 flex max-w-md items-center justify-center gap-4 rounded-2xl px-6 py-5 transition hover:border-cyan/30"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < 4 ? "fill-amber-400 text-amber-400" : "fill-amber-400/40 text-amber-400/40"}`}
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-2xl font-light text-white">{BUSINESS.googleRating}</p>
                <p className="text-xs text-zinc-500">Google · {BUSINESS.googleReviewCount} reviews</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-zinc-500" />
            </motion.a>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
              {REVIEWS.map((r, i) => (
                <motion.blockquote
                  key={r.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.45 }}
                  className="premium-card relative rounded-2xl p-6 sm:p-8"
                >
                  <span className="quote-mark pointer-events-none absolute -top-2 left-4 select-none" aria-hidden>
                    &ldquo;
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 fill-cyan text-cyan"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <footer className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div>
                      <cite className="not-italic text-sm font-medium text-white">
                        {r.name}
                      </cite>
                      <p className="text-xs text-zinc-500">{r.vehicle}</p>
                    </div>
                    <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-medium text-cyan">
                      Google
                    </span>
                  </footer>
                </motion.blockquote>
              ))}
            </div>
          </div>
        </section>

        <div id="members" className="scroll-mt-28">
        <VipMembership />

        <PlatformHub
          detectedVehicle={heroVehicle ? toSavedVehicle(heroVehicle) : null}
          bookDoneTick={bookDoneTick}
          focusSignup={accountSignupFocus}
        />
        </div>

        {/* ── Booking ── */}
        <section id="booking" className="section-future relative py-24 sm:py-32">
          <SectionGlow position="bottom" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="premium-panel overflow-hidden rounded-3xl">
              <div className="grid lg:grid-cols-2">
                <div className="border-b border-white/8 p-6 sm:p-10 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan">
                    Booking
                  </p>
                  <h2 className="mt-3 text-2xl font-light tracking-tight text-white sm:text-3xl">
                    Book your service online
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    Choose your service, enter your registration, and pick a time —
                    just like our online booking at {BUSINESS.shortName}. We&apos;ll
                    confirm your appointment by phone or email.
                  </p>
                  <ul className="mt-8 space-y-3">
                    {[
                      "MOT, servicing, diagnostics & repairs",
                      "Free collection for non-runners (20 miles)",
                      `Open ${BUSINESS.hours} · ${BUSINESS.hoursDetail}`,
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-zinc-300"
                      >
                        <Check className="h-4 w-4 shrink-0 text-cyan" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 sm:p-10">
                  {bookDone ? (
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center py-10 text-center"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                        <Check className="h-7 w-7" />
                      </div>
                      <h3 className="mt-5 text-xl font-medium text-white">
                        Request received
                      </h3>
                      <p className="mt-2 max-w-xs text-sm text-zinc-400">
                        We&apos;ll confirm {bookReg} on {bookDate} at {bookSlot}.
                        Check your phone shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={onBookSubmit} className="space-y-4">
                      <div className="flex items-center gap-2 text-cyan">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.22em]">
                          Book appointment
                        </span>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-zinc-500">
                          Service required
                        </label>
                        <select
                          value={bookService}
                          onChange={(e) => setBookService(e.target.value)}
                          className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                        >
                          {SERVICE_OPTIONS.map((o) => (
                            <option key={o} value={o} className="bg-zinc-900">
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-zinc-500">
                          Registration
                        </label>
                        <PlateInput
                          id="book"
                          value={bookReg}
                          onChange={handleBookPlateChange}
                          compact
                          focused={plateFocus === "book"}
                          onFocus={handleBookPlateFocus}
                          onBlur={handlePlateBlur}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-zinc-500">
                          Estimated duration
                        </label>
                        <select
                          value={bookDuration}
                          onChange={(e) => setBookDuration(e.target.value)}
                          className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                        >
                          {BOOKING_DURATIONS.map((d) => (
                            <option key={d.value} value={d.value} className="bg-zinc-900">
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-zinc-500">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={bookDate}
                          onChange={(e) => setBookDate(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white focus:border-cyan/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-zinc-500">
                          Time
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_SLOTS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setBookSlot(t)}
                              className={`rounded-xl border py-2.5 text-sm transition ${
                                bookSlot === t
                                  ? "border-cyan bg-cyan/10 font-medium text-cyan"
                                  : "border-white/10 text-zinc-400 hover:border-white/20"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-500">
                            Your name *
                          </label>
                          <input
                            type="text"
                            required
                            value={bookName}
                            onChange={(e) => setBookName(e.target.value)}
                            className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs text-zinc-500">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={bookPhone}
                            onChange={(e) => setBookPhone(e.target.value)}
                            className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-zinc-500">
                          Email
                        </label>
                        <input
                          type="email"
                          value={bookEmail}
                          onChange={(e) => setBookEmail(e.target.value)}
                          className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-glow w-full rounded-full py-3.5 text-sm font-semibold text-black"
                      >
                        Submit booking request
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="relative py-24 sm:py-32">
          <SectionGlow position="bottom" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan">
                Contact
              </p>
              <h2 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl">
                Visit the workshop
              </h2>
              <p className="mt-4 text-base text-zinc-400">
                We&apos;re here for all your car repair and maintenance needs in
                Southampton. Call, book online, or send a message — our friendly team
                will get back to you as soon as possible.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: MapPin,
                  label: "Address",
                  value: `${BUSINESS.name}\n${BUSINESS.address}`,
                  href: BUSINESS.mapsHref,
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: PHONE,
                  href: PHONE_HREF,
                },
                {
                  icon: Mail,
                  label: "Email",
                  value: EMAIL,
                  href: `mailto:${EMAIL}`,
                },
                {
                  icon: Clock,
                  label: "Hours",
                  value: `${BUSINESS.hours}\n${BUSINESS.hoursDetail}`,
                },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card rounded-2xl p-6"
                >
                  <c.icon className="h-5 w-5 text-cyan" />
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    {c.label}
                  </p>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="mt-2 block whitespace-pre-line text-sm text-white transition hover:text-cyan"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-2 whitespace-pre-line text-sm text-white">
                      {c.value}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={onContactSubmit}
                className="premium-panel space-y-4 rounded-2xl p-6 sm:p-8"
              >
                <p className="text-sm font-medium text-white">Send us a message</p>
                {contactSent ? (
                  <p className="text-sm text-cyan">
                    Thank you — we&apos;ll be in touch shortly.
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                    />
                    <input
                      type="email"
                      placeholder="Your email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
                    />
                    <textarea
                      required
                      rows={4}
                      placeholder="Your message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="input-premium w-full resize-none rounded-xl px-4 py-3 text-sm text-white"
                    />
                    <button
                      type="submit"
                      className="btn-glow w-full rounded-full py-3 text-sm font-semibold text-black"
                    >
                      Send message
                    </button>
                  </>
                )}
              </motion.form>
              <motion.a
                href={BUSINESS.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="premium-panel flex min-h-48 flex-col items-center justify-center rounded-2xl p-8 text-center transition hover:border-cyan/30 sm:min-h-56"
              >
                <MapPin className="h-8 w-8 text-cyan" />
                <p className="mt-4 text-sm font-medium text-white">Get directions</p>
                <p className="mt-2 text-sm text-zinc-400">{BUSINESS.address}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-cyan">
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3" />
                </span>
              </motion.a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/10 bg-gradient-to-b from-transparent to-zinc-950/80 pb-32 pt-16 sm:pb-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
            <div>
              <DanAutoCentreLogo variant="sm" href="#" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
                {BUSINESS.tagline}. MOT, servicing, diagnostics, and repairs for
                cars and vans across Southampton.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-7 gap-y-2">
              {isLocalizedExperience ? (
                <button
                  type="button"
                  onClick={returnToEnglish}
                  className="text-sm text-amber-200/90 transition hover:text-amber-100"
                >
                  {messages.returnToEnglish}
                </button>
              ) : (
                FOOTER_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-sm text-zinc-400 transition hover:text-amber-200/90"
                  >
                    {l.label}
                  </a>
                ))
              )}
            </nav>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Dan Auto. All rights reserved.</p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="/admin" className="transition hover:text-cyan">
                Admin
              </a>
              <span>Privacy · Terms · Cookies</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ── Sticky mobile CTA ── */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-500/20 bg-black/95 p-3 shadow-[0_-12px_48px_rgba(201,162,39,0.1)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <a
            href={PHONE_HREF}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 py-3 text-xs font-medium text-white sm:text-sm"
          >
            <Phone className="h-4 w-4 text-amber-400/90" />
            Call
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-medium text-emerald-300 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="#booking"
            className="btn-glow flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold text-black sm:text-sm"
          >
            <Calendar className="h-4 w-4" />
            Book
          </a>
        </div>
      </motion.div>
    </>
  );
}

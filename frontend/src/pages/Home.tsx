import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Clock, MapPin, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatEventDateLong, formatEventTime } from '@/lib/eventFormat';
import { useEventsStore } from '@/stores/eventsStore';

type SectionKey = 'home' | 'about' | 'ministries' | 'events' | 'contact';

type PublicEventItem = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
};

type MinistryItem = {
  id: string;
  name: string;
  imageUrl: string;
};

const heroImageUrl =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20church%20interior%2C%20warm%20natural%20light%20through%20large%20windows%2C%20soft%20blue%20and%20beige%20color%20tones%2C%20peaceful%20welcoming%20atmosphere%2C%20high%20ceiling%2C%20wood%20details%2C%20photorealistic%2C%20wide%20angle%2C%20cinematic%20composition%2C%20clean%20modern%20architecture%2C%20no%20text%2C%20no%20logos%2C%20high%20detail%2C%20natural%20colors&image_size=landscape_16_9';

// Fallback gradient for when images fail to load
const ministryFallback = 'from-navy-500 via-navy-600 to-navy-700';

const ministryImages: Record<string, string> = {
  youth:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=church%20youth%20ministry%20group%20activity%2C%20diverse%20teenagers%20smiling%2C%20warm%20indoor%20lighting%2C%20soft%20blue%20and%20green%20tones%2C%20friendly%20community%20moment%2C%20photorealistic%2C%20no%20text%2C%20no%20logos%2C%20shallow%20depth%20of%20field%2C%20high%20detail&image_size=portrait_4_3',
  worship:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=worship%20team%20on%20stage%20in%20a%20modern%20church%2C%20guitar%20and%20microphone%2C%20soft%20spotlights%2C%20calm%20blue%20and%20beige%20palette%2C%20reverent%20atmosphere%2C%20photorealistic%2C%20no%20text%2C%20no%20logos%2C%20high%20detail&image_size=portrait_4_3',
  children:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=children%20ministry%20classroom%20in%20a%20church%2C%20safe%20warm%20welcoming%20space%2C%20kids%20craft%20table%2C%20soft%20green%20and%20beige%20colors%2C%20photorealistic%2C%20no%20text%2C%20no%20logos%2C%20high%20detail&image_size=portrait_4_3',
  outreach:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=church%20outreach%20volunteers%20serving%20community%2C%20food%20drive%20table%2C%20friendly%20smiles%2C%20soft%20blue%20and%20green%20tones%2C%20warm%20natural%20light%2C%20photorealistic%2C%20no%20text%2C%20no%20logos%2C%20high%20detail&image_size=portrait_4_3',
};

function useSectionRefs() {
  const homeRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);
  const ministriesRef = useRef<HTMLDivElement | null>(null);
  const eventsRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  const refs = useMemo(
    () => ({
      home: homeRef,
      about: aboutRef,
      ministries: ministriesRef,
      events: eventsRef,
      contact: contactRef,
    }),
    []
  );

  const scrollTo = (key: SectionKey) => {
    const node = refs[key].current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { refs, scrollTo };
}

export default function Home() {
  const navigate = useNavigate();
  const { refs, scrollTo } = useSectionRefs();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [ministryImageErrors, setMinistryImageErrors] = useState<Record<string, boolean>>({});

  const adminEvents = useEventsStore((s) => s.events);

  const upcomingEvents: PublicEventItem[] = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return adminEvents
      .filter((e) => e.status !== 'Cancelled')
      .filter((e) => {
        const eventDay = new Date(`${e.date}T00:00:00`);
        return eventDay.getTime() >= startOfToday.getTime();
      })
      .sort((a, b) => {
        const aKey = `${a.date}T${a.time || '00:00'}:00`;
        const bKey = `${b.date}T${b.time || '00:00'}:00`;
        return Date.parse(aKey) - Date.parse(bKey);
      })
      .map((e) => ({
        id: e.id,
        name: e.name,
        date: formatEventDateLong(e.date),
        time: formatEventTime(e.time),
        location: e.location,
      }));
  }, [adminEvents]);

  const ministries: MinistryItem[] = [
    { id: 'youth', name: 'Youth', imageUrl: ministryImages.youth },
    { id: 'worship', name: 'Worship', imageUrl: ministryImages.worship },
    { id: 'children', name: 'Children', imageUrl: ministryImages.children },
    { id: 'outreach', name: 'Outreach', imageUrl: ministryImages.outreach },
  ];

  const onNav = (key: SectionKey) => {
    setMobileOpen(false);
    scrollTo(key);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onNav('home')}
            className="flex items-center gap-3"
            aria-label="JHTM Church"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500" />
            <div className="text-left">
              <p className="text-sm font-extrabold tracking-tight text-slate-900">JHTM Church</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Welcome Home
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-6 text-sm font-semibold text-slate-700">
              <button type="button" className="hover:text-sky-700" onClick={() => onNav('home')}>
                Home
              </button>
              <button type="button" className="hover:text-sky-700" onClick={() => onNav('about')}>
                About
              </button>
              <button
                type="button"
                className="hover:text-sky-700"
                onClick={() => onNav('ministries')}
              >
                Ministries
              </button>
              <button type="button" className="hover:text-sky-700" onClick={() => onNav('events')}>
                Events
              </button>
              <button type="button" className="hover:text-sky-700" onClick={() => onNav('contact')}>
                Contact
              </button>
            </nav>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full bg-navy-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-navy-800"
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full bg-navy-900 px-3 py-2 text-sm font-bold text-white shadow-sm"
            >
              Login
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden">
            <div className="border-t border-slate-200/70 bg-white">
              <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">Menu</p>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-left font-semibold"
                  onClick={() => onNav('home')}
                >
                  Home
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-left font-semibold"
                  onClick={() => onNav('about')}
                >
                  About
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-left font-semibold"
                  onClick={() => onNav('ministries')}
                >
                  Ministries
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-left font-semibold"
                  onClick={() => onNav('events')}
                >
                  Events
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-50 px-4 py-3 text-left font-semibold"
                  onClick={() => onNav('contact')}
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={refs.home} />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroImageError ? (
            <div className="h-full w-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-black text-white">JHTM Church</p>
                <p className="text-sm font-medium text-white/70">Welcome Home</p>
              </div>
            </div>
          ) : (
            <img 
              src={heroImageUrl} 
              alt="JHTM Church" 
              className="h-full w-full object-cover"
              onError={() => setHeroImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-900/45 to-slate-900/25" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
              Growing together as a family of faith
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Welcome to JHTM Church
            </h1>
            <p className="mt-4 text-lg font-semibold text-white/90">
              Growing in Faith, Serving in Love
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => scrollTo('contact')}
                className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:ring-offset-2"
              >
                Join Us for Worship
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-full border border-navy/30 bg-white px-6 py-3 text-sm font-medium text-navy shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:ring-offset-2"
              >
                New Here? Get Started
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Sunday Service
                </p>
                <p className="mt-2 text-lg font-extrabold text-white">10:00 AM</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Mid-week Prayer
                </p>
                <p className="mt-2 text-lg font-extrabold text-white">Wednesdays 7:30 PM</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">Location</p>
                <p className="mt-2 text-lg font-extrabold text-white">JHTM Campus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={refs.about} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            A Church You Can Call Home
          </h2>
          <p className="mt-3 text-slate-600">
            We exist to help people meet Jesus, grow in discipleship, and live out their faith in
            daily life. Our community is welcoming, multi-generational, and focused on serving with
            joy.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Mission</p>
            <p className="mt-3 text-lg font-extrabold text-slate-900">
              Make disciples who love God and people
            </p>
            <p className="mt-3 text-slate-600">
              We gather for worship, grow through Scripture, and go into our community with
              compassion and practical help.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Vision</p>
            <p className="mt-3 text-lg font-extrabold text-slate-900">
              A thriving, serving church for every generation
            </p>
            <p className="mt-3 text-slate-600">
              We envision a church family rooted in faith, united in love, and equipped to bring
              hope to our city and beyond.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#9a7c3a]">Core Values</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-semibold">Biblical teaching and Christ-centered worship</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span className="font-semibold">
                  Authentic community and intentional discipleship
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#d2b36b]" />
                <span className="font-semibold">
                  Generosity, service, and mission to our neighbors
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section ref={refs.events} className="bg-white/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Upcoming Events</h2>
              <p className="mt-2 text-slate-600">
                Stay connected with what’s happening at JHTM Church.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllEvents((v) => !v)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {showAllEvents ? 'Show Less' : 'See All Events'}
            </button>
          </div>

          <div className="relative mt-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/80 to-transparent" />
            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {upcomingEvents.slice(0, 4).map((e, idx) => (
                <div
                  key={e.id}
                  className={
                    'min-w-[280px] snap-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ' +
                    'hover:-translate-y-0.5 hover:shadow-md ' +
                    (idx === 0 ? 'ring-2 ring-emerald-200 animate-pulse' : '')
                  }
                >
                  <p className="text-sm font-extrabold text-slate-900">{e.name}</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-sky-700" />
                      <span className="font-semibold">{e.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-emerald-700" />
                      <span className="font-semibold">{e.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#9a7c3a]" />
                      <span className="font-semibold">{e.location}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="min-w-[240px] snap-start rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5">
                <p className="text-sm font-extrabold text-slate-900">More gatherings</p>
                <p className="mt-2 text-sm text-slate-600">
                  Explore all upcoming church activities and community outreach.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllEvents(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  See All Events
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {showAllEvents && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-lg font-extrabold text-slate-900">All Upcoming Events</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Event
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Time
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{e.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{e.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{e.time}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{e.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <section ref={refs.ministries} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Our Ministries</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            There’s a place for everyone to grow, serve, and build lasting relationships.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ministries.map((m) => (
            <div
              key={m.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-40 overflow-hidden">
                {ministryImageErrors[m.id] ? (
                  <div className={`h-full w-full bg-gradient-to-br ${ministryFallback} flex items-center justify-center`}>
                    <span className="text-2xl font-black text-white/80">{m.name.charAt(0)}</span>
                  </div>
                ) : (
                  <img
                    src={m.imageUrl}
                    alt={m.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={() => setMinistryImageErrors(prev => ({ ...prev, [m.id]: true }))}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/15 to-transparent" />
              </div>
              <div className="p-5">
                <p className="text-lg font-extrabold text-slate-900">{m.name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Connect, grow, and serve through dedicated gatherings and mentorship.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer ref={refs.contact} className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <p className="text-lg font-extrabold">JHTM Church</p>
              <p className="mt-3 text-sm text-white/75">
                Growing in Faith, Serving in Love. We’d love to welcome you this weekend.
              </p>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-white/80">
                Contact
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/75">
                <p>123 Faith Avenue, City Center</p>
                <p>+1 (555) 010-2026</p>
                <p>info@jhtmchurch.com</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-white/80">
                Social
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <a
                  className="block text-white/75 hover:text-white"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
                <a
                  className="block text-white/75 hover:text-white"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  className="block text-white/75 hover:text-white"
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60">
            © 2026 JHTM Church
          </div>
        </div>
      </footer>
    </div>
  );
}

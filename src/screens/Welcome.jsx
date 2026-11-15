import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { Activities as CompassIcon, Tribes as TribesIcon, Market as MarketIcon, Check } from "../components/Icons.jsx";

// Public marketing page (/welcome): the link for bios, posts and ads. Full-width, outside
// PhoneFrame. The web beta is open, so the call to action goes straight to sign-up rather
// than to a waitlist. Copy only claims what the app actually does today (no invented user
// counts or testimonials) — keep it that way when editing.

const FEATURES = [
  { Icon: CompassIcon, title: "Find partners near you",
    body: "Browse hikes, climbs, paddles and rides on a list or map. Filter by distance and skill level, then tap Join." },
  { Icon: TribesIcon, title: "Join a tribe",
    body: "Crews for your sport, your spot or your level, each with its own group chat. Or start one and invite your people." },
  { Icon: MarketIcon, title: "Buy and sell gear",
    body: "A marketplace built for outdoor gear, from people who actually use it." },
];

const SAFETY = [
  "Trip plans: log where you're going and when you'll be back. Miss your return time and ROAMR prompts you to check in.",
  "Control who can message you: everyone, people you follow, verified members only, or women only.",
  "Report and block work everywhere: feeds, DMs and group chats.",
  "Emergency and medical info stay private to you.",
];

const STEPS = [
  { n: "1", title: "Build your profile", body: "Pick your sports, your skill level and your home base." },
  { n: "2", title: "Find your people", body: "Join an activity or a tribe near you, or post your own plan." },
  { n: "3", title: "Get outside", body: "Chat, agree the plan, log a trip plan, go." },
];

function Cta({ className = "" }) {
  return (
    <Link to="/login"
      className={`inline-flex items-center justify-center min-h-[52px] px-8 rounded-2xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold text-lg shadow-lg transition ${className}`}>
      Join the free beta
    </Link>
  );
}

export default function Welcome() {
  return (
    <div className="min-h-full bg-white text-ink">
      {/* Hero */}
      <header className="relative text-white">
        <img src="/img/splash-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />
        <div className="relative max-w-6xl mx-auto px-6">
          <nav className="flex items-center justify-between py-5" aria-label="Main">
            <Logo size={40} wordClass="text-white" />
            <Link to="/login" className="text-sm font-semibold rounded-full border border-white/60 px-4 py-2 hover:bg-white/10">
              Sign in
            </Link>
          </nav>
          <div className="py-20 sm:py-28 max-w-2xl">
            <p className="inline-block text-xs font-semibold uppercase tracking-wider bg-brand-navy/80 rounded-full px-3 py-1 mb-5">
              Open beta · free
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] mb-5">
              Find your tribe.<br />Get outside.
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl">
              ROAMR connects you with people near you who hike, climb, paddle, ride and ski at your level, with safety tools built in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Cta />
              <a href="#how" className="text-white/90 font-semibold underline underline-offset-4 sm:ml-4">See how it works</a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="features-h">
          <h2 id="features-h" className="text-3xl sm:text-4xl font-extrabold text-brand-navy max-w-xl mb-12">
            Everything you need to stop going alone
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <article key={title} className="rounded-3xl bg-brand-tint p-7">
                <span className="w-12 h-12 rounded-2xl bg-brand-navy text-brand-greenBright grid place-items-center mb-5">
                  <Icon className="w-6 h-6" />
                </span>
                <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
                <p className="text-[15px] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Safety */}
        <section className="bg-brand-navy text-white" aria-labelledby="safety-h">
          <div className="max-w-6xl mx-auto px-6 py-20 grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-brand-greenBright font-semibold uppercase tracking-wider text-sm mb-3">Safety first</p>
              <h2 id="safety-h" className="text-3xl sm:text-4xl font-extrabold mb-4">Meeting strangers outdoors should feel safe</h2>
              <p className="text-white/80 text-lg">
                So the safety tools aren&apos;t an afterthought. They&apos;re in the app from day one.
              </p>
            </div>
            <ul className="space-y-4">
              {SAFETY.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-brand-greenBright text-brand-navy grid place-items-center">
                    <Check className="w-4 h-4" />
                  </span>
                  <span className="text-white/90">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="how-h">
          <h2 id="how-h" className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-12">How it works</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="text-5xl font-extrabold text-brand-green">{s.n}</span>
                <h3 className="text-xl font-bold text-brand-navy mt-2 mb-1">{s.title}</h3>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto rounded-3xl bg-brand-tint px-8 py-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-3">Your next adventure needs a crew</h2>
            <p className="text-muted text-lg mb-8">Free during the beta. Works in your browser; iOS and Android apps are on the way.</p>
            <Cta />
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-muted">
          <Logo size={28} />
          <nav className="flex gap-6" aria-label="Legal">
            <Link to="/legal/terms" className="hover:text-brand-navy">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-brand-navy">Privacy</Link>
          </nav>
          <p>© {new Date().getFullYear()} ROAMR</p>
        </div>
      </footer>
    </div>
  );
}

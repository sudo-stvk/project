import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Network,
  FileText,
  Sparkles,
  Lock,
  Command,
  MoveUpRight,
} from "lucide-react";
import { Brand } from "../components/common/UI";
import Orb from "../components/reactbits/Orb";
import Aurora from "../components/reactbits/Aurora";
import DecryptedText from "../components/reactbits/DecryptedText";
import BlurText from "../components/reactbits/BlurText";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import KnowledgeGraph from "../components/graph/KnowledgeGraph";
import { useApp } from "../context/AppContext";
const demo = {
  nodes: [
    "A spark of an idea",
    "Creative thinking",
    "Patterns",
    "Learning",
    "New possibilities",
    "A better question",
    "Your next project",
    "Unexpected links",
  ].map((title, i) => ({
    id: String(i),
    title,
    color: ["#A78BFA", "#22D3EE", "#F472B6"][i % 3],
    degree: i === 0 ? 5 : 2,
  })),
  links: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 6],
    [1, 5],
    [2, 7],
    [3, 6],
    [4, 7],
  ].map(([a, b], i) => ({
    id: String(i),
    source: String(a),
    target: String(b),
    relationType: "relates_to",
  })),
};
export default function Landing() {
  const { user } = useApp(),
    reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      user?.settings.reducedMotion ||
      user?.settings.animationIntensity === "off";
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav>
          <a href="#possibilities">The possibilities</a>
          <a href="#connected">A connected mind</a>
        </nav>
        <div>
          <Link className="login-link" to="/login">
            Sign in
          </Link>
          <Link
            className="button small-button"
            to={user ? "/app" : "/register"}
          >
            Enter your mind
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-grid" />
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow">
              <span className="online-dot" />A SECOND BRAIN. A NEW PERSPECTIVE.
            </div>
            <h1>
              {reduced ? (
                "Your Mind,"
              ) : (
                <BlurText text="Your Mind," delay={120} />
              )}
              <span className="hero-connected">Connected.</span>
            </h1>
            <p>
              Ideas aren’t meant to live in isolation.
              <br />
              Give your thoughts a home. Discover the connections
              <br className="desktop-break" /> that turn what you know into
              what’s next.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to={user ? "/app" : "/register"}>
                Enter Your Mind
                <ArrowRight size={18} />
              </Link>
              <a className="button ghost" href="#possibilities">
                Explore Features
                <MoveUpRight size={17} />
              </a>
            </div>
            <div className="hero-footnote">
              <Lock size={13} />
              <span>Your ideas. Your space. Entirely yours.</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="orb-fallback" />
            {!reduced && (
              <Orb
                colors={["#A78BFA", "#22D3EE", "#574496"]}
                backgroundColor="#0A0B10"
                speed={0.3}
                glow={0.7}
                bleed={0.4}
                hoverIntensity={0.3}
                dpr={1.4}
              />
            )}
            <span className="orb-caption top">
              <i />A thought becomes a possibility.
            </span>
            <span className="floating-note floating-note-one">
              <FileText size={15} />
              An idea worth keeping<span>↗</span>
            </span>
            <span className="floating-note floating-note-two">
              <Network size={16} />
              Everything is connected.
            </span>
            <span className="orb-caption bottom">
              01 — YOUR NEURAL UNIVERSE
            </span>
          </div>
          <div className="hero-bottom">
            <span>LESS COLLECTING. MORE CONNECTING.</span>
            <a href="#possibilities">SCROLL TO EXPLORE ↓</a>
          </div>
        </section>
        <section className="feature-section" id="possibilities">
          <div className="feature-heading">
            <div>
              <div className="eyebrow">BEYOND THE NOTE</div>
              <h2>
                A place for your thoughts.
                <br />
                And the space between them.
              </h2>
            </div>
            <p>
              Not another place to forget what you saved.
              <br />A living system that grows with your curiosity.
            </p>
          </div>
          <div className="feature-grid">
            <SpotlightCard
              className="feature-card feature-large"
              spotlightColor="#A78BFA"
            >
              <div className="feature-number">01 / SEE THE BIGGER PICTURE</div>
              <Network size={27} />
              <h3>Think in connections.</h3>
              <p>
                Turn scattered notes into an interactive landscape. Explore
                relationships, follow a thread, and find your way to a new
                perspective.
              </p>
              <div className="marketing-graph">
                <KnowledgeGraph data={demo} preview reducedMotion={reduced} />
              </div>
              <span className="demo-label">Illustrative graph preview</span>
            </SpotlightCard>
            <SpotlightCard className="feature-card" spotlightColor="#22D3EE">
              <div className="feature-number">02 / CAPTURE THE SPARK</div>
              <FileText size={26} />
              <h3>Room to think clearly.</h3>
              <p>
                A quiet Markdown editor. Tags that make sense. Notes that save
                as you think.
              </p>
              <div className="mini-editor">
                <span>THE BEGINNING OF SOMETHING</span>
                <strong>What if ideas could find each other?</strong>
                <p>Sometimes all it takes is a different way of looking.</p>
                <div>
                  <span># curiosity</span>
                  <span># possibilities</span>
                </div>
                <small>✓ All changes saved</small>
              </div>
            </SpotlightCard>
            <SpotlightCard className="feature-card" spotlightColor="#F472B6">
              <div className="feature-number">03 / FOLLOW YOUR CURIOSITY</div>
              <Sparkles size={26} />
              <h3>Find the unexpected.</h3>
              <p>
                Discover shared words and themes across your notes. Understand
                every suggestion. Make every connection your own.
              </p>
              <div className="mini-match">
                <div>
                  <span>Creative thinking</span>
                  <span>↕</span>
                  <span>A better question</span>
                </div>
                <small>Shared tags: curiosity, learning</small>
              </div>
            </SpotlightCard>
          </div>
        </section>
        <section className="connected-section" id="connected">
          <div className="ambient-aurora">
            {!reduced && (
              <Aurora
                colorStops={["#393366", "#665096", "#24424C"]}
                amplitude={0.7}
                speed={0.3}
                opacity={0.4}
                dpr={1}
              />
            )}
          </div>
          <div className="eyebrow">THINK FREELY. CONNECT INTENTIONALLY.</div>
          <h2>
            Your next great idea
            <br />
            might be between two others.
          </h2>
          <p>Start with one thought. See where it takes you.</p>
          <Link className="button primary" to={user ? "/app" : "/register"}>
            Build your second brain
            <ArrowRight size={18} />
          </Link>
          <div className="trust-row">
            <span>
              <Lock size={16} />
              Private workspace
            </span>
            <span>
              <Network size={16} />
              Real connections
            </span>
            <span>
              <Command size={16} />
              Built for your flow
            </span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="footer-wordmark">
          {reduced ? (
            "NEURON"
          ) : (
            <DecryptedText text="NEURON" animateOn="view" speed={70} />
          )}
        </div>
        <div>
          <span>Your Mind, Connected.</span>
          <span>A little curiosity goes a long way.</span>
          <Link to="/register">Make your first connection ↗</Link>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Icon, YouConnectGlyph } from "@/components/atoms";
import { useSessionStore } from "@/store";
import { useDemoStore } from "@/store/demo.store";
import { DEMO_ENABLED } from "@/lib/demo";
import "../emails/emails.css";
import {
  demoPersonas,
  PERSONA_GROUP_LABEL,
  type PersonaGroup,
} from "@/data/seed/demo-personas.seed";

/**
 * Entry fork (demo launcher) — mimics the two ways into Parachute:
 *  • Embedded (J1): arrive from YouConnect for a single document → YC mock →
 *    SSO interstitial → embedded run flow that returns to YouConnect on sign.
 *  • Standalone (J3): sign in to the full app (dashboard, queue, settings).
 */
export default function StartPage() {
  const router = useRouter();
  const reset = useSessionStore((s) => s.reset);

  // The two original entry cards also pin the identity (Meridian), so a previous
  // persona (e.g. a trial org) does not leak into them.
  const goEmbedded = async () => {
    await useDemoStore.getState().apply("enterprise-yc");
    router.push("/youconnect");
  };
  const goStandalone = async () => {
    await useDemoStore.getState().apply("returning");
    reset(); // ensure full mode
    router.push("/auth/sign-in");
  };
  const pickPersona = async (id: string) => {
    const persona = await useDemoStore.getState().apply(id);
    if (persona) router.push(persona.entryRoute);
  };
  const groups: PersonaGroup[] = ["signup", "signed_in", "yc"];

  return (
    <div className="start">
      <motion.div
        className="start-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Logo full height={30} themeAware />
        <h1 className="start-title">How are you opening Parachute?</h1>
        <p className="start-sub">
          A demo launcher for the two entry paths. Real users land in one or the
          other automatically.
        </p>

        <div className="start-options">
          <button className="start-opt" onClick={goEmbedded}>
            <span className="start-opt-ic">
              <YouConnectGlyph size={20} />
            </span>
            <span className="start-opt-body">
              <span className="start-opt-title">Enter from YouConnect</span>
              <span className="start-opt-desc">
                Embedded — review a single appraisal, result returns to YouConnect.
              </span>
            </span>
            <Icon name="chevron-right" size={18} />
          </button>

          <button className="start-opt" onClick={goStandalone}>
            <span className="start-opt-ic">
              <Icon name="parachute" size={19} />
            </span>
            <span className="start-opt-body">
              <span className="start-opt-title">Standalone sign-in</span>
              <span className="start-opt-desc">
                The full app — dashboard, your queue, templates and settings.
              </span>
            </span>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        {DEMO_ENABLED &&
          groups.map((g) => (
            <section key={g} className="start-group" aria-label={PERSONA_GROUP_LABEL[g]}>
              <h2 className="start-group-title">{PERSONA_GROUP_LABEL[g]}</h2>
              <div className="start-options">
                {demoPersonas
                  .filter((p) => p.group === g)
                  .map((p) => (
                    <button key={p.id} className="start-opt start-opt--sm" onClick={() => pickPersona(p.id)}>
                      <span className="start-opt-ic">
                        <Icon name={p.icon} size={17} />
                      </span>
                      <span className="start-opt-body">
                        <span className="start-opt-title">{p.label}</span>
                        <span className="start-opt-desc">{p.description}</span>
                      </span>
                      <Icon name="chevron-right" size={16} />
                    </button>
                  ))}
              </div>
            </section>
          ))}

        {DEMO_ENABLED && (
          <p className="em-startlink">
            <Link href="/emails">E-mail previews</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}

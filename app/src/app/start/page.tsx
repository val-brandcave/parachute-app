"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Icon, YouConnectGlyph } from "@/components/atoms";
import { useSessionStore } from "@/store";

/**
 * Entry fork (demo launcher) — mimics the two ways into Parachute:
 *  • Embedded (J1): arrive from YouConnect for a single document → YC mock →
 *    SSO interstitial → embedded run flow that returns to YouConnect on sign.
 *  • Standalone (J3): sign in to the full app (dashboard, queue, settings).
 */
export default function StartPage() {
  const router = useRouter();
  const reset = useSessionStore((s) => s.reset);

  const goEmbedded = () => router.push("/youconnect");
  const goStandalone = () => {
    reset(); // ensure full mode
    router.push("/login");
  };

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
              <Icon name="rocket" size={19} />
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
      </motion.div>
    </div>
  );
}

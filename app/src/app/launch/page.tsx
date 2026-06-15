"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

/**
 * Interstitial handoff from YouConnect → Parachute (the "Transferring you to…"
 * pattern Cody referenced). Simulates the SSO pass-through, then lands in-app.
 */
export default function LaunchPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const steps = [
    "Establishing secure session…",
    "Verifying single sign-on…",
    "Loading your reviews…",
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => router.push("/dashboard"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [router]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg,#0d2a3d 0%,#10344C 50%,#1b4f73 100%)",
        color: "#fff",
      }}
    >
      <div style={{ textAlign: "center", width: 360 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 13, opacity: 0.7 }}>YouConnect</span>
          <motion.span
            className="material-icons"
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            style={{ opacity: 0.7 }}
          >
            arrow_forward
          </motion.span>
          <Logo variant="white" full height={22} />
        </div>

        <div
          style={{
            height: 4,
            background: "rgba(255,255,255,.18)",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.3, ease: "easeInOut" }}
            style={{ height: "100%", background: "var(--md-secondary)" }}
          />
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 13.5, opacity: 0.85 }}
        >
          {steps[step]}
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Icon, MicrosoftGlyph, YouConnectGlyph } from "@/components/atoms";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("reviewer@demobank.example");
  const [password, setPassword] = useState("••••••••••");

  const signIn = () => router.push("/dashboard");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 24,
        overflow: "hidden",
        background:
          "radial-gradient(115% 75% at 50% -10%, var(--md-accent-c) 0%, transparent 55%), radial-gradient(135% 120% at 50% 50%, transparent 60%, rgba(16,24,33,0.05) 100%), var(--md-bg)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 1,
          width: 408,
          maxWidth: "100%",
          background: "var(--md-surface)",
          border: "1px solid var(--md-outline-v)",
          borderRadius: 16,
          boxShadow: "var(--md-elev-2)",
          padding: "36px 34px 28px",
        }}
      >
        <Logo full height={30} themeAware />
        <h1
          style={{
            fontSize: 19,
            fontWeight: 700,
            margin: "20px 0 4px",
            letterSpacing: "-0.01em",
          }}
        >
          Sign in to your review workspace
        </h1>
        <div
          style={{ color: "var(--md-on-surface-t)", fontSize: 13, marginBottom: 22 }}
        >
          Use your organization’s single sign-on, or your work email.
        </div>

        {/* SSO first — YouConnect is the order platform reviewers arrive from */}
        <button className="sso sso--primary" onClick={signIn}>
          <YouConnectGlyph size={18} />
          Continue with YouConnect
        </button>
        <button className="sso" onClick={signIn}>
          <MicrosoftGlyph size={17} />
          Continue with Microsoft
        </button>
        <button className="sso" onClick={signIn}>
          <Icon name="sso" size={18} />
          Single sign-on
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--md-on-surface-t)",
            fontSize: 12,
            margin: "20px 0 18px",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--md-outline-v)" }} />
          or sign in with email
          <span style={{ flex: 1, height: 1, background: "var(--md-outline-v)" }} />
        </div>

        <div className="field">
          <label>Work email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            fontSize: 13,
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "var(--md-on-surface-v)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              style={{ width: 15, height: 15, accentColor: "var(--md-accent)" }}
            />
            Keep me signed in
          </label>
          <a
            href="#"
            style={{ color: "var(--md-accent-d)", fontWeight: 600 }}
          >
            Forgot password?
          </a>
        </div>

        <button
          className="btn btn-filled"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={signIn}
        >
          Sign in
        </button>
      </motion.div>
    </div>
  );
}

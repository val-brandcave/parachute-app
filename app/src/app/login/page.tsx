"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/atoms";

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
        background:
          "linear-gradient(135deg,#0d2a3d 0%,#10344C 50%,#1b4f73 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          width: 392,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "var(--md-elev-3)",
          padding: "38px 34px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <Logo variant="blue" full height={30} />
        </div>
        <div
          style={{ color: "var(--md-on-surface-v)", fontSize: 13, marginBottom: 26 }}
        >
          Appraisal review intelligence
        </div>

        <div className="field">
          <label>Work email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-filled"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={signIn}
        >
          Sign in
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--md-on-surface-v)",
            fontSize: 12,
            margin: "18px 0",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--md-outline-v)" }} />
          or continue with
          <span style={{ flex: 1, height: 1, background: "var(--md-outline-v)" }} />
        </div>

        <button className="sso" onClick={signIn}>
          <Icon name="brand-windows" size={18} />
          Microsoft SSO
        </button>
        <button className="sso" onClick={signIn}>
          <Icon name="brand-google" size={18} />
          Google Workspace
        </button>

        <div
          style={{
            marginTop: 18,
            fontSize: 11.5,
            color: "var(--md-on-surface-v)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Arriving from YouConnect?{" "}
          <a href="/launch" style={{ color: "var(--md-primary)", fontWeight: 600 }}>
            Continue via single sign-on
          </a>
        </div>
      </motion.div>
    </div>
  );
}

import { OnboardingFrame } from "@/components/organisms/onboarding";

/**
 * /welcome, /welcome/invite and /welcome/call share one persistent frame (card
 * shell, 2-segment progress bar, side panel, interstitial), so it can animate
 * its own height and panel between steps (motion-spec §2.2).
 */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingFrame>{children}</OnboardingFrame>;
}

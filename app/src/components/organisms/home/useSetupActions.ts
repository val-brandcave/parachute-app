import { useToast } from "@realwired/ui";

/** Placeholder handlers for the media and documents the prototype doesn't ship. */
export function useSetupActions() {
  const toast = useToast();
  return {
    playVideo: (label: string) =>
      toast({ title: label, description: "The video player arrives with the real guides.", tone: "info" }),
    openDoc: (label: string) =>
      toast({ title: label, description: "Downloads arrive with the real documents.", tone: "info" }),
    emailList: () =>
      toast({ title: "Setup list sent", description: "We emailed the remaining steps to you.", tone: "success" }),
    downloadPack: () =>
      toast({ title: "Security pack", description: "The zip download arrives with the real documents.", tone: "info" }),
    billing: () =>
      toast({ title: "Billing opens in Phase 3", description: "The wallet and top-up screens come next.", tone: "info" }),
  };
}

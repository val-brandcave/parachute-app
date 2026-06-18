import type { User } from "@/types";

// The review department is a team: the signed-in reviewer (user-001) plus
// teammates. The queue is a team view; "Mine only" filters to user-001.
export const seedUsers: User[] = [
  {
    id: "user-001",
    name: "Val Vinnakota",
    initials: "VV",
    designation: "Chief Appraiser, MAI",
    signatureName: "Val Vinnakota",
    role: "admin",
    createdAt: 1736928000000,
  },
  {
    id: "user-002",
    name: "Jordan Chen",
    initials: "JC",
    designation: "Senior Reviewer, MAI",
    signatureName: "Jordan Chen",
    role: "reviewer",
    createdAt: 1736928000000,
  },
  {
    id: "user-003",
    name: "Priya Natarajan",
    initials: "PN",
    designation: "Review Appraiser, MAI",
    signatureName: "Priya Natarajan",
    role: "reviewer",
    createdAt: 1736928000000,
  },
];

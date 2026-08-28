// Contrato único de enums, espelha GLOSSARY.md / schema.prisma — nunca diverge (fonte: DATABASE_SPEC.md / V3 §4)
export const Verdict = ["RECOMMEND", "EMERGENCY_ONLY", "NOT_RECOMMEND"] as const;
export type Verdict = (typeof Verdict)[number];

export const RecommendationStatus = ["WANT_TO_TRY", "EXPERIENCED", "DISCARDED"] as const;
export type RecommendationStatus = (typeof RecommendationStatus)[number];

export const SpaceRole = ["OWNER", "MEMBER"] as const;
export type SpaceRole = (typeof SpaceRole)[number];

export const PurchaseLinkKind = ["MARKETPLACE", "OFFICIAL_WEBSITE", "OTHER"] as const;
export type PurchaseLinkKind = (typeof PurchaseLinkKind)[number];

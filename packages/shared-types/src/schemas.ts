import { z } from "zod";
import { Verdict, RecommendationStatus, PurchaseLinkKind } from "./enums";

// Entidades e nomes seguem GLOSSARY.md — "Item"/"Wishlist" são termos banidos (INV-009).

export const createRecommendationSchema = z.object({
  name: z.string().min(1).max(160),
  categoryId: z.string().cuid().optional(),
  categoryName: z.string().min(1).max(80).optional(), // find-or-create — cadastro relâmpago não exige categoria pré-cadastrada
  description: z.string().max(2000).optional(),
  brandId: z.string().cuid().optional(),
  keywords: z.array(z.string().min(1)).default([]), // "quando preciso de..."
  status: z.enum(RecommendationStatus).default("EXPERIENCED"),
});
export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;

export const setVerdictSchema = z.object({
  verdict: z.enum(Verdict),
  rating: z.number().min(1).max(5),
});
export type SetVerdictInput = z.infer<typeof setVerdictSchema>;

export const linkPlaceSchema = z.object({
  placeId: z.string().cuid(),
  lastPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type LinkPlaceInput = z.infer<typeof linkPlaceSchema>;

export const addPriceEntrySchema = z.object({
  price: z.number().nonnegative(),
  paidAt: z.coerce.date().optional(),
});
export type AddPriceEntryInput = z.infer<typeof addPriceEntrySchema>;

export const addPurchaseLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(PurchaseLinkKind).default("OTHER"),
});
export type AddPurchaseLinkInput = z.infer<typeof addPurchaseLinkSchema>;

export const addExperienceSchema = z.object({
  placeId: z.string().cuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type AddExperienceInput = z.infer<typeof addExperienceSchema>;

export const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const dayHoursSchema = z
  .object({
    open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), // "HH:MM"
    close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .nullable(); // null = fechado nesse dia

export const openingHoursSchema = z.record(z.enum(DAYS_OF_WEEK), dayHoursSchema).optional();
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const createPlaceSchema = z.object({
  name: z.string().min(1).max(160),
  categoryId: z.string().cuid().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
  openingHours: openingHoursSchema,
});

export const updateProfileSchema = z.object({
  avatarUrl: z.string().min(1).nullable().optional(),
  name: z.string().min(1).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export type UpdatePlaceInput = Omit<Partial<CreatePlaceInput>, "latitude" | "longitude"> & {
  categoryName?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().optional(),
  description: z.string().optional(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  near: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).optional(),
  radius: z.coerce.number().positive().optional(),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// Paginação cursor-based — API_SPEC.md §Convenções (default 20, max 50)
export const paginationQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

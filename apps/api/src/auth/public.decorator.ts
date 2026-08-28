import { SetMetadata } from "@nestjs/common";

// Marca rotas que não exigem JWT (ex.: /auth/magic-link, /auth/callback).
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

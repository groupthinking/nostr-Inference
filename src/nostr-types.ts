import * as z from "zod";

export const PubkeySchema = z.string().length(64).regex(/^[0-9a-f]+$/);
export const IdSchema = z.string().length(64).regex(/^[0-9a-f]+$/);
export const AddrSchema = z.string().regex(/^[0-9a-f]{64}-\d+-[0-9a-f]{64}$|^naddr1/);
export const RelaySchema = z.string().url();

export const ETagSchema = z.tuple([z.literal("e"), IdSchema, RelaySchema.optional(), z.enum(["reply", "root"]).optional(), PubkeySchema.optional()]);
export const ImmetaTagSchema = z.array(z.string()).min(1);

export const BaseNostrEventSchema = z.object({
  id: IdSchema,
  pubkey: PubkeySchema,
  created_at: z.number().int().positive(),
  kind: z.number().int().nonnegative(),
  tags: z.array(z.array(z.string())),
  sig: z.string(),
  content: z.string(),
});

export const NostrEventSchema = z.discriminatedUnion("kind", [
  BaseNostrEventSchema.extend({ kind: z.literal(0), content: z.string() /* JSON */ }),
  BaseNostrEventSchema.extend({ kind: z.literal(1) }),
  BaseNostrEventSchema.extend({ kind: z.literal(20), tags: z.array(z.union([ImmetaTagSchema, z.any()])) }),
]);

export type NostrEvent = z.infer<typeof NostrEventSchema>;

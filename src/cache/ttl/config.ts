import { z } from 'zod';


export const ttlCacheConfigSchema = z.object({
    ttlMs: z.number().int()
});
export type TtlCacheConfig = z.infer<typeof ttlCacheConfigSchema>;

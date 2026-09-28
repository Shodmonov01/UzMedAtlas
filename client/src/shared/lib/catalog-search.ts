import { z } from "zod";

export const catalogSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  city: z.string().optional().catch(undefined),
  specialty: z.string().optional().catch(undefined),
  lang: z.string().optional().catch(undefined),
  sort: z.string().optional().catch(undefined),
  service: z.string().optional().catch(undefined),
  priceMin: z.string().optional().catch(undefined),
  priceMax: z.string().optional().catch(undefined),
  responseMax: z.string().optional().catch(undefined),
  medicalTourism: z.string().optional().catch(undefined),
});

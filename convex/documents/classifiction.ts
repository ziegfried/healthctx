import z from "zod";

export const classificationSchema = z.union([
  z.object({
    category: z.literal("testresults"),
    testType: z.union([
      z.literal("labs"),
      z.literal("imaging"),
      z.literal("physical"),
      z.literal("functional"),
      z.literal("other"),
    ]),
  }),
  z.object({
    category: z.literal("clinical-notes"),
    type: z.union([
      z.literal("health-summmary"),
      z.literal("visit-summary"),
      z.literal("discharge-instructions"),
      z.literal("prescription"),
      z.literal("referral"),
      z.literal("lab-order"),
      z.literal("medical-history"),
      z.literal("other"),
    ]),
  }),
  z.object({
    category: z.literal("insurance-document"),
  }),
  z.object({
    category: z.literal("non-medical"),
    explanation: z
      .string()
      .describe(
        "brief sentence on why this is not a medical document. keep it short.",
      ),
  }),
]);

export type Classification = z.infer<typeof classificationSchema>;

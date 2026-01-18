import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";
import { WeightUnit } from "../../prisma/generated/client/client";

export const recordWeightServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      weight: z.number().positive(),
      recordedAt: z.string().datetime().optional(),
      note: z.string().optional(),
    }),
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { weight: number; recordedAt?: string; note?: string };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
        select: { weightUnit: true },
      });
      const entry = await prisma.weightEntry.create({
        data: {
          userId: context.user.id,
          weight: data.weight,
          unit: user?.weightUnit ?? WeightUnit.lbs,
          recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
          note: data.note,
        },
      });
      return { success: true, entry };
    },
  );

export const getWeightHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const entries = await prisma.weightEntry.findMany({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
    return entries;
  });

export const deleteWeightEntryServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ entryId: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { entryId: string } }) => {
    const prisma = await getServerSidePrismaClient();
    const entry = await prisma.weightEntry.findFirst({
      where: { id: data.entryId, userId: context.user.id },
    });
    if (!entry) {
      return { success: false, error: "Entry not found" };
    }
    await prisma.weightEntry.delete({ where: { id: data.entryId } });
    return { success: true };
  });

export const getWeightUnitServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: { weightUnit: true },
    });
    return user?.weightUnit ?? WeightUnit.lbs;
  });

export const updateWeightUnitServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ unit: z.enum(["lbs", "kg"]) }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { unit: "lbs" | "kg" } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.user.update({
      where: { id: context.user.id },
      data: { weightUnit: data.unit as WeightUnit },
    });
    return { success: true };
  });

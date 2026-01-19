import { getFoodEntriesServerFn, getDailyNutritionServerFn } from "@/lib/nutrition.server";
import { queryOptions } from "@tanstack/react-query";

export const foodEntriesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["foodEntries", userId],
    queryFn: () => getFoodEntriesServerFn(),
  });

export const dailyNutritionQueryOptions = (userId: string, date: string) =>
  queryOptions({
    queryKey: ["dailyNutrition", userId, date],
    queryFn: () => getDailyNutritionServerFn({ data: { date } }),
  });

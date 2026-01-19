import { getFoodEntriesServerFn, getDailyNutritionServerFn } from "@/lib/nutrition.server";
import { queryOptions } from "@tanstack/react-query";

export const foodEntriesQueryOptions = () =>
  queryOptions({
    queryKey: ["foodEntries"],
    queryFn: () => getFoodEntriesServerFn(),
  });

export const dailyNutritionQueryOptions = (date: string) =>
  queryOptions({
    queryKey: ["dailyNutrition", date],
    queryFn: () => getDailyNutritionServerFn({ data: { date } }),
  });

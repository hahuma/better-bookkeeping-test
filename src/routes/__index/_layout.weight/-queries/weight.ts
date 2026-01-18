import { getWeightHistoryServerFn, getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const weightHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["weightHistory"],
    queryFn: () => getWeightHistoryServerFn(),
  });

export const weightUnitQueryOptions = () =>
  queryOptions({
    queryKey: ["weightUnit"],
    queryFn: () => getWeightUnitServerFn(),
  });

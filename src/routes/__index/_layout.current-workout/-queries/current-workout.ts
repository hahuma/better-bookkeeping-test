import { getCurrentWorkoutServerFn } from "@/lib/workouts.server";
import { getMovementsServerFn } from "@/lib/movements.server";
import { getLatestWeightServerFn, getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const currentWorkoutQueryOptions = () =>
  queryOptions({
    queryKey: ["current-workout"],
    queryFn: () => getCurrentWorkoutServerFn(),
  });

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovementsServerFn(),
  });

export const latestWeightQueryOptions = () =>
  queryOptions({
    queryKey: ["latestWeight"],
    queryFn: () => getLatestWeightServerFn(),
  });

export const weightUnitQueryOptions = () =>
  queryOptions({
    queryKey: ["weightUnit"],
    queryFn: () => getWeightUnitServerFn(),
  });

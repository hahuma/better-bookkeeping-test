import { getWorkoutHistoryServerFn } from "@/lib/workouts.server";
import { getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const workoutHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["workout-history"],
    queryFn: () => getWorkoutHistoryServerFn(),
  });

export const weightUnitQueryOptions = () =>
  queryOptions({
    queryKey: ["weightUnit"],
    queryFn: () => getWeightUnitServerFn(),
  });

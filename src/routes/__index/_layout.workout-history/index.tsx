import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { deleteWorkoutsServerFn } from "@/lib/workouts.server";
import { Trash2 } from "lucide-react";
import { workoutHistoryQueryOptions } from "./-queries/workout-history";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  calculateProgressionData,
  getUniqueMovements,
  getMetricLabel,
  type ProgressionMetric,
} from "./-utils/progression-data";

export const Route = createFileRoute("/__index/_layout/workout-history/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workoutHistoryQueryOptions());
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const queryClient = useQueryClient();
  const { data: workouts } = useSuspenseQuery(workoutHistoryQueryOptions());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [selectedMovement, setSelectedMovement] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<ProgressionMetric>("max_weight");
  const [selectedDays, setSelectedDays] = useState<number | null>(30);

  const chartMovements = getUniqueMovements(workouts);
  const chartData = calculateProgressionData(
    workouts,
    selectedMovement === "all" ? null : selectedMovement,
    selectedMetric,
    selectedDays,
  );

  const deleteWorkoutsMutation = useMutation({
    mutationFn: (workoutIds: string[]) => deleteWorkoutsServerFn({ data: { workoutIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutHistoryQueryOptions().queryKey });
      setSelectedWorkouts(new Set());
    },
  });

  // Get all unique movements across all workouts
  const uniqueMovements = Array.from(
    new Map(workouts.flatMap((w) => w.sets.map((s) => [s.movement.id, s.movement.name]))).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const toggleWorkout = (id: string) => {
    setSelectedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedWorkouts.size === workouts.length) {
      setSelectedWorkouts(new Set());
    } else {
      setSelectedWorkouts(new Set(workouts.map((w) => w.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedWorkouts.size === 0) return;
    deleteWorkoutsMutation.mutate(Array.from(selectedWorkouts));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Workout History</h1>
      </div>

      {workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Select
                data-testid="movement-select"
                value={selectedMovement}
                onChange={(e) => setSelectedMovement(e.target.value)}
                className="w-48"
              >
                <option value="all">All Movements</option>
                {chartMovements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Select
                data-testid="metric-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as ProgressionMetric)}
                className="w-48"
              >
                <option value="max_weight">Max Weight</option>
                <option value="total_reps">Total Reps</option>
                <option value="total_volume">Total Volume</option>
              </Select>
              <Select
                data-testid="days-select"
                value={selectedDays?.toString() ?? "all"}
                onChange={(e) => setSelectedDays(e.target.value === "all" ? null : parseInt(e.target.value, 10))}
                className="w-40"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </Select>
            </div>
            {chartData.length > 0 ? (
              <div data-testid="progression-chart" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis
                      domain={["dataMin - 5", "dataMax + 5"]}
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [value, getMetricLabel(selectedMetric)]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={{ fill: "#0f172a", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#0f172a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No data for selected filters</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Completed Workouts</CardTitle>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedWorkouts.size === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteWorkoutsMutation.isPending ? "Deleting..." : `Delete Selected (${selectedWorkouts.size})`}
          </Button>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-sm text-slate-500">No completed workouts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedWorkouts.size === workouts.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Sets</th>
                    {uniqueMovements.map(([id, name]) => (
                      <th key={id} className="text-right py-3 px-4 font-medium text-slate-600">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => {
                    const setsByMovement = new Map<string, typeof workout.sets>();
                    workout.sets.forEach((set) => {
                      const existing = setsByMovement.get(set.movement.id) || [];
                      setsByMovement.set(set.movement.id, [...existing, set]);
                    });

                    const isSelected = selectedWorkouts.has(workout.id);
                    return (
                      <tr
                        key={workout.id}
                        className={`border-b border-slate-100 ${isSelected ? "bg-primary/10" : "hover:bg-slate-50"}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => toggleWorkout(workout.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {workout.completedAt
                            ? new Date(workout.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{workout.sets.length}</td>
                        {uniqueMovements.map(([movementId]) => {
                          const movementSets = setsByMovement.get(movementId);
                          if (!movementSets || movementSets.length === 0) {
                            return (
                              <td key={movementId} className="py-3 px-4 text-right text-slate-300">
                                -
                              </td>
                            );
                          }
                          const maxWeight = Math.max(...movementSets.map((s) => s.weight));
                          const avgReps = Math.round(
                            movementSets.reduce((sum, s) => sum + s.reps, 0) / movementSets.length,
                          );
                          const numSets = movementSets.length;
                          return (
                            <td key={movementId} className="py-3 px-4 text-right text-slate-600">
                              {maxWeight} lbs / {avgReps} reps / {numSets} sets
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

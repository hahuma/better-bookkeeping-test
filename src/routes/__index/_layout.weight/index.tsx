import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  recordWeightServerFn,
  deleteWeightEntryServerFn,
  updateWeightUnitServerFn,
} from "@/lib/weight.server";
import { Scale, Trash2 } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightHistoryQueryOptions, weightUnitQueryOptions } from "./-queries/weight";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { WeightUnit } from "../../../../prisma/generated/client/browser";

function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "lbs" && toUnit === "kg") return Math.round(value * 0.453592 * 10) / 10;
  if (fromUnit === "kg" && toUnit === "lbs") return Math.round(value * 2.20462 * 10) / 10;
  return value;
}

export const Route = createFileRoute("/__index/_layout/weight/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(weightHistoryQueryOptions()),
      context.queryClient.ensureQueryData(weightUnitQueryOptions()),
    ]);
  },
  component: WeightPage,
});

function WeightPage() {
  const queryClient = useQueryClient();
  const { data: entries } = useSuspenseQuery(weightHistoryQueryOptions());
  const { data: weightUnit } = useSuspenseQuery(weightUnitQueryOptions());
  const [weight, setWeight] = useState("");

  const recordWeightMutation = useMutation({
    mutationFn: (weight: number) => recordWeightServerFn({ data: { weight } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightHistoryQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["latestWeight"] });
      setWeight("");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteWeightEntryServerFn({ data: { entryId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightHistoryQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["latestWeight"] });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: (unit: "lbs" | "kg") => updateWeightUnitServerFn({ data: { unit } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightUnitQueryOptions().queryKey });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(weight);
    if (isNaN(parsed) || parsed <= 0) return;
    recordWeightMutation.mutate(parsed);
  };

  const chartData = [...entries]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: convertWeight(entry.weight, entry.unit, weightUnit),
    }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Weight Tracking</h1>
        <div className="flex gap-0.5 rounded-lg border border-border p-0.5 bg-surface-elevated">
          <button
            type="button"
            onClick={() => updateUnitMutation.mutate("lbs")}
            data-state={weightUnit === "lbs" ? "on" : "off"}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=off]:text-text-muted data-[state=off]:hover:text-text-secondary"
          >
            lbs
          </button>
          <button
            type="button"
            onClick={() => updateUnitMutation.mutate("kg")}
            data-state={weightUnit === "kg" ? "on" : "off"}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=off]:text-text-muted data-[state=off]:hover:text-text-secondary"
          >
            kg
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                {weightUnit}
              </span>
            </div>
            <Button type="submit" disabled={!weight || parseFloat(weight) <= 0} size="sm">
              <Scale className="w-4 h-4" />
              {recordWeightMutation.isPending ? "Recording..." : "Record"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="weight-chart" className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 250)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 5", "dataMax + 5"]}
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(16% 0.012 250)",
                      border: "1px solid oklch(25% 0.01 250)",
                      borderRadius: "8px",
                      color: "oklch(95% 0.01 80)",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "oklch(65% 0.01 250)" }}
                    formatter={(value) => [`${value} ${weightUnit}`, "Weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="oklch(65% 0.18 25)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(65% 0.18 25)", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "oklch(65% 0.18 25)", stroke: "oklch(95% 0.01 80)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No weight entries yet. Record your first entry above!</p>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">Date</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                      Weight ({weightUnit})
                    </th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border-subtle hover:bg-surface-elevated transition-colors">
                      <td className="py-2.5 px-3 text-text-secondary text-xs">
                        {new Date(entry.recordedAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-primary font-medium">
                        {convertWeight(entry.weight, entry.unit, weightUnit)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                          className="h-6 w-6 text-text-muted hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

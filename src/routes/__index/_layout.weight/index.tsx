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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Weight Tracking</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => updateUnitMutation.mutate("lbs")}
            data-state={weightUnit === "lbs" ? "on" : "off"}
            className="px-3 py-1 text-sm font-medium rounded-md transition-colors data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=off]:text-slate-600 data-[state=off]:hover:bg-slate-100"
          >
            lbs
          </button>
          <button
            type="button"
            onClick={() => updateUnitMutation.mutate("kg")}
            data-state={weightUnit === "kg" ? "on" : "off"}
            className="px-3 py-1 text-sm font-medium rounded-md transition-colors data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=off]:text-slate-600 data-[state=off]:hover:bg-slate-100"
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
          <form onSubmit={handleSubmit} className="flex gap-3">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {weightUnit}
              </span>
            </div>
            <Button type="submit" disabled={!weight || parseFloat(weight) <= 0}>
              <Scale className="w-4 h-4 mr-2" />
              {recordWeightMutation.isPending ? "Recording..." : "Record"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="weight-chart" className="h-64">
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
                    formatter={(value) => [`${value} ${weightUnit}`, "Weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ fill: "#0f172a", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#0f172a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No weight entries yet. Record your first entry above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">
                      Weight ({weightUnit})
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Note</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(entry.recordedAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {convertWeight(entry.weight, entry.unit, weightUnit)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{entry.note || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
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

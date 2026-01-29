"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Company {
  id: string;
  name: string;
  kpis?: Array<{
    periodDate: string;
    presCostCalculated?: number | null;
    absenteeismRate?: number | null;
  }>;
}

interface PerformanceChartProps {
  companies: Company[];
  showTitle?: boolean;
}

export default function PerformanceChart({ companies, showTitle = true }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    // Aggregate all KPIs by month
    const monthlyData: Record<string, { month: string; totalCost: number; avgAbsenteeism: number; count: number }> = {};

    companies.forEach((company) => {
      (company.kpis || []).forEach((kpi) => {
        const date = new Date(kpi.periodDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, totalCost: 0, avgAbsenteeism: 0, count: 0 };
        }

        if (kpi.presCostCalculated != null) {
          monthlyData[monthKey].totalCost += kpi.presCostCalculated;
        }
        if (kpi.absenteeismRate != null) {
          monthlyData[monthKey].avgAbsenteeism += kpi.absenteeismRate;
          monthlyData[monthKey].count++;
        }
      });
    });

    // Calculate averages and sort by date
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([_, data]) => ({
        month: data.month,
        coût: Math.round(data.totalCost / 1000), // In thousands
        absentéisme: data.count > 0 ? Math.round((data.avgAbsenteeism / data.count) * 10) / 10 : 0,
      }));
  }, [companies]);

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Trajectoire de Performance
            </CardTitle>
            <CardDescription>Évolution sur les 12 derniers mois</CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Données insuffisantes pour afficher le graphique</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {entry.name === "coût"
                  ? `${entry.value.toLocaleString("fr-FR")} k€`
                  : `${entry.value} %`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Trajectoire de Performance
          </CardTitle>
          <CardDescription>Évolution du coût présentéisme et absentéisme</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 74%, 53%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(43, 74%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 58%, 32%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(174, 58%, 32%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={(value) => `${value}k€`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground capitalize">
                    {value === "coût" ? "Coût présentéisme" : "Taux absentéisme"}
                  </span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="coût"
                stroke="hsl(43, 74%, 53%)"
                strokeWidth={2}
                fill="url(#colorCost)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="absentéisme"
                stroke="hsl(174, 58%, 32%)"
                strokeWidth={2}
                fill="url(#colorAbsent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

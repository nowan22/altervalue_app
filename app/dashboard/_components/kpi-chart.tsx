"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface KpiChartProps {
  companies: any[];
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3'];

export default function KpiChart({ companies }: KpiChartProps) {
  const safeCompanies = companies ?? [];

  const chartData = useMemo(() => {
    const allKpis: any[] = [];
    
    safeCompanies.forEach((company) => {
      (company?.kpis ?? []).forEach((kpi: any) => {
        allKpis.push({
          ...kpi,
          companyName: company?.name ?? 'Entreprise',
        });
      });
    });

    // Group by month
    const grouped: Record<string, any> = {};
    
    allKpis.forEach((kpi) => {
      const date = new Date(kpi?.periodDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: monthKey };
      }
      
      grouped[monthKey][`${kpi.companyName}_absenteeism`] = kpi?.absenteeismRate ?? 0;
      grouped[monthKey][`${kpi.companyName}_presCost`] = (kpi?.presCostCalculated ?? 0) / 1000;
    });

    return Object.values(grouped)
      .sort((a, b) => (a.month ?? '').localeCompare(b.month ?? ''))
      .slice(-12);
  }, [safeCompanies]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Aucune donnée historique disponible
      </div>
    );
  }

  const companyNames = [...new Set(safeCompanies.map(c => c?.name ?? 'Entreprise'))];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis 
            dataKey="month" 
            tickLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'Absentéisme (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
            formatter={(value: number, name: string) => {
              if (name.includes('absenteeism')) {
                return [`${value.toFixed(1)}%`, name.replace('_absenteeism', '')];
              }
              return [`${value.toFixed(0)}k€`, name.replace('_presCost', '')];
            }}
          />
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ fontSize: 11 }}
          />
          {companyNames.map((name, index) => (
            <Line
              key={`${name}_absenteeism`}
              type="monotone"
              dataKey={`${name}_absenteeism`}
              name={name ?? 'Entreprise'}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

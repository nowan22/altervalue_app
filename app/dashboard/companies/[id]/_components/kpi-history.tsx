"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { getSignalColor } from "@/lib/presenteeism-calculator";
import { ExportButtons } from "./export-buttons";

interface CompanyExportData {
  id: string;
  name: string;
  sector: string;
  employees: number;
  averageSalary: number;
  absenteeismRate: number;
}

interface KpiHistoryProps {
  kpis: any[];
  settings: any;
  company?: CompanyExportData;
}

const COLORS = ['#60B5FF', '#FF9149', '#80D8C3', '#FF90BB'];

type SortField = 'periodDate' | 'employees' | 'absenteeismRate' | 'presRate' | 'presCost';
type SortDirection = 'asc' | 'desc';

export default function KpiHistory({ kpis, settings, company }: KpiHistoryProps) {
  const safeKpis = kpis ?? [];
  const safeSettings = settings ?? {};
  const [sortField, setSortField] = useState<SortField>('periodDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Prepare KPI data for export
  const exportKpis = useMemo(() => {
    return safeKpis.map(k => ({
      id: k?.id ?? '',
      periodDate: k?.periodDate,
      employees: k?.employeesCount ?? 0,
      absenteeismRate: k?.absenteeismRate ?? 0,
      presenteeismRate: k?.presRateCalculated ?? 0,
      presenteeismCost: k?.presCostCalculated ?? 0,
    }));
  }, [safeKpis]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedKpis = useMemo(() => {
    return [...safeKpis].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'periodDate':
          aVal = new Date(a?.periodDate ?? 0).getTime();
          bVal = new Date(b?.periodDate ?? 0).getTime();
          break;
        case 'employees':
          aVal = a?.employeesCount ?? 0;
          bVal = b?.employeesCount ?? 0;
          break;
        case 'absenteeismRate':
          aVal = a?.absenteeismRate ?? 0;
          bVal = b?.absenteeismRate ?? 0;
          break;
        case 'presRate':
          aVal = a?.presRateCalculated ?? 0;
          bVal = b?.presRateCalculated ?? 0;
          break;
        case 'presCost':
          aVal = a?.presCostCalculated ?? 0;
          bVal = b?.presCostCalculated ?? 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [safeKpis, sortField, sortDirection]);

  const chartData = useMemo(() => {
    return [...safeKpis]
      .sort((a, b) => new Date(a?.periodDate ?? 0).getTime() - new Date(b?.periodDate ?? 0).getTime())
      .map(kpi => ({
        month: new Date(kpi?.periodDate ?? new Date()).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        absenteeism: kpi?.absenteeismRate ?? 0,
        presRate: kpi?.presRateCalculated ?? 0,
        presCost: (kpi?.presCostCalculated ?? 0) / 1000,
        turnover: kpi?.turnoverRate ?? 0,
      }));
  }, [safeKpis]);

  if (safeKpis.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Aucun historique</h3>
          <p className="text-muted-foreground">
            Importez des données CSV pour voir l'évolution des KPI dans le temps
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Périodes importées</p>
                <p className="text-2xl font-bold">{safeKpis.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absentéisme moyen</p>
                <p className="text-2xl font-bold">
                  {(safeKpis.reduce((sum, k) => sum + (k?.absenteeismRate ?? 0), 0) / (safeKpis.length || 1)).toFixed(1)}%
                </p>
              </div>
              {(() => {
                const values = safeKpis.map(k => k?.absenteeismRate ?? 0);
                const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
                if (Math.abs(trend) < 0.5) return <Minus className="h-8 w-8 text-muted-foreground" />;
                return trend > 0 
                  ? <TrendingUp className="h-8 w-8 text-red-500" />
                  : <TrendingDown className="h-8 w-8 text-green-500" />;
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût présentéisme moyen</p>
                <p className="text-2xl font-bold">
                  {(safeKpis.reduce((sum, k) => sum + (k?.presCostCalculated ?? 0), 0) / (safeKpis.length || 1) / 1000).toFixed(0)}k€
                </p>
              </div>
              {(() => {
                const values = safeKpis.map(k => k?.presCostCalculated ?? 0);
                const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
                if (Math.abs(trend) < 1000) return <Minus className="h-8 w-8 text-muted-foreground" />;
                return trend > 0 
                  ? <TrendingUp className="h-8 w-8 text-red-500" />
                  : <TrendingDown className="h-8 w-8 text-green-500" />;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution de l'absentéisme</CardTitle>
            <CardDescription>Taux d'absentéisme et de présentéisme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                  />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="absenteeism"
                    name="Absentéisme"
                    stroke="#60B5FF"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="presRate"
                    name="Présentéisme"
                    stroke="#FF9149"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution du coût</CardTitle>
            <CardDescription>Coût du présentéisme en k€</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ value: 'k€', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                  />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="presCost"
                    name="Coût (k€)"
                    stroke="#80D8C3"
                    fill="#80D8C3"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Détail par période</CardTitle>
            <CardDescription>Historique complet des KPI importés</CardDescription>
          </div>
          {company && (
            <ExportButtons
              company={company}
              kpis={exportKpis}
              type="history"
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted dark:bg-card">
                  <th 
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted dark:hover:bg-card-hover transition-colors"
                    onClick={() => handleSort('periodDate')}
                  >
                    <span className="flex items-center">Période {getSortIcon('periodDate')}</span>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted dark:hover:bg-card-hover transition-colors"
                    onClick={() => handleSort('employees')}
                  >
                    <span className="flex items-center">Effectif {getSortIcon('employees')}</span>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted dark:hover:bg-card-hover transition-colors"
                    onClick={() => handleSort('absenteeismRate')}
                  >
                    <span className="flex items-center">Absent. {getSortIcon('absenteeismRate')}</span>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted dark:hover:bg-card-hover transition-colors"
                    onClick={() => handleSort('presRate')}
                  >
                    <span className="flex items-center">Présent. {getSortIcon('presRate')}</span>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted dark:hover:bg-card-hover transition-colors"
                    onClick={() => handleSort('presCost')}
                  >
                    <span className="flex items-center">Coût {getSortIcon('presCost')}</span>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {sortedKpis.map((kpi, index) => {
                    const signal = getSignalColor(
                      kpi?.absenteeismRate ?? 0,
                      safeSettings?.absenteeismGreenMax ?? 4,
                      safeSettings?.absenteeismOrangeMax ?? 6
                    );

                    return (
                      <motion.tr
                        key={kpi?.id ?? index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b dark:border-border hover:bg-muted dark:hover:bg-card"
                      >
                        <td className="px-4 py-3">
                          {new Date(kpi?.periodDate ?? new Date()).toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">{kpi?.employeesCount ?? '-'}</td>
                        <td className="px-4 py-3">{kpi?.absenteeismRate != null ? `${kpi.absenteeismRate.toFixed(1)}%` : '-'}</td>
                        <td className="px-4 py-3">{kpi?.presRateCalculated != null ? `${kpi.presRateCalculated.toFixed(1)}%` : '-'}</td>
                        <td className="px-4 py-3">
                          {kpi?.presCostCalculated != null ? `${(kpi.presCostCalculated / 1000).toFixed(0)}k€` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              signal === 'green' ? 'success' :
                              signal === 'orange' ? 'warning' : 'danger'
                            }
                          >
                            {signal === 'green' ? 'Bon' : signal === 'orange' ? 'Attention' : 'Critique'}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

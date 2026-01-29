'use client';

import { useMemo } from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface RadarChartProps {
  scores: Record<string, number>;
  maxScore?: number;
  title?: string;
  showLegend?: boolean;
  height?: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  // QVCT Radar Flash
  sens_travail: 'Sens du travail',
  charge_travail: 'Charge de travail',
  autonomie: 'Autonomie',
  relations_collegues: 'Relations collègues',
  soutien_management: 'Soutien management',
  reconnaissance: 'Reconnaissance',
  equilibre_vie: 'Équilibre vie pro/perso',
  environnement_physique: 'Environnement physique',
  securite_emploi: 'Sécurité de l\'emploi',
  developpement_competences: 'Développement compétences',
  qvct_global: 'Score QVCT Global',
  // Presenteeism
  presenteeism_rate: 'Taux présentéisme',
  productivity_loss: 'Perte productivité',
  engagement_score: 'Score engagement',
  health_wellbeing: 'Santé / Bien-être',
  work_environment: 'Environnement travail',
  // BNQ
  bnq_score_global: 'Score BNQ Global',
  pratiques_organisationnelles: 'Pratiques organisationnelles',
  pratiques_manageriales: 'Pratiques managériales',
  conciliation_travail: 'Conciliation travail-vie',
  sante_securite: 'Santé & Sécurité',
};

const getScoreColor = (score: number, max: number = 10): string => {
  const ratio = score / max;
  if (ratio >= 0.7) return '#22c55e'; // success green
  if (ratio >= 0.5) return '#f59e0b'; // warning yellow
  return '#ef4444'; // danger red
};

export function RadarChart({ 
  scores, 
  maxScore = 10,
  title,
  showLegend = false,
  height = 400 
}: RadarChartProps) {
  const data = useMemo(() => {
    return Object.entries(scores)
      .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
      .map(([key, value]) => ({
        dimension: DIMENSION_LABELS[key] || key.replace(/_/g, ' '),
        score: Math.min(value, maxScore),
        fullMark: maxScore,
        originalKey: key,
      }));
  }, [scores, maxScore]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Aucune donnée à afficher
      </div>
    );
  }

  // Calculate average for the center display
  const avgScore = data.reduce((sum, d) => sum + d.score, 0) / data.length;

  return (
    <div className="relative">
      {title && (
        <h4 className="text-center font-semibold text-foreground mb-4">{title}</h4>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={({ payload, x, y, cx, cy, ...rest }) => {
              // Calculate position for label
              const radius = 90;
              const angle = rest.index * (360 / data.length) - 90;
              const radian = (angle * Math.PI) / 180;
              
              return (
                <text
                  {...rest}
                  x={x}
                  y={y}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={11}
                  textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
                >
                  {payload.value.length > 15 
                    ? payload.value.substring(0, 15) + '...' 
                    : payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxScore]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: 'hsl(var(--primary))',
              strokeWidth: 0,
            }}
            activeDot={{
              r: 6,
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground">{item.dimension}</p>
                    <p className="text-sm mt-1">
                      Score: <span className="font-semibold" style={{ color: getScoreColor(item.score, maxScore) }}>
                        {item.score.toFixed(1)}/{maxScore}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          {showLegend && <Legend />}
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Center score display */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-card/80 backdrop-blur rounded-full p-4">
          <p className="text-3xl font-bold" style={{ color: getScoreColor(avgScore, maxScore) }}>
            {avgScore.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Moyenne</p>
        </div>
      </div>
    </div>
  );
}

// Score bars for detailed view
export function ScoreBars({ 
  scores, 
  maxScore = 10 
}: { 
  scores: Record<string, number>; 
  maxScore?: number;
}) {
  const data = Object.entries(scores)
    .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {data.map(([key, value]) => {
        const percentage = (value / maxScore) * 100;
        const color = getScoreColor(value, maxScore);
        const label = DIMENSION_LABELS[key] || key.replace(/_/g, ' ');
        
        return (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-foreground">{label}</span>
              <span className="font-semibold" style={{ color }}>
                {value.toFixed(1)}/{maxScore}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Gauge component for single score display
export function ScoreGauge({ 
  score, 
  maxScore = 10, 
  label 
}: { 
  score: number; 
  maxScore?: number; 
  label: string;
}) {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score, maxScore);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700 ease-out"
        />
        {/* Score text */}
        <text
          x="60"
          y="55"
          textAnchor="middle"
          className="text-2xl font-bold fill-foreground"
        >
          {score.toFixed(1)}
        </text>
        <text
          x="60"
          y="75"
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
        >
          /{maxScore}
        </text>
      </svg>
      <p className="text-sm font-medium text-muted-foreground mt-2 text-center">
        {label}
      </p>
    </div>
  );
}

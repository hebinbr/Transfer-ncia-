import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Zap, Layers } from 'lucide-react';
import { TransferHistoryItem } from '../types';
import { get7DaysTransferMetrics, DayVolumeMetric } from '../utils/historyManager';
import { formatBytes } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface TransferVolumeChartProps {
  history: TransferHistoryItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricType: 'volume' | 'count';
  isDark: boolean;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  metricType,
  isDark,
}) => {
  if (active && payload && payload.length) {
    const data: DayVolumeMetric = payload[0].payload;
    return (
      <div
        className={`rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[170px] border transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-white'
            : 'bg-white border-slate-300 text-slate-900 shadow-lg'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-1 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <span className="font-bold flex items-center gap-1.5">
            <Calendar
              className={`w-3.5 h-3.5 ${
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              }`}
            />
            {data.isToday ? 'Hoje' : data.fullDate}
          </span>
          <span
            className={`text-[10px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {data.weekday}
          </span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Volume:</span>
            <span
              className={`font-bold font-mono tabular-nums ${
                isDark ? 'text-indigo-300' : 'text-indigo-700'
              }`}
            >
              {formatBytes(data.volumeBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Transferências:</span>
            <span
              className={`font-bold font-mono tabular-nums ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {data.transferCount} {data.transferCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {data.errorCount > 0 && (
            <div
              className={`flex items-center justify-between text-[11px] ${
                isDark ? 'text-rose-400' : 'text-rose-600 font-semibold'
              }`}
            >
              <span>Falhas no dia:</span>
              <span className="font-mono tabular-nums">{data.errorCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TransferVolumeChart: React.FC<TransferVolumeChartProps> = ({ history }) => {
  const { isDark } = useTheme();
  const [metricType, setMetricType] = useState<'volume' | 'count'>('volume');
  const metrics = get7DaysTransferMetrics(history);

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#475569';
  const axisLineColor = isDark ? '#334155' : '#cbd5e1';

  return (
    <div className="bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm dark:shadow-none transition-colors">
      {/* Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Volume de Transferências</span>
              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/80 dark:border-indigo-800/60 rounded px-1.5 py-0.2 font-semibold">
                Últimos 7 dias
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Distribuição diária de dados trafegados entre iPhone e Computador
            </p>
          </div>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetricType('volume')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              metricType === 'volume'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Volume (MB)
          </button>
          <button
            type="button"
            onClick={() => setMetricType('count')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              metricType === 'count'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Qtd. Transferências
          </button>
        </div>
      </div>

      {/* 7-Day Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">
            Volume em 7 Dias
          </span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatBytes(metrics.totalVolumeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">
            Média Diária
          </span>
          <span className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
            {metrics.dailyAverageMB} MB
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">
            Pico no Período
          </span>
          <span className="text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-300 font-mono tabular-nums truncate block">
            {metrics.peakDay && metrics.peakDay.volumeMB > 0
              ? `${metrics.peakDay.volumeMB} MB`
              : '0 MB'}
          </span>
          <span className="text-[10px] text-slate-500 truncate block font-medium">
            {metrics.peakDay && metrics.peakDay.volumeMB > 0
              ? metrics.peakDay.displayDay
              : 'Sem tráfego'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">
            Total Transferido
          </span>
          <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
            {metrics.totalTransfers} {metrics.totalTransfers === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-56 sm:h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metrics.days}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="displayDay"
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: axisLineColor }}
            />

            <YAxis
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: axisLineColor }}
              tickFormatter={value =>
                metricType === 'volume' ? `${value}MB` : `${value}`
              }
            />

            <Tooltip
              content={<CustomChartTooltip metricType={metricType} isDark={isDark} />}
              cursor={{ fill: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)' }}
            />

            <Bar
              dataKey={metricType === 'volume' ? 'volumeMB' : 'transferCount'}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {metrics.days.map((entry, index) => {
                const isToday = entry.isToday;
                const isPeak =
                  metrics.peakDay &&
                  entry.dateKey === metrics.peakDay.dateKey &&
                  entry.volumeMB > 0;

                let fill = isDark ? '#6366f1' : '#4f46e5';
                if (isToday) {
                  fill = isDark ? '#38bdf8' : '#0284c7';
                } else if (isPeak) {
                  fill = isDark ? '#818cf8' : '#6366f1';
                }

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fill}
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend / Guidance Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-900 text-[11px] text-slate-600 dark:text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 dark:bg-sky-400 inline-block" />
            <span className="text-slate-800 dark:text-slate-300 font-semibold">Hoje</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500 inline-block" />
            <span className="text-slate-600 dark:text-slate-400">Dias Anteriores</span>
          </div>
        </div>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          Valores calculados em Megabytes (MB) com base no histórico
        </span>
      </div>
    </div>
  );
};

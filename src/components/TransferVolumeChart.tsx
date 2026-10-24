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

interface TransferVolumeChartProps {
  history: TransferHistoryItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricType: 'volume' | 'count';
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  metricType,
}) => {
  if (active && payload && payload.length) {
    const data: DayVolumeMetric = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {data.isToday ? 'Hoje' : data.fullDate}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{data.weekday}</span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Volume:</span>
            <span className="font-bold text-indigo-300 font-mono tabular-nums">
              {formatBytes(data.volumeBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transferências:</span>
            <span className="font-bold text-slate-200 font-mono tabular-nums">
              {data.transferCount} {data.transferCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {data.errorCount > 0 && (
            <div className="flex items-center justify-between text-[11px] text-rose-400">
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
  const [metricType, setMetricType] = useState<'volume' | 'count'>('volume');
  const metrics = get7DaysTransferMetrics(history);

  return (
    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Volume de Transferências</span>
              <span className="text-[11px] text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 rounded px-1.5 py-0.2 font-normal">
                Últimos 7 dias
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribuição diária de dados trafegados entre iPhone e Computador
            </p>
          </div>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetricType('volume')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              metricType === 'volume'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volume (MB)
          </button>
          <button
            type="button"
            onClick={() => setMetricType('count')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              metricType === 'count'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Qtd. Transferências
          </button>
        </div>
      </div>

      {/* 7-Day Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">
            Volume em 7 Dias
          </span>
          <span className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
            {formatBytes(metrics.totalVolumeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">
            Média Diária
          </span>
          <span className="text-lg sm:text-xl font-bold text-indigo-300 font-mono tabular-nums">
            {metrics.dailyAverageMB} MB
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">
            Pico no Período
          </span>
          <span className="text-lg sm:text-xl font-bold text-sky-300 font-mono tabular-nums truncate block">
            {metrics.peakDay && metrics.peakDay.volumeMB > 0
              ? `${metrics.peakDay.volumeMB} MB`
              : '0 MB'}
          </span>
          <span className="text-[10px] text-slate-500 truncate block">
            {metrics.peakDay && metrics.peakDay.volumeMB > 0
              ? metrics.peakDay.displayDay
              : 'Sem tráfego'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">
            Total Transferido
          </span>
          <span className="text-lg sm:text-xl font-bold text-emerald-300 font-mono tabular-nums">
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
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="displayDay"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={value =>
                metricType === 'volume' ? `${value}MB` : `${value}`
              }
            />

            <Tooltip
              content={<CustomChartTooltip metricType={metricType} />}
              cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
            />

            <Bar
              dataKey={metricType === 'volume' ? 'volumeMB' : 'transferCount'}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {metrics.days.map((entry, index) => {
                // Highlight today or highest volume
                const isToday = entry.isToday;
                const isPeak =
                  metrics.peakDay &&
                  entry.dateKey === metrics.peakDay.dateKey &&
                  entry.volumeMB > 0;

                let fill = '#6366f1'; // indigo-500
                if (isToday) {
                  fill = '#38bdf8'; // sky-400
                } else if (isPeak) {
                  fill = '#818cf8'; // indigo-400
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
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
            <span className="text-slate-300">Hoje</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
            <span className="text-slate-400">Dias Anteriores</span>
          </div>
        </div>
        <span className="font-mono text-slate-400">
          Valores calculados em Megabytes (MB) com base no histórico
        </span>
      </div>
    </div>
  );
};

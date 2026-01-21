import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { WorkoutLog } from '../types';

interface HistoryChartProps {
  logs: WorkoutLog[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ logs }) => {
  // Process logs to last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(l => l.date.startsWith(dateStr) && l.completed);
      const totalSeconds = dayLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const totalMinutes = Math.round(totalSeconds / 60);

      days.push({
        name: i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
        minutes: totalMinutes,
        fullDate: dateStr
      });
    }
    return days;
  };

  const data = getLast7Days();

  return (
    <div className="w-full h-64 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <h3 className="text-slate-500 text-sm font-medium mb-4">近7天训练时长 (分钟)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{fill: '#f1f5f9', radius: 4}}
            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
          />
          <Bar dataKey="minutes" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#4f46e5' : '#e2e8f0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;

import { ResponsiveContainer, AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  startEndOnly?: boolean;
}

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  colors: string[];
  valueFormatter?: (value: number) => string;
}

const COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  lime: '#84cc16',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
};

export function AreaChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value: number) => `${value}`,
  startEndOnly = false,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey={index}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (startEndOnly) {
              const isFirstOrLast = data[0][index] === value || data[data.length - 1][index] === value;
              return isFirstOrLast ? value : '';
            }
            return value;
          }}
        />
        <YAxis
          tickFormatter={(value) => valueFormatter(value)}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value), '']}
          labelFormatter={(label) => `${label}`}
          contentStyle={{
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        {categories.map((category, index) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stackId="1"
            stroke={COLORS[colors[index] as keyof typeof COLORS] || '#6366f1'}
            fill={COLORS[colors[index] as keyof typeof COLORS] || '#6366f1'}
            fillOpacity={0.6}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value: number) => `${value}`,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
        <XAxis dataKey={index} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(value) => valueFormatter(value)}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value), '']}
          contentStyle={{
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={COLORS[colors[index] as keyof typeof COLORS] || '#6366f1'}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({
  data,
  index,
  category,
  colors,
  valueFormatter = (value: number) => `${value}`,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={category}
          nameKey={index}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[colors[index % colors.length] as keyof typeof COLORS] || '#6366f1'}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => valueFormatter(value)}
          contentStyle={{
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

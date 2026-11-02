'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// Safree palette
const COLORS = {
  red: '#822626',
  cream: '#E6DDBC',
  muted: '#9A9A9A',
  border: '#3A3A3A',
  bg: '#262525',
}
const DONUT_COLORS = ['#822626', '#E6DDBC', '#9A9A9A', '#525252', '#690202']

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  color: COLORS.cream,
  fontSize: 12,
}

export interface ChartData {
  newUsers: { date: string; user: number; store: number }[]
  transactions: { date: string; amount: number }[]
  listingsByStatus: { name: string; value: number }[]
  disputesByStatus: { name: string; value: number }[]
}

export function DashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* New users over time */}
      <div className="card-base p-5">
        <h3 className="font-heading text-text-primary mb-4">New Users</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.newUsers}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" stroke={COLORS.muted} fontSize={11} tickLine={false} />
            <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.muted }} />
            <Line type="monotone" dataKey="user" name="Users" stroke={COLORS.cream} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="store" name="Stores" stroke={COLORS.red} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction volume */}
      <div className="card-base p-5">
        <h3 className="font-heading text-text-primary mb-4">Transaction Volume (USD)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.transactions}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" stroke={COLORS.muted} fontSize={11} tickLine={false} />
            <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Volume']} />
            <Bar dataKey="amount" fill={COLORS.red} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Listings by status */}
      <div className="card-base p-5">
        <h3 className="font-heading text-text-primary mb-4">Listings by Status</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.listingsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.listingsByStatus.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.muted }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Disputes by status */}
      <div className="card-base p-5">
        <h3 className="font-heading text-text-primary mb-4">Disputes by Status</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.disputesByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.disputesByStatus.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.muted }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

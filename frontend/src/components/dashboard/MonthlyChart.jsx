import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function MonthlyChart({ data, formatMoney }) {
  if (data.length === 0) return null

  return (
    <section className="monthly-chart">
      <h2>Ingresos y gastos por mes</h2>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(value) => `S/ ${value}`} />

            <Tooltip formatter={(value) => formatMoney(value)} />

            <Legend />

            <Bar
              dataKey="income"
              name="Ingresos"
              fill="#059669"
              radius={[6, 6, 0, 0]}
            />

            <Bar
              dataKey="expenses"
              name="Gastos"
              fill="#dc2626"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default MonthlyChart
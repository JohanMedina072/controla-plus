import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#f59e0b', '#dc2626']

function ExpenseChart({ categories, formatMoney }) {
  if (categories.length === 0) return null

  const chartData = categories.map((category) => ({
    name: category.name,
    value: category.amount,
  }))

  return (
    <section className="expense-chart">
      <h2>Distribución de gastos</h2>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={105}
              label
            >
              {chartData.map((category, index) => (
                <Cell
                  key={category.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => formatMoney(value)}
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default ExpenseChart
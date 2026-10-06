const getMonthKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const parseMovementDate = (value) => {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const getPreviousMonthKey = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 2, 1)

  return getMonthKey(date)
}

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const sumExpenses = (movements) =>
  movements.reduce((total, movement) => {
    if (movement.type !== 'EXPENSE') return total

    return total + Number(movement.amount)
  }, 0)

const sumIncome = (movements) =>
  movements.reduce((total, movement) => {
    if (movement.type !== 'INCOME') return total

    return total + Number(movement.amount)
  }, 0)

const getCategoryBreakdown = (movements) => {
  const totals = movements
    .filter((movement) => movement.type === 'EXPENSE')
    .reduce((accumulator, movement) => {
      const name = movement.category?.name || 'Sin categoría'

      accumulator[name] = (accumulator[name] || 0) + Number(movement.amount)

      return accumulator
    }, {})

  const totalExpenses = Object.values(totals).reduce(
    (total, amount) => total + amount,
    0,
  )

  return Object.entries(totals)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenses ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((first, second) => second.amount - first.amount)
}

export const getSpendingInsights = (movements, selectedMonth = '') => {
  const today = new Date()
  const targetMonthKey = selectedMonth || getMonthKey(today)
  const validMovements = movements
    .map((movement) => ({
      ...movement,
      parsedDate: parseMovementDate(movement.date),
    }))
    .filter((movement) => movement.parsedDate)

  const periodMovements = validMovements.filter(
    (movement) => getMonthKey(movement.parsedDate) === targetMonthKey,
  )
  const previousMonthMovements = validMovements.filter(
    (movement) =>
      getMonthKey(movement.parsedDate) ===
      getPreviousMonthKey(targetMonthKey),
  )

  const periodExpenses = sumExpenses(periodMovements)
  const periodIncome = sumIncome(periodMovements)
  const previousMonthExpenses = sumExpenses(previousMonthMovements)
  const categoryBreakdown = getCategoryBreakdown(periodMovements)
  const topCategory = categoryBreakdown[0] || null

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)

  const todayMovements = validMovements.filter(
    (movement) => getDateKey(movement.parsedDate) === getDateKey(today),
  )
  const lastSevenDaysMovements = validMovements.filter(
    (movement) =>
      movement.parsedDate >= weekStart && movement.parsedDate <= today,
  )

  const changePercentage = previousMonthExpenses
    ? ((periodExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    : null

  let recommendation = 'Tus gastos están distribuidos entre varias categorías.'

  if (periodExpenses === 0) {
    recommendation =
      'Todavía no hay gastos registrados en este periodo. Cuando registres movimientos, aparecerán recomendaciones.'
  } else if (topCategory && topCategory.percentage >= 40) {
    recommendation = `La categoría ${topCategory.name} concentra el ${topCategory.percentage.toFixed(0)}% de tus gastos del periodo.`
  } else if (changePercentage !== null && changePercentage >= 20) {
    recommendation = `Tus gastos aumentaron ${changePercentage.toFixed(0)}% frente al mes anterior. Revisa las categorías con mayor crecimiento.`
  } else if (changePercentage !== null && changePercentage <= -20) {
    recommendation = `Tus gastos bajaron ${Math.abs(changePercentage).toFixed(0)}% frente al mes anterior.`
  }

  return {
    periodLabel: formatMonth(targetMonthKey),
    periodExpenses,
    periodIncome,
    previousMonthExpenses,
    changePercentage,
    todayExpenses: sumExpenses(todayMovements),
    lastSevenDaysExpenses: sumExpenses(lastSevenDaysMovements),
    topCategory,
    categoryBreakdown,
    recommendation,
  }
}

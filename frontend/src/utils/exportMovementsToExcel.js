import * as XLSX from 'xlsx'

const formatExportDate = (value) => {
  if (!value) return ''

  const dateText =
    typeof value === 'string'
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return ''
  }

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'UTC',
  }).format(new Date(`${dateText}T00:00:00Z`))
}

const exportMovementsToExcel = (movements = [], selectedMonth = '') => {
  if (!Array.isArray(movements) || movements.length === 0) {
    return
  }

  const rows = movements.map((movement) => ({
    Fecha: formatExportDate(movement.date),
    Tipo: movement.type === 'INCOME' ? 'Ingreso' : 'Gasto',
    Descripción: movement.description || 'Sin descripción',
    Categoría: movement.category?.name || 'Sin categoría',
    'Método de pago':
      movement.paymentMethod?.name || 'Sin método de pago',
    Monto: Number(movement.amount),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
  ]

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos')

  const date = selectedMonth || new Date().toISOString().slice(0, 10)

  XLSX.writeFile(workbook, `controla-plus-${date}.xlsx`)
}

export default exportMovementsToExcel

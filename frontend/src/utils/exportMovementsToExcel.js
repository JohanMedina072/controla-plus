import * as XLSX from 'xlsx'

const exportMovementsToExcel = (movements) => {
  const rows = movements.map((movement) => ({
    Fecha: movement.date
      ? new Intl.DateTimeFormat('es-PE').format(new Date(movement.date))
      : '',
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

  const date = new Date().toISOString().slice(0, 10)

  XLSX.writeFile(workbook, `controla-plus-${date}.xlsx`)
}

export default exportMovementsToExcel
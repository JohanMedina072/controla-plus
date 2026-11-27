const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

const formatMoney = (value) => currencyFormatter.format(Number(value || 0))

export default formatMoney

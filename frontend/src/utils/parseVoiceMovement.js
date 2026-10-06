const STOP_WORDS = new Set(['cuenta', 'cuentas', 'mi', 'mis', 'de', 'la', 'el'])

const CATEGORY_ALIASES = {
  Comida: [
    'comida',
    'almuerzo',
    'desayuno',
    'cena',
    'sprite',
    'bebida',
    'restaurante',
    'pan',
    'pollo',
    'hamburguesa',
    'menu',
  ],
  Transporte: ['transporte', 'combustible', 'gasolina', 'gnv', 'gas', 'taxi'],
  Salud: ['salud', 'medicina', 'farmacia'],
  Estudios: ['estudio', 'estudios', 'universidad', 'clase', 'curso'],
  Marketplace: ['marketplace', 'venta', 'vendí', 'vendi'],
  Mudanzas: ['mudanza', 'mudanzas'],
  taxi: ['taxi'],
  Otros: ['otro', 'otros', 'varios'],
}

const NUMBER_WORDS = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  veinte: 20,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
}

const normalizeText = (value = '') =>
  value
    .toLocaleLowerCase('es-PE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const getSignificantWords = (value) =>
  normalizeText(value)
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))

const findByNameInText = (items, text) => {
  const normalizedText = normalizeText(text)

  return [...items]
    .sort((first, second) => second.name.length - first.name.length)
    .find((item) => {
      const words = getSignificantWords(item.name)

      return words.length > 0 && words.every((word) => normalizedText.includes(word))
    })
}

const parseNumberPart = (value) => {
  if (/^\d+$/.test(value)) return Number(value)

  return NUMBER_WORDS[value] ?? null
}

const parseAmount = (text) => {
  const normalizedText = normalizeText(text)
  const spokenDecimalMatch = normalizedText.match(
    /\b(\d+|[a-z]+)\s+(?:soles?\s+)?(?:punto|coma|con)\s+(\d+|[a-z]+)\b/,
  )

  if (spokenDecimalMatch) {
    const wholePart = parseNumberPart(spokenDecimalMatch[1])
    const decimalPart = parseNumberPart(spokenDecimalMatch[2])

    if (
      wholePart !== null &&
      decimalPart !== null &&
      decimalPart >= 0 &&
      decimalPart < 100
    ) {
      return Number((wholePart + decimalPart / 100).toFixed(2))
    }
  }

  const separatedDecimalMatch = normalizedText.match(
    /\b(\d{1,2})\s+(?:soles?\s+)?(\d{2})\b/,
  )

  if (separatedDecimalMatch) {
    return Number(`${separatedDecimalMatch[1]}.${separatedDecimalMatch[2]}`)
  }

  const amountMatch = normalizedText.match(
    /(?:s\/?\.?\s*)?(\d+(?:[.,]\d{1,2})?)/,
  )

  if (!amountMatch) return ''

  const amount = Number(amountMatch[1].replace(',', '.'))

  return Number.isFinite(amount) ? amount : ''
}

const parseType = (text) => {
  const normalizedText = normalizeText(text)

  if (
    /\b(ingreso|ingrese|recibi|recibieron|me pagaron|cobre|cobro|gane|gano|ganado|deposito|venta|vendi)\b/.test(
      normalizedText,
    )
  ) {
    return 'INCOME'
  }

  if (
    /\b(gasto|gaste|gastado|pague|pago|compre|compro|comprado|salio|sali|consumo|comida)\b/.test(
      normalizedText,
    )
  ) {
    return 'EXPENSE'
  }

  return ''
}

const findCategory = (categories, type, text) => {
  const availableCategories = categories.filter(
    (category) => category.type === type,
  )
  const exactCategory = findByNameInText(availableCategories, text)

  if (exactCategory) {
    return exactCategory
  }

  const normalizedText = normalizeText(text)
  const categoryAlias = Object.entries(CATEGORY_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizedText.includes(normalizeText(alias))),
  )

  if (!categoryAlias) return null

  return availableCategories.find(
    (category) => normalizeText(category.name) === normalizeText(categoryAlias[0]),
  ) || null
}

const extractDescription = (text, category) => {
  const detailMatch = text.match(
    /\b(?:en|por|para)\s+(.+?)(?=\s+(?:de mi|en mi|con|usando|desde|y\s+(?:pague|pago|use|utilice))\b|[,.]|$)/i,
  )

  if (detailMatch?.[1]) {
    return detailMatch[1].trim()
  }

  return category?.name || ''
}

const hasUnsupportedDate = (text) =>
  /\b(ayer|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(
    normalizeText(text),
  )

const getMissingFields = (formData) => {
  const missingFields = []

  if (!formData.type) missingFields.push('tipo de movimiento')
  if (!formData.amount) missingFields.push('monto')
  if (!formData.accountId) missingFields.push('cuenta')
  if (!formData.categoryId) missingFields.push('categoría')
  if (!formData.paymentMethodId) missingFields.push('método de pago')

  return missingFields
}

const parseVoiceMovement = (
  transcript,
  { categories = [], paymentMethods = [], accounts = [] } = {},
) => {
  const type = parseType(transcript)
  const amount = parseAmount(transcript)
  const account = findByNameInText(
    accounts.filter((item) => item.isActive),
    transcript,
  )
  const spokenPaymentMethod = findByNameInText(paymentMethods, transcript)
  const category = type ? findCategory(categories, type, transcript) : null
  const inferredPaymentMethod =
    spokenPaymentMethod ||
    paymentMethods.find((method) => {
      if (!account) return false

      const accountWords = getSignificantWords(account.name)
      const methodWords = getSignificantWords(method.name)

      return methodWords.some((word) => accountWords.includes(word))
    })

  const formData = {
    type,
    amount,
    description: extractDescription(transcript, category),
    categoryId: category?.id || '',
    paymentMethodId: inferredPaymentMethod?.id || '',
    accountId: account?.id || '',
  }

  return {
    formData,
    missingFields: getMissingFields(formData),
    dateWarning: hasUnsupportedDate(transcript)
      ? 'La primera versión solo registra movimientos para hoy.'
      : '',
  }
}

export default parseVoiceMovement

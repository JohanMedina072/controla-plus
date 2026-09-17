const express = require('express')
const prisma = require('../config/prisma')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({
        ok: false,
        message: 'userId es requerido',
      })
    }

    const [categories, paymentMethods] = await Promise.all([
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
      prisma.paymentMethod.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
    ])

    res.json({
      ok: true,
      data: {
        categories,
        paymentMethods,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      message: 'No se pudo cargar el catálogo',
    })
  }
})

module.exports = router
const express = require('express')
const prisma = require('../config/prisma')
const { getDefaultUserId } = require('../config/app')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = getDefaultUserId()

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
    next(error)
  }
})

module.exports = router

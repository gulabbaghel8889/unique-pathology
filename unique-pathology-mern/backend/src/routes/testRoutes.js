import express from 'express'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'

export const testRouter = express.Router()

// GET /api/tests - Search & filter tests
testRouter.get('/tests', async (req, res, next) => {
  try {
    const { category, department, search, popular } = req.query
    const query = { isActive: true }

    if (category && category !== 'All Tests') {
      query.category = category
    }

    if (department && department !== 'All Departments') {
      query.department = department
    }

    if (popular === 'true') {
      query.isPopular = true
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [{ name: regex }, { shortCode: regex }, { description: regex }, { category: regex }]
    }

    const tests = await Test.find(query).sort({ isPopular: -1, name: 1 }).lean()

    const categories = [
      'All Tests',
      'Blood Tests',
      'Diabetes',
      'Hormones',
      'Heart Health',
      'Organ Health',
      'Infection & Immunity',
      'Vitamins & Nutrition',
      'General Health',
    ]

    res.json({
      count: tests.length,
      categories,
      tests,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/tests/:id
testRouter.get('/tests/:id', async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isActive: true }).lean()
    if (!test) {
      return res.status(404).json({ message: 'Diagnostic test not found or currently inactive.' })
    }
    res.json({ test })
  } catch (err) {
    next(err)
  }
})

// GET /api/packages - List health screening packages
testRouter.get('/packages', async (req, res, next) => {
  try {
    const { category, featured } = req.query
    const query = { isActive: true }

    if (category && category !== 'All Packages') {
      query.category = category
    }

    if (featured === 'true') {
      query.isFeatured = true
    }

    const packages = await Package.find(query).sort({ isFeatured: -1, pricePaise: 1 }).lean()

    res.json({
      count: packages.length,
      packages,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/packages/:id
testRouter.get('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ _id: req.params.id, isActive: true }).lean()
    if (!pkg) {
      return res.status(404).json({ message: 'Health package not found or inactive.' })
    }
    res.json({ package: pkg })
  } catch (err) {
    next(err)
  }
})

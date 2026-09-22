const express = require("express")
const { fetchMetrics } = require("../controllers/metrics")

const router = express.Router()

//Routes
router.get("/", fetchMetrics)

module.exports = router
const express = require("express");
const {
  createFlight,
  listFlights,
  searchFlights,
  getFlightById,
  updateFlight,
  deleteFlight,
} = require("../controllers/flightController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", listFlights);
router.get("/search", searchFlights);
router.get("/:id", getFlightById);

// Admin-only flight management endpoints.
router.post("/admin", adminAuth, createFlight);
router.put("/admin/:id", adminAuth, updateFlight);
router.delete("/admin/:id", adminAuth, deleteFlight);

module.exports = router;

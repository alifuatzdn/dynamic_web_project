const express = require("express");
const {
  createFlight,
  listFlights,
  searchFlights,
  getFlightById,
  updateFlight,
  deleteFlight,
} = require("../controllers/flightController");
const userAuth = require("../middleware/userAuth");

const router = express.Router();

router.get("/", listFlights);
router.get("/search", searchFlights);
router.get("/:id", getFlightById);

// User-only flight management endpoints.
router.post("/user", userAuth, createFlight);
router.put("/user/:id", userAuth, updateFlight);
router.delete("/user/:id", userAuth, deleteFlight);

module.exports = router;

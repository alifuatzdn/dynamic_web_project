const express = require("express");
const {
  createFlight,
  listFlights,
  getFlightById,
  updateFlight,
  deleteFlight,
} = require("../controllers/flightController");
const { userAuth, adminOnly } = require("../middleware/userAuth");

const router = express.Router();

router.get("/", listFlights);
router.get("/:id", getFlightById);

//Admin flight management endpoints.
router.post("/user", userAuth, adminOnly, createFlight);
router.put("/user/:id", userAuth, adminOnly, updateFlight);
router.delete("/user/:id", userAuth, adminOnly, deleteFlight);

module.exports = router;

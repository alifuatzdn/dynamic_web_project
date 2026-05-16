const express = require("express");
const { createTicket, getAllTickets, getUserTickets } = require("../controllers/ticketController");
const { userAuth, adminOnly } = require("../middleware/userAuth");

const router = express.Router();

// All ticket routes require auth; admin can list all tickets.
router.post("/", userAuth, createTicket);
router.get("/all", userAuth, adminOnly, getAllTickets);
router.get("/user/:username", userAuth, getUserTickets);

module.exports = router;

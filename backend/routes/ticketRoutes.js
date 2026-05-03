const express = require("express");
const { createTicket, getAllTickets, getUserTickets } = require("../controllers/ticketController");

const router = express.Router();

router.post("/", createTicket);
router.get("/all", getAllTickets);
router.get("/user/:username", getUserTickets);

module.exports = router;

const express = require("express");
const { createTicket } = require("../controllers/ticketController");

const router = express.Router();

router.post("/", createTicket);

module.exports = router;

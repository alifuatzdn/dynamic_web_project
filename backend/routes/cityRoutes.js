const express = require("express");
const { listCities } = require("../controllers/cityController");

const router = express.Router();

router.get("/", listCities);

module.exports = router;

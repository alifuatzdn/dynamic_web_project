const express = require("express");
const cors = require("cors");
const flightRoutes = require("./routes/flightRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/userRoutes");
const cityRoutes = require("./routes/cityRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Quick health check so I can see the API is alive.
app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

// Mount feature routes in one place for easier scanning.
app.use("/api/flights", flightRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cities", cityRoutes);

module.exports = app;

require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");
const seedCities = require("./utils/seedCities");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    await seedCities();
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

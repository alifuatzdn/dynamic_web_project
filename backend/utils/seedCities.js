const prisma = require("../config/prisma");
const cities = require("../data/cities");

async function seedCities() {
  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

module.exports = seedCities;

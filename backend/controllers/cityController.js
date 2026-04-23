const prisma = require("../config/prisma");

async function listCities(req, res) {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    const result = cities.map((city) => ({
      _id: city.id,
      name: city.name,
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  listCities,
};

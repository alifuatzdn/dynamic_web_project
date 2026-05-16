const City = require("../models/City");

async function listCities(req, res) {
  try {
    const cities = await City.find({}).sort({ plateCode: 1 });

    const mappedCities = cities.map(city => ({
      id: city._id,
      name: city.name
    }));

    return res.status(200).json(mappedCities);
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = { listCities };
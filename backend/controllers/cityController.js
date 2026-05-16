const City = require("../models/City");

async function listCities(req, res) {
  try {
    // Sorted list makes dropdowns feel stable for users.
    const cities = await City.find({}).sort({ plateCode: 1 });

    // Keep response light for the UI (id + name only).
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
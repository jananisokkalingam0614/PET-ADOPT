const express = require('express');
const router  = express.Router();
const Pet     = require('../models/Pet');
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { syncExcel } = require('../excel');

router.get('/', async (req, res) => {
  try {
    const { species, breed, size, gender, city, state, search, status, page=1, limit=12, sort='-createdAt' } = req.query;
    const filter = { status: status || 'available' };
    if (species) filter.species = species.toLowerCase();
    if (breed)   filter.breed   = { $regex: breed,  $options: 'i' };
    if (size)    filter.size    = size;
    if (gender)  filter.gender  = gender;
    if (city)    filter['location.city']  = { $regex: city,  $options: 'i' };
    if (state)   filter['location.state'] = { $regex: state, $options: 'i' };
    if (search)  filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } },
      { 'location.city': { $regex: search, $options: 'i' } }
    ];
    const skip = (parseInt(page)-1) * parseInt(limit);
    const [pets, total] = await Promise.all([
      Pet.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Pet.countDocuments(filter)
    ]);
    res.json({ success: true, count: pets.length, total, pages: Math.ceil(total/parseInt(limit)), pets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/featured', async (req, res) => {
  const pets = await Pet.find({ status: 'available' }).sort('-createdAt').limit(8).lean();
  res.json({ success: true, pets });
});

router.get('/:id', async (req, res) => {
  const pet = await Pet.findById(req.params.id).lean();
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
  res.json({ success: true, pet });
});

router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const petData = typeof req.body.petData === 'string' ? JSON.parse(req.body.petData) : req.body;
    if (req.files && req.files.length > 0) {
      petData.images = req.files.map(f => `/uploads/${f.filename}`);
      petData.primaryImage = petData.images[0];
    }
    petData.addedBy = req.user._id;
    const pet = await Pet.create(petData);
    await syncExcel(); // ← Auto update Excel
    res.status(201).json({ success: true, message: `${pet.name} added!`, pet });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
  await syncExcel(); // ← Auto update Excel
  res.json({ success: true, pet });
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  const pet = await Pet.findByIdAndDelete(req.params.id);
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
  await syncExcel(); // ← Auto update Excel
  res.json({ success: true, message: `${pet.name} removed.` });
});

module.exports = router;

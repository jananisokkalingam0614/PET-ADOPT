const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

router.post('/favorites/:petId', protect, async (req, res) => {
  const user  = await User.findById(req.user._id);
  const petId = req.params.petId;
  const isFav = user.favorites.map(String).includes(petId);
  if (isFav) {
    user.favorites = user.favorites.filter(id => id.toString() !== petId);
    await user.save();
    res.json({ success: true, message: 'Removed from wishlist.', favorited: false });
  } else {
    user.favorites.push(petId);
    await user.save();
    res.json({ success: true, message: 'Saved to wishlist!', favorited: true });
  }
});

router.get('/favorites', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('favorites', 'name species breed primaryImage location status age gender');
  res.json({ success: true, favorites: user.favorites });
});

module.exports = router;

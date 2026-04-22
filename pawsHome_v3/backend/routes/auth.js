const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

router.post('/signup', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    if (await User.findOne({ email: req.body.email }))
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    const user  = await User.create(req.body);
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Account created!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites', 'name primaryImage species status');
  res.json({ success: true, user });
});

router.put('/update-profile', protect, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
  res.json({ success: true, user });
});

module.exports = router;

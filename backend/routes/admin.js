const express     = require('express');
const router      = express.Router();
const User        = require('../models/User');
const Pet         = require('../models/Pet');
const Application = require('../models/Application');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [totalPets, availablePets, adoptedPets, pendingPets,
           totalApps, pendingApps, approvedApps, totalUsers] = await Promise.all([
      Pet.countDocuments(), Pet.countDocuments({status:'available'}),
      Pet.countDocuments({status:'adopted'}), Pet.countDocuments({status:'pending'}),
      Application.countDocuments(), Application.countDocuments({status:'pending'}),
      Application.countDocuments({status:'approved'}), User.countDocuments({role:'user'})
    ]);
    const recentApplications = await Application.find()
      .populate('pet','name species').populate('applicant','name email')
      .sort('-submittedAt').limit(5).lean();
    res.json({ success: true,
      stats: {
        pets:         { total:totalPets, available:availablePets, adopted:adoptedPets, pending:pendingPets },
        applications: { total:totalApps, pending:pendingApps, approved:approvedApps },
        users:        { total:totalUsers }
      },
      recentApplications
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/users', async (req, res) => {
  const users = await User.find({ role:'user' }).select('-password').sort('-createdAt').lean();
  res.json({ success: true, users });
});

module.exports = router;

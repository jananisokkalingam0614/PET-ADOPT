const express     = require('express');
const router      = express.Router();
const Application = require('../models/Application');
const Pet         = require('../models/Pet');
const { protect, adminOnly } = require('../middleware/auth');
const { syncExcel } = require('../excel');

// Submit new application → auto update Excel
router.post('/', protect, async (req, res) => {
  try {
    const { petId, personalInfo, homeEnvironment, petExperience, whyAdopt, agreements } = req.body;
    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
    if (pet.status !== 'available') return res.status(400).json({ success: false, message: 'Pet is no longer available.' });
    const existing = await Application.findOne({ pet: petId, applicant: req.user._id, status: { $in: ['pending','reviewing'] } });
    if (existing) return res.status(400).json({ success: false, message: 'You already applied for this pet.' });

    const application = await Application.create({
      pet: petId, applicant: req.user._id,
      personalInfo, homeEnvironment, petExperience, whyAdopt, agreements
    });
    await Pet.findByIdAndUpdate(petId, { status: 'pending' });
    await application.populate('pet', 'name species breed primaryImage');

    await syncExcel(); // ← Auto update Excel when application submitted

    res.status(201).json({ success: true, message: "Application submitted! We'll be in touch soon. 🐾", application });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// Get my applications
router.get('/my', protect, async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('pet', 'name species breed primaryImage location status')
    .sort('-submittedAt').lean();
  res.json({ success: true, applications });
});

// Get all applications (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const applications = await Application.find(filter)
    .populate('pet', 'name species breed primaryImage')
    .populate('applicant', 'name email phone')
    .sort('-submittedAt').lean();
  res.json({ success: true, applications, total: applications.length });
});

// Get single application
router.get('/:id', protect, async (req, res) => {
  const app = await Application.findById(req.params.id).populate('pet').populate('applicant', 'name email phone');
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
  const isOwner = app.applicant._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied.' });
  res.json({ success: true, application: app });
});

// Approve or Reject application → auto update Excel
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes, rejectionReason } = req.body;
    if (!['reviewing','approved','rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const application = await Application.findByIdAndUpdate(req.params.id,
      {
        status,
        adminNotes:      adminNotes || '',
        rejectionReason: status === 'rejected' ? (rejectionReason || '') : '',
        reviewedAt:      Date.now(),
        reviewedBy:      req.user._id
      },
      { new: true }
    ).populate('pet').populate('applicant', 'name email');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

    // Update pet status based on decision
    if (status === 'approved') await Pet.findByIdAndUpdate(application.pet._id, { status: 'adopted' });
    if (status === 'rejected') await Pet.findByIdAndUpdate(application.pet._id, { status: 'available' });

    await syncExcel(); // ← Auto update Excel when admin approves/rejects

    res.json({ success: true, message: `Application ${status}!`, application });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

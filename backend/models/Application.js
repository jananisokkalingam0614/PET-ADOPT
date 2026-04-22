const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  pet:       { type: mongoose.Schema.Types.ObjectId, ref: 'Pet',  required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personalInfo: {
    fullName: { type: String, required: true },
    email:    { type: String, required: true },
    phone:    { type: String, required: true },
    address:  { street: String, city: String, state: String, zip: String }
  },
  homeEnvironment: {
    housingType:        { type: String, enum: ['house','apartment','condo','townhouse','other'], required: true },
    hasYard:            { type: Boolean, default: false },
    isRenting:          { type: Boolean, default: false },
    landlordAllowsPets: { type: Boolean, default: true },
    numberOfAdults:     { type: Number,  default: 1 },
    numberOfChildren:   { type: Number,  default: 0 },
    childrenAges:       { type: String,  default: '' }
  },
  petExperience: {
    hasPetsNow:         { type: Boolean, default: false },
    currentPets:        { type: String,  default: '' },
    previousExperience: { type: String,  required: true },
    hoursAlonePerDay:   { type: Number,  required: true },
    veterinarianName:   { type: String,  default: '' }
  },
  whyAdopt:        { type: String, required: true },
  agreements:      { agreeToVisit: Boolean, agreeToFees: Boolean, agreeToResponsibility: Boolean },
  status:          { type: String, enum: ['pending','reviewing','approved','rejected'], default: 'pending' },
  adminNotes:      { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  submittedAt:     { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now },
  reviewedAt:      Date,
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

ApplicationSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Application', ApplicationSchema);

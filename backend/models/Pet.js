const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  species:     { type: String, required: true, enum: ['dog','cat','rabbit','bird','hamster','guinea pig','reptile','other'], lowercase: true },
  breed:       { type: String, required: true },
  age:         { value: { type: Number, required: true }, unit: { type: String, enum: ['weeks','months','years'], default: 'years' } },
  gender:      { type: String, enum: ['male','female'], required: true },
  size:        { type: String, enum: ['small','medium','large','extra-large'], required: true },
  location:    { city: { type: String, required: true }, state: { type: String, required: true } },
  description: { type: String, required: true },
  health: {
    vaccinated:              { type: Boolean, default: false },
    spayedNeutered:          { type: Boolean, default: false },
    microchipped:            { type: Boolean, default: false },
    specialNeeds:            { type: Boolean, default: false },
    specialNeedsDescription: { type: String,  default: '' }
  },
  traits:       [String],
  images:       [String],
  primaryImage: { type: String, default: '' },
  status:       { type: String, enum: ['available','pending','adopted'], default: 'available' },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
});

PetSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Pet', PetSchema);

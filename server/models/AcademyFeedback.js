const mongoose = require('mongoose');

const AcademyFeedbackSchema = new mongoose.Schema({
  academyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Academy', required: true },
  fromId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  toId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  message:   { type: String, required: true, maxlength: 500 },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

AcademyFeedbackSchema.index({ academyId: 1, toId: 1 });

module.exports = mongoose.model('AcademyFeedback', AcademyFeedbackSchema);

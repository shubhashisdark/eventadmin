const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);

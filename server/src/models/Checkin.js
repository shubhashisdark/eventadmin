const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, default: Date.now },
    result: { type: String, enum: ['valid', 'duplicate', 'invalid'], required: true },
    ipAddress: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Checkin', checkinSchema);

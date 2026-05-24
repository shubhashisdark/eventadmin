const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    capacity: { type: Number, required: true }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    ticketTypes: [ticketTypeSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
    bannerUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);

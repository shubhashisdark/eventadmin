const { Router } = require('express');
const Event = require('../models/Event');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { createEventSchema, updateEventSchema } = require('../validation/eventSchema');

const router = Router();

// GET /events - list with simple filters and pagination
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, date } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const items = await Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)).lean();
  const total = await Event.countDocuments(filter);
  return res.json({ items, total, page: Number(page), limit: Number(limit) });
}));

// GET /events/:id - single event
router.get('/:id', asyncHandler(async (req, res) => {
  const ev = await Event.findById(req.params.id).lean();
  if (!ev) return res.status(404).json({ message: 'Event not found' });
  return res.json(ev);
}));

// POST /events - create (admin only)
router.post('/', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const parsed = createEventSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors.map(e=>e.message).join(', ') });
  const { title, description, date, venue, category, capacity, ticketTypes = [], bannerUrl = '', status = 'draft' } = parsed.data;
  const ev = await Event.create({ title, description, date: new Date(date), venue, category, capacity, ticketTypes, bannerUrl, status, createdBy: req.user.id });
  return res.status(201).json(ev);
}));

// PUT /events/:id - update (admin only)
router.put('/:id', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const parsed = updateEventSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors.map(e=>e.message).join(', ') });
  const updates = parsed.data;
  if (updates.date) updates.date = new Date(updates.date);
  const ev = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!ev) return res.status(404).json({ message: 'Event not found' });
  return res.json(ev);
}));

// DELETE /events/:id - delete (admin only)
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const ev = await Event.findByIdAndDelete(req.params.id);
  if (!ev) return res.status(404).json({ message: 'Event not found' });
  return res.json({ message: 'Event deleted' });
}));

module.exports = router;

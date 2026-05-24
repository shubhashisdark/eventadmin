const { Router } = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Checkin = require('../models/Checkin');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { createEventSchema } = require('../validation/eventSchema');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

const upload = multer();

// Configure Cloudinary from env if available
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

const router = Router();

// Event stats: total registrations, checked-in count, remaining capacity, hourly check-ins
router.get('/events/:id/stats', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId).lean();
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const totalRegs = await Booking.countDocuments({ eventId });
  const checkedIn = await Ticket.countDocuments({ eventId, isCheckedIn: true });
  const remaining = Math.max(0, event.capacity - (event.registeredCount || 0));

  // hourly checkins aggregation
  const agg = await Checkin.aggregate([
    { $match: { eventId: event._id, result: 'valid' } },
    { $group: { _id: { $hour: '$scannedAt' }, count: { $sum: 1 } } },
    { $sort: { '_id': 1 } }
  ]);

  return res.json({ totalRegistrations: totalRegs, checkedIn, remainingCapacity: remaining, hourly: agg });
}));

// Attendee list
router.get('/events/:id/attendees', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId).lean();
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const tickets = await Ticket.find({ eventId }).populate('bookingId').populate('userId').lean();
  const list = tickets.map(t => ({
    ticketId: t._id,
    ticket: {
      _id: t._id,
      qrPayload: t.qrPayload,
      qrCodeBase64: t.qrCodeBase64,
      isCheckedIn: t.isCheckedIn,
      checkedInAt: t.checkedInAt,
      checkedInBy: t.checkedInBy
    },
    user: t.userId,
    booking: t.bookingId ? {
      _id: t.bookingId._id,
      userId: t.bookingId.userId,
      eventId: t.bookingId.eventId,
      ticketTypeId: t.bookingId.ticketTypeId,
      status: t.bookingId.status,
      createdAt: t.bookingId.createdAt,
      updatedAt: t.bookingId.updatedAt
    } : null,
    event: {
      _id: event._id,
      title: event.title,
      date: event.date,
      venue: event.venue,
      category: event.category,
      capacity: event.capacity,
      registeredCount: event.registeredCount
    },
    ticketType: event.ticketTypes?.find(tt => String(tt._id) === String(t.bookingId?.ticketTypeId)) || null
  }));
  return res.json({ event, attendees: list });
}));

// CSV export
router.get('/events/:id/export', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId).lean();
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const tickets = await Ticket.find({ eventId }).populate('userId').populate('bookingId').lean();

  // build CSV
  const headers = [
    'ticketId',
    'bookingId',
    'userId',
    'userName',
    'userEmail',
    'eventId',
    'eventTitle',
    'ticketTypeId',
    'ticketTypeName',
    'ticketTypePrice',
    'bookingStatus',
    'isCheckedIn',
    'checkedInAt'
  ];
  const rows = tickets.map(t => {
    const ticketType = event.ticketTypes?.find(tt => String(tt._id) === String(t.bookingId?.ticketTypeId)) || null;
    return [
      t._id,
      t.bookingId?._id || '',
      t.userId?._id || '',
      t.userId?.name || '',
      t.userId?.email || '',
      event._id,
      event.title,
      t.bookingId?.ticketTypeId || '',
      ticketType?.name || '',
      ticketType?.price ?? '',
      t.bookingId?.status || '',
      t.isCheckedIn ? 'yes' : 'no',
      t.checkedInAt ? t.checkedInAt.toISOString() : ''
    ];
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendees-${eventId}.csv"`);
  res.write(headers.join(',') + '\n');
  for (const r of rows) res.write(r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',') + '\n');
  res.end();
}));

// Upload banner to Cloudinary and update event.bannerUrl
router.post('/events/:id/banner', authenticate, requireRole('admin'), upload.single('banner'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'banner file required' });
  if (!process.env.CLOUDINARY_URL) return res.status(500).json({ message: 'Cloudinary not configured' });

  const streamUpload = (buffer) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'event-banners' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

  const result = await streamUpload(req.file.buffer);
  await Event.findByIdAndUpdate(req.params.id, { bannerUrl: result.secure_url });
  return res.json({ bannerUrl: result.secure_url });
}));

module.exports = router;

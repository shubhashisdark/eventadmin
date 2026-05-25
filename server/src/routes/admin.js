const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Checkin = require('../models/Checkin');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { sendMail } = require('../utils/email');
const { createEventSchema } = require('../validation/eventSchema');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const { signAccess } = require('../utils/jwt');
const { buildTicketEmail } = require('../utils/ticketEmail');

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
    'phone',
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
      t.userId?.phone || '',
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

// Manual customer booking creation for an event
router.post('/events/:id/customers', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const { name, phone = '', email, ticketTypeId } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (!Array.isArray(event.ticketTypes) || event.ticketTypes.length === 0) {
    return res.status(400).json({ message: 'Add at least one ticket option before creating a customer booking' });
  }

  const selectedTicketTypeId = ticketTypeId || event.ticketTypes[0]._id;
  const ticketType = event.ticketTypes.find(tt => String(tt._id) === String(selectedTicketTypeId));
  if (!ticketType) {
    return res.status(400).json({ message: 'Selected ticket type is not valid for this event' });
  }

  if (event.registeredCount >= event.capacity) {
    return res.status(409).json({ message: 'Event is full' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const guestPassword = crypto.randomBytes(12).toString('hex');
    const passwordHash = await bcrypt.hash(guestPassword, 10);
    user = await User.create({ name, phone, email: normalizedEmail, passwordHash, role: 'user' });
  } else {
    user.name = name;
    user.phone = phone;
    await user.save();
  }

  const existingBooking = await Booking.findOne({ userId: user._id, eventId: event._id });
  if (existingBooking) {
    return res.status(409).json({ message: 'This customer already has a booking for this event' });
  }

  const booking = await Booking.create({ userId: user._id, eventId: event._id, ticketTypeId: ticketType._id });
  const ticket = await Ticket.create({ bookingId: booking._id, userId: user._id, eventId: event._id, qrPayload: 'pending' });

  const payloadJwt = signAccess(
    { ticketId: ticket._id.toString(), eventId: event._id.toString(), userId: user._id.toString() },
    { expiresIn: '365d' }
  );
  const qrCodeBase64 = await QRCode.toDataURL(payloadJwt);

  ticket.qrPayload = payloadJwt;
  ticket.qrCodeBase64 = qrCodeBase64;
  await ticket.save();

  await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });

  const emailDetails = buildTicketEmail({
    userName: user.name,
    event,
    ticketType,
    ticket: {
      _id: ticket._id,
      bookingId: booking._id,
      isCheckedIn: false
    },
    qrDataUrl: qrCodeBase64
  });

  const qrMatches = qrCodeBase64.match(/^data:(image\/\w+);base64,(.*)$/);
  const attachments = qrMatches ? [{ filename: 'ticket.png', content: qrMatches[2], encoding: 'base64', contentType: qrMatches[1] }] : [];

  sendMail({
    to: user.email,
    subject: `Your ticket for ${event.title}`,
    text: emailDetails.text,
    html: emailDetails.html,
    attachments
  }).catch(err => console.error('Customer booking email failed:', err.message));

  return res.status(201).json({
    message: 'Customer booking created',
    user: { id: user._id, name: user.name, phone: user.phone || '', email: user.email },
    event: { id: event._id, title: event.title, venue: event.venue, date: event.date },
    ticketType: { id: ticketType._id, name: ticketType.name, price: ticketType.price || 0 },
    booking: { id: booking._id, status: booking.status },
    ticket: { id: ticket._id, qrPayload: payloadJwt, qrCodeBase64 },
    qrCode: qrCodeBase64
  });
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

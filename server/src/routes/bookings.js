const { Router } = require('express');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../utils/email');
const { signAccess } = require('../utils/jwt');

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { eventId, ticketTypeId } = req.body || {};
  if (!eventId || !ticketTypeId) return res.status(400).json({ message: 'eventId and ticketTypeId required' });

  try {
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') return res.status(404).json({ message: 'Event not available' });
    if (event.registeredCount >= event.capacity) return res.status(409).json({ message: 'Event is full' });

    // create booking
    const booking = await Booking.create({ userId: req.user.id, eventId, ticketTypeId });

    // create ticket placeholder
    const ticket = await Ticket.create({ bookingId: booking._id, userId: req.user.id, eventId, qrPayload: 'pending' });

    // sign QR payload (JWT) using ticket id
    const payloadJwt = signAccess({ ticketId: ticket._id.toString(), eventId: event._id.toString(), userId: req.user.id.toString() }, { expiresIn: '365d' });
    const qrDataUrl = await QRCode.toDataURL(payloadJwt);

    ticket.qrPayload = payloadJwt;
    ticket.qrCodeBase64 = qrDataUrl;
    await ticket.save();

    // increment registered count (best-effort)
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    return res.status(201).json({ bookingId: booking._id, ticketId: ticket._id, qrCode: qrDataUrl });
  } catch (err) {
    // handle unique booking constraint
    if (err.code === 11000) return res.status(409).json({ message: 'You already have a booking for this event' });
    return res.status(500).json({ message: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate('eventId').lean();
    const tickets = await Ticket.find({ userId: req.user.id }).lean();
    return res.json({ bookings, tickets });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/tickets/:id/qr', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    return res.json({ qrCode: ticket.qrCodeBase64 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /bookings/:id/resend - resend booking confirmation email with QR
router.post('/:id/resend', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // allow user to resend their own booking, or admin
    if (booking.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to resend this booking' });
    }

    const ticket = await Ticket.findOne({ bookingId: booking._id });
    const user = require('../models/User');
    const userDoc = await user.findById(booking.userId).lean();
    const event = await Event.findById(booking.eventId).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found for booking' });

    // ensure we have a QR image; generate if missing
    let qrDataUrl = ticket.qrCodeBase64;
    if (!qrDataUrl) {
      qrDataUrl = await QRCode.toDataURL(ticket.qrPayload || '');
      ticket.qrCodeBase64 = qrDataUrl;
      await Ticket.findByIdAndUpdate(ticket._id, { qrCodeBase64: qrDataUrl });
    }

    // prepare attachment from data URL
    const matches = qrDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    let attachments = [];
    if (matches) {
      attachments.push({
        filename: 'ticket.png',
        content: matches[2],
        encoding: 'base64',
        contentType: matches[1]
      });
    }

    const subject = `Your ticket for ${event.title}`;
    const text = `Hello ${userDoc.name},\n\nAttached is your ticket for ${event.title} on ${new Date(event.date).toLocaleString()}.`;
    const html = `<p>Hello ${userDoc.name},</p><p>Attached is your ticket for <strong>${event.title}</strong> on ${new Date(event.date).toLocaleString()}.</p><p><img src="${qrDataUrl}" width="200"/></p>`;

    await sendMail({ to: userDoc.email, subject, text, html, attachments });

    return res.json({ message: 'Email resent' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

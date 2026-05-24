const { Router } = require('express');
const { verifyAccess } = require('../utils/jwt');
const Ticket = require('../models/Ticket');
const Checkin = require('../models/Checkin');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// Staff scans a QR string (signed JWT)
router.post('/scan', authenticate, requireRole('staff'), async (req, res) => {
  const { qr } = req.body || {};
  if (!qr) return res.status(400).json({ message: 'qr field required' });

  try {
    const decoded = verifyAccess(qr);
    const { ticketId, eventId } = decoded || {};
    if (!ticketId) {
      await Checkin.create({ ticketId: null, eventId: eventId || null, scannedBy: req.user.id, result: 'invalid', ipAddress: req.ip });
      return res.status(400).json({ status: 'invalid', message: 'Malformed ticket payload' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      await Checkin.create({ ticketId: null, eventId: eventId || null, scannedBy: req.user.id, result: 'invalid', ipAddress: req.ip });
      return res.status(404).json({ status: 'invalid', message: 'Ticket not found' });
    }

    // try atomic check-in
    const updated = await Ticket.findOneAndUpdate(
      { _id: ticketId, isCheckedIn: false },
      { isCheckedIn: true, checkedInAt: new Date(), checkedInBy: req.user.id },
      { new: true }
    );

    if (!updated) {
      // was already checked in
      await Checkin.create({ ticketId: ticket._id, eventId: ticket.eventId, scannedBy: req.user.id, result: 'duplicate', ipAddress: req.ip });
      return res.status(409).json({ status: 'duplicate', message: 'Ticket already checked-in' });
    }

    await Checkin.create({ ticketId: updated._id, eventId: updated.eventId, scannedBy: req.user.id, result: 'valid', ipAddress: req.ip });

    return res.json({ status: 'valid', ticketId: updated._id, checkedInAt: updated.checkedInAt });
  } catch (err) {
    return res.status(401).json({ status: 'invalid', message: 'Invalid or expired QR token' });
  }
});

router.get('/status/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.json({ ticketId: ticket._id, isCheckedIn: ticket.isCheckedIn, checkedInAt: ticket.checkedInAt });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

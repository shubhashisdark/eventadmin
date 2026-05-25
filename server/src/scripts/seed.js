const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDatabase = require('../config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const { signAccess } = require('../utils/jwt');

async function seed() {
  try {
    await connectDatabase();
    console.log('Connected to DB');

    // Admin user
    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const passwordHash = await bcrypt.hash('AdminPass123', 10);
      admin = await User.create({ name: 'Admin', phone: '+91-9000000001', email: adminEmail, passwordHash, role: 'admin' });
      console.log('Created admin user:', adminEmail, 'password: AdminPass123');
    } else {
      console.log('Admin user already exists:', adminEmail);
    }

    // Sample attendee
    const userEmail = 'user@example.com';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      const passwordHash = await bcrypt.hash('UserPass123', 10);
      user = await User.create({ name: 'Sample User', phone: '+91-9000000002', email: userEmail, passwordHash, role: 'user' });
      console.log('Created sample user:', userEmail, 'password: UserPass123');
    } else {
      console.log('Sample user already exists:', userEmail);
    }

    // Staff scanner account
    const staffEmail = 'staff@example.com';
    let staff = await User.findOne({ email: staffEmail });
    if (!staff) {
      const passwordHash = await bcrypt.hash('StaffPass123', 10);
      staff = await User.create({ name: 'Staff Scanner', phone: '+91-9000000003', email: staffEmail, passwordHash, role: 'staff' });
      console.log('Created staff user:', staffEmail, 'password: StaffPass123');
    } else {
      console.log('Staff user already exists:', staffEmail);
    }

    const sampleEvents = [
      {
        title: 'Sample Concert',
        description: 'A sample event for testing',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        venue: 'Test Venue',
        category: 'Music',
        capacity: 200,
        ticketTypes: [{ name: 'General', price: 0, capacity: 200 }]
      },
      {
        title: 'Tech Meetup Night',
        description: 'Networking and talks for developers and founders',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        venue: 'Innovation Hub',
        category: 'Technology',
        capacity: 120,
        ticketTypes: [{ name: 'Standard', price: 10, capacity: 120 }]
      },
      {
        title: 'Startup Pitch Day',
        description: 'Pitch competition with mentors and investors',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Conference Center',
        category: 'Business',
        capacity: 150,
        ticketTypes: [{ name: 'Entry', price: 5, capacity: 150 }]
      },
      {
        title: 'Photography Workshop',
        description: 'Hands-on workshop for beginner and intermediate photographers',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        venue: 'Creative Studio',
        category: 'Workshop',
        capacity: 60,
        ticketTypes: [{ name: 'Workshop Pass', price: 25, capacity: 60 }]
      }
    ];

    const createdEvents = [];
    for (const eventData of sampleEvents) {
      let ev = await Event.findOne({ title: eventData.title });
      if (!ev) {
        ev = await Event.create({
          ...eventData,
          registeredCount: 0,
          createdBy: admin._id,
          status: 'published'
        });
        console.log('Created sample event:', ev.title, ev._id.toString());
      } else {
        console.log('Sample event already exists:', ev.title, ev._id.toString());
      }

      createdEvents.push(ev);
    }

    const ev = createdEvents[0];

    // Create a booking and ticket for sample user
    const existingBooking = await Booking.findOne({ userId: user._id, eventId: ev._id });
    if (!existingBooking) {
      const booking = await Booking.create({ userId: user._id, eventId: ev._id, ticketTypeId: ev.ticketTypes[0]._id });
      const ticket = await Ticket.create({ bookingId: booking._id, userId: user._id, eventId: ev._id, qrPayload: 'pending' });

      // sign QR payload
      const payloadJwt = signAccess({ ticketId: ticket._id.toString(), eventId: ev._id.toString(), userId: user._id.toString() }, { expiresIn: '365d' });
      ticket.qrPayload = payloadJwt;
      // generate simple data URL (not required server-side but useful)
      ticket.qrCodeBase64 = '';
      await ticket.save();

      // increment event registeredCount
      await Event.findByIdAndUpdate(ev._id, { $inc: { registeredCount: 1 } });

      console.log('Created booking and ticket for', userEmail, 'ticketId:', ticket._id.toString());
      console.log('Sample QR payload (JWT):', payloadJwt);
    } else {
      console.log('Booking already exists for sample user');
    }

    console.log('Seeding complete');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

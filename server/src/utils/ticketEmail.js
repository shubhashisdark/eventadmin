function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function buildTicketEmail({ userName, event, ticketType, ticket, qrDataUrl }) {
  const eventDateTime = formatDateTime(event.date);
  const text = [
    `Hello ${userName},`,
    '',
    `Your ticket for ${event.title} has been booked successfully.`,
    `Event: ${event.title}`,
    `Date & Time: ${eventDateTime}`,
    `Venue: ${event.venue}`,
    `Ticket Type: ${ticketType?.name || 'Standard'}`,
    `Price: ${ticketType?.price ?? 0}`,
    `Ticket ID: ${ticket._id}`,
    `Booking ID: ${ticket.bookingId}`,
    `Checked In: ${ticket.isCheckedIn ? 'Yes' : 'No'}`,
    '',
    'Please keep this ticket safe and show the QR code at entry.'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName},</p>
      <p>Your ticket for <strong>${event.title}</strong> has been booked successfully.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><td><strong>Event</strong></td><td>${event.title}</td></tr>
        <tr><td><strong>Date & Time</strong></td><td>${eventDateTime}</td></tr>
        <tr><td><strong>Venue</strong></td><td>${event.venue}</td></tr>
        <tr><td><strong>Ticket Type</strong></td><td>${ticketType?.name || 'Standard'}</td></tr>
        <tr><td><strong>Price</strong></td><td>${ticketType?.price ?? 0}</td></tr>
        <tr><td><strong>Ticket ID</strong></td><td>${ticket._id}</td></tr>
        <tr><td><strong>Booking ID</strong></td><td>${ticket.bookingId}</td></tr>
        <tr><td><strong>Checked In</strong></td><td>${ticket.isCheckedIn ? 'Yes' : 'No'}</td></tr>
      </table>
      <p style="margin-top:16px">Scan this QR code at the venue:</p>
      <img src="${qrDataUrl}" alt="Ticket QR code" width="240" style="display:block;border:1px solid #e2e8f0;border-radius:12px;padding:8px;background:#fff" />
    </div>
  `;

  return { text, html };
}

module.exports = { buildTicketEmail, formatDateTime };

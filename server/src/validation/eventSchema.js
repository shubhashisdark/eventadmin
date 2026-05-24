const { z } = require('zod');

const ticketTypeSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative().optional().default(0),
  capacity: z.number().int().nonnegative()
});

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  date: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  venue: z.string().min(1),
  category: z.string().min(1),
  capacity: z.number().int().positive(),
  ticketTypes: z.array(ticketTypeSchema).optional(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft','published','cancelled']).optional()
});

const updateEventSchema = createEventSchema.partial();

module.exports = { createEventSchema, updateEventSchema };

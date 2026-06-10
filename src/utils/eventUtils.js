export const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.values(value);
};

export const getEventStartDate = (event = {}) => event.startDate || event.date || '';
export const getEventStartTime = (event = {}) => event.startTime || event.time || '';

export const getVenueName = (venue) => {
  if (!venue) return 'Venue TBD';
  return typeof venue === 'string' ? venue : venue.name || 'Venue TBD';
};

export const getVenueAddress = (venue) => {
  if (!venue || typeof venue === 'string') return '';
  return [venue.address, venue.city].filter(Boolean).join(', ');
};

export const getTicketTypes = (event = {}) => toArray(event.ticketTypes);

export const getRegistrationCount = (event = {}) => {
  if (typeof event.registered === 'number') return event.registered;
  if (typeof event.analytics?.registrations === 'number') return event.analytics.registrations;
  return Object.keys(event.registrations || {}).length;
};

export const getEventPrice = (event = {}) => {
  if (event.price !== undefined && event.price !== null) return event.price;
  const prices = getTicketTypes(event)
    .map(ticket => Number(ticket.price))
    .filter(price => Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : 0;
};

export const getEventImage = (event = {}) => (
  event.image ||
  event.media?.thumbnail ||
  event.media?.images?.[0]?.url ||
  event.media?.images?.[0] ||
  ''
);

export const getEventCapacity = (event = {}) => (
  event.maxCapacity ||
  event.capacity ||
  event.venue?.capacity ||
  getTicketTypes(event).reduce((total, ticket) => total + (Number(ticket.totalSeats) || 0), 0)
);

export const isPublishedEvent = (event = {}) => (event.status || 'published') === 'published';

export const normalizeEvent = (event = {}, id = event.id) => {
  const ticketTypes = getTicketTypes(event);
  const mediaImages = toArray(event.media?.images).map(image => (
    typeof image === 'string' ? { url: image } : image
  ));

  return {
    ...event,
    id,
    startDate: getEventStartDate(event),
    date: getEventStartDate(event),
    startTime: getEventStartTime(event),
    time: getEventStartTime(event),
    venue: typeof event.venue === 'string'
      ? { name: event.venue, address: event.venue, city: '' }
      : {
          name: 'Venue TBD',
          address: '',
          city: '',
          ...(event.venue || {})
        },
    ticketTypes,
    price: getEventPrice(event),
    capacity: getEventCapacity(event),
    registered: getRegistrationCount(event),
    image: getEventImage(event),
    media: {
      images: mediaImages,
      videos: toArray(event.media?.videos),
      thumbnail: getEventImage(event)
    }
  };
};

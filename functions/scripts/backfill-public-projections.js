const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const apply = process.argv.includes('--apply');
const projectId = 'ourvadodara-a4002';
const privateContentFields = new Set(['createdBy', 'createdByName', 'updatedBy', 'updatedByName', 'authorId', 'editorNotes', 'internalNotes', 'reviewNotes', 'moderationNotes', 'approvalHistory', 'audit']);
const privateEventFields = new Set(['registrations', 'checkedInUsers', 'scanHistory', 'promoCodes', 'registrationRequests', 'internalNotes', 'createdBy']);
const privateOfferFields = new Set(['reviewNote', 'rejectionReason', 'createdBy', 'updatedBy', 'approvalHistory', 'internalNotes', 'audit', 'brandAuthUid']);

const omit = (value, fields) => Object.fromEntries(Object.entries(value || {}).filter(([key]) => !fields.has(key)));
const publicContent = (item, id, type) => {
  if (!item) return null;
  const publishAt = Date.parse(item.publishedAt || item.scheduledFor || item.createdAt || 0);
  const notFuture = !Number.isFinite(publishAt) || publishAt <= Date.now();
  const status = item.status || 'published';
  const published = type === 'posts'
    ? !['draft', 'scheduled', 'archived', 'rejected'].includes(status) && item.isPublished !== false && notFuture
    : type === 'stories'
      ? status === 'published' && item.isPublished !== false && item.isActive !== false && notFuture
      : item.isPublished === true && status !== 'draft' && status !== 'scheduled' && notFuture;
  if (!published) return null;
  const projected = { ...omit(item, privateContentFields), id };
  if (projected.author && typeof projected.author === 'object') {
    projected.author = { name: String(projected.author.name || 'Our Vadodara').trim().slice(0, 120) };
  }
  return projected;
};
const publicEvent = (event, id) => event?.status === 'published' && event.isPublished !== false
  ? { ...omit(event, privateEventFields), id, analytics: { views: Number(event.analytics?.views || 0), registrations: Number(event.analytics?.registrations || 0), checkins: Number(event.analytics?.checkins || 0) } }
  : null;
const publicOffer = (offer, id) => offer && offer.active !== false && offer.brandActive !== false && offer.status === 'published' && (!offer.workflowStatus || offer.workflowStatus === 'published')
  ? { ...omit(offer, privateOfferFields), id }
  : null;

async function main() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'our-vadodara-projections-'));
  const sourceFile = path.join(temporaryDirectory, 'source.json');
  const updateFile = path.join(temporaryDirectory, 'updates.json');
  const runFirebase = args => {
    const result = spawnSync('npx', ['firebase-tools', ...args, '--project', projectId], {
      encoding: 'utf8',
      env: { ...process.env, DEBUG: '' },
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.status !== 0) {
      throw new Error((result.error?.message || result.stderr || result.stdout || 'Firebase CLI failed').trim());
    }
    return result;
  };

  try {
    runFirebase(['database:get', '/', '--output', sourceFile]);
    const root = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) || {};
  const updates = {};
  const contentPaths = { posts: 'publicPosts', stories: 'publicStories', reels: 'publicReels', carousels: 'publicCarousels' };
  for (const [source, target] of Object.entries(contentPaths)) {
    updates[target] = Object.fromEntries(Object.entries(root[source] || {}).map(([id, item]) => [id, publicContent(item, id, source)]).filter(([, item]) => item));
  }
  updates.publicEvents = Object.fromEntries(Object.entries(root.events || {}).map(([id, item]) => [id, publicEvent(item, id)]).filter(([, item]) => item));
  updates.publicOffers = Object.fromEntries(Object.entries(root.offers || {}).map(([id, item]) => [id, publicOffer(item, id)]).filter(([, item]) => item));
  const counts = Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, Object.keys(value).length]));
  counts.privateAuthorFieldLeaks = Object.values(contentPaths).reduce((total, target) => total + Object.values(updates[target] || {})
    .filter(item => item.author && typeof item.author === 'object' && Object.keys(item.author).some(key => key !== 'name')).length, 0);
  counts.paidPublishedEvents = Object.values(root.events || {}).filter(event => {
    if (event?.status !== 'published' || event.isPublished === false) return false;
    const tickets = Array.isArray(event.ticketTypes) ? event.ticketTypes : Object.values(event.ticketTypes || {});
    return tickets.some(ticket => Number(ticket.price || 0) > 0);
  }).length;
  console.log(`${apply ? 'Applying' : 'Dry run for'} public projections:`, counts);
    if (counts.privateAuthorFieldLeaks !== 0) throw new Error('Public content projection still contains private author fields');
    if (apply) {
      fs.writeFileSync(updateFile, JSON.stringify(updates));
      runFirebase(['database:update', '/', updateFile, '--force']);
      console.log('Public projections updated successfully.');
    }
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error.message);
  process.exit(1);
});

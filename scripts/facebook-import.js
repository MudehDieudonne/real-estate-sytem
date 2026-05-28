import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import { prisma } from '../src/lib/prisma.js';

const DATA_DIR = path.resolve(process.cwd(), 'data/facebook-import');
const RAW_POSTS_FILE = path.join(DATA_DIR, 'raw-posts.json');
const EXTRACTED_FILE = path.join(DATA_DIR, 'extracted-listings.json');
const VALID_FILE = path.join(DATA_DIR, 'valid-listings.json');
const NEEDS_REVIEW_FILE = path.join(DATA_DIR, 'needs-review-listings.json');
const REJECTED_FILE = path.join(DATA_DIR, 'rejected-listings.json');

const POST_TYPES = new Set(['sale', 'rent']);
const PROPERTY_TYPES = new Set([
  'apartment',
  'house',
  'condo',
  'villa',
  'duplex',
  'townhouse',
  'land',
]);
const OPTIONAL_STRING_DETAILS = new Set(['utilities', 'pet', 'income', 'furnished']);
const OPTIONAL_NUMBER_DETAILS = new Set([
  'size',
  'parlor',
  'parkingLots',
  'school',
  'bus',
  'restaurant',
  'hospital',
  'market',
]);
const OPTIONAL_BOOLEAN_DETAILS = new Set(['hasSwimmingPool', 'hasGym', 'hasSecurity']);

const command = process.argv[2];

const ensureDataDir = async () => {
  await mkdir(DATA_DIR, { recursive: true });
};

const readJson = async filePath => JSON.parse(await readFile(filePath, 'utf8'));

const writeJson = async (filePath, data) => {
  await ensureDataDir();
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const requireEnv = name => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const toNumber = value => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[^\d.-]/g, '');
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasText = value => typeof value === 'string' && value.trim().length > 0;

const cleanOptionalPostDetail = detail => {
  const source = detail && typeof detail === 'object' ? detail : {};
  const cleaned = {
    desc: hasText(source.desc) ? source.desc.trim() : '',
  };

  for (const field of OPTIONAL_STRING_DETAILS) {
    if (hasText(source[field])) cleaned[field] = source[field].trim();
  }

  for (const field of OPTIONAL_NUMBER_DETAILS) {
    const numberValue = toNumber(source[field]);
    if (Number.isInteger(numberValue) && numberValue >= 0) cleaned[field] = numberValue;
  }

  for (const field of OPTIONAL_BOOLEAN_DETAILS) {
    if (typeof source[field] === 'boolean') cleaned[field] = source[field];
  }

  return cleaned;
};

const normalizeListing = item => {
  const postDetail = cleanOptionalPostDetail(item.postDetail);

  return {
    title: hasText(item.title) ? item.title.trim() : '',
    description: hasText(item.description) ? item.description.trim() : postDetail.desc,
    price: toNumber(item.price),
    city: hasText(item.city) ? item.city.trim() : '',
    address: hasText(item.address) ? item.address.trim() : '',
    bedroom: toNumber(item.bedroom),
    bathroom: toNumber(item.bathroom),
    type: hasText(item.type) ? item.type.trim().toLowerCase() : '',
    property: hasText(item.property) ? item.property.trim().toLowerCase() : '',
    images: Array.isArray(item.images)
      ? item.images.filter(hasText).map(image => image.trim())
      : [],
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    postDetail: {
      ...postDetail,
      desc: postDetail.desc || (hasText(item.description) ? item.description.trim() : ''),
    },
    source: item.source || null,
  };
};

const validateListing = item => {
  const listing = normalizeListing(item);
  const errors = [];

  if (!listing.title) errors.push('title is required');
  if (!Number.isInteger(listing.price) || listing.price < 0)
    errors.push('price must be a positive integer');
  if (!listing.city) errors.push('city is required');
  if (!listing.address) errors.push('address is required');
  if (!Number.isInteger(listing.bedroom) || listing.bedroom < 0)
    errors.push('bedroom must be an integer');
  if (!Number.isInteger(listing.bathroom) || listing.bathroom < 0)
    errors.push('bathroom must be an integer');
  if (!POST_TYPES.has(listing.type)) errors.push('type must be sale or rent');
  if (!PROPERTY_TYPES.has(listing.property)) errors.push('property is not supported');
  if (!listing.images.length) errors.push('at least one image is required');
  if (typeof listing.latitude !== 'number') errors.push('latitude is required');
  if (typeof listing.longitude !== 'number') errors.push('longitude is required');
  if (!listing.postDetail.desc) errors.push('postDetail.desc is required');

  const hardErrors = errors.filter(
    error => !error.includes('latitude') && !error.includes('longitude')
  );

  return {
    listing,
    errors,
    status: errors.length === 0 ? 'valid' : hardErrors.length === 0 ? 'needs-review' : 'rejected',
  };
};

const attachmentImages = attachments => {
  if (!attachments?.data?.length) return [];

  return attachments.data.flatMap(attachment => {
    const images = [];
    if (attachment.media?.image?.src) images.push(attachment.media.image.src);

    if (attachment.subattachments?.data?.length) {
      for (const child of attachment.subattachments.data) {
        if (child.media?.image?.src) images.push(child.media.image.src);
      }
    }

    return images;
  });
};

const fetchFacebookPosts = async () => {
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || 'v25.0';
  const pageId = requireEnv('FACEBOOK_PAGE_ID');
  const accessToken = requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');
  const limit = Number.parseInt(process.env.FACEBOOK_IMPORT_LIMIT || '50', 10);
  const fields = [
    'id',
    'message',
    'created_time',
    'permalink_url',
    'full_picture',
    'attachments{media,subattachments{media},title,description,type,url}',
  ].join(',');

  const posts = [];
  let url = new URL(`https://graph.facebook.com/${graphVersion}/${pageId}/posts`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', String(Math.min(limit, 100)));
  url.searchParams.set('access_token', accessToken);

  while (url && posts.length < limit) {
    const response = await globalThis.fetch(url);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Facebook Graph API failed: ${JSON.stringify(body)}`);
    }

    posts.push(...(body.data || []));
    url = body.paging?.next ? new URL(body.paging.next) : null;
  }

  const normalized = posts.slice(0, limit).map(post => ({
    id: post.id,
    message: post.message || '',
    createdTime: post.created_time,
    permalinkUrl: post.permalink_url,
    images: [
      ...new Set([post.full_picture, ...attachmentImages(post.attachments)].filter(Boolean)),
    ],
    attachments: post.attachments || null,
  }));

  await writeJson(RAW_POSTS_FILE, {
    fetchedAt: new Date().toISOString(),
    pageId,
    count: normalized.length,
    posts: normalized,
  });

  console.log(`Fetched ${normalized.length} Facebook posts into ${RAW_POSTS_FILE}`);
};

const buildExtractionPrompt = post => `
Extract a real-estate listing from this Facebook post.

Rules:
- Return only valid JSON.
- If the post is not a property listing, return {"isListing": false, "reason": "..."}.
- Use this app's enum values only: type is "sale" or "rent"; property is one of apartment, house, condo, villa, duplex, townhouse, land.
- Use numbers for price, bedroom, bathroom, latitude, longitude.
- Put the main description in description and postDetail.desc.
- Omit optional postDetail fields unless they are explicit in the post text or source payload.
- Do not invent amenities, distances, coordinates, bedrooms, bathrooms, or prices. Use null for required fields that are missing.

Expected listing JSON:
{
  "isListing": true,
  "title": "string",
  "description": "string",
  "price": 0,
  "city": "string",
  "address": "string",
  "bedroom": 0,
  "bathroom": 0,
  "type": "sale",
  "property": "apartment",
  "images": [],
  "latitude": null,
  "longitude": null,
  "postDetail": {
    "desc": "string"
  },
  "confidence": {
    "overall": "high | medium | low",
    "missingFields": []
  }
}

Facebook post:
${JSON.stringify(post, null, 2)}
`;

const parseAiJson = content => {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(withoutFence);
};

const extractPost = async post => {
  const apiKey = requireEnv('AI_API_KEY');
  const model = requireEnv('AI_MODEL');
  const url = process.env.AI_CHAT_COMPLETIONS_URL || 'https://api.openai.com/v1/chat/completions';

  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You extract structured real-estate listing JSON. You are conservative and never invent missing facts.',
        },
        {
          role: 'user',
          content: buildExtractionPrompt(post),
        },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`AI extraction failed: ${JSON.stringify(body)}`);

  return parseAiJson(body.choices?.[0]?.message?.content || '');
};

const extractListings = async () => {
  const raw = await readJson(RAW_POSTS_FILE);
  const extracted = [];

  for (const post of raw.posts || []) {
    try {
      const result = await extractPost(post);
      extracted.push({
        ...result,
        images: result.images?.length ? result.images : post.images,
        source: {
          facebookPostId: post.id,
          facebookUrl: post.permalinkUrl,
          createdTime: post.createdTime,
        },
      });
      console.log(`Extracted ${post.id}`);
    } catch (err) {
      extracted.push({
        isListing: false,
        reason: err.message,
        source: {
          facebookPostId: post.id,
          facebookUrl: post.permalinkUrl,
          createdTime: post.createdTime,
        },
      });
      console.warn(`Failed to extract ${post.id}: ${err.message}`);
    }
  }

  await writeJson(EXTRACTED_FILE, extracted);
  console.log(`Wrote ${extracted.length} extracted records to ${EXTRACTED_FILE}`);
};

const validateExtractedListings = async () => {
  const extracted = await readJson(EXTRACTED_FILE);
  const valid = [];
  const needsReview = [];
  const rejected = [];

  for (const item of extracted) {
    if (!item.isListing) {
      rejected.push({ ...item, errors: [item.reason || 'not a listing'] });
      continue;
    }

    const result = validateListing(item);
    if (result.status === 'valid') valid.push(result.listing);
    if (result.status === 'needs-review') {
      needsReview.push({ ...result.listing, errors: result.errors });
    }
    if (result.status === 'rejected') {
      rejected.push({ ...result.listing, errors: result.errors });
    }
  }

  await writeJson(VALID_FILE, valid);
  await writeJson(NEEDS_REVIEW_FILE, needsReview);
  await writeJson(REJECTED_FILE, rejected);

  console.log(`Valid: ${valid.length}`);
  console.log(`Needs review: ${needsReview.length}`);
  console.log(`Rejected: ${rejected.length}`);
};

const getImportOwner = async () => {
  const email = requireEnv('FACEBOOK_IMPORT_OWNER_EMAIL');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user found for FACEBOOK_IMPORT_OWNER_EMAIL=${email}`);
  return user;
};

const importListings = async () => {
  const owner = await getImportOwner();
  const listings = await readJson(VALID_FILE);
  let created = 0;
  let skipped = 0;

  for (const listing of listings) {
    const existing = await prisma.post.findFirst({
      where: {
        title: listing.title,
        city: listing.city,
        address: listing.address,
        price: listing.price,
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.post.create({
      data: {
        title: listing.title,
        price: listing.price,
        images: listing.images,
        address: listing.address,
        city: listing.city,
        bedroom: listing.bedroom,
        bathroom: listing.bathroom,
        latitude: listing.latitude,
        longitude: listing.longitude,
        type: listing.type,
        property: listing.property,
        userId: owner.id,
        postDetail: {
          create: listing.postDetail,
        },
      },
    });

    created += 1;
  }

  await prisma.$disconnect();
  console.log(`Imported ${created} listings. Skipped ${skipped} duplicates.`);
};

const main = async () => {
  if (command === 'fetch') return fetchFacebookPosts();
  if (command === 'extract') return extractListings();
  if (command === 'validate') return validateExtractedListings();
  if (command === 'import') return importListings();

  throw new Error('Usage: node scripts/facebook-import.js fetch|extract|validate|import');
};

main().catch(async err => {
  await prisma.$disconnect();
  console.error(err.message);
  process.exit(1);
});

import { readFile, writeFile } from 'node:fs/promises';

const feeds = [
  { source:'Science Careers', url:'https://jobs.sciencecareers.org/jobsrss/?countrycode=US', region:'us', limit:8 },
  { source:'Inside Higher Ed', url:'https://careers.insidehighered.com/jobsrss/?FacultyJobs=12&SpecialFilters=125&countrycode=US', region:'us', limit:8 },
  { source:'Nature Careers', url:'https://www.nature.com/naturecareers/jobsrss/?keywords=Neuroscience&countrycode=GB', region:'global', limit:8 }
];

const MIN_JOBS = 5; // abort rather than wipe the live jobs.json below this count

// Strip tags BEFORE decoding entities (blocks unterminated-tag and decode-order bypasses),
// unwrap CDATA first, decode named + numeric entities.
const decode = value => String(value)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]*>/g, ' ')
  .replace(/<[^>]*$/, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => { try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ' '; } })
  .replace(/&#(\d+);/g, (_, dec) => { try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ' '; } })
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
  .replace(/\s+/g, ' ').trim();
const safeUrl = url => url.replace(/[\s"'<>]/g, '');
const field = (item, name) => decode((item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')) || [])[1] || '');
// Atom <link href="..."/> has no text content
const linkFor = item => {
  const text = field(item, 'link');
  if (text) return text;
  const href = (item.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '';
  return decode(href);
};
const roleFor = title => /postdoc|post-doctor|fellowship/i.test(title) ? 'postdoc'
  : /ph\.?d|doctoral/i.test(title) ? 'phd'
  : /research scientist|staff scientist|research associate/i.test(title) ? 'research' : 'faculty';
const tagsFor = title => [...new Set([
  ...(/neuroscience|neural|neurobiology/i.test(title) ? ['Neuroscience'] : []),
  ...(/computational|theoretical/i.test(title) ? ['Computational'] : []),
  ...(/postdoc|post-doctor|fellowship/i.test(title) ? ['Postdoc'] : []),
  ...(/tenure[- ]track/i.test(title) ? ['Tenure-track'] : []),
  ...(/assistant professor|associate professor|faculty/i.test(title) ? ['Faculty'] : [])
])].slice(0, 3);
const isoDate = date => { const t = Date.parse(date); return Number.isNaN(t) ? null : new Date(t).toISOString(); };

const jobs = [];
let feedsOk = 0;
for (const feed of feeds) {
  try {
    const response = await fetch(feed.url, { headers: { 'user-agent': 'signal-desk-job-monitor/1.0' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    // RSS <item> and Atom <entry>
    const items = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];
    if (!items.length) throw new Error('no items parsed');
    let count = 0;
    for (const item of items) {
      const rawTitle = field(item, 'title');
      const url = safeUrl(linkFor(item).split('?')[0]);
      const date = field(item, 'pubDate') || field(item, 'dc:date') || field(item, 'updated') || field(item, 'published');
      if (!rawTitle || !url || !/^https?:\/\//.test(url)) continue;
      // Org heuristic: dash separator first, else a short colon prefix (org-like); never split on multiple/long colon prefixes
      const dash = rawTitle.match(/^(.{2,60}?)\s+[–—-]\s+(.+)$/);
      const colonParts = rawTitle.split(':');
      const colonOrg = colonParts.length === 2 && colonParts[0].trim().split(/\s+/).length <= 8 ? colonParts[0].trim() : null;
      const org = dash ? dash[1].trim() : (colonOrg ?? feed.source);
      const title = dash ? dash[2].trim() : (colonOrg ? colonParts[1].trim() : rawTitle);
      jobs.push({
        title, org: `${org} · ${feed.region === 'us' ? 'United States' : feed.region === 'global' ? 'Global' : 'Europe'}`,
        role: roleFor(title), region: feed.region, source: feed.source,
        published: isoDate(date), tags: tagsFor(title), url
      });
      if (++count >= feed.limit) break;
    }
    feedsOk++;
  } catch (error) { console.warn(`Skipping ${feed.source}: ${error.message}`); }
}

if (jobs.length < MIN_JOBS) {
  console.error(`Only ${jobs.length} jobs parsed from ${feedsOk}/${feeds.length} feeds — aborting to avoid wiping jobs.json`);
  process.exit(1);
}
const unique = [...new Map(jobs.map(job => [job.url, job])).values()];
const output = { updatedAt: new Date().toISOString(), jobs: unique };
const previous = await readFile('jobs.json', 'utf8').catch(() => '');
const next = JSON.stringify(output, null, 2) + '\n';
if (previous !== next) { await writeFile('jobs.json', next); console.log(`Updated ${unique.length} jobs`); }
else console.log('No job changes');

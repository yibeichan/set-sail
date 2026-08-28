import { readFile, writeFile } from 'node:fs/promises';

const feeds = [
  { source:'Science Careers', url:'https://jobs.sciencecareers.org/jobsrss/?countrycode=US', region:'us', limit:8 },
  { source:'Inside Higher Ed', url:'https://careers.insidehighered.com/jobsrss/?FacultyJobs=12&SpecialFilters=125&countrycode=US', region:'us', limit:8 },
  { source:'Nature Careers', url:'https://www.nature.com/naturecareers/jobsrss/?keywords=Neuroscience&countrycode=GB', region:'global', limit:8 }
];

const decode = value => String(value)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')  // unwrap CDATA first
  .replace(/<[^>]*>/g, ' ')          // strip complete tags while still encoded
  .replace(/<[^>]*$/, ' ')           // strip unterminated tag remnant
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
  .replace(/\s+/g, ' ').trim();
const safeUrl = url => url.replace(/[\s"'<>]/g, '');
const field = (item, name) => decode((item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,'i'))||[])[1]||'');
const roleFor = title => /postdoc|post-doctor|fellowship/i.test(title)?'postdoc':/ph\.d|phd|doctoral/i.test(title)?'phd':/research scientist|staff scientist|research associate/i.test(title)?'research':'faculty';
const tagsFor = title => [...new Set([...( /neuroscience|neural|neurobiology/i.test(title)?['Neuroscience']:[]), ...(/computational|theoretical/i.test(title)?['Computational']:[]), ...(/postdoc|post-doctor|fellowship/i.test(title)?['Postdoc']:[]), ...(/tenure-track|tenure track/i.test(title)?['Tenure-track']:[]), ...(/assistant professor|associate professor|faculty/i.test(title)?['Faculty']:[])])].slice(0,3);
const ageFor = date => { const days=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/86400000)); return Number.isNaN(days)?'Recently':days===0?'Today':days===1?'Yesterday':`${days}d ago`; };

const jobs=[];
for (const feed of feeds) {
  try {
    const response=await fetch(feed.url,{headers:{'user-agent':'signal-desk-job-monitor/1.0'}});
    if(!response.ok) throw new Error(`${response.status}`);
    const xml=await response.text();
    for (const item of xml.match(/<item[\s\S]*?<\/item>/gi)||[]) {
      const rawTitle=field(item,'title'); const url=safeUrl(field(item,'link').split('?')[0]); const date=field(item,'pubDate')||field(item,'dc:date');
      if(!rawTitle||!url||!/^https?:\/\//.test(url)) continue;
      const parts=rawTitle.split(':'); const org=parts.length>1?parts.shift().trim():feed.source; const title=parts.join(':').trim()||rawTitle;
      jobs.push({title,org:`${org} · ${feed.region==='us'?'United States':feed.region==='global'?'Global':'Europe'}`,role:roleFor(title),region:feed.region,source:feed.source,age:ageFor(date),tags:tagsFor(title),url});
      if(jobs.filter(job=>job.source===feed.source).length>=feed.limit) break;
    }
  } catch (error) { console.warn(`Skipping ${feed.source}: ${error.message}`); }
}
const unique=[...new Map(jobs.map(job=>[job.url,job])).values()];
const output={updatedAt:new Date().toISOString(),jobs:unique};
const previous=await readFile('jobs.json','utf8').catch(()=> '');
const next=JSON.stringify(output,null,2)+'\n';
if(previous!==next){await writeFile('jobs.json',next);console.log(`Updated ${unique.length} jobs`)}else console.log('No job changes');

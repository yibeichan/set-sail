const jobs = [
  { title:'Tenure-Track Assistant Professor position', org:'Department of Biology - TAMU · College Station, TX', role:'faculty', region:'us', source:'Science Careers', age:'Live feed', tags:['Biology','Tenure-track'], url:'https://jobs.sciencecareers.org/job/679780/tenure-track-assistant-professor-position/?LinkSource=PremiumListing' },
  { title:'Tenure-track Assistant Professor', org:'University of Minnesota Chemistry Department · Minneapolis, MN', role:'faculty', region:'us', source:'Science Careers', age:'Live feed', tags:['Chemistry','Tenure-track'], url:'https://jobs.sciencecareers.org/job/679846/tenure-track-assistant-professor/?LinkSource=PremiumListing' },
  { title:'Assistant Professor of Medicine', org:'Columbia University · New York, NY', role:'faculty', region:'us', source:'Science Careers', age:'Live feed', tags:['Medicine','Faculty'], url:'https://jobs.sciencecareers.org/job/679845/assistant-professor-of-medicine/?LinkSource=PremiumListing' },
  { title:'Faculty Member in Chemistry', org:'College of the Atlantic · Bar Harbor, ME', role:'faculty', region:'us', source:'Inside Higher Ed', age:'Live feed', tags:['Chemistry','Faculty'], url:'https://careers.insidehighered.com/job/3535969/faculty-member-in-chemistry/' },
  { title:'Assistant Professor of Reading', org:'Fort Valley State University · Fort Valley, GA', role:'faculty', region:'us', source:'Inside Higher Ed', age:'Live feed', tags:['Education','Assistant professor'], url:'https://careers.insidehighered.com/job/3444916/assistant-professor-of-reading/' },
  { title:'Tenure-Track Faculty — Computational or Theoretical Neuroscience', org:'Yale University School of Medicine · New Haven, CT', role:'faculty', region:'us', source:'Nature Careers', age:'Live feed', tags:['Neuroscience','Tenure-track'], url:'https://www.nature.com/naturecareers/job/12862704/tenure-track-faculty-dept-of-neuroscience-computational-or-theoretical-neuroscience-/' },
  { title:'Postdoctoral Associate / Research Scientist in Systems Neuroscience', org:'University of Pittsburgh · Pittsburgh, PA', role:'postdoc', region:'us', source:'Nature Careers', age:'Live feed', tags:['Neuroscience','Postdoc'], url:'https://www.nature.com/naturecareers/job/12862383/postdoctoral-associate-research-scientist-in-systems-neuroscience-and-or-neuroengineering/' },
  { title:'Postdoctoral Fellowship in Neural Engineering', org:'National Institute on Drug Abuse (NIDA) · Baltimore, MD', role:'postdoc', region:'us', source:'Nature Careers', age:'Live feed', tags:['Neural engineering','Postdoc'], url:'https://www.nature.com/naturecareers/job/12861495/postdoctoral-fellowship-in-neural-engineering-section-behavioral-neuroscience-research-branch/' }
];
let state = { role:'all', region:'all', query:'', newest:true };
const $ = (s) => document.querySelector(s);
function renderJobs(){
  let visible = jobs.filter(j => {
    const haystack = `${j.title} ${j.org} ${j.source} ${j.tags.join(' ')}`.toLowerCase();
    return (state.role==='all'||j.role===state.role) && (state.region==='all'||j.region===state.region) && (!state.query||haystack.includes(state.query.toLowerCase()));
  });
  if (!state.newest) visible.reverse();
  $('#resultCount').textContent = String(visible.length).padStart(2,'0');
  $('#jobList').innerHTML = visible.map((j,i)=>`<article class="job-card" style="animation-delay:${i*40}ms"><span class="job-strip"></span><div><h4>${j.title}</h4><div class="job-meta">${j.org}</div><div class="job-tags">${j.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><a class="job-link" href="${j.url}" target="_blank" rel="noopener noreferrer">Open this job ↗</a></div><div class="job-source">${j.source}<span class="job-age">${j.age}</span></div></article>`).join('');
  $('#emptyState').hidden = visible.length > 0;
}
function loadNotes(){
  const starterNotes=[
    {text:'Search broad fields first: “neuroscience” will surface more than a specific subfield like neurogenetics.',date:'From your brief'},
    {text:'Euraxess is exhaustive for Europe, but filters can be troublesome and role levels are mixed.',date:'From your brief'},
    {text:'Follow institutional LinkedIn pages — hiring announcements often never reach the job boards.',date:'From your brief'}
  ];
  const notes=JSON.parse(localStorage.getItem('signal-notes')||JSON.stringify(starterNotes));
  if(!localStorage.getItem('signal-notes')) localStorage.setItem('signal-notes',JSON.stringify(notes));
  $('#noteCount').textContent=String(notes.length).padStart(2,'0');
  $('#notesList').innerHTML=notes.slice().reverse().map(n=>`<div class="note">${n.text}<time>${n.date}</time></div>`).join('');
}
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{ const key=b.dataset.role?'role':'region'; state[key]=b.dataset[key]; document.querySelectorAll(`.filter[data-${key}]`).forEach(x=>x.classList.toggle('active',x===b)); renderJobs(); }));
$('#searchInput').addEventListener('input',e=>{state.query=e.target.value.trim();renderJobs()});
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{$('#searchInput').value=b.dataset.query;state.query=b.dataset.query;renderJobs();$('#searchInput').focus()}));
$('#sortButton').addEventListener('click',()=>{state.newest=!state.newest;$('#sortButton').firstChild.textContent=state.newest?'Newest first ':'Oldest first ';renderJobs()});
$('#clearFilters').addEventListener('click',()=>{state={role:'all',region:'all',query:'',newest:true};$('#searchInput').value='';document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.role==='all'||x.dataset.region==='all'));renderJobs()});
$('#noteInput').addEventListener('input',e=>$('#charCount').textContent=`${e.target.value.length} / 180`);
$('#noteForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#noteInput');if(!input.value.trim())return;const notes=JSON.parse(localStorage.getItem('signal-notes')||'[]');notes.push({text:input.value.trim(),date:new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date())});localStorage.setItem('signal-notes',JSON.stringify(notes));input.value='';$('#charCount').textContent='0 / 180';loadNotes()});
$('#themeButton').addEventListener('click',()=>document.body.classList.toggle('dark'));
const profileDialog=$('#profileDialog');
const profile=JSON.parse(localStorage.getItem('signal-profile')||'{}');
$('#profileName').value=profile.name||'';$('#profileField').value=profile.field||'';$('#profileRegions').value=profile.regions||'';
$('.profile-label').textContent=profile.name||'Your desk';
$('#profileButton').addEventListener('click',()=>profileDialog.showModal());
$('#dialogClose').addEventListener('click',()=>profileDialog.close());
$('#profileForm').addEventListener('submit',e=>{e.preventDefault();const next={name:$('#profileName').value.trim(),field:$('#profileField').value.trim(),regions:$('#profileRegions').value.trim()};localStorage.setItem('signal-profile',JSON.stringify(next));$('.profile-label').textContent=next.name||'Your desk';profileDialog.close()});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}});
renderJobs();loadNotes();

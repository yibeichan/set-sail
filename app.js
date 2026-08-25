const jobs = [
  { title:'Assistant Professor of Neuroscience', org:'University of Michigan · Ann Arbor, MI', role:'faculty', region:'us', source:'Science Careers', age:'2h ago', tags:['Neuroscience','Tenure-track'], url:'https://jobs.sciencecareers.org/jobs/neuroscience/faculty/' },
  { title:'Postdoctoral Researcher — Neural Circuits', org:'Max Planck Institute · Tübingen, Germany', role:'postdoc', region:'europe', source:'Euraxess', age:'5h ago', tags:['Neuroscience','Postdoc'], url:'https://euraxess.ec.europa.eu/jobs' },
  { title:'Lecturer / Assistant Professor, Social Science', org:'University of Amsterdam · Amsterdam, NL', role:'faculty', region:'europe', source:'Academic Jobs Online', age:'Yesterday', tags:['Social science','Open rank'], url:'https://academicjobsonline.org/ajo' },
  { title:'Staff Scientist, Computational Biology', org:'Broad Institute · Cambridge, MA', role:'research', region:'us', source:'Nature Careers', age:'Yesterday', tags:['Computational biology','Staff'], url:'https://www.nature.com/naturecareers/landingpage/12822085/neuroscience/' },
  { title:'PhD Position in Systems Neuroscience', org:'KU Leuven · Leuven, Belgium', role:'phd', region:'europe', source:'Euraxess', age:'2d ago', tags:['Neuroscience','PhD'], url:'https://euraxess.ec.europa.eu/jobs' },
  { title:'Research Assistant Professor — Neurobiology', org:'University of Pittsburgh · Pittsburgh, PA', role:'research', region:'us', source:'SFN NeuroJobs', age:'3d ago', tags:['Neurobiology','Research'], url:'https://neurojobs.sfn.org/jobs/faculty-member/' },
  { title:'Dean / Professor of Humanities', org:'University of Colorado · Boulder, CO', role:'faculty', region:'us', source:'HigherEdJobs', age:'4d ago', tags:['Humanities','Leadership'], url:'https://www.higheredjobs.com/' },
  { title:'Postdoctoral Fellow, Molecular Genetics', org:'University of Toronto · Toronto, Canada', role:'postdoc', region:'global', source:'Science Careers', age:'5d ago', tags:['Genetics','Postdoc'], url:'https://jobs.sciencecareers.org/jobs/' }
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
  $('#jobList').innerHTML = visible.map((j,i)=>`<article class="job-card" style="animation-delay:${i*40}ms"><span class="job-strip"></span><div><h4>${j.title}</h4><div class="job-meta">${j.org}</div><div class="job-tags">${j.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><a class="job-link" href="${j.url}" target="_blank" rel="noopener noreferrer">Browse matching source ↗</a></div><div class="job-source">${j.source}<span class="job-age">${j.age}</span></div></article>`).join('');
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

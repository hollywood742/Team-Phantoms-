const $=s=>document.querySelector(s);
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get=n=>fetch(n+'.json').then(r=>r.json());
const TBC='<p class="tbc">Awaiting confirmation.</p>';
// External link button: only renders when a real URL exists in the data files.
const ext=(l,u,c='')=>u?`<a class="btn ${c}" href="${e(u)}" target="_blank" rel="noopener">${e(l)}</a>`:'';
const int=(l,u,c='')=>`<a class="btn ${c}" href="${u}">${e(l)}</a>`;
const sec=(t,b,id='')=>`<section id="${id}"><h2>${t}</h2>${b}</section>`;
const tbl=(h,r)=>r.length?`<div class="scroll"><table><tr>${h.map(x=>`<th>${e(x)}</th>`).join('')}</tr>${r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`:TBC;
const list=a=>a&&a.length?`<ul class="plain">${a.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:TBC;
const players=a=>tbl(['Gamertag','Rank'],(a||[]).map(p=>[e(p.gamertag),e(p.rank||'Awaiting confirmation')]));
const mrows=(ms,TT)=>ms.map(m=>[e(m.date),e(TT[m.team]?.name||m.team),e(m.opponent),e(m.tournament),e(m.result||'—'),e(m.score||'—')]);
const MH=['Date','Team','Opponent','Tournament','Result','Score'];
const rec=(M,s)=>{const f=M.filter(m=>m.team===s&&m.status==='final');if(!f.length)return 'No results yet';const w=f.filter(m=>m.result==='W').length;return `${w}-${f.length-w}`};
const logo=(t,c='logo')=>`<img class="${c}" src="${e(t.logo)}" alt="${e(t.name)} logo" data-m="${e(t.short)}">`;
document.addEventListener('error',ev=>{const i=ev.target;if(i.tagName==='IMG'&&i.dataset.m)i.outerHTML=`<span class="mono">${e(i.dataset.m)}</span>`},true);
const tcard=(t,M)=>`<article class="card" style="--c:${e(t.color)}">${logo(t)}<h3>${e(t.name)}</h3><p>Record: ${rec(M,t.slug)}</p>${int('View roster','team.html?t='+t.slug)}</article>`;
const main=$('main'),pg=document.body.dataset.page;
const pages={
async home(){
  const[S,T,M]=await Promise.all([get('site'),get('teams'),get('matches')]);const TT=Object.fromEntries(T.teams.map(t=>[t.slug,t]));
  const up=M.matches.filter(m=>m.status==='upcoming'),fin=M.matches.filter(m=>m.status==='final').slice(-5).reverse();
  main.innerHTML=`<div class="hero"><h1>COMPETE.<br><span>IMPROVE.</span><br>REPRESENT.</h1><p class="lead">${e(S.intro)}</p><div class="row">${ext('Join Discord',S.links.discord,'fill')}${int('Join us','join.html')}</div></div>`
  +sec('Our esports teams',`<div class="grid">${T.teams.map(t=>tcard(t,M.matches)).join('')}</div>`)
  +sec('Upcoming matches',tbl(MH,mrows(up,TT)))+sec('Recent results',tbl(MH,mrows(fin,TT)))
  +sec('Team Phantom Championship Series',`<p>${e(S.tpcs)}</p><div class="row" style="margin-top:12px">${int('Explore TPCS','tpcs.html')}</div>`)
  +sec('Community and coaching',`<p>${e(S.community)}</p><div class="row" style="margin-top:12px">${int('Visit the community','community.html')}</div>`)
  +sec('Recruitment',`<p>${e(S.recruit)}</p><div class="row" style="margin-top:12px">${int('See how to join','join.html')}</div>`)
  +(S.links.discord?sec('Join Discord',`<div class="row">${ext('Join our Discord',S.links.discord,'fill')}</div>`):'');
},
async esports(){
  const[T,M]=await Promise.all([get('teams'),get('matches')]);const TT=Object.fromEntries(T.teams.map(t=>[t.slug,t]));
  main.innerHTML=`<div class="hero"><h1>Esports</h1><p class="lead">Three official teams, equal status. Each represents Team Phantom independently in competitive Rocket League.</p></div>`
  +`<div class="grid">${T.teams.map(t=>tcard(t,M.matches)).join('')}</div>`
  +sec('External tournament results',tbl(MH,mrows(M.matches,TT)));
},
async team(){
  const[T,M]=await Promise.all([get('teams'),get('matches')]);const TT=Object.fromEntries(T.teams.map(t=>[t.slug,t]));
  const t=TT[new URLSearchParams(location.search).get('t')];
  if(!t){main.innerHTML=`<div class="hero"><h1>Team not found</h1><p class="lead">${int('Back to esports','esports.html')}</p></div>`;return}
  document.title=t.name+' | Team Phantom';main.style.setProperty('--c',t.color);
  main.innerHTML=`<div class="hero" style="--c:${e(t.color)}">${logo(t)}<h1 style="margin-top:14px">${e(t.name)}</h1><p class="meta">Captain: ${e(t.captain||'Awaiting confirmation')} · Record: ${rec(M.matches,t.slug)}</p></div>`
  +sec('Starting roster',players(t.starters))+sec('Substitutes',players(t.subs))
  +sec('Upcoming tournaments',list(t.tournaments))
  +sec('Match history',tbl(MH,mrows(M.matches.filter(m=>m.team===t.slug),TT)))+sec('Achievements',list(t.achievements));
},
async tpcs(){
  const D=await get('tpcs');
  main.innerHTML=`<div class="hero"><h1>Team Phantom Championship Series</h1><p class="lead">${e(D.about)}</p></div>`
  +sec('Leagues',`<div class="grid">${D.leagues.map(l=>`<article class="card"><h3>${e(l.name)}</h3><p>${e(l.description||'Details awaiting confirmation.')}</p></article>`).join('')}</div>`)
  +sec('How it works',list(D.howItWorks))+sec('Competitive divisions',list(D.divisions))
  +sec('Franchise registration',`<p>${e(D.registration.notes||'Details awaiting confirmation.')}</p><div class="row" style="margin-top:10px">${ext('Register a franchise',D.registration.url,'fill')}</div>`)
  +sec('Franchise teams and rosters',tbl(['Franchise','Captain','Players'],D.franchises.map(f=>[e(f.name),e(f.captain||'—'),e((f.players||[]).join(', '))])))
  +sec('Standings',tbl(['League','Team','W','L','Pts'],D.standings.map(s=>[e(s.league),e(s.team),e(s.w),e(s.l),e(s.pts)])))
  +sec('Weekly schedule',tbl(['Week','League','Match','Date'],D.schedule.map(s=>[e(s.week),e(s.league),e(s.home+' vs '+s.away),e(s.date)])))
  +sec('Match results',tbl(['Week','League','Match','Score'],D.results.map(s=>[e(s.week),e(s.league),e(s.home+' vs '+s.away),e(s.score)])))
  +sec('League currency',`<p>${e(D.currency.summary||'Rules and amounts awaiting confirmation.')}</p><h3 style="margin-top:12px">Earning</h3>${list(D.currency.earn)}<h3 style="margin-top:12px">Spending</h3>${list(D.currency.spend)}`)
  +sec('Free agency',`<p>${e(D.freeAgency.notes||'')}</p>${list((D.freeAgency.players||[]))}`)
  +sec('Playoffs',`<p>${e(D.playoffs.notes||'Awaiting confirmation.')}</p><div class="row">${ext('View bracket',D.playoffs.bracketUrl)}</div>`)
  +sec('Championship history',tbl(['Season','League','Champion'],D.history.map(h=>[e(h.season),e(h.league),e(h.champion)])))
  +sec('League rules',list(D.rules));
},
async community(){
  const C=await get('community');
  main.innerHTML=`<div class="hero"><h1>Team Phantom Community</h1><p class="lead">${e(C.about)}</p><p class="meta">${e(C.notice)}</p><div class="row">${ext('Join the Discord',C.discord,'fill')}</div></div>`
  +sec('Community roster',players(C.roster))+sec('Rocket League coaching',`<p>${e(C.coaching||'Details awaiting confirmation.')}</p>`)
  +sec('Player development',`<p>${e(C.development||'Details awaiting confirmation.')}</p>`)
  +sec('Finding teammates',`<p>${e(C.teammates||'Details awaiting confirmation.')}</p>`)+sec('Community tournaments and events',list(C.events));
},
async join(){
  const S=await get('site'),L=S.links;
  const c=(t,p,l,u)=>`<article class="card"><h3>${t}</h3><p>${p}</p>${ext(l,u,'fill')||'<p class="tbc">Link coming soon.</p>'}</article>`;
  main.innerHTML=`<div class="hero"><h1>Join Team Phantom</h1><p class="lead">Pick the path that fits you.</p></div><div class="grid">`
  +c('Esports tryouts','For competitive players who want to represent Team Phantom in external tournaments.','Apply for tryouts',L.tryouts)
  +c('TPCS registration','For players joining or taking part in our 2v2 franchise leagues.','Register for TPCS',L.tpcs)
  +c('Community membership','Join, improve, find teammates and play community events. Membership does not guarantee an esports roster spot.','Join the Discord',L.discord)+`</div>`;
},
async about(){
  const[A,T]=await Promise.all([get('leadership'),get('teams')]);
  const p=(r,n,d)=>`<article class="card"><h3>${e(n||'Awaiting confirmation')}</h3><p class="meta">${e(r)}</p><p>${e(d||'')}</p></article>`;
  main.innerHTML=`<div class="hero"><h1>About Team Phantom</h1><p class="lead">${e(A.about)}</p></div>`
  +sec('Organization',`<div class="grid">${p('Founder & Organization Manager',A.founder.name,A.founder.duties)}${p('Co-Owner',A.coOwner)}</div>`)
  +sec('Esports team captains',`<div class="grid">${T.teams.map(t=>p(t.name+' captain',t.captain)).join('')}</div>`)
  +sec('TPCS administration',`<p>${e(A.tpcsAdmin||'League administration is separate from esports team leadership. Details awaiting confirmation.')}</p>`);
}};
pages[pg]().catch(()=>{main.innerHTML='<p class="tbc" style="padding:40px 0">Content could not load. Open the site through its web address, not as a local file.</p>'});

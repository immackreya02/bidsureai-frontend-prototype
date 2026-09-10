// ============================================================
// BidSure AI — application shell, router & view rendering
// ============================================================

const view = document.getElementById('view-area');
let DECISIONS = {};
try{ DECISIONS = JSON.parse(localStorage.getItem('bidsure_decisions')||'{}'); }catch(e){ DECISIONS = {}; }
function saveDecisions(){ try{ localStorage.setItem('bidsure_decisions', JSON.stringify(DECISIONS)); }catch(e){} }

let EXTRA_AUDIT = [];
try{ EXTRA_AUDIT = JSON.parse(localStorage.getItem('bidsure_audit')||'[]'); }catch(e){ EXTRA_AUDIT = []; }
function pushAudit(entry){ EXTRA_AUDIT.unshift(entry); try{ localStorage.setItem('bidsure_audit', JSON.stringify(EXTRA_AUDIT)); }catch(e){} }
function allAudit(){ return [...EXTRA_AUDIT, ...AUDIT_TRAIL]; }

// ---------- helpers ----------
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(d){ return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function toast(msg){
  const t = document.getElementById('toast');
  t.innerHTML = `<span class="t-dot"></span>${esc(msg)}`;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}
function riskPillClass(r){ return r==='LOW' ? 'pill-low' : r==='MEDIUM' ? 'pill-medium' : 'pill-high'; }
function statusPillClass(s){
  if(s==='Verified') return 'pill-pass';
  if(s==='Under Review') return 'pill-review';
  if(s==='Awaiting Verification' || s==='Verification In Progress') return 'pill-open';
  return 'pill-neutral';
}

function decisionFor(tid,bid){ return DECISIONS[tid+'::'+bid]; }

// ---------- router ----------
function parseHash(){
  let h = location.hash.replace(/^#\//,'') || 'dashboard';
  return h.split('/').filter(Boolean);
}
const ROUTE_ROOTS = ['dashboard','tenders','bidders','verification','risk','reports','audit','settings'];

function router(){
  const parts = parseHash();
  const root = parts[0] || 'dashboard';

  document.querySelectorAll('.side-nav a').forEach(a=>{
    a.classList.toggle('active', a.dataset.route === root);
  });

  window.scrollTo(0,0);

  if(root==='dashboard') return renderDashboard();
  if(root==='tenders' && parts.length===1) return renderTendersList();
  if(root==='tenders' && parts[1]) return renderTenderDetail(decodeURIComponent(parts[1]));
  if(root==='bidder' && parts[1]){
    const tid = decodeURIComponent(parts[1]), bid = decodeURIComponent(parts[2]);
    const step = parts[3] || 'profile';
    if(step==='profile') return renderBidderProfile(tid,bid);
    if(step==='analysis') return renderAnalysis(tid,bid);
    if(step==='results') return renderResults(tid,bid);
    if(step==='risk') return renderBidderRisk(tid,bid);
    if(step==='recommendation') return renderRecommendation(tid,bid);
    if(step==='report') return renderReport(tid,bid);
  }
  if(root==='bidders') return renderBiddersList();
  if(root==='verification') return renderVerificationQueue();
  if(root==='risk') return renderRiskOverview();
  if(root==='reports') return renderReportsList();
  if(root==='audit') return renderAudit();
  if(root==='settings') return renderSettings();
  renderDashboard();
}

function go(hash){ location.hash = hash; }

// ---------- shared partials ----------
function breadcrumbs(items){
  return `<div class="breadcrumbs">${items.map((it,i)=>{
    const last = i===items.length-1;
    return (last ? `<span>${esc(it.label)}</span>` : `<a href="${it.href}">${esc(it.label)}</a>`) + (last?'':' <span>/</span>');
  }).join('')}</div>`;
}

function featureStrip(){
  const items = [
    {icon:'check', t:'One-Click Verification', s:'Run every check for a bidder in a single pass'},
    {icon:'sparkle', t:'Tender-Aware AI', s:'Requirements read straight from the tender document'},
    {icon:'link', t:'Multi-Portal Verification', s:'GSTN, Udyam, EPFO & Income Tax cross-checks'},
    {icon:'alert', t:'Risk Score', s:'Weighted score from mismatches, gaps & expiries'},
    {icon:'eye', t:'Explainable AI', s:'Every result traced to evidence &amp; source'},
    {icon:'clock', t:'Audit Trail', s:'Full history of AI actions &amp; officer decisions'},
  ];
  return `<div class="feature-strip">${items.map(f=>`
    <div class="feature-chip">
      <div class="fc-icon"><i data-icon="${f.icon}" data-size="15"></i></div>
      <div class="fc-title">${f.t}</div>
      <div class="fc-sub">${f.s}</div>
    </div>`).join('')}</div>`;
}

function pageHead({eyebrow,title,sub,actions}){
  return `<div class="page-head">
    <div>
      ${eyebrow?`<div class="page-eyebrow">${esc(eyebrow)}</div>`:''}
      <div class="page-title">${title}</div>
      ${sub?`<div class="page-sub">${sub}</div>`:''}
    </div>
    <div class="page-actions">${actions||''}</div>
  </div>`;
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard(){
  const activeTenders = TENDERS.filter(t=>t.status!=='Verified').length;
  const underVerification = BIDDERS.filter(b=>b.status==='Under Review').length;
  const compliant = BIDDERS.filter(b=>b.score>=80).length;
  const highRisk = BIDDERS.filter(b=>b.risk==='HIGH').length;
  const avgScore = Math.round(BIDDERS.reduce((a,b)=>a+b.score,0)/BIDDERS.length);

  view.innerHTML = `
    ${pageHead({eyebrow:'Overview', title:'Compliance dashboard',
      sub:'Live snapshot of tenders, bids under AI verification and portfolio-wide risk.',
      actions:`<button class="btn btn-outline" onclick="go('tenders')">View tenders</button>
               <button class="btn btn-accent" onclick="go('verification')"><i data-icon="check" data-size="15"></i>Verification queue</button>`})}

    ${featureStrip()}

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active Tenders <span class="kpi-icon navy"><i data-icon="doc" data-size="15"></i></span></div>
        <div class="kpi-value">${activeTenders}</div>
        <div class="kpi-delta up">+1 opened this week</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Bids Under Verification <span class="kpi-icon review"><i data-icon="clock" data-size="15"></i></span></div>
        <div class="kpi-value">${underVerification}</div>
        <div class="kpi-delta down">2 pending clarification</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Compliant Bids <span class="kpi-icon pass"><i data-icon="check" data-size="15"></i></span></div>
        <div class="kpi-value">${compliant}</div>
        <div class="kpi-delta up">Score ≥ 80</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">High Risk Bids <span class="kpi-icon fail"><i data-icon="alert" data-size="15"></i></span></div>
        <div class="kpi-value">${highRisk}</div>
        <div class="kpi-delta down">Needs officer attention</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg. Compliance Score <span class="kpi-icon navy"><i data-icon="trend-up" data-size="15"></i></span></div>
        <div class="kpi-value">${avgScore}<span style="font-size:15px;color:var(--text-400)">/100</span></div>
        <div class="kpi-delta up">+3 pts vs last month</div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-head"><h3>Compliance score trend</h3><span class="muted">Last 8 weeks · portfolio average</span></div>
        <div class="chart-wrap"><canvas id="chartTrend"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Risk distribution</h3><span class="muted">${BIDDERS.length} bids</span></div>
        <div class="chart-wrap"><canvas id="chartRisk"></canvas></div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-head"><h3>Requirement pass rate</h3><span class="muted">Across all active tenders</span></div>
        <div class="chart-wrap"><canvas id="chartReq"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Alerts</h3><span class="muted">Needs your attention</span></div>
        <div class="alert-list">${dashboardAlerts()}</div>
      </div>
    </div>
  `;
  renderIcons();
  drawTrendChart();
  drawRiskChart();
  drawReqChart();
}

function dashboardAlerts(){
  const rows = [];
  BIDDERS.forEach(b=>{
    b.results.forEach(r=>{
      if(r.result==='FLAGGED') rows.push({type:'fail', title:`${r.label} flagged — ${b.company}`, meta:`${findTender(b.tenderId).id} · ${r.source}`});
      else if(r.result==='MISSING') rows.push({type:'review', title:`${r.label} missing — ${b.company}`, meta:`${findTender(b.tenderId).id}`});
    });
  });
  rows.push({type:'info', title:'GeM portal sync completed', meta:'All 4 active tenders refreshed · 6 min ago'});
  return rows.slice(0,6).map(r=>`
    <div class="alert-row">
      <span class="alert-dot ${r.type}"></span>
      <div>
        <div class="alert-title">${esc(r.title)}</div>
        <div class="alert-meta">${esc(r.meta)}</div>
      </div>
    </div>`).join('');
}

function drawTrendChart(){
  const ctx = document.getElementById('chartTrend');
  if(!ctx) return;
  new Chart(ctx, {
    type:'line',
    data:{ labels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8'],
      datasets:[{ data:[71,73,72,75,78,76,79,81], borderColor:'#3D4FE0', backgroundColor:'rgba(61,79,224,.08)',
        borderWidth:2.5, tension:.35, fill:true, pointRadius:0, pointHoverRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ y:{ min:50,max:100, grid:{color:'#EEF0F6'}, ticks:{color:'#8891A5',font:{size:11}} },
                x:{ grid:{display:false}, ticks:{color:'#8891A5',font:{size:11}} } } }
  });
}
function drawRiskChart(){
  const ctx = document.getElementById('chartRisk');
  if(!ctx) return;
  const low = BIDDERS.filter(b=>b.risk==='LOW').length;
  const med = BIDDERS.filter(b=>b.risk==='MEDIUM').length;
  const high = BIDDERS.filter(b=>b.risk==='HIGH').length;
  new Chart(ctx, {
    type:'doughnut',
    data:{ labels:['Low','Medium','High'], datasets:[{ data:[low,med,high],
      backgroundColor:['#188A5A','#C97A17','#C9372C'], borderWidth:0, spacing:2 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:8, boxHeight:8, usePointStyle:true, pointStyle:'circle', color:'#4B5468', font:{size:12} } } } }
  });
}
function drawReqChart(){
  const ctx = document.getElementById('chartReq');
  if(!ctx) return;
  const stats = {};
  REQ_DEFS.forEach(d=>stats[d.key]={label:d.label,pass:0,total:0});
  BIDDERS.forEach(b=>b.results.forEach(r=>{
    if(!stats[r.key]) return;
    stats[r.key].total++;
    if(r.result==='PASS'||r.result==='CLEAR') stats[r.key].pass++;
  }));
  const rows = Object.values(stats).filter(s=>s.total>0);
  new Chart(ctx, {
    type:'bar',
    data:{ labels: rows.map(r=>r.label), datasets:[{ data: rows.map(r=>Math.round(100*r.pass/r.total)),
      backgroundColor:'#4C5FEF', borderRadius:5, maxBarThickness:16 }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{ min:0,max:100, grid:{color:'#EEF0F6'}, ticks:{color:'#8891A5',font:{size:10.5}} },
                y:{ grid:{display:false}, ticks:{color:'#4B5468',font:{size:11.5}} } } }
  });
}

// ============================================================
// TENDERS LIST
// ============================================================
function renderTendersList(){
  view.innerHTML = `
    ${pageHead({eyebrow:'Procurement', title:'Tenders', sub:'GeM tenders synced for AI-assisted compliance verification.'})}
    <div class="card">
      <div class="card-pad" style="padding-bottom:0">
        <div class="table-toolbar">
          <div class="search-box"><i data-icon="search" data-size="15"></i><input id="tSearch" placeholder="Search by tender ID, title or organisation…"></div>
          <div class="filter-group">
            <select class="filter-select" id="tStatus">
              <option value="">All statuses</option>
              <option>Awaiting Verification</option>
              <option>Verification In Progress</option>
              <option>Verified</option>
            </select>
            <select class="filter-select" id="tCategory">
              <option value="">All categories</option>
              ${[...new Set(TENDERS.map(t=>t.category))].map(c=>`<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tender ID</th><th>Title</th><th>Organisation</th><th>Category</th><th>Closing Date</th><th>Bidders</th><th>Status</th><th></th></tr></thead>
          <tbody id="tRows"></tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
  const draw = ()=>{
    const q = document.getElementById('tSearch').value.toLowerCase();
    const st = document.getElementById('tStatus').value;
    const cat = document.getElementById('tCategory').value;
    const rows = TENDERS.filter(t=>
      (!q || (t.id+t.title+t.org).toLowerCase().includes(q)) &&
      (!st || t.status===st) && (!cat || t.category===cat));
    document.getElementById('tRows').innerHTML = rows.length ? rows.map(t=>`
      <tr>
        <td class="mono">${t.id}</td>
        <td style="max-width:260px"><div style="font-weight:600">${esc(t.title)}</div></td>
        <td>${esc(t.org)}</td>
        <td><span class="pill pill-neutral">${t.category}</span></td>
        <td>${fmtDate(t.closingDate)}</td>
        <td>${biddersForTender(t.id).length}</td>
        <td><span class="pill ${statusPillClass(t.status)}">${t.status}</span></td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-outline btn-sm" onclick="go('tenders/${encodeURIComponent(t.id)}')">View</button>
          <button class="btn btn-primary btn-sm" onclick="go('tenders/${encodeURIComponent(t.id)}')">Verify</button>
        </td>
      </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No tenders match your filters</div><div class="es-sub">Try clearing the search or filters above.</div></div></td></tr>`;
  };
  ['tSearch','tStatus','tCategory'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
  draw();
}

// ============================================================
// TENDER DETAIL
// ============================================================
function renderTenderDetail(tid){
  const t = findTender(tid);
  if(!t){ view.innerHTML = notFound('Tender'); return; }
  const bidders = biddersForTender(tid);

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id}])}
    ${pageHead({eyebrow:t.category, title:t.title, sub:`${t.org} &middot; Closing ${fmtDate(t.closingDate)}`,
      actions:`<span class="pill ${statusPillClass(t.status)}" style="align-self:center">${t.status}</span>`})}

    <div class="detail-grid">
      <div class="stack">
        <div class="card card-pad">
          <div style="font-size:13.5px;color:var(--text-600);line-height:1.6">${esc(t.description)}</div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>AI-extracted compliance requirements <span class="conf-tag" style="margin-left:6px">Tender-Aware AI</span></h3>
            <span class="muted">${t.requirements.length} requirements identified</span>
          </div>
          <div class="card-pad">
            <div class="req-grid">
              ${t.requirements.map(k=>{
                const d = REQ_DEFS.find(r=>r.key===k);
                return `<div class="req-item">
                  <div class="ri-top"><span class="ri-label">${d.label}</span><i data-icon="${d.icon}" data-size="15" style="color:var(--text-400)"></i></div>
                  <span class="ri-sub">Source: ${d.source}</span>
                  <span class="conf-tag" style="align-self:flex-start;margin-top:3px">Mandatory</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Bidders (${bidders.length})</h3><span class="muted">Sorted by compliance score</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Company</th><th>Bidder ID</th><th>Score</th><th>Risk</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${[...bidders].sort((a,b)=>b.score-a.score).map(b=>`
                  <tr>
                    <td style="font-weight:600">${esc(b.company)}</td>
                    <td class="mono">${b.id}</td>
                    <td class="mono">${b.score}/100</td>
                    <td><span class="pill ${riskPillClass(b.risk)}">${b.risk}</span></td>
                    <td><span class="pill ${statusPillClass(b.status)}">${b.status}</span></td>
                    <td style="text-align:right;white-space:nowrap">
                      <button class="btn btn-outline btn-sm" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(b.id)}')">View</button>
                      <button class="btn btn-accent btn-sm" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(b.id)}')"><i data-icon="check" data-size="13"></i>Verify</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head"><h3>Tender parameters</h3></div>
          <div class="info-list">
            <div class="info-row"><span class="k">Tender ID</span><span class="v mono">${t.id}</span></div>
            <div class="info-row"><span class="k">Category</span><span class="v">${t.category}</span></div>
            <div class="info-row"><span class="k">Closing date</span><span class="v">${fmtDate(t.closingDate)}</span></div>
            <div class="info-row"><span class="k">Min. turnover</span><span class="v">${t.minTurnover}</span></div>
            <div class="info-row"><span class="k">Min. experience</span><span class="v" style="text-align:right;max-width:180px">${t.minExperience}</span></div>
            <div class="info-row"><span class="k">Bidders</span><span class="v">${bidders.length}</span></div>
          </div>
        </div>
        <div class="card card-pad" style="background:var(--indigo-50);border-color:#D6DBFB">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <i data-icon="sparkle" data-size="18" style="color:var(--indigo-600);flex-shrink:0;margin-top:2px"></i>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--navy-950)">Multi-Portal Verification</div>
              <div style="font-size:12.3px;color:var(--text-600);margin-top:4px;line-height:1.5">Requirements are cross-checked live against GSTN, Udyam, EPFO and Income Tax e-Filing sources before scoring.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  renderIcons();
}

function notFound(label){
  return `<div class="empty-state"><div class="es-title">${label} not found</div><div class="es-sub">It may have been removed. <a href="#/dashboard" style="color:var(--indigo-600);font-weight:700">Return to dashboard</a></div></div>`;
}

// ============================================================
// BIDDER PROFILE + DOCUMENTS
// ============================================================
function renderBidderProfile(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }

  const docKeys = ['gst','pan','udyam','itr','oem','experience','turnover'].filter(k=>t.requirements.includes(k));
  const uploaded = k => {
    const r = b.results.find(x=>x.key===k);
    return r && r.result!=='MISSING';
  };

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company}])}
    ${pageHead({eyebrow:'Bidder profile', title:b.company, sub:`Submitted ${fmtDate(b.submittedOn)} for ${t.id}`,
      actions:`<button class="btn btn-outline" onclick="go('tenders/${encodeURIComponent(tid)}')">Back to tender</button>
               <button class="btn btn-accent" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/analysis')"><i data-icon="sparkle" data-size="15"></i>Run One-Click Verification</button>`})}

    <div class="detail-grid">
      <div class="stack">
        <div class="card">
          <div class="card-head"><h3>Submitted documents</h3><span class="muted">${docKeys.filter(uploaded).length}/${docKeys.length} uploaded</span></div>
          <div class="card-pad">
            <div class="doc-grid">
              ${docKeys.map(k=>{
                const d = REQ_DEFS.find(r=>r.key===k);
                const up = uploaded(k);
                return `<div class="doc-item ${up?'uploaded':''}">
                  <div class="doc-icon"><i data-icon="${up?'check':d.icon}" data-size="16"></i></div>
                  <div>
                    <div class="doc-name">${d.label}</div>
                    <div class="doc-status">${up?'Uploaded &middot; ready for AI review':'Not uploaded'}</div>
                  </div>
                  ${up ? `<button class="btn btn-ghost btn-sm doc-upload-btn"><i data-icon="eye" data-size="13"></i>View</button>`
                       : `<button class="btn btn-outline btn-sm doc-upload-btn" onclick="simulateUpload('${k}', this)"><i data-icon="upload" data-size="13"></i>Upload</button>`}
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card card-pad">
          <div style="display:flex;gap:12px;align-items:center">
            <i data-icon="scan" data-size="20" style="color:var(--indigo-600)"></i>
            <div style="flex:1">
              <div style="font-size:13.5px;font-weight:700">Ready for AI analysis</div>
              <div style="font-size:12.3px;color:var(--text-400);margin-top:2px">OCR &rarr; Data Extraction &rarr; Requirement Mapping &rarr; Cross Verification</div>
            </div>
            <button class="btn btn-primary" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/analysis')">Start analysis</button>
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head"><h3>Bidder details</h3></div>
          <div class="info-list">
            <div class="info-row"><span class="k">Company</span><span class="v">${esc(b.company)}</span></div>
            <div class="info-row"><span class="k">Bidder ID</span><span class="v mono">${b.id}</span></div>
            <div class="info-row"><span class="k">GSTIN</span><span class="v mono">${b.gstin}</span></div>
            <div class="info-row"><span class="k">PAN</span><span class="v mono">${b.pan}</span></div>
            <div class="info-row"><span class="k">Udyam</span><span class="v mono">${b.udyam}</span></div>
            <div class="info-row"><span class="k">CIN</span><span class="v mono">${b.cin}</span></div>
          </div>
        </div>
        <div class="card card-pad">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">Latest status</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span class="pill ${statusPillClass(b.status)}">${b.status}</span>
            <span class="pill ${riskPillClass(b.risk)}">${b.risk} RISK</span>
          </div>
          <div style="font-size:12.3px;color:var(--text-400)">Last compliance score: <b class="mono" style="color:var(--text-900)">${b.score}/100</b></div>
        </div>
      </div>
    </div>
  `;
  renderIcons();
}

function simulateUpload(key, btn){
  btn.disabled = true;
  btn.innerHTML = 'Uploading…';
  setTimeout(()=>{
    const item = btn.closest('.doc-item');
    item.classList.add('uploaded');
    item.querySelector('.doc-status').textContent = 'Uploaded · ready for AI review';
    item.querySelector('.doc-icon').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS.check+'</svg>';
    btn.remove();
    toast('Document uploaded successfully');
  }, 900);
}

// ============================================================
// AI ANALYSIS (animated)
// ============================================================
const AI_STEPS = [
  { title:'OCR', desc:'Extracting text and structured fields from uploaded documents', meta:'Reading 7 documents · scanned + digital' },
  { title:'Data Extraction', desc:'Identifying GSTIN, PAN, Udyam number, dates and certificate values', meta:'Parsing key-value fields' },
  { title:'Requirement Mapping', desc:'Mapping extracted data against the tender\u2019s mandatory requirements', meta:'10 requirements mapped' },
  { title:'Cross Verification', desc:'Validating against GSTN, Udyam, EPFO and Income Tax portals', meta:'4 external sources queried' },
];

function renderAnalysis(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company,href:`#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}`},{label:'AI Analysis'}])}
    ${pageHead({eyebrow:'One-Click Verification', title:'Running AI compliance analysis', sub:`${b.company} &middot; ${t.id}`})}

    <div class="card">
      <div class="card-pad">
        <div class="steps-wrap" id="stepsWrap">
          ${AI_STEPS.map((s,i)=>`
            <div class="ai-step" data-step="${i}">
              <div class="step-dot"><i data-icon="${i===0?'scan':i===1?'file':i===2?'map':'shield'}" data-size="17"></i></div>
              <div class="step-body">
                <div class="step-title">${s.title}</div>
                <div class="step-desc">${s.desc}</div>
                <div class="step-progress"><i></i></div>
                <div class="step-meta">${s.meta}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `;
  renderIcons();
  runAnalysisAnimation(tid,bid);
}

function runAnalysisAnimation(tid,bid){
  const steps = document.querySelectorAll('#stepsWrap .ai-step');
  let i = 0;
  function next(){
    if(i>0){
      steps[i-1].classList.remove('active');
      steps[i-1].classList.add('done');
      steps[i-1].querySelector('.step-dot').innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS.check+'</svg>';
    }
    if(i>=steps.length){
      toast('AI analysis complete');
      setTimeout(()=>go(`bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/results`), 500);
      return;
    }
    const step = steps[i];
    step.classList.add('active');
    const bar = step.querySelector('.step-progress i');
    requestAnimationFrame(()=>{ bar.style.width='100%'; });
    i++;
    setTimeout(next, 1000);
  }
  next();
}

// ============================================================
// RESULTS
// ============================================================
function renderResults(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }
  const color = b.risk==='LOW' ? 'var(--pass)' : b.risk==='MEDIUM' ? 'var(--review)' : 'var(--fail)';
  const circumference = 2*Math.PI*53;
  const offset = circumference - (b.score/100)*circumference;

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company,href:`#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}`},{label:'Results'}])}
    ${pageHead({eyebrow:'Verification results', title:b.company, sub:`${t.id} &middot; Analysis completed ${fmtDate(b.submittedOn)}`,
      actions:`<button class="btn btn-outline" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/risk')">View risk breakdown</button>
               <button class="btn btn-accent" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/recommendation')"><i data-icon="arrow-right" data-size="15"></i>AI recommendation</button>`})}

    <div class="card mb-16">
      <div class="score-panel">
        <div class="score-ring">
          <svg width="126" height="126" viewBox="0 0 126 126">
            <circle class="track" cx="63" cy="63" r="53"/>
            <circle class="bar" cx="63" cy="63" r="53" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" id="scoreArc"/>
          </svg>
          <div class="center"><span class="num">${b.score}</span><span class="of">out of 100</span></div>
        </div>
        <div style="flex:1">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
            <span class="pill ${riskPillClass(b.risk)}">${b.risk} RISK</span>
            <span class="pill ${statusPillClass(b.status)}">${b.status}</span>
          </div>
          <div style="font-size:13.5px;color:var(--text-600);line-height:1.6;max-width:560px">
            ${b.results.filter(r=>r.result==='PASS'||r.result==='CLEAR').length} of ${b.results.length} requirement checks passed.
            ${b.results.some(r=>r.result==='MISSING')?' One or more mandatory documents are missing.':''}
            ${b.results.some(r=>r.result==='REVIEW')?' Some checks require officer review.':''}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Requirement-by-requirement results <span class="conf-tag" style="margin-left:6px">Explainable AI</span></h3><span class="muted">Every result is traced to source evidence</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Requirement</th><th>Result</th><th>Confidence</th><th>Evidence</th><th>Source</th><th>Reason</th></tr></thead>
          <tbody>
            ${b.results.map(r=>`
              <tr>
                <td style="font-weight:600;white-space:nowrap">${r.label}</td>
                <td><span class="pill ${pillClassForResult(r.result)}">${r.result}</span></td>
                <td class="mono">${r.confidence?r.confidence+'%':'—'}</td>
                <td>${r.evidence!=='—' ? `<span class="evidence-link"><i data-icon="file" data-size="13"></i>${esc(r.evidence)}</span>` : '<span style="color:var(--text-400)">—</span>'}</td>
                <td style="color:var(--text-400);font-size:12.3px;white-space:nowrap">${esc(r.source)}</td>
                <td class="result-reason">${esc(r.reason)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
  requestAnimationFrame(()=>{
    const arc = document.getElementById('scoreArc');
    if(arc) arc.style.strokeDashoffset = offset;
  });
}

// ============================================================
// RISK (per bidder)
// ============================================================
function renderBidderRisk(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }
  const factors = riskFactorsFor(b);

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company,href:`#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}`},{label:'Risk'}])}
    ${pageHead({eyebrow:'Risk assessment', title:'Risk breakdown', sub:`${b.company} &middot; ${t.id}`,
      actions:`<button class="btn btn-outline" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/results')">Back to results</button>
               <button class="btn btn-accent" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/recommendation')"><i data-icon="arrow-right" data-size="15"></i>AI recommendation</button>`})}

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card">
        <div class="kpi-label">Risk Score <span class="kpi-icon ${b.risk==='HIGH'?'fail':b.risk==='MEDIUM'?'review':'pass'}"><i data-icon="alert" data-size="15"></i></span></div>
        <div class="kpi-value">${b.score}/100</div>
        <div class="kpi-delta ${b.risk==='LOW'?'up':'down'}">${b.risk} risk band</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Missing Documents <span class="kpi-icon fail"><i data-icon="file" data-size="15"></i></span></div>
        <div class="kpi-value">${b.results.filter(r=>r.result==='MISSING').length}</div>
        <div class="kpi-delta down">Blocks technical evaluation</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mismatches / Reviews <span class="kpi-icon review"><i data-icon="alert" data-size="15"></i></span></div>
        <div class="kpi-value">${b.results.filter(r=>r.result==='REVIEW').length}</div>
        <div class="kpi-delta down">Needs officer judgement</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Failed / Flagged <span class="kpi-icon fail"><i data-icon="ban" data-size="15"></i></span></div>
        <div class="kpi-value">${b.results.filter(r=>r.result==='FAIL'||r.result==='FLAGGED').length}</div>
        <div class="kpi-delta down">Highest weight on score</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Risk factors</h3><span class="muted">Contributing to the ${b.score}/100 score</span></div>
      ${factors.length ? factors.map(f=>`
        <div class="risk-factor-row">
          <div class="risk-factor-left">
            <div class="rf-icon" style="background:${f.type==='fail'?'var(--fail-bg)':f.type==='missing'?'var(--fail-bg)':'var(--review-bg)'};color:${f.type==='review'?'var(--review)':'var(--fail)'}">
              <i data-icon="${f.type==='missing'?'file':f.type==='fail'?'ban':'alert'}" data-size="15"></i>
            </div>
            <div><div class="rf-title">${esc(f.title)}</div><div class="rf-sub">${esc(f.sub)}</div></div>
          </div>
          <div class="risk-weight">${f.weight}</div>
        </div>`).join('') : `<div class="empty-state"><div class="es-title">No risk factors identified</div><div class="es-sub">All requirement checks passed with high confidence.</div></div>`}
    </div>
  `;
  renderIcons();
}

// ============================================================
// RECOMMENDATION
// ============================================================
function renderRecommendation(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }
  const reco = recommendationFor(b);
  const decision = decisionFor(tid,bid);

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company,href:`#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}`},{label:'Recommendation'}])}
    ${pageHead({eyebrow:'AI recommendation', title:'Officer review', sub:`${b.company} &middot; ${t.id}. The AI recommends a course of action — the final decision is always yours.`})}

    <div class="reco-banner mb-16">
      <div class="reco-icon"><i data-icon="sparkle" data-size="19"></i></div>
      <div style="flex:1">
        <div class="reco-title">${reco.verdict}</div>
        <div class="reco-text">${reco.reason}</div>
        ${!decision ? `
          <div class="reco-actions">
            <button class="btn btn-primary btn-sm" onclick="makeDecision('${tid}','${bid}','Technical Evaluation')"><i data-icon="check" data-size="14"></i>Approve for Technical Evaluation</button>
            <button class="btn btn-outline btn-sm" onclick="makeDecision('${tid}','${bid}','Clarification')"><i data-icon="doc" data-size="14"></i>Request Clarification</button>
            <button class="btn btn-outline btn-sm" onclick="makeDecision('${tid}','${bid}','Manual Review')"><i data-icon="eye" data-size="14"></i>Route to Manual Review</button>
          </div>` : ''}
      </div>
    </div>

    ${decision ? `
      <div class="card officer-decision">
        <div class="decision-made">
          <i data-icon="ok-circle" data-size="20" style="color:var(--pass)"></i>
          <div>Decision recorded: <b>${esc(decision.action)}</b> by ${esc(decision.officer)} on ${fmtDate(decision.date)}.
            <div style="font-size:12.3px;color:var(--text-600);margin-top:3px;font-weight:400">This entry has been written to the audit trail. The Procurement Officer's decision is final.</div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button class="btn btn-primary" onclick="go('bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/report')"><i data-icon="report" data-size="15"></i>Generate report</button>
          <button class="btn btn-outline" onclick="go('audit')">View audit trail</button>
        </div>
      </div>` : `
      <div class="card card-pad" style="display:flex;gap:12px;align-items:center;color:var(--text-400);font-size:12.5px">
        <i data-icon="info" data-size="16"></i> Selecting an option above records the Procurement Officer's decision in the audit trail. This action cannot be auto-approved by AI.
      </div>`}
  `;
  renderIcons();
}

function makeDecision(tid,bid,action){
  const key = tid+'::'+bid;
  const officer = 'Priya Sharma';
  DECISIONS[key] = { action, officer, date: new Date().toISOString() };
  saveDecisions();
  const b = findBidder(bid);
  pushAudit({
    date: new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}),
    bidder: b.company, requirement:'Overall Compliance', action:`Routed to ${action}`,
    source:'Verification Console', result: action==='Technical Evaluation' ? 'PASS' : 'PENDING', officer
  });
  toast(`Decision recorded: ${action}`);
  renderRecommendation(tid,bid);
}

// ============================================================
// REPORT
// ============================================================
function renderReport(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  if(!t||!b){ view.innerHTML = notFound('Bidder'); return; }
  const reco = recommendationFor(b);
  const decision = decisionFor(tid,bid);

  view.innerHTML = `
    ${breadcrumbs([{label:'Tenders',href:'#/tenders'},{label:t.id,href:`#/tenders/${encodeURIComponent(tid)}`},{label:b.company,href:`#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}`},{label:'Report'}])}
    ${pageHead({eyebrow:'Compliance report', title:'Bid Compliance Report', sub:'Consolidated evidence, score, risk and recommendation for procurement records.',
      actions:`<button class="btn btn-accent" onclick="downloadReport('${tid}','${bid}')"><i data-icon="download" data-size="15"></i>Download Report</button>`})}

    <div class="card report-doc" id="reportDoc">
      <div class="report-header">
        <div>
          <div style="font-size:11.5px;font-weight:700;color:var(--indigo-600);letter-spacing:.04em;text-transform:uppercase">BidSure AI &middot; GeM Compliance Report</div>
          <div style="font-size:18px;font-weight:800;margin-top:4px">${esc(b.company)}</div>
          <div style="font-size:12.5px;color:var(--text-400);margin-top:2px">${t.id} &middot; ${esc(t.title)}</div>
        </div>
        <div style="text-align:right">
          <div class="score-ring" style="width:72px;height:72px">
            <svg width="72" height="72" viewBox="0 0 126 126">
              <circle class="track" cx="63" cy="63" r="53"/>
              <circle class="bar" cx="63" cy="63" r="53" stroke="${b.risk==='LOW'?'var(--pass)':b.risk==='MEDIUM'?'var(--review)':'var(--fail)'}" stroke-dasharray="${2*Math.PI*53}" stroke-dashoffset="${2*Math.PI*53*(1-b.score/100)}"/>
            </svg>
            <div class="center"><span class="num" style="font-size:16px">${b.score}</span></div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h4>Tender &amp; bidder details</h4>
        <div class="report-kv">
          <div><span class="k">Organisation</span><span class="v">${esc(t.org)}</span></div>
          <div><span class="k">Category</span><span class="v">${t.category}</span></div>
          <div><span class="k">Closing date</span><span class="v">${fmtDate(t.closingDate)}</span></div>
          <div><span class="k">Bidder ID</span><span class="v mono" style="font-size:12.5px">${b.id}</span></div>
          <div><span class="k">GSTIN</span><span class="v mono" style="font-size:12.5px">${b.gstin}</span></div>
          <div><span class="k">PAN</span><span class="v mono" style="font-size:12.5px">${b.pan}</span></div>
        </div>
      </div>

      <div class="report-section">
        <h4>Score &amp; risk</h4>
        <div style="display:flex;gap:10px">
          <span class="pill ${riskPillClass(b.risk)}">${b.risk} RISK</span>
          <span class="pill pill-neutral">Compliance score: ${b.score}/100</span>
          <span class="pill ${statusPillClass(b.status)}">${b.status}</span>
        </div>
      </div>

      <div class="report-section">
        <h4>Requirement results</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Requirement</th><th>Result</th><th>Evidence</th><th>Reason</th></tr></thead>
            <tbody>
              ${b.results.map(r=>`<tr>
                <td style="font-weight:600">${r.label}</td>
                <td><span class="pill ${pillClassForResult(r.result)}">${r.result}</span></td>
                <td style="font-size:12.3px;color:var(--text-400)">${esc(r.evidence)}</td>
                <td class="result-reason">${esc(r.reason)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <h4>AI recommendation</h4>
        <div style="font-size:13.5px;font-weight:700;margin-bottom:6px">${reco.verdict}</div>
        <div style="font-size:13px;color:var(--text-600);line-height:1.6">${reco.reason}</div>
      </div>

      <div class="report-section">
        <h4>Procurement Officer decision</h4>
        ${decision ? `<div style="font-size:13.5px"><b>${esc(decision.action)}</b> &middot; recorded by ${esc(decision.officer)} on ${fmtDate(decision.date)}</div>
          <div style="font-size:12px;color:var(--text-400);margin-top:6px">The final compliance decision rests with the Procurement Officer, per GeM procurement policy.</div>`
          : `<div style="font-size:13px;color:var(--text-400)">No decision recorded yet. <a href="#/bidder/${encodeURIComponent(tid)}/${encodeURIComponent(bid)}/recommendation" style="color:var(--indigo-600);font-weight:600">Go to recommendation</a></div>`}
      </div>
    </div>
  `;
  renderIcons();
}

function downloadReport(tid,bid){
  const t = findTender(tid), b = findBidder(bid);
  const reco = recommendationFor(b);
  const decision = decisionFor(tid,bid);
  const lines = [
    'BIDSURE AI — GeM BID COMPLIANCE REPORT',
    '======================================',
    `Tender: ${t.id} — ${t.title}`,
    `Organisation: ${t.org}`,
    `Bidder: ${b.company} (${b.id})`,
    `GSTIN: ${b.gstin}   PAN: ${b.pan}   Udyam: ${b.udyam}`,
    '',
    `COMPLIANCE SCORE: ${b.score}/100   RISK: ${b.risk}   STATUS: ${b.status}`,
    '',
    'REQUIREMENT RESULTS',
    '--------------------',
    ...b.results.map(r=>`${r.label.padEnd(28)} ${r.result.padEnd(9)} conf:${r.confidence}%  | ${r.reason}`),
    '',
    'AI RECOMMENDATION',
    '------------------',
    reco.verdict,
    reco.reason,
    '',
    'PROCUREMENT OFFICER DECISION',
    '-----------------------------',
    decision ? `${decision.action} — recorded by ${decision.officer} on ${fmtDate(decision.date)}` : 'No decision recorded yet.',
    '',
    'Note: This AI-generated report supports — but does not replace — the judgement of the Procurement Officer.',
    `Generated: ${new Date().toLocaleString('en-IN')}`
  ];
  const blob = new Blob([lines.join('\n')], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `BidSure_Report_${b.id}_${t.id.replace(/\//g,'-')}.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('Report downloaded');
}

// ============================================================
// BIDDERS LIST (global)
// ============================================================
function renderBiddersList(){
  view.innerHTML = `
    ${pageHead({eyebrow:'Portfolio', title:'Bidders', sub:'All bidders across active and closed GeM tenders.'})}
    <div class="card">
      <div class="card-pad" style="padding-bottom:0">
        <div class="table-toolbar">
          <div class="search-box"><i data-icon="search" data-size="15"></i><input id="bSearch" placeholder="Search company, GSTIN, PAN or bidder ID…"></div>
          <div class="filter-group">
            <select class="filter-select" id="bRisk"><option value="">All risk levels</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
            <select class="filter-select" id="bStatus"><option value="">All statuses</option><option>Verified</option><option>Under Review</option><option>Not Started</option></select>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Bidder ID</th><th>Tender</th><th>GSTIN</th><th>Score</th><th>Risk</th><th>Status</th><th></th></tr></thead>
          <tbody id="bRows"></tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
  const draw = ()=>{
    const q = document.getElementById('bSearch').value.toLowerCase();
    const risk = document.getElementById('bRisk').value;
    const st = document.getElementById('bStatus').value;
    const rows = BIDDERS.filter(b=>
      (!q || (b.company+b.id+b.gstin+b.pan).toLowerCase().includes(q)) &&
      (!risk || b.risk===risk) && (!st || b.status===st));
    document.getElementById('bRows').innerHTML = rows.length ? rows.map(b=>`
      <tr>
        <td style="font-weight:600">${esc(b.company)}</td>
        <td class="mono">${b.id}</td>
        <td class="mono" style="font-size:12px">${findTender(b.tenderId).id}</td>
        <td class="mono">${b.gstin}</td>
        <td class="mono">${b.score}/100</td>
        <td><span class="pill ${riskPillClass(b.risk)}">${b.risk}</span></td>
        <td><span class="pill ${statusPillClass(b.status)}">${b.status}</span></td>
        <td style="text-align:right"><button class="btn btn-outline btn-sm" onclick="go('bidder/${encodeURIComponent(b.tenderId)}/${encodeURIComponent(b.id)}')">View</button></td>
      </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="es-title">No bidders match your filters</div></div></td></tr>`;
  };
  ['bSearch','bRisk','bStatus'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
  draw();
}

// ============================================================
// VERIFICATION QUEUE
// ============================================================
function renderVerificationQueue(){
  const queue = BIDDERS.filter(b=>b.status!=='Verified');
  view.innerHTML = `
    ${pageHead({eyebrow:'Workflow', title:'Verification queue', sub:'Bids awaiting or currently under AI-assisted verification.'})}
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Tender</th><th>Score</th><th>Risk</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            ${queue.map(b=>`
              <tr>
                <td style="font-weight:600">${esc(b.company)}</td>
                <td class="mono" style="font-size:12px">${findTender(b.tenderId).id}</td>
                <td class="mono">${b.score}/100</td>
                <td><span class="pill ${riskPillClass(b.risk)}">${b.risk}</span></td>
                <td><span class="pill ${statusPillClass(b.status)}">${b.status}</span></td>
                <td>${fmtDate(b.submittedOn)}</td>
                <td style="text-align:right"><button class="btn btn-accent btn-sm" onclick="go('bidder/${encodeURIComponent(b.tenderId)}/${encodeURIComponent(b.id)}/analysis')"><i data-icon="sparkle" data-size="13"></i>Verify now</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
}

// ============================================================
// RISK OVERVIEW (global)
// ============================================================
function renderRiskOverview(){
  const sorted = [...BIDDERS].sort((a,b)=>a.score-b.score);
  view.innerHTML = `
    ${pageHead({eyebrow:'Portfolio risk', title:'Risk overview', sub:'Bidders ranked by AI-assessed compliance risk across all tenders.'})}
    <div class="dash-grid">
      <div class="card">
        <div class="card-head"><h3>Risk distribution</h3></div>
        <div class="chart-wrap"><canvas id="chartRisk2"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Top risk factors this cycle</h3></div>
        <div class="alert-list">
          ${['MISSING','FAIL','FLAGGED'].map(kind=>{
            const count = BIDDERS.reduce((n,b)=>n+b.results.filter(r=>r.result===kind).length,0);
            return `<div class="alert-row"><span class="alert-dot ${kind==='FLAGGED'?'fail':kind==='MISSING'?'review':'fail'}"></span>
              <div><div class="alert-title">${count} ${kind.toLowerCase()} check${count===1?'':'s'} across active bids</div><div class="alert-meta">Weighted into risk score</div></div></div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Bidders by risk</h3><span class="muted">Lowest score first</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Tender</th><th>Score</th><th>Risk</th><th>Missing</th><th>Flagged/Failed</th><th></th></tr></thead>
          <tbody>
            ${sorted.map(b=>`
              <tr>
                <td style="font-weight:600">${esc(b.company)}</td>
                <td class="mono" style="font-size:12px">${findTender(b.tenderId).id}</td>
                <td class="mono">${b.score}/100</td>
                <td><span class="pill ${riskPillClass(b.risk)}">${b.risk}</span></td>
                <td>${b.results.filter(r=>r.result==='MISSING').length}</td>
                <td>${b.results.filter(r=>r.result==='FAIL'||r.result==='FLAGGED').length}</td>
                <td style="text-align:right"><button class="btn btn-outline btn-sm" onclick="go('bidder/${encodeURIComponent(b.tenderId)}/${encodeURIComponent(b.id)}/risk')">View risk</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
  const low = BIDDERS.filter(b=>b.risk==='LOW').length, med = BIDDERS.filter(b=>b.risk==='MEDIUM').length, high = BIDDERS.filter(b=>b.risk==='HIGH').length;
  new Chart(document.getElementById('chartRisk2'), {
    type:'bar',
    data:{ labels:['Low','Medium','High'], datasets:[{ data:[low,med,high], backgroundColor:['#188A5A','#C97A17','#C9372C'], borderRadius:6, maxBarThickness:60 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ y:{ beginAtZero:true, grid:{color:'#EEF0F6'}, ticks:{stepSize:1,color:'#8891A5'} }, x:{ grid:{display:false}, ticks:{color:'#4B5468',font:{weight:'600'}} } } }
  });
}

// ============================================================
// REPORTS LIST
// ============================================================
function renderReportsList(){
  view.innerHTML = `
    ${pageHead({eyebrow:'Records', title:'Reports', sub:'Generated compliance reports available for download or sharing.'})}
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Bidder</th><th>Tender</th><th>Score</th><th>Risk</th><th>Decision</th><th></th></tr></thead>
          <tbody>
            ${BIDDERS.map(b=>{
              const d = decisionFor(b.tenderId,b.id);
              return `<tr>
                <td style="font-weight:600">${esc(b.company)}</td>
                <td class="mono" style="font-size:12px">${findTender(b.tenderId).id}</td>
                <td class="mono">${b.score}/100</td>
                <td><span class="pill ${riskPillClass(b.risk)}">${b.risk}</span></td>
                <td>${d ? `<span class="pill pill-open">${esc(d.action)}</span>` : `<span style="color:var(--text-400);font-size:12.5px">Pending</span>`}</td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn btn-outline btn-sm" onclick="go('bidder/${encodeURIComponent(b.tenderId)}/${encodeURIComponent(b.id)}/report')">View</button>
                  <button class="btn btn-primary btn-sm" onclick="downloadReport('${b.tenderId}','${b.id}')"><i data-icon="download" data-size="13"></i>Download</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
}

// ============================================================
// AUDIT TRAIL
// ============================================================
function renderAudit(){
  view.innerHTML = `
    ${pageHead({eyebrow:'Governance', title:'Audit trail', sub:'Complete, timestamped record of every AI action and officer decision.'})}
    <div class="card">
      <div class="card-pad" style="padding-bottom:0">
        <div class="table-toolbar">
          <div class="search-box"><i data-icon="search" data-size="15"></i><input id="aSearch" placeholder="Search bidder or requirement…"></div>
          <div class="filter-group">
            <select class="filter-select" id="aResult">
              <option value="">All results</option>
              <option>PASS</option><option>REVIEW</option><option>FAIL</option><option>MISSING</option><option>CLEAR</option><option>FLAGGED</option><option>PENDING</option>
            </select>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Bidder</th><th>Requirement</th><th>Action</th><th>Source</th><th>Result</th><th>Officer</th></tr></thead>
          <tbody id="aRows"></tbody>
        </table>
      </div>
    </div>
  `;
  renderIcons();
  const draw = ()=>{
    const q = document.getElementById('aSearch').value.toLowerCase();
    const res = document.getElementById('aResult').value;
    const rows = allAudit().filter(a=>
      (!q || (a.bidder+a.requirement).toLowerCase().includes(q)) && (!res || a.result===res));
    document.getElementById('aRows').innerHTML = rows.length ? rows.map(a=>`
      <tr>
        <td class="mono" style="font-size:12px;white-space:nowrap">${a.date}</td>
        <td style="font-weight:600">${esc(a.bidder)}</td>
        <td>${esc(a.requirement)}</td>
        <td style="color:var(--text-600)">${esc(a.action)}</td>
        <td style="color:var(--text-400);font-size:12.3px">${esc(a.source)}</td>
        <td><span class="pill ${a.result==='PENDING'?'pill-open':pillClassForResult(a.result)}">${a.result}</span></td>
        <td>${esc(a.officer)}</td>
      </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="es-title">No matching entries</div></div></td></tr>`;
  };
  ['aSearch','aResult'].forEach(id=>document.getElementById(id).addEventListener('input',draw));
  draw();
}

// ============================================================
// SETTINGS
// ============================================================
function renderSettings(){
  view.innerHTML = `
    ${pageHead({eyebrow:'Console', title:'Settings', sub:'Configure verification sources, notifications and console preferences.'})}
    <div class="settings-grid">
      <div class="settings-nav">
        <a href="#" class="active">Verification sources</a>
        <a href="#" onclick="return false;">Notifications</a>
        <a href="#" onclick="return false;">Officer profile</a>
        <a href="#" onclick="return false;">Access &amp; roles</a>
      </div>
      <div class="card card-pad">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px">Multi-portal verification sources</div>
        <div style="font-size:12.3px;color:var(--text-400);margin-bottom:6px">Toggle which external registries BidSure AI cross-checks during verification.</div>
        <div class="toggle-row"><div><div class="toggle-title">GSTN Portal</div><div class="toggle-sub">Validates GSTIN status and legal name</div></div><div class="switch on" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div class="toggle-row"><div><div class="toggle-title">Udyam Registration Portal</div><div class="toggle-sub">Validates MSME classification and validity</div></div><div class="switch on" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div class="toggle-row"><div><div class="toggle-title">EPFO / ESIC</div><div class="toggle-sub">Checks establishment status and filing history</div></div><div class="switch on" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div class="toggle-row"><div><div class="toggle-title">Income Tax e-Filing</div><div class="toggle-sub">Cross-verifies PAN and ITR acknowledgement numbers</div></div><div class="switch on" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div class="toggle-row"><div><div class="toggle-title">GeM Debarment List</div><div class="toggle-sub">Screens bidders against active blacklisting orders</div></div><div class="switch on" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div class="toggle-row"><div><div class="toggle-title">Auto-run OCR on upload</div><div class="toggle-sub">Start extraction as soon as a document is uploaded</div></div><div class="switch" onclick="this.classList.toggle('on')"><i></i></div></div>
        <div style="margin-top:16px"><button class="btn btn-primary" onclick="toast('Settings saved')">Save changes</button></div>
      </div>
    </div>
  `;
  renderIcons();
}

// ---------- init ----------
document.getElementById('login-form').addEventListener('submit', e=>{
  e.preventDefault();
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  toast('Welcome back, Priya');
  router();
});
document.getElementById('logout-btn').addEventListener('click', ()=>{
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  location.hash = '';
});
document.getElementById('global-search').addEventListener('keydown', e=>{
  if(e.key==='Enter' && e.target.value.trim()){
    go('bidders');
    setTimeout(()=>{ const b=document.getElementById('bSearch'); if(b){ b.value=e.target.value; b.dispatchEvent(new Event('input')); } },50);
  }
});
renderIcons();
window.addEventListener('hashchange', router);

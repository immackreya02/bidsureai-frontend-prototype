// ============================================================
// MOCK DATA — BidSure AI prototype (all data is illustrative)
// ============================================================

const REQ_DEFS = [
  { key:'gst',        label:'GST Registration',        icon:'doc',      source:'GSTN Portal' },
  { key:'pan',         label:'PAN Verification',         icon:'file',     source:'Income Tax e-Filing' },
  { key:'udyam',       label:'Udyam / MSME Registration', icon:'building', source:'Udyam Registration Portal' },
  { key:'itr',         label:'Income Tax Returns (3 yr)', icon:'report',   source:'Income Tax e-Filing' },
  { key:'oem',         label:'OEM Authorization',         icon:'shield',   source:'Bidder-submitted certificate' },
  { key:'mii',         label:'Make in India Certificate', icon:'flag',     source:'DPIIT / Self-certification' },
  { key:'epfo',        label:'EPFO / ESIC Compliance',    icon:'users',    source:'EPFO Portal' },
  { key:'experience',  label:'Past Experience (contracts)', icon:'briefcase', source:'Bidder-submitted work orders' },
  { key:'turnover',    label:'Annual Turnover',           icon:'trend-up', source:'Audited Financials' },
  { key:'blacklist',   label:'Blacklisting Check',        icon:'ban',      source:'GeM Debarment List' },
];

const TENDERS = [
  {
    id:'GEM/2026/B/4471829', title:'Supply of Advanced Life Support Ambulances (Type-C)', org:'Directorate of Health Services, Tamil Nadu',
    category:'Medical Equipment', closingDate:'2026-09-18', status:'Verification In Progress',
    description:'Procurement of 42 Type-C Advanced Life Support ambulances with onboard diagnostic and ICU-grade equipment for district hospitals.',
    requirements:['gst','pan','udyam','itr','oem','mii','epfo','experience','turnover','blacklist'],
    minTurnover:'₹8 Cr (avg. last 3 yrs)', minExperience:'2 similar contracts ≥ ₹3 Cr in last 5 yrs',
  },
  {
    id:'GEM/2026/B/4492013', title:'Procurement of Ruggedized Laptops for Field Survey Units', org:'Ministry of Rural Development',
    category:'IT Hardware', closingDate:'2026-09-22', status:'Verification In Progress',
    description:'Supply of 1,200 ruggedized (MIL-STD-810H) laptops with 3-year onsite warranty for field data collection teams.',
    requirements:['gst','pan','udyam','itr','oem','mii','epfo','turnover','blacklist'],
    minTurnover:'₹5 Cr (avg. last 3 yrs)', minExperience:'1 similar contract ≥ ₹1.5 Cr in last 3 yrs',
  },
  {
    id:'GEM/2026/B/4501177', title:'Annual Maintenance Contract — Solar Street Lighting', org:'Tamil Nadu Energy Development Agency',
    category:'Works & Services', closingDate:'2026-09-12', status:'Awaiting Verification',
    description:'AMC for 18,500 solar street lighting units across 6 districts, including battery replacement and quarterly inspection.',
    requirements:['gst','pan','udyam','itr','epfo','experience','turnover','blacklist'],
    minTurnover:'₹2 Cr (avg. last 3 yrs)', minExperience:'1 similar AMC ≥ ₹80 L in last 3 yrs',
  },
  {
    id:'GEM/2026/B/4488654', title:'Supply of Steel Almirahs & Office Furniture', org:'Department of Revenue, Chennai',
    category:'Office Supplies', closingDate:'2026-09-09', status:'Verified',
    description:'Supply and installation of 3,400 steel almirahs and modular office furniture across taluk offices.',
    requirements:['gst','pan','udyam','itr','epfo','turnover','blacklist'],
    minTurnover:'₹1.5 Cr (avg. last 3 yrs)', minExperience:'—',
  },
];

// Verification profiles keyed by "tenderId::bidderId"
// result: PASS | REVIEW | FAIL | MISSING | CLEAR | FLAGGED
function req(key, result, evidence, reason, confidence){
  const def = REQ_DEFS.find(r=>r.key===key);
  return { key, label:def.label, source:def.source, result, evidence, reason, confidence };
}

const BIDDERS = [
  // --- Ambulance tender bidders ---
  { id:'BID-10231', tenderId:'GEM/2026/B/4471829', company:'MedLine Mobility Systems Pvt. Ltd.', gstin:'33AABCM1234F1Z6', pan:'AABCM1234F', udyam:'UDYAM-TN-12-0004521', cin:'U34103TN2011PTC078451',
    score:84, risk:'MEDIUM', status:'Under Review', submittedOn:'2026-09-02',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and matches bidder legal name on GSTN portal.',98),
      req('pan','PASS','PAN Card.pdf','PAN verified against Income Tax e-Filing database; name match confirmed.',99),
      req('udyam','PASS','Udyam Certificate.pdf','Valid Udyam registration under Medium Enterprise category.',96),
      req('itr','PASS','ITR_2023-25.pdf','3 years of ITR filed continuously; acknowledgement numbers verified.',93),
      req('oem','MISSING','—','No OEM authorization certificate uploaded for the ambulance chassis manufacturer.',0),
      req('mii','REVIEW','MII_Declaration.pdf','Self-certified Make in India declaration submitted, but local value-addition % not substantiated with BOM.',61),
      req('epfo','PASS','EPFO_ECR.pdf','EPFO establishment active; latest ECR filed on time.',95),
      req('experience','PASS','WorkOrders_Ambulance.pdf','2 completed contracts of ₹3.2 Cr and ₹4.1 Cr found, meeting eligibility threshold.',90),
      req('turnover','PASS','Audited_Financials_23-25.pdf','Average 3-year turnover of ₹9.6 Cr exceeds the ₹8 Cr threshold.',94),
      req('blacklist','CLEAR','GeM Debarment List','No match found on GeM / CVC blacklist registers as of verification date.',99),
    ]},
  { id:'BID-10245', tenderId:'GEM/2026/B/4471829', company:'Suryoday Health Vehicles LLP', gstin:'27AAFCS9087K1ZP', pan:'AAFCS9087K', udyam:'UDYAM-MH-03-0011287', cin:'AAJ-4471',
    score:52, risk:'HIGH', status:'Under Review', submittedOn:'2026-09-03',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active; minor address mismatch flagged but within tolerance.',88),
      req('pan','PASS','PAN Card.pdf','PAN verified; name matches with 1 abbreviation difference.',85),
      req('udyam','FAIL','Udyam_Cert_Expired.pdf','Udyam registration certificate expired on 2025-11-30.',97),
      req('itr','REVIEW','ITR_2024.pdf','Only 1 of 3 required years of ITR submitted.',55),
      req('oem','MISSING','—','OEM authorization not provided.',0),
      req('mii','FAIL','—','No Make in India declaration submitted.',0),
      req('epfo','REVIEW','EPFO_ECR.pdf','ECR filing gap detected for 2 consecutive quarters in 2025.',58),
      req('experience','FAIL','WorkOrders.pdf','Only 1 prior contract of ₹1.1 Cr found — below the ₹3 Cr eligibility threshold.',82),
      req('turnover','REVIEW','Financials_partial.pdf','Turnover figures self-declared; audited statement missing for FY 2024-25.',49),
      req('blacklist','CLEAR','GeM Debarment List','No active blacklisting found.',99),
    ]},
  { id:'BID-10258', tenderId:'GEM/2026/B/4471829', company:'Vaidya Motors & Engineering', gstin:'29AACCV4521Q1Z3', pan:'AACCV4521Q', udyam:'UDYAM-KA-08-0009123', cin:'U29100KA2015PTC081223',
    score:97, risk:'LOW', status:'Verified', submittedOn:'2026-09-01',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified against GSTN portal.',99),
      req('pan','PASS','PAN Card.pdf','PAN verified; name match exact.',99),
      req('udyam','PASS','Udyam Certificate.pdf','Valid registration under Medium Enterprise category.',98),
      req('itr','PASS','ITR_2023-25.pdf','3 consecutive years filed and verified.',97),
      req('oem','PASS','OEM_Authorization_TataMotors.pdf','Valid OEM authorization letter from chassis manufacturer, digitally signed.',95),
      req('mii','PASS','MII_Certificate_DPIIT.pdf','DPIIT-registered Make in India certificate with 62% local content, exceeding the 50% threshold.',96),
      req('epfo','PASS','EPFO_ECR.pdf','Establishment active; consistent ECR filing for 24 months.',97),
      req('experience','PASS','WorkOrders_Verified.pdf','3 completed contracts exceeding ₹3 Cr each, all verified with client confirmation letters.',95),
      req('turnover','PASS','Audited_Financials.pdf','Average turnover ₹14.2 Cr, well above threshold.',98),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',99),
    ]},

  // --- Laptop tender bidders ---
  { id:'BID-11032', tenderId:'GEM/2026/B/4492013', company:'Fortress Ruggedized Systems India', gstin:'07AAECF7841L1ZD', pan:'AAECF7841L', udyam:'UDYAM-DL-01-0003345', cin:'U72200DL2013PTC091223',
    score:89, risk:'LOW', status:'Verified', submittedOn:'2026-09-05',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified.',98),
      req('pan','PASS','PAN Card.pdf','PAN verified against IT e-Filing database.',99),
      req('udyam','PASS','Udyam Certificate.pdf','Valid registration, Small Enterprise category.',95),
      req('itr','PASS','ITR_2023-25.pdf','3 years filed continuously.',93),
      req('oem','PASS','OEM_Authorization_Panasonic.pdf','Valid authorization letter for laptop supply and warranty support.',94),
      req('mii','REVIEW','MII_SelfDeclaration.pdf','Self-declared 34% local value addition; below preferential threshold, requires substantiation.',58),
      req('epfo','PASS','EPFO_ECR.pdf','Active establishment, timely filings.',96),
      req('turnover','PASS','Audited_Financials.pdf','Average turnover ₹6.8 Cr exceeds ₹5 Cr threshold.',95),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',99),
    ]},
  { id:'BID-11048', tenderId:'GEM/2026/B/4492013', company:'NorthStar Computing Devices', gstin:'19AAGCN2210P1Z9', pan:'AAGCN2210P', udyam:'UDYAM-WB-05-0007612', cin:'U30006WB2018PTC098654',
    score:38, risk:'HIGH', status:'Under Review', submittedOn:'2026-09-06',
    results:[
      req('gst','FAIL','GST_Certificate.pdf','GSTIN found cancelled (suo-moto) as of 2026-06-14 on GSTN portal.',94),
      req('pan','PASS','PAN Card.pdf','PAN verified.',96),
      req('udyam','REVIEW','Udyam_Cert.pdf','Udyam number format inconsistent with MSME registry records.',52),
      req('itr','FAIL','—','No ITR documents uploaded.',0),
      req('oem','MISSING','—','OEM authorization not submitted.',0),
      req('mii','FAIL','—','No Make in India declaration submitted.',0),
      req('epfo','FAIL','—','No active EPFO establishment found linked to PAN.',88),
      req('turnover','FAIL','Financials_unaudited.pdf','Submitted financials are unaudited and turnover falls short of ₹5 Cr threshold.',80),
      req('blacklist','FLAGGED','GeM Debarment List','Associated director found linked to a debarred entity in a separate GeM case.',77),
    ]},

  // --- Solar AMC bidders ---
  { id:'BID-12091', tenderId:'GEM/2026/B/4501177', company:'SunGrid Renewable Services', gstin:'33AAKCS3345H1ZX', pan:'AAKCS3345H', udyam:'UDYAM-TN-15-0006678', cin:'U40106TN2016PTC088712',
    score:91, risk:'LOW', status:'Not Started', submittedOn:'2026-09-04',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified.',97),
      req('pan','PASS','PAN Card.pdf','PAN verified.',98),
      req('udyam','PASS','Udyam Certificate.pdf','Valid registration, Small Enterprise category.',96),
      req('itr','PASS','ITR_2023-25.pdf','3 years filed continuously.',92),
      req('epfo','PASS','EPFO_ECR.pdf','Active and compliant.',95),
      req('experience','PASS','AMC_WorkOrder_2022.pdf','Prior AMC of ₹1.1 Cr for solar lighting verified with completion certificate.',91),
      req('turnover','PASS','Audited_Financials.pdf','Average turnover ₹3.4 Cr exceeds ₹2 Cr threshold.',93),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',99),
    ]},
  { id:'BID-12104', tenderId:'GEM/2026/B/4501177', company:'Tamil Nadu Solar Works', gstin:'33AAJCT8821G1Z1', pan:'AAJCT8821G', udyam:'UDYAM-TN-21-0002234', cin:'—',
    score:66, risk:'MEDIUM', status:'Not Started', submittedOn:'2026-09-05',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified.',95),
      req('pan','PASS','PAN Card.pdf','PAN verified.',96),
      req('udyam','PASS','Udyam Certificate.pdf','Valid Micro Enterprise registration.',94),
      req('itr','REVIEW','ITR_2024-25.pdf','Only 2 of 3 required years available; FY 2022-23 return not located.',54),
      req('epfo','PASS','EPFO_ECR.pdf','Active establishment.',92),
      req('experience','REVIEW','WorkOrder_Partial.pdf','Prior contract value (₹65 L) marginally below the ₹80 L eligibility threshold.',60),
      req('turnover','PASS','Financials.pdf','Average turnover ₹2.3 Cr meets threshold.',89),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',99),
    ]},

  // --- Steel almirah tender (already verified / closed workflow) ---
  { id:'BID-09884', tenderId:'GEM/2026/B/4488654', company:'Chola Steel Furniture Co.', gstin:'33AACCC2210L1Z7', pan:'AACCC2210L', udyam:'UDYAM-TN-09-0001129', cin:'U36101TN2005PTC055412',
    score:95, risk:'LOW', status:'Verified', submittedOn:'2026-08-29',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified.',98),
      req('pan','PASS','PAN Card.pdf','PAN verified.',99),
      req('epfo','PASS','EPFO_ECR.pdf','Active and compliant.',96),
      req('itr','PASS','ITR_2023-25.pdf','3 years filed continuously.',94),
      req('turnover','PASS','Audited_Financials.pdf','Average turnover ₹2.1 Cr exceeds ₹1.5 Cr threshold.',95),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',99),
    ]},
  { id:'BID-09891', tenderId:'GEM/2026/B/4488654', company:'Anand Metal Industries', gstin:'33AABFA1123M1Z5', pan:'AABFA1123M', udyam:'UDYAM-TN-04-0000871', cin:'—',
    score:73, risk:'MEDIUM', status:'Verified', submittedOn:'2026-08-30',
    results:[
      req('gst','PASS','GST Certificate.pdf','GSTIN active and verified.',96),
      req('pan','PASS','PAN Card.pdf','PAN verified.',97),
      req('epfo','REVIEW','EPFO_ECR.pdf','One quarter of ECR filing delayed by 41 days.',57),
      req('itr','PASS','ITR_2023-25.pdf','3 years filed continuously.',91),
      req('turnover','REVIEW','Financials.pdf','Turnover just below threshold in FY 2023-24, recovered in FY 2024-25.',55),
      req('blacklist','CLEAR','GeM Debarment List','No blacklisting record found.',98),
    ]},
];

function riskFromScore(score){
  if(score>=80) return 'LOW';
  if(score>=55) return 'MEDIUM';
  return 'HIGH';
}

function pillClassForResult(result){
  switch(result){
    case 'PASS': case 'CLEAR': return 'pill-pass';
    case 'REVIEW': return 'pill-review';
    case 'FAIL': case 'MISSING': case 'FLAGGED': return 'pill-fail';
    default: return 'pill-neutral';
  }
}

function riskFactorsFor(bidder){
  const factors = [];
  bidder.results.forEach(r=>{
    if(r.result==='MISSING') factors.push({ type:'missing', title:`Missing document — ${r.label}`, sub:r.reason, weight:'-14 pts' });
    if(r.result==='FAIL') factors.push({ type:'fail', title:`Failed check — ${r.label}`, sub:r.reason, weight:'-18 pts' });
    if(r.result==='REVIEW') factors.push({ type:'review', title:`Needs review — ${r.label}`, sub:r.reason, weight:'-8 pts' });
    if(r.result==='FLAGGED') factors.push({ type:'fail', title:`Flagged — ${r.label}`, sub:r.reason, weight:'-22 pts' });
  });
  return factors;
}

function recommendationFor(bidder){
  const risk = bidder.risk;
  const missing = bidder.results.filter(r=>r.result==='MISSING').map(r=>r.label);
  const reviews = bidder.results.filter(r=>r.result==='REVIEW').map(r=>r.label);
  const fails = bidder.results.filter(r=>r.result==='FAIL' || r.result==='FLAGGED').map(r=>r.label);

  if(risk==='LOW' && fails.length===0 && missing.length===0){
    return { verdict:'Compliant — Recommended for Technical Evaluation',
      reason:`All ${bidder.results.length} mandatory checks passed with high confidence. No missing documents or unresolved mismatches were found. AI recommends proceeding to technical evaluation; final eligibility decision rests with the Procurement Officer.` };
  }
  if(risk==='HIGH'){
    return { verdict:'Further Review Required — High Risk',
      reason:`${fails.length} check(s) failed or were flagged${fails.length?': '+fails.join(', ')+'.':'.'} ${missing.length?`Missing: ${missing.join(', ')}. `:''}The compliance score falls in the high-risk band. AI recommends a Clarification request or Manual Review before proceeding. Final decision rests with the Procurement Officer.` };
  }
  return { verdict:'Further Review Required',
    reason:`${missing.length?`Missing document: ${missing.join(', ')}. `:''}${reviews.length?`${reviews.length} item(s) need manual review: ${reviews.join(', ')}. `:''}Overall score falls in the medium-risk band. AI recommends requesting clarification from the bidder or routing for Manual Review. Final decision rests with the Procurement Officer.` };
}

const AUDIT_TRAIL = [
  { date:'2026-09-08 14:32', bidder:'MedLine Mobility Systems Pvt. Ltd.', requirement:'OEM Authorization', action:'AI flagged as MISSING', source:'Document Extraction Engine', result:'MISSING', officer:'System (AI)' },
  { date:'2026-09-08 14:32', bidder:'MedLine Mobility Systems Pvt. Ltd.', requirement:'Make in India Certificate', action:'Cross-verification completed', source:'DPIIT Registry', result:'REVIEW', officer:'System (AI)' },
  { date:'2026-09-08 14:40', bidder:'MedLine Mobility Systems Pvt. Ltd.', requirement:'Overall Compliance', action:'Routed for Clarification', source:'Verification Console', result:'PENDING', officer:'Priya Sharma' },
  { date:'2026-09-07 11:05', bidder:'Vaidya Motors & Engineering', requirement:'Blacklisting Check', action:'Cross-verification completed', source:'GeM Debarment List', result:'CLEAR', officer:'System (AI)' },
  { date:'2026-09-07 11:12', bidder:'Vaidya Motors & Engineering', requirement:'Overall Compliance', action:'Approved for Technical Evaluation', source:'Verification Console', result:'PASS', officer:'Priya Sharma' },
  { date:'2026-09-06 16:20', bidder:'NorthStar Computing Devices', requirement:'GST Registration', action:'AI flagged as FAIL', source:'GSTN Portal', result:'FAIL', officer:'System (AI)' },
  { date:'2026-09-06 16:22', bidder:'NorthStar Computing Devices', requirement:'Blacklisting Check', action:'Director linkage flagged', source:'GeM Debarment List', result:'FLAGGED', officer:'System (AI)' },
  { date:'2026-09-06 17:00', bidder:'NorthStar Computing Devices', requirement:'Overall Compliance', action:'Routed for Manual Review', source:'Verification Console', result:'PENDING', officer:'Rahul Menon' },
  { date:'2026-09-05 09:44', bidder:'Fortress Ruggedized Systems India', requirement:'OEM Authorization', action:'Cross-verification completed', source:'Bidder-submitted certificate', result:'PASS', officer:'System (AI)' },
  { date:'2026-09-05 09:50', bidder:'Fortress Ruggedized Systems India', requirement:'Overall Compliance', action:'Approved for Technical Evaluation', source:'Verification Console', result:'PASS', officer:'Rahul Menon' },
  { date:'2026-09-04 13:15', bidder:'Anand Metal Industries', requirement:'EPFO / ESIC Compliance', action:'Delayed filing detected', source:'EPFO Portal', result:'REVIEW', officer:'System (AI)' },
  { date:'2026-09-04 13:40', bidder:'Anand Metal Industries', requirement:'Overall Compliance', action:'Approved with conditions', source:'Verification Console', result:'PASS', officer:'Priya Sharma' },
  { date:'2026-09-03 10:02', bidder:'Suryoday Health Vehicles LLP', requirement:'Udyam / MSME Registration', action:'AI flagged as FAIL — expired certificate', source:'Udyam Registration Portal', result:'FAIL', officer:'System (AI)' },
  { date:'2026-09-03 10:30', bidder:'Suryoday Health Vehicles LLP', requirement:'Overall Compliance', action:'Routed for Clarification', source:'Verification Console', result:'PENDING', officer:'Priya Sharma' },
];

function findTender(id){ return TENDERS.find(t=>t.id===id); }
function findBidder(id){ return BIDDERS.find(b=>b.id===id); }
function biddersForTender(tenderId){ return BIDDERS.filter(b=>b.tenderId===tenderId); }

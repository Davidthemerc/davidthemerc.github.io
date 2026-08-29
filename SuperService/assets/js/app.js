"use strict";


const BALANCE_PROFILE={
 sla:{Low:360,Normal:240,High:135,Critical:55},
 actionTime:{Trainee:.85,"Service Agent":1,"Senior Agent":1.10,"Chaos Desk":1.22},
 worldBurstRatio:{Trainee:.18,"Service Agent":.25,"Senior Agent":.30,"Chaos Desk":.38},
 promotionRecognition:[6,14,24,36],
 documentation:{full:80,strong:40,basic:15}
};
function scenarioComplexity(sc){
 let n=0;
 if(sc.priority==="Critical")n+=3;else if(sc.priority==="High")n+=1;
 if((sc.causes?.length||0)>=3)n+=2;
 if(sc.dataGovernance)n+=2;
 if((sc.causes||[]).some(c=>c.approvalRequired))n+=2;
 if((sc.causes||[]).some(c=>c.escalation||(sc.fixes||[]).find(f=>f[0]===c.correct)?.[2]==="escalate"))n+=1;
 if(/Security|Privacy|Records|Clinical|Privileged|Data Governance|Legal|Production/i.test(sc.cat||""))n+=1;
 return n;
}
function difficultyScenarioPool(){
 const base=state.difficulty==="Trainee"?SCENARIOS.filter(sc=>sc.priority!=="Critical"&&(sc.causes?.length||0)<=2&&!sc.dataGovernance):[...SCENARIOS];
 const bias={"Trainee":-.05,"Service Agent":.02,"Senior Agent":.13,"Chaos Desk":.24}[state.difficulty]||0;
 return base.map(sc=>({sc,key:Math.random()+scenarioComplexity(sc)*bias})).sort((a,b)=>b.key-a.key).map(x=>x.sc);
}
function worldDynamicCap(count){
 if(state.endless)return Infinity;
 const ratio=BALANCE_PROFILE.worldBurstRatio[state.difficulty]??.25;
 const cap=Math.ceil(count*ratio);
 return Math.max(state.difficulty==="Trainee"?1:2,Math.min(state.difficulty==="Chaos Desk"?10:7,cap));
}
function scoredActionCount(t){
 return (t.actions||[]).filter(a=>{
   if(a==="resolution-followup"||a==="resolution-followup-free")return false;
   if(a.startsWith("clarify:")||a.startsWith("clarify-free:"))return false;
   if(a.startsWith("free:")&&!a.startsWith("free:fix"))return false;
   return true;
 }).length;
}
function documentationPoints(t){
 const n=(t.notes||"").trim().length;
 const diagnosticEvidence=new Set([...(t.facts||[]),...(t.proactiveFacts||[])]).size;
 const toolEvidence=new Set(t.toolsUsed||[]).size;
 const actionEvidence=(t.actions||[]).some(a=>a==="correct-action"||String(a).startsWith("fix:"))||t.specialistResolution||t.coworkerResolved||!!t.request?.fulfilled;
 const validationEvidence=!!t.confirmation||!!t.alternateValidated||["Closed — No Requester Response","Closed — Request Withdrawn","User Self-Resolved"].includes(t.outcome);
 let trail=0;
 if(diagnosticEvidence>=1||toolEvidence>=1)trail++;
 if(diagnosticEvidence>=2||toolEvidence>=2)trail++;
 if(actionEvidence)trail++;
 if(validationEvidence)trail++;
 if(n>=BALANCE_PROFILE.documentation.full)return 5;
 if(n>=BALANCE_PROFILE.documentation.strong)return 4;
 if(n>=BALANCE_PROFILE.documentation.basic)return trail>=3?4:trail>=1?3:2;
 if(n>0)return Math.max(1,Math.min(3,trail));
 if(trail>=4)return 3;
 if(trail>=2)return 2;
 if(trail>=1)return 1;
 return 0;
}
function documentationEvaluationText(t){
 const d=t.scoreBreakdown?.documentation??documentationPoints(t),n=(t.notes||"").trim().length;
 if(d===0)return "The ticket record contains almost no useful resolution documentation.";
 if(d===1)return "The activity trail captured only limited evidence. Add a concise internal summary of symptoms, findings, action, and result.";
 if(d===2)return n?"The internal note is very thin and the activity trail only partially explains the resolution.":"The ticket history preserves some troubleshooting evidence, but there is no concise internal resolution summary.";
 if(d===3)return n?"The ticket is reasonably documented, but the internal summary could more clearly state the cause, action, and validation.":"The recorded diagnostics, action, and validation provide usable documentation even without a manual note; a concise internal summary would improve it.";
 if(d===4)return "Good documentation. A fuller cause/action/validation summary would earn full credit.";
 return "Documentation clearly records the investigation, action, and outcome.";
}
function successfulClosureOutcome(outcome){
 return ["User Confirmed Resolution","Catalog Request Fulfilled","Resolved Successfully","Correctly Escalated","Correctly Denied","Linked to Major Incident","Resolved After Specialist Escalation","Resolved by Teammate","Closed — No Requester Response","Resolved — Alternate Validation","Closed — Request Withdrawn"].includes(outcome);
}

const NAMES=["Maya Chen","Jordan Alvarez","Priya Singh","Marcus Hill","Elena Torres","Noah Williams","Ava Patel","Luis Ramirez","Sophie Nguyen","Derek Johnson","Kim Park","Riley Brooks","Camille Foster","Owen Price","Tasha Green","Ben Murphy","Nina Shah","Victor Lee","Lena Ortiz","Sam Wallace","Grace Kim","Tyler Reed","Monique Brown","Hector Garcia","Rachel Mendoza","Ethan Coleman","Jasmine Wu","Andre Thompson","Natalie Flores","Isaac Romero","Mei Lin","Carlos Vega","Amber Stone","Devon Harris","Fatima Khan","Leo Martinez","Chloe Bennett","Martin Shaw","Yasmin Ali","Gabriel Soto","Heather Ross","Jon Bell","Keisha Morgan","Anthony Tran","Paige Lawson","Miguel Santos","Erin Caldwell","Raymond Cho","Danielle King","Adrian Ruiz","Tiffany Young","Malik Carter","Vanessa Cruz","Peter Ho","Jocelyn Grant","Sean O'Neill","Brenda Castillo","Rahul Mehta","Alicia Walker","Dominic Perez","Wendy Lau","Terrence Moore","Sara Ibrahim","Julian Foster","Melanie Price","Oscar Salazar","Carmen Reed","Aiden Brooks","Renee Jackson","George Kim","Irene Vasquez","Caleb Wright"];
const DEPTS=["Finance","Behavioral Health","Human Resources","Public Works","Operations","Legal","Administration","Clinical Services","Facilities","Accounting","Procurement","Planning","Executive Office"];
const APP_OWNER_TEAMS={
 Fomo:"Collaboration Applications",IllogicManager:"Workflow Systems",PolicyWreck:"Governance Systems",
 Granular:"Data & Analytics",PeopleChock:"HR Systems",DumbCare:"Clinical Applications",AssetHound:"IT Asset Management"
};

const SUPPORT_TEAMS=[
 {id:"network",name:"Network Engineering",desc:"Routing, switching, DHCP, DNS, WAN and VPN infrastructure.",specialists:["Avery Knox","Miles Harper","Rina Patel"],base:[12,30]},
 {id:"security",name:"Security Operations",desc:"Phishing, compromise, malware, suspicious authentication and security incidents.",specialists:["Morgan Hale","Tariq Evans","June Park"],base:[8,24]},
 {id:"identity",name:"Identity & Access",desc:"Directory, SSO, MFA, identity provisioning and authentication platforms.",specialists:["Nora Bell","Eli Santos","Vik Shah"],base:[12,32]},
 {id:"endpoint",name:"Endpoint & Field Services",desc:"Managed computers, drivers, hardware, docks, printing, mobile and AV endpoints.",specialists:["Casey Dunn","Rosa Kim","Ian Price"],base:[14,34]},
 {id:"messaging",name:"Messaging & Collaboration",desc:"Email transport, Outlook, calendars, resource mailboxes and enterprise conferencing.",specialists:["Jules Carter","Mina Lopez","Theo Grant"],base:[14,36]},
 {id:"collaboration",name:"Collaboration Applications",desc:"Fomo and other collaboration-platform application services.",specialists:["Lena Boyd","Chris Vega","Amira Cole"],base:[15,38]},
 {id:"applications",name:"Enterprise Applications",desc:"General enterprise application servers, integrations, packaging and application backends.",specialists:["Robin Shaw","Dante Lee","Kira Mills"],base:[16,40]},
 {id:"workflow",name:"Workflow Systems",desc:"IllogicManager workflows, routing rules, approval engines and workflow integrations.",specialists:["Marisol Webb","Evan Chu","Neil Ortiz"],base:[16,42]},
 {id:"governance",name:"Governance Systems",desc:"PolicyWreck, controlled publishing, governance workflows and authority conflicts.",specialists:["Priya Ross","Jonah Reed","Celeste King"],base:[18,44]},
 {id:"data",name:"Data & Analytics",desc:"Granular, ETL, datasets, analytics permissions and production data corrections.",specialists:["Daria Nguyen","Omar Flores","Ken Wallace"],base:[18,46]},
 {id:"hr",name:"HR Systems",desc:"PeopleChock, HR integrations and authoritative personnel data workflows.",specialists:["Mara Chen","Felix Brooks","Ivy Gomez"],base:[18,46]},
 {id:"clinical",name:"Clinical Applications",desc:"DumbCare, clinical integrations, record locks, signing and clinical application support.",specialists:["Drake Young","Sonia Tran","Will Foster"],base:[10,32]},
 {id:"asset",name:"Asset Management",desc:"AssetHound, custody, inventory, transfers, disposition and scanner integrations.",specialists:["Reese Morgan","Alma Cruz","Gavin Stone"],base:[18,46]},
 {id:"files",name:"File & Storage Services",desc:"Shared drives, permissions, backup recovery, replication and storage infrastructure.",specialists:["Tess Rivera","Marco Lin","Beth Coleman"],base:[16,42]},
 {id:"privacyrecords",name:"Privacy & Records",desc:"Privacy incidents, retention, legal holds, records disposition and sensitive-data governance.",specialists:["Helen Ward","Samir Khan","Lucy Bennett"],base:[14,38]},
 {id:"vendor",name:"Vendor & Licensing",desc:"Vendor SaaS incidents, licensing, subscriptions and external service coordination.",specialists:["Nico Perez","Faith Moore","Alex Wu"],base:[20,52]},
 {id:"platform",name:"Platform Services",desc:"Certificates, server platform services, middleware and shared infrastructure components.",specialists:["Quinn Harris","Mae Foster","Ravi Singh"],base:[16,42]}
];


const SPECIALIST_BEHAVIOR={
 network:{label:"Pragmatic",mercy:1.05,advice:1.10,reroute:1.08,speed:.96,tone:"direct"},
 security:{label:"Procedure-heavy",mercy:.55,advice:.82,reroute:.72,speed:.92,tone:"strict"},
 identity:{label:"Careful",mercy:.85,advice:1.00,reroute:.92,speed:.96,tone:"direct"},
 endpoint:{label:"Hands-on",mercy:1.28,advice:1.18,reroute:1.18,speed:.94,tone:"helpful"},
 messaging:{label:"Practical",mercy:1.08,advice:1.08,reroute:1.05,speed:.98,tone:"helpful"},
 collaboration:{label:"Helpful",mercy:1.15,advice:1.18,reroute:1.10,speed:.98,tone:"helpful"},
 applications:{label:"Balanced",mercy:1.00,advice:1.00,reroute:1.00,speed:1,tone:"direct"},
 workflow:{label:"Evidence-focused",mercy:.88,advice:1.00,reroute:.90,speed:1.02,tone:"direct"},
 governance:{label:"Strict",mercy:.62,advice:.88,reroute:.72,speed:1.04,tone:"strict"},
 data:{label:"Evidence-focused",mercy:.82,advice:1.02,reroute:.88,speed:1.03,tone:"direct"},
 hr:{label:"Controlled",mercy:.74,advice:.92,reroute:.80,speed:1.04,tone:"strict"},
 clinical:{label:"Safety-first",mercy:.68,advice:.92,reroute:.78,speed:.94,tone:"strict"},
 asset:{label:"Pragmatic",mercy:1.18,advice:1.08,reroute:1.12,speed:1.02,tone:"helpful"},
 files:{label:"Practical",mercy:1.08,advice:1.10,reroute:1.02,speed:.98,tone:"direct"},
 privacyrecords:{label:"Very strict",mercy:.42,advice:.80,reroute:.60,speed:1.06,tone:"strict"},
 vendor:{label:"Flexible",mercy:1.20,advice:1.05,reroute:1.08,speed:1.10,tone:"helpful"},
 platform:{label:"Technical",mercy:.94,advice:1.08,reroute:.92,speed:.96,tone:"direct"}
};
function teamBehavior(id){return SPECIALIST_BEHAVIOR[id]||{label:"Balanced",mercy:1,advice:1,reroute:1,speed:1,tone:"direct"}}
function specialistMinimumEvidence(t){
 return t.priority==="Critical"?1:state.difficulty==="Trainee"?1:state.difficulty==="Service Agent"?2:state.difficulty==="Senior Agent"?2:3;
}
function specialistHardBlock(t){
 if(t.approval?.required&&!approvalFlowApproved(t))return "A required approval/authorization chain is incomplete. Queue load cannot override authorization.";
 if(t.approval?.denied)return "A required approval was denied. Specialist capacity cannot override the denial.";
 if(t.request){
   const missing=requestMissingFields(t);
   if(missing.length)return `The catalog intake is incomplete: ${missing.map(f=>f.label).join(", ")}.`;
   if(t.request.eligibility==="blocked")return t.request.eligibilityReason||"Catalog policy blocks this request.";
 }
 return null;
}
function specialistHandoffGrade(t,teamId){
 const expected=expectedSpecialistTeamId(t);
 if(teamId!==expected)return "Wrong Team";
 if(!causeRequiresSpecialist(t))return "Poor";
 if(specialistHardBlock(t))return "Blocked";
 const missing=specialistEvidenceRequirement(t),min=specialistMinimumEvidence(t),notes=(t.notes||"").trim().length;
 if(missing)return t.useful<=0?"Poor":"Thin";
 if(t.useful>=min+2&&notes>=40&&(t.irrelevant||0)<=1&&(t.repeats||0)<=1&&(t.wrongTeamAssignments||0)===0)return "Excellent";
 return "Adequate";
}
function handoffGradeClass(grade){return String(grade||"").toLowerCase().replace(/\s+/g,"-")}
function recordHandoffGrade(t,teamId,grade,note=""){
 t.handoffGrade=grade;t.handoffHistory=t.handoffHistory||[];
 t.handoffHistory.unshift({time:nowStamp(),teamId,grade,note});t.handoffHistory=t.handoffHistory.slice(0,20);
}
function specialistMercyChance(t,teamId,grade){
 if(specialistHardBlock(t)||!["Thin","Poor"].includes(grade))return 0;
 const base={Low:.56,Moderate:.25,High:.045}[teamLoad(teamId)]??.25;
 const gradeFactor=grade==="Thin"?1:.45,repeatBonus=Math.min(.08,(t.teamKickbacks||0)*.025);
 return Math.max(0,Math.min(.72,base*teamBehavior(teamId).mercy*gradeFactor+repeatBonus));
}
function specialistAdviceChance(t,teamId){
 const base={Low:.40,Moderate:.24,High:.085}[teamLoad(teamId)]??.20;
 return Math.max(0,Math.min(.52,base*teamBehavior(teamId).advice));
}
function specialistInternalRerouteChance(teamId){
 const base={Low:.48,Moderate:.22,High:.045}[teamLoad(teamId)]??.18;
 return Math.max(.02,Math.min(.58,base*teamBehavior(teamId).reroute));
}
function specialistAdviceText(t,teamId,missing){
 const tm=supportTeam(teamId),behavior=teamBehavior(teamId),sc=getScenario(t),cause=getCause(t),fix=(sc.fixes||[]).find(f=>f[0]===cause.correct);
 const diag=missing?.id?(sc.diagnostics||[]).find(d=>d[0]===missing.id):null;
 const solutionLevel=Math.random()<(teamLoad(teamId)==="Low"?.46:teamLoad(teamId)==="Moderate"?.34:.20);
 if(diag)t.specialistSuggestedDiagnostic=diag[0];
 const directFix=!!fix&&fix[2]!=="escalate"&&!cause.escalation;
 if(solutionLevel&&directFix)t.specialistSuggestedFix=fix[0];
 const check=sentenceCaseLower(diag?.[1]||missing?.label||missing?.text?.replace(/^Please collect:\s*/i,"").replace(/\.$/,"")||"collect the missing evidence");
 const next=solutionLevel?(directFix?` If that lines up with the symptoms, ${sentenceCaseLower(fix[1])} is the direction we'd expect this to go.`:` The symptom pattern looks consistent with "${cause.label}"; that check should help confirm whether that's what we're dealing with.`):"";
 if(behavior.tone==="strict")return `Before this comes back to ${tm.name}, ${check}. That's required evidence for us.${next}`;
 if(behavior.tone==="helpful")return `We'll point you in the right direction before returning it: ${check}. That's the first thing we'd check here.${next}`;
 return rand([
   `Before you send this back, ${check}. That's the first thing we'd check on our side.${next}`,
   `This is close, but you're missing one useful check: ${check}.${next}`,
   `Take another look at ${check}. That should tell you whether this actually needs ${tm.name}.${next}`
 ]);
}
function specialistMercyMessage(t,teamId,missing,grade){
 const tm=supportTeam(teamId),load=teamLoad(teamId),rawCheck=missing?.id?(getScenario(t).diagnostics||[]).find(d=>d[0]===missing.id)?.[1]:missing?.label||missing?.text;
 const check=rawCheck?sentenceCaseLower(rawCheck.replace(/^Please collect:\s*/i,"").replace(/\.$/,"")):"";
 const detail=check?` You skipped ${check}.`:"";
 return rand([
   `We'll take this one rather than bounce it back.${detail} Our queue is ${load.toLowerCase()} enough that we can finish the investigation, but include that evidence next time.`,
   `Accepted with a ${grade.toLowerCase()} handoff.${detail} We're going to handle it instead of sending it back, but this would likely be returned under a heavier queue.`,
   `We'll work it.${detail} Consider this a courtesy acceptance; the handoff itself is still incomplete.`
 ]);
}


const SERVICE_DESK_COWORKERS=[
 {id:"tessa",name:"Tessa Morgan",title:"Service Desk Agent II",specialties:["identity","files"],style:"Methodical",willingness:1.00,standards:1.18,capacity:5,help:"patient",bio:"Strong with identity, access, and shared-resource problems. Helpful, but expects a real handoff."},
 {id:"leo",name:"Leo Brennan",title:"Senior Service Agent",specialties:["network","endpoint"],style:"Pragmatic",willingness:1.16,standards:.94,capacity:6,help:"direct",bio:"Fast with network, hardware, docks, printers, and anything he can reproduce quickly."},
 {id:"nadia",name:"Nadia Park",title:"Troubleshooting Specialist",specialties:["messaging","applications","collaboration"],style:"Precise",willingness:.94,standards:1.12,capacity:5,help:"technical",bio:"Excellent with applications, email, collaboration, and evidence-heavy troubleshooting."},
 {id:"evan",name:"Evan Mercer",title:"Service Desk Agent",specialties:["endpoint","applications"],style:"Fast-moving",willingness:1.20,standards:.82,capacity:7,help:"casual",bio:"Usually willing to grab something if his queue is light. Documentation is not his favorite activity."},
 {id:"monica",name:"Monica Reyes",title:"Senior Service Agent",specialties:["governance","privacyrecords","hr"],style:"Procedure-first",willingness:.82,standards:1.28,capacity:5,help:"strict",bio:"Best choice for policy, records, HR, and controlled requests. Very unlikely to accept a sloppy transfer."},
 {id:"caleb",name:"Caleb Finch",title:"Service Desk Agent",specialties:["asset","vendor","collaboration"],style:"Eager",willingness:1.10,standards:.90,capacity:4,help:"friendly",bio:"Newer agent who is willing to help, especially with assets, vendor issues, and collaboration tools."}
];
function buildCoworkerState(){
 return SERVICE_DESK_COWORKERS.map(c=>({...c,trust:62,goodwill:0,dumpsReceived:0,helped:0,accepted:0,rejected:0,trades:0,resolved:0,complaints:0,lastInteraction:null}));
}
function normalizeCoworker(c,def){
 return {...def,...(c||{}),trust:Math.max(0,Math.min(100,Number(c?.trust??def.trust))),goodwill:Number(c?.goodwill||0),dumpsReceived:Number(c?.dumpsReceived||0),helped:Number(c?.helped||0),accepted:Number(c?.accepted||0),rejected:Number(c?.rejected||0),trades:Number(c?.trades||0),resolved:Number(c?.resolved||0),complaints:Number(c?.complaints||0)};
}
function coworkerById(id){return state?.coworkers?.find(c=>c.id===id)||SERVICE_DESK_COWORKERS.find(c=>c.id===id)||null}

const WORLD_EVENT_TEMPLATES=[
 {id:"fomo-release",kind:"Change",title:"Fomo 10.4 Production Deployment",summary:"A planned Fomo release is being deployed. Collaboration Applications is watching notification, preview, and integration health.",planned:true,incident:true,severity:"High",duration:[75,125],tickets:[2,4],scenarios:[["fomo-notify","queue"],["fomo-webhook","hooks"],["fomo-preview","service"],["fomo-rollout-profile","policy"]]},
 {id:"vpn-degrade",kind:"Outage",title:"Remote Access Gateway Degradation",summary:"Remote users are intermittently failing to establish VPN sessions. Network Engineering is investigating gateway health.",planned:false,incident:true,severity:"Critical",duration:[55,110],tickets:[2,4],scenarios:[["vpn","gateway"],["vpn-route","policy"],["emergency-vpn","eligible"]]},
 {id:"mail-backlog",kind:"Outage",title:"Messaging Transport Backlog",summary:"Mail transport latency is elevated. Delivery may be delayed even when messages are accepted successfully.",planned:false,incident:true,severity:"High",duration:[60,120],tickets:[2,4],scenarios:[["maildelay","transport"],["mailtrace-fail","transport"],["mail-quota-backend","quota"]]},
 {id:"phish-wave",kind:"Security Campaign",title:"Credential-Harvesting Campaign",summary:"Security has observed a coordinated phishing wave using storage-quota and shared-document lures. Related reports may look different by user.",planned:false,incident:false,severity:"Critical",duration:[90,160],tickets:[2,5],scenarios:[["phish","creds"],["phish","click"],["susmail",null],["mfa-fatigue","attack"],["unknown-device","session"],["phish-wave-report","campaign"]]},
 {id:"newhire-wave",kind:"Workload",title:"New-Hire Intake Wave",summary:"A large onboarding group is starting. Expect elevated account, MFA, equipment, software, and access requests.",planned:true,incident:false,severity:"Normal",duration:[150,240],tickets:[2,5],scenarios:[["newhire","ready"],["mfa","new"],["install","approved"],["newhire-license","license"],["newhire-groups","sync"]]},
 {id:"dumbcare-maint",kind:"Change",title:"DumbCare Clinical Maintenance Window",summary:"Clinical Applications is performing planned backend maintenance. A subset of session, lock, and interface functions may be affected during the window.",planned:true,incident:true,severity:"Critical",duration:[65,105],tickets:[2,4],scenarios:[["dumbcare-lock","service"],["dumbcare-timeout","service"],["dumbcare-interface","interface"],["dumbcare-maintenance","service"]]},
 {id:"granular-refresh",kind:"Change",title:"Granular Warehouse Refresh",summary:"The overnight analytics refresh completed with warnings. Data & Analytics is validating ETL and report freshness.",planned:true,incident:true,severity:"High",duration:[80,130],tickets:[2,4],scenarios:[["granular-report","refresh"],["granular-etl-map","mapping"],["granular-schedule","scheduler"],["granular-refresh-delay","warehouse"]]},
 {id:"hr-feed",kind:"Change",title:"PeopleChock HR Integration Release",summary:"A PeopleChock integration update is moving employee events downstream. HR Systems is monitoring provisioning and feed latency.",planned:true,incident:true,severity:"High",duration:[85,135],tickets:[2,4],scenarios:[["people-feed","feed"],["peoplechock-sync","sync"],["people-term","sync"],["hr-hire-batch","feed"]]},
 {id:"site-network",kind:"Outage",title:"Campus Network Uplink Instability",summary:"Monitoring shows packet loss and name-resolution anomalies at one site. Reports may surface as conferencing, DNS, or general application failures.",planned:false,incident:true,severity:"Critical",duration:[50,100],tickets:[2,5],scenarios:[["webex","site"],["dns","dnsout"],["switch-auth","nac"],["outage","server"],["wifi-maintenance","uplink"]]},
 {id:"printer-rollout",kind:"Change",title:"Managed Printer Firmware Rollout",summary:"Endpoint & Field Services is rolling out printer firmware in phases. Some devices may restart or temporarily leave the queue.",planned:true,incident:true,severity:"Normal",duration:[70,120],tickets:[1,3],scenarios:[["printer","hardware"],["print-secure","expiry"],["printer-firmware","firmware"]]},
 {id:"license-renewal",kind:"Vendor",title:"Enterprise License Renewal Delay",summary:"A vendor entitlement renewal is running behind schedule. Some licensed products may report inactive or read-only status.",planned:false,incident:true,severity:"High",duration:[90,150],tickets:[1,3],scenarios:[["license-expiry","expired"],["license",null],["vendor-api","api"],["license-renewal-wave","entitlement"]]},
 {id:"auth-surge",kind:"Workload",title:"Monday Authentication Surge",summary:"High login volume and recent password changes are producing an elevated number of lockout, MFA, and cached-credential calls.",planned:true,incident:false,severity:"Normal",duration:[100,170],tickets:[2,5],scenarios:[["lock","stalephone"],["lock","typo"],["mfa","new"],["vpn","stale"],["auth-policy-change","cache"]]},
 {id:"exec-event",kind:"VIP Event",title:"Executive Leadership Meeting",summary:"Executive Office has a high-visibility meeting window. Conferencing, room resources, presentation endpoints, and urgent access requests may arrive at elevated priority.",planned:true,incident:false,severity:"High",duration:[90,150],tickets:[1,2],vip:true,scenarios:[["vip-conference","room"],["webex","weakwifi"],["room-calendar","policy"],["hardwareupgrade",null]]},
 {id:"sso-rollover",kind:"Change",title:"SSO Signing Certificate Rollover",summary:"Identity & Access is completing a scheduled SSO signing-certificate rollover. Applications with stale metadata may reject authentication.",planned:true,incident:true,severity:"Critical",duration:[55,100],tickets:[2,4],scenarios:[["sso-rollover","metadata"],["browsercert",null],["cert-chain","chain"]]},
 {id:"endpoint-patch",kind:"Change",title:"Managed Endpoint Patch Deployment",summary:"A broad endpoint patch deployment is underway. Endpoint Engineering is monitoring restart, driver, and post-patch application behavior.",planned:true,incident:false,severity:"Normal",duration:[130,210],tickets:[2,4],scenarios:[["driver-regression","regression"],["patch-restart","pending"],["hello-pin","container"],["dockfirmware",null]]}
];


const PERSONALITIES=[
 {id:"friendly",name:"Friendly & cooperative",prefix:"Thanks for helping. "},
 {id:"technical",name:"Technically knowledgeable",prefix:"For context, I already checked the obvious local settings. "},
 {id:"inexperienced",name:"Technically inexperienced",prefix:"Sorry, I'm not very good with computer stuff. "},
 {id:"impatient",name:"Impatient",prefix:"I really need this working soon. "},
 {id:"vague",name:"Extremely vague",prefix:"It just isn't working. "},
 {id:"detailed",name:"Overly detailed",prefix:"I wrote down everything I noticed in case it helps. "},
 {id:"frustrated",name:"Frustrated",prefix:"This has been fighting me all morning. "},
 {id:"nervous",name:"Nervous",prefix:"I'm worried I messed something up. "},
 {id:"confident",name:"Confident but incorrect",prefix:"I'm pretty sure this is a server problem. "},
 {id:"vip",name:"Executive / VIP",prefix:"I have a meeting shortly. "},
 {id:"everything",name:"Already tried everything",prefix:"I've already tried everything I can think of. "},
 {id:"tangent",name:"Introduces unrelated issues",prefix:"Also my second monitor flickered yesterday, but anyway—"},
 {id:"slow",name:"Slow responder",prefix:"Sorry if I disappear for a bit; I'm bouncing between meetings. "},
 {id:"nonresponsive",name:"Frequently stops responding",prefix:"I'm here right now, but I may get pulled away. "},
 {id:"terse",name:"Very terse",prefix:"Issue: "},
 {id:"chatty",name:"Chatty",prefix:"Hi! Hope your day is going okay. I have kind of a weird one. "}
];

const EMPLOYEE_TECH=[
 {id:"novice",label:"Novice",weight:2},
 {id:"basic",label:"Basic",weight:4},
 {id:"competent",label:"Competent",weight:5},
 {id:"power",label:"Power User",weight:2}
];
const EMPLOYEE_RESPONSE=[
 {id:"prompt",label:"Usually prompt",factor:.68},
 {id:"normal",label:"Normal responder",factor:1},
 {id:"meetings",label:"Meeting-heavy",factor:1.55},
 {id:"sporadic",label:"Sporadic responder",factor:2.15},
 {id:"glacial",label:"Glacial responder",factor:3.15}
];
const EMPLOYEE_SELFHELP=[
 {id:"passive",label:"Waits for IT"},
 {id:"cautious",label:"Cautious self-helper"},
 {id:"independent",label:"Independent troubleshooter"},
 {id:"tinkerer",label:"Tinkers aggressively"}
];
function weightedChoice(items,weightKey="weight"){
 const total=items.reduce((a,x)=>a+(x[weightKey]||1),0);let r=Math.random()*total;
 for(const x of items){r-=x[weightKey]||1;if(r<=0)return x}
 return items[items.length-1];
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function buildEmployeeDirectory(){
 const names=shuffle(NAMES),profiles=[];
 names.forEach((name,i)=>{
   const dept=DEPTS[i%DEPTS.length],tech=weightedChoice(EMPLOYEE_TECH),selfHelp=rand(EMPLOYEE_SELFHELP);
   let personality=rand(PERSONALITIES).id;
   if(tech.id==="power"&&Math.random()<.62)personality=rand(["technical","detailed","friendly"]);
   if(tech.id==="novice"&&Math.random()<.58)personality=rand(["inexperienced","vague","nervous","friendly"]);
   let response=rand(EMPLOYEE_RESPONSE);
   if(personality==="slow"||personality==="nonresponsive")response=rand(EMPLOYEE_RESPONSE.filter(x=>["sporadic","glacial","meetings"].includes(x.id)));
   profiles.push({
     id:`USR-${String(i+1).padStart(3,"0")}`,name,department:dept,role:"Staff",roleTitle:rand(["Analyst","Specialist","Coordinator","Technician","Program Staff","Administrative Staff"]),
     supervisorName:null,managerName:null,personality,techSkill:tech.id,responseStyle:response.id,selfHelp:selfHelp.id,
     infoStyle:chooseReliability(personality),patience:Math.round(38+Math.random()*57),satisfaction:60,trust:58,
     ticketAffinity:.65+Math.random()*1.4,lifetimeTickets:0,closureInteractions:0,goodResolutions:0,badClosures:0,reopens:0,
     complaintsAgainstAgent:0,profanityIncidents:0,selfHelpSuccess:0,selfHelpMistakes:0,lastRating:null,lastOutcome:null,lastCategory:null,lastTicketId:null,
     categoryCounts:{},ticketHistory:[],requestHistory:[],entitlements:[],knownSinceShift:null
   });
 });
 const exec=profiles.find(x=>x.department==="Executive Office")||profiles[0];
 DEPTS.forEach(dept=>{
   const group=profiles.filter(x=>x.department===dept);
   if(!group.length)return;
   const mgr=group[0],sup=group[1]||mgr;
   mgr.role="Manager";mgr.roleTitle=dept==="Executive Office"?"Executive Manager":"Manager";
   mgr.supervisorName=exec.name===mgr.name?(group[2]?.name||"Chief Administrative Officer"):exec.name;
   mgr.managerName=exec.name===mgr.name?"Chief Administrative Officer":exec.name;
   if(sup!==mgr){sup.role="Supervisor";sup.roleTitle="Supervisor";sup.supervisorName=mgr.name;sup.managerName=exec.name===mgr.name?mgr.managerName:exec.name}
   group.slice(2).forEach(e=>{e.supervisorName=sup.name;e.managerName=mgr.name});
 });
 return profiles;
}
function normalizeEmployee(e,i=0){
 const p={...e};
 p.id=p.id||`USR-L${String(i+1).padStart(3,"0")}`;p.name=p.name||`Employee ${i+1}`;p.department=p.department||rand(DEPTS);
 p.role=p.role||"Staff";p.roleTitle=p.roleTitle||p.role;p.personality=p.personality||rand(PERSONALITIES).id;
 p.techSkill=p.techSkill||weightedChoice(EMPLOYEE_TECH).id;p.responseStyle=p.responseStyle||rand(EMPLOYEE_RESPONSE).id;p.selfHelp=p.selfHelp||rand(EMPLOYEE_SELFHELP).id;
 p.infoStyle=p.infoStyle||chooseReliability(p.personality);p.patience=Number.isFinite(p.patience)?p.patience:65;p.satisfaction=Number.isFinite(p.satisfaction)?p.satisfaction:60;p.trust=Number.isFinite(p.trust)?p.trust:58;
 p.ticketAffinity=Number.isFinite(p.ticketAffinity)?p.ticketAffinity:1;p.lifetimeTickets=p.lifetimeTickets||0;p.closureInteractions=p.closureInteractions||0;p.goodResolutions=p.goodResolutions||0;
 p.badClosures=p.badClosures||0;p.reopens=p.reopens||0;p.complaintsAgainstAgent=p.complaintsAgainstAgent||0;p.profanityIncidents=p.profanityIncidents||0;p.selfHelpSuccess=p.selfHelpSuccess||0;p.selfHelpMistakes=p.selfHelpMistakes||0;
 p.categoryCounts=p.categoryCounts||{};p.ticketHistory=Array.isArray(p.ticketHistory)?p.ticketHistory:[];p.requestHistory=Array.isArray(p.requestHistory)?p.requestHistory:[];p.entitlements=Array.isArray(p.entitlements)?p.entitlements:[];p.accountDisabledByAgent=!!p.accountDisabledByAgent;p.accountDisabledTicketId=p.accountDisabledTicketId||null;p.lastRating=p.lastRating??null;p.lastOutcome=p.lastOutcome??null;p.lastCategory=p.lastCategory??null;p.lastTicketId=p.lastTicketId??null;
 return p;
}
function hydrateEmployeeForTicket(t,employees){
 if(!t)return null;
 const legacy=!t.userId;
 let e=t.userId?employees.find(x=>x.id===t.userId):null;
 if(!e)e=employees.find(x=>x.name===t.user);
 if(!e){
   e=normalizeEmployee({id:`USR-L${String(employees.length+1).padStart(3,"0")}`,name:t.user||"Legacy User",department:t.department||rand(DEPTS),personality:t.personality||rand(PERSONALITIES).id,supervisorName:t.supervisor,managerName:t.manager},employees.length);
   employees.push(e);
 }
 if(!e.supervisorName)e.supervisorName=t.supervisor||pickActorName([e.name]);
 if(!e.managerName)e.managerName=t.manager||pickActorName([e.name,e.supervisorName]);
 t.userId=e.id;t.user=t.user||e.name;t.department=t.department||e.department;t.supervisor=t.supervisor||e.supervisorName;t.manager=t.manager||e.managerName;
 if(legacy&&e.lifetimeTickets===0)e.lifetimeTickets=1;
 return e;
}
function employeeForTicket(t){return t?.userId?state.employees?.find(e=>e.id===t.userId):state.employees?.find(e=>e.name===t?.user)}
function relationshipTier(e){
 if(!e||!e.closureInteractions)return {id:"new",label:"New requester"};
 const score=(e.satisfaction+e.trust)/2;
 if(score>=82)return {id:"strong",label:"Strong rapport"};
 if(score>=62)return {id:"good",label:"Positive"};
 if(score>=42)return {id:"neutral",label:"Neutral"};
 if(score>=25)return {id:"wary",label:"Wary"};
 return {id:"strained",label:"Strained"};
}
function employeeTechLabel(e){return EMPLOYEE_TECH.find(x=>x.id===e?.techSkill)?.label||"Unknown"}
function employeeResponseLabel(e){return EMPLOYEE_RESPONSE.find(x=>x.id===e?.responseStyle)?.label||"Unknown"}
function employeeSelfHelpLabel(e){return EMPLOYEE_SELFHELP.find(x=>x.id===e?.selfHelp)?.label||"Unknown"}
function scenarioAffinityDepartments(sc){
 const c=(sc?.cat||"").toLowerCase(),txt=`${c} ${(sc?.subject||[]).join(" ").toLowerCase()}`;
 if(/peoplechock|hr |human resources/.test(txt))return ["Human Resources"];
 if(/dumbcare|clinical/.test(txt))return ["Clinical Services","Behavioral Health"];
 if(/granular|financial|finance|budget|invoice/.test(txt))return ["Finance","Accounting","Planning"];
 if(/policywreck|policy|records|legal/.test(txt))return ["Administration","Legal","Executive Office"];
 if(/assethound|asset|equipment|printer|facility/.test(txt))return ["Facilities","Operations","Public Works"];
 if(/illogicmanager|workflow/.test(txt))return ["Administration","Operations","Procurement"];
 if(/software purchase|procurement|vendor/.test(txt))return ["Procurement","Administration"];
 return [];
}
function chooseEmployeeForScenario(sc){
 if(!state.employees?.length)state.employees=buildEmployeeDirectory();
 const affinity=scenarioAffinityDepartments(sc);
 const activeIds=new Set(state.tickets.filter(t=>!t.resolved).map(t=>t.userId));
 const enabled=state.employees.filter(e=>!e.accountDisabledByAgent),pool=enabled.length?enabled:state.employees;
 const weighted=pool.map(e=>{
   let w=e.ticketAffinity||1;
   if(affinity.includes(e.department))w*=2.6;
   if(e.role==="Staff")w*=1.5;else if(e.role==="Supervisor")w*=.95;else if(e.role==="Manager")w*=.52;
   if(activeIds.has(e.id))w*=.16;
   if((e.categoryCounts?.[sc.cat]||0)>0)w*=1.25+Math.min(.8,(e.categoryCounts[sc.cat]||0)*.12);
   if(e.lifetimeTickets===0)w*=1.08;
   return {e,w};
 });
 const total=weighted.reduce((a,x)=>a+x.w,0);let r=Math.random()*total;
 for(const x of weighted){r-=x.w;if(r<=0)return x.e}
 return weighted[weighted.length-1].e;
}
function relationshipOpening(e,sc){
 if(!e||!e.closureInteractions)return "";
 const same=(e.ticketHistory||[]).find(h=>h.category===sc.cat);
 if(e.complaintsAgainstAgent>0&&e.satisfaction<35)return rand([
   "I'm opening another ticket. I'd like this conversation to stay professional this time. ",
   "It's me again. I'm hoping this interaction goes better than the last one. ",
   "Before we start, I'd prefer we keep this strictly professional. "
 ]);
 if(e.badClosures>=2)return rand([
   "Please don't close this one until I've actually confirmed it's fixed. ",
   "It's me again. Can we keep the ticket open until I tell you the problem is resolved? ",
   "One request up front: please wait for my confirmation before closing this ticket. "
 ]);
 if(e.satisfaction>=82)return rand([
   "Hi again — thanks for the help on my last ticket. ",
   "Back again. You were helpful last time, so hopefully this one is straightforward too. ",
   "Hello again! The last issue went well, so I'm coming back with another one. "
 ]);
 if(e.satisfaction<=38)return rand([
   "I'm back with another issue. I'm hoping this one goes better. ",
   "I have another problem. The last ticket was frustrating, so please bear with me. ",
   "Another ticket from me. I'm a little wary after the previous one. "
 ]);
 if(same)return rand([
   `It's ${sc.cat} again, unfortunately. `,
   "I seem to be back in familiar territory with another issue. ",
   "I had a somewhat similar ticket before, although this may be different. "
 ]);
 return rand(["Hi again. ","I'm back with another ticket. ","Another one for you. "]);
}
function relationshipReplyTail(t){
 const e=employeeForTicket(t);if(!e||!e.closureInteractions)return "";
 if(e.satisfaction>=84&&Math.random()<.18)return rand([" Thanks again for working through it."," I appreciate the help."," You've been good about explaining this stuff."]);
 if(e.satisfaction<=34&&Math.random()<.28)return rand([" And please don't close this until I confirm it."," I really don't want another premature closure."," I'm keeping an eye on this one."]);
 return "";
}
function employeeObservedNotes(e){
 if(!e)return [];
 const n=[];
 if(e.closureInteractions>=1)n.push(`Technical comfort: ${employeeTechLabel(e)}.`);
 if(e.closureInteractions>=2)n.push(`Response pattern: ${employeeResponseLabel(e)}.`);
 if(e.closureInteractions>=2)n.push(`Self-service tendency: ${employeeSelfHelpLabel(e)}.`);
 if(e.badClosures)n.push(`${e.badClosures} prior poor closure${e.badClosures===1?"":"s"} involving this requester.`);
 if(e.reopens)n.push(`${e.reopens} prior reopen${e.reopens===1?"":"s"}.`);
 if(e.complaintsAgainstAgent)n.push(`${e.complaintsAgainstAgent} conduct complaint${e.complaintsAgainstAgent===1?"":"s"} involving this requester.`);
 return n;
}


const KB=[
 {title:"Password Reset & Expiration",tags:"password account expired",text:"Verify identity, confirm whether the password is expired or merely locked, reset only when necessary, and never ask the user to disclose their existing password."},
 {title:"Account Lockout",tags:"locked account login",text:"Check account status and recent login attempts. Unlocking may be appropriate, but repeated lockouts can indicate stale credentials on another device or service."},
 {title:"MFA Enrollment / New Phone",tags:"mfa authenticator phone",text:"Confirm identity. Re-register the authentication method or issue a temporary approved method according to policy. Do not bypass MFA informally."},
 {title:"VPN Troubleshooting",tags:"vpn remote access credential",text:"Confirm internet connectivity, capture the exact VPN error, verify account status and client version, then clear stale credentials or escalate gateway/certificate issues."},
 {title:"Printer Mapping",tags:"printer print queue mapping",text:"Confirm printer name and scope, check queue status, then reconnect the approved shared printer. Hardware faults should go to the printer/facilities support path."},
 {title:"Browser / SSO Troubleshooting",tags:"browser cache sso login",text:"Test another browser or private session, verify correct URL, and clear site-specific cache/cookies only when evidence points to stale browser state."},
 {title:"Phishing Reporting",tags:"phishing suspicious email security",text:"Do not click links or open attachments. Preserve the message and headers, report through the security workflow, and reset credentials only if compromise is suspected or confirmed."},
 {title:"Shared Drive Access",tags:"shared drive permissions files",text:"Verify path, network/VPN status, and group membership. Access changes require authorization from the data owner; IT should not grant access based only on the requester's assertion."},
 {title:"Low Disk Space",tags:"disk space storage slow",text:"Check free space and identify large temporary or approved cleanup targets. Avoid deleting user files without authorization."},
 {title:"Conference Audio / Video",tags:"teams webex zoom audio webcam microphone",text:"Confirm the selected input/output device, browser/app permissions, mute state, and dock/headset connection before reinstalling software."},
 {title:"New Employee Setup",tags:"new hire onboarding account equipment",text:"Confirm approved onboarding request, start date, role, manager, hardware assignment, licensing, groups, and MFA. Missing approvals should be routed back to the request process."},
 {title:"Lost or Stolen Equipment",tags:"lost stolen laptop mobile security",text:"Treat as a security and asset-management event. Record asset details, last known location, and whether sensitive data may be present; notify the security/asset team promptly."},
 {title:"Data Deletion, Retention & Holds",tags:"delete deletion records retention legal hold privacy audit data",text:"Do not delete organizational records merely because a requester asks. Verify the data owner, the requester's authority, applicable retention rules, litigation/legal/privacy holds, audit requirements, and the approved deletion workflow. Manager approval does not override a hold or mandatory retention requirement."},
 {title:"Approval & Authority Matrix",tags:"approval manager supervisor authority request access delete export purchase",text:"Higher-risk requests such as data deletion, privileged access, large data exports, policy exceptions, purchases, and certain publishing actions normally require documented approval from the requester's Manager — generally one level above the immediate Supervisor — unless a designated data owner or specialized approval workflow applies. Verify approval in the workflow; do not rely only on the requester's statement."},
 {title:"Manager Approval Workflow",tags:"manager approval pending supervisor slow request workflow",text:"The immediate Supervisor may endorse a request but cannot substitute for required Manager approval unless policy explicitly allows it. Put the ticket in Waiting for Approval while the workflow is pending. Some managers respond quickly; others may take substantial time. Do not perform the protected action before approval is recorded."},
 {title:"Privacy, Legal & Records Escalation",tags:"privacy legal records deletion hold subpoena investigation preserve",text:"Escalate deletion requests when the material may be subject to a legal hold, investigation, privacy-rights workflow, regulated retention, official-record requirements, or uncertainty about lawful disposition. Preserve data while the question is being reviewed."},
 {title:"Audit Log Integrity",tags:"audit logs delete erase tamper security history",text:"Audit and security logs are records of system activity and should not be altered or deleted on an ordinary user request. Requests to remove evidence of activity, failed logins, administrative changes, or security events require Security/Records review and may be inappropriate regardless of managerial approval."},
 {title:"Business Application Ownership",tags:"Fomo IllogicManager PolicyWreck Granular PeopleChock DumbCare AssetHound application owner",text:"Fomo: Collaboration Applications. IllogicManager: Workflow Systems. PolicyWreck: Governance Systems. Granular: Data & Analytics. PeopleChock: HR Systems. DumbCare: Clinical Applications. AssetHound: IT Asset Management. Application-specific access, data corrections, publishing, or deletion may require the owning team's approval or escalation."},
 {title:"Approval Chains & Conflicting Authority",tags:"approval chain manager data owner application owner conflict supervisor authority",text:"Approval is role-specific. A Supervisor's endorsement does not substitute for a required Manager, Data Owner, Application Owner, Security, Privacy, Records, HR, Procurement, or Legal approval. When two authorities conflict, do not simply choose the answer the requester prefers; follow the controlling policy/owner and escalate unresolved authority conflicts."},
 {title:"Delegated Approvers",tags:"delegation acting manager approver out of office approval",text:"An approver may formally delegate approval authority to an acting approver. Verify the delegation in the workflow. An email saying 'Pat is covering for me' is not the same as a recorded delegation when the workflow requires one."},
 {title:"Approval Withdrawal",tags:"withdraw withdrawn revoke approval change mind",text:"Approvals can be withdrawn before execution when circumstances change. Re-check approval state before high-risk actions. If an approval is withdrawn after an action has already occurred, preserve the history and route the matter for review rather than hiding what happened."},
 {title:"Emergency Exceptions",tags:"emergency exception break glass urgent approval security duty manager",text:"Emergency approval paths exist only for defined continuity or safety situations. They are not a shortcut around ordinary approvals. Emergency exceptions are time-limited, auditable, and generally require an authorized Duty Manager and/or Security reviewer. Legal holds and mandatory records-retention requirements cannot be casually overridden by an emergency exception."},
 {title:"Minimum Necessary Approval",tags:"least privilege minimum necessary scope approval access export",text:"An approval applies only to the scope actually approved. If the requester asks for broader access, more data, a longer duration, or a different purpose, obtain approval for the new scope instead of stretching an earlier approval."}
];

const TOOLS=[
 ["ping","Ping Device","Reachability test"],
 ["account","Check Account Status","Lock / password state"],
 ["unlock","Unlock Account","Account action"],
 ["reset","Reset Password","Account action"],
 ["service","Check Service Status","Known incidents"],
 ["device","View Device Info","Asset / hardware"],
 ["restart","Restart Remote Computer","Remote action"],
 ["disk","Check Disk Space","Storage"],
 ["software","Installed Software","Versions / apps"],
 ["logins","Recent Login Attempts","Authentication"],
 ["network","Check Network Connection","Link / IP details"],
 ["asset","Search Asset Inventory","Assigned equipment"],
 ["approval","Check Approval Workflow","Manager / owner authorization"],
 ["directory","Check Org / Authority","Role / reporting chain"],
 ["retention","Check Retention / Hold","Deletion eligibility"],
 ["dataowner","Check Data Ownership","Business owner / steward"],
 ["related","Find Related Tickets","Queue correlation"]
];

const BAD_DIAGNOSTICS=[
 {id:"reset-first",label:"Ask them to reset their password before gathering more information",response:["Why would my password affect this?","I can do that, but is there a reason?","I'd rather not reset it unless we know that's related."],severity:"premature"},
 {id:"reboot-first",label:"Tell them to reboot immediately before capturing the error",response:["Okay... but then the error message will be gone.","Shouldn't I show you what it says first?","I can restart, but I was hoping we could figure out what failed."],severity:"premature"},
 {id:"reinstall-first",label:"Have them uninstall and reinstall the affected application immediately",response:["That's a pretty big step. Do we know the app is actually broken?","That will take a while. Is there anything simpler to check first?","I have settings in there I'd rather not blow away without a reason."],severity:"premature"},
 {id:"personal-account",label:"Ask them to try using a coworker's account instead",response:["I'm not signing in as somebody else.","That doesn't sound like something we're supposed to do.","I don't think sharing accounts is allowed."],severity:"security"},
 {id:"disable-security",label:"Ask them to disable endpoint protection temporarily",response:["I'm not comfortable turning security off.","Is IT really asking me to disable the security software?","That sounds risky. Is there another test?"],severity:"security"},
 {id:"ask-password",label:"Ask them to send you their password so you can test the problem",response:["No. I was told never to give anyone my password.","I'm not sending my password in a ticket.","Why would IT need my actual password?"],severity:"security"},
 {id:"delete-file",label:"Have them delete the affected file and recreate it from scratch",response:["I need that file. I'm not deleting it without knowing we have a safe copy.","That sounds destructive.","Can we diagnose this without deleting my work?"],severity:"destructive"},
 {id:"blame-user",label:"Tell them the issue is probably something they did",response:["That's not very helpful.","Can we troubleshoot it instead of guessing that I caused it?","I opened a ticket for help, not to be blamed."],severity:"conduct"},
 {id:"keep-retrying",label:"Tell them to keep retrying until it eventually works",response:["I've already been retrying. It still doesn't work.","How long am I supposed to keep doing that?","That doesn't really solve the problem."],severity:"poor"},
 {id:"clear-everything",label:"Tell them to clear all browser data, including saved passwords",response:["All of it? That seems excessive.","I'd rather not wipe everything unless we know the browser is the issue.","That would remove a lot of saved information."],severity:"destructive"},
 {id:"admin-by-default",label:"Give them local administrator access so they can troubleshoot it themselves",response:["I wasn't asking for administrator rights.","Is that really the normal fix?","That seems like a lot of access for this problem."],severity:"security"},
 {id:"close-and-reopen",label:"Close the ticket and ask them to open a new one if it happens again",response:["But it is happening right now.","Why would we close it before fixing it?","I'd rather keep this ticket open until the problem is handled."],severity:"poor"},
 {id:"flush-stack-first",label:"Reset the entire network stack before determining whether the problem is local or service-side",response:["Do we know the network stack is actually the problem?","That sounds like a lot to reset before checking the error.","Can we confirm what's failing first?"],severity:"premature"},
 {id:"rebuild-mail-first",label:"Remove and rebuild the mail profile before comparing desktop mail with webmail",response:["Shouldn't we see whether webmail works first?","I'd rather not rebuild my profile unless we know it's local.","That seems like a big first step."],severity:"premature"},
 {id:"reset-mfa-first",label:"Reset every MFA registration before verifying what authentication step is failing",response:["All of my MFA methods? Why?","Can we check which part is actually broken first?","I'd rather not reset all of that without a reason."],severity:"security"},
 {id:"revoke-all-first",label:"Revoke every active session before checking whether the unfamiliar sign-in is actually malicious",response:["Will that sign me out everywhere?","Do we know that sign-in isn't one of my devices?","Can we verify what happened before revoking everything?"],severity:"premature"},
 {id:"assume-outage",label:"Assume this is a known outage and tell them to wait without checking service status",response:["Is there actually an outage posted?","How long am I supposed to wait?","Can you check whether anyone else is having this problem?"],severity:"poor"},
 {id:"waiting-no-question",label:"Mark the ticket Waiting for User even though you have not asked them for anything",response:["What are you waiting for me to answer?","I don't see a question from you.","Do you need something from me?"],severity:"poor"},
 {id:"downgrade-priority",label:"Lower the ticket priority because the queue is busy rather than because the impact changed",response:["The impact hasn't changed. Why was the priority lowered?","This is still affecting my work.","Did something change about the issue?"],severity:"poor"},
 {id:"restart-shared-service",label:"Restart the affected service immediately without checking who else depends on it",response:["Is that going to interrupt other people?","Do we know a restart is safe right now?","Shouldn't we check the service impact first?"],severity:"risky"},
 {id:"uninstall-driver-first",label:"Uninstall the device driver before capturing the hardware error or current driver version",response:["Won't that remove the current configuration?","Should we capture the error first?","Can we check the driver version before uninstalling it?"],severity:"destructive"},
 {id:"disable-addins-global",label:"Disable every browser or mail add-in globally instead of isolating the affected add-in",response:["All of them? Some of those are required for my work.","Can we identify which add-in is causing it?","That seems broader than the problem."],severity:"destructive"},
 {id:"alternate-credentials",label:"Map the shared resource using another person's credentials as a workaround",response:["I'm not using someone else's credentials.","That sounds like account sharing.","Shouldn't my own access be fixed?"],severity:"security"},
 {id:"temp-local-account",label:"Create a temporary local account to work around the managed sign-in problem",response:["Would that bypass my normal company account?","Is a local account approved here?","I'd rather fix my actual sign-in."],severity:"security"},
 {id:"wipe-profile-first",label:"Delete the local application profile before checking whether it contains unsynced data",response:["Could that delete anything I haven't synced?","Can we check what's stored locally first?","I don't want to lose work just to test this."],severity:"destructive"},
 {id:"random-peripheral",label:"Swap random cables or peripherals without documenting the symptom or isolating the failing component",response:["Which part do you think is bad?","Are we just swapping things at random?","Can we narrow down what is actually failing?"],severity:"poor"},
 {id:"personal-device",label:"Tell them to use a personal device as the workaround for a managed-service problem",response:["I'm not supposed to use my personal device for this.","That doesn't fix the work computer.","Is that actually approved?"],severity:"security"},
 {id:"clock-bypass",label:"Change the system clock manually to try to bypass a certificate or authentication error",response:["Wouldn't changing the clock cause other problems?","That sounds like it could break authentication even more.","Can we fix the certificate or time source instead?"],severity:"risky"}
];

function S(o){return o}
const SCENARIOS=[
S({id:"wifi",cat:"Network / Wi-Fi",subject:["Laptop won't connect to Wi‑Fi","Wi‑Fi stopped working on my laptop"],open:["My laptop won't connect to Wi‑Fi.","I can see the wireless icon but I can't get online."],priority:"Normal",
 diagnostics:[["other","Ask whether other devices can connect"],["where","Ask whether they are onsite or remote"],["wifi","Ask them to verify Wi‑Fi is enabled"],["error","Request the exact error message"]],
 fixes:[["enable","Enable Wi‑Fi / disable airplane mode"],["forget","Forget and reconnect to the wireless network"],["reboot","Restart the laptop"],["esc-net","Escalate to Network Operations","escalate"]],
 causes:[
  {id:"disabled",label:"Wi‑Fi disabled",answers:{other:"My phone connects fine.",where:"I'm onsite.",wifi:"Oh. Wi‑Fi is turned off and airplane mode is on.",error:"It just says no networks available."},tools:{network:"Wireless adapter present; radio state: OFF.",ping:"Device unreachable over network."},correct:"enable"},
  {id:"cached",label:"Stale wireless credentials",answers:{other:"My phone connects fine.",where:"I'm onsite.",wifi:"Wi‑Fi is on.",error:"It says 'Can't connect to this network.'"},tools:{network:"Adapter enabled; repeated authentication failures to CORP-WIFI.",logins:"No account lockout detected."},correct:"forget"},
  {id:"ap",label:"Access point outage",answers:{other:"Nobody near me can connect either.",where:"Third floor, east wing.",wifi:"Wi‑Fi is definitely on.",error:"Everyone gets disconnected."},tools:{service:"Network monitoring shows the 3E access point cluster offline.",network:"No DHCP lease received."},correct:"esc-net",escalation:true}
 ]}),
S({id:"pwd",cat:"Password / Account",subject:["Password suddenly stopped working","I can't sign in"],open:["My password isn't working this morning.","Windows says my password has expired."],priority:"Normal",
 diagnostics:[["msg","Ask for the exact sign-in message"],["changed","Ask whether they recently changed their password"],["scope","Ask whether the password fails everywhere"]],
 fixes:[["resetpw","Reset the password"],["sync","Sign out and use the newest password everywhere"],["unlockfix","Unlock the account"],["esc-id","Escalate to Identity team","escalate"]],
 causes:[
  {id:"expired",label:"Expired password",answers:{msg:"It says 'Your password has expired and must be changed.'",changed:"No.",scope:"Email is still open, but new sign-ins fail."},tools:{account:"Password expired: YES. Account locked: NO.",logins:"Normal failed attempts after expiration."},correct:"resetpw"},
  {id:"stale",label:"Old password cached on a device",answers:{msg:"It says the username or password is incorrect.",changed:"Yes, I changed it yesterday.",scope:"My desktop works; phone and laptop don't."},tools:{account:"Account healthy. Password changed yesterday.",logins:"Failures from mobile and laptop using old credentials."},correct:"sync"}
 ]}),
S({id:"mfa",cat:"MFA",subject:["New phone — MFA won't work","Authenticator codes are gone"],open:["I got a new phone and now I can't approve sign-ins.","My authenticator app isn't showing my work account anymore."],priority:"Normal",
 diagnostics:[["newphone","Confirm whether the old phone is still available"],["method","Ask what MFA method they normally use"],["identity","Confirm they can complete identity verification"]],
 fixes:[["reregister","Re-register approved MFA methods"],["bypass","Temporarily bypass MFA","bad"],["esc-id","Escalate to Identity team","escalate"]],
 causes:[
  {id:"new",label:"MFA registration tied to old phone",answers:{newphone:"The old phone was traded in.",method:"Authenticator push.",identity:"Yes, I can verify my identity through the normal process."},tools:{account:"MFA registered to previous device. Account otherwise healthy."},correct:"reregister"},
  {id:"blocked",label:"MFA registration policy error",answers:{newphone:"I still have the old phone but enrollment fails.",method:"Authenticator push.",identity:"Yes."},tools:{account:"MFA enrollment blocked by policy error 53003.",service:"No general identity outage."},correct:"esc-id",escalation:true}
 ]}),
S({id:"lock",cat:"Locked Account",subject:["Account keeps locking","Locked out again"],open:["My account is locked again. This is the third time today.","I can log in for a few minutes and then I get locked out."],priority:"Normal",
 diagnostics:[["devices","Ask what other devices/apps use the account"],["changed","Ask whether the password changed recently"],["timing","Ask when the lockouts recur"]],
 fixes:[["unlockfix","Unlock the account"],["updatecreds","Update stale credentials on the old device"],["resetpw","Reset the password"]],
 causes:[
  {id:"stalephone",label:"Old password saved on phone",answers:{devices:"My phone still checks work mail.",changed:"Yes, password changed yesterday.",timing:"It seems to happen every few minutes."},tools:{logins:"Repeated failed authentication from user's mobile device.",account:"Account locked after repeated failures."},correct:"updatecreds"},
  {id:"typo",label:"Repeated mistyped password",answers:{devices:"Just this workstation.",changed:"No.",timing:"Only when I try signing in."},tools:{logins:"Failed interactive logins from assigned workstation only.",account:"Locked due to failed sign-in attempts."},correct:"unlockfix"}
 ]}),
S({id:"outlook",cat:"Email / Outlook",subject:["Outlook isn't receiving email","No new messages in Outlook"],open:["Outlook hasn't received anything since yesterday.","People say they emailed me, but I don't see new messages."],priority:"Normal",
 diagnostics:[["webmail","Ask whether new mail appears in webmail"],["offline","Ask whether Outlook shows Work Offline"],["quota","Ask about mailbox full warnings"],["folder","Ask which folder/mailbox they are viewing"]],
 fixes:[["online","Turn off Work Offline"],["quota","Clear/archive approved mailbox items"],["rule","Disable the misdirecting inbox rule"],["esc-mail","Escalate to Messaging","escalate"]],
 causes:[
  {id:"offline",label:"Outlook Work Offline enabled",answers:{webmail:"Yes, the messages are in webmail.",offline:"Wait—yes, it says Work Offline.",quota:"No warning.",folder:"My normal Inbox."},tools:{service:"Mail services operational.",network:"Network connection healthy."},correct:"online"},
  {id:"quota",label:"Mailbox quota exceeded",answers:{webmail:"Webmail says my mailbox is full.",offline:"No.",quota:"Yes, I ignored a warning yesterday.",folder:"Inbox."},tools:{account:"Mailbox usage: 99.9% of quota.",service:"Mail services operational."},correct:"quota"},
  {id:"rule",label:"Inbox rule moving mail",answers:{webmail:"Mail is missing from Inbox there too.",offline:"No.",quota:"No.",folder:"Inbox, but I found new mail in an old project folder."},tools:{account:"Mailbox rule changed yesterday; messages from internal senders routed to 'Project 2019'."},correct:"rule"}
 ]}),
S({id:"printer",cat:"Printer",subject:["Can't print to 4th floor copier","Printer says offline"],open:["The office printer is offline for me.","My job sits in the queue and never prints."],priority:"Normal",
 diagnostics:[["others","Ask whether coworkers can print"],["which","Confirm the exact printer name"],["queue","Ask whether jobs are stuck in the queue"]],
 fixes:[["remap","Remove and remap the approved printer"],["clearqueue","Clear the user's stuck print queue"],["esc-print","Refer to Printer / Facilities Support","escalate"]],
 causes:[
  {id:"mapping",label:"Stale printer mapping",answers:{others:"Everyone else can print.",which:"4F-COPIER-02.",queue:"It says Offline."},tools:{ping:"Printer responds in 7ms.",service:"Print server healthy."},correct:"remap"},
  {id:"hardware",label:"Printer hardware fault",answers:{others:"Nobody can print to it.",which:"4F-COPIER-02.",queue:"Everyone's jobs are stuck."},tools:{ping:"Printer reachable.",device:"Printer reports fuser hardware error."},correct:"esc-print",escalation:true}
 ]}),
S({id:"vpn",cat:"VPN",subject:["VPN won't connect from home","Remote VPN error"],open:["VPN won't connect. Internet is working.","I keep getting an authentication error in the VPN client."],priority:"High",
 diagnostics:[["internet","Confirm normal internet works"],["vpnerr","Request exact VPN error"],["recentpwd","Ask whether password changed recently"],["version","Ask which VPN client version is installed"]],
 fixes:[["vpnsync","Clear saved VPN credentials and sign in again"],["updatevpn","Update the VPN client"],["esc-net","Escalate to Network Operations","escalate"]],
 causes:[
  {id:"stale",label:"Stale cached VPN password",answers:{internet:"Yes, websites work.",vpnerr:"Authentication failed.",recentpwd:"I changed my password this morning.",version:"Current version."},tools:{account:"Account healthy.",logins:"VPN failures began immediately after password change."},correct:"vpnsync"},
  {id:"client",label:"Obsolete VPN client",answers:{internet:"Yes.",vpnerr:"Client version not supported.",recentpwd:"No.",version:"It's pretty old—5.1."},tools:{software:"VPN Client 5.1 installed; current approved version 6.4.",service:"VPN gateway healthy."},correct:"updatevpn"},
  {id:"gateway",label:"VPN gateway outage",answers:{internet:"Yes.",vpnerr:"Gateway unavailable.",recentpwd:"No.",version:"Current."},tools:{service:"Active incident: remote-access gateway degraded for multiple users."},correct:"esc-net",escalation:true}
 ]}),
S({id:"rdp",cat:"Remote Access",subject:["Can't remote into office PC","Remote desktop can't find my computer"],open:["Remote Desktop says it can't reach my office computer.","I need to get to a file on my office PC from home."],priority:"Normal",
 diagnostics:[["vpnq","Ask whether VPN is connected"],["power","Ask whether office PC is powered on"],["name","Confirm computer name"]],
 fixes:[["connectvpn","Connect to VPN first"],["wake","Request onsite power-on / approved wake process"],["esc-net","Escalate to Network Operations","escalate"]],
 causes:[
  {id:"novpn",label:"VPN not connected",answers:{vpnq:"No, I didn't know I needed it.",power:"I think so.",name:"PC-FIN-223."},tools:{ping:"Host unreachable from current network.",account:"Remote access entitlement valid."},correct:"connectvpn"},
  {id:"off",label:"Office computer powered off",answers:{vpnq:"VPN is connected.",power:"Actually, someone says the computer is off.",name:"PC-FIN-223."},tools:{ping:"Device unreachable.",device:"Last inventory check-in: yesterday 5:13 PM."},correct:"wake"}
 ]}),
S({id:"install",cat:"Software Installation",subject:["Need software installed","Can you install this app?"],open:["I need Visio installed for a project.","Can someone install the PDF editor from this website?"],priority:"Normal",
 diagnostics:[["business","Ask for business need / approved software name"],["approval","Ask whether licensing/manager approval exists"],["deviceq","Confirm managed device"]],
 fixes:[["installapproved","Install approved licensed software"],["denyweb","Decline unapproved download and route approval"],["esc-app","Escalate to Application Packaging","escalate"]],
 causes:[
  {id:"approved",label:"Approved software, license available",answers:{business:"It's for process diagrams; Visio is the approved tool.",approval:"Yes, the license request was approved.",deviceq:"County laptop."},tools:{software:"Visio not installed.",asset:"Managed device; software deployment healthy."},correct:"installapproved"},
  {id:"unapproved",label:"Unapproved third-party download",answers:{business:"I found a free converter site.",approval:"No approval yet.",deviceq:"County laptop."},tools:{software:"Requested app not in approved catalog."},correct:"denyweb"}
 ]}),
S({id:"crash",cat:"Application",subject:["Application crashes on launch","Case system closes immediately"],open:["The application closes as soon as I open it.","It worked yesterday and now it crashes every time."],priority:"High",
 diagnostics:[["allusers","Ask whether coworkers have the same problem"],["errorcode","Request error text / event"],["update","Ask whether anything updated recently"]],
 fixes:[["repaircache","Clear the application's local cache/profile"],["rollback","Escalate recent application update","escalate"],["reinstall","Reinstall the application"]],
 causes:[
  {id:"profile",label:"Corrupt local profile cache",answers:{allusers:"Just me.",errorcode:"Profile initialization failed.",update:"Nothing I know of."},tools:{software:"Application version current.",device:"Local app cache reports corruption flag."},correct:"repaircache"},
  {id:"badupdate",label:"Bad enterprise application update",answers:{allusers:"Several people nearby have it.",errorcode:"Module mismatch after update.",update:"It updated this morning."},tools:{service:"Multiple crash reports after version 12.8 deployment.",software:"Version 12.8 installed."},correct:"rollback",escalation:true}
 ]}),
S({id:"browser",cat:"Browser / SSO",subject:["Website keeps signing me out","SSO login loop"],open:["The portal just keeps sending me back to sign in.","I log in successfully and then I'm back at the login page."],priority:"Normal",
 diagnostics:[["otherbrowser","Ask them to test another browser/private window"],["url","Confirm the exact URL"],["cookies","Ask whether browser data was recently restricted"]],
 fixes:[["sitecache","Clear site-specific cookies/cache"],["correcturl","Use the approved portal URL"],["esc-web","Escalate to Web Applications","escalate"]],
 causes:[
  {id:"cookie",label:"Corrupt SSO cookie",answers:{otherbrowser:"It works in a private window.",url:"The normal portal URL.",cookies:"I changed privacy settings yesterday."},tools:{service:"SSO services healthy."},correct:"sitecache"},
  {id:"oldurl",label:"Old bookmarked legacy URL",answers:{otherbrowser:"Same thing.",url:"I'm using an old bookmark with /legacy/login.",cookies:"No."},tools:{service:"Legacy login endpoint redirects to new SSO."},correct:"correcturl"}
 ]}),
S({id:"fileaccess",cat:"File Access / Permissions",subject:["Access denied to department folder","Need access to a restricted file"],open:["I get Access Denied on the budget folder.","Can you give me access to the director's shared folder?"],priority:"Normal",
 diagnostics:[["path","Confirm the exact path"],["owner","Ask who owns/approves access"],["prior","Ask whether they previously had access"]],
 fixes:[["restoregroup","Restore known missing authorized group membership"],["routeapproval","Route access request to data owner approval"],["grantnow","Grant access immediately","bad"]],
 causes:[
  {id:"group",label:"Accidental loss of existing authorized group membership",answers:{path:"\\\\files\\finance\\budget",owner:"Finance director.",prior:"Yes, I used it yesterday."},tools:{account:"User missing FIN-BUDGET group after overnight sync.",logins:"No security anomalies."},correct:"restoregroup"},
  {id:"new",label:"New access requires owner authorization",answers:{path:"\\\\files\\executive\\restricted",owner:"Executive Office.",prior:"No, but I think I should have it."},tools:{account:"No prior entitlement found."},correct:"routeapproval"}
 ]}),
S({id:"shareddrive",cat:"Shared Drives",subject:["Shared drive disappeared","Mapped drive missing"],open:["My S: drive is gone.","The shared drive disappeared after I came back from leave."],priority:"Normal",
 diagnostics:[["vpnq","Ask if they are remote and connected to VPN"],["path","Ask which share they need"],["coworkers","Ask whether coworkers can access it"]],
 fixes:[["reconnectdrive","Reconnect the approved mapped drive"],["connectvpn","Connect VPN first"],["esc-file","Escalate to File Services","escalate"]],
 causes:[
  {id:"mapping",label:"Drive mapping lost",answers:{vpnq:"I'm onsite.",path:"\\\\files\\dept.",coworkers:"Yes."},tools:{ping:"File server reachable.",account:"User has correct group membership."},correct:"reconnectdrive"},
  {id:"remote",label:"Remote user not on VPN",answers:{vpnq:"I'm at home and VPN is not connected.",path:"\\\\files\\dept.",coworkers:"They're onsite and can."},tools:{network:"Public internet only; no corporate tunnel."},correct:"connectvpn"}
 ]}),
S({id:"battery",cat:"Hardware",subject:["Laptop battery dies quickly","Laptop only works on charger"],open:["My laptop battery lasts about 20 minutes now.","If I unplug the charger the laptop turns off."],priority:"Normal",
 diagnostics:[["age","Ask age of laptop / battery"],["health","Ask whether battery warnings appear"],["charger","Ask whether charging is normal"]],
 fixes:[["replacebattery","Refer for battery replacement","escalate"],["settings","Reduce brightness and enable battery saver"],["reimage","Reimage the laptop","bad"]],
 causes:[
  {id:"failed",label:"Battery health failure",answers:{age:"About four years old.",health:"Windows says battery service recommended.",charger:"It reaches 100%."},tools:{device:"Battery health: 18%; full charge capacity severely degraded.",asset:"Device under hardware lifecycle support."},correct:"replacebattery",escalation:true},
  {id:"drain",label:"High background power usage",answers:{age:"One year.",health:"No warnings.",charger:"Yes."},tools:{device:"Battery health: 94%.",software:"Video rendering process consuming sustained CPU/GPU."},correct:"settings"}
 ]}),
S({id:"monitor",cat:"Display",subject:["Second monitor says No Signal","External display not detected"],open:["My second monitor says No Signal.","The monitor is on but Windows doesn't see it."],priority:"Normal",
 diagnostics:[["cable","Ask them to check cable/dock connection"],["input","Ask whether monitor input source is correct"],["othermon","Ask whether another monitor/cable works"]],
 fixes:[["inputfix","Select the correct monitor input"],["reseat","Reseat/replace display cable"],["dockfix","Power-cycle the dock"],["esc-hw","Refer for hardware replacement","escalate"]],
 causes:[
  {id:"input",label:"Wrong input selected",answers:{cable:"Cable is connected.",input:"It says HDMI 2, but the cable is in HDMI 1.",othermon:"I haven't tried."},tools:{device:"Dock detects external display handshake intermittently."},correct:"inputfix"},
  {id:"cable",label:"Loose display cable",answers:{cable:"The cable was barely inserted.",input:"Correct input.",othermon:"It works if I hold the cable."},tools:{device:"Display repeatedly connects/disconnects."},correct:"reseat"}
 ]}),
S({id:"keyboard",cat:"Keyboard / Mouse",subject:["Keyboard stopped working through dock","Mouse works but keyboard doesn't"],open:["My keyboard stopped working after I docked.","The mouse works but the USB keyboard doesn't."],priority:"Low",
 diagnostics:[["direct","Ask them to connect keyboard directly"],["ports","Ask whether other USB ports work"],["restartdock","Ask whether dock was recently power-cycled"]],
 fixes:[["dockfix","Power-cycle the dock"],["replacekb","Replace the keyboard"],["reinstall","Reinstall Windows","bad"]],
 causes:[
  {id:"dock",label:"Dock USB controller stuck",answers:{direct:"It works directly in the laptop.",ports:"The dock's other USB ports are weird too.",restartdock:"No."},tools:{device:"Dock USB controller not responding; display/network functions normal."},correct:"dockfix"},
  {id:"keyboard",label:"Failed keyboard",answers:{direct:"Still dead.",ports:"Mouse works in every port.",restartdock:"Yes."},tools:{device:"USB ports healthy; keyboard does not enumerate."},correct:"replacekb"}
 ]}),
S({id:"audio",cat:"Audio / Conferencing",subject:["Nobody can hear me in Teams","Microphone stopped working"],open:["Nobody can hear me in meetings.","Teams shows my microphone moving but they hear nothing."],priority:"High",
 diagnostics:[["selectedmic","Ask which microphone is selected"],["mute","Check hardware/app mute"],["otherapp","Ask whether mic works in another app"]],
 fixes:[["selectmic","Select the correct microphone device"],["unmute","Unmute the headset / application"],["esc-av","Escalate to AV Support","escalate"]],
 causes:[
  {id:"wrong",label:"Wrong input device selected",answers:{selectedmic:"It says 'Monitor Microphone'.",mute:"Not muted.",otherapp:"The laptop recorder works."},tools:{device:"USB headset detected and healthy."},correct:"selectmic"},
  {id:"mute",label:"Hardware mute enabled",answers:{selectedmic:"My USB headset.",mute:"Oh, the headset mute light is red.",otherapp:"No app records audio."},tools:{device:"Headset detected; hardware mute state reported."},correct:"unmute"}
 ]}),
S({id:"webcam",cat:"Webcam",subject:["Camera is black in Webex","Webcam unavailable"],open:["My camera is just black in Webex.","The camera light doesn't come on."],priority:"Normal",
 diagnostics:[["privacy","Ask whether camera privacy shutter is open"],["otherapp","Ask whether camera works elsewhere"],["perm","Ask about camera permission prompt"]],
 fixes:[["shutter","Open the physical privacy shutter"],["permissions","Enable approved camera permission"],["esc-hw","Refer for hardware replacement","escalate"]],
 causes:[
  {id:"shutter",label:"Privacy shutter closed",answers:{privacy:"There is a little slider... it's closed.",otherapp:"Black there too.",perm:"No prompt."},tools:{device:"Integrated camera detected; lens image unavailable."},correct:"shutter"},
  {id:"perm",label:"OS camera permission disabled",answers:{privacy:"Open.",otherapp:"The Camera app says access is blocked.",perm:"I may have clicked Don't Allow."},tools:{device:"Camera hardware healthy; privacy permission disabled for desktop apps."},correct:"permissions"}
 ]}),
S({id:"slow",cat:"Performance",subject:["Computer is painfully slow","Everything freezes for minutes"],open:["My computer is incredibly slow today.","Every application takes forever to open."],priority:"Normal",
 diagnostics:[["when","Ask when slowness started"],["rebootq","Ask when the computer last restarted"],["scope","Ask whether only one app is slow"]],
 fixes:[["restart","Restart the computer"],["killproc","Close the runaway approved process"],["replacehw","Refer for hardware evaluation","escalate"]],
 causes:[
  {id:"uptime",label:"Very long uptime / pending update",answers:{when:"Gradually worse this week.",rebootq:"About 46 days ago.",scope:"Everything."},tools:{device:"Uptime: 46 days; pending OS servicing.",software:"No malware indicators."},correct:"restart"},
  {id:"process",label:"Runaway background process",answers:{when:"This morning.",rebootq:"Yesterday.",scope:"Everything."},tools:{device:"CPU 99%; memory 82%.",software:"PDF indexing process consuming 88% CPU."},correct:"killproc"}
 ]}),
S({id:"disk",cat:"Disk Space",subject:["C: drive is full","Can't save files — disk full"],open:["Windows says I'm out of disk space.","I can't download or save anything because C: is full."],priority:"Normal",
 diagnostics:[["large","Ask whether they store large local files"],["downloads","Ask about Downloads / temp files"],["onedrive","Ask whether files should be cloud-only"]],
 fixes:[["cleanup","Run approved cleanup / remove temporary files"],["deleteuser","Delete old user files without asking","bad"],["esc-storage","Escalate for storage expansion","escalate"]],
 causes:[
  {id:"temp",label:"Temporary files consuming space",answers:{large:"Not intentionally.",downloads:"I do have years of installers in Downloads.",onedrive:"Most documents are synced."},tools:{disk:"C: 0.8 GB free; 38 GB temporary/cache files; 21 GB Downloads."},correct:"cleanup"},
  {id:"profile",label:"Legitimate dataset exceeds device capacity",answers:{large:"Yes, approved project data is about 350 GB.",downloads:"Not much.",onedrive:"It can't be cloud-only for this application."},tools:{disk:"C: 2 GB free; approved project dataset 352 GB."},correct:"esc-storage",escalation:true}
 ]}),
S({id:"mobile",cat:"Mobile Device",subject:["Work email stopped syncing on phone","Phone keeps asking for password"],open:["My work email stopped updating on my phone.","My phone asks for my password over and over."],priority:"Normal",
 diagnostics:[["recentpwd","Ask whether password changed"],["deviceowned","Confirm managed/personal device policy"],["webmail","Ask whether webmail works"]],
 fixes:[["updatecreds","Update the saved account credentials"],["reenroll","Re-enroll the managed mail profile"],["esc-mob","Escalate to Mobile Support","escalate"]],
 causes:[
  {id:"stale",label:"Old password saved on phone",answers:{recentpwd:"Yes, yesterday.",deviceowned:"It's my approved phone.",webmail:"Webmail works."},tools:{logins:"Repeated mobile authentication failures using old password."},correct:"updatecreds"},
  {id:"profile",label:"Managed profile expired/corrupt",answers:{recentpwd:"No.",deviceowned:"County-managed phone.",webmail:"Webmail works."},tools:{device:"Mobile management profile reports enrollment token expired."},correct:"reenroll"}
 ]}),
S({id:"phish",cat:"Security / Phishing",subject:["I clicked a suspicious link","Possible phishing email"],open:["I clicked a link in an email and the page looked weird.","I entered my username into a page and then realized the email might be fake."],priority:"Critical",
 diagnostics:[["clicked","Ask exactly what was clicked/entered"],["sender","Ask about sender and message context"],["mfaevent","Ask whether any unexpected MFA prompts occurred"]],
 fixes:[["secureacct","Follow credential-compromise procedure and security escalation","escalate"],["deleteonly","Just delete the email","bad"],["ignore","Tell user not to worry","bad"]],
 causes:[
  {id:"creds",label:"Credentials entered into phishing site",answers:{clicked:"I entered my username and password.",sender:"It looked like a storage quota warning.",mfaevent:"Yes, I denied two prompts afterward."},tools:{logins:"Unusual login attempt from foreign IP after reported click.",account:"Account currently active."},correct:"secureacct",escalation:true},
  {id:"click",label:"Clicked but no credentials entered",answers:{clicked:"I clicked but closed it immediately; entered nothing.",sender:"Unknown sender.",mfaevent:"No."},tools:{logins:"No unusual sign-ins detected."},correct:"secureacct",escalation:true}
 ]}),
S({id:"susmail",cat:"Security / Suspicious Email",subject:["Is this email real?","Weird invoice attachment"],open:["I got an invoice attachment from someone I don't recognize.","This message says my mailbox will be deleted unless I click today."],priority:"High",
 diagnostics:[["sender","Ask whether the sender is expected"],["opened","Ask whether the attachment/link was opened"],["headers","Request reporting through the approved phishing process"]],
 fixes:[["reportphish","Report/preserve message for Security","escalate"],["openattach","Open the attachment to inspect it","bad"],["replysender","Reply asking whether they're legitimate","bad"]],
 causes:[
  {id:"malicious",label:"Likely phishing message",answers:{sender:"No idea who they are.",opened:"No, I haven't opened it.",headers:"I can use the Report Phishing button."},tools:{service:"Security bulletin notes current invoice-phishing campaign."},correct:"reportphish",escalation:true}
 ]}),
S({id:"lost",cat:"Lost Equipment",subject:["Laptop missing after travel","I can't find my work laptop"],open:["I think I left my work laptop in a rideshare.","My laptop is missing after my trip."],priority:"Critical",
 diagnostics:[["last","Ask last known location/time"],["assetq","Confirm asset tag/device"],["dataq","Ask whether sensitive data may be present"]],
 fixes:[["lostproc","Start lost/stolen equipment security process","escalate"],["waitday","Tell user to wait a day before reporting","bad"],["wipeown","Attempt an unapproved remote wipe","bad"]],
 causes:[
  {id:"lost",label:"Potentially lost managed laptop",answers:{last:"Rideshare around 9 PM last night.",assetq:"LT-44821.",dataq:"Yes, I use it for case-related work."},tools:{asset:"LT-44821 assigned to user; last check-in yesterday 9:12 PM.",device:"Device encrypted; current location unavailable."},correct:"lostproc",escalation:true}
 ]}),
S({id:"newhire",cat:"New Employee Setup",subject:["New employee starts Monday","Need laptop/account for new hire"],open:["Our new analyst starts Monday and needs everything.","Can you set up a laptop and accounts for our new employee?"],priority:"High",
 diagnostics:[["approval","Confirm approved onboarding request"],["role","Ask role/department/start date"],["gear","Ask required equipment/software"]],
 fixes:[["onboard","Complete approved standard onboarding"],["routeapproval","Return for missing onboarding approval"],["grantadmin","Give local admin by default","bad"]],
 causes:[
  {id:"ready",label:"Approved onboarding ready",answers:{approval:"Yes, onboarding ticket is approved.",role:"Analyst, Finance, Monday.",gear:"Standard laptop, Office, VPN."},tools:{asset:"One standard laptop reserved.",account:"Pre-stage account authorized."},correct:"onboard"},
  {id:"noapproval",label:"No formal onboarding approval",answers:{approval:"I just emailed you; there isn't another request.",role:"Contractor starting tomorrow.",gear:"Laptop and access to everything the team uses."},tools:{account:"No approved onboarding workflow found."},correct:"routeapproval"}
 ]}),
S({id:"departure",cat:"Departing Employee",subject:["Employee leaves today","Disable access for departing employee"],open:["An employee is leaving today. Please shut off access.","Can you keep their account active for a few weeks in case we need files?"],priority:"High",
 diagnostics:[["term","Confirm authorized termination request/time"],["owner","Ask who will own files/mail"],["exceptions","Ask whether approved exceptions exist"]],
 fixes:[["offboard","Follow approved offboarding schedule"],["leaveactive","Leave account active informally","bad"],["routeapproval","Route exception request for approval"]],
 causes:[
  {id:"normal",label:"Standard approved departure",answers:{term:"Approved termination at 5 PM today.",owner:"Manager will receive approved file transfer.",exceptions:"None."},tools:{account:"Offboarding event approved for 17:00."},correct:"offboard"},
  {id:"exception",label:"Manager requesting unapproved access extension",answers:{term:"They leave today, but I want the account open.",owner:"I'll need their files.",exceptions:"No written exception."},tools:{account:"Standard disable action scheduled; no exception authorization."},correct:"routeapproval"}
 ]}),
S({id:"license",cat:"Software Licensing",subject:["App says no license available","Need one more software seat"],open:["The software says all licenses are in use.","Can you just give me a license from someone else?"],priority:"Normal",
 diagnostics:[["who","Ask who needs license and business need"],["pool","Check license availability"],["owner","Ask whether reallocation is approved"]],
 fixes:[["assignlicense","Assign available approved license"],["routelicense","Refer capacity/reallocation request to licensing owner","escalate"],["steal","Remove another user's license without approval","bad"]],
 causes:[
  {id:"available",label:"Unused license available",answers:{who:"I need it for an approved design project.",pool:"Please check.",owner:"My request was approved."},tools:{software:"License pool: 2 seats available."},correct:"assignlicense"},
  {id:"full",label:"License pool exhausted",answers:{who:"Approved need.",pool:"It says zero available.",owner:"No reallocation approved."},tools:{software:"License pool: 0 available; all seats assigned."},correct:"routelicense",escalation:true}
 ]}),
S({id:"outage",cat:"Service Outage",subject:["Entire department can't access production app","Production system unavailable"],open:["Nobody in our department can get into the production system.","We all get a service unavailable page."],priority:"Critical",
 diagnostics:[["impact","Confirm scope and number of affected users"],["start","Ask when it started"],["networkq","Ask whether other network services work"]],
 fixes:[["incident","Escalate/associate to major incident","escalate"],["rebootall","Tell everyone to reboot","bad"],["resetall","Reset every user's password","bad"]],
 causes:[
  {id:"server",label:"Production service outage",answers:{impact:"About 60 people across two teams.",start:"Around 8:10 AM.",networkq:"Everything else works."},tools:{service:"Active alert: production application health checks failing.",ping:"Application server host reachable; service port unavailable."},correct:"incident",escalation:true}
 ]}),
S({id:"caps",cat:"User Error",subject:["Password works on phone but not PC","Desktop rejects correct password"],open:["I KNOW my password is right. The computer says it's wrong.","My password works on my phone but not this keyboard."],priority:"Normal",
 diagnostics:[["capsq","Ask whether Caps Lock / keyboard layout is active"],["scope","Ask where password works"],["keyboardq","Ask whether typed characters look normal"]],
 fixes:[["capsoff","Turn off Caps Lock / correct keyboard layout"],["resetpw","Reset the password"],["esc-id","Escalate to Identity","escalate"]],
 causes:[
  {id:"caps",label:"Caps Lock enabled",answers:{capsq:"The Caps Lock light is on.",scope:"My phone works.",keyboardq:"Actually everything is uppercase."},tools:{account:"Account healthy; no lockout.",logins:"A few failed interactive logins only."},correct:"capsoff"}
 ]}),
S({id:"dns",cat:"Network",subject:["One website won't open by name","Site works by IP but not hostname"],open:["The internal site won't open, but somebody gave me an IP that works.","Only one internal website says it can't be found."],priority:"High",
 diagnostics:[["others","Ask whether coworkers have same issue"],["vpnq","Ask whether VPN/network connection is active"],["name","Confirm hostname"]],
 fixes:[["flushdns","Refresh local DNS cache / reconnect"],["esc-net","Escalate DNS issue to Network Operations","escalate"],["reinstall","Reinstall browser","bad"]],
 causes:[
  {id:"localdns",label:"Stale local DNS cache",answers:{others:"Coworkers are fine.",vpnq:"I'm onsite.",name:"portal.internal."},tools:{network:"DNS cache contains retired address; resolver returns current address.",ping:"Hostname resolves to stale IP locally."},correct:"flushdns"},
  {id:"dnsout",label:"Internal DNS issue",answers:{others:"Several people have the same problem.",vpnq:"Yes.",name:"portal.internal."},tools:{service:"DNS resolver monitoring shows elevated failures.",network:"Multiple resolver timeouts."},correct:"esc-net",escalation:true}
 ]}),
S({id:"onedrive",cat:"File Sync",subject:["Files aren't syncing","Cloud folder has red X marks"],open:["My synced files all have red X icons.","A document I updated isn't appearing on my other computer."],priority:"Normal",
 diagnostics:[["signin","Ask whether sync client is signed in"],["storage","Ask whether cloud storage quota warnings appear"],["error","Request sync error"]],
 fixes:[["signinfix","Sign back into sync client"],["quota","Resolve approved cloud quota issue"],["esc-file","Escalate sync corruption to File Services","escalate"]],
 causes:[
  {id:"signedout",label:"Sync client signed out",answers:{signin:"It says Sign In.",storage:"No quota warning.",error:"Sync paused — sign in required."},tools:{software:"Sync client installed and current; session expired."},correct:"signinfix"},
  {id:"quota",label:"Cloud quota full",answers:{signin:"Signed in.",storage:"Yes, storage is 100% full.",error:"Upload blocked — storage full."},tools:{account:"Cloud storage quota: 100% utilized."},correct:"quota"}
 ]}),
S({id:"bsod",cat:"Hardware / OS",subject:["Laptop blue screens repeatedly","Computer crashes with stop code"],open:["My laptop has blue-screened three times today.","It restarts with a WHEA error."],priority:"High",
 diagnostics:[["code","Request stop code"],["changes","Ask about recent hardware/driver changes"],["frequency","Ask frequency and whether data is saved"]],
 fixes:[["driver","Roll back the recently updated approved driver"],["esc-hw","Refer for hardware diagnostics/replacement","escalate"],["ignore","Tell user blue screens are normal","bad"]],
 causes:[
  {id:"driver",label:"Bad driver update",answers:{code:"DRIVER_IRQL_NOT_LESS_OR_EQUAL.",changes:"Graphics driver updated this morning.",frequency:"Three times."},tools:{software:"Graphics driver updated today; known issue in release notes.",device:"Hardware self-test passed."},correct:"driver"},
  {id:"hardware",label:"Hardware fault",answers:{code:"WHEA_UNCORRECTABLE_ERROR.",changes:"No changes.",frequency:"Increasing over the last week."},tools:{device:"Hardware diagnostics report memory ECC / board fault."},correct:"esc-hw",escalation:true}
 ]}),
S({id:"room",cat:"Conference Room",subject:["Conference room display won't show laptop","Meeting room screen is blank"],open:["The conference room screen is blank and our meeting starts soon.","Laptop is connected but the room display says no source."],priority:"High",
 diagnostics:[["roominput","Ask which room input/source is selected"],["cable","Ask whether the room cable is fully connected"],["roompc","Ask whether room PC works"]],
 fixes:[["inputfix","Select the correct room input"],["reseat","Reconnect the presentation cable"],["esc-av","Escalate to AV Support","escalate"]],
 causes:[
  {id:"input",label:"Wrong room source",answers:{roominput:"It says Room PC, but we're using HDMI Guest.",cable:"Connected.",roompc:"Room PC works."},tools:{device:"Room controller online; HDMI Guest detects signal."},correct:"inputfix"},
  {id:"avfault",label:"AV switcher fault",answers:{roominput:"Correct input.",cable:"Tried two cables.",roompc:"Room PC is also blank."},tools:{device:"AV switcher reports controller fault."},correct:"esc-av",escalation:true}
 ]}),
S({id:"webex",cat:"Conferencing",subject:["Webex speaker sounds robotic","Meeting audio breaks up"],open:["Everyone sounds robotic in Webex.","Calls are choppy, but email and websites seem fine."],priority:"Normal",
 diagnostics:[["connection","Ask whether on Wi‑Fi or wired"],["others","Ask whether others nearby have issue"],["speed","Ask whether issue changes off VPN / on wired network"]],
 fixes:[["wired","Move to stable wired connection / stronger Wi‑Fi"],["esc-net","Escalate packet-loss issue to Network","escalate"],["reinstall","Reinstall Webex immediately","bad"]],
 causes:[
  {id:"weakwifi",label:"Weak Wi‑Fi / packet loss",answers:{connection:"Wi‑Fi, two rooms from the access point.",others:"People closer to it are fine.",speed:"Wired is much better."},tools:{network:"Wi‑Fi signal -79 dBm; packet loss 14%.",ping:"High jitter; intermittent loss."},correct:"wired"},
  {id:"site",label:"Local network degradation",answers:{connection:"Wired.",others:"Several people on this floor hear the same thing.",speed:"Same on multiple devices."},tools:{network:"Site uplink packet loss 9%.",service:"Network monitoring shows floor switch uplink errors."},correct:"esc-net",escalation:true}
 ]}),
S({id:"scanner",cat:"Peripheral",subject:["Scanner stopped sending PDFs","Multifunction copier scans but email never arrives"],open:["The copier scans my pages but no email arrives.","Scan-to-email says Sent, but nothing shows up."],priority:"Normal",
 diagnostics:[["others","Ask whether scan-to-email fails for others"],["address","Confirm destination address"],["mailq","Ask whether normal email works"]],
 fixes:[["addressfix","Correct the mistyped destination address"],["esc-print","Refer copier mail relay issue","escalate"],["resetpw","Reset user's password","bad"]],
 causes:[
  {id:"typo",label:"Destination address typo",answers:{others:"Coworkers receive scans.",address:"Oh—I typed .con instead of .com.",mailq:"Normal email works."},tools:{device:"Copier healthy; recent scan job accepted with invalid recipient domain."},correct:"addressfix"},
  {id:"relay",label:"Copier SMTP relay fault",answers:{others:"Nobody gets scanned emails.",address:"Addresses are correct.",mailq:"Normal email is fine."},tools:{device:"Copier scan jobs queued; SMTP relay authentication failing.",service:"Corporate email service healthy."},correct:"esc-print",escalation:true}
 ]}),
S({id:"cert",cat:"Security / Certificates",subject:["Internal app says certificate expired","Browser warns connection is not private"],open:["Our internal app suddenly says the certificate expired.","The browser shows a red certificate warning for the production site."],priority:"Critical",
 diagnostics:[["scope","Ask whether multiple users see it"],["site","Confirm exact site"],["timeq","Ask whether device clock is correct"]],
 fixes:[["clockfix","Correct local system date/time"],["esc-cert","Escalate production certificate issue","escalate"],["bypasscert","Tell user to bypass the certificate warning","bad"]],
 causes:[
  {id:"clock",label:"Local clock incorrect",answers:{scope:"Only me.",site:"The normal production URL.",timeq:"My laptop says it's January 2031."},tools:{device:"System clock differs from directory time by +4.4 years."},correct:"clockfix"},
  {id:"expired",label:"Production certificate actually expired",answers:{scope:"Everyone sees it.",site:"The normal production URL.",timeq:"Clock is correct."},tools:{service:"TLS certificate expired at 00:00 today; monitoring alert active."},correct:"esc-cert",escalation:true}
 ]}),
S({id:"bitlocker",cat:"Security / Recovery",subject:["Laptop asking for recovery key","BitLocker recovery screen"],open:["My laptop booted to a recovery key screen.","I can't get past a blue screen asking for a 48-digit key."],priority:"High",
 diagnostics:[["assetq","Confirm device asset / identity"],["change","Ask whether BIOS/firmware changed"],["keyid","Request recovery key ID, not the secret key"]],
 fixes:[["approvedkey","Use approved identity-verified recovery process"],["esc-hw","Escalate if recovery data unavailable","escalate"],["sharekey","Ask user to post the recovery key in chat","bad"]],
 causes:[
  {id:"normal",label:"Recovery triggered after firmware change",answers:{assetq:"LT-21018, assigned to me.",change:"It updated firmware last night.",keyid:"I can read the key ID."},tools:{asset:"LT-21018 assigned to user; encryption escrow present.",device:"Firmware update completed before recovery trigger."},correct:"approvedkey"},
  {id:"missing",label:"Recovery material missing / device mismatch",answers:{assetq:"The sticker says LT-99911, but that's not what inventory shows.",change:"Unknown.",keyid:"I have the key ID."},tools:{asset:"Asset tag not assigned to current user; recovery record not found."},correct:"esc-hw",escalation:true}
 ]}),
S({id:"mouse",cat:"Peripheral",subject:["Mouse moves by itself","Cursor drifting across screen"],open:["My cursor keeps moving by itself.","The mouse drifts even when I don't touch it."],priority:"Low",
 diagnostics:[["touch","Ask whether touchscreen/touchpad is active"],["othermouse","Ask whether disconnecting mouse changes it"],["clean","Ask about touchpad surface / external devices"]],
 fixes:[["touchpad","Disable/clean the stuck touchpad input"],["replacekb","Replace faulty pointing device"],["malware","Declare malware without evidence","bad"]],
 causes:[
  {id:"touchpad",label:"Object resting on touchpad",answers:{touch:"Yes, touchpad is on.",othermouse:"It still moves with the mouse unplugged.",clean:"...there is a stack of sticky notes resting on the touchpad."},tools:{device:"Touchpad generating continuous pointer input."},correct:"touchpad"},
  {id:"badmouse",label:"Failed pointing device",answers:{touch:"Touchpad disabled.",othermouse:"Drift stops when I unplug the mouse.",clean:"Sensor is clean."},tools:{device:"USB mouse reports erratic HID movement."},correct:"replacekb"}
 ]}),
S({id:"emailrule",cat:"Email",subject:["My boss's emails disappeared","Emails from one person vanish"],open:["I can't find any email from my manager anymore.","Everyone else's mail arrives except messages from one person."],priority:"High",
 diagnostics:[["search","Ask whether search finds the messages"],["junk","Ask them to check Junk/Deleted folders"],["rules","Ask whether rules were recently created"]],
 fixes:[["rule","Disable/correct the inbox rule"],["unblock","Remove accidental sender block"],["esc-mail","Escalate to Messaging","escalate"]],
 causes:[
  {id:"rule",label:"Bad inbox rule",answers:{search:"Search finds them in Archive.",junk:"Not in Junk.",rules:"I made a cleanup rule last week."},tools:{account:"Inbox rule routes manager@example to Archive."},correct:"rule"},
  {id:"block",label:"Sender accidentally blocked",answers:{search:"No.",junk:"They're all in Junk.",rules:"No rules."},tools:{account:"Sender appears on user's blocked senders list."},correct:"unblock"}
 ]}),
S({id:"usb",cat:"Hardware / Security",subject:["USB drive not recognized","Need files from a flash drive"],open:["My flash drive doesn't show up on this computer.","Windows says removable storage is blocked."],priority:"Normal",
 diagnostics:[["purpose","Ask business purpose / source of drive"],["otherpc","Ask whether drive works elsewhere"],["policy","Ask what exact message appears"]],
 fixes:[["approvedusb","Use approved encrypted removable-media process"],["routeapproval","Route exception / data-transfer request"],["disablepolicy","Disable endpoint security policy","bad"]],
 causes:[
  {id:"policy",label:"Endpoint policy blocks unapproved removable media",answers:{purpose:"A vendor handed me project files.",otherpc:"It works on my personal laptop.",policy:"Use of removable storage is blocked by your organization."},tools:{device:"USB port healthy; endpoint policy denies unapproved mass storage."},correct:"routeapproval"},
  {id:"approved",label:"Approved encrypted drive not mounted",answers:{purpose:"It's an approved encrypted department drive.",otherpc:"It works on another managed PC.",policy:"Drive detected but not mounted."},tools:{device:"Approved encrypted USB device detected; mount service stopped."},correct:"approvedusb"}
 ]}),
S({id:"ghostprint",cat:"Printer",subject:["Printer keeps printing old pages","Mystery print jobs won't stop"],open:["The printer keeps spitting out the same old report.","Every few minutes, another copy of yesterday's document prints."],priority:"Normal",
 diagnostics:[["who","Ask whether jobs show an owner"],["queue","Ask whether the queue contains stuck jobs"],["scope","Ask whether it is one printer or many"]],
 fixes:[["clearqueue","Clear the identified stuck print job"],["esc-print","Refer recurring server-side queue corruption","escalate"],["poweroff","Unplug printer indefinitely","bad"]],
 causes:[
  {id:"stuck",label:"Retrying stuck print job",answers:{who:"They all show my username.",queue:"There are 17 copies queued.",scope:"Just this printer."},tools:{service:"Print server healthy; one user's job marked retrying.",device:"Printer hardware normal."},correct:"clearqueue"},
  {id:"serverq",label:"Corrupt shared print queue",answers:{who:"Different users.",queue:"Jobs reappear after deletion.",scope:"Two printers on the same print server."},tools:{service:"Print spooler queue database error on server.",device:"Printers healthy."},correct:"esc-print",escalation:true}
 ]}),
S({id:"maildelay",cat:"Email",subject:["Email arrives 20 minutes late","Messages delayed"],open:["My email arrives way later than everyone else's.","Messages show up 15–20 minutes after they were sent."],priority:"High",
 diagnostics:[["scope","Ask whether delay affects all senders"],["webmail","Compare Outlook and webmail timing"],["networkq","Ask whether connection drops"]],
 fixes:[["profilefix","Rebuild/repair local Outlook profile sync"],["incident","Escalate messaging transport delay","escalate"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"profile",label:"Local Outlook sync delay",answers:{scope:"All senders.",webmail:"Webmail gets them immediately.",networkq:"Connection seems fine."},tools:{service:"Mail transport healthy.",software:"Outlook sync interval/error state abnormal."},correct:"profilefix"},
  {id:"transport",label:"Mail transport delay",answers:{scope:"Multiple people report delays.",webmail:"Delayed there too.",networkq:"Network is fine."},tools:{service:"Mail queue backlog above threshold; incident under investigation."},correct:"incident",escalation:true}
 ]}),
S({id:"wrongdevice",cat:"Asset / Hardware",subject:["Laptop performance doesn't match my request","I think I got the wrong laptop"],open:["This replacement laptop is much slower than the one I turned in.","I requested the engineering model but this looks like the standard model."],priority:"Normal",
 diagnostics:[["assetq","Confirm asset tag/model"],["requestq","Ask for approved equipment request"],["need","Ask required workload"]],
 fixes:[["swapasset","Refer approved hardware mismatch for swap","escalate"],["closefine","Tell user all laptops are the same","bad"],["upgradeown","Install unsupported hardware personally","bad"]],
 causes:[
  {id:"mismatch",label:"Incorrect asset assigned",answers:{assetq:"LT-77002, standard model.",requestq:"The approved request says engineering workstation.",need:"CAD and large models."},tools:{asset:"LT-77002 is standard fleet model; ticket authorization specifies ENG-PRO class."},correct:"swapasset",escalation:true}
 ]}),
S({id:"vendor",cat:"Vendor / SaaS",subject:["Hosted vendor portal failing","External system says service unavailable"],open:["The vendor portal says Service Unavailable.","Our internet works and other sites are fine."],priority:"High",
 diagnostics:[["scope","Ask whether multiple users are affected"],["statuspage","Check vendor/service status"],["error","Request exact error"]],
 fixes:[["vendorwait","Associate ticket with vendor incident / wait for vendor","escalate"],["localreinstall","Reinstall all browsers","bad"],["incident","Escalate internally if no vendor incident","escalate"]],
 causes:[
  {id:"vendor",label:"Vendor SaaS outage",answers:{scope:"Everyone who uses it is down.",statuspage:"Please check.",error:"503 Service Unavailable."},tools:{service:"Vendor status: Major outage; investigation underway."},correct:"vendorwait",escalation:true}
 ]}),
S({id:"wrongmailbox",cat:"Email / User Error",subject:["My sent mail disappeared","Can't find emails I sent"],open:["None of the emails I sent today are in Sent Items.","I know I sent them, but my Sent folder is empty."],priority:"Normal",
 diagnostics:[["mailbox","Ask which mailbox/account is selected"],["search","Ask whether search finds the sent messages"],["delegate","Ask whether they sent from a shared mailbox"]],
 fixes:[["correctbox","Open the correct mailbox Sent Items"],["profilefix","Repair Outlook profile"],["esc-mail","Escalate to Messaging","escalate"]],
 causes:[
  {id:"shared",label:"Looking in personal mailbox instead of shared mailbox",answers:{mailbox:"I'm looking at my personal Sent Items.",search:"Search finds them under Finance Shared.",delegate:"Yes, I sent from Finance Shared."},tools:{account:"Send-as permission active for Finance Shared."},correct:"correctbox"}
 ]}),
S({id:"power",cat:"Hardware / User Error",subject:["Computer won't turn on","Desktop is completely dead"],open:["My computer is dead. Nothing happens when I press power.","No lights, no fan, nothing."],priority:"High",
 diagnostics:[["powercable","Ask whether power cable/power strip is connected"],["otheroutlet","Ask whether monitor/other devices have power"],["recent","Ask whether desk was moved/cleaned"]],
 fixes:[["plugpower","Reconnect power strip/cable"],["esc-hw","Refer dead power supply for hardware service","escalate"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"strip",label:"Power strip switched off",answers:{powercable:"The PC is plugged into a power strip.",otheroutlet:"Monitor is off too.",recent:"Facilities cleaned under the desk last night."},tools:{device:"Device last seen online yesterday at 17:22; no remote response."},correct:"plugpower"},
  {id:"psu",label:"Failed power supply",answers:{powercable:"Everything is firmly connected and outlet works.",otheroutlet:"Monitor powers on from same strip.",recent:"No changes."},tools:{device:"No power / no inventory contact; prior hardware event indicated PSU voltage fault."},correct:"esc-hw",escalation:true}
 ]}),
S({id:"remoteuser",cat:"Remote Support",subject:["Computer doesn't work","Please fix ASAP"],open:["Computer doesn't work.","Please fix ASAP."],priority:"Normal",
 diagnostics:[["define","Ask what happens when they try to use it"],["powercable","Ask whether device powers on"],["error","Request any message shown"],["where","Ask where they are working"]],
 fixes:[["connectvpn","Connect to VPN first"],["plugpower","Connect laptop charger"],["esc-hw","Escalate hardware failure","escalate"]],
 causes:[
  {id:"battery",label:"Laptop battery empty",answers:{define:"The screen is black.",powercable:"Actually the charging light is off.",error:"Nothing shows.",where:"At home."},tools:{device:"Last battery telemetry: 2% before device went offline."},correct:"plugpower"},
  {id:"vpn",label:"User means shared drive unavailable because VPN is off",answers:{define:"The S: drive is missing. The computer itself is fine.",powercable:"Yes, it's on.",error:"Network path not found.",where:"At home."},tools:{network:"No corporate VPN tunnel detected."},correct:"connectvpn"}
 ]}),
S({id:"deletehold",cat:"Data Governance / Deletion",subject:["Please delete these emails before Legal sees them","Need old correspondence permanently removed"],open:["Can you permanently delete a folder of emails for me? It's better if nobody can find them later.","I need some old messages wiped out before an upcoming records review."],priority:"High",dataGovernance:true,
 diagnostics:[["whydelete","Ask why the data must be deleted"],["authorityq","Ask what authority they have to request deletion"],["holdq","Ask whether any records/legal hold applies"],["approvalq","Ask whether deletion approval is documented"]],
 fixes:[["esc-records","Preserve the data and escalate to Legal / Records","escalate"],["delete-now","Permanently delete the messages","bad"],["emptytrash","Empty Deleted Items and recoverable items","bad"]],
 causes:[
  {id:"hold",label:"Deletion request conflicts with an active records hold",answers:{whydelete:"There's a review coming up and those messages would just create questions.",authorityq:"I'm the person who sent most of them.",holdq:"I think Legal sent something about preserving records last week.",approvalq:"My supervisor said it would be easier if they were gone."},tools:{retention:"ACTIVE HOLD: Preserve mailbox and related messages. Deletion prohibited pending Records/Legal release.",directory:"Requester is an Analyst. Immediate supervisor endorsement does not authorize records destruction.",dataowner:"Mailbox content is subject to organizational records ownership and Records Office controls."},correct:"esc-records",escalation:true}
 ]}),
S({id:"deletetest",cat:"Data Governance / Deletion",subject:["Delete duplicate test records from Granular","Cleanup request: purge test dataset"],open:["We loaded duplicate test records into Granular. Can IT purge them?","I need the test import from yesterday deleted from Granular before the next refresh."],priority:"Normal",dataGovernance:true,
 diagnostics:[["scope","Ask for exact dataset and record scope"],["whydelete","Ask why deletion is required"],["authorityq","Ask whether requester is the data owner"],["approvalq","Ask whether Manager approval is documented"]],
 fixes:[["purgetest","Run the approved test-data purge"],["requestapproval","Request required Manager approval"],["delete-all","Delete the entire Granular dataset","bad"],["esc-data","Escalate unclear data-scope request to Data & Analytics","escalate"]],
 causes:[
  {id:"valid",label:"Valid test-data cleanup requiring documented Manager approval",approvalRequired:true,answers:{scope:"Dataset QA_IMPORT_26, batch 8841 only.",whydelete:"It was a duplicate test load and has been validated as non-production.",authorityq:"I'm the QA data steward for this dataset."},tools:{retention:"QA batch 8841 is classified as disposable test data; no hold is present.",dataowner:"Requester is listed as QA data steward. Granular production owner: Data & Analytics."},correct:"purgetest"}
 ]}),
S({id:"deleteaudit",cat:"Security / Data Integrity",subject:["Can you erase my failed login history?","Please clear these audit log entries"],open:["Can you delete the failed logins from the audit history? They're making my report look bad.","I made a configuration mistake. Please remove those audit entries so it looks clean."],priority:"High",dataGovernance:true,
 diagnostics:[["whydelete","Ask why audit records should be removed"],["authorityq","Ask who authorized changing audit history"],["holdq","Ask whether the activity is under review"]],
 fixes:[["esc-sec","Refuse alteration and escalate to Security / Audit","escalate"],["delete-now","Delete the audit entries","bad"],["editlog","Edit the log text to make the events look normal","bad"]],
 causes:[
  {id:"tamper",label:"Improper request to alter system audit history",answers:{whydelete:"I don't want management asking why there were so many failures.",authorityq:"Nobody specifically. I administer the team, though.",holdq:"Not that I know of."},tools:{retention:"Audit logs are protected records and not eligible for ordinary user-directed deletion.",directory:"Requester manages business operations but has no Security Audit authority.",dataowner:"Security Operations owns the audit-log retention process."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"deletemailbox",cat:"Records / Offboarding",subject:["Delete former employee mailbox today","Can we wipe this departed user's email?"],open:["This employee left yesterday. Please delete the mailbox so we stop paying for it.","Can you permanently remove a former employee's email account and contents today?"],priority:"Normal",dataGovernance:true,
 diagnostics:[["term","Confirm departure date and approved offboarding request"],["owner","Ask who is responsible for retained mail"],["holdq","Check retention / hold requirements"],["approvalq","Ask what deletion approval exists"]],
 fixes:[["esc-records","Route mailbox disposition to Records / Messaging","escalate"],["delete-now","Delete mailbox immediately","bad"],["offboard","Disable access while preserving data under offboarding policy"]],
 causes:[
  {id:"retain",label:"Mailbox must be disabled but retained pending disposition",answers:{term:"They left yesterday and offboarding is approved.",owner:"Their manager needs access to some project messages.",holdq:"I don't know the retention period.",approvalq:"Their supervisor told me to clean it up."},tools:{retention:"Mailbox retention period active. Disable access; preserve content until authorized disposition date.",dataowner:"Messaging/Records controls final mailbox disposition."},correct:"offboard"}
 ]}),
S({id:"privacydelete",cat:"Privacy Request",subject:["Approved privacy deletion request","Need account data removed under privacy workflow"],open:["Privacy sent us a request to delete an individual's eligible account data.","I have a privacy case that requires deletion of data after verification."],priority:"High",dataGovernance:true,
 diagnostics:[["caseid","Ask for the approved privacy case ID"],["scope","Confirm exact systems and data in scope"],["holdq","Check for retention exceptions or legal hold"],["approvalq","Confirm Manager / Privacy approval is recorded"]],
 fixes:[["privacydelete","Perform the approved scoped privacy deletion"],["requestapproval","Request required Manager approval"],["delete-all","Delete every record matching the person's name","bad"],["esc-privacy","Escalate conflicting retention requirements to Privacy","escalate"]],
 causes:[
  {id:"approved",label:"Legitimate scoped privacy deletion after required approval",approvalRequired:true,answers:{caseid:"PRV-26881.",scope:"Fomo profile data and a specific Granular export cache only.",holdq:"Privacy says retained financial records are excluded."},tools:{retention:"PRV-26881: eligible Fomo profile/cache data may be deleted; financial and audit records excluded.",dataowner:"Privacy Office is the disposition authority for this case."},correct:"privacydelete"}
 ]}),
S({id:"fomo-notify",cat:"Fomo",subject:["Fomo stopped sending notifications","Fomo alerts are hours late"],open:["Fomo isn't sending me any notifications.","My Fomo notifications started arriving hours late."],priority:"Normal",
 diagnostics:[["scope","Ask whether other Fomo users are affected"],["channel","Ask which notification channel is affected"],["settingsq","Ask whether notification preferences changed"],["error","Request any Fomo warning or banner"]],
 fixes:[["fomosettings","Restore Fomo notification preferences"],["incident","Escalate Fomo notification service incident","escalate"],["reinstall","Reinstall the browser","bad"]],
 causes:[
  {id:"prefs",label:"User disabled Fomo notifications accidentally",answers:{scope:"Coworkers still get theirs.",channel:"Email and desktop alerts.",settingsq:"Oh. The Fomo setting says 'Mute all until Monday.'",error:"No error."},tools:{service:"Fomo service healthy.",software:"Fomo client current."},correct:"fomosettings"},
  {id:"queue",label:"Fomo notification queue degradation",answers:{scope:"A bunch of us are delayed.",channel:"All channels.",settingsq:"Settings look normal.",error:"No error, just late messages."},tools:{service:"Fomo notification queue latency is elevated; vendor incident open."},correct:"incident",escalation:true}
 ]}),
S({id:"fomo-access",cat:"Fomo / Access Request",subject:["Need access to private Fomo workspace","Add me to the executive Fomo space"],open:["Can you add me to the private Leadership workspace in Fomo?","I need access to a restricted Fomo channel for a project."],priority:"Normal",
 diagnostics:[["business","Ask for the business reason"],["owner","Ask who owns the workspace"],["approvalq","Ask whether Manager approval is documented"]],
 fixes:[["grantfomo","Grant approved Fomo workspace access"],["requestapproval","Request required Manager approval"],["grantnow","Add the requester immediately without approval","bad"]],
 causes:[
  {id:"approval",label:"Legitimate access request requiring Manager approval",approvalRequired:true,answers:{business:"I'm covering the quarterly executive report.",owner:"Executive Office owns it."},tools:{dataowner:"Fomo workspace owner: Executive Office. Manager approval required for non-members."},correct:"grantfomo"}
 ]}),
S({id:"illogic",cat:"IllogicManager",subject:["IllogicManager workflow won't advance","Approval flow stuck in IllogicManager"],open:["My IllogicManager request has been stuck at the same step since yesterday.","The workflow says 'Waiting for Rule Evaluation' forever."],priority:"High",
 diagnostics:[["scope","Ask whether other workflows are stuck"],["workflow","Ask for workflow ID and current stage"],["changes","Ask whether rules were edited recently"],["approvalq","Ask whether the business approver completed their step"]],
 fixes:[["publishrule","Publish the draft workflow rule"],["incident","Escalate IllogicManager engine outage","escalate"],["cancelworkflow","Cancel and recreate the entire request","bad"]],
 causes:[
  {id:"draft",label:"Workflow rule was edited but left in Draft",answers:{scope:"Only this workflow type.",workflow:"WF-88218, Rule Evaluation.",changes:"The process owner changed a condition yesterday.",approvalq:"The approver already completed their step."},tools:{service:"IllogicManager engine healthy.",software:"Rule set PAY-EXCEPTION-v9 is in DRAFT; v8 remains active."},correct:"publishrule"},
  {id:"engine",label:"IllogicManager rule engine outage",answers:{scope:"Several departments are stuck.",workflow:"Multiple IDs show Rule Evaluation.",changes:"No planned changes.",approvalq:"Approvals are complete."},tools:{service:"IllogicManager rule-evaluation service unavailable; incident IM-441 open."},correct:"incident",escalation:true}
 ]}),
S({id:"policywreck",cat:"PolicyWreck",subject:["Can't publish policy revision","PolicyWreck Publish button is disabled"],open:["PolicyWreck won't let me publish the revised policy.","The Publish button is greyed out even though the document is ready."],priority:"Normal",
 diagnostics:[["statusq","Ask current document status"],["roleq","Ask the requester's role in the policy workflow"],["approvalq","Ask whether Manager approval is recorded"],["owner","Ask who owns the policy"]],
 fixes:[["publish","Publish the approved policy revision"],["requestapproval","Request required Manager approval"],["changerole","Give requester Policy Administrator rights","bad"],["esc-gov","Escalate locked policy to Governance Systems","escalate"]],
 causes:[
  {id:"approval",label:"Policy is ready but Manager approval is still required",approvalRequired:true,answers:{statusq:"Final Draft.",roleq:"I'm the policy coordinator.",owner:"Operations owns the policy."},tools:{dataowner:"Policy owner: Operations. Publish requires documented Manager approval.",retention:"No legal hold. Prior policy versions must remain in version history."},correct:"publish"},
  {id:"lock",label:"Policy is locked by active governance review",answers:{statusq:"Governance Review.",roleq:"Policy coordinator.",approvalq:"Manager already approved the draft.",owner:"Operations."},tools:{service:"PolicyWreck document lock active for Governance review.",dataowner:"Governance Systems owns publication lock."},correct:"esc-gov",escalation:true}
 ]}),
S({id:"granular-report",cat:"Granular",subject:["Granular report is missing half my rows","Dashboard totals don't match"],open:["Granular says we have 412 cases, but I know there should be more.","My Granular dashboard is suddenly missing an entire region."],priority:"High",
 diagnostics:[["scope","Ask which dashboard/dataset is affected"],["others","Ask whether coworkers see the same totals"],["filters","Ask which filters are applied"],["refreshq","Ask when the dataset last refreshed"]],
 fixes:[["clearfilter","Correct the saved Granular filter"],["incident","Escalate failed dataset refresh","escalate"],["exportall","Export the whole warehouse to Excel to compare","bad"]],
 causes:[
  {id:"filter",label:"Saved row filter excludes one region",answers:{scope:"Operations Overview.",others:"My coworker sees 613 cases.",filters:"Oh, Region is set to North only.",refreshq:"This morning."},tools:{service:"Granular healthy; dataset refresh completed.",account:"User has normal row-level permissions."},correct:"clearfilter"},
  {id:"refresh",label:"Granular dataset refresh failed",answers:{scope:"Operations Overview.",others:"Everyone sees the old totals.",filters:"No restrictive filters.",refreshq:"It says last refresh yesterday at 2 AM."},tools:{service:"Granular ETL refresh failed overnight; Data & Analytics incident open."},correct:"incident",escalation:true}
 ]}),
S({id:"granular-export",cat:"Granular / Data Request",subject:["Export all employee-level data from Granular","Need a full Granular dataset download"],open:["Can you give me an export of every employee-level record in Granular?","I need the full detailed Granular dataset, not the summary dashboard."],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask why row-level data is needed"],["scope","Ask what fields and date range are required"],["authorityq","Ask what data-access role the requester has"],["approvalq","Ask whether Manager approval is documented"]],
 fixes:[["exportapproved","Provide the approved minimum-necessary export"],["requestapproval","Request required Manager approval"],["exportall","Export every available field immediately","bad"],["esc-data","Escalate sensitive-data scope question to Data & Analytics","escalate"]],
 causes:[
  {id:"valid",label:"Legitimate data export requiring Manager approval and minimum scope",approvalRequired:true,answers:{business:"Quarterly staffing analysis.",scope:"Employee ID, unit, status, and start date for this fiscal year.",authorityq:"I'm an approved workforce analyst."},tools:{dataowner:"Granular workforce dataset owner: Data & Analytics. Requester has analyst access but export requires Manager approval.",retention:"No hold blocks the approved export; minimum-necessary fields should be used."},correct:"exportapproved"},
  {id:"overreach",label:"Requester lacks authority for sensitive full-dataset export",answers:{business:"I just want to see what is in there.",scope:"Everything. All columns, all years.",authorityq:"I can view one dashboard, so I assumed that means I can have the data.",approvalq:"No."},tools:{directory:"Requester is not in an authorized data-analysis role.",dataowner:"Full Granular dataset export requires Data Owner and Manager approval."},correct:"esc-data",escalation:true}
 ]}),
S({id:"peoplechock-sync",cat:"PeopleChock",subject:["New employee missing from PeopleChock","PeopleChock has the wrong supervisor"],open:["Our new employee isn't showing up in PeopleChock.","PeopleChock still shows my old supervisor."],priority:"Normal",
 diagnostics:[["personid","Ask for employee ID and effective date"],["sourceq","Ask whether HR source record is correct"],["timing","Ask when the change became effective"]],
 fixes:[["resync","Re-run approved PeopleChock directory sync"],["esc-hr","Escalate incorrect HR source record to HR Systems","escalate"],["editdirect","Directly edit the HR master record","bad"]],
 causes:[
  {id:"sync",label:"PeopleChock downstream sync missed an otherwise-correct HR record",answers:{personid:"Employee 48119, started today.",sourceq:"HR says their source record is correct.",timing:"Effective this morning."},tools:{service:"PeopleChock sync missed employee 48119; source HR record valid."},correct:"resync"},
  {id:"source",label:"Incorrect supervisor in HR source system",answers:{personid:"Employee 31802.",sourceq:"HR source also shows the old supervisor.",timing:"Change was supposed to be effective Monday."},tools:{service:"PeopleChock reflects source exactly.",directory:"Supervisor value originates in HR master data."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"peoplechock-edit",cat:"PeopleChock / HR Data",subject:["Change my coworker's title in PeopleChock","Please fix someone else's HR record"],open:["Can you change my coworker's job title in PeopleChock? It's wrong.","I need you to update another employee's supervisor field for me."],priority:"Normal",dataGovernance:true,
 diagnostics:[["authorityq","Ask what HR-data authority the requester has"],["sourceq","Ask whether HR approved the underlying personnel change"],["approvalq","Ask for the authorized HR case/request"]],
 fixes:[["esc-hr","Refer personnel-data correction to HR Systems","escalate"],["editdirect","Edit the employee record directly","bad"],["grantnow","Give requester HR edit rights","bad"]],
 causes:[
  {id:"noauthority",label:"Requester has no authority to modify another employee's HR master data",answers:{authorityq:"I'm on their team.",sourceq:"I don't know; their title just looks wrong.",approvalq:"There isn't an HR case."},tools:{directory:"Requester has standard employee access only; no HR data-maintainer role.",dataowner:"PeopleChock personnel master data owner: Human Resources."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"dumbcare-note",cat:"DumbCare / Clinical Data",subject:["Delete the clinical note I entered on the wrong client","Need DumbCare note erased"],open:["I entered a note on the wrong client in DumbCare. Please delete it completely.","Can IT erase a DumbCare note? I picked the wrong chart."],priority:"Critical",dataGovernance:true,
 diagnostics:[["noteid","Ask for note ID and what error occurred"],["authorityq","Ask the requester's role"],["policyq","Ask whether the correction/amendment workflow was attempted"],["holdq","Check record-retention requirements"]],
 fixes:[["esc-clin","Preserve the record and escalate to Clinical Applications / Privacy","escalate"],["delete-now","Permanently delete the note from the database","bad"],["editdb","Directly alter the database row","bad"]],
 causes:[
  {id:"wrongchart",label:"Clinical record entered on wrong chart requires controlled correction, not ad-hoc deletion",answers:{noteid:"Note DC-991822. The text is accurate, but I selected the wrong client.",authorityq:"I'm the clinician who entered it.",policyq:"I haven't used the correction workflow yet.",holdq:"I don't know."},tools:{retention:"DumbCare clinical records require auditable correction/amendment; direct deletion by Service Desk is not authorized.",dataowner:"Clinical Applications and Privacy govern DumbCare record corrections."},correct:"esc-clin",escalation:true}
 ]}),
S({id:"dumbcare-lock",cat:"DumbCare",subject:["DumbCare says record is locked","Can't save case update"],open:["DumbCare says the case is locked by another user.","I can't save anything because the record is apparently in use."],priority:"High",
 diagnostics:[["who","Ask who DumbCare says holds the lock"],["age","Ask how long the lock has existed"],["others","Ask whether the other user still has the record open"]],
 fixes:[["clearlock","Clear a verified stale application lock"],["incident","Escalate widespread DumbCare locking issue","escalate"],["killuser","Terminate the other user's session without checking","bad"]],
 causes:[
  {id:"stale",label:"Stale DumbCare record lock after crashed session",answers:{who:"It says Jordan Alvarez.",age:"About two hours.",others:"Jordan says their DumbCare crashed and they are no longer in the record."},tools:{service:"DumbCare healthy.",software:"Record lock references a session that no longer exists."},correct:"clearlock"},
  {id:"service",label:"DumbCare lock service malfunction",answers:{who:"Different names on different records.",age:"All morning.",others:"People are getting locks on records nobody has open."},tools:{service:"DumbCare lock manager is reporting widespread orphaned locks."},correct:"incident",escalation:true}
 ]}),
S({id:"assethound-owner",cat:"AssetHound",subject:["AssetHound says I own a laptop I've never seen","Wrong device assigned to me"],open:["AssetHound says I have two laptops, but I've only ever had one.","A desktop I've never seen is assigned to me in AssetHound."],priority:"Normal",
 diagnostics:[["assetq","Ask for the unexpected asset tag"],["historyq","Ask whether equipment was recently returned/transferred"],["locationq","Ask where AssetHound says the device is located"]],
 fixes:[["correctasset","Correct the asset assignment using verified inventory history"],["esc-asset","Escalate conflicting custody history to Asset Management","escalate"],["deleteasset","Delete the asset record entirely","bad"]],
 causes:[
  {id:"staleassign",label:"Returned device never cleared from user's AssetHound assignment",answers:{assetq:"LT-44108.",historyq:"I returned that laptop during my replacement last month.",locationq:"It says Warehouse Intake."},tools:{asset:"LT-44108 scanned into Warehouse Intake last month but user assignment remained active.",dataowner:"Asset Management owns custody records."},correct:"correctasset"},
  {id:"conflict",label:"Conflicting custody scans require Asset Management review",answers:{assetq:"DT-19940.",historyq:"I've never had it.",locationq:"It shows both my office and Surplus."},tools:{asset:"Conflicting custody scans exist for DT-19940; chain of custody unresolved."},correct:"esc-asset",escalation:true}
 ]}),
S({id:"assethound-delete",cat:"AssetHound / Records",subject:["Delete retired assets from AssetHound","Can you erase disposed equipment records?"],open:["These old devices were disposed. Can you delete their AssetHound records so the list is cleaner?","Please permanently remove retired assets from AssetHound."],priority:"Normal",dataGovernance:true,
 diagnostics:[["scope","Ask which assets and disposal records are involved"],["whydelete","Ask why historical records need deletion"],["authorityq","Ask what Asset Management authority the requester has"]],
 fixes:[["retireasset","Mark assets retired while preserving audit history"],["deleteasset","Delete historical asset records","bad"],["esc-asset","Escalate uncertain disposal history to Asset Management","escalate"]],
 causes:[
  {id:"history",label:"Disposed assets should be retired, not erased from inventory history",answers:{scope:"About 40 laptops already certified as disposed.",whydelete:"I just want the active list to be cleaner.",authorityq:"I'm the technician who processed the disposal."},tools:{retention:"Asset custody/disposal history must remain auditable after retirement.",dataowner:"Asset Management permits status=Retired; historical record deletion is not standard disposition."},correct:"retireasset"}
 ]}),
S({id:"privaccess",cat:"Privileged Access Request",subject:["Give me local admin for a project","Need elevated access temporarily"],open:["I need local admin on my laptop for this project.","Can you make me an administrator for a couple of weeks?"],priority:"Normal",
 diagnostics:[["business","Ask what task requires elevation"],["softwareq","Ask whether an approved alternative exists"],["approvalq","Ask whether Manager approval is documented"]],
 fixes:[["granttempadmin","Issue approved time-limited privileged access"],["requestapproval","Request required Manager approval"],["grantadmin","Grant permanent local admin immediately","bad"],["esc-sec","Escalate unsupported privilege request to Security","escalate"]],
 causes:[
  {id:"valid",label:"Approved business need for time-limited privileged access",approvalRequired:true,answers:{business:"I need the approved engineering utility that requires elevation during device flashing.",softwareq:"The application team says temporary elevation is the supported method."},tools:{dataowner:"Endpoint Security permits time-limited elevation for this approved workflow after Manager approval."},correct:"granttempadmin"},
  {id:"invalid",label:"Requester wants admin rights merely for convenience",answers:{business:"I hate having to call IT when software asks for admin.",softwareq:"No specific project.",approvalq:"No, but my supervisor said they don't care."},tools:{directory:"No privileged-access entitlement or approved exception.",dataowner:"Endpoint Security approval required for privilege exceptions."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"hardwareupgrade",cat:"Equipment Request",subject:["Need a more powerful laptop","Requesting workstation upgrade"],open:["Can I get a higher-spec laptop for my new duties?","My role changed and I think I need the engineering workstation now."],priority:"Low",
 diagnostics:[["need","Ask what workload requires the upgrade"],["current","Ask current device model/performance"],["approvalq","Ask whether Manager approval is documented"]],
 fixes:[["upgradeapproved","Order/assign the approved higher-spec device"],["requestapproval","Request required Manager approval"],["swaprandom","Swap with another employee's laptop","bad"]],
 causes:[
  {id:"valid",label:"Hardware upgrade justified but requires Manager approval",approvalRequired:true,answers:{need:"3D GIS rendering and large local datasets.",current:"Standard laptop; it regularly maxes memory during the approved workload."},tools:{asset:"Current device is standard fleet model; workload profile qualifies for workstation class after approval."},correct:"upgradeapproved"}
 ]}),
S({id:"massmail",cat:"Messaging Request",subject:["Send this message to every employee","Need organization-wide email distribution"],open:["Can you add me to the all-staff distribution list so I can send an announcement?","I need to email every employee from Outlook."],priority:"Normal",
 diagnostics:[["business","Ask purpose and intended audience"],["owner","Ask who owns the all-staff list"],["approvalq","Ask whether communications approval exists"]],
 fixes:[["routecomms","Route organization-wide message through Communications","escalate"],["grantall","Grant direct all-staff send permission","bad"],["sendown","Send the message yourself from the service desk account","bad"]],
 causes:[
  {id:"controlled",label:"All-staff distribution is controlled by Communications",answers:{business:"It's an announcement about our department event.",owner:"I don't know who owns the list.",approvalq:"My supervisor liked the draft."},tools:{dataowner:"All-staff distribution owner: Communications. Department supervisor approval does not grant send permission."},correct:"routecomms",escalation:true}
 ]}),
S({id:"backuprestore",cat:"Backup / Recovery",subject:["Need yesterday's folder restored","Accidentally overwrote a shared file"],open:["I overwrote a shared file and need yesterday's copy back.","A folder vanished from the shared drive. Can we restore it from backup?"],priority:"High",
 diagnostics:[["path","Ask exact path/file name"],["when","Ask last known good date/time"],["scope","Ask whether one file or an entire folder is affected"],["owner","Ask whether the data owner approves overwrite/restoration"]],
 fixes:[["restoreversion","Restore the verified prior version to a safe alternate location"],["overwriteprod","Restore directly over the current production folder without review","bad"],["esc-file","Escalate unavailable backup set to File Services","escalate"]],
 causes:[
  {id:"version",label:"Recoverable prior version available",answers:{path:"\\\\files\\finance\\Forecast.xlsx",when:"Yesterday around 4 PM.",scope:"One workbook.",owner:"Finance lead says restore it, but please don't overwrite today's copy."},tools:{service:"Backup healthy.",dataowner:"Finance owns the folder; prior version available from yesterday 16:00."},correct:"restoreversion"},
  {id:"missing",label:"Requested backup predates available retention window",answers:{path:"\\\\files\\projects\\archive",when:"About 14 months ago.",scope:"Entire folder.",owner:"Project owner wants it back if possible."},tools:{retention:"Standard backup recovery window does not include requested date.",service:"No recoverable snapshot in self-service tier."},correct:"esc-file",escalation:true}
 ]}),
S({id:"browsercert",cat:"Application / Browser",subject:["Fomo opens on one computer but not another","Internal apps show weird browser errors"],open:["Fomo and PolicyWreck work on my phone but not this laptop.","Several internal apps fail in one browser but work elsewhere."],priority:"Normal",
 diagnostics:[["otherbrowser","Ask whether another browser works"],["timeq","Ask whether system date/time is correct"],["extensions","Ask whether browser extensions changed recently"]],
 fixes:[["disableext","Disable the conflicting browser extension"],["clockfix","Correct system date/time"],["reimage","Reimage the laptop immediately","bad"]],
 causes:[
  {id:"extension",label:"Browser privacy extension blocking enterprise SSO scripts",answers:{otherbrowser:"They work in Edge but not Chrome.",timeq:"Time is correct.",extensions:"I installed a strict privacy extension yesterday."},tools:{software:"Browser extension 'Script Fortress' blocks enterprise SSO domains."},correct:"disableext"},
  {id:"clock",label:"Incorrect system time breaks certificate/SSO validation",answers:{otherbrowser:"Both browsers fail.",timeq:"The laptop says it's two days in the future.",extensions:"No changes."},tools:{device:"System clock offset: +47 hours."},correct:"clockfix"}
 ]}),
S({id:"dockfirmware",cat:"Dock / Hardware",subject:["Dock works except Ethernet","USB-C dock keeps disconnecting"],open:["My dock's monitors work, but Ethernet keeps dropping.","The USB-C dock disconnects and reconnects all day."],priority:"Normal",
 diagnostics:[["direct","Ask whether network works without the dock"],["cable","Ask whether another USB-C cable changes behavior"],["firmware","Ask whether dock firmware was recently updated"]],
 fixes:[["dockupdate","Apply approved dock firmware update"],["replacecable","Replace the failing USB-C cable"],["esc-hw","Refer failing dock for replacement","escalate"]],
 causes:[
  {id:"firmware",label:"Outdated dock firmware causes Ethernet resets",answers:{direct:"Wi-Fi works fine.",cable:"Same with another cable.",firmware:"I don't think it has ever been updated."},tools:{device:"Dock firmware 1.2.4; approved stable version 1.4.1 includes Ethernet reset fix."},correct:"dockupdate"},
  {id:"cable",label:"Damaged USB-C cable",answers:{direct:"Laptop itself is fine.",cable:"A spare cable fixes it.",firmware:"Firmware is current."},tools:{device:"Dock healthy when tested with alternate cable."},correct:"replacecable"}
 ]}),
S({id:"calendar",cat:"Calendar / Meetings",subject:["Meeting disappeared from my calendar","I can't see a shared calendar"],open:["A meeting I accepted disappeared from my calendar.","I used to see the department calendar, but now it's gone."],priority:"Normal",
 diagnostics:[["webmail","Ask whether the calendar item appears in webmail"],["sharedq","Ask whether this is personal or shared calendar"],["search","Ask whether search/deleted items finds the meeting"]],
 fixes:[["profilefix","Repair local calendar synchronization"],["readdcalendar","Re-add the approved shared calendar"],["resetpw","Reset the user's password","bad"]],
 causes:[
  {id:"local",label:"Local Outlook calendar cache out of sync",answers:{webmail:"The meeting is there in webmail.",sharedq:"Personal calendar.",search:"It shows online."},tools:{service:"Calendar service healthy.",software:"Outlook local calendar sync reports stale cache."},correct:"profilefix"},
  {id:"shared",label:"Shared calendar was removed from view, access remains",answers:{webmail:"I can open it online.",sharedq:"Department shared calendar.",search:"Access seems to still exist."},tools:{account:"Shared calendar permission remains active."},correct:"readdcalendar"}
 ]}),
S({id:"hello-pin",cat:"Windows Sign-In",subject:["Windows Hello PIN stopped working","PIN unavailable after update"],open:["My PIN suddenly says it isn't available.","Windows Hello stopped accepting my PIN after the update."],priority:"Normal",
 diagnostics:[["error","Request the exact Windows Hello message"],["scope","Ask whether password sign-in still works"],["update","Ask whether Windows/firmware updated"]],
 fixes:[["repin","Re-register Windows Hello PIN after identity verification"],["resetpw","Reset the domain password"],["reimage","Reimage the laptop immediately","bad"]],
 causes:[{id:"container",label:"Windows Hello credential container invalidated after update",answers:{error:"It says 'Something happened and your PIN isn't available.'",scope:"My password still signs me in.",update:"Firmware and Windows updated last night."},tools:{account:"Account healthy; password authentication succeeds.",device:"TPM healthy; Windows Hello container requires re-provisioning."},correct:"repin"}]}),
S({id:"autoreply",cat:"Email / Outlook",subject:["Out of Office won't turn off","Automatic reply is still sending"],open:["My Out of Office reply keeps going even though I turned it off.","People still get my vacation message."],priority:"Low",
 diagnostics:[["webmail","Ask whether automatic replies show enabled in webmail"],["rules","Ask whether an inbox rule also sends replies"],["scope","Ask who receives the unwanted response"]],
 fixes:[["disableooo","Disable the server-side automatic reply"],["rule","Remove the duplicate reply rule"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"server",label:"Server-side automatic reply remained enabled",answers:{webmail:"Webmail still says automatic replies are on.",rules:"No reply rules.",scope:"Everyone who emails me."},tools:{account:"Mailbox automatic-reply state: Enabled."},correct:"disableooo"},
  {id:"rule",label:"Inbox rule sends a separate vacation response",answers:{webmail:"Automatic replies are off.",rules:"There is an old 'Vacation Reply' rule.",scope:"Mostly internal senders."},tools:{account:"Mailbox rule 'Vacation Reply' active."},correct:"rule"}
 ]}),
S({id:"maildelegate",cat:"Email / Access Request",subject:["Need access to manager's mailbox","Add delegate access to shared executive mailbox"],open:["Can you give me access to my manager's mailbox while they're out?","I need delegate access to an executive mailbox."],priority:"Normal",
 diagnostics:[["business","Ask what access is needed and why"],["owner","Ask who owns the mailbox"],["approvalq","Ask whether Manager/data-owner approval is documented"]],
 fixes:[["grantdelegate","Grant the approved scoped mailbox delegation"],["requestapproval","Request required Manager approval"],["grantnow","Grant Full Access and Send As immediately","bad"]],
 causes:[{id:"approval",label:"Mailbox delegation requires documented owner/Manager approval",approvalRequired:true,answers:{business:"Calendar and read access for coverage; I don't need Send As.",owner:"My department manager owns it."},tools:{dataowner:"Mailbox delegation requires owner approval and Manager approval for this scope."},correct:"grantdelegate"}]}),
S({id:"sharedmailbox",cat:"Email / Service Request",subject:["Create a shared mailbox for our project","Need a new team mailbox"],open:["Can IT create a shared mailbox for our project team?","We need a department mailbox that several people can monitor."],priority:"Low",
 diagnostics:[["business","Ask purpose, name, and expected owners"],["approvalq","Ask whether Manager approval is documented"],["members","Ask who should receive access"]],
 fixes:[["createshared","Create the approved shared mailbox and scoped membership"],["requestapproval","Request required Manager approval"],["personalalias","Create it as an alias on one employee's personal mailbox","bad"]],
 causes:[{id:"valid",label:"Standard shared-mailbox request requiring approval",approvalRequired:true,answers:{business:"VendorQuestions@ for our procurement team.",members:"Four analysts and our supervisor."},tools:{dataowner:"New shared mailboxes require Manager approval and two named business owners."},correct:"createshared"}]}),
S({id:"deletedfile",cat:"File Recovery",subject:["I deleted a shared file by accident","Need a file restored from yesterday"],open:["I accidentally deleted a shared spreadsheet.","I deleted the wrong file from the team folder and need it back."],priority:"High",
 diagnostics:[["path","Ask exact path/file"],["when","Ask when it was deleted"],["owner","Confirm business owner / restoration location"]],
 fixes:[["restoreversion","Restore the file to a safe recovery location"],["deletefolder","Delete and restore the whole folder","bad"],["esc-file","Escalate when no recoverable version exists","escalate"]],
 causes:[
  {id:"recycle",label:"Recoverable deleted shared file",answers:{path:"\\\\files\\operations\\Roster.xlsx",when:"About an hour ago.",owner:"Operations owns it. Please don't overwrite anything current."},tools:{service:"File recovery snapshot contains Roster.xlsx from 11:00."},correct:"restoreversion"},
  {id:"expired",label:"Deletion predates standard recovery window",answers:{path:"\\\\files\\operations\\OldPlan.xlsx",when:"Maybe nine months ago.",owner:"Operations."},tools:{retention:"Requested version is outside self-service recovery window."},correct:"esc-file",escalation:true}
 ]}),
S({id:"intermittentnet",cat:"Network",subject:["Network drops every few minutes","Connection keeps cutting out"],open:["My connection drops for 10–20 seconds every few minutes.","Internet and shared drives keep disconnecting briefly."],priority:"High",
 diagnostics:[["connection","Ask whether wired or Wi-Fi"],["others","Ask whether nearby users are affected"],["timing","Ask whether drops follow a pattern"]],
 fixes:[["replacecable","Replace the failing Ethernet cable"],["esc-net","Escalate switch/uplink errors to Network","escalate"],["reinstall","Reinstall network drivers immediately","bad"]],
 causes:[
  {id:"cable",label:"Marginal Ethernet cable",answers:{connection:"Wired through the dock.",others:"Nobody else seems affected.",timing:"Random, especially if I move the dock."},tools:{network:"Link flaps recorded on local adapter; switch port otherwise clean."},correct:"replacecable"},
  {id:"switch",label:"Access-switch port errors affecting multiple desks",answers:{connection:"Wired.",others:"Three desks near me have the same drops.",timing:"All at about the same time."},tools:{network:"Switch interface group reports CRC errors and link resets."},correct:"esc-net",escalation:true}
 ]}),
S({id:"ethernet-dhcp",cat:"Network",subject:["Ethernet says unidentified network","Wired connection has no internet"],open:["Ethernet connects but says Unidentified Network.","My dock gets a 169 address and no network."],priority:"Normal",
 diagnostics:[["ipq","Ask what IP address the device received"],["others","Ask whether the same jack works for another device"],["wifi","Ask whether Wi-Fi works"]],
 fixes:[["renewdhcp","Renew the DHCP lease after correcting adapter state"],["esc-net","Escalate DHCP/VLAN problem","escalate"],["resetpw","Reset user's password","bad"]],
 causes:[
  {id:"local",label:"Stale DHCP state on the endpoint",answers:{ipq:"169.254.44.18.",others:"Another laptop works on this jack.",wifi:"Wi-Fi works."},tools:{network:"Adapter active; APIPA address assigned; DHCP renewal available."},correct:"renewdhcp"},
  {id:"vlan",label:"Network jack placed in incorrect VLAN",answers:{ipq:"169.254 address.",others:"Other laptops also fail on this jack.",wifi:"Wi-Fi works."},tools:{network:"Switch port assigned to inactive staging VLAN."},correct:"esc-net",escalation:true}
 ]}),
S({id:"hotspot",cat:"Network / Policy",subject:["Can I use my phone hotspot at work?","Laptop won't connect to mobile hotspot"],open:["My laptop won't connect to my phone hotspot.","Can you enable hotspot use so I can work around the office Wi-Fi?"],priority:"Low",
 diagnostics:[["where","Ask where they are working"],["business","Ask why hotspot access is needed"],["policyq","Ask what error/policy message appears"]],
 fixes:[["policyanswer","Explain the approved connectivity policy and use supported network"],["esc-net","Escalate a legitimate continuity exception","escalate"],["disablepolicy","Disable wireless security controls","bad"]],
 causes:[{id:"policy",label:"Managed endpoint policy restricts unapproved hotspot use onsite",answers:{where:"I'm onsite.",business:"The office Wi-Fi was slow for a minute.",policyq:"It says this network type is restricted by policy."},tools:{network:"Corporate Wi-Fi available; no site outage.",dataowner:"Security policy restricts unmanaged hotspot use for this device class."},correct:"policyanswer"}]}),
S({id:"scaling",cat:"Display",subject:["Everything is enormous on my monitor","Text became tiny after docking"],open:["Everything on my external monitor is huge now.","After docking, text is microscopic on one screen."],priority:"Low",
 diagnostics:[["resolution","Ask current resolution and scaling"],["othermon","Ask whether only one display is affected"],["update","Ask whether display settings changed"]],
 fixes:[["scalefix","Set recommended resolution and per-monitor scaling"],["reinstall","Reinstall Windows","bad"],["esc-hw","Escalate if display EDID is not detected","escalate"]],
 causes:[{id:"scale",label:"Incorrect per-monitor scaling/resolution",answers:{resolution:"It's at 175% and 1280x720; the monitor is 1440p.",othermon:"Only this monitor.",update:"I think I changed it while presenting."},tools:{device:"Display native resolution 2560x1440; current 1280x720."},correct:"scalefix"}]}),
S({id:"overheat",cat:"Hardware",subject:["Laptop fan is screaming and it's hot","Computer shuts down when it gets hot"],open:["My laptop is extremely hot and the fan never stops.","It shut itself off twice and felt really hot."],priority:"High",
 diagnostics:[["surface","Ask where/how the laptop is being used"],["load","Ask what applications are running"],["vents","Ask whether vents are blocked"]],
 fixes:[["clearvents","Move to hard surface and clear blocked ventilation"],["esc-hw","Refer suspected cooling-system failure","escalate"],["freeze","Put the laptop in a refrigerator","bad"]],
 causes:[
  {id:"blocked",label:"Ventilation blocked by soft surface",answers:{surface:"It's on a blanket on my couch.",load:"Just normal Office apps.",vents:"The bottom vents are mostly covered."},tools:{device:"CPU temperature elevated; fan responding normally."},correct:"clearvents"},
  {id:"fan",label:"Cooling fan failure",answers:{surface:"On a desk.",load:"Normal apps.",vents:"Vents are clear but I don't hear the fan."},tools:{device:"Thermal event history; cooling fan tachometer reports 0 RPM."},correct:"esc-hw",escalation:true}
 ]}),
S({id:"charger",cat:"Hardware",subject:["Laptop says slow charger","Battery drains while plugged in"],open:["My laptop says Slow Charger even though it's plugged in.","Battery percentage goes down while I'm using the dock."],priority:"Normal",
 diagnostics:[["wattage","Ask charger/dock wattage"],["direct","Ask whether original charger works directly"],["cable","Ask whether USB-C cable is approved"]],
 fixes:[["rightcharger","Use the correct supported power adapter"],["replacecable","Replace insufficient USB-C cable"],["esc-hw","Escalate charging hardware failure","escalate"]],
 causes:[
  {id:"brick",label:"Underpowered USB-C charger",answers:{wattage:"It's a 30W phone charger.",direct:"The original 90W charger works.",cable:"Just a phone cable."},tools:{device:"System requires 65W minimum; negotiated input 27W."},correct:"rightcharger"},
  {id:"cable",label:"USB-C cable cannot sustain required power",answers:{wattage:"90W dock.",direct:"Original charger is fine.",cable:"This is a cheap replacement cable."},tools:{device:"Power adapter capable; USB-C power negotiation limited by cable."},correct:"replacecable"}
 ]}),
S({id:"bluetooth",cat:"Audio / Bluetooth",subject:["Bluetooth headset won't reconnect","Headset vanished after update"],open:["My Bluetooth headset won't connect anymore.","Windows sees my headset but pairing fails."],priority:"Normal",
 diagnostics:[["otherdevice","Ask whether headset is connected to another device"],["forgetq","Ask whether removing/re-pairing was attempted"],["update","Ask whether Bluetooth driver updated"]],
 fixes:[["repairbt","Remove stale pairing and re-pair headset"],["disconnectphone","Disconnect headset from the other active device"],["reinstall","Reinstall all audio software","bad"]],
 causes:[
  {id:"stale",label:"Stale Bluetooth pairing record",answers:{otherdevice:"It's not connected elsewhere.",forgetq:"I haven't removed it yet.",update:"Windows updated yesterday."},tools:{device:"Bluetooth radio healthy; pairing record reports key mismatch."},correct:"repairbt"},
  {id:"other",label:"Headset is actively connected to phone",answers:{otherdevice:"Oh, it is connected to my phone.",forgetq:"No.",update:"No."},tools:{device:"Headset advertises but refuses second active audio connection."},correct:"disconnectphone"}
 ]}),
S({id:"mfa-number",cat:"MFA / Access Request",subject:["Change the phone number used for MFA","Old MFA number is gone"],open:["My MFA texts still go to my old phone number.","Can you change the number on my authentication profile?"],priority:"High",
 diagnostics:[["identity","Confirm identity through approved verification"],["oldphone","Ask whether old method is still available"],["approvalq","Check whether standard self-service recovery applies"]],
 fixes:[["updatemfa","Update MFA method through approved identity workflow"],["bypass","Bypass MFA indefinitely","bad"],["esc-id","Escalate identity-verification exception","escalate"]],
 causes:[{id:"standard",label:"Legitimate MFA method replacement after identity verification",answers:{identity:"Yes, I can complete the approved identity check.",oldphone:"No, that number was disconnected.",approvalq:"Yes. This qualifies for the standard MFA recovery workflow after approved identity verification."},tools:{account:"Account active; MFA method points to retired number."},correct:"updatemfa"}]}),
S({id:"mfa-fatigue",cat:"Security / MFA",subject:["I'm getting MFA prompts I didn't request","Authenticator keeps asking me to approve"],open:["My phone keeps getting sign-in approvals and I'm not trying to log in.","I've denied six MFA prompts today."],priority:"Critical",
 diagnostics:[["mfaevent","Ask whether any prompt was approved"],["recentpwd","Ask whether credentials were entered somewhere suspicious"],["logins","Ask about unexpected sign-in notifications"]],
 fixes:[["secureacct","Initiate account-compromise procedure and Security escalation","escalate"],["approveonce","Approve one prompt to make them stop","bad"],["ignore","Tell user to ignore it indefinitely","bad"]],
 causes:[{id:"attack",label:"MFA fatigue / likely compromised credentials",answers:{mfaevent:"I denied all of them.",recentpwd:"I signed into a weird 'document share' page yesterday.",logins:"There was an alert from another state."},tools:{logins:"Repeated password-success/MFA-denied attempts from unfamiliar IP ranges."},correct:"secureacct",escalation:true}]}),
S({id:"license-expiry",cat:"Software Licensing",subject:["Application says license expired today","Licensed software suddenly read-only"],open:["The application says our license expired.","It opened in read-only mode and says subscription inactive."],priority:"High",
 diagnostics:[["scope","Ask whether multiple licensed users are affected"],["licenseq","Ask for license/subscription message"],["owner","Ask which team owns the contract"]],
 fixes:[["renewlicense","Apply already-purchased renewed license entitlement"],["esc-vendor","Escalate contract/vendor renewal gap","escalate"],["crack","Bypass license enforcement","bad"]],
 causes:[
  {id:"sync",label:"Renewed entitlement has not synced to application",answers:{scope:"Everyone in our licensed group.",licenseq:"Subscription inactive — refresh entitlement.",owner:"Applications team."},tools:{software:"Renewal entitlement exists; local licensing service has stale token."},correct:"renewlicense"},
  {id:"expired",label:"Vendor subscription actually expired",answers:{scope:"All users.",licenseq:"Contract expired.",owner:"Application owner says renewal is still with Purchasing."},tools:{software:"No active entitlement after expiration date."},correct:"esc-vendor",escalation:true}
 ]}),
S({id:"fomo-mobile",cat:"Fomo",subject:["Fomo mobile app keeps logging me out","Can't sign into Fomo on phone"],open:["Fomo works on my laptop but not the mobile app.","The Fomo app signs me out every few minutes."],priority:"Normal",
 diagnostics:[["webq","Ask whether Fomo web works"],["version","Ask mobile app version"],["profileq","Ask whether device management profile is healthy"]],
 fixes:[["updatefomo","Update Fomo mobile app and refresh sign-in"],["reenroll","Repair mobile management profile"],["resetpw","Reset domain password","bad"]],
 causes:[
  {id:"old",label:"Outdated Fomo mobile build",answers:{webq:"Web works.",version:"Version 8.1.",profileq:"Management profile says compliant."},tools:{software:"Fomo 8.1 installed; minimum supported mobile version 9.4."},correct:"updatefomo"},
  {id:"profile",label:"Device management token expired",answers:{webq:"Web works.",version:"Current.",profileq:"It says enrollment needs attention."},tools:{device:"Mobile management token expired."},correct:"reenroll"}
 ]}),
S({id:"fomo-delete",cat:"Fomo / Data Governance",subject:["Delete our old Fomo channel and all history","Permanently erase Fomo workspace"],open:["Can you permanently delete our old Fomo channel and everything in it?","The project is over. Please wipe the Fomo workspace and all chat history."],priority:"Normal",dataGovernance:true,
 diagnostics:[["owner","Ask who owns the workspace"],["whydelete","Ask whether deletion or archival is actually required"],["holdq","Check retention/hold"],["approvalq","Ask for Manager approval"]],
 fixes:[["archivefomo","Archive the workspace while preserving required history"],["deletefomo","Perform approved deletion when retention permits"],["delete-now","Purge all chat history immediately","bad"]],
 causes:[
  {id:"retain",label:"Workspace may be archived but chat history remains under retention policy",answers:{owner:"Our project team.",whydelete:"Mostly to clean up the workspace list.",holdq:"No idea.",approvalq:"My supervisor said to get rid of it."},tools:{retention:"Fomo chat history remains subject to organizational retention; workspace can be archived without destroying records.",dataowner:"Collaboration Applications controls final disposition."},correct:"archivefomo"},
  {id:"eligible",label:"Eligible non-record test workspace can be deleted after approval",approvalRequired:true,answers:{owner:"Training team owns it.",whydelete:"It was a sandbox with fake data only.",holdq:"Records says the sandbox is non-record content."},tools:{retention:"Sandbox FOMO-TRAIN-OLD eligible for deletion; no hold.",dataowner:"Training workspace owner confirmed."},correct:"deletefomo"}
 ]}),
S({id:"illogic-owner",cat:"IllogicManager",subject:["My workflow requests belong to someone else now","IllogicManager shows wrong request owner"],open:["IllogicManager suddenly assigns my requests to another employee.","New requests are landing with the wrong owner."],priority:"High",
 diagnostics:[["workflow","Ask which workflow is affected"],["roleq","Ask whether team roles changed"],["others","Ask whether all new requests route incorrectly"]],
 fixes:[["routingfix","Correct the workflow ownership mapping"],["incident","Escalate platform-wide routing fault","escalate"],["reassignall","Manually reassign every historical request","bad"]],
 causes:[
  {id:"mapping",label:"Workflow role mapping references former team lead",answers:{workflow:"Facilities Exception.",roleq:"We changed team leads last week.",others:"Every new request goes to the old lead."},tools:{software:"Workflow owner mapping points to deprecated role group."},correct:"routingfix"},
  {id:"engine",label:"IllogicManager assignment engine malfunction",answers:{workflow:"Several unrelated workflows.",roleq:"No role changes.",others:"Different teams report random ownership."},tools:{service:"Assignment engine errors elevated across IllogicManager."},correct:"incident",escalation:true}
 ]}),
S({id:"illogic-delete",cat:"IllogicManager / Records",subject:["Delete failed workflow history","Erase rejected approval requests"],open:["Can you delete all the rejected IllogicManager requests? They clutter the history.","Please remove the failed approval history so users don't see it."],priority:"Normal",dataGovernance:true,
 diagnostics:[["whydelete","Ask why history should be removed"],["authorityq","Ask what workflow-admin authority requester has"],["holdq","Check audit retention"]],
 fixes:[["retainhistory","Retain audit history and hide/archive eligible views"],["delete-now","Delete rejected workflow history from database","bad"],["esc-records","Escalate unusual disposition request","escalate"]],
 causes:[{id:"audit",label:"Approval workflow history is an auditable record",answers:{whydelete:"It looks messy.",authorityq:"I'm the workflow coordinator.",holdq:"I don't know."},tools:{retention:"Approval decision history is retained for audit; ordinary deletion is prohibited."},correct:"retainhistory"}]}),
S({id:"policyrollback",cat:"PolicyWreck",subject:["Need previous policy version restored","Published the wrong PolicyWreck revision"],open:["We published the wrong policy version. Can we roll back?","PolicyWreck has the wrong revision live."],priority:"High",
 diagnostics:[["versionq","Ask current and intended version"],["approvalq","Ask whether rollback is authorized"],["historyq","Ask whether prior version remains in history"]],
 fixes:[["rollbackpolicy","Publish the authorized prior version while preserving history"],["deletecurrent","Delete the current published version from history","bad"],["esc-gov","Escalate if version history is inconsistent","escalate"]],
 causes:[{id:"rollback",label:"Authorized rollback using preserved version history",approvalRequired:true,answers:{versionq:"v7 went live; v6 is the approved one.",historyq:"v6 is still in version history."},tools:{retention:"PolicyWreck requires all published versions to remain in history."},correct:"rollbackpolicy"}]}),
S({id:"policydelete",cat:"PolicyWreck / Records",subject:["Delete the old policy versions","Can IT purge draft/published policy history?"],open:["Can you delete all the old versions of this policy?","We only need the current policy. Please purge the rest from PolicyWreck."],priority:"Normal",dataGovernance:true,
 diagnostics:[["whydelete","Ask why version history should be destroyed"],["owner","Ask who owns the policy"],["holdq","Check policy-record retention"]],
 fixes:[["retainhistory","Keep required version history and archive superseded versions"],["delete-now","Purge all prior policy versions","bad"],["esc-records","Escalate retention exception request","escalate"]],
 causes:[{id:"records",label:"Superseded policy versions remain required records",answers:{whydelete:"Just to clean it up.",owner:"Administration.",holdq:"I haven't checked."},tools:{retention:"Published policy version history is retained according to records schedule."},correct:"retainhistory"}]}),
S({id:"granular-rla",cat:"Granular / Access Request",subject:["I can see totals but not employee rows","Need row-level Granular access"],open:["Granular only shows totals. I need the employee-level rows.","Can you remove the row-level restriction on my Granular access?"],priority:"Normal",dataGovernance:true,
 diagnostics:[["business","Ask why row-level detail is needed"],["authorityq","Ask current analytics role"],["approvalq","Ask for Manager/data-owner approval"]],
 fixes:[["granularrows","Grant approved row-level dataset role"],["requestapproval","Request required Manager approval"],["grantnow","Add unrestricted warehouse access","bad"]],
 causes:[{id:"approval",label:"Row-level Granular access requires Manager and data-owner authorization",approvalRequired:true,answers:{business:"I'm now responsible for workforce reconciliation.",authorityq:"I currently have summary analyst access."},tools:{dataowner:"Workforce row-level access requires Data & Analytics owner plus Manager approval."},correct:"granularrows"}]}),
S({id:"granular-schedule",cat:"Granular",subject:["Scheduled Granular export stopped arriving","Daily dashboard CSV missing"],open:["My scheduled Granular export hasn't arrived for three days.","The overnight CSV job stopped delivering files."],priority:"Normal",
 diagnostics:[["scheduleq","Ask which scheduled job"],["owner","Ask destination/owner"],["error","Request job history status"]],
 fixes:[["repairjob","Repair the failed scheduled export destination"],["incident","Escalate Granular scheduler outage","escalate"],["exportall","Manually dump the entire warehouse","bad"]],
 causes:[
  {id:"destination",label:"Scheduled export destination path was retired",answers:{scheduleq:"WORKFORCE_DAILY.",owner:"It writes to \\\\files\\analytics\\drop.",error:"Destination not found."},tools:{service:"Granular scheduler healthy; target path no longer exists."},correct:"repairjob"},
  {id:"scheduler",label:"Granular scheduling service outage",answers:{scheduleq:"Several jobs.",owner:"Different destinations.",error:"Jobs remain Pending."},tools:{service:"Granular scheduler service unavailable."},correct:"incident",escalation:true}
 ]}),
S({id:"people-salary",cat:"PeopleChock / Sensitive Data",subject:["Give me access to salary data","Need everyone's compensation fields"],open:["Can you enable the salary fields in PeopleChock for me?","I need to see compensation details for the whole department."],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask business purpose"],["authorityq","Ask HR-data role"],["approvalq","Ask for required authorization"]],
 fixes:[["salaryrole","Grant approved compensation-data role"],["requestapproval","Request required Manager/HR approval"],["grantnow","Enable salary access immediately","bad"],["esc-hr","Escalate questionable sensitive-data request to HR","escalate"]],
 causes:[
  {id:"valid",label:"Legitimate HR analytics access requiring specialized approval",approvalRequired:true,answers:{business:"Approved compensation study.",authorityq:"I'm an HR analyst; I don't currently have compensation role."},tools:{dataowner:"Compensation fields require HR Data Owner plus Manager approval."},correct:"salaryrole"},
  {id:"invalid",label:"Requester has no business authority for compensation data",answers:{business:"I'm curious whether our team is paid fairly.",authorityq:"I'm a regular team supervisor.",approvalq:"No."},tools:{directory:"Requester has no HR compensation-data role.",dataowner:"Compensation data owned by HR; curiosity is not an authorized purpose."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"people-term",cat:"PeopleChock / Offboarding",subject:["Former employee still active in PeopleChock","Terminated staff member appears active"],open:["Someone who left last week still shows Active in PeopleChock.","A terminated employee is still appearing on current staff lists."],priority:"High",
 diagnostics:[["personid","Ask employee ID/effective termination date"],["sourceq","Check HR source record"],["accountq","Ask whether system access is also still active"]],
 fixes:[["resync","Re-run PeopleChock termination sync"],["esc-hr","Escalate missing HR termination source record","escalate"],["delete-now","Delete the employee record entirely","bad"]],
 causes:[
  {id:"sync",label:"Termination exists in HR source but PeopleChock sync failed",answers:{personid:"Employee 51109, effective last Friday.",sourceq:"HR source says Terminated.",accountq:"Identity team already disabled network access."},tools:{service:"PeopleChock missed termination event for employee 51109."},correct:"resync"},
  {id:"source",label:"Termination was never entered in HR source",answers:{personid:"Employee 40211.",sourceq:"HR source still says Active.",accountq:"Their account was disabled manually."},tools:{directory:"HR master record remains Active; PeopleChock is reflecting source correctly."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"dumbcare-print",cat:"DumbCare",subject:["DumbCare forms print blank","Clinical form prints without data"],open:["DumbCare prints the form but all the patient fields are blank.","The preview looks right, but the printed clinical form is empty."],priority:"High",
 diagnostics:[["scope","Ask whether all DumbCare forms are affected"],["printerq","Ask whether PDF export contains the data"],["version","Ask DumbCare client/browser version"]],
 fixes:[["printtemplate","Refresh the approved DumbCare print template"],["esc-clin","Escalate platform template failure","escalate"],["copydata","Copy patient data into a personal document to print","bad"]],
 causes:[
  {id:"cache",label:"Stale local DumbCare print template cache",answers:{scope:"Only this workstation.",printerq:"PDF export is correct.",version:"Current."},tools:{software:"Local print-template cache version behind server."},correct:"printtemplate"},
  {id:"platform",label:"DumbCare server print-template defect",answers:{scope:"Several clinics report it.",printerq:"Exports are blank too.",version:"Current."},tools:{service:"DumbCare print renderer errors elevated."},correct:"esc-clin",escalation:true}
 ]}),
S({id:"dumbcare-access",cat:"DumbCare / Access Request",subject:["Need access to another clinic's DumbCare records","Add cross-program DumbCare access"],open:["I need DumbCare access to another program's client records.","Can you add me to the clinical group for a different clinic?"],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask clinical/business need"],["authorityq","Ask current role/program"],["approvalq","Ask for Manager and clinical data-owner approval"]],
 fixes:[["grantclinical","Grant the approved minimum clinical access"],["requestapproval","Request required Manager approval"],["grantnow","Add broad clinical access immediately","bad"],["esc-clin","Escalate questionable access scope to Clinical Applications","escalate"]],
 causes:[{id:"approval",label:"Cross-program clinical access requires documented authorization",approvalRequired:true,answers:{business:"I'm covering that program for six weeks.",authorityq:"Clinician in another program."},tools:{dataowner:"Cross-program DumbCare access requires Manager and Clinical Data Owner approval."},correct:"grantclinical"}]}),
S({id:"assethound-scanner",cat:"AssetHound",subject:["AssetHound barcode scanner stopped working","Inventory scanner won't upload"],open:["The AssetHound scanner reads barcodes but nothing uploads.","Our inventory scanner is stuck Offline."],priority:"Normal",
 diagnostics:[["networkq","Ask whether scanner has network connectivity"],["queue","Ask whether scans are queued locally"],["others","Ask whether other scanners upload"]],
 fixes:[["syncscanner","Reconnect scanner and sync queued inventory events"],["incident","Escalate AssetHound ingestion outage","escalate"],["rescanall","Delete queue and rescan every asset","bad"]],
 causes:[
  {id:"offline",label:"Scanner dropped Wi-Fi and has queued scans",answers:{networkq:"It says Offline.",queue:"There are 63 queued scans.",others:"Other scanners work."},tools:{network:"Scanner not associated to inventory Wi-Fi."},correct:"syncscanner"},
  {id:"service",label:"AssetHound ingestion service outage",answers:{networkq:"Connected.",queue:"Every scanner is building a queue.",others:"No scanners upload."},tools:{service:"AssetHound inventory ingestion API unavailable."},correct:"incident",escalation:true}
 ]}),
S({id:"assethound-transfer",cat:"AssetHound / Service Request",subject:["Transfer 20 laptops to another unit","Need bulk asset custody transfer"],open:["Can you move these 20 laptops to another department in AssetHound?","We transferred equipment to another unit and need custody updated."],priority:"Normal",
 diagnostics:[["scope","Ask for asset list and receiving unit"],["owner","Ask who owns current custody"],["approvalq","Ask whether transfer approval is documented"]],
 fixes:[["transferassets","Process approved custody transfer"],["requestapproval","Request required Manager approval"],["deleteasset","Delete and recreate the asset records under the new unit","bad"]],
 causes:[{id:"approval",label:"Bulk custody transfer requires documented authorization",approvalRequired:true,answers:{scope:"20 listed assets moving from Planning to Operations.",owner:"Planning currently owns custody."},tools:{dataowner:"Bulk interdepartmental transfer requires Manager approval from current custody owner."},correct:"transferassets"}]}),
S({id:"usb-export",cat:"Data Transfer / Security",subject:["Copy restricted data to USB for vendor","Need dataset on a flash drive"],open:["Can you put this dataset on a USB drive so I can give it to a vendor?","I need to export case-level data to removable media."],priority:"Critical",dataGovernance:true,
 diagnostics:[["business","Ask why removable media is required"],["scope","Ask what data is included"],["authorityq","Ask whether vendor/data-sharing approval exists"],["approvalq","Ask for Manager/security authorization"]],
 fixes:[["approvedusb","Use approved encrypted transfer process after authorization"],["requestapproval","Request required approval"],["personalusb","Copy it to the user's personal flash drive","bad"],["esc-sec","Escalate questionable external data transfer","escalate"]],
 causes:[
  {id:"valid",label:"Approved external transfer requiring encrypted media and authorization",approvalRequired:true,answers:{business:"Approved vendor migration.",scope:"Specific de-identified export listed in the agreement.",authorityq:"Vendor transfer is documented in the project plan."},tools:{dataowner:"Approved project permits minimum-necessary encrypted transfer after Manager/Security approval."},correct:"approvedusb"},
  {id:"invalid",label:"Sensitive data export has no approved external-sharing basis",answers:{business:"The vendor asked for it to troubleshoot.",scope:"Full case-level dataset.",authorityq:"No data-sharing agreement that I know of.",approvalq:"No."},tools:{dataowner:"No approved external recipient authorization found.",retention:"Data cannot be released merely for troubleshooting convenience."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"legalhold-folder",cat:"Records / Legal Hold",subject:["Delete old project folder under review","Need shared folder wiped before cleanup"],open:["Please permanently delete the old project folder. Legal has been asking questions about it anyway.","Can you wipe this shared folder? We don't need it anymore."],priority:"Critical",dataGovernance:true,
 diagnostics:[["path","Ask exact folder"],["whydelete","Ask reason for deletion"],["holdq","Check legal/records hold"],["authorityq","Ask disposition authority"]],
 fixes:[["esc-records","Preserve data and escalate active hold to Legal / Records","escalate"],["delete-now","Permanently delete the folder","bad"],["renamehide","Rename it so Legal won't notice it","bad"]],
 causes:[{id:"hold",label:"Shared folder is subject to active legal hold",answers:{path:"\\\\files\\projects\\VendorReview.",whydelete:"It's old and causing questions.",holdq:"There was a preservation notice.",authorityq:"I'm the project supervisor."},tools:{retention:"ACTIVE LEGAL HOLD: VendorReview. Preserve all content and metadata.",directory:"Project supervisor does not have authority to defeat a legal hold."},correct:"esc-records",escalation:true}]}),
S({id:"extension-block",cat:"Browser / Security",subject:["Browser extension blocked by policy","Need an extension installed for work"],open:["Chrome says this extension is blocked by the administrator.","Can you allow this browser extension? I need it for a task."],priority:"Normal",
 diagnostics:[["extensionq","Ask the exact browser extension name and source"],["business","Ask business purpose"],["approvalq","Ask whether approved software/security review exists"]],
 fixes:[["installapproved","Deploy an already-approved extension"],["requestapproval","Route unreviewed extension for approval"],["disablepolicy","Disable browser extension policy","bad"]],
 causes:[
  {id:"approved",label:"Approved enterprise extension missing from assigned policy",answers:{extensionq:"Approved PDF Signer from the enterprise store.",business:"Required for document signing.",approvalq:"Yes. Security review is complete and the extension is in the approved enterprise catalog."},tools:{software:"Extension is approved but user's policy assignment is missing."},correct:"installapproved"},
  {id:"unknown",label:"Unreviewed third-party extension",answers:{extensionq:"SuperFree Downloader from a random website.",business:"It makes downloads easier.",approvalq:"No formal security approval is recorded."},tools:{software:"Extension not in approved catalog; publisher unverified."},approvalRequired:true,approvalChain:["security"],correct:"installapproved"}
 ]}),
S({id:"rdp-license",cat:"Remote Access",subject:["Remote Desktop says no licenses available","RDP session denied by licensing"],open:["Remote Desktop says there are no licenses available.","I can reach the server, but it refuses my remote session because of licensing."],priority:"High",
 diagnostics:[["error","Request exact RDP licensing error"],["scope","Ask whether other users are affected"],["accountq","Ask whether requester normally has access"]],
 fixes:[["incident","Escalate RDS licensing service failure","escalate"],["grantadmin","Make user a server administrator","bad"],["resetpw","Reset password","bad"]],
 causes:[{id:"licsrv",label:"Remote Desktop licensing service failure",answers:{error:"No Remote Desktop License Servers available.",scope:"Several people have it.",accountq:"Yes, I use it every day."},tools:{service:"RDS licensing service health check failing; host itself reachable."},correct:"incident",escalation:true}]}),
S({id:"teams-status",cat:"Conferencing / Presence",subject:["Presence status is wrong all day","Teams/Webex-style status stuck Away"],open:["My presence says Away even while I'm working.","People keep saying I show Offline when I'm online."],priority:"Low",
 diagnostics:[["otherclient","Ask whether web/mobile client shows same status"],["calendarq","Ask whether calendar status is correct"],["signin","Ask whether multiple accounts are signed in"]],
 fixes:[["presencecache","Refresh presence/sign-in cache"],["incident","Escalate organization-wide presence outage","escalate"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"cache",label:"Stale local presence cache",answers:{otherclient:"Mobile shows Available.",calendarq:"Calendar is normal.",signin:"Only one account."},tools:{service:"Presence service healthy."},correct:"presencecache"},
  {id:"service",label:"Presence service degradation",answers:{otherclient:"Wrong everywhere.",calendarq:"Calendar is normal.",signin:"One account; coworkers see it too."},tools:{service:"Presence service degradation reported across tenants."},correct:"incident",escalation:true}
 ]}),
S({id:"mailattachment",cat:"Email / Security",subject:["Attachment is blocked","Can't send this executable file"],open:["Outlook won't let me send this attachment.","The mail system says the file type is blocked."],priority:"Normal",
 diagnostics:[["filetype","Ask what file type is being sent"],["business","Ask why it must be emailed"],["alternative","Ask whether approved file transfer can be used"]],
 fixes:[["approvedshare","Use approved file-sharing method"],["unblockmail","Disable mail attachment filtering","bad"],["esc-sec","Escalate legitimate specialized transfer requirement","escalate"]],
 causes:[{id:"blocked",label:"Security policy blocks executable attachment types",answers:{filetype:".exe installer.",business:"Vendor needs to inspect our build.",alternative:"We have an approved project file share."},tools:{service:"Mail filtering intentionally blocks executable attachments."},correct:"approvedshare"}]}),
S({id:"wrong-priority",cat:"Service Request",subject:["Second monitor is broken and this is URGENT","MAKE THIS CRITICAL — mouse is annoying"],open:["My second monitor is broken. THIS IS CRITICAL because I hate using one screen.","My mouse wheel squeaks. Please mark this emergency priority."],priority:"Normal",
 diagnostics:[["impact","Ask what work is actually blocked"],["workaround","Ask whether a usable workaround exists"],["hardwareq","Ask basic hardware symptoms"]],
 fixes:[["normaltriage","Keep appropriate Normal priority and troubleshoot normally"],["criticalize","Mark Critical solely because requester demanded it","bad"],["esc-hw","Refer confirmed hardware replacement","escalate"]],
 causes:[{id:"limited",label:"Limited individual impact with workable primary equipment",answers:{impact:"I can still work; I just only have one monitor.",workaround:"Yes, the laptop screen works.",hardwareq:"The second monitor has power but no signal."},tools:{device:"Primary workstation functional."},correct:"normaltriage"}]}),
S({id:"cal-sync",cat:"Calendar",subject:["Calendar invites duplicate themselves","Meetings appear twice"],open:["Every meeting is showing twice in my calendar.","I get duplicate copies of invitations."],priority:"Normal",
 diagnostics:[["webmail","Ask whether duplicates appear in web calendar"],["devices","Ask how many devices/accounts sync calendar"],["rules","Ask whether forwarding/delegation exists"]],
 fixes:[["profilefix","Repair duplicate local calendar sync profile"],["delegatefix","Correct duplicate delegate forwarding"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"profile",label:"Local calendar cache duplicates entries",answers:{webmail:"Web calendar only shows one copy.",devices:"Laptop and phone.",rules:"No delegation."},tools:{service:"Calendar service healthy."},correct:"profilefix"},
  {id:"delegate",label:"Delegate rule causes duplicate meeting delivery",answers:{webmail:"Two invitations arrive there too.",devices:"One main device.",rules:"My assistant and I both receive/forward invites."},tools:{account:"Delegate meeting delivery configured twice."},correct:"delegatefix"}
 ]}),
S({id:"print-secure",cat:"Printer / Security",subject:["Secure print job disappeared","Badge release won't show my document"],open:["I sent a secure print job but it isn't at the copier when I badge in.","Follow-Me printing says I have no jobs."],priority:"Normal",
 diagnostics:[["queue","Ask whether job appears in secure print queue"],["badge","Ask whether badge is mapped to correct identity"],["printerq","Ask whether direct printing works"]],
 fixes:[["badgemap","Correct secure-print badge identity mapping"],["clearqueue","Resubmit expired print job"],["esc-print","Escalate secure-print service outage","escalate"]],
 causes:[
  {id:"badge",label:"Badge mapped to old username after account rename",answers:{queue:"The portal shows the job.",badge:"My username changed last month.",printerq:"Direct printing works."},tools:{account:"Badge association references retired username."},correct:"badgemap"},
  {id:"expiry",label:"Secure print job expired before release",answers:{queue:"It no longer appears.",badge:"Mapping is correct.",printerq:"Direct works."},tools:{service:"Secure queue retains jobs for 8 hours; requested job expired."},correct:"clearqueue"}
 ]}),
S({id:"sharedlink",cat:"File Sharing / Security",subject:["External recipient can't open shared link","Need to share file outside organization"],open:["A vendor can't open the link I sent them.","Can you make this shared-drive link accessible to anyone?"],priority:"High",dataGovernance:true,
 diagnostics:[["recipient","Ask who the external recipient is"],["scope","Ask what data is being shared"],["authorityq","Ask whether external sharing is approved"],["approvalq","Ask for Manager/data-owner authorization"]],
 fixes:[["externallink","Create approved scoped external share"],["requestapproval","Request required approval"],["publiclink","Make the folder public to anyone with the link","bad"],["esc-sec","Escalate sensitive external sharing request","escalate"]],
 causes:[
  {id:"approved",label:"Legitimate external share requiring scoped authorization",approvalRequired:true,answers:{recipient:"Contracted vendor project team.",scope:"Non-sensitive project documents only.",authorityq:"The contract allows document exchange."},tools:{dataowner:"External sharing permitted after Manager approval using named-recipient access."},correct:"externallink"},
  {id:"sensitive",label:"Proposed public link includes restricted data",answers:{recipient:"A vendor.",scope:"Client-level records and internal reports.",authorityq:"I don't know whether external sharing is approved.",approvalq:"No."},tools:{dataowner:"Restricted dataset not approved for public-link sharing."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"unknown-device",cat:"Security / Account",subject:["I don't recognize this signed-in device","Account shows a device I've never owned"],open:["My account lists a device I don't recognize.","There's a phone signed into my account that isn't mine."],priority:"Critical",
 diagnostics:[["deviceq","Ask which device/session is unfamiliar"],["mfaevent","Ask about unexpected MFA prompts"],["recentpwd","Ask about recent suspicious sign-ins"]],
 fixes:[["secureacct","Revoke sessions and initiate account-compromise review","escalate"],["ignore","Tell user old devices are always harmless","bad"],["deleteasset","Delete the device record without investigating","bad"]],
 causes:[{id:"session",label:"Potential unauthorized account session",answers:{deviceq:"Android device named SM-X999, signed in this morning.",mfaevent:"I got one prompt I didn't initiate.",recentpwd:"No recent password change."},tools:{logins:"Unfamiliar mobile session plus denied MFA attempt."},correct:"secureacct",escalation:true}]}),
S({id:"wrong-recipient",cat:"Security / Email",subject:["I emailed sensitive file to wrong person","Sent attachment to external recipient by mistake"],open:["I accidentally emailed a sensitive attachment to the wrong person.","I sent a file outside the organization by mistake. What do I do?"],priority:"Critical",dataGovernance:true,
 diagnostics:[["recipient","Ask who received it"],["scope","Ask what data was included"],["recallq","Ask whether message recall/recipient contact has occurred"]],
 fixes:[["esc-sec","Preserve facts and escalate potential data incident to Security/Privacy","escalate"],["delete-sent","Delete the sender's Sent Items copy and close ticket","bad"],["threaten","Tell user to threaten the recipient into deleting it","bad"]],
 causes:[{id:"incident",label:"Potential unauthorized disclosure requiring incident response",answers:{recipient:"An external address with a similar name.",scope:"A spreadsheet with employee information.",recallq:"I tried recall but it says external recall isn't supported."},tools:{dataowner:"Potential unauthorized disclosure requires Privacy/Security review; deleting local copy does not undo delivery."},correct:"esc-sec",escalation:true}]}),
S({id:"account-rename",cat:"Identity",subject:["Name changed but apps show old name","Username/display name inconsistent"],open:["My name changed, but half the applications still show my old name.","Email shows my new name but Fomo and Granular show the old one."],priority:"Low",
 diagnostics:[["sourceq","Ask whether HR/identity source reflects new name"],["scope","Ask which apps remain stale"],["timing","Ask when the change became effective"]],
 fixes:[["resyncidentity","Re-run downstream identity/profile synchronization"],["esc-id","Escalate source identity mismatch","escalate"],["newaccount","Create a second account under the new name","bad"]],
 causes:[
  {id:"downstream",label:"Downstream application profile sync lag",answers:{sourceq:"HR and directory show the new name.",scope:"Fomo and Granular.",timing:"Two days ago."},tools:{account:"Primary directory updated; two downstream profile syncs failed."},correct:"resyncidentity"},
  {id:"source",label:"Identity source still contains old legal/display name",answers:{sourceq:"HR still shows the old name.",scope:"Most systems.",timing:"Request submitted but HR hasn't processed it."},tools:{directory:"Identity platform reflects current HR source."},correct:"esc-id",escalation:true}
 ]}),
S({id:"vendor-account",cat:"Vendor / Access",subject:["Vendor consultant needs temporary account","Create outside contractor access"],open:["Our vendor starts tomorrow and needs system access.","Can you create an account for this consultant?"],priority:"High",
 diagnostics:[["business","Ask which exact systems the vendor needs and for which contract/project"],["expiryq","Ask required end date"],["approvalq","Ask for sponsor/Manager approval"]],
 fixes:[["vendoracct","Create approved time-limited sponsored account"],["requestapproval","Request required Manager approval"],["permanentacct","Create permanent employee-style account","bad"]],
 causes:[{id:"approval",label:"Sponsored vendor access requires Manager approval and expiration",approvalRequired:true,answers:{business:"Approved implementation project; Fomo and test Granular only.",expiryq:"Contract ends November 30."},tools:{dataowner:"Sponsored external accounts require Manager approval, named sponsor, least privilege, and expiration date."},correct:"vendoracct"}]}),
S({id:"disk-encryption",cat:"Security / Hardware",subject:["Encryption says suspended","Laptop encryption protection is off"],open:["Windows says device encryption protection is suspended.","BitLocker protection looks disabled after maintenance."],priority:"Critical",
 diagnostics:[["change","Ask what maintenance/change occurred"],["assetq","Confirm managed device"],["statusq","Ask exact encryption status"]],
 fixes:[["resumeencrypt","Resume approved device encryption protection"],["esc-sec","Escalate encryption recovery/policy failure","escalate"],["leaveoff","Leave encryption disabled because laptop works","bad"]],
 causes:[
  {id:"suspended",label:"BitLocker protection left suspended after firmware maintenance",answers:{change:"Firmware was updated yesterday.",assetq:"Managed county laptop.",statusq:"Protection Off; volume is still encrypted."},tools:{device:"Volume encrypted; protectors suspended after firmware workflow."},correct:"resumeencrypt"},
  {id:"policy",label:"Encryption protector cannot resume due TPM/policy error",answers:{change:"No known maintenance.",assetq:"Managed laptop.",statusq:"Protection cannot resume; TPM error."},tools:{device:"Encryption protector resume failed due TPM attestation error."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"slow-app",cat:"Application Performance",subject:["One application is slow but computer is fine","DumbCare/Fomo takes forever to load"],open:["Everything else is fast, but one application takes minutes to open.","The app is painfully slow while the rest of my computer is normal."],priority:"Normal",
 diagnostics:[["scope","Ask whether other users see the same slowness"],["networkq","Ask whether network performance is normal"],["timing","Ask when application slowdown began"]],
 fixes:[["clearappcache","Clear the affected application's safe local cache"],["incident","Escalate shared backend performance issue","escalate"],["reimage","Reimage the whole computer","bad"]],
 causes:[
  {id:"cache",label:"Oversized/corrupt local application cache",answers:{scope:"Just me.",networkq:"Everything else is fast.",timing:"Gradually over a few weeks."},tools:{software:"Application cache 9.4 GB; repeated cache index errors."},correct:"clearappcache"},
  {id:"backend",label:"Shared application backend latency",answers:{scope:"My whole team is slow.",networkq:"Other sites are fine.",timing:"Started this morning."},tools:{service:"Application API latency above 8 seconds across users."},correct:"incident",escalation:true}
 ]}),
S({id:"fomo-guest",cat:"Fomo / External Access",subject:["Add vendor as guest to private Fomo workspace","Need external guest in Fomo"],open:["Can you add our consultant to a private Fomo workspace?","We need a vendor guest in Fomo for the project."],priority:"High",
 diagnostics:[["business","Ask project/business purpose"],["scope","Ask which workspace and duration"],["authorityq","Ask who owns the workspace"],["approvalq","Ask what approvals are already recorded"]],
 fixes:[["fomoguest","Create the approved scoped Fomo guest access"],["requestapproval","Request the next required approval"],["publiclink","Make the workspace public instead","bad"],["grantnow","Add the external guest without approval","bad"]],
 causes:[{id:"chain",label:"External Fomo access requires Manager, Application Owner, and Security approval",approvalRequired:true,approvalChain:["manager","applicationOwner","security"],approvalBehaviors:["already","slow","delegate"],answers:{business:"Approved vendor implementation project.",scope:"Project Phoenix workspace through October 31.",authorityq:"Collaboration Applications owns external guest policy."},tools:{dataowner:"Fomo external guest access is controlled by Collaboration Applications and Security."},correct:"fomoguest"}]}),
S({id:"fomo-exportall",cat:"Fomo / Data Governance",subject:["Export complete Fomo workspace history","Need all Fomo messages for review"],open:["Can you export every message and file from our Fomo workspace?","Management wants a full Fomo history export."],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask purpose of the export"],["scope","Ask workspace/date range"],["holdq","Check retention/legal status"],["approvalq","Ask what approvals are recorded"]],
 fixes:[["fomoexport","Produce approved scoped Fomo export"],["requestapproval","Request next required approval"],["exportall","Dump all Fomo data immediately","bad"],["esc-records","Escalate unclear records scope","escalate"]],
 causes:[{id:"records",label:"Full collaboration export requires Manager, Records, and workspace-owner approval",approvalRequired:true,approvalChain:["manager","records","applicationOwner"],approvalBehaviors:["quick","glacial","quick"],answers:{business:"Internal records review.",scope:"One workspace, this fiscal year.",holdq:"Records needs to determine what portions are official records."},tools:{retention:"Workspace is not under legal hold, but export/disposition remains subject to Records review."},correct:"fomoexport"}]}),
S({id:"illogic-prod-rule",cat:"IllogicManager / Change Request",subject:["Change production approval rule today","Need IllogicManager rule modified in production"],open:["Can you change this production routing rule? It is sending requests to the wrong team.","We need a production IllogicManager rule updated today."],priority:"High",
 diagnostics:[["workflow","Ask exact workflow/rule"],["impact","Ask business impact"],["approvalq","Ask what change approvals exist"],["owner","Ask application/process owner"]],
 fixes:[["changerule","Apply the approved production rule change"],["requestapproval","Request next required approval"],["editprod","Edit production directly with no approval record","bad"]],
 causes:[{id:"change",label:"Production workflow change requires Manager and Application Owner",approvalRequired:true,approvalChain:["manager","applicationOwner"],approvalBehaviors:["wrong","quick"],answers:{workflow:"PAY-EXCEPTION routing rule.",impact:"Requests are going to the old processing unit.",owner:"Workflow Systems owns the platform."},correct:"changerule"}]}),
S({id:"policy-emergency",cat:"PolicyWreck / Emergency Publication",subject:["Publish emergency policy change immediately","Need emergency PolicyWreck publication"],open:["We need an emergency policy revision published right now.","Can you bypass the usual wait and push this PolicyWreck change today?"],priority:"Critical",
 diagnostics:[["business","Ask emergency basis"],["versionq","Ask exact revision and scope"],["approvalq","Ask which approvals exist"],["owner","Ask policy owner"]],
 fixes:[["publishemergency","Publish under an approved emergency exception"],["requestapproval","Request next standard approval"],["emergencyexception","Request emergency exception"],["publish","Publish without required authority","bad"]],
 causes:[{id:"eligible",label:"Legitimate continuity emergency with formal exception path",approvalRequired:true,approvalChain:["manager","applicationOwner"],approvalBehaviors:["glacial","quick"],emergencyEligible:true,emergencyOutcome:"approved",answers:{business:"A mandatory operating procedure changed because the old process is unavailable today.",versionq:"Emergency revision 12.1, one section only.",owner:"Governance Systems and Operations."},correct:"publishemergency"}]}),
S({id:"granular-pii-export",cat:"Granular / Sensitive Export",subject:["Need detailed PII export from Granular","Export employee identifiers and contact data"],open:["I need a Granular export with employee identifiers, addresses, and contact fields.","Can you export the detailed workforce table for an analysis?"],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask business purpose"],["scope","Ask minimum fields/date range"],["authorityq","Ask data role"],["approvalq","Ask recorded approvals"]],
 fixes:[["exportpii","Provide approved minimum-necessary sensitive export"],["requestapproval","Request next required approval"],["exportall","Export every sensitive field","bad"],["esc-data","Escalate unsupported purpose","escalate"]],
 causes:[
  {id:"approved",label:"Sensitive export requires Manager, Data Owner, and Privacy approval",approvalRequired:true,approvalChain:["manager","dataOwner","privacy"],approvalBehaviors:["quick","slow","delegate"],answers:{business:"Approved benefits reconciliation project.",scope:"Employee ID, work location, benefit status; home address is not actually needed.",authorityq:"Workforce analyst."},correct:"exportpii"},
  {id:"conflict",label:"Manager supports request but Privacy denies excessive scope",approvalRequired:true,approvalChain:["manager","privacy"],approvalBehaviors:["already","deny"],answers:{business:"I want a complete copy to explore possible trends.",scope:"All fields, all years.",authorityq:"General analyst."},correct:"esc-data",escalation:true}
 ]}),
S({id:"peoplechock-bulk",cat:"PeopleChock / HR Change",subject:["Bulk change supervisors in PeopleChock","Need 80 reporting lines updated"],open:["Can IT bulk-change the supervisor field for about 80 employees?","We reorganized and need PeopleChock reporting lines updated in bulk."],priority:"High",dataGovernance:true,
 diagnostics:[["scope","Ask for affected employees/effective date"],["sourceq","Ask whether HR source change is authorized"],["approvalq","Ask what approvals are recorded"]],
 fixes:[["bulkhr","Process approved HR bulk change through supported workflow"],["requestapproval","Request next required approval"],["editdirect","Directly overwrite all records in production","bad"],["esc-hr","Escalate unsupported source change","escalate"]],
 causes:[{id:"chain",label:"Bulk HR master-data change requires Manager and HR Data Owner",approvalRequired:true,approvalChain:["manager","hr"],approvalBehaviors:["delegate","slow"],answers:{scope:"82 employees effective September 1.",sourceq:"Reorganization paperwork is complete."},correct:"bulkhr"}]}),
S({id:"dumbcare-breakglass",cat:"DumbCare / Emergency Access",subject:["Clinician needs emergency cross-program access","Emergency DumbCare access for patient care"],open:["A clinician needs access to another program's DumbCare record right now for urgent care.","Can we use emergency access for this clinical record?"],priority:"Critical",dataGovernance:true,
 diagnostics:[["business","Ask clinical emergency basis"],["scope","Ask exact client/program and duration"],["authorityq","Ask clinician role"],["approvalq","Check existing approvals"]],
 fixes:[["breakglass","Grant approved time-limited emergency clinical access"],["emergencyexception","Request emergency exception"],["grantnow","Give unrestricted clinical access immediately","bad"],["esc-clin","Escalate when emergency criteria are not met","escalate"]],
 causes:[{id:"eligible",label:"Time-sensitive clinical need eligible for audited break-glass authorization",approvalRequired:true,approvalChain:["manager","clinicalOwner"],approvalBehaviors:["glacial","slow"],emergencyEligible:true,emergencyOutcome:"approved",answers:{business:"Urgent treatment; primary program staff are unavailable.",scope:"One client's chart for this shift only.",authorityq:"Licensed clinician currently providing care."},correct:"breakglass"}]}),
S({id:"assethound-writeoff",cat:"AssetHound / Asset Disposition",subject:["Write off missing equipment","Mark 15 missing laptops disposed"],open:["Can you write off these missing laptops in AssetHound?","We want to mark a group of unlocated assets as disposed so they stop showing on reports."],priority:"High",dataGovernance:true,
 diagnostics:[["scope","Ask asset list and last custody"],["whydelete","Ask why they should be written off"],["authorityq","Ask disposition authority"],["approvalq","Ask recorded approvals"]],
 fixes:[["writeoff","Process approved asset-loss/write-off workflow"],["requestapproval","Request next required approval"],["deleteasset","Delete the asset records","bad"],["esc-asset","Escalate unresolved custody discrepancy","escalate"]],
 causes:[{id:"chain",label:"Asset write-off requires Manager and Asset Management authorization",approvalRequired:true,approvalChain:["manager","assetOwner"],approvalBehaviors:["quick","withdraw"],answers:{scope:"15 laptops from an old storage area.",whydelete:"We can't locate them after inventory.",authorityq:"Facilities supervisor; not Asset Management."},correct:"writeoff"}]}),
S({id:"external-forward",cat:"Email / Security Request",subject:["Forward employee mailbox to external Gmail","Auto-forward work mail outside organization"],open:["Can you forward my work mailbox to my personal Gmail?","I want all incoming work email copied to an external address."],priority:"High",dataGovernance:true,
 diagnostics:[["business","Ask why external forwarding is needed"],["scope","Ask what mail would be forwarded"],["approvalq","Ask security/manager authorization"]],
 fixes:[["approvedforward","Configure an explicitly approved scoped forwarding exception"],["requestapproval","Request next required approval"],["forwardall","Forward all mail externally now","bad"],["esc-sec","Escalate unsupported external forwarding","escalate"]],
 causes:[
  {id:"exception",label:"Narrow approved continuity exception requires Manager and Security",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["slow","delegate"],emergencyEligible:true,answers:{business:"Temporary continuity plan during an approved migration.",scope:"Automated notifications only, not general mailbox content."},correct:"approvedforward"},
  {id:"personal",label:"Personal convenience is not a valid basis for unrestricted external forwarding",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["already","deny"],answers:{business:"It's easier to read everything in my personal account.",scope:"All mail."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"service-account",cat:"Identity / Service Account",subject:["Create a service account for automation","Need non-person account for integration"],open:["Can you make us a service account for an automation?","Our integration needs a non-person account and credential."],priority:"High",
 diagnostics:[["business","Ask application/business purpose"],["scope","Ask permissions and credential usage"],["owner","Ask technical/business owner"],["approvalq","Ask recorded approvals"]],
 fixes:[["createsvc","Create approved least-privilege service account"],["requestapproval","Request next required approval"],["personalacct","Use an employee's personal account for the integration","bad"],["grantadmin","Give the service account broad admin rights","bad"]],
 causes:[{id:"chain",label:"Service account requires Manager, Application Owner, and Security approval",approvalRequired:true,approvalChain:["manager","applicationOwner","security"],approvalBehaviors:["quick","delegate","slow"],answers:{business:"Nightly approved data exchange.",scope:"Read one API endpoint and write to one staging queue.",owner:"Integration team."},correct:"createsvc"}]}),
S({id:"api-key",cat:"Application / API Access",subject:["Need production API key","Generate API credential for vendor integration"],open:["Can you generate a production API key for our integration?","The vendor needs an API credential to connect to the application."],priority:"High",
 diagnostics:[["business","Ask integration purpose"],["scope","Ask requested API scopes"],["owner","Ask application owner"],["approvalq","Ask recorded approvals"]],
 fixes:[["issueapi","Issue approved scoped API credential"],["requestapproval","Request next required approval"],["masterkey","Send a master API key by email","bad"],["esc-sec","Escalate excessive API scope","escalate"]],
 causes:[
  {id:"valid",label:"Production API credential requires Application Owner and Security",approvalRequired:true,approvalChain:["applicationOwner","security"],approvalBehaviors:["slow","quick"],answers:{business:"Approved interface between two internal systems.",scope:"Read-only case-status endpoint.",owner:"Application team owns the API."},correct:"issueapi"},
  {id:"broad",label:"Requested all-access API credential exceeds approved purpose",approvalRequired:true,approvalChain:["applicationOwner","security"],approvalBehaviors:["already","deny"],answers:{business:"Vendor says all scopes are easier.",scope:"Admin, user management, export, delete — everything.",owner:"Application team."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"software-purchase",cat:"Software / Procurement Request",subject:["Buy licenses for new software","Need 25 seats of an application"],open:["Can IT buy 25 licenses for this software?","Our team wants a new application subscription."],priority:"Low",
 diagnostics:[["business","Ask exactly which software product they want to purchase and why"],["licenseq","Ask quantity/cost estimate"],["approvalq","Ask budget/Manager approval"],["securityq","Ask whether software review is complete"]],
 fixes:[["purchaseapp","Proceed with approved software acquisition workflow"],["requestapproval","Request next required approval"],["buycard","Buy it immediately on a personal/department card","bad"]],
 causes:[{id:"chain",label:"Software acquisition requires Manager, Procurement, and Application/Security review",approvalRequired:true,approvalChain:["manager","procurement","security"],approvalBehaviors:["quick","glacial","delegate"],answers:{business:"Specialized diagramming tool not in current catalog.",licenseq:"25 seats, about $8,000 annually.",securityq:"Security review has not been completed yet."},correct:"purchaseapp"}]}),
S({id:"hardware-exception",cat:"Equipment / Exception Request",subject:["Need nonstandard laptop model","Request hardware outside standard catalog"],open:["Can I get this specific nonstandard laptop instead of the fleet model?","I need a hardware exception for my work."],priority:"Normal",
 diagnostics:[["need","Ask workload/technical requirement"],["current","Ask why standard equipment is insufficient"],["approvalq","Ask recorded approvals"]],
 fixes:[["hardwareexception","Approve/order supported nonstandard hardware exception"],["requestapproval","Request next required approval"],["buyrandom","Order requested consumer laptop immediately","bad"]],
 causes:[{id:"chain",label:"Nonstandard hardware requires Manager and Procurement/Asset approval",approvalRequired:true,approvalChain:["manager","procurement","assetOwner"],approvalBehaviors:["wrong","quick","slow"],answers:{need:"GPU compute workload validated by application team.",current:"Standard model cannot run the supported workload."},correct:"hardwareexception"}]}),
S({id:"backup-delete",cat:"Backup / Records Governance",subject:["Delete old backup copies now","Purge historical backups for storage"],open:["Can we delete the old backups for this department to free space?","Please purge the historical backup set. We don't need it anymore."],priority:"High",dataGovernance:true,
 diagnostics:[["scope","Ask systems/date ranges"],["whydelete","Ask reason for purge"],["holdq","Check retention/legal holds"],["approvalq","Ask disposition approvals"]],
 fixes:[["purgebackup","Perform approved backup disposition after retention review"],["requestapproval","Request next required approval"],["delete-now","Delete backup media immediately","bad"],["esc-records","Escalate retention conflict","escalate"]],
 causes:[
  {id:"eligible",label:"Expired backup set can be disposed after Records and Infrastructure approval",approvalRequired:true,approvalChain:["records","applicationOwner"],approvalBehaviors:["slow","quick"],answers:{scope:"Retired test environment backups older than retention schedule.",whydelete:"Storage reclamation.",holdq:"No hold is listed."},correct:"purgebackup"},
  {id:"hold",label:"Backup set contains material subject to preservation hold",approvalRequired:true,approvalChain:["manager","records","legal"],approvalBehaviors:["already","quick","deny"],answers:{scope:"Department file backups from last year.",whydelete:"Storage is tight.",holdq:"There may be a litigation hold."},correct:"esc-records",escalation:true}
 ]}),
S({id:"hold-release",cat:"Legal / Records Authority",subject:["Legal hold is over — delete the data","Release preservation hold and purge records"],open:["The case is done. Can you release the legal hold and delete everything now?","We don't need the preserved records anymore, right?"],priority:"High",dataGovernance:true,
 diagnostics:[["caseid","Ask hold/case identifier"],["authorityq","Ask who authorized release"],["holdq","Verify hold status in Records/Legal workflow"],["approvalq","Ask recorded disposition approvals"]],
 fixes:[["releasehold","Release hold and execute approved disposition"],["requestapproval","Request next required approval"],["delete-now","Delete preserved records based on user's statement","bad"],["esc-records","Escalate when Legal release is not documented","escalate"]],
 causes:[{id:"release",label:"Only Records/Legal can formally release preservation hold",approvalRequired:true,approvalChain:["records","legal"],approvalBehaviors:["quick","glacial"],answers:{caseid:"HOLD-8821.",authorityq:"Our project manager said the lawsuit is finished.",holdq:"I haven't seen the formal release."},correct:"releasehold"}]}),
S({id:"vendor-prod-admin",cat:"Vendor / Privileged Access",subject:["Vendor needs production admin today","Grant consultant administrator access"],open:["Our vendor needs production administrator access to troubleshoot right now.","Can you give the consultant full admin until they fix the issue?"],priority:"Critical",
 diagnostics:[["business","Ask incident/business basis"],["scope","Ask exact privileges/duration"],["approvalq","Ask recorded approvals"],["owner","Ask system owner"]],
 fixes:[["vendoradmin","Grant approved time-limited vendor privilege"],["requestapproval","Request next required approval"],["emergencyexception","Request emergency exception"],["esc-sec","Decline permanent vendor admin and escalate to Security","escalate"],["grantadmin","Give permanent unrestricted admin","bad"]],
 causes:[
  {id:"eligible",label:"Critical vendor support can use audited emergency privileged-access path",approvalRequired:true,approvalChain:["manager","applicationOwner","security"],approvalBehaviors:["glacial","slow","slow"],emergencyEligible:true,emergencyOutcome:"approved",answers:{business:"Production outage with vendor actively engaged.",scope:"Admin on one application node for two hours.",owner:"Application team is on the incident bridge."},correct:"vendoradmin"},
  {id:"nope",label:"Convenience request for permanent vendor admin is not justified",approvalRequired:true,approvalChain:["applicationOwner","security"],approvalBehaviors:["already","deny"],answers:{business:"So they don't have to ask us next time.",scope:"Permanent full admin.",owner:"Application team."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"hr-reporting-temp",cat:"PeopleChock / Delegation",subject:["Acting manager needs approvals while boss is out","Temporary approval delegation in PeopleChock"],open:["Our Manager is out for three weeks. Can the acting manager approve PeopleChock requests?","We need approval authority delegated while the Manager is on leave."],priority:"Normal",
 diagnostics:[["delegateq","Ask who is formally acting"],["timing","Ask delegation dates"],["approvalq","Check whether delegation is recorded"]],
 fixes:[["setdelegation","Configure documented temporary approval delegation"],["requestapproval","Request formal delegation approval"],["grantnow","Just give the supervisor Manager permissions","bad"]],
 causes:[{id:"delegation",label:"Temporary approval authority requires recorded delegation",approvalRequired:true,approvalChain:["manager","hr"],approvalBehaviors:["delegate","quick"],answers:{delegateq:"The acting manager is named in the leave coverage memo.",timing:"September 3 through September 24."},correct:"setdelegation"}]}),
S({id:"granular-delete-prod",cat:"Granular / Data Deletion",subject:["Delete bad production import","Purge incorrect production dataset batch"],open:["A production import loaded bad records into Granular. Can we delete the batch?","We need a bad production load removed without deleting valid history."],priority:"Critical",dataGovernance:true,
 diagnostics:[["scope","Ask batch/dataset scope"],["whydelete","Ask nature of bad data"],["holdq","Check retention/audit requirements"],["approvalq","Ask recorded approvals"]],
 fixes:[["purgebatch","Execute approved scoped production-data correction"],["requestapproval","Request next required approval"],["delete-all","Delete the entire production dataset","bad"],["esc-data","Escalate unclear correction scope","escalate"]],
 causes:[{id:"chain",label:"Production data purge requires Manager, Data Owner, and Records approval",approvalRequired:true,approvalChain:["manager","dataOwner","records"],approvalBehaviors:["quick","withdraw","slow"],answers:{scope:"Batch PROD-991 only; 1,824 duplicates.",whydelete:"Duplicate load from a failed integration retry.",holdq:"Audit history must remain."},correct:"purgebatch"}]}),
S({id:"recording-retention",cat:"Conferencing / Privacy",subject:["Delete meeting recording with employee discussion","Remove Webex-style recording immediately"],open:["Can you permanently delete this meeting recording? It contains a sensitive employee discussion.","We need a conference recording removed from the system."],priority:"High",dataGovernance:true,
 diagnostics:[["scope","Ask meeting/recording identifier"],["whydelete","Ask reason for deletion"],["authorityq","Ask meeting/data owner"],["approvalq","Ask Privacy/Records approvals"]],
 fixes:[["deleterecording","Perform approved recording disposition"],["requestapproval","Request next required approval"],["delete-now","Delete recording immediately","bad"],["esc-privacy","Escalate privacy/records conflict","escalate"]],
 causes:[
  {id:"eligible",label:"Recording can be deleted after Manager, Privacy, and Records review",approvalRequired:true,approvalChain:["manager","privacy","records"],approvalBehaviors:["quick","delegate","slow"],answers:{scope:"Recording MTG-44012.",whydelete:"Accidental recording of a confidential personnel discussion.",authorityq:"Meeting owner submitted the request."},correct:"deleterecording"},
  {id:"investigation",label:"Recording must be preserved for active HR investigation",approvalRequired:true,approvalChain:["manager","privacy","records"],approvalBehaviors:["already","quick","deny"],answers:{scope:"MTG-28810.",whydelete:"People are uncomfortable that it exists.",authorityq:"Department supervisor."},tools:{retention:"Recording is identified in an active HR investigation preservation notice."},correct:"esc-privacy",escalation:true}
 ]}),
S({id:"shared-account",cat:"Identity / Security Request",subject:["Create one shared login for the whole team","Need generic team username/password"],open:["Can you create one account everybody on our team can use?","We want a generic login so we don't have to manage individual permissions."],priority:"Normal",
 diagnostics:[["business","Ask why individual accounts do not work"],["scope","Ask systems/privileges"],["approvalq","Ask security/application authorization"]],
 fixes:[["managedshared","Create an approved managed non-person identity when policy permits"],["requestapproval","Request next required approval"],["genericpassword","Create generic shared username/password and email it to everyone","bad"],["esc-sec","Escalate unsupported shared-account model","escalate"]],
 causes:[
  {id:"service",label:"A controlled non-person service identity may be permitted for kiosk use",approvalRequired:true,approvalChain:["applicationOwner","security"],approvalBehaviors:["slow","quick"],answers:{business:"Fixed reception kiosk with no individual workflow.",scope:"Read-only queue display."},correct:"managedshared"},
  {id:"team",label:"Generic shared credentials are inappropriate for normal staff activity",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["already","deny"],answers:{business:"It's easier than giving each staff member access.",scope:"Full case-management access."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"policy-exception",cat:"Security / Policy Exception",subject:["Need exception to security policy","Can we temporarily bypass a control?"],open:["We need an exception to a security control for this project.","Can IT turn off this restriction for our team for a month?"],priority:"High",
 diagnostics:[["business","Ask business justification"],["scope","Ask exactly which security control/restriction they want changed and for how long"],["workaround","Ask whether compliant alternative exists"],["approvalq","Ask recorded approvals"]],
 fixes:[["policyexception","Implement approved time-limited policy exception"],["requestapproval","Request next required approval"],["disablepolicy","Disable the control globally","bad"],["esc-sec","Escalate unacceptable exception","escalate"]],
 causes:[
  {id:"valid",label:"Narrow security exception requires Manager and Security approval",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["quick","withdraw"],answers:{business:"Legacy vendor tool during a 30-day migration.",scope:"One managed device, one blocked protocol, 30 days.",workaround:"No supported alternative during migration."},correct:"policyexception"},
  {id:"bad",label:"Requested broad exception creates unacceptable risk",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["already","deny"],answers:{business:"People dislike MFA prompts.",scope:"Turn MFA off for the entire department.",workaround:"No technical need; convenience only."},correct:"esc-sec",escalation:true}
 ]}),
S({id:"archive-restore",cat:"Records / Data Restore Request",subject:["Restore archived records into production","Need old archived dataset brought back"],open:["Can you restore this archived dataset back into production?","We need records from long-term archive loaded into the live system."],priority:"Normal",dataGovernance:true,
 diagnostics:[["scope","Ask archive set/date/system"],["business","Ask why production restore is needed"],["holdq","Check disposition/status"],["approvalq","Ask owner/Manager approvals"]],
 fixes:[["restorearchive","Restore approved archive subset to controlled location"],["requestapproval","Request next required approval"],["restoreall","Restore entire archive directly over production","bad"],["esc-records","Escalate uncertain archive authority","escalate"]],
 causes:[{id:"chain",label:"Archive restore requires Manager, Data Owner, and Records approval",approvalRequired:true,approvalChain:["manager","dataOwner","records"],approvalBehaviors:["wrong","slow","quick"],answers:{scope:"FY2022 project records only.",business:"Approved audit response.",holdq:"Archive remains retained."},correct:"restorearchive"}]}),
S({id:"asset-transfer-exec",cat:"AssetHound / Executive Request",subject:["Executive says transfer asset without paperwork","Move equipment based on verbal request"],open:["The director told me to give this laptop to another employee. Can you just transfer it in AssetHound?","Leadership already said this equipment move is fine, so we don't need the normal paperwork, right?"],priority:"Normal",
 diagnostics:[["assetq","Ask asset tag and current custodian"],["authorityq","Ask who actually owns custody"],["approvalq","Verify required transfer approval"]],
 fixes:[["transferassets","Process transfer once proper custody approval is recorded"],["requestapproval","Request next required approval"],["grantnow","Treat executive verbal instruction as sufficient system authorization","bad"]],
 causes:[{id:"wrongauthority",label:"Executive preference does not replace required custody-owner approval workflow",approvalRequired:true,approvalChain:["manager","assetOwner"],approvalBehaviors:["wrong","quick"],answers:{assetq:"LT-99210 assigned to Planning.",authorityq:"Planning owns custody, but the director told us to move it."},correct:"transferassets"}]}),
S({id:"dumbcare-vendor-data",cat:"DumbCare / External Data",subject:["Send clinical extract to vendor support","Vendor wants production sample data"],open:["The DumbCare vendor wants a production data sample to troubleshoot an issue.","Can we send the vendor a small clinical database extract?"],priority:"Critical",dataGovernance:true,
 diagnostics:[["business","Ask troubleshooting purpose"],["scope","Ask exact fields/records"],["authorityq","Ask data-sharing/vendor authorization"],["approvalq","Ask recorded approvals"]],
 fixes:[["clinicalexport","Provide approved minimum-necessary protected support extract"],["requestapproval","Request next required approval"],["exportall","Send full production database copy","bad"],["esc-privacy","Escalate unsupported disclosure","escalate"]],
 causes:[
  {id:"valid",label:"Protected vendor support data requires Manager, Clinical Owner, Privacy, and Security approval",approvalRequired:true,approvalChain:["manager","clinicalOwner","privacy","security"],approvalBehaviors:["quick","slow","delegate","quick"],answers:{business:"Active severity-one vendor case.",scope:"Five affected records with identifiers minimized.",authorityq:"Vendor contract includes approved support data handling."},correct:"clinicalexport"},
  {id:"invalid",label:"Vendor request lacks authorization for broad production extract",approvalRequired:true,approvalChain:["clinicalOwner","privacy"],approvalBehaviors:["already","deny"],answers:{business:"Vendor said a full database would be easiest.",scope:"Everything.",authorityq:"I haven't checked the data-sharing terms."},correct:"esc-privacy",escalation:true}
 ]}),
S({id:"approval-conflict",cat:"Approval / Authority Conflict",subject:["Supervisor says yes, Data Owner says no","Whose approval actually controls this request?"],open:["My supervisor told me this was approved, but the system owner says no. Can you just go with my supervisor?","I'm getting conflicting answers about whether this access should be granted."],priority:"High",
 diagnostics:[["business","Ask exactly which system/access/action is being requested"],["authorityq","Ask roles of people giving instructions"],["approvalq","Check authoritative workflow history"]],
 fixes:[["esc-authority","Escalate unresolved authority conflict to controlling owner/governance","escalate"],["grantnow","Follow whichever person sounds most senior","bad"],["requestapproval","Request next required approval"]],
 causes:[{id:"conflict",label:"Manager approval cannot override controlling Data Owner denial",approvalRequired:true,approvalChain:["manager","dataOwner"],approvalBehaviors:["already","deny"],answers:{business:"Access to restricted financial dataset.",authorityq:"My Manager approved it; the Finance Data Owner rejected it."},correct:"esc-authority",escalation:true}]}),
S({id:"emergency-vpn",cat:"VPN / Emergency Exception",subject:["Critical remote worker needs VPN exception","Emergency remote access while standard approval is unavailable"],open:["A critical on-call employee needs remote access, but their Manager is unreachable.","Can we use the emergency VPN approval path?"],priority:"Critical",
 diagnostics:[["business","Ask operational emergency"],["scope","Ask exact access and duration"],["approvalq","Check standard approval state"],["identity","Confirm requester/user identity"]],
 fixes:[["vpnexception","Grant approved time-limited emergency VPN access"],["emergencyexception","Request emergency exception"],["grantnow","Enable permanent VPN access with no approval","bad"]],
 causes:[{id:"eligible",label:"Defined continuity event allows Duty Manager/Security emergency approval",approvalRequired:true,approvalChain:["manager","security"],approvalBehaviors:["glacial","slow"],emergencyEligible:true,emergencyOutcome:"approved",answers:{business:"On-call response to a production outage.",scope:"VPN access through end of shift only.",identity:"Identity is verified."},correct:"vpnexception"}]}),
S({id:"approval-withdrawal",cat:"Access Request / Changed Circumstances",subject:["Access was approved, then project assignment changed","Manager approved this yesterday but changed their mind"],open:["My access request was approved yesterday. Can you finish it?","I had approval, although my project assignment might be changing."],priority:"Normal",
 diagnostics:[["business","Ask current assignment/business need"],["approvalq","Verify approval is still active"],["authorityq","Ask owner of restricted access"]],
 fixes:[["grantproject","Grant access only if approvals remain active"],["requestapproval","Request/re-request required approval"],["grantnow","Use yesterday's approval without checking current status","bad"]],
 causes:[{id:"withdraw",label:"Approval may be withdrawn when business assignment changes",approvalRequired:true,approvalChain:["manager","dataOwner"],approvalBehaviors:["already","withdraw"],answers:{business:"I may be moving off the project next week.",authorityq:"Data Owner controls the restricted dataset."},correct:"grantproject"}]}),
S({id:"fomo-mentions",cat:"Fomo",subject:["Fomo mentions don't notify me","I'm missing @mentions in Fomo"],open:["People keep @mentioning me in Fomo but I don't get alerts.","Fomo says I was mentioned, but no notification ever arrives."],priority:"Normal",
 diagnostics:[["scope","Ask whether all Fomo notifications are affected"],["settingsq","Ask about workspace/channel notification settings"],["mobileq","Ask whether mobile/web notifications differ"]],
 fixes:[["mentionprefs","Restore Fomo mention notification preferences"],["incident","Escalate Fomo notification service issue","escalate"],["resetpw","Reset password","bad"]],
 causes:[
  {id:"prefs",label:"Workspace-specific mention notifications were muted",answers:{scope:"Regular direct messages still notify me.",settingsq:"This workspace says Mentions: Off.",mobileq:"Same on desktop and phone."},tools:{service:"Fomo notification service healthy."},correct:"mentionprefs"},
  {id:"service",label:"Fomo mention-notification processor degraded",answers:{scope:"Several users miss only @mention alerts.",settingsq:"Settings are normal.",mobileq:"Missing everywhere."},tools:{service:"Fomo mention-event processor queue is delayed."},correct:"incident",escalation:true}
 ]}),
S({id:"fomo-preview",cat:"Fomo",subject:["Files won't preview in Fomo","Fomo attachment preview is blank"],open:["Files upload to Fomo but the preview is blank.","I can download Fomo attachments, but preview never loads."],priority:"Normal",
 diagnostics:[["filetype","Ask which file types fail"],["scope","Ask whether coworkers see the same issue"],["browserq","Ask whether another browser/app works"]],
 fixes:[["previewcache","Refresh Fomo preview/cache component"],["incident","Escalate Fomo preview service outage","escalate"],["deletefile","Delete and re-upload all files without preserving originals","bad"]],
 causes:[
  {id:"local",label:"Stale local Fomo preview cache",answers:{filetype:"PDF and Office files.",scope:"Coworkers can preview the same files.",browserq:"The mobile app previews them."},tools:{software:"Fomo local preview cache has repeated renderer errors."},correct:"previewcache"},
  {id:"service",label:"Fomo document-preview service outage",answers:{filetype:"Everything.",scope:"Nobody can preview files.",browserq:"Same in every client."},tools:{service:"Fomo document preview service unavailable."},correct:"incident",escalation:true}
 ]}),
S({id:"illogic-duplicate",cat:"IllogicManager",subject:["IllogicManager created duplicate requests","Every submission appears twice"],open:["Every IllogicManager request I submit appears twice.","The workflow generated duplicate tickets from one submission."],priority:"High",
 diagnostics:[["scope","Ask whether duplicates affect all workflow types"],["workflow","Ask for example request IDs"],["clickq","Ask whether user submitted more than once"]],
 fixes:[["dedupehook","Correct duplicate submission integration hook"],["incident","Escalate platform-wide duplication","escalate"],["deleteboth","Delete both requests and tell user to start over","bad"]],
 causes:[
  {id:"hook",label:"One workflow has duplicate submission automation enabled",answers:{scope:"Only Facilities Exception.",workflow:"REQ-4412 and REQ-4413 have identical timestamps.",clickq:"I clicked Submit once."},tools:{software:"Facilities Exception workflow has two active create-record hooks."},correct:"dedupehook"},
  {id:"platform",label:"IllogicManager platform duplicated submissions across workflows",answers:{scope:"Several workflow types.",workflow:"Many paired IDs.",clickq:"Multiple users report one click."},tools:{service:"IllogicManager submission API reports duplicate event processing."},correct:"incident",escalation:true}
 ]}),
S({id:"illogic-attachment",cat:"IllogicManager",subject:["Attachment vanished from workflow","Can't open files attached to IllogicManager request"],open:["The approval request is there, but its attachment disappeared.","IllogicManager says the attachment can't be found."],priority:"Normal",
 diagnostics:[["workflow","Ask for workflow/request ID"],["scope","Ask whether other attachments work"],["uploadq","Ask whether file upload completed successfully"]],
 fixes:[["reattach","Restore/re-attach the verified source document"],["incident","Escalate attachment storage outage","escalate"],["approveblind","Approve workflow without reviewing required attachment","bad"]],
 causes:[
  {id:"failed",label:"Original attachment upload failed before workflow submission",answers:{workflow:"REQ-77119.",scope:"Other request attachments work.",uploadq:"I remember the upload spinner never fully finished."},tools:{service:"Attachment service healthy; no file object exists for REQ-77119."},correct:"reattach"},
  {id:"storage",label:"IllogicManager attachment store unavailable",answers:{workflow:"Many requests.",scope:"Nobody can open attachments.",uploadq:"Old attachments fail too."},tools:{service:"IllogicManager attachment object store degraded."},correct:"incident",escalation:true}
 ]}),
S({id:"policy-comments",cat:"PolicyWreck",subject:["PolicyWreck review comments disappeared","Can't see reviewer comments"],open:["PolicyWreck says there are review comments but I can't see them.","All the comments vanished from the policy review screen."],priority:"Normal",
 diagnostics:[["versionq","Ask which policy/version"],["roleq","Ask review role"],["browserq","Ask whether comments appear in another client"]],
 fixes:[["reviewfilter","Clear the hidden/resolved-comment filter"],["esc-gov","Escalate missing review data to Governance Systems","escalate"],["publish","Publish without reading the comments","bad"]],
 causes:[
  {id:"filter",label:"Review view is filtering all resolved/unresolved comment threads",answers:{versionq:"Policy 14.3 draft.",roleq:"Policy coordinator.",browserq:"Same account shows comments if I reset the review filters."},tools:{software:"PolicyWreck saved filter: Comment visibility = None."},correct:"reviewfilter"},
  {id:"data",label:"PolicyWreck review-comment data failed to load",answers:{versionq:"Several policies.",roleq:"Different reviewers.",browserq:"Same everywhere."},tools:{service:"PolicyWreck review-comment API errors elevated."},correct:"esc-gov",escalation:true}
 ]}),
S({id:"policy-owner-change",cat:"PolicyWreck / Access Request",subject:["Change policy owner after reorganization","PolicyWreck still lists former owner"],open:["The old manager is still listed as policy owner in PolicyWreck.","Can you transfer policy ownership to our new manager?"],priority:"Normal",
 diagnostics:[["owner","Ask current and proposed policy owner"],["sourceq","Ask whether organizational change is effective"],["approvalq","Ask for ownership-transfer approval"]],
 fixes:[["transferpolicy","Transfer approved policy ownership while preserving history"],["requestapproval","Request required Manager/Governance approval"],["editdirect","Directly overwrite policy ownership with no workflow","bad"]],
 causes:[{id:"approval",label:"Policy ownership transfer requires Manager and Governance approval",approvalRequired:true,approvalChain:["manager","applicationOwner"],answers:{owner:"Old owner left the unit; new manager is taking responsibility.",sourceq:"Reorganization is already effective."},correct:"transferpolicy"}]}),
S({id:"granular-savedview",cat:"Granular",subject:["Granular dashboard always opens with wrong filter","Saved view is stuck on old region"],open:["Granular keeps opening my dashboard with an old filter.","Every time I open the dashboard it jumps back to last quarter."],priority:"Low",
 diagnostics:[["filters","Ask current saved filter/view"],["others","Ask whether other users see the same default"],["browserq","Ask whether reset/new view behaves normally"]],
 fixes:[["resetsavedview","Reset the user's saved Granular view"],["incident","Escalate shared dashboard configuration issue","escalate"],["delete-dashboard","Delete the shared dashboard and recreate it","bad"]],
 causes:[
  {id:"personal",label:"Personal saved view overrides dashboard defaults",answers:{filters:"My saved view is named Q2 North.",others:"Coworkers open the current view.",browserq:"A new private window still loads my saved account view."},tools:{account:"Granular user preference points to saved view Q2 North."},correct:"resetsavedview"},
  {id:"shared",label:"Shared dashboard default configuration changed incorrectly",answers:{filters:"No personal saved view.",others:"Everyone gets last quarter.",browserq:"Same for multiple accounts."},tools:{service:"Shared dashboard default parameter points to retired period."},correct:"incident",escalation:true}
 ]}),
S({id:"granular-timeout",cat:"Granular",subject:["Large Granular export times out","Export fails around 80 percent"],open:["My Granular export runs forever and then times out.","The detailed CSV export gets most of the way through and fails."],priority:"Normal",
 diagnostics:[["scope","Ask export size/fields/date range"],["smallerq","Ask whether a smaller filtered export succeeds"],["error","Request export job error"]],
 fixes:[["scopedexport","Reduce export to approved necessary scope / split job"],["incident","Escalate export service failure","escalate"],["exportall","Keep retrying the full unrestricted dataset","bad"]],
 causes:[
  {id:"size",label:"Export exceeds interactive job size but can be safely scoped",answers:{scope:"Eight years, all columns, about 4 million rows.",smallerq:"One fiscal year succeeds.",error:"Interactive export size/time limit exceeded."},tools:{service:"Granular healthy; requested job exceeds interactive export threshold."},correct:"scopedexport"},
  {id:"service",label:"Granular export workers failing even on small jobs",answers:{scope:"Only 2,000 rows.",smallerq:"Tiny exports fail too.",error:"Worker unavailable."},tools:{service:"Granular export workers degraded."},correct:"incident",escalation:true}
 ]}),
S({id:"people-contact",cat:"PeopleChock",subject:["My emergency contact is wrong","Need personal contact data corrected"],open:["PeopleChock has the wrong emergency contact for me.","My own phone number/address is outdated in PeopleChock."],priority:"Low",
 diagnostics:[["fieldq","Ask which personal fields are incorrect"],["selfservice","Ask whether employee self-service permits update"],["sourceq","Ask whether HR source matches"]],
 fixes:[["selfupdate","Guide user through authorized self-service update"],["esc-hr","Escalate locked source field to HR","escalate"],["editdirect","Edit HR master data directly as Service Desk","bad"]],
 causes:[
  {id:"self",label:"Employee can update permitted personal-contact field in self-service",answers:{fieldq:"My personal phone number.",selfservice:"There is an Edit Contact Information option.",sourceq:"PeopleChock is the self-service source for that field."},correct:"selfupdate"},
  {id:"locked",label:"Requested legal-address field is controlled by HR source workflow",answers:{fieldq:"Legal home address for payroll.",selfservice:"That field is locked.",sourceq:"HR says I need to submit their change form."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"people-photo",cat:"PeopleChock",subject:["Wrong profile photo in PeopleChock","My employee photo belongs to someone else"],open:["PeopleChock is showing somebody else's photo on my profile.","My directory photo changed to the wrong person."],priority:"Normal",
 diagnostics:[["personid","Confirm employee ID"],["scope","Ask whether photo is wrong in other directory apps"],["sourceq","Ask where profile photo is sourced"]],
 fixes:[["photosync","Correct/re-sync the verified employee photo mapping"],["esc-hr","Escalate source identity/photo mismatch","escalate"],["swapphoto","Upload a random replacement image without verification","bad"]],
 causes:[
  {id:"mapping",label:"Photo object mapped to wrong employee ID during sync",answers:{personid:"Employee 33019.",scope:"Fomo also picked up the wrong photo.",sourceq:"HR directory is the authoritative photo source."},tools:{directory:"Employee 33019 references another employee's photo object ID."},correct:"photosync"},
  {id:"source",label:"Authoritative HR directory itself has incorrect photo",answers:{personid:"Employee 18802.",scope:"Wrong everywhere.",sourceq:"HR source itself is wrong."},correct:"esc-hr",escalation:true}
 ]}),
S({id:"dumbcare-timeout",cat:"DumbCare",subject:["DumbCare logs me out constantly","Clinical app session expires every few minutes"],open:["DumbCare logs me out every five minutes.","I keep losing my place because the clinical app session expires."],priority:"High",
 diagnostics:[["scope","Ask whether coworkers are affected"],["timing","Ask exact timeout interval"],["browserq","Ask whether another supported client behaves the same"]],
 fixes:[["sessioncache","Clear/re-establish the user's corrupted DumbCare session state"],["incident","Escalate platform session-service fault","escalate"],["disabletimeout","Disable clinical session security timeout globally","bad"]],
 causes:[
  {id:"user",label:"Corrupt local DumbCare session token/cookie state",answers:{scope:"Only me.",timing:"About five minutes, sometimes immediately.",browserq:"A fresh browser profile works normally."},tools:{service:"DumbCare session service healthy."},correct:"sessioncache"},
  {id:"service",label:"DumbCare authentication/session service instability",answers:{scope:"Several clinicians.",timing:"Random short sessions.",browserq:"Same across devices."},tools:{service:"DumbCare session validation errors elevated."},correct:"incident",escalation:true}
 ]}),
S({id:"dumbcare-sign",cat:"DumbCare",subject:["Can't electronically sign clinical note","DumbCare Sign button is disabled"],open:["DumbCare won't let me sign my note.","The clinical note is complete but the Sign button stays disabled."],priority:"High",
 diagnostics:[["noteid","Ask note/document ID"],["validationq","Ask whether required fields are complete"],["roleq","Ask user's clinical role/signing privileges"]],
 fixes:[["completefield","Complete the missing required validation field"],["esc-clin","Escalate signing-role/credential issue","escalate"],["editdb","Mark note signed directly in database","bad"]],
 causes:[
  {id:"field",label:"Required service-location field is incomplete",answers:{noteid:"DC-771820.",validationq:"It says Service Location is required.",roleq:"My normal signing role is active."},tools:{account:"Clinical signing entitlement valid."},correct:"completefield"},
  {id:"role",label:"Clinical signing entitlement missing after role change",answers:{noteid:"DC-883104.",validationq:"All required fields complete.",roleq:"My role changed last week and I haven't signed since."},tools:{account:"DumbCare signer entitlement absent after role update."},correct:"esc-clin",escalation:true}
 ]}),
S({id:"assethound-duplicate",cat:"AssetHound",subject:["Same laptop appears twice in AssetHound","Duplicate asset record after inventory"],open:["AssetHound shows two records for one laptop.","The same serial number appears under two asset tags."],priority:"Normal",
 diagnostics:[["assetq","Ask both asset tags/serial"],["historyq","Ask when duplicate appeared"],["scope","Ask whether custody differs"]],
 fixes:[["mergeasset","Merge/correct duplicate inventory record while preserving audit history"],["esc-asset","Escalate conflicting physical custody evidence","escalate"],["deleteasset","Delete whichever record looks older without review","bad"]],
 causes:[
  {id:"duplicate",label:"Duplicate asset record created during import",answers:{assetq:"LT-55018 and LT-55018-OLD, same serial.",historyq:"After last week's migration.",scope:"Both show same custodian."},tools:{asset:"Duplicate serial detected; one record imported from legacy inventory."},correct:"mergeasset"},
  {id:"conflict",label:"Two physical devices were incorrectly recorded with same serial/tag data",answers:{assetq:"Two tags, confusing serial data.",historyq:"During inventory scan.",scope:"Different custodians and locations."},tools:{asset:"Conflicting scan/photo evidence requires physical inventory review."},correct:"esc-asset",escalation:true}
 ]}),
S({id:"assethound-location",cat:"AssetHound",subject:["AssetHound keeps changing device location","Laptop location is wrong after move"],open:["AssetHound still says my laptop is in the old building.","We moved equipment, but the inventory location never changed."],priority:"Low",
 diagnostics:[["assetq","Ask asset tag"],["locationq","Ask current verified location"],["historyq","Ask whether move/custody transfer was recorded"]],
 fixes:[["locationupdate","Update verified asset location without changing custody"],["transferassets","Process actual custody transfer if ownership changed"],["deleteasset","Delete and recreate the asset record","bad"]],
 causes:[
  {id:"location",label:"Physical location changed but custody did not",answers:{assetq:"LT-61220.",locationq:"Building B, Room 214.",historyq:"Same department/custodian, just an office move."},tools:{asset:"Custody unchanged; last verified location remains Building A."},correct:"locationupdate"},
  {id:"custody",label:"Move also transferred departmental custody",answers:{assetq:"LT-80114.",locationq:"Now in Operations.",historyq:"It was permanently transferred from Planning."},tools:{asset:"Custody owner still Planning; transfer workflow required."},correct:"transferassets"}
 ]}),
S({id:"signature",cat:"Email / Outlook",subject:["Email signature keeps disappearing","Outlook uses the wrong signature"],open:["Outlook stopped adding my email signature.","My old title is still in the signature every time I compose."],priority:"Low",
 diagnostics:[["clientq","Ask which Outlook client(s) are affected"],["signatureq","Ask current signature settings"],["sourceq","Ask whether signature is centrally managed"]],
 fixes:[["signaturefix","Correct user's supported signature setting"],["directorysync","Refresh centrally managed signature profile"],["reinstall","Reinstall Outlook immediately","bad"]],
 causes:[
  {id:"local",label:"Default signature selection reset in one client",answers:{clientq:"Desktop Outlook only.",signatureq:"Default signature is set to None.",sourceq:"We manage our own signature locally."},correct:"signaturefix"},
  {id:"central",label:"Central signature service has stale directory title",answers:{clientq:"Every client gets the same old title.",signatureq:"I can't edit the managed footer.",sourceq:"It comes from the corporate signature service."},tools:{directory:"Directory title is current; signature service cache is stale."},correct:"directorysync"}
 ]}),
S({id:"popups",cat:"Browser",subject:["Required popup won't open","Website button does nothing"],open:["I click the report button and nothing happens.","The application says it opened a window, but I don't see anything."],priority:"Normal",
 diagnostics:[["browserq","Ask browser and whether popup indicator appears"],["otherbrowser","Ask whether another supported browser works"],["site","Ask which site/application the popup should open from"]],
 fixes:[["allowpopup","Allow popups for the trusted application site only"],["incident","Escalate application-side failure","escalate"],["disablebrowsersec","Disable all browser security protections","bad"]],
 causes:[
  {id:"blocked",label:"Browser blocked required trusted-site popup",answers:{browserq:"Chrome shows a blocked-popup icon.",otherbrowser:"Edge prompts me to allow it.",site:"Approved internal reporting portal."},correct:"allowpopup"},
  {id:"app",label:"Application report action is failing server-side",answers:{browserq:"No popup indicator.",otherbrowser:"Same behavior.",site:"Approved portal."},tools:{service:"Report-launch API errors elevated."},correct:"incident",escalation:true}
 ]}),
S({id:"room-calendar",cat:"Calendar / Resource",subject:["Conference room says unavailable when empty","Can't book room that looks free"],open:["The conference room calendar says it's busy all day, but the room is empty.","I can't book a room even though nobody has it reserved."],priority:"Normal",
 diagnostics:[["roomq","Ask room/resource name"],["calendarq","Ask what calendar shows"],["others","Ask whether other users can book it"]],
 fixes:[["roomcalendar","Correct stale/resource calendar processing state"],["esc-mail","Escalate resource mailbox configuration","escalate"],["deletebookings","Delete all room bookings to free it","bad"]],
 causes:[
  {id:"stale",label:"Stale declined meeting holds remain in resource calendar cache",answers:{roomq:"Pine Conference Room.",calendarq:"Shows tentative blocks from cancelled meetings.",others:"Everyone sees it unavailable."},tools:{account:"Room mailbox contains stale processing holds after calendar migration."},correct:"roomcalendar"},
  {id:"policy",label:"Resource booking policy incorrectly restricts all requesters",answers:{roomq:"Executive Conference.",calendarq:"Looks open but booking is auto-declined.",others:"Most staff are declined."},tools:{account:"Room booking policy allows obsolete group only."},correct:"esc-mail",escalation:true}
 ]}),
S({id:"default-printer",cat:"Printer",subject:["Wrong printer is always selected","Documents keep going to another building"],open:["My computer keeps choosing the wrong default printer.","I accidentally print to the copier across campus because it keeps becoming default."],priority:"Low",
 diagnostics:[["which","Ask intended printer"],["defaultq","Ask Windows default-printer setting"],["recent","Ask whether user recently moved offices"]],
 fixes:[["setdefault","Set correct approved default printer / disable automatic default switching"],["remap","Remove obsolete printer mapping"],["esc-print","Escalate print-policy deployment issue","escalate"]],
 causes:[
  {id:"auto",label:"Windows automatic default-printer selection follows last used printer",answers:{which:"4F-COPIER-02.",defaultq:"Let Windows manage my default printer is on.",recent:"I printed at another building yesterday."},correct:"setdefault"},
  {id:"old",label:"Obsolete mapped printer remains after office move",answers:{which:"2F-COPIER-01.",defaultq:"The old printer keeps reappearing.",recent:"I changed buildings last month."},tools:{service:"Old printer mapping still delivered by stale user policy."},correct:"remap"}
 ]}),
S({id:"vpn-route",cat:"VPN / Network",subject:["VPN connects but one internal site won't open","Some internal systems work on VPN, one does not"],open:["VPN says Connected, but one internal site is unreachable.","Shared drives work over VPN, but this application doesn't."],priority:"High",
 diagnostics:[["site","Ask exact internal system"],["scope","Ask whether coworkers on VPN see same issue"],["networkq","Ask whether site works onsite"]],
 fixes:[["routefix","Refresh/correct client VPN route state"],["esc-net","Escalate missing VPN route/network policy","escalate"],["resetpw","Reset user's password","bad"]],
 causes:[
  {id:"client",label:"Client retained stale split-tunnel route after network change",answers:{site:"reports.internal.",scope:"Coworkers can reach it.",networkq:"It works onsite."},tools:{network:"VPN connected; expected reports subnet route absent locally after stale client route cache."},correct:"routefix"},
  {id:"policy",label:"VPN gateway missing route to newly added application subnet",answers:{site:"newapp.internal.",scope:"Nobody remote can reach it.",networkq:"Works onsite."},tools:{network:"VPN route table does not advertise new application subnet."},correct:"esc-net",escalation:true}
 ]}),
S({id:"offline-files",cat:"File Sync / Shared Drive",subject:["Offline files keep showing old versions","Shared folder changes don't appear"],open:["My laptop keeps showing an old copy of files when I reconnect.","A shared file is current on my desktop but stale on the laptop."],priority:"Normal",
 diagnostics:[["where","Ask whether user was working offline/remote"],["syncq","Ask Offline Files/sync status"],["serverq","Ask whether server copy is current"]],
 fixes:[["resyncoffline","Resolve offline-file sync conflict without overwriting newer server data"],["esc-file","Escalate server-side version conflict","escalate"],["overwriteprod","Overwrite server copy with stale local version","bad"]],
 causes:[
  {id:"offline",label:"Offline Files cache has unresolved synchronization conflict",answers:{where:"I worked disconnected on the laptop yesterday.",syncq:"It says Sync conflict.",serverq:"The server copy is newer."},tools:{network:"Network healthy; Offline Files reports conflict."},correct:"resyncoffline"},
  {id:"server",label:"Shared file replication itself is inconsistent",answers:{where:"Always connected.",syncq:"Offline Files is disabled.",serverq:"Different servers show different versions."},tools:{service:"File replication lag/error detected."},correct:"esc-file",escalation:true}
 ]}),
S({id:"mobile-cert",cat:"Mobile Device / Security",subject:["Work Wi-Fi certificate expired on phone","Managed phone won't join secure Wi-Fi"],open:["My managed phone says the Wi-Fi certificate is expired.","I can use cellular, but secure office Wi-Fi rejects the phone."],priority:"Normal",
 diagnostics:[["profileq","Ask device management compliance/profile status"],["scope","Ask whether other managed phones are affected"],["error","Request certificate/error details"]],
 fixes:[["renewcert","Renew device certificate through management profile"],["incident","Escalate certificate-enrollment service outage","escalate"],["publicwifi","Tell user to use an unsecured public network instead","bad"]],
 causes:[
  {id:"device",label:"Individual managed-device certificate failed renewal",answers:{profileq:"Device is compliant, but certificate shows expired yesterday.",scope:"Coworkers are fine.",error:"EAP certificate expired."},tools:{device:"MDM profile healthy; device certificate renewal pending."},correct:"renewcert"},
  {id:"service",label:"Mobile certificate enrollment service outage",answers:{profileq:"Multiple phones show renewal errors.",scope:"Several people today.",error:"Enrollment service unavailable."},tools:{service:"Mobile certificate enrollment service degraded."},correct:"incident",escalation:true}
 ]}),
S({id:"account-alias",cat:"Identity / Email",subject:["Old email address still appears","Need email alias after name change"],open:["People still see my old email address in autocomplete.","Can I keep the old address as an alias after my name change?"],priority:"Low",
 diagnostics:[["sourceq","Confirm identity/name change completed"],["scope","Ask whether old address should receive mail"],["approvalq","Ask whether standard alias policy applies"]],
 fixes:[["aliasfix","Configure supported mail alias / directory update"],["esc-id","Escalate conflicting identity naming requirement","escalate"],["newaccount","Create a second independent account just for the old address","bad"]],
 causes:[
  {id:"alias",label:"Standard old-address alias can remain after approved name change",answers:{sourceq:"HR and primary identity already show my new name.",scope:"Yes, old address should keep receiving mail during transition.",approvalq:"This is the standard name-change process."},tools:{account:"Primary email updated; legacy address available as alias."},correct:"aliasfix"},
  {id:"conflict",label:"Requested alias conflicts with another active identity",answers:{sourceq:"My name change is complete.",scope:"I want a shortened address.",approvalq:"I don't know."},tools:{account:"Requested alias is already assigned to another active user."},correct:"esc-id",escalation:true}
 ]}),
S({id:"oauth-consent",cat:"Security / Cloud Access",subject:["Unknown app has access to my account","I approved a strange OAuth request"],open:["I noticed an application I don't recognize has access to my work account.","I clicked Allow on an app consent screen and now I'm worried."],priority:"Critical",
 diagnostics:[["appq","Ask application name and permissions"],["mfaevent","Ask whether unexpected authentication occurred"],["business","Ask whether app was expected for work"]],
 fixes:[["esc-sec","Escalate suspicious OAuth consent to Security Operations","escalate"],["revokeonly","Just remove the app and ignore the security event","bad"]],
 causes:[{id:"oauth",label:"Potential malicious OAuth consent grant",answers:{appq:"Document Converter Pro wants mail and profile access.",mfaevent:"No MFA prompt, just the consent screen.",business:"I don't recognize it."},tools:{logins:"New third-party consent grant recorded from user's session."},correct:"esc-sec",escalation:true}]}),
S({id:"switch-auth",cat:"Network / Wired Access",subject:["Desk network jack suddenly rejects laptop","Wired port says authentication failed"],open:["My wired connection stopped working and says authentication failed.","The same laptop works on Wi-Fi but not the desk jack."],priority:"High",
 diagnostics:[["others","Ask whether nearby jacks/users are affected"],["deviceq","Ask whether device is managed/known"],["error","Request wired authentication error"]],
 fixes:[["esc-net","Escalate switch authentication failure to Network Engineering","escalate"],["reenroll","Re-enroll local Wi-Fi profile","bad"]],
 causes:[{id:"nac",label:"Network access-control authentication failure on switch port",answers:{others:"One other desk on the same switch has it.",deviceq:"Managed laptop.",error:"802.1X authentication timeout."},tools:{network:"Access switch reports authentication server timeout on affected ports."},correct:"esc-net",escalation:true}]}),
S({id:"dns-alias",cat:"Network / DNS",subject:["New internal hostname resolves to old server","DNS alias points to retired address"],open:["The new application name keeps sending me to the old server.","Internal DNS resolves this hostname to the wrong address."],priority:"High",
 diagnostics:[["site","Ask hostname"],["others","Ask whether all users resolve it incorrectly"],["dnsq","Ask current vs expected address"]],
 fixes:[["esc-net","Escalate authoritative DNS record issue to Network Engineering","escalate"],["hostsfile","Edit every user's hosts file manually","bad"]],
 causes:[{id:"record",label:"Authoritative DNS alias still targets retired server",answers:{site:"portal-new.internal.",others:"Everyone gets the old server.",dnsq:"It resolves to 10.8.20.14; application owner says 10.8.44.31."},tools:{network:"Authoritative CNAME target remains legacy host."},correct:"esc-net",escalation:true}]}),
S({id:"scim-delay",cat:"Identity / Provisioning",subject:["New hire still missing from application","Provisioning says pending for hours"],open:["The new employee account exists, but the application still hasn't provisioned them.","Identity provisioning has been stuck Pending all morning."],priority:"High",
 diagnostics:[["personid","Ask employee/account ID"],["scope","Ask exactly which application is missing the new employee"],["timing","Ask how long provisioning has been pending"]],
 fixes:[["esc-id","Escalate provisioning connector failure to Identity & Access","escalate"],["newaccount","Create a second manual identity","bad"]],
 causes:[{id:"connector",label:"SCIM provisioning connector queue stalled",answers:{personid:"Employee 62018.",scope:"Approved enterprise application.",timing:"About five hours."},tools:{account:"Directory identity active; provisioning connector job remains queued."},correct:"esc-id",escalation:true}]}),
S({id:"mail-quota-backend",cat:"Email / Messaging",subject:["Mailbox quota wrong after archive","Mailbox says full even after cleanup"],open:["I deleted and archived a lot of mail, but the mailbox still says full.","Outlook and webmail both show the old storage usage."],priority:"High",
 diagnostics:[["webmail","Ask whether server/webmail shows same quota"],["cleanupq","Ask when cleanup completed"],["scope","Ask whether archive/delete actually succeeded"]],
 fixes:[["esc-mail","Escalate mailbox quota recalculation to Messaging","escalate"],["deleteall","Delete more mail blindly","bad"]],
 causes:[{id:"quota",label:"Mailbox quota accounting failed to recalculate after archive operation",answers:{webmail:"Webmail shows the same old quota.",cleanupq:"Yesterday.",scope:"Items are gone and archive is present."},tools:{account:"Mailbox usage counters have not updated since archive operation."},correct:"esc-mail",escalation:true}]}),
S({id:"mailtrace-fail",cat:"Email / Messaging",subject:["Messages vanish between accepted and delivered","Mail trace shows transport failure"],open:["The sender gets no bounce, but the message never arrives.","Mail trace says Accepted and then nothing."],priority:"High",
 diagnostics:[["sender","Ask sender/recipient scope"],["timing","Ask message times"],["traceq","Ask transport trace status"]],
 fixes:[["esc-mail","Escalate transport pipeline failure to Messaging","escalate"],["resetpw","Reset recipient password","bad"]],
 causes:[{id:"transport",label:"Messaging transport pipeline drops accepted messages",answers:{sender:"Multiple internal senders to one hosted domain.",timing:"All morning.",traceq:"Accepted, then transport event missing."},tools:{service:"Messaging transport health shows queue-processing anomalies."},correct:"esc-mail",escalation:true}]}),
S({id:"driver-regression",cat:"Endpoint / Driver",subject:["Update broke network adapters on several laptops","New driver causes blue screens"],open:["Several laptops started crashing after the same driver update.","The latest managed driver seems to have broken network connectivity."],priority:"Critical",
 diagnostics:[["scope","Ask affected device models/count"],["update","Ask exact driver/update"],["timing","Ask when failures began"]],
 fixes:[["esc-hw","Escalate managed driver regression to Endpoint Engineering","escalate"],["reimage","Reimage every affected laptop immediately","bad"]],
 causes:[{id:"regression",label:"Managed driver package regression affecting a device model",answers:{scope:"About 18 identical laptops.",update:"NIC driver package 26.8.",timing:"Immediately after overnight deployment."},tools:{device:"Affected model reports same new driver version and correlated failures."},correct:"esc-hw",escalation:true}]}),
S({id:"file-acl",cat:"File / Permissions",subject:["Folder permissions keep reverting","Inherited ACLs are corrupt"],open:["We fix the folder permission and it changes back again.","A shared folder has inconsistent inherited permissions across subfolders."],priority:"High",
 diagnostics:[["path","Ask exact folder path"],["scope","Ask which users/subfolders"],["changes","Ask whether permissions were recently migrated"]],
 fixes:[["esc-file","Escalate ACL/inheritance corruption to File & Storage Services","escalate"],["everyone","Grant Everyone full control","bad"]],
 causes:[{id:"acl",label:"File-system ACL inheritance metadata is inconsistent after migration",answers:{path:"\\\\files\\programs\\active.",scope:"Several nested folders inherit differently.",changes:"The share was migrated last weekend."},tools:{service:"ACL comparison shows inconsistent inherited security descriptors."},correct:"esc-file",escalation:true}]}),
S({id:"fomo-webhook",cat:"Fomo",subject:["Fomo integration stopped posting alerts","Webhook messages disappeared"],open:["Our monitoring system stopped posting alerts into Fomo.","The Fomo webhook returns errors even though normal chat works."],priority:"High",
 diagnostics:[["scope","Ask whether ordinary Fomo messaging works"],["error","Request webhook response/error"],["timing","Ask when integration stopped"]],
 fixes:[["incident","Escalate Fomo integration service issue","escalate"],["newwebhook","Create random new webhooks until one works","bad"]],
 causes:[{id:"hooks",label:"Fomo webhook/integration service degradation",answers:{scope:"Normal chat works.",error:"HTTP 503 from webhook endpoint.",timing:"Started this morning."},tools:{service:"Fomo integration gateway error rate elevated."},correct:"incident",escalation:true}]}),
S({id:"illogic-api",cat:"IllogicManager",subject:["IllogicManager integration callbacks stopped","Workflow API events are stuck"],open:["IllogicManager completes the workflow but never calls our downstream system.","The callback queue is building up."],priority:"High",
 diagnostics:[["workflow","Ask affected workflow/integration"],["scope","Ask whether UI workflows complete normally"],["error","Request callback/API error"]],
 fixes:[["incident","Escalate IllogicManager integration queue to Workflow Systems","escalate"],["rerunall","Replay every callback without checking duplicates","bad"]],
 causes:[{id:"callback",label:"IllogicManager outbound callback processor stalled",answers:{workflow:"Several production workflows.",scope:"UI approvals finish normally.",error:"Callbacks remain Pending."},tools:{service:"Outbound integration worker queue is stalled."},correct:"incident",escalation:true}]}),
S({id:"policy-index",cat:"PolicyWreck",subject:["Published policy missing from search","PolicyWreck search index is stale"],open:["The policy is published and opens by direct link, but search can't find it.","PolicyWreck search results are missing recent publications."],priority:"Normal",
 diagnostics:[["versionq","Ask policy/version"],["scope","Ask whether other recent policies are missing"],["timing","Ask publication time"]],
 fixes:[["esc-gov","Escalate search-index failure to Governance Systems","escalate"],["republish","Keep republishing the policy repeatedly","bad"]],
 causes:[{id:"index",label:"PolicyWreck search-index worker failed after publication",answers:{versionq:"Policy 9.6.",scope:"Several policies published today.",timing:"All within the last six hours."},tools:{service:"PolicyWreck search indexing backlog is stalled."},correct:"esc-gov",escalation:true}]}),
S({id:"granular-etl-map",cat:"Granular",subject:["Granular mapped a field to the wrong column","ETL loaded values into wrong field"],open:["Granular loaded department codes into the location field.","A production ETL mapping looks wrong after last night's refresh."],priority:"Critical",dataGovernance:true,
 diagnostics:[["scope","Ask dataset/batch"],["refreshq","Ask when bad mapping appeared"],["sourceq","Ask whether source data is correct"]],
 fixes:[["esc-data","Escalate production ETL mapping failure to Data & Analytics","escalate"],["editall","Manually edit thousands of production rows","bad"]],
 causes:[{id:"mapping",label:"Production ETL transformation mapping shifted columns",answers:{scope:"WORKFORCE_CURRENT batch 7742.",refreshq:"Last night's refresh.",sourceq:"Source file columns are correct."},tools:{service:"ETL transformation version changed before batch 7742."},correct:"esc-data",escalation:true}]}),
S({id:"people-feed",cat:"PeopleChock",subject:["HR changes stopped flowing downstream","PeopleChock outbound feed stalled"],open:["PeopleChock has the correct data, but downstream systems stopped receiving changes.","New hires and transfers are no longer flowing out of PeopleChock."],priority:"Critical",
 diagnostics:[["scope","Ask which downstream systems"],["sourceq","Confirm PeopleChock source records are correct"],["timing","Ask last successful feed"]],
 fixes:[["esc-hr","Escalate outbound HR integration failure to HR Systems","escalate"],["manualall","Manually recreate every employee in downstream apps","bad"]],
 causes:[{id:"feed",label:"PeopleChock outbound integration feed stopped processing events",answers:{scope:"Directory and payroll interface.",sourceq:"PeopleChock records are correct.",timing:"Last successful run was yesterday evening."},tools:{service:"HR outbound integration queue has stopped consuming events."},correct:"esc-hr",escalation:true}]}),
S({id:"dumbcare-interface",cat:"DumbCare / Clinical Integration",subject:["Lab results stopped entering DumbCare","Clinical interface queue is backed up"],open:["Lab results are not appearing in DumbCare.","The clinical interface dashboard shows a growing queue."],priority:"Critical",
 diagnostics:[["scope","Ask affected interface/result type"],["timing","Ask when results stopped"],["others","Ask whether all clinics are affected"]],
 fixes:[["esc-clin","Escalate clinical interface queue to Clinical Applications","escalate"],["reenter","Tell clinicians to manually re-enter all lab results","bad"]],
 causes:[{id:"interface",label:"DumbCare clinical interface engine queue stalled",answers:{scope:"Inbound laboratory results.",timing:"About two hours.",others:"Multiple clinics."},tools:{service:"Clinical interface engine inbound queue is not processing."},correct:"esc-clin",escalation:true}]}),
S({id:"assethound-import",cat:"AssetHound",subject:["Inventory import stopped overnight","AssetHound hasn't ingested scanner file"],open:["AssetHound didn't import last night's inventory batch.","Scanner uploads completed, but the central inventory never changed."],priority:"High",
 diagnostics:[["scope","Ask batch/site"],["queue","Ask import job status"],["timing","Ask last successful import"]],
 fixes:[["incident","Escalate AssetHound import service to Asset Management","escalate"],["rescanall","Make staff physically rescan everything immediately","bad"]],
 causes:[{id:"import",label:"AssetHound batch import processor stalled",answers:{scope:"West campus batch 881.",queue:"Uploaded / Pending Import.",timing:"Last successful import yesterday."},tools:{service:"AssetHound batch-import worker not consuming queued files."},correct:"incident",escalation:true}]}),
S({id:"vendor-api",cat:"Vendor SaaS",subject:["Vendor API is returning 500 errors","External SaaS integration is down"],open:["The vendor website is up, but their API returns server errors.","Our SaaS integration suddenly gets HTTP 500 from the vendor."],priority:"High",
 diagnostics:[["scope","Ask whether vendor UI works"],["error","Ask exact API response"],["statusq","Ask whether vendor incident is posted"]],
 fixes:[["vendorwait","Escalate/coordinate vendor API incident through Vendor & Licensing","escalate"],["rewrite","Rewrite the integration before contacting the vendor","bad"]],
 causes:[{id:"api",label:"Vendor SaaS API outage while interactive UI remains available",answers:{scope:"Vendor UI works.",error:"HTTP 500 from production API.",statusq:"No public incident yet."},tools:{service:"Multiple internal integrations receive same vendor API failure."},correct:"vendorwait",escalation:true}]}),
S({id:"cert-chain",cat:"Platform / Certificates",subject:["Internal service certificate chain suddenly fails","Clients reject server certificate after renewal"],open:["The service certificate was renewed, but clients now reject the chain.","Browsers show an incomplete certificate chain on our internal service."],priority:"Critical",
 diagnostics:[["site","Ask exactly which service/hostname has the certificate problem"],["timing","Ask renewal/change time"],["scope","Ask whether all clients fail"]],
 fixes:[["esc-cert","Escalate certificate-chain deployment to Platform Services","escalate"],["bypasscert","Tell users to bypass certificate warnings","bad"]],
 causes:[{id:"chain",label:"Intermediate certificate omitted from production service chain",answers:{site:"api.internal.",timing:"Immediately after renewal.",scope:"All managed clients."},tools:{service:"Server presents leaf certificate without required intermediate."},correct:"esc-cert",escalation:true}]}),
S({id:"app-pool",cat:"Application / Platform",subject:["Application works briefly then returns 503","Backend connection pool is exhausted"],open:["The application works after restart and then quickly starts returning 503.","Users get intermittent server unavailable errors across the application."],priority:"Critical",
 diagnostics:[["scope","Ask whether all users are affected"],["timing","Ask whether restart temporarily helps"],["error","Request server/application error"]],
 fixes:[["esc-app","Escalate application backend failure to Enterprise Applications","escalate"],["restartloop","Schedule constant service restarts as the permanent fix","bad"]],
 causes:[{id:"pool",label:"Application backend connection pool leak/exhaustion",answers:{scope:"All users.",timing:"Restart helps for 10–15 minutes.",error:"503 / backend pool exhausted."},tools:{service:"Application health shows rapidly increasing exhausted backend connections."},correct:"esc-app",escalation:true}]}),
S({id:"fomo-rollout-profile",cat:"Fomo / Deployment",subject:["Fomo policy changed after rollout","New Fomo version reset enterprise settings"],open:["Fomo updated and now our managed settings look different.","The new Fomo build ignored our old workspace policy."],priority:"High",
 diagnostics:[["scope","Ask which settings changed"],["version","Ask Fomo version/deployment time"],["others","Ask whether multiple users are affected"]],
 fixes:[["esc-app","Escalate rollout policy regression to Collaboration Applications","escalate"],["localoverride","Manually override managed policy on each computer","bad"]],
 causes:[{id:"policy",label:"Fomo deployment applied an incorrect enterprise policy profile",answers:{scope:"Notifications and integration permissions.",version:"10.4 deployed this morning.",others:"Many users in the rollout group."},tools:{service:"Fomo 10.4 policy-profile mismatch detected for rollout ring."},correct:"esc-app",escalation:true}]}),
S({id:"newhire-license",cat:"New Employee Setup",subject:["New hire has account but no app license","New employee can't open licensed application"],open:["The new employee can sign in, but the application says they have no license.","Onboarding worked except for one required licensed app."],priority:"High",
 diagnostics:[["approval","Confirm approved onboarding request"],["licenseq","Ask required product/license"],["role","Ask job role/start date"]],
 fixes:[["assignlicense","Assign the already-approved available license"],["esc-vendor","Escalate when onboarding license pool is exhausted","escalate"],["sharelogin","Let the new hire use a coworker's licensed account","bad"]],
 causes:[
  {id:"license",label:"Approved onboarding omitted available application entitlement",answers:{approval:"The onboarding request includes the application.",licenseq:"DiagramPro seat.",role:"Analyst starting today."},tools:{software:"License pool has available seats."},correct:"assignlicense"},
  {id:"pool",label:"Approved onboarding cannot complete because license pool is exhausted",answers:{approval:"Approved.",licenseq:"DiagramPro.",role:"New analyst."},tools:{software:"0 available licenses; procurement renewal pending."},correct:"esc-vendor",escalation:true}
 ]}),
S({id:"newhire-groups",cat:"New Employee Setup / Identity",subject:["New hire missing standard access groups","Onboarding groups did not sync"],open:["The new hire has an account but none of the standard department groups.","Their onboarding workflow says complete, but access is missing."],priority:"High",
 diagnostics:[["approval","Confirm onboarding is approved"],["role","Ask department/role"],["scope","Ask which standard groups are missing"]],
 fixes:[["esc-id","Escalate provisioning group-sync failure to Identity & Access","escalate"],["grantall","Add the employee to every department group manually","bad"]],
 causes:[{id:"sync",label:"Approved onboarding group-provisioning job failed",answers:{approval:"Approved and marked complete.",role:"Finance analyst.",scope:"Department shared drive, standard Fomo, and reporting groups."},tools:{account:"Identity exists; onboarding group-provisioning child job failed."},correct:"esc-id",escalation:true}]}),
S({id:"dumbcare-maintenance",cat:"DumbCare / Maintenance",subject:["DumbCare function unavailable during maintenance","Clinical feature stopped after maintenance began"],open:["DumbCare says a backend function is temporarily unavailable.","A clinical workflow stopped working right after the maintenance window began."],priority:"Critical",
 diagnostics:[["scope","Ask affected DumbCare function"],["timing","Ask whether issue began with maintenance"],["others","Ask whether multiple clinicians are affected"]],
 fixes:[["esc-clin","Associate/escalate maintenance-related service failure to Clinical Applications","escalate"],["reinstall","Reinstall every clinician workstation","bad"]],
 causes:[{id:"service",label:"DumbCare backend service unavailable during maintenance change",answers:{scope:"Record locking and encounter save.",timing:"Exactly when maintenance started.",others:"Multiple clinics."},tools:{service:"Clinical maintenance window active; backend component health degraded."},correct:"esc-clin",escalation:true}]}),
S({id:"granular-refresh-delay",cat:"Granular / Warehouse",subject:["Today's Granular data still shows yesterday","Warehouse refresh is late"],open:["The dashboard says today's date, but all values are yesterday's.","Granular refresh time is hours later than normal."],priority:"High",
 diagnostics:[["refreshq","Ask displayed refresh timestamp"],["scope","Ask whether all dashboards are stale"],["sourceq","Ask whether source systems have current data"]],
 fixes:[["esc-data","Escalate delayed warehouse refresh to Data & Analytics","escalate"],["editreport","Manually edit dashboard values to look current","bad"]],
 causes:[{id:"warehouse",label:"Granular warehouse refresh pipeline is delayed",answers:{refreshq:"Last refresh was 11:58 PM yesterday.",scope:"Most workforce dashboards.",sourceq:"Source systems show today's updates."},tools:{service:"Warehouse refresh pipeline remains Running well past normal completion."},correct:"esc-data",escalation:true}]}),
S({id:"hr-hire-batch",cat:"PeopleChock / Onboarding",subject:["Entire new-hire batch missing downstream","Today's hires aren't provisioning"],open:["Several new employees exist in PeopleChock but aren't appearing downstream.","Today's onboarding group all seems stuck at the same step."],priority:"Critical",
 diagnostics:[["scope","Ask number of hires/systems"],["sourceq","Confirm HR records are active"],["timing","Ask last successful provisioning"]],
 fixes:[["esc-hr","Escalate batch HR feed failure to HR Systems","escalate"],["manualall","Create all employee records manually in every downstream system","bad"]],
 causes:[{id:"feed",label:"New-hire batch event failed in PeopleChock outbound feed",answers:{scope:"14 hires; directory and payroll staging.",sourceq:"All are active and correct in PeopleChock.",timing:"Yesterday's hires provisioned normally."},tools:{service:"Today's new-hire event batch is queued but not transmitted."},correct:"esc-hr",escalation:true}]}),
S({id:"wifi-maintenance",cat:"Network / Change",subject:["Site connectivity unstable during network work","Office network drops after uplink change"],open:["Our floor keeps losing connectivity during the network maintenance.","Calls and internal sites drop together every few minutes."],priority:"Critical",
 diagnostics:[["others","Ask affected area/user count"],["timing","Ask whether drops align with maintenance"],["connection","Ask whether wired and Wi-Fi are both affected"]],
 fixes:[["esc-net","Escalate maintenance-related uplink instability to Network Engineering","escalate"],["reimage","Reimage affected computers","bad"]],
 causes:[{id:"uplink",label:"Network uplink instability during active infrastructure change",answers:{others:"Most of the floor.",timing:"Started during the maintenance window.",connection:"Both wired and Wi-Fi clients drop."},tools:{network:"Site uplink flaps correlate with active change window."},correct:"esc-net",escalation:true}]}),
S({id:"printer-firmware",cat:"Printer / Change",subject:["Printer stopped after firmware update","Copier keeps rebooting after managed update"],open:["The copier started rebooting repeatedly after today's firmware update.","The printer disappeared from service immediately after firmware deployment."],priority:"High",
 diagnostics:[["which","Ask printer/device name"],["update","Ask firmware/change time"],["others","Ask whether other updated printers are affected"]],
 fixes:[["esc-hw","Escalate printer firmware regression to Endpoint & Field Services","escalate"],["factoryreset","Factory-reset every printer without preserving configuration","bad"]],
 causes:[{id:"firmware",label:"Managed printer firmware regression",answers:{which:"4F-COPIER-02.",update:"Firmware 7.11 this morning.",others:"Two printers in the same rollout ring."},tools:{device:"Affected printers report repeated post-update boot failures."},correct:"esc-hw",escalation:true}]}),
S({id:"license-renewal-wave",cat:"Software Licensing / Vendor",subject:["Multiple products show entitlement pending","Renewed licenses aren't active yet"],open:["Several users see Entitlement Pending even though renewal was approved.","The vendor portal shows the purchase, but users remain unlicensed."],priority:"High",
 diagnostics:[["scope","Ask products/users affected"],["licenseq","Ask vendor entitlement status"],["timing","Ask renewal effective time"]],
 fixes:[["esc-vendor","Escalate entitlement activation delay to Vendor & Licensing","escalate"],["crack","Bypass license enforcement","bad"]],
 causes:[{id:"entitlement",label:"Vendor entitlement activation delayed after renewal",answers:{scope:"About 30 users in two licensed products.",licenseq:"Vendor portal says Renewal processed / entitlement pending.",timing:"Effective today."},tools:{software:"Procurement renewal is complete; vendor entitlement has not propagated."},correct:"esc-vendor",escalation:true}]}),
S({id:"auth-policy-change",cat:"Identity / Change",subject:["Sign-ins failing after password policy change","Old cached credentials keep locking users"],open:["A lot of users changed passwords and now old sessions keep failing.","Sign-ins are messy after the password-policy change."],priority:"High",
 diagnostics:[["scope","Ask affected user/device pattern"],["changed","Ask whether passwords changed recently"],["devices","Ask what cached apps/devices still authenticate"]],
 fixes:[["updatecreds","Update stale cached credentials on affected sessions/devices"],["esc-id","Escalate broad authentication-policy failure","escalate"],["resetall","Reset everyone's password again","bad"]],
 causes:[
  {id:"cache",label:"Expected stale cached credentials after password changes",answers:{scope:"Mostly users who changed passwords this morning.",changed:"Yes.",devices:"Phones, VPN, and a few old Outlook profiles."},tools:{logins:"Failures originate from old cached sessions; authentication platform is healthy."},correct:"updatecreds"},
  {id:"policy",label:"Authentication policy deployment rejecting valid new credentials",answers:{scope:"Users with newly compliant passwords across many devices.",changed:"Yes.",devices:"Failures also happen in clean web sign-in."},tools:{service:"Identity policy deployment errors elevated."},correct:"esc-id",escalation:true}
 ]}),
S({id:"vip-conference",cat:"Executive Support / Conferencing",subject:["Executive meeting room presentation failed","Leadership meeting starts soon and AV is down"],open:["The executive meeting starts shortly and the room display won't show the presentation.","Leadership is in the room and the conference system isn't detecting the laptop."],priority:"Critical",
 diagnostics:[["roomq","Ask room/system name"],["connection","Ask wired/wireless presentation path"],["others","Ask whether built-in room system works independently"]],
 fixes:[["avfix","Correct the approved room input/presentation connection"],["esc-av","Escalate room-system hardware failure to Endpoint & Field Services","escalate"],["admin","Give the presenter local admin rights","bad"]],
 causes:[
  {id:"room",label:"Meeting room input switched to wrong presentation source",answers:{roomq:"Executive Conference.",connection:"HDMI presentation input.",others:"Room camera/audio work."},tools:{device:"Room system online; display input set to Room PC instead of HDMI."},correct:"avfix"},
  {id:"hardware",label:"Executive room presentation interface hardware failure",answers:{roomq:"Executive Conference.",connection:"HDMI and wireless presentation both fail.",others:"Camera/audio work but presentation interface reports fault."},tools:{device:"Presentation interface hardware fault."},correct:"esc-av",escalation:true}
 ]}),
S({id:"sso-rollover",cat:"SSO / Change",subject:["Application rejects SSO after certificate rollover","SSO metadata is using old signing certificate"],open:["Users can sign into other apps, but this one rejects SSO after today's rollover.","The application says the SAML signature is invalid."],priority:"Critical",
 diagnostics:[["scope","Ask exactly which application is rejecting SSO and who is affected"],["timing","Ask whether issue began at certificate rollover"],["error","Request SAML/signature error"]],
 fixes:[["esc-id","Escalate stale SSO metadata to Identity & Access","escalate"],["disableverify","Disable SAML signature verification","bad"]],
 causes:[{id:"metadata",label:"Application SSO metadata still trusts retired signing certificate",answers:{scope:"One enterprise app, all users.",timing:"Immediately after rollover.",error:"Signature validation failed / unknown signing certificate."},tools:{account:"Identity provider is using new certificate; application metadata is stale."},correct:"esc-id",escalation:true}]}),
S({id:"patch-restart",cat:"Endpoint / Change",subject:["Laptop says restart required after patching","Managed update left application unavailable"],open:["My computer says a restart is required and one app won't open after patching.","The overnight update finished, but Windows says changes are pending."],priority:"Normal",
 diagnostics:[["update","Ask which managed update installed"],["restartq","Ask whether reboot has occurred"],["scope","Ask what remains unavailable"]],
 fixes:[["restart","Restart the managed workstation to complete approved patching"],["esc-hw","Escalate persistent post-patch failure","escalate"],["rollbackall","Uninstall all security updates immediately","bad"]],
 causes:[
  {id:"pending",label:"Approved patch installation pending required restart",answers:{update:"Monthly managed patch bundle.",restartq:"No, not yet.",scope:"One app and Windows Update both say restart required."},tools:{device:"Restart pending after successful patch installation."},correct:"restart"},
  {id:"failure",label:"Post-patch application failure persists after completed restart",answers:{update:"Monthly bundle.",restartq:"Restarted twice.",scope:"Application still crashes on launch."},tools:{device:"Restart complete; application crash events continue."},correct:"esc-hw",escalation:true}
 ]}),
S({id:"phish-wave-report",cat:"Security / Campaign",subject:["Several people received the same fake storage notice","Department-wide suspicious email wave"],open:["A bunch of us got the same storage-quota email at once.","Several employees are reporting the same suspicious shared-document message."],priority:"Critical",
 diagnostics:[["sender","Ask sender/domain"],["scope","Ask approximate recipient count"],["opened","Ask whether anyone clicked or entered credentials"]],
 fixes:[["reportphish","Report campaign sample and affected scope to Security Operations","escalate"],["massreply","Reply-all to the phishing message warning everyone","bad"]],
 causes:[{id:"campaign",label:"Coordinated phishing campaign affecting multiple employees",answers:{sender:"External lookalike domain.",scope:"At least 25 people in our department.",opened:"Two people say they clicked; unknown whether credentials were entered."},tools:{service:"Security telemetry shows matching messages delivered across multiple departments."},correct:"reportphish",escalation:true}]}),
S({id:"change-cache",cat:"Application / Change",subject:["Application still shows pre-deployment version","Users split between old and new release"],open:["Some users see the new application version and others still get the old interface.","After the deployment, different users appear to hit different versions."],priority:"High",
 diagnostics:[["scope","Ask affected users/sites"],["version","Ask versions observed"],["timing","Ask deployment completion time"]],
 fixes:[["esc-app","Escalate mixed-version deployment state to Enterprise Applications","escalate"],["clearall","Delete every user's browser profile","bad"]],
 causes:[{id:"mixed",label:"Application deployment left nodes on mixed release versions",answers:{scope:"Users alternate depending on session.",version:"14.2 and 14.3.",timing:"Deployment completed this morning."},tools:{service:"Application pool contains nodes reporting two different build versions."},correct:"esc-app",escalation:true}]}),
S({id:"storage-maint",cat:"File Services / Change",subject:["Shared drive briefly read-only during storage work","File share unavailable after maintenance"],open:["The shared drive became read-only during the storage maintenance.","The file share hasn't returned after the announced maintenance window."],priority:"High",
 diagnostics:[["path","Ask affected share/path"],["timing","Ask relation to maintenance window"],["scope","Ask whether all users are affected"]],
 fixes:[["esc-file","Escalate maintenance-related file-service failure to File & Storage Services","escalate"],["copylocal","Copy the entire share to one user's desktop as a workaround","bad"]],
 causes:[{id:"maintenance",label:"File service did not return cleanly after storage maintenance",answers:{path:"\\\\files\\operations.",timing:"Maintenance ended 20 minutes ago.",scope:"All users."},tools:{service:"Storage maintenance complete; file-service node health remains degraded."},correct:"esc-file",escalation:true}]}),
S({id:"change-calendar",cat:"Change Management",subject:["Is this outage part of today's planned change?","Users report issue during approved maintenance"],open:["People are opening tickets during the announced change window. Is this expected?","We have an issue that started exactly when today's maintenance began."],priority:"Normal",
 diagnostics:[["scope","Ask affected service/users"],["timing","Compare issue time to change window"],["impact","Ask whether impact matches published maintenance scope"]],
 fixes:[["associatechange","Associate documented expected impact with the active change and communicate status"],["esc-app","Escalate impact that exceeds the approved change scope","escalate"],["closeignore","Close the ticket without checking the change scope","bad"]],
 causes:[
  {id:"expected",label:"Reported behavior is documented expected impact during active maintenance",answers:{scope:"The exact service listed in the announcement.",timing:"Within the published window.",impact:"Read-only access was listed as expected."},tools:{service:"Active change window lists temporary read-only impact."},correct:"associatechange"},
  {id:"excess",label:"Observed impact exceeds the approved maintenance scope",answers:{scope:"Entire production service is unavailable.",timing:"During maintenance.",impact:"Announcement only listed brief read-only mode."},tools:{service:"Change scope does not include full service outage."},correct:"esc-app",escalation:true}
 ]})
];


const CAREER_OBJECTIVES=[
 {id:"clean-close",title:"Validate Every Closure",desc:"Finish the shift with no poor or premature closures."},
 {id:"security",title:"Security First",desc:"Finish the shift with a Security score of at least 90%."},
 {id:"documentation",title:"Document the Work",desc:"Reach at least 80% documentation coverage."},
 {id:"fcr",title:"Resolve at First Contact",desc:"Reach at least 70% first-contact resolution."},
 {id:"csat",title:"Customer Experience",desc:"Finish with customer experience of at least 80%."},
 {id:"sla",title:"Protect the SLA",desc:"Maintain at least 85% SLA compliance."},
 {id:"no-complaints",title:"Professional Communication",desc:"Complete the shift without a conduct complaint."},
 {id:"no-reopens",title:"Keep It Fixed",desc:"Finish with no ticket reopenings."},
 {id:"routing",title:"Clean Specialist Handoffs",desc:"If you escalate, avoid wrong queues and incomplete handoffs.",advanced:true},
 {id:"ops",title:"Read the Room",desc:"If operational events generate tickets, recognize at least 80% of their broader context.",advanced:true},
 {id:"escalation",title:"Escalation Judgment",desc:"Maintain at least 90% escalation quality.",advanced:true},
 {id:"queue",title:"Control the Queue",desc:"Maintain at least 85% queue-control performance.",advanced:true},
 {id:"requests",title:"Fulfill Requests Cleanly",desc:"Maintain at least 85% request-classification and fulfillment quality.",advanced:true}
];
function makeCareerId(number=1){return `SS-${String(number).padStart(2,"0")}-${Date.now().toString(36).slice(-5).toUpperCase()}`}
function newCareerProfile(number=1){
 return {
   careerId:makeCareerId(number),careerNumber:number,startDate:new Date().toLocaleDateString(),status:"Probationary",
   shifts:0,tickets:0,xp:0,probationTarget:5,probationComplete:false,lastProcessedReview:null,
   objectives:[],objectiveHistory:[],personnel:[],achievements:[],
   metrics:{reviews:0,score:0,fcr:0,csat:0,sla:0,security:0,documentation:0,escalation:0,routing:0,operations:0,requests:0,closure:0,queue:0},
   skills:{technical:0,customer:0,security:0,documentation:0,escalation:0,operations:0,requests:0,queue:0},
   counters:{specialistResolutions:0,majorIncidents:0,eventCorrelations:0,approvals:0,fiveStarTickets:0},
   archived:false
 };
}
function normalizeCareerProfile(p,d){
 p={...d,...(p||{})};
 p.objectives=Array.isArray(p.objectives)?p.objectives:[];
 p.objectiveHistory=Array.isArray(p.objectiveHistory)?p.objectiveHistory:[];
 p.personnel=Array.isArray(p.personnel)?p.personnel:[];
 p.achievements=Array.isArray(p.achievements)?p.achievements:[];
 p.metrics={...d.metrics,...(p.metrics||{})};
 p.skills={...d.skills,...(p.skills||{})};
 p.counters={...d.counters,...(p.counters||{})};
 return p;
}
function hydrateLegacyCareerProfile(s,hadProfile){
 const p=s.careerProfile;if(hadProfile)return;
 p.shifts=s.career?.shifts||0;p.tickets=s.career?.tickets||0;p.careerNumber=(s.career?.terminations||0)+1;p.startDate="Imported from pre-v1.0 career";
 const reviews=s.supervisor?.history||[];
 if(reviews.length){
   p.metrics.reviews=reviews.length;
   const add=(k,val)=>p.metrics[k]=(p.metrics[k]||0)+(Number(val)||0);
   reviews.forEach(r=>{const m=r.metrics||{};add("score",r.score);add("fcr",m.fcr);add("csat",m.csat);add("sla",m.sla);add("security",m.security);add("documentation",m.documentation);add("escalation",m.escalationQuality);add("routing",m.routingQuality);add("operations",m.operationalAwareness);add("closure",m.closureQuality);add("queue",m.queueControl)});
   p.xp=Math.round(p.metrics.score||0);
   const n=p.metrics.reviews||1,av=k=>Math.round((p.metrics[k]||0)/n);
   p.skills.technical=Math.round((av("score")+av("fcr"))/2);p.skills.customer=av("csat");p.skills.security=av("security");p.skills.documentation=av("documentation");
   p.skills.escalation=Math.round((av("escalation")+av("routing"))/2);p.skills.operations=av("operations");p.skills.requests=av("requests")||100;p.skills.queue=Math.round((av("sla")+av("queue"))/2);
 }
 p.personnel.unshift({key:"migration-v1",type:"milestone",title:"Career Upgraded to v1.0",detail:"Existing SuperService career history was migrated into the persistent career system.",tone:"positive",shift:p.shifts,date:new Date().toLocaleDateString()});
 if(p.shifts>=p.probationTarget){p.probationComplete=true;p.status="Regular Status"}
}
function careerWeekNumber(){return Math.floor((state.careerProfile?.shifts||0)/5)+1}
function careerDayName(){return ["Monday","Tuesday","Wednesday","Thursday","Friday"][(state.careerProfile?.shifts||0)%5]}
function careerStatusLabel(){
 const p=state.careerProfile||newCareerProfile(),sp=state.supervisor||{},perf=state.performance||{},d=state.discipline||{},ms=state.maliciousStats||{};
 if(d.fired||sp.terminatedForPerformance||ms.stage>=5)return "Terminated";
 if(ms.stage>=4)return "Final Warning";
 if(ms.stage>=3||sp.pip||perf.pip)return "Performance Plan";
 if(d.warningIssued)return "Final Warning";
 if(ms.stage>=2)return "Coaching";
 if(!p.probationComplete)return p.shifts>=p.probationTarget?"Probation Extended":"Probationary";
 if(ms.stage>=1)return "Conduct Warning";
 if(sp.coaching||perf.coached)return "Coaching";
 return "Regular Status";
}
function careerStatusClass(){
 const x=careerStatusLabel();if(x==="Terminated")return "terminated";if(x==="Performance Plan")return "pip";if(x==="Final Warning"||x==="Coaching"||x==="Conduct Warning"||x==="Probation Extended")return "warning";if(x==="Probationary")return "probation";return "";
}
function metricAverage(key){
 const p=state.careerProfile,n=p?.metrics?.reviews||0;if(!n)return 0;
 return Math.round((p.metrics[key]||0)/n);
}
function recordCareerEvent(type,title,detail="",tone="",shiftOverride=null){
 const p=state.careerProfile;if(!p)return null;
 const shift=shiftOverride??(p.shifts||0)+1,key=`${type}|${title}|${shift}`;
 if(p.personnel.some(x=>x.key===key))return null;
 const ev={key,type,title,detail,tone:tone||(["promotion","recognition","probation","achievement","clear"].includes(type)?"positive":["complaint","warning","pip","termination"].includes(type)?"negative":"warning"),shift,date:new Date().toLocaleDateString()};
 p.personnel.unshift(ev);p.personnel=p.personnel.slice(0,60);return ev;
}
function careerObjectiveResult(id,m,done){
 const bad=done.filter(t=>["Force Closed Unresolved","Closed Prematurely","Forced Closed Before Confirmation"].includes(t.outcome)).length;
 const reopens=done.reduce((a,t)=>a+(t.reopenCount||0),0);
 const complaints=done.filter(t=>t.complaint).length;
 const map={
   "clean-close":()=>bad===0,"security":()=>m.security>=90,"documentation":()=>m.documentation>=80,"fcr":()=>m.fcr>=70,
   "csat":()=>m.csat>=80,"sla":()=>m.sla>=85,"no-complaints":()=>complaints===0,"no-reopens":()=>done.every(t=>!(t.closureHistory||[]).some(h=>["Force Closed Unresolved","Closed Prematurely","Forced Closed Before Confirmation"].includes(h.outcome))),
   "routing":()=>m.teamAssignments===0||(m.wrongRoutes===0&&m.infoReturns===0&&m.routingQuality>=90),
   "ops":()=>m.eventTickets===0||m.operationalAwareness>=80,"escalation":()=>m.escalationQuality>=90,"queue":()=>m.queueControl>=85,"requests":()=>m.requestCount===0||m.requestQuality>=85
 };
 return !!map[id]?.();
}
function prepareCareerObjectives(){
 const p=state.careerProfile;if(!p)return;
 const shift=p.shifts+1;if(p.objectives?.length&&p.objectives[0]?.assignedShift===shift)return;
 const last=state.supervisor?.lastReview?.metrics||{},preferred=[];
 if((last.security??100)<85)preferred.push("security");
 if((last.documentation??100)<75)preferred.push("documentation");
 if((last.fcr??100)<65)preferred.push("fcr");
 if((last.csat??100)<75)preferred.push("csat");
 if((last.sla??100)<80)preferred.push("sla");
 if((last.closureQuality??100)<90)preferred.push("clean-close");
 if((last.routingQuality??100)<80)preferred.push("routing");
 if((last.operationalAwareness??100)<75)preferred.push("ops");
 if((last.requestQuality??100)<80)preferred.push("requests");
 const level=state.supervisor?.promotionLevel||0;
 let pool=CAREER_OBJECTIVES.filter(o=>!o.advanced||level>=1);
 if(activeWorldEvents().length)preferred.push("ops");
 const chosen=[];
 preferred.forEach(id=>{const o=pool.find(x=>x.id===id);if(o&&!chosen.some(x=>x.id===id)&&chosen.length<2)chosen.push(o)});
 shuffle(pool).forEach(o=>{if(chosen.length<3&&!chosen.some(x=>x.id===o.id))chosen.push(o)});
 p.objectives=chosen.slice(0,level>=2?3:2).map(o=>({...o,assignedShift:shift,complete:null}));
}
function evaluateCareerObjectives(done,review){
 const p=state.careerProfile,objectives=p?.objectives||[],results=[];
 objectives.forEach(o=>{const complete=careerObjectiveResult(o.id,review.metrics,done);const r={...o,complete,reviewScore:review.score};results.push(r)});
 if(results.length){p.objectiveHistory.unshift({shift:review.shift,results});p.objectiveHistory=p.objectiveHistory.slice(0,20)}
 p.objectives=results;return results;
}
function unlockCareerAchievement(id,title,desc,shiftOverride=null){
 const p=state.careerProfile;if(!p||p.achievements.some(x=>x.id===id))return null;
 const a={id,title,desc,shift:shiftOverride??p.shifts+1,date:new Date().toLocaleDateString()};p.achievements.unshift(a);p.xp+=50;recordCareerEvent("achievement",title,desc,"positive");return a;
}
function evaluateCareerAchievements(review){
 const p=state.careerProfile,newOnes=[];
 const add=(id,title,desc,ok)=>{if(ok){const a=unlockCareerAchievement(id,title,desc);if(a)newOnes.push(a)}};
 add("first-shift","First Shift Survived","Completed your first SuperService shift.",p.shifts+1>=1);
 add("perfect-review","Near-Perfect Review","Earned a supervisor review score of 95 or higher.",review.score>=95);
 add("security-clean","Security First","Completed a shift with a 100% Security score.",review.metrics.security===100);
 add("routing-clean","Right Queue, First Time","Completed at least two specialist assignments with 100% routing quality.",review.metrics.teamAssignments>=2&&review.metrics.routingQuality===100);
 add("ops-aware","See the Bigger Picture","Handled at least two event-driven tickets with 100% operational awareness.",review.metrics.eventTickets>=2&&review.metrics.operationalAwareness===100);
 add("tickets-25","Quarter Century","Resolved 25 tickets in this career.",p.tickets>=25);
 add("tickets-50","Fifty Tickets","Resolved 50 tickets in this career.",p.tickets>=50);
 add("tickets-100","Century Desk","Resolved 100 tickets in this career.",p.tickets>=100);
 add("five-strong","Five Strong Shifts","Built a five-shift strong-performance streak.",(state.supervisor?.goodStreak||0)>=5);
 add("people-person","People Person","Built strong rapport with at least five persistent employees.",state.employees.filter(e=>relationshipTier(e).id==="strong").length>=5);
 add("incident-eye","Incident Spotter","Identified five operational correlations in one career.",p.counters.eventCorrelations>=5);
 add("specialist-partner","Specialist Partner","Completed ten specialist resolutions in one career.",p.counters.specialistResolutions>=10);
 add("lead-agent","Lead Service Agent","Reached the Lead Service Agent career title.",(state.supervisor?.promotionLevel||0)>=4);
 add("career-20","Desk Veteran","Completed 20 shifts in one career.",p.shifts+1>=20);
 return newOnes;
}
function updateCareerMetrics(review){
 const p=state.careerProfile,m=review.metrics||{};p.metrics.reviews++;
 const add=(k,v)=>p.metrics[k]=(p.metrics[k]||0)+(Number(v)||0);
 add("score",review.score);add("fcr",m.fcr);add("csat",m.csat);add("sla",m.sla);add("security",m.security);add("documentation",m.documentation);add("escalation",m.escalationQuality);add("routing",m.routingQuality);add("operations",m.operationalAwareness);add("requests",m.requestQuality);add("closure",m.closureQuality);add("queue",m.queueControl);
 const n=p.metrics.reviews,avg=(old,val)=>Math.round(((old||0)*(n-1)+(Number(val)||0))/n);
 p.skills.technical=avg(p.skills.technical,Math.round((review.score+(m.fcr||0))/2));p.skills.customer=avg(p.skills.customer,m.csat);p.skills.security=avg(p.skills.security,m.security);
 p.skills.documentation=avg(p.skills.documentation,m.documentation);p.skills.escalation=avg(p.skills.escalation,Math.round(((m.escalationQuality||0)+(m.routingQuality||0))/2));p.skills.operations=avg(p.skills.operations,m.operationalAwareness);p.skills.requests=avg(p.skills.requests,m.requestQuality);p.skills.queue=avg(p.skills.queue,Math.round(((m.sla||0)+(m.queueControl||0))/2));
}

function settleMisconductShift(){
 const ms=state.maliciousStats;if(!ms||state.freeplay)return;
 if((ms.shiftActions||0)===0){
   ms.cleanShifts=(ms.cleanShifts||0)+1;
   const decay=ms.stage>=4?5:ms.stage>=3?7:10;ms.heat=Math.max(0,(ms.heat||0)-decay);
   let lowered=false;
   if(ms.stage===1&&ms.cleanShifts>=2){ms.stage=0;lowered=true}
   else if(ms.stage===2&&ms.cleanShifts>=3){ms.stage=1;lowered=true}
   else if(ms.stage===3&&ms.cleanShifts>=4){ms.stage=2;ms.reassignmentRestricted=false;lowered=true}
   else if(ms.stage===4&&ms.cleanShifts>=5){ms.stage=3;lowered=true}
   if(lowered)recordCareerEvent("clear","Misconduct Status Improved",`Sustained clean shifts reduced administrative-misconduct status to ${misconductStageLabel(ms.stage)}. Audit heat is now ${ms.heat}/100.`,"positive");
 }else{
   ms.cleanShifts=0;
 }
 ms.shiftActions=0;
}

function finalizeCareerShift(done,review){
 const p=state.careerProfile;if(!p||p.lastProcessedReview===review.shift)return {objectives:p?.objectives||[],achievements:[]};
 updateCareerMetrics(review);
 const unique=done.filter(t=>!t.careerCounted);unique.forEach(t=>t.careerCounted=true);p.tickets+=unique.length;
 p.counters.specialistResolutions+=state.teamStats?.resolutions||0;p.counters.majorIncidents+=state.worldStats?.majorIncidents||0;p.counters.eventCorrelations+=state.worldStats?.correlations||0;p.counters.approvals+=state.approvalStats?.approved||0;p.counters.fiveStarTickets+=done.filter(t=>t.customerRating===5).length;
 const objectives=evaluateCareerObjectives(done,review),completed=objectives.filter(o=>o.complete).length;p.xp+=review.score+completed*25;
 if(objectives.length&&completed===objectives.length&&review.score>=80&&!state.supervisor?.pip&&!state.supervisor?.coaching){state.supervisor.recognition=(state.supervisor.recognition||0)+1;recordCareerEvent("recognition","Supervisor Objectives Completed",`Completed all ${completed} assigned development objectives.`,"positive")}
 if(review.action==="promotion")recordCareerEvent("promotion",`Promoted to ${agentTitle()}`,`Dana Bishop approved advancement after sustained strong performance.`,"positive");
 else if(review.action==="coaching")recordCareerEvent("coaching","Overall Performance Coaching","Supervisor review triggered formal coaching.","warning");
 else if(review.action==="pip")recordCareerEvent("pip","Overall Performance Improvement Plan","Overall shift performance triggered a formal PIP.","negative");
 else if(review.action==="pip-cleared")recordCareerEvent("clear","Overall PIP Cleared","Completed the required recovery period and returned to good standing.","positive");
 else if(review.action==="coaching-cleared")recordCareerEvent("clear","Supervisor Coaching Cleared","Performance improved enough to end active coaching.","positive");
 else if(review.action==="recognition")recordCareerEvent("recognition","Positive Supervisor Recognition",`Earned an ${review.rating} review.`,"positive");
 else if(review.action==="terminated")recordCareerEvent("termination","Employment Terminated","Employment ended after unsuccessful performance improvement.","negative");
 const newAchievements=evaluateCareerAchievements(review);
 p.shifts++;p.lastProcessedReview=review.shift;
 if(!p.probationComplete&&p.shifts>=p.probationTarget){
   if(!state.supervisor?.pip&&!state.performance?.pip&&!state.discipline?.warningIssued){p.probationComplete=true;recordCareerEvent("probation","Probation Completed","Completed the initial five-shift probationary period in acceptable standing.","positive",p.shifts);unlockCareerAchievement("probation","Off Probation","Completed the probationary period.",p.shifts)}
   else recordCareerEvent("warning","Probation Extended","Probation remains open because an active warning or performance plan is in effect.","warning",p.shifts);
 }
 if(p.shifts>0&&p.shifts%5===0)recordCareerEvent("milestone",`Career Week ${Math.ceil(p.shifts/5)} Completed`,`Five-shift block completed with a career review average of ${metricAverage("score")||0}.`,metricAverage("score")>=75?"positive":"warning",p.shifts);
 settleMisconductShift();
 p.status=careerStatusLabel();return {objectives,achievements:newAchievements};
}
function careerArchiveSummary(reason="Career ended"){
 const p=state.careerProfile;return {careerId:p.careerId,careerNumber:p.careerNumber,startDate:p.startDate,endDate:new Date().toLocaleDateString(),reason,title:agentTitle(),status:careerStatusLabel(),shifts:p.shifts,tickets:p.tickets,xp:p.xp,averageReview:metricAverage("score"),achievements:p.achievements.length};
}
function archiveCurrentCareer(reason="Career ended"){
 const p=state.careerProfile;if(!p||p.archived)return;
 state.careerArchive=state.careerArchive||[];state.careerArchive.unshift(careerArchiveSummary(reason));state.careerArchive=state.careerArchive.slice(0,12);p.archived=true;
}

const defaultState=()=>({
 active:false,difficulty:"Service Agent",sessionSize:10,endless:false,freeplay:false,freeplayBaseline:null,freeplayStats:{added:0,completed:0,scoreSum:0,bestScore:0},shiftStart:480,clock:480,
 tickets:[],selected:null,nextNum:1001,pending:[],completed:0,scoreSum:0,stats:{},
 career:{shifts:0,tickets:0,totalScore:0,terminations:0},careerProfile:newCareerProfile(1),careerArchive:[],discipline:{complaintTickets:0,warningIssued:false,fired:false,incidents:0},performance:{badClosures:0,badClosureStreak:0,cleanClosureStreak:0,closurePoints:0,coached:false,pip:false,lastActionAt:0,extraAssigned:0,recoveries:0},supervisor:{name:"Dana Bishop",title:"Service Desk Supervisor",reviews:0,status:"Good Standing",coaching:false,pip:false,pipRecovery:0,pipFailures:0,goodStreak:0,poorStreak:0,recognition:0,promotionLevel:0,requiredTraining:[],lastReview:null,history:[],terminatedForPerformance:false},majorIncidents:{},nextMajor:1,approvalStats:{requested:0,approved:0,denied:0,delegated:0,withdrawn:0,emergency:0,wrongClaims:0},maliciousStats:{accountDeletes:0,ticketDeletes:0,falseWaiting:0,priorityDowngrades:0,concealAttempts:0,caught:0,coached:0,fired:0,heat:0,findings:0,stage:0,warnings:0,pips:0,finalWarnings:0,extraTickets:0,evasionAttempts:0,evasionSuccesses:0,narrowEscapes:0,cleanEscapes:0,cleanShifts:0,shiftActions:0,shiftFindings:0,shiftEscapes:0,reassignmentRestricted:false,auditHistory:[]},requestStats:{catalogTickets:0,classified:0,misclassified:0,fieldsCollected:0,submitted:0,kickbacks:0,fulfilled:0,denied:0,unauthorizedAttempts:0,slaMissed:0},teamStats:{assignments:0,accepted:0,kickbacks:0,wrongQueue:0,infoReturns:0,reroutes:0,resolutions:0,recalls:0,mercyAccepts:0,adviceReturns:0,acceptedWithWarning:0,excellentHandoffs:0,weakHandoffs:0},teamLoads:{},coworkers:buildCoworkerState(),coworkerLoads:{},coworkerStats:{helpRequests:0,helpfulHints:0,reassignments:0,accepted:0,returns:0,trades:0,sharedQueueDumps:0,sharedQueuePickups:0,dumpPoints:0,supervisorInterventions:0,teammateResolutions:0},responseStats:{followups:0,accelerated:0,spamFollowups:0,supervisorEscalations:0,supervisorAssists:0,alternateValidations:0,policyClosures:0,policyReopens:0,sharedReopenReroutes:0,scheduledFollowups:0,withdrawals:0,noLongerReproducible:0},world:{weekday:"Monday",events:[],announcements:[],nextId:1,lastClock:480,initialized:false,dynamicAdded:0,dynamicCap:0},worldStats:{activated:0,resolved:0,eventTickets:0,correlations:0,majorIncidents:0,vipTickets:0,changeEvents:0,outages:0,campaigns:0},worldCareer:{eventsSeen:0,eventTickets:0,correlations:0,history:[]},employees:buildEmployeeDirectory(),relationshipStats:{repeatRequesters:0,strongRapport:0,strained:0},settings:{sound:false,compact:false,typing:{sessions:0,bestWpm:0,bestAccuracy:0,lastWpm:0,lastAccuracy:0,totalSeconds:0}}
});
function normalizeState(s){
 const d=defaultState(),hadCareerProfile=!!s.careerProfile;
 s.career={...d.career,...(s.career||{})};
 s.careerProfile=normalizeCareerProfile(s.careerProfile,d.careerProfile);
 s.careerArchive=Array.isArray(s.careerArchive)?s.careerArchive:[];
 hydrateLegacyCareerProfile(s,hadCareerProfile);
 s.discipline={...d.discipline,...(s.discipline||{})};
 s.performance={...d.performance,...(s.performance||{})};
 s.supervisor={...d.supervisor,...(s.supervisor||{})};
 s.supervisor.history=Array.isArray(s.supervisor.history)?s.supervisor.history:[];
 s.supervisor.requiredTraining=Array.isArray(s.supervisor.requiredTraining)?s.supervisor.requiredTraining:[];
 s.majorIncidents=s.majorIncidents||{};
 s.nextMajor=s.nextMajor||1;
 s.approvalStats={...d.approvalStats,...(s.approvalStats||{})};
 s.maliciousStats={...d.maliciousStats,...(s.maliciousStats||{})};s.maliciousStats.auditHistory=Array.isArray(s.maliciousStats.auditHistory)?s.maliciousStats.auditHistory:[];
 s.requestStats={...d.requestStats,...(s.requestStats||{})};
 s.teamStats={...d.teamStats,...(s.teamStats||{})};
 s.teamLoads=s.teamLoads||{};
 const savedCoworkers=Array.isArray(s.coworkers)?s.coworkers:[];
 s.coworkers=SERVICE_DESK_COWORKERS.map(def=>normalizeCoworker(savedCoworkers.find(c=>c.id===def.id),{...def,trust:62,goodwill:0,dumpsReceived:0,helped:0,accepted:0,rejected:0,trades:0,resolved:0,complaints:0,lastInteraction:null}));
 s.coworkerLoads=s.coworkerLoads||{};
 s.coworkerStats={...d.coworkerStats,...(s.coworkerStats||{})};
 s.responseStats={...d.responseStats,...(s.responseStats||{})};
 s.world={...d.world,...(s.world||{})};s.world.events=Array.isArray(s.world.events)?s.world.events:[];s.world.announcements=Array.isArray(s.world.announcements)?s.world.announcements:[];s.world.dynamicAdded=Number(s.world.dynamicAdded)||0;s.world.dynamicCap=Number.isFinite(s.world.dynamicCap)?s.world.dynamicCap:0;
 s.worldStats={...d.worldStats,...(s.worldStats||{})};
 s.worldCareer={...d.worldCareer,...(s.worldCareer||{})};s.worldCareer.history=Array.isArray(s.worldCareer.history)?s.worldCareer.history:[];
 s.employees=(Array.isArray(s.employees)&&s.employees.length?s.employees:d.employees).map((e,i)=>normalizeEmployee(e,i));
 s.relationshipStats={...d.relationshipStats,...(s.relationshipStats||{})};
 s.settings={...d.settings,...(s.settings||{})};s.settings.typing={...d.settings.typing,...(s.settings?.typing||{})};
 s.freeplay=!!s.freeplay;s.freeplayBaseline=s.freeplayBaseline||null;s.freeplayStats={...d.freeplayStats,...(s.freeplayStats||{})};
 s.pending=Array.isArray(s.pending)?s.pending:[];
 s.tickets=Array.isArray(s.tickets)?s.tickets:[];
 // Saved queues are self-healed before any ticket-specific migration runs.
 s.tickets=s.tickets.filter(t=>{
   const sc=SCENARIOS.find(x=>x.id===t?.scenarioId);
   return !!sc&&!!sc.causes?.some(c=>c.id===t?.causeId);
 });
 const validTicketIds=new Set(s.tickets.map(t=>t.id));
 s.pending=s.pending.filter(p=>!p?.ticketId||validTicketIds.has(p.ticketId));
 if(!validTicketIds.has(s.selected))s.selected=s.tickets.find(t=>!t.resolved)?.id||s.tickets[0]?.id||null;
 if(s.active&&!s.endless&&!s.freeplay)s.sessionSize=s.tickets.length;
 s.completed=s.tickets.filter(t=>t.resolved).length;
 s.scoreSum=s.tickets.filter(t=>t.resolved&&Number.isFinite(t.score)).reduce((a,t)=>a+t.score,0);
 s.tickets.forEach(t=>{
   const extras={conductViolations:0,professionalismHits:0,profanityCount:0,complaint:false,customerRating:null,customerFeedback:null,forceClosed:false,confirmation:false,waiting:false,badDiagnostics:[],approval:null,actors:null,supervisor:null,manager:null,userId:null,employeeComplaintRecorded:false,ticketType:"Incident",history:[],attachments:[],closureHistory:[],reopenCount:0,reopenPenalty:0,reliability:"accurate",misledOnce:false,relatedChecked:false,incidentKey:null,incidentSeedLabel:null,relatedKnown:false,userMadeWorse:false,selfResolved:false,approvalWithdrawnAfterAction:false,proactiveFacts:[],specialAssignment:false,assignmentQueue:"Service Desk",teamHistory:[],specialistState:"none",escalationAttempts:0,teamKickbacks:0,wrongTeamAssignments:0,teamInfoReturns:0,teamReroutes:0,teamRecalls:0,specialistAccepted:false,acceptedTeamId:null,specialistResolution:false,specialistInfoRequest:null,specialistSuggestedDiagnostic:null,specialistSuggestedFix:null,handoffGrade:null,handoffHistory:[],specialistMercy:false,specialistAcceptedWithWarning:false,specialistWeakHandoffs:0,specialistExcellentHandoffs:0,ownerAgentId:"player",coworkerState:"none",coworkerId:null,coworkerHistory:[],coworkerSuggestedDiagnostic:null,coworkerSuggestedFix:null,coworkerDumped:false,coworkerDumpPoints:0,coworkerAuditPoints:0,coworkerTransferMode:null,coworkerResolved:false,tradedFromCoworker:false,sharedQueue:false,pendingEscalationAction:null,worldGenerated:false,worldEventId:null,worldEventKnown:false,worldContextSeen:false,vipTicket:false,careerCounted:false,clarification:null,resolutionFollowupReady:false,request:null,requesterAccountDeleted:false,deletedTicket:false,maliciousAction:null,maliciousCaught:false,misconductActions:[],auditAttributionHidden:false,auditLastOutcome:null,responsePolicy:null,reopenRouting:"player",noCsat:false,alternateValidated:false,requesterWithdrawn:false,noLongerReproducible:false};
   Object.keys(extras).forEach(k=>{if(t[k]===undefined)t[k]=extras[k]});
   hydrateEmployeeForTicket(t,s.employees);
   hydrateApprovalV05(t);hydrateRequestState(t,s.employees,s.clock);
 });
 if((s.requestStats?.catalogTickets||0)<s.tickets.filter(t=>t.request).length)s.requestStats.catalogTickets=s.tickets.filter(t=>t.request).length;
 return s;
}
let state=null;
let startupRecoveryError=null;
let activeTab="tools";
let toolResult="Select a diagnostic tool.";
let ticketFilter="";
let toastTimer=null;

function rand(a){return a[Math.floor(Math.random()*a.length)]}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function fmtTime(m){let h=Math.floor(m/60)%24,mm=m%60;return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`}
function nowStamp(){return fmtTime(state?.clock??480)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function saveState(){
 if(!state)return false;
 localStorage.setItem("superservice-save",JSON.stringify(state));
 const el=document.getElementById("saveState");if(el)el.textContent="Saved locally • "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
 return true;
}
function loadState(){const raw=localStorage.getItem("superservice-save");return raw?JSON.parse(raw):null}
function toast(t){const el=document.getElementById("toast");if(!el)return;el.textContent=t;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),2200)}
function difficultyFactor(){return BALANCE_PROFILE.actionTime[state?.difficulty||"Service Agent"]||1}

const TYPING_STATS_KEY="superservice-typing";
const DEFAULT_TYPING_STATS={sessions:0,bestWpm:0,bestAccuracy:0,lastWpm:0,lastAccuracy:0,totalSeconds:0};
function mergeTypingStats(a={},b={}){
 const x={...DEFAULT_TYPING_STATS,...(a||{})},y={...DEFAULT_TYPING_STATS,...(b||{})},latest=(y.sessions||0)>=(x.sessions||0)?y:x;
 return {sessions:Math.max(x.sessions||0,y.sessions||0),bestWpm:Math.max(x.bestWpm||0,y.bestWpm||0),bestAccuracy:Math.max(x.bestAccuracy||0,y.bestAccuracy||0),lastWpm:latest.lastWpm||0,lastAccuracy:latest.lastAccuracy||0,totalSeconds:Math.max(x.totalSeconds||0,y.totalSeconds||0)};
}
function loadTypingPracticeStats(){try{const raw=localStorage.getItem(TYPING_STATS_KEY);return raw?{...DEFAULT_TYPING_STATS,...JSON.parse(raw)}:{...DEFAULT_TYPING_STATS}}catch(e){return {...DEFAULT_TYPING_STATS}}}
function getTypingPracticeStats(){return mergeTypingStats(state?.settings?.typing,loadTypingPracticeStats())}
function persistTypingPracticeStats(stats){
 const clean={...DEFAULT_TYPING_STATS,...(stats||{})};
 try{localStorage.setItem(TYPING_STATS_KEY,JSON.stringify(clean))}catch(e){}
 if(state){state.settings=state.settings||{};state.settings.typing={...clean};saveState()}
 return clean;
}
function syncTypingPracticeStats(){
 const merged=getTypingPracticeStats();
 if(state){state.settings=state.settings||{};state.settings.typing={...merged}}
 try{localStorage.setItem(TYPING_STATS_KEY,JSON.stringify(merged))}catch(e){}
 return merged;
}

function agentTitle(){
 const lvl=state.supervisor?.promotionLevel||0;
 return ["Service Desk Agent","Service Desk Agent II","Senior Service Agent","Troubleshooting Specialist","Lead Service Agent"][Math.min(4,lvl)]||"Service Desk Agent";
}
function supervisorStanding(){
 const sp=state.supervisor||defaultState().supervisor;
 if(sp.terminatedForPerformance)return "TERMINATED";
 if(sp.pip)return "OVERALL PIP";
 if(sp.coaching)return "Supervisor coaching";
 if(sp.promotionLevel>=2)return agentTitle();
 if(sp.goodStreak>=2)return "Strong standing";
 return "Good standing";
}
function isComplexScenario(sc){
 return sc?.priority==="Critical"||sc?.dataGovernance||(sc?.causes?.length||0)>=3||/Security|Privacy|Records|Clinical|Privileged|Data Governance|Legal/i.test(sc?.cat||"");
}
function chooseShiftScenarios(pool,count){
 const lvl=state.supervisor?.promotionLevel||0;
 if(lvl<1||state.difficulty==="Trainee")return pool.slice(0,count).map(sc=>({sc,special:false}));
 const target=lvl>=4?Math.max(2,Math.floor(count/4)):lvl>=2?Math.max(1,Math.floor(count/5)):1;
 const specialCount=Math.min(count>=15?Math.min(4,lvl+1):Math.min(lvl>=4?3:2,lvl),target);
 const hard=shuffle(pool.filter(isComplexScenario)).slice(0,specialCount);
 const used=new Set(hard.map(x=>x.id));
 const rest=shuffle(pool.filter(x=>!used.has(x.id))).slice(0,Math.max(0,count-hard.length));
 return [...hard.map(sc=>({sc,special:true})),...rest.map(sc=>({sc,special:false}))].slice(0,count);
}

function slaFor(p){return BALANCE_PROFILE.sla[p]||240}
function personalityDelay(t,context="normal"){
 const p=t?getPerson(t):null,e=t?employeeForTicket(t):null;
 const pace=EMPLOYEE_RESPONSE.find(x=>x.id===e?.responseStyle)?.factor||1;
 if(context==="complaint")return Math.round((2200+Math.random()*7800)*Math.min(1.22,pace));
 if(context==="confirmation"){
   let d=4500+Math.random()*14500;
   if(p?.id==="slow")d+=8500+Math.random()*15500;
   if(p?.id==="nonresponsive")d+=18000+Math.random()*36000;
   d*=pace;if(e?.satisfaction<30)d*=.84;
   return Math.max(2600,Math.min(85000,Math.round(d)));
 }
 let d=4200+Math.random()*12000;
 if(Math.random()<.22)d+=10000+Math.random()*21000;
 if(Math.random()<.055)d+=24000+Math.random()*36000;
 if(p?.id==="impatient")d*=.62;
 if(p?.id==="detailed"||p?.id==="chatty")d*=1.20;
 if(p?.id==="slow")d+=12000+Math.random()*24000;
 if(p?.id==="nonresponsive")d+=28000+Math.random()*52000;
 d*=pace;if(e?.patience<48&&e?.satisfaction<45)d*=.84;
 if(state.difficulty==="Chaos Desk")d*=1.08;
 return Math.max(2600,Math.min(105000,Math.round(d)));
}

const REQUESTER_RESPONSE_POLICY={
 Critical:{followup:5,gap:5,supervisor:12,close:28,minAttempts:2},
 High:{followup:8,gap:7,supervisor:20,close:42,minAttempts:2},
 Normal:{followup:12,gap:10,supervisor:30,close:62,minAttempts:2},
 Low:{followup:18,gap:14,supervisor:42,close:90,minAttempts:2}
};
function requesterPolicyProfile(t){
 const base={...(REQUESTER_RESPONSE_POLICY[t?.priority]||REQUESTER_RESPONSE_POLICY.Normal)};
 if(t?.request){base.followup+=3;base.supervisor+=7;base.close+=12}
 return base;
}
function ensureResponsePolicy(t){
 if(!t.responsePolicy)t.responsePolicy={active:false,waitingStartedClock:null,waitingStartedReal:null,contactAttempts:0,validContactAttempts:0,lastContactClock:null,lastContactReal:null,followupEligible:false,supervisorEligible:false,policyEligible:false,followupNotice:false,supervisorNotice:false,policyNotice:false,supervisorRequested:false,alternateRequested:false,outOfOffice:false,deadlineExtension:0,spamCount:0,accelerations:0,scheduledFollowup:false,scheduledFollowupDue:false,lastResponseClock:null,lastResponseReal:null};
 return t.responsePolicy;
}
function responsePendingUserEvents(t){
 return state.pending.filter(p=>p.ticketId===t.id&&p.type==="user"&&!p.complaint);
}
function responseWaitAge(t){
 const rp=ensureResponsePolicy(t);if(!rp.active||rp.waitingStartedClock==null)return 0;
 const sim=Math.max(0,(state.clock||0)-rp.waitingStartedClock);
 const real=rp.waitingStartedReal?Math.max(0,Math.floor((Date.now()-rp.waitingStartedReal)/1000)):0;
 return Math.max(sim,real);
}
function responseContactGapAge(t){
 const rp=ensureResponsePolicy(t);
 const sim=rp.lastContactClock==null?999:Math.max(0,(state.clock||0)-rp.lastContactClock);
 const real=rp.lastContactReal==null?999:Math.max(0,Math.floor((Date.now()-rp.lastContactReal)/1000));
 return Math.max(sim,real);
}
function beginRequesterWait(t){
 const rp=ensureResponsePolicy(t),now=Date.now();
 if(!rp.active){
   rp.active=true;rp.waitingStartedClock=state.clock;rp.waitingStartedReal=now;rp.contactAttempts=1;rp.validContactAttempts=1;
   rp.lastContactClock=state.clock;rp.lastContactReal=now;rp.followupNotice=false;rp.supervisorNotice=false;rp.policyNotice=false;rp.supervisorRequested=false;rp.alternateRequested=false;rp.outOfOffice=false;rp.deadlineExtension=0;rp.spamCount=0;rp.accelerations=0;rp.scheduledFollowup=false;rp.scheduledFollowupDue=false;
 }
 responsePolicyCheck(t);
}
function clearRequesterWait(t){
 const rp=ensureResponsePolicy(t);rp.active=false;rp.followupEligible=false;rp.supervisorEligible=false;rp.policyEligible=false;rp.scheduledFollowup=false;rp.scheduledFollowupDue=false;rp.lastResponseClock=state.clock;rp.lastResponseReal=Date.now();
 state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&p.type==="followupReminder"));
}
function restartRequesterWaitIfNeeded(t){
 const rp=ensureResponsePolicy(t),remaining=responsePendingUserEvents(t);
 if(!remaining.length){clearRequesterWait(t);return}
 rp.active=true;rp.waitingStartedClock=state.clock;rp.waitingStartedReal=Date.now();rp.contactAttempts=1;rp.validContactAttempts=1;rp.lastContactClock=state.clock;rp.lastContactReal=Date.now();rp.followupNotice=false;rp.supervisorNotice=false;rp.policyNotice=false;rp.policyEligible=false;rp.supervisorEligible=false;rp.followupEligible=false;rp.scheduledFollowup=false;rp.scheduledFollowupDue=false;
}
function responsePolicyCheck(t){
 if(!t||t.resolved)return false;
 const rp=ensureResponsePolicy(t);if(!rp.active)return false;
 const prof=requesterPolicyProfile(t),age=responseWaitAge(t),gap=responseContactGapAge(t),extension=rp.deadlineExtension||0;
 let changed=false;
 const follow=age>=prof.followup&&gap>=prof.gap;
 const supervisor=age>=prof.supervisor+Math.floor(extension*.35)&&rp.validContactAttempts>=1;
 const close=age>=prof.close+extension&&rp.validContactAttempts>=prof.minAttempts;
 if(follow&&!rp.followupEligible){rp.followupEligible=true;changed=true;if(!rp.followupNotice){rp.followupNotice=true;addMsg(t,"system",`Requester Response Policy: ${t.user} has not responded within the normal follow-up window. A documented follow-up is now appropriate.`,true)}}
 if(supervisor&&!rp.supervisorEligible){rp.supervisorEligible=true;changed=true;if(!rp.supervisorNotice){rp.supervisorNotice=true;addMsg(t,"system",`Requester Response Policy: supervisor assistance is now available because the requested response remains outstanding.`,true)}}
 if(close&&!rp.policyEligible){rp.policyEligible=true;changed=true;if(!rp.policyNotice){rp.policyNotice=true;addMsg(t,"system",`Agency Response Policy: requester response time is now outside the acceptable window after ${rp.validContactAttempts} documented contact attempt${rp.validContactAttempts===1?"":"s"}. You may legitimately close this ticket as Closed — No Requester Response. The requester may reopen it later.`,true);if(state.selected!==t.id)toast(`${t.id} is eligible for no-response closure.`)}}
 return changed;
}
function requesterFollowupAccelerationChance(t,valid){
 const rp=ensureResponsePolicy(t),p=getPerson(t),e=getEmployee(t);
 let chance=valid?.38:.10;
 if(rp.validContactAttempts>=2)chance+=.16;
 if(rp.validContactAttempts>=3)chance+=.08;
 if(t.priority==="High")chance+=.07;if(t.priority==="Critical")chance+=.12;
 if(p?.id==="slow")chance-=.06;if(p?.id==="nonresponsive")chance-=.12;if(p?.id==="impatient")chance+=.08;
 const responseFactor=EMPLOYEE_RESPONSE.find(x=>x.id===e?.responseStyle)?.factor||1;if(responseFactor<.9)chance+=.06;else if(responseFactor>1.3)chance-=.05;
 return Math.max(.08,Math.min(.78,chance));
}
function accelerateRequesterResponse(t,strength=.42){
 const now=Date.now(),events=responsePendingUserEvents(t);if(!events.length)return false;
 let changed=false;
 events.forEach(p=>{
   const remaining=Math.max(700,p.due-now),newRemaining=Math.max(1200,Math.round(remaining*strength));
   if(now+newRemaining<p.due){p.due=now+newRemaining;changed=true}
 });
 if(changed){const rp=ensureResponsePolicy(t);rp.accelerations++;state.responseStats.accelerated++}
 return changed;
}
function sendRequesterFollowup(){
 const t=getTicket();if(!t||t.resolved)return;
 const rp=ensureResponsePolicy(t);if(!rp.active||!t.waiting||!responsePendingUserEvents(t).length){toast("There is no outstanding requester response to follow up on.");return}
 const prof=requesterPolicyProfile(t),gap=responseContactGapAge(t),valid=gap>=prof.gap;
 rp.contactAttempts++;state.responseStats.followups++;rp.scheduledFollowup=false;rp.scheduledFollowupDue=false;state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&p.type==="followupReminder"));
 if(valid){rp.validContactAttempts++;rp.lastContactClock=state.clock;rp.lastContactReal=Date.now();rp.followupEligible=false}
 else{rp.spamCount++;state.responseStats.spamFollowups++;t.bad+=rp.spamCount>=2?1:0;const e=getEmployee(t);if(e){e.satisfaction=clamp(e.satisfaction-1,0,100);e.patience=clamp(e.patience-1,0,100)}}
 const n=rp.contactAttempts;
 const text=n<=2?"Just following up on this — when you have a moment, could you reply with the requested result so I can keep the ticket moving?":n===3?"Checking in again on this ticket. We're still waiting on the requested information before we can continue.":"Following up again. Please let me know whether you still need assistance and provide the requested result when available.";
 addMsg(t,"agent",text);
 const chance=requesterFollowupAccelerationChance(t,valid),accelerated=Math.random()<chance&&accelerateRequesterResponse(t,n>=3?.24:n===2?.34:.45);
 if(accelerated)addMsg(t,"system","Follow-up appears to have moved the pending requester response forward.",true);
 if(!valid){
   state.pending.push({type:"userNudgeAck",ticketId:t.id,due:Date.now()+2200+Math.random()*4200,text:rand(["I saw the message. I haven't had time to test yet.","I'm working on it — I'll reply when I can.","Yes, I saw the earlier request. I just haven't been able to check yet."])});
 }
 advanceTime(2);responsePolicyCheck(t);saveState();renderAll();
}
function scheduleRequesterFollowup(minutes=15){
 const t=getTicket();if(!t||t.resolved)return;const rp=ensureResponsePolicy(t);
 if(!rp.active){toast("There is no outstanding requester response to schedule a follow-up for.");return}
 state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&p.type==="followupReminder"));
 const realDelay=Math.max(3500,Math.round(minutes*1000));
 state.pending.push({type:"followupReminder",ticketId:t.id,due:Date.now()+realDelay,minutes});
 rp.scheduledFollowup=true;rp.scheduledFollowupDue=false;state.responseStats.scheduledFollowups++;
 addMsg(t,"system",`Follow-up reminder scheduled for approximately ${minutes} simulated minutes from now. You can continue working other tickets.`,true);
 saveState();renderAll();
}
function alternateValidationAllowed(t){
 if(!t||t.requesterAccountDeleted)return false;
 const txt=`${t.category} ${t.subject} ${t.ticketType}`.toLowerCase();
 if(/password|mfa|multi-factor|phish|malware|security|privacy|legal|personal|individual access|account lock|delete|termination|hr data|clinical record/.test(txt))return false;
 return /printer|network|vpn|shared|mailbox|calendar|conference|fomo|application|app |website|service|outage|file|drive|folder|room|projector|wifi|wireless/.test(txt)||!!activeMajorFor(t);
}
function responseWorkReady(t){
 return t.actions.includes("correct-action")||t.specialistResolution||!!t.request?.fulfilled||!!t.selfResolved;
}
function addSupervisorResponseMsg(t,text){
 t.conversation.push({who:"requesterSupervisor",supervisor:t.supervisor||t.actors?.supervisor?.name||"Requester supervisor",text,time:nowStamp()});
 if(state.selected!==t.id)t.unread++;
}
function escalateRequesterSupervisor(){
 const t=getTicket();if(!t||t.resolved)return;const rp=ensureResponsePolicy(t);responsePolicyCheck(t);
 if(!rp.active||!rp.supervisorEligible){toast("Requester-supervisor escalation is not yet eligible under the response policy.");return}
 if(rp.supervisorRequested){toast("The requester's supervisor has already been contacted.");return}
 rp.supervisorRequested=true;state.responseStats.supervisorEscalations++;
 addMsg(t,"agent",`I'm escalating the outstanding response request to ${t.supervisor||"your supervisor"} so we can either continue troubleshooting or determine an appropriate disposition.`);
 addMsg(t,"system",`Response assistance request sent to ${t.supervisor||"the requester's supervisor"}.`,true);
 state.pending.push({type:"requesterSupervisorResponse",ticketId:t.id,due:Date.now()+4500+Math.random()*9000});
 advanceTime(3);saveState();renderAll();
}
function processRequesterSupervisorResponse(t){
 const rp=ensureResponsePolicy(t),name=t.supervisor||t.actors?.supervisor?.name||"Requester supervisor",r=Math.random();
 state.responseStats.supervisorAssists++;
 if(r<.58){
   addSupervisorResponseMsg(t,`I reached ${t.user}. They're tied up, but I asked them to respond to the ticket as soon as they can.`);
   const moved=accelerateRequesterResponse(t,.16);if(moved)addMsg(t,"system","Supervisor assistance substantially accelerated the pending requester response.",true);
 }else if(r<.72&&alternateValidationAllowed(t)&&responseWorkReady(t)){
   addSupervisorResponseMsg(t,"The original requester is unavailable, but I checked with another affected employee in the department. They confirmed the service is working normally now.");
   t.alternateValidated=true;t.noCsat=true;state.responseStats.alternateValidations++;clearRequesterWait(t);finalizeTicket(t,"Resolved — Alternate Validation",{showReport:state.selected===t.id});
 }else if(r<.84){
   rp.outOfOffice=true;rp.deadlineExtension=Math.max(rp.deadlineExtension||0,20);
   addSupervisorResponseMsg(t,`${t.user} is away from work right now. If this can be validated by another affected employee, that's fine; otherwise please hold it for their return.`);
   addMsg(t,"system","Known requester unavailability extended the normal no-response deadline. Alternate validation may be appropriate for shared services.",true);
 }else if(r<.93){
   addSupervisorResponseMsg(t,`${t.user} no longer needs this request worked. You can close it as withdrawn.`);
   t.requesterWithdrawn=true;t.noCsat=true;state.responseStats.withdrawals++;clearRequesterWait(t);finalizeTicket(t,"Closed — Request Withdrawn",{showReport:state.selected===t.id});
 }else{
   addMsg(t,"system",`${name} has not responded to the escalation request yet. Continue normal response-policy aging.`,true);
 }
}
function requestAlternateValidation(){
 const t=getTicket();if(!t||t.resolved)return;const rp=ensureResponsePolicy(t);
 if(!rp.supervisorRequested){toast("Contact the requester's supervisor first.");return}
 if(!alternateValidationAllowed(t)){toast("This ticket requires validation from the original requester.");return}
 if(rp.alternateRequested){toast("Alternate validation has already been requested.");return}
 rp.alternateRequested=true;
 addMsg(t,"system","Alternate department validation requested through the requester's supervisor.",true);
 state.pending.push({type:"alternateValidation",ticketId:t.id,due:Date.now()+4500+Math.random()*8000});
 saveState();renderAll();
}
function processAlternateValidation(t){
 const rp=ensureResponsePolicy(t),ready=responseWorkReady(t);
 if(ready&&Math.random()<.72){
   addSupervisorResponseMsg(t,"I found another affected employee who can validate this shared service. They tested it and confirmed it is working normally.");
   t.alternateValidated=true;t.noCsat=true;state.responseStats.alternateValidations++;clearRequesterWait(t);finalizeTicket(t,"Resolved — Alternate Validation",{showReport:state.selected===t.id});
 }else{
   addSupervisorResponseMsg(t,ready?"I couldn't get an alternate employee to validate it yet. You'll need the original requester or the normal inactivity policy.":"I found another employee, but they can't validate a fix because the underlying work isn't complete yet.");
   rp.alternateRequested=false;
 }
}
function closeNoRequesterResponse(){
 const t=getTicket();if(!t||t.resolved)return;const rp=ensureResponsePolicy(t);responsePolicyCheck(t);
 if(!rp.policyEligible){toast("This ticket is not yet eligible for policy-based no-response closure.");return}
 if(t.approval?.required&&!approvalFlowApproved(t)){toast("A pending/invalid approval cannot be bypassed with requester inactivity closure.");return}
 if(!confirm(`Close ${t.id} under the agency requester-inactivity policy?\n\nThis is a legitimate closure after documented contact attempts. It is not a technical confirmation. The requester may reopen the ticket later.`))return;
 t.noCsat=true;t.reopenRouting="player";clearRequesterWait(t);state.responseStats.policyClosures++;
 finalizeTicket(t,"Closed — No Requester Response");
}
function releasePolicyReopenToSharedQueue(ticketId=null){
 const t=state.tickets.find(x=>x.id===(ticketId||state.selected));if(!t||t.outcome!=="Closed — No Requester Response")return;
 t.reopenRouting="shared";saveState();renderAll();toast("Any reopen will enter the shared Service Desk queue.");
 if(!document.getElementById("genericModal")?.classList.contains("hidden"))showTicketReport(t);
}
function keepPolicyReopenWithMe(ticketId=null){
 const t=state.tickets.find(x=>x.id===(ticketId||state.selected));if(!t||t.outcome!=="Closed — No Requester Response")return;
 t.reopenRouting="player";saveState();renderAll();toast("Any reopen will return to your queue.");
 if(!document.getElementById("genericModal")?.classList.contains("hidden"))showTicketReport(t);
}
function responsePolicyPanel(t,compact=false){
 const rp=ensureResponsePolicy(t);if(!rp.active||t.resolved)return "";
 responsePolicyCheck(t);
 const prof=requesterPolicyProfile(t),age=responseWaitAge(t),gap=responseContactGapAge(t),nextFollow=Math.max(0,prof.gap-gap),closeAt=prof.close+(rp.deadlineExtension||0),cls=rp.policyEligible?"eligible":rp.supervisorEligible||rp.followupEligible?"slow":"";
 const buttons=[
   `<button class="${rp.followupEligible?"followup-valid":"followup-soon"}" onclick="sendRequesterFollowup()">Send Follow-Up${rp.followupEligible?"":" Anyway"}</button>`,
   `<button class="secondary" onclick="scheduleRequesterFollowup(15)">Remind Me in 15m</button>`,
   rp.supervisorEligible&&!rp.supervisorRequested?`<button class="secondary" onclick="escalateRequesterSupervisor()">Ask ${esc(t.supervisor||"Supervisor")} to Prompt Response</button>`:"",
   rp.supervisorRequested&&alternateValidationAllowed(t)?`<button class="secondary" onclick="requestAlternateValidation()">Request Alternate Validator</button>`:"",
   rp.policyEligible?`<button class="primary" onclick="closeNoRequesterResponse()">Close — No Requester Response</button>`:""
 ].filter(Boolean).join("");
 return `<div class="responsepolicy ${cls}"><h4>Requester Response Policy${rp.policyEligible?' <span class="policytag">Closure Eligible</span>':""}</h4><div>${rp.outOfOffice?"Known absence is extending the normal deadline. ":""}The requester has an outstanding response request. Follow-ups can legitimately accelerate a pending response, but repeated messages sent too close together may annoy them and do not count as separate policy attempts.</div><div class="policygrid"><div class="policycell"><b>${age}m</b><span>Wait Age</span></div><div class="policycell"><b>${rp.validContactAttempts}/${prof.minAttempts}</b><span>Valid Contacts</span></div><div class="policycell"><b>${rp.followupEligible?"Now":nextFollow+"m"}</b><span>Follow-Up</span></div><div class="policycell"><b>${Math.max(0,closeAt-age)}m</b><span>Closure In</span></div></div><div class="responseactions">${buttons}</div>${rp.scheduledFollowup?`<div class="small">${rp.scheduledFollowupDue?"Follow-up reminder is due now.":"A follow-up reminder is scheduled."}</div>`:""}</div>`;
}
window.sendRequesterFollowup=sendRequesterFollowup;window.scheduleRequesterFollowup=scheduleRequesterFollowup;window.escalateRequesterSupervisor=escalateRequesterSupervisor;window.requestAlternateValidation=requestAlternateValidation;window.closeNoRequesterResponse=closeNoRequesterResponse;window.releasePolicyReopenToSharedQueue=releasePolicyReopenToSharedQueue;window.keepPolicyReopenWithMe=keepPolicyReopenWithMe;

function pickActorName(exclude=[]){
 const pool=NAMES.filter(n=>!exclude.includes(n));return rand(pool.length?pool:NAMES);
}
function appNameForScenario(sc){
 const txt=`${sc?.cat||""} ${(sc?.subject||[]).join(" ")}`;
 return Object.keys(APP_OWNER_TEAMS).find(k=>txt.includes(k))||null;
}
function createOrgActors(sc,department,supervisor,manager,user=null){
 const used=[user,supervisor,manager].filter(Boolean);
 const actor=(key,role,team,name=null)=>{
   const n=name||pickActorName(used);if(!used.includes(n))used.push(n);
   return {key,role,team,name:n};
 };
 const app=appNameForScenario(sc),appTeam=app?APP_OWNER_TEAMS[app]:"Enterprise Applications";
 const dataTeam=/PeopleChock|Human Resources/i.test(sc?.cat||"")?"Human Resources":/DumbCare|Clinical/i.test(sc?.cat||"")?"Clinical Data Governance":/AssetHound/i.test(sc?.cat||"")?"Asset Management":"Data & Analytics";
 return {
   supervisor:actor("supervisor","Supervisor",department,supervisor),
   manager:actor("manager","Manager",department,manager),
   applicationOwner:actor("applicationOwner","Application Owner",appTeam),
   dataOwner:actor("dataOwner","Data Owner",dataTeam),
   security:actor("security","Security Reviewer","Security Operations"),
   privacy:actor("privacy","Privacy Officer","Privacy Office"),
   records:actor("records","Records Officer","Records Management"),
   hr:actor("hr","HR Data Owner","Human Resources"),
   procurement:actor("procurement","Procurement Reviewer","Procurement"),
   legal:actor("legal","Legal Counsel","County Counsel / Legal"),
   assetOwner:actor("assetOwner","Asset Management Approver","IT Asset Management"),
   clinicalOwner:actor("clinicalOwner","Clinical Data Owner","Clinical Applications"),
   dutyManager:actor("dutyManager","Duty Manager","IT Operations")
 };
}
function approvalRolesFor(sc,cause){
 if(Array.isArray(cause?.approvalChain)&&cause.approvalChain.length)return [...cause.approvalChain];
 if(!cause?.approvalRequired)return [];
 const cat=(sc?.cat||"").toLowerCase(),roles=["manager"];
 if(/privileged|api|service account|external|security|policy exception|vendor/.test(cat))roles.push("security");
 if(/software|procurement/.test(cat))roles.push("procurement");
 if(/asset/.test(cat))roles.push("assetOwner");
 if(/peoplechock|hr /.test(cat))roles.push("hr");
 if(/dumbcare|clinical/.test(cat))roles.push("clinicalOwner");
 if(/granular|data /.test(cat)||sc?.dataGovernance)roles.push("dataOwner");
 if(/privacy/.test(cat))roles.push("privacy");
 if(/record|deletion|legal hold|archive|backup/.test(cat))roles.push("records");
 const app=appNameForScenario(sc);
 if(app&&!roles.includes("applicationOwner"))roles.push("applicationOwner");
 // Keep inferred chains understandable; explicit chains may be longer.
 return [...new Set(roles)].slice(0,3);
}
function randomApprovalBehavior(index,total){
 const r=Math.random();
 if(index===0&&r<.14)return "already";
 if(r<.29)return "quick";
 if(r<.49)return "normal";
 if(r<.67)return "slow";
 if(r<.75)return "glacial";
 if(r<.83)return "delegate";
 if(r<.89)return "wrong";
 if(r<.95)return "withdraw";
 return "deny";
}
function approvalActor(t,key){return t?.actors?.[key]||{key,role:key,name:key,team:"Unknown"}}
function recordApprovalHistory(t,stage,action,note,actorOverride=null){
 if(!t?.approval)return;
 const actor=actorOverride||stage?.actorName||approvalActor(t,stage?.actorKey).name||"Workflow";
 t.approval.history=t.approval.history||[];
 t.approval.history.push({time:nowStamp(),actor,role:stage?.role||"Approval Workflow",action,note:note||""});
}
function syncApprovalSummary(t){
 const a=t?.approval;if(!a)return;
 const stages=a.stages||[];
 a.required=stages.length>0;
 a.approved=a.emergencyStatus==="approved" || (stages.length>0&&stages.every(st=>st.status==="approved"));
 a.denied=a.emergencyStatus!=="approved"&&stages.some(st=>st.status==="denied");
 a.pending=a.emergencyStatus==="pending"||stages.some(st=>st.status==="pending");
 a.profile=stages[0]?.behavior||a.profile||"normal";
 a.requestId=a.flowId||a.requestId;
}
function makeApprovalProfile(sc,cause,actors,clock=480){
 const roles=approvalRolesFor(sc,cause);
 if(!roles.length)return null;
 const flowId="APR-"+Math.floor(10000+Math.random()*89999);
 const specified=Array.isArray(cause.approvalBehaviors)?cause.approvalBehaviors:[];
 const stages=roles.map((key,i)=>{
   const ac=actors[key]||actors.manager;
   const behavior=specified[i]||randomApprovalBehavior(i,roles.length);
   const status=behavior==="already"?"approved":"required";
   return {id:`${flowId}-${i+1}`,order:i+1,actorKey:key,actorName:ac.name,role:ac.role,team:ac.team,
     behavior,status,decision:null,requestedAt:null,decidedAt:status==="approved"?clock:null,
     delegatedFrom:null,delegatedTo:null,wrongClaim:behavior==="wrong",withdrawn:false};
 });
 const a={required:true,flowId,requestId:flowId,stages,approved:false,denied:false,pending:false,verified:false,
   history:[],emergencyEligible:!!cause.emergencyEligible,emergencyOutcome:cause.emergencyOutcome||null,
   emergencyStatus:"none",emergencyId:null,profile:stages[0]?.behavior||"normal"};
 const temp={approval:a,actors};
 stages.filter(st=>st.status==="approved").forEach(st=>{
   a.history.push({time:fmtTime(clock),actor:st.actorName,role:st.role,action:"Approved",note:"Approval was already present when the ticket reached the Service Desk."});
 });
 syncApprovalSummary(temp);
 return a;
}
function hydrateApprovalV05(t){
 const sc=SCENARIOS.find(x=>x.id===t.scenarioId),cause=sc?.causes?.find(c=>c.id===t.causeId);
 if(!t.actors)t.actors=createOrgActors(sc||{},t.department||"Unknown",t.supervisor||pickActorName(),t.manager||pickActorName(),t.user);
 if(t.approval&&!Array.isArray(t.approval.stages)){
   const old={...t.approval};
   const flow=makeApprovalProfile(sc||{},cause||{approvalRequired:true},t.actors,t.opened||480);
   if(flow){
     const st=flow.stages[0];
     if(old.approved){flow.stages.forEach(x=>x.status="approved");flow.history.push({time:fmtTime(t.opened||480),actor:st.actorName,role:st.role,action:"Migrated approval",note:"Approval state migrated from SuperService v0.4."});}
     else if(old.denied){st.status="denied";flow.history.push({time:fmtTime(t.opened||480),actor:st.actorName,role:st.role,action:"Migrated denial",note:"Denial state migrated from SuperService v0.4."});}
     else if(old.pending){st.status="pending";flow.history.push({time:fmtTime(t.opened||480),actor:st.actorName,role:st.role,action:"Migrated pending request",note:"Pending approval migrated from SuperService v0.4."});}
     flow.verified=!!old.verified;t.approval=flow;syncApprovalSummary(t);
   }
 }else if(!t.approval&&cause?.approvalRequired){
   t.approval=makeApprovalProfile(sc,cause,t.actors);
 }
 if(t.approval){t.approval.history=t.approval.history||[];syncApprovalSummary(t)}
}
function currentApprovalStage(t){
 const a=t?.approval;if(!a)return null;
 return (a.stages||[]).find(st=>st.status==="pending")||(a.stages||[]).find(st=>st.status==="required"||st.status==="withdrawn")||null;
}
function approvalFlowApproved(t){syncApprovalSummary(t);return !t?.approval?.required||!!t.approval.approved}
function approvalHasConflict(t){
 const sts=t?.approval?.stages||[];return sts.some(x=>x.status==="approved")&&sts.some(x=>x.status==="denied");
}
function approvalDelayMs(t,stage=null){
 const p=stage?.behavior||t.approval?.profile;
 if(p==="quick")return 7000+Math.random()*11000;
 if(p==="normal")return 14000+Math.random()*21000;
 if(p==="slow")return 35000+Math.random()*35000;
 if(p==="glacial")return 65000+Math.random()*55000;
 if(p==="delegate")return 14000+Math.random()*18000;
 if(p==="wrong")return 14000+Math.random()*22000;
 if(p==="withdraw")return 10000+Math.random()*14000;
 if(p==="deny")return 12000+Math.random()*16000;
 return 14000+Math.random()*22000;
}
function approvalAnswer(t){
 const a=t.approval;
 if(!a?.required)return "I don't think this request needs a separate approval.";
 syncApprovalSummary(t);
 if(a.approved)return rand([`The workflow says all required approvals are complete under ${a.flowId}.`,`Yes — ${a.flowId} shows fully approved now.`,`It looks like every approval in the chain is complete.`]);
 const pending=(a.stages||[]).find(st=>st.status==="pending");
 if(pending)return rand([`It's still waiting on ${pending.actorName}, the ${pending.role}.`,`The workflow is pending with ${pending.role} ${pending.actorName}.`,`No update yet — ${pending.actorName} still has it.`]);
 const denied=(a.stages||[]).find(st=>st.status==="denied");
 if(denied)return rand([`${denied.actorName} declined their part of the request.`,`The ${denied.role} denied it in the workflow.`,`It shows denied by ${denied.actorName}.`]);
 const next=(a.stages||[]).find(st=>st.status==="required"||st.status==="withdrawn");
 if(next?.wrongClaim){
   if(!next.wrongClaimCounted){state.approvalStats.wrongClaims++;next.wrongClaimCounted=true}
   return rand([`Yes, my supervisor said it was approved, so I think we're good.`,`I was told it was approved already. My supervisor gave me the okay.`,`My supervisor said yes. Doesn't that count?`]);
 }
 const approvedCount=(a.stages||[]).filter(st=>st.status==="approved").length;
 if(approvedCount)return rand([`${approvedCount} approval${approvedCount===1?" is":"s are"} complete, but it looks like ${next?.role||"another approver"} is still required.`,`My Manager approved their part, but apparently the workflow wants another approval too.`]);
 return rand([`I don't have any formal approval yet.`,`I thought my supervisor's okay was enough, but the workflow doesn't show approval.`,`Nothing is approved in the workflow yet.`]);
}
function requestNextApproval(t){
 if(!t.approval?.required){
   t.irrelevant++;addMsg(t,"agent","Request the next approval in the workflow.");
   scheduleReply(t,rand(["There isn't an approval step showing for this request.","What approval are we waiting for?","The workflow doesn't say this needs approval."]));saveState();renderAll();return;
 }
 syncApprovalSummary(t);
 if(t.approval.approved){
   t.repeats++;t.irrelevant++;addMsg(t,"agent","Request the next approval in the workflow.");
   scheduleReply(t,rand(["The workflow already shows complete approval.","There isn't another approver after this.","Everything required is already approved."]));saveState();renderAll();return;
 }
 if(t.approval.pending){
   const p=currentApprovalStage(t);t.repeats++;t.irrelevant++;addMsg(t,"agent",`Follow up on the pending ${p?.role||"approval"}.`);
   scheduleReply(t,rand(["It's still pending. I'm waiting too.","No update yet.","The approver hasn't gotten to it."]));saveState();renderAll();return;
 }
 if(t.approval.denied){
   t.irrelevant++;addMsg(t,"agent","Request another approval.");
   scheduleReply(t,rand(["One of the required approvers already denied it.","The denial is still in the workflow.","I don't think asking the next person changes the denial."]));saveState();renderAll();return;
 }
 const stage=(t.approval.stages||[]).find(st=>st.status==="required"||st.status==="withdrawn");
 if(!stage)return;
 t.actions.push("approval-requested:"+stage.id);t.useful++;stage.status="pending";stage.requestedAt=state.clock;t.status="Waiting for Approval";t.waiting=true;
 state.approvalStats.requested++;
 recordApprovalHistory(t,stage,"Requested",`Service Desk requested ${stage.role} approval.`);
 addMsg(t,"agent",`Please route ${t.approval.flowId} to ${stage.actorName} (${stage.role}) for approval.`);
 addMsg(t,"system",`${stage.role} approval is pending with ${stage.actorName}. You can continue working other tickets.`,true);
 if(stage.behavior==="delegate"){
   state.pending.push({type:"approvalDelegation",ticketId:t.id,stageId:stage.id,due:Date.now()+approvalDelayMs(t,stage)});
 }else{
   const decision=stage.behavior==="deny"?"denied":"approved";
   state.pending.push({type:"approvalStage",ticketId:t.id,stageId:stage.id,decision,due:Date.now()+approvalDelayMs(t,stage)});
 }
 syncApprovalSummary(t);saveState();renderAll();
}
function requestManagerApproval(t){requestNextApproval(t)}
function processApprovalDelegation(t,p){
 const st=t.approval?.stages?.find(x=>x.id===p.stageId);if(!st||st.status!=="pending")return;
 const original=st.actorName,delegate=approvalActor(t,"dutyManager");
 st.delegatedFrom=original;st.delegatedTo=delegate.name;st.actorName=delegate.name;
 state.approvalStats.delegated++;
 recordApprovalHistory(t,st,"Delegated",`${original} delegated this approval to ${delegate.name} (${delegate.role}).`,original);
 addMsg(t,"system",`${original} delegated the ${st.role} approval to ${delegate.name}.`,true);
 state.pending.push({type:"approvalStage",ticketId:t.id,stageId:st.id,decision:"approved",due:Date.now()+14000+Math.random()*36000});
}
function processApprovalDecision(t,p){
 const st=t.approval?.stages?.find(x=>x.id===p.stageId);if(!st||st.status!=="pending")return;
 st.decision=p.decision;st.decidedAt=state.clock;st.status=p.decision==="approved"?"approved":"denied";t.waiting=false;t.status="In Progress";
 if(p.decision==="approved"){
   state.approvalStats.approved++;recordApprovalHistory(t,st,"Approved",`${st.role} approval completed.`);
   addMsg(t,"system",`${st.actorName} (${st.role}) approved ${t.approval.flowId}.`,true);
   if(st.behavior==="withdraw"){
     state.pending.push({type:"approvalWithdrawal",ticketId:t.id,stageId:st.id,due:Date.now()+9000+Math.random()*30000});
   }
   syncApprovalSummary(t);
   if(t.approval.approved)addMsg(t,"user",rand(["Looks like all of the approvals are finally done.","The workflow says fully approved now. Can we finish this?","Everything shows approved now."]));
   else{
     const nx=(t.approval.stages||[]).find(x=>x.status==="required");
     addMsg(t,"user",rand([`${st.role} approved it. It looks like ${nx?.role||"someone else"} is next.`,`One approval came through. Of course there is another one.`,`Good news: ${st.actorName} approved their part.`]));
   }
 }else{
   state.approvalStats.denied++;recordApprovalHistory(t,st,"Denied",`${st.role} declined the request.`);
   addMsg(t,"system",`${st.actorName} (${st.role}) DENIED ${t.approval.flowId}.`,true);
   syncApprovalSummary(t);
   addMsg(t,"user",approvalHasConflict(t)?rand(["My Manager approved this. Why does the other approver get to say no?","So one person approved it and another denied it? What happens now?","This is exactly why these approvals take forever. Who actually decides?"]):rand(["They denied it? That's disappointing.","Okay... what happens now?","I was hoping they would approve it."]));
 }
}
function processApprovalWithdrawal(t,p){
 const st=t.approval?.stages?.find(x=>x.id===p.stageId);if(!st||st.status!=="approved")return;
 st.status="withdrawn";st.withdrawn=true;st.decision="withdrawn";state.approvalStats.withdrawn++;
 recordApprovalHistory(t,st,"Withdrawn",`${st.actorName} withdrew previously granted approval because circumstances changed.`);
 syncApprovalSummary(t);
 if(t.resolved){
   t.approvalWithdrawnAfterAction=true;t.bad+=2;t.securityBad+=1;
   reopenTicket(t,`${st.actorName} just withdrew the ${st.role} approval after this was closed. We need to review what happened.`);
   addMsg(t,"system","Approval was withdrawn after execution. Preserve the audit history and reassess authorization.",true);
 }else{
   t.status="In Progress";t.waiting=false;
   addMsg(t,"system",`${st.actorName} WITHDREW the ${st.role} approval. The protected action is no longer authorized.`,true);
   addMsg(t,"user",rand(["Wait — they just withdrew the approval. What do we do now?","My approver changed their mind. Seriously?","The workflow suddenly says Withdrawn."]));
 }
}
function requestEmergencyException(t){
 const a=t.approval;
 if(!a?.required||!a.emergencyEligible){
   t.bad++;t.irrelevant++;addMsg(t,"agent","Request an emergency exception to bypass the normal approval path.");
   addMsg(t,"system","No authorized emergency-exception path applies to this request.",true);
   scheduleReply(t,rand(["Is this actually an emergency exception situation?","I don't think this qualifies for emergency access.","Why would we use an emergency process for this?"]));saveState();renderAll();return;
 }
 if(a.emergencyStatus==="approved"){t.repeats++;t.irrelevant++;toast("Emergency exception is already approved.");return}
 if(a.emergencyStatus==="pending"){t.repeats++;t.irrelevant++;toast("Emergency exception is still pending.");return}
 a.emergencyStatus="pending";a.emergencyId="EXP-"+Math.floor(10000+Math.random()*89999);t.status="Waiting for Approval";t.waiting=true;
 state.approvalStats.requested++;
 a.history.push({time:nowStamp(),actor:"Service Desk",role:"Emergency Workflow",action:"Exception requested",note:`${a.emergencyId} sent to Duty Manager and Security for emergency review.`});
 addMsg(t,"system",`${a.emergencyId}: Emergency exception requested. This does not guarantee approval.`,true);
 const outcome=a.emergencyOutcome||(Math.random()<.68?"approved":"denied");
 state.pending.push({type:"emergencyDecision",ticketId:t.id,decision:outcome,due:Date.now()+12000+Math.random()*28000});
 syncApprovalSummary(t);saveState();renderAll();
}
function processEmergencyDecision(t,p){
 const a=t.approval;if(!a||a.emergencyStatus!=="pending")return;
 a.emergencyStatus=p.decision;t.waiting=false;t.status="In Progress";
 const duty=approvalActor(t,"dutyManager"),sec=approvalActor(t,"security");
 if(p.decision==="approved"){
   state.approvalStats.emergency++;state.approvalStats.approved++;
   a.history.push({time:nowStamp(),actor:`${duty.name} + ${sec.name}`,role:"Emergency Review",action:"Exception approved",note:`${a.emergencyId} approved as a time-limited audited exception.`});
   addMsg(t,"system",`${a.emergencyId} APPROVED by Duty Manager ${duty.name} and Security ${sec.name}. Standard pending approvals are temporarily superseded for the approved scope.`,true);
   addMsg(t,"user",rand(["The emergency approval came through.","It says the exception is approved. Can we proceed?","Finally — the emergency workflow approved it."]));
 }else{
   state.approvalStats.denied++;
   a.history.push({time:nowStamp(),actor:`${duty.name} + ${sec.name}`,role:"Emergency Review",action:"Exception denied",note:`${a.emergencyId} did not meet emergency exception criteria.`});
   addMsg(t,"system",`${a.emergencyId} DENIED. Continue through the standard approval path or escalate appropriately.`,true);
   addMsg(t,"user",rand(["They denied the emergency exception.","So we have to wait for the normal approval after all?","The exception was denied. Great."]));
 }
 syncApprovalSummary(t);
}
function verifyApprovalWorkflow(t){
 const repeated=t?.toolsUsed?.includes("approval");
 if(repeated){t.repeats++;t.irrelevant++;}else if(t){t.toolsUsed.push("approval");if(t.approval?.required)t.useful+=.5;else t.irrelevant++;}
 if(!t?.approval){toolResult="Check Approval Workflow\n\nNo formal approval chain is attached to this request.";renderTab();saveState();return}
 t.approval.verified=true;syncApprovalSummary(t);
 const lines=(t.approval.stages||[]).map(st=>`${st.order}. ${st.role} — ${st.actorName}: ${st.status.toUpperCase()}${st.delegatedFrom?` (delegated from ${st.delegatedFrom})`:""}`);
 toolResult=`Check Approval Workflow\n\n${t.approval.flowId}\n${lines.join("\n")}\nEmergency exception: ${String(t.approval.emergencyStatus||"none").toUpperCase()}`;
 addMsg(t,"system",toolResult,true);saveState();renderAll();
}
function orgDirectoryText(t){
 if(!t?.actors)return "No organizational actor map is available.";
 return Object.values(t.actors).map(a=>`${a.role}: ${a.name} — ${a.team}`).join("\n");
}
function badDiagnosticReply(t,opt){
 let base=rand(opt.response);
 const p=getPerson(t);
 if(p.id==="impatient")base=rand(["Seriously? "+base,"I don't have time for random steps. "+base,base]);
 if(p.id==="technical")base=rand([base,"What evidence points to that step? "+base,base]);
 if(p.id==="frustrated")base=rand(["That feels like we're guessing. "+base,base]);
 return base;
}
function chooseBadDiagnostics(){
 const max=BAD_DIAGNOSTICS.length;
 let count=2;
 if(state.difficulty==="Trainee")count=2+(Math.random()<.35?1:0);
 else if(state.difficulty==="Service Agent")count=3+(Math.random()<.50?1:0);
 else if(state.difficulty==="Senior Agent")count=4+(Math.random()<.55?1:0);
 else count=5+(Math.random()<.60?1:0);
 return shuffle(BAD_DIAGNOSTICS).slice(0,Math.min(count,max)).map(x=>x.id);
}
function stableRank(s){
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
function variedUserReply(t,base){
 const p=getPerson(t),e=getEmployee(t);
 const tails={
  friendly:[" Thanks!"," Appreciate it."," Let me know what else you need."],
  technical:[" That's what I'm seeing."," Hopefully that narrows it down."," I can test another condition if useful."],
  inexperienced:[" Is that the information you needed?"," I hope I checked the right thing."," Sorry if I'm describing it badly."],
  impatient:[" Can we get this moving?"," I still need this working."," What's the next step?"],
  frustrated:[" This has been a headache."," That's where I'm at."," I really hope we're close."],
  nervous:[" Did I mess something up?"," Is that bad?"," Please tell me that can be fixed."],
  terse:[""," That's it.",""],
  chatty:[" Anyway, that's what I'm seeing."," Sorry for the novel."," Hopefully that helps."]
 };
 if(Math.random()<.42){
   const arr=tails[p.id];
   if(arr)base+=rand(arr);
 }
 if(e?.techSkill==="power"&&Math.random()<.20)base+=rand([" I can pull another log if you need it."," I can reproduce it again if that helps."," I haven't changed anything else yet."]);
 if(e?.techSkill==="novice"&&Math.random()<.16)base+=rand([" I'm not totally sure I checked the right thing."," You may need to tell me exactly where to click."," Sorry, I'm not very technical."]);
 base+=relationshipReplyTail(t);
 return base;
}


const REQUEST_TYPES=["Service Request","Access Request","Software Request","Hardware Request","Data / Records Request","Security Request","Change Request"];
const CLASSIFICATION_TYPES=["Incident","Security Incident",...REQUEST_TYPES];
const REQUEST_FIELD_DEFS={
 targetUser:{label:"Target user",ask:"Ask who the request is for"},
 department:{label:"Department",ask:"Ask which department this is for"},
 businessNeed:{label:"Business need",ask:"Ask for the business need / justification"},
 system:{label:"System / service",ask:"Ask which system or service this request concerns"},
 accessLevel:{label:"Requested access",ask:"Ask what access level or role is needed"},
 device:{label:"Target device",ask:"Ask which device should receive the change"},
 software:{label:"Software / product",ask:"Ask exactly which software or product is requested"},
 quantity:{label:"Quantity",ask:"Ask how many licenses/items are needed"},
 costCenter:{label:"Cost center",ask:"Ask which cost center should fund the request"},
 effectiveDate:{label:"Effective date",ask:"Ask when the request should take effect"},
 expirationDate:{label:"Expiration",ask:"Ask when temporary access should expire"},
 sponsor:{label:"Sponsor / manager",ask:"Ask who is sponsoring or approving the request"},
 dataScope:{label:"Data scope",ask:"Ask exactly which data or records are in scope"},
 retentionBasis:{label:"Retention / legal status",ask:"Ask whether retention or legal-hold restrictions apply"},
 sourceAsset:{label:"Source asset(s)",ask:"Ask which asset(s) are involved"},
 destinationUnit:{label:"Destination unit",ask:"Ask which unit should receive the asset(s)"},
 mailbox:{label:"Mailbox / resource",ask:"Ask which mailbox or resource is involved"},
 externalParty:{label:"External party",ask:"Ask which vendor or external party needs access"},
 environment:{label:"Environment",ask:"Ask whether this is production, test, or another environment"},
 changeWindow:{label:"Change window",ask:"Ask when the production change should occur"},
 phoneNumber:{label:"New phone number",ask:"Ask for the new approved MFA phone number"},
 onboardingRole:{label:"Role / start details",ask:"Ask for the new employee role, department, and start date"}
};
const SERVICE_CATALOG=[
 {id:"software-install",name:"Standard Software Installation",type:"Software Request",team:"applications",target:480,standard:true,desc:"Install an approved catalog application on a managed endpoint.",fields:["targetUser","device","software","businessNeed"]},
 {id:"software-license",name:"Software License / Seat",type:"Software Request",team:"vendor",target:720,standard:true,desc:"Assign or acquire an approved software entitlement.",fields:["targetUser","software","quantity","businessNeed"],approvalChain:["manager"]},
 {id:"software-purchase",name:"New Software Acquisition",type:"Software Request",team:"vendor",target:1440,standard:false,desc:"Acquire software that is not already in the supported catalog.",fields:["software","quantity","businessNeed","costCenter","sponsor"],approvalChain:["manager","procurement","security"]},
 {id:"new-hire",name:"New Employee Onboarding",type:"Service Request",team:"identity",target:960,standard:true,desc:"Standard account, endpoint, MFA, and baseline application provisioning for a new worker.",fields:["targetUser","onboardingRole","effectiveDate","sponsor"]},
 {id:"standard-groups",name:"Standard Department Access",type:"Access Request",team:"identity",target:480,standard:true,desc:"Provision standard group memberships associated with an approved role.",fields:["targetUser","department","businessNeed","sponsor"],approvalChain:["manager"]},
 {id:"fomo-access",name:"Fomo Workspace Access",type:"Access Request",team:"collaboration",target:480,standard:true,desc:"Add a user to a controlled Fomo workspace.",fields:["targetUser","system","accessLevel","businessNeed","sponsor"],approvalChain:["manager","applicationOwner"]},
 {id:"external-guest",name:"Fomo External Guest",type:"Access Request",team:"collaboration",target:720,standard:false,desc:"Invite an external party to a controlled Fomo workspace.",fields:["externalParty","system","businessNeed","expirationDate","sponsor"],approvalChain:["manager","applicationOwner","security"]},
 {id:"granular-access",name:"Granular Restricted Data Access",type:"Access Request",team:"data",target:720,standard:false,desc:"Grant row-level or otherwise restricted analytics access.",fields:["targetUser","system","accessLevel","businessNeed","dataScope","sponsor"],approvalChain:["manager","dataOwner"]},
 {id:"dumbcare-access",name:"DumbCare Cross-Program Access",type:"Access Request",team:"clinical",target:720,standard:false,desc:"Grant clinical access outside the requester's ordinary program boundary.",fields:["targetUser","system","accessLevel","businessNeed","expirationDate","sponsor"],approvalChain:["manager","clinicalOwner"]},
 {id:"emergency-clinical",name:"Emergency Clinical Access",type:"Access Request",team:"clinical",target:120,standard:false,desc:"Audited emergency cross-program clinical access for an active care need.",fields:["targetUser","businessNeed","dataScope","expirationDate"],approvalChain:["clinicalOwner","security"]},
 {id:"privileged-access",name:"Temporary Privileged Access",type:"Access Request",team:"security",target:480,standard:false,desc:"Time-limited elevated access for a supported business workflow.",fields:["targetUser","device","businessNeed","expirationDate","sponsor"],approvalChain:["manager","security"]},
 {id:"vendor-account",name:"Temporary Vendor Account",type:"Access Request",team:"identity",target:960,standard:false,desc:"Create controlled, sponsored, time-limited external workforce access.",fields:["externalParty","businessNeed","system","expirationDate","sponsor"],approvalChain:["manager","security","applicationOwner"]},
 {id:"vendor-admin",name:"Vendor Privileged Production Access",type:"Access Request",team:"security",target:240,standard:false,desc:"Audited, time-limited vendor privilege in production.",fields:["externalParty","system","environment","businessNeed","expirationDate","sponsor"],approvalChain:["manager","applicationOwner","security"]},
 {id:"api-access",name:"Production API Credential",type:"Access Request",team:"security",target:720,standard:false,desc:"Issue a managed API/service credential for an approved integration.",fields:["system","externalParty","environment","businessNeed","expirationDate","sponsor"],approvalChain:["applicationOwner","security"]},
 {id:"mailbox-delegate",name:"Mailbox Delegate Access",type:"Access Request",team:"messaging",target:480,standard:true,desc:"Grant approved delegate permissions to a mailbox.",fields:["targetUser","mailbox","accessLevel","businessNeed","sponsor"],approvalChain:["manager"]},
 {id:"shared-mailbox",name:"Shared Mailbox Creation",type:"Service Request",team:"messaging",target:720,standard:true,desc:"Create a shared organizational mailbox with named ownership.",fields:["mailbox","businessNeed","sponsor","department"],approvalChain:["manager"]},
 {id:"mfa-change",name:"MFA Contact / Device Change",type:"Service Request",team:"identity",target:240,standard:true,desc:"Replace an obsolete approved MFA contact method after identity verification.",fields:["targetUser","phoneNumber","businessNeed"]},
 {id:"hardware-upgrade",name:"Standard Hardware Upgrade",type:"Hardware Request",team:"endpoint",target:1440,standard:true,desc:"Replace or upgrade an endpoint using supported hardware standards.",fields:["targetUser","device","businessNeed","sponsor"],approvalChain:["manager","assetOwner"]},
 {id:"hardware-exception",name:"Nonstandard Hardware Exception",type:"Hardware Request",team:"asset",target:1920,standard:false,desc:"Review and procure a nonstandard device when the supported catalog cannot meet a validated need.",fields:["targetUser","businessNeed","costCenter","sponsor"],approvalChain:["manager","procurement","assetOwner"]},
 {id:"asset-transfer",name:"Asset Custody Transfer",type:"Service Request",team:"asset",target:720,standard:true,desc:"Move custody of managed equipment between organizational units.",fields:["sourceAsset","destinationUnit","businessNeed","sponsor"],approvalChain:["manager","assetOwner"]},
 {id:"asset-disposition",name:"Asset Disposition / Write-Off",type:"Service Request",team:"asset",target:960,standard:false,desc:"Retire, write off, or dispose of managed assets with custody evidence.",fields:["sourceAsset","businessNeed","sponsor"],approvalChain:["manager","assetOwner"]},
 {id:"data-export",name:"Restricted Data Export",type:"Data / Records Request",team:"data",target:960,standard:false,desc:"Produce a controlled export of sensitive or employee-level data.",fields:["dataScope","businessNeed","sponsor","effectiveDate"],approvalChain:["manager","dataOwner","privacy"]},
 {id:"records-deletion",name:"Records / Data Deletion",type:"Data / Records Request",team:"privacyrecords",target:1440,standard:false,desc:"Delete organizational data only after authority, retention, and hold validation.",fields:["dataScope","businessNeed","retentionBasis","sponsor"],approvalChain:["manager","dataOwner","records"]},
 {id:"privacy-deletion",name:"Privacy Deletion Request",type:"Data / Records Request",team:"privacyrecords",target:1440,standard:false,desc:"Execute an approved privacy deletion through the governed privacy workflow.",fields:["targetUser","dataScope","businessNeed","retentionBasis"],approvalChain:["privacy","records"]},
 {id:"archive-restore",name:"Archive Restore",type:"Data / Records Request",team:"files",target:960,standard:false,desc:"Restore an approved subset of archived data to a controlled location.",fields:["dataScope","businessNeed","retentionBasis","sponsor"],approvalChain:["manager","dataOwner","records"]},
 {id:"broadcast-email",name:"Organization-Wide Message",type:"Service Request",team:"messaging",target:480,standard:false,desc:"Send approved organization-wide messaging through the controlled distribution path.",fields:["businessNeed","sponsor","effectiveDate"],approvalChain:["manager"]},
 {id:"external-forwarding",name:"External Mail Forwarding Exception",type:"Security Request",team:"security",target:480,standard:false,desc:"Review a narrow external-forwarding exception with explicit security approval.",fields:["mailbox","externalParty","businessNeed","expirationDate","sponsor"],approvalChain:["manager","security"]},
 {id:"production-change",name:"Production Application Rule Change",type:"Change Request",team:"workflow",target:960,standard:false,desc:"Modify a production workflow/rule through an approved controlled-change path.",fields:["system","environment","businessNeed","changeWindow","sponsor"],approvalChain:["manager","applicationOwner"]},
 {id:"policy-owner",name:"Application / Policy Ownership Change",type:"Access Request",team:"governance",target:720,standard:false,desc:"Change controlled ownership after an organizational responsibility change.",fields:["targetUser","system","businessNeed","sponsor"],approvalChain:["manager","applicationOwner"]},
 {id:"service-identity",name:"Controlled Non-Person Service Identity",type:"Access Request",team:"identity",target:960,standard:false,desc:"Create a controlled non-person identity only for supported kiosk/service workflows where individual authentication is inappropriate.",fields:["system","businessNeed","accessLevel","sponsor","expirationDate"],approvalChain:["applicationOwner","security"]},
 {id:"generic-access",name:"General Controlled Access Request",type:"Access Request",team:"identity",target:720,standard:false,desc:"Controlled access request without a more specific standard catalog item.",fields:["targetUser","system","accessLevel","businessNeed","sponsor"],approvalChain:["manager","applicationOwner"]}
];
const CATALOG_SCENARIO_MAP={
 install:"software-install",license:"software-license",newhire:"new-hire","newhire-license":"software-license","newhire-groups":"standard-groups",
 "fomo-access":"fomo-access","fomo-guest":"external-guest","granular-rla":"granular-access","dumbcare-access":"dumbcare-access","dumbcare-breakglass":"emergency-clinical",
 privaccess:"privileged-access","vendor-account":"vendor-account","vendor-prod-admin":"vendor-admin","api-key":"api-access",maildelegate:"mailbox-delegate",sharedmailbox:"shared-mailbox",
 "mfa-number":"mfa-change",hardwareupgrade:"hardware-upgrade","hardware-exception":"hardware-exception","assethound-transfer":"asset-transfer","asset-transfer-exec":"asset-transfer",
 "assethound-writeoff":"asset-disposition","granular-export":"data-export",privacydelete:"privacy-deletion","archive-restore":"archive-restore",massmail:"broadcast-email",
 "external-forward":"external-forwarding","illogic-prod-rule":"production-change","policy-owner-change":"policy-owner","approval-withdrawal":"generic-access","software-purchase":"software-purchase",
 deletetest:"records-deletion",deletemailbox:"records-deletion","illogic-delete":"records-deletion",policydelete:"records-deletion","assethound-delete":"records-deletion",
 "legalhold-folder":"records-deletion","backup-delete":"records-deletion","hold-release":"records-deletion","granular-delete-prod":"records-deletion",deletehold:"records-deletion","shared-account":"service-identity"
};
const CATALOG_CAUSE_MAP={"fileaccess:new":"generic-access"};
function catalogItem(id){return SERVICE_CATALOG.find(x=>x.id===id)||null}
function catalogForScenario(sc,cause=null){return catalogItem(CATALOG_CAUSE_MAP[`${sc?.id}:${cause?.id}`]||CATALOG_SCENARIO_MAP[sc?.id])}
function expectedTicketTypeFor(sc,cause=null){
 const item=catalogForScenario(sc,cause);if(item)return item.type;
 if(sc?.id==="wrong-priority")return "Incident";
 const c=(sc?.cat||"").toLowerCase(),sub=(sc?.subject||[]).join(" ").toLowerCase();
 if(sc?.dataGovernance||/deletion|records|privacy|data governance|legal hold/.test(c))return "Data / Records Request";
 if(/security|phishing|lost equipment|mfa fatigue/.test(c))return "Security Incident";
 if(/change request/.test(c))return "Change Request";
 if(/access request|privileged access|external access|api access|vendor \/ access/.test(c))return "Access Request";
 if(/equipment request|hardware exception/.test(c))return "Hardware Request";
 if(/software installation|procurement request/.test(c))return "Software Request";
 if(/service request|new employee setup|messaging request/.test(c))return "Service Request";
 return "Incident";
}
function requestFieldValue(t,key){
 const sc=getScenario(t),c=getCause(t),e=getEmployee(t),item=catalogItem(t.request?.catalogId),app=appNameForScenario(sc)||item?.name||sc?.cat||"the requested service";
 const target=t.request?.generatedTarget||e?.name||t.user;
 const values={
   targetUser:target,department:e?.department||t.department,businessNeed:c?.answers?.business||c?.answers?.need||`Business need associated with ${c?.label||t.subject}.`,
   system:app,accessLevel:c?.answers?.scope||(/admin|privileged/i.test(item?.name||"")?"Time-limited elevated access":"Standard role appropriate to the approved request"),
   device:c?.answers?.current||`LT-${Math.floor(10000+Math.random()*89999)}`,software:c?.answers?.licenseq||app,
   quantity:(c?.answers?.licenseq?.match(/\b\d+\b/)||[])[0]||(/25 seats/i.test(c?.answers?.licenseq||"")?"25":"1"),
   costCenter:`CC-${Math.floor(1000+Math.random()*8999)}`,effectiveDate:c?.answers?.timing||rand(["Today","Next business day","Next Monday"]),
   expirationDate:/temporary|time-limited|vendor|emergency|privileged/i.test((item?.name||"")+" "+(c?.label||""))?rand(["End of day","7 days","30 days","Project end date"]):"Not temporary",
   sponsor:t.manager||e?.managerName||"Department Manager",dataScope:c?.answers?.scope||c?.answers?.dataq||c?.answers?.which||"The records described in the request",
   retentionBasis:c?.answers?.holdq||"Must be checked against retention and legal-hold requirements before action",
   sourceAsset:c?.answers?.assetq||`LT-${Math.floor(10000+Math.random()*89999)}`,destinationUnit:c?.answers?.authorityq||rand(DEPTS.filter(d=>d!==t.department)),
   mailbox:c?.answers?.mailboxq||`${(t.user||"user").toLowerCase().replace(/[^a-z]+/g,".")}@example.org`,externalParty:c?.answers?.vendorq||"Approved external vendor/consultant",
   environment:/production/i.test((sc?.cat||"")+" "+(sc?.subject||[]).join(" "))?"Production":"Managed enterprise environment",
   changeWindow:c?.answers?.timing||"Next approved maintenance window",phoneNumber:"Approved replacement mobile number on file",
   onboardingRole:c?.answers?.role||`${rand(["Analyst","Specialist","Coordinator"])} · ${t.department} · starts next business week`
 };
 return String(values[key]??"Requester must provide this information.");
}
function requestEligibility(t,item){
 const sid=t?.scenarioId,cid=t?.causeId;
 if(sid==="newhire"&&cid==="noapproval")return {status:"blocked",reason:"No approved onboarding request exists. Return the intake for authorization rather than provisioning access."};
 if(sid==="install"&&cid==="unapproved")return {status:"blocked",reason:"The requested third-party download is not an approved software-catalog item."};
 if(sid==="granular-export"&&cid==="overreach")return {status:"blocked",reason:"The requester is not entitled to a full sensitive-data export."};
 if(sid==="privaccess"&&cid==="invalid")return {status:"blocked",reason:"Convenience alone does not qualify for privileged access."};
 if(sid==="api-key"&&cid==="broad")return {status:"blocked",reason:"An unrestricted all-access API credential exceeds the approved integration purpose."};
 if(["deletemailbox","illogic-delete","policydelete","assethound-delete"].includes(sid))return {status:"blocked",reason:"The requested deletion conflicts with required retention/history. Use the supported retention or retirement workflow instead."};
 if(sid==="backup-delete"&&cid==="hold")return {status:"blocked",reason:"The backup set is subject to preservation requirements and cannot be disposed."};
 if(sid==="shared-account"&&cid==="team")return {status:"blocked",reason:"Generic shared staff credentials are not a supported catalog service."};
 if(sid==="external-forward"&&cid==="personal")return {status:"blocked",reason:"Personal convenience does not qualify for unrestricted external mail forwarding."};
 if(sid==="vendor-prod-admin"&&cid==="nope")return {status:"blocked",reason:"Permanent unrestricted vendor administrator access is not an approved catalog offering."};
 if(sid==="deletehold"||sid==="legalhold-folder")return {status:"review",reason:"Retention / legal-hold review must clear before any deletion can proceed."};
 if(item?.standard)return {status:"eligible",reason:"Standard catalog request when all required information and approvals are present."};
 return {status:"review",reason:"Non-standard request requires the documented approval/exception path."};
}
function makeRequestState(t,sc,cause,employee=null){
 const item=catalogForScenario(sc,cause);if(!item)return null;
 const fields={};item.fields.forEach(k=>fields[k]={key:k,label:REQUEST_FIELD_DEFS[k]?.label||k,value:null,collected:false,required:true});
 if(fields.department){fields.department.value=t.department;fields.department.collected=true}
 if(fields.targetUser&&sc.id!=="newhire"){fields.targetUser.value=t.user;fields.targetUser.collected=true}
 let eligibility=requestEligibility(t,item);
 const existingEntitlement=((employee||getEmployee(t))?.entitlements||[]).find(x=>x.catalogId===item.id);
 if(existingEntitlement&&["Access Request","Software Request"].includes(item.type))eligibility={status:"blocked",reason:`An existing ${item.name} entitlement is already recorded for this employee. Verify whether the real issue is broken access (an incident) rather than creating a duplicate request.`};
 return {catalogId:item.id,expectedType:item.type,selectedType:null,classificationVerified:false,classificationAttempts:0,misclassifications:0,
   fields,standard:item.standard,eligibility:eligibility.status,eligibilityReason:eligibility.reason,duplicateExisting:!!existingEntitlement,workflowState:"Intake",history:[],
   targetMinutes:item.target,slaMissed:false,slaRecorded:false,fulfillmentSubmitted:false,fulfilled:false,fulfillmentTeam:item.team,kickbacks:0,unauthorizedAttempts:0,
   generatedTarget:sc.id==="newhire"?`${pickActorName([t.user])} (new employee)`:t.user,submittedAt:null,fulfilledAt:null,catalogMatched:false,recorded:false};
}
function hydrateRequestState(t,employees=null,clock=null){
 const sc=SCENARIOS.find(x=>x.id===t.scenarioId),cause=sc?.causes?.find(x=>x.id===t.causeId),item=catalogForScenario(sc,cause);
 if(!item){t.request=null;return}
 const employee=employees?.find(e=>e.id===t.userId)||employees?.find(e=>e.name===t.user)||null;
 if(!t.request)t.request=makeRequestState(t,sc,cause,employee);
 else{
   const fresh=makeRequestState(t,sc,cause,employee),r=t.request;
   Object.keys(fresh).forEach(k=>{if(r[k]===undefined)r[k]=fresh[k]});
   r.fields=r.fields||{};item.fields.forEach(k=>{if(!r.fields[k])r.fields[k]=fresh.fields[k]});
   r.history=Array.isArray(r.history)?r.history:[];
 }
 t.ticketType=t.request.expectedType;
 ensureCatalogApproval(t,item,clock);
}
function ensureCatalogApproval(t,item,clock=null){
 if(!t?.request||!item?.approvalChain?.length||t.approval)return;
 const sc=SCENARIOS.find(x=>x.id===t.scenarioId),c={approvalRequired:true,approvalChain:[...item.approvalChain]};
 t.approval=makeApprovalProfile(sc,c,t.actors,clock??t.opened??state.clock);
 if(t.approval){t.approval.catalogGenerated=true;t.approval.history.push({time:nowStamp(),actor:"Service Catalog",role:"Catalog Policy",action:"Approval chain created",note:`${item.name} requires ${item.approvalChain.join(", ")} approval.`})}
}
function requestMissingFields(t){return t?.request?Object.values(t.request.fields||{}).filter(f=>f.required&&!f.collected):[]}
function requestApprovalSatisfied(t){return !t?.approval?.required||approvalFlowApproved(t)}
function requestFulfillmentReady(t){
 if(!t?.request)return false;
 return t.request.classificationVerified&&requestMissingFields(t).length===0&&requestApprovalSatisfied(t)&&!t.approval?.denied&&t.request.eligibility!=="blocked"&&!t.request.fulfillmentSubmitted&&!t.request.fulfilled;
}
function requestProgressState(t){
 const r=t?.request;if(!r)return "Not a catalog request";
 if(r.fulfilled)return "Fulfilled";
 if(r.fulfillmentSubmitted)return "Fulfillment";
 if(!r.classificationVerified)return "Classification";
 if(requestMissingFields(t).length)return "Intake";
 if(r.eligibility==="blocked")return "Policy Block";
 if(t.approval?.denied)return "Denied";
 if(!requestApprovalSatisfied(t))return "Approval";
 return "Ready";
}
function recordRequestHistory(t,action,note){
 if(!t?.request)return;t.request.history=t.request.history||[];t.request.history.unshift({time:nowStamp(),action,note});t.request.history=t.request.history.slice(0,30);
}
function classifyRequest(t,type){
 if(!t?.request||t.resolved)return;
 advanceTime(2);t.request.classificationAttempts++;t.request.selectedType=type;
 if(type===t.request.expectedType){
   if(!t.request.classificationVerified){state.requestStats.classified++;t.useful+=1}
   t.request.classificationVerified=true;t.request.catalogMatched=true;t.request.workflowState="Intake";recordRequestHistory(t,"Classification verified",type);
   addMsg(t,"system",`Classification verified: ${type}. Catalog match: ${catalogItem(t.request.catalogId)?.name}.`,true);
 }else{
   t.request.classificationVerified=false;t.request.misclassifications++;state.requestStats.misclassified++;t.irrelevant++;advanceTime(5);t.request.workflowState="Reclassification";
   recordRequestHistory(t,"Misclassified",`${type}; expected workflow is different.`);
   addMsg(t,"system",`The ${type} workflow rejected this intake. Reclassify the ticket before fulfillment.`,true);
 }
 saveState();renderAll();
}
function collectRequestField(t,key,fromChat=false){
 const r=t?.request,f=r?.fields?.[key];if(!r||!f||t.resolved)return;
 if(f.collected){t.repeats++;t.irrelevant+=.5;if(!fromChat){addMsg(t,"agent",agentChatForAction(REQUEST_FIELD_DEFS[key]?.ask||`Ask for ${f.label}`,"diagnostic",t));scheduleReply(t,`I already provided ${f.label.toLowerCase()}: ${f.value}`)}return}
 advanceTime(2);const ask=REQUEST_FIELD_DEFS[key]?.ask||`Ask for ${f.label}`;
 if(!fromChat)addMsg(t,"agent",agentChatForAction(ask,"diagnostic",t));
 f.value=requestFieldValue(t,key);f.collected=true;state.requestStats.fieldsCollected++;t.useful+=.8;recordRequestHistory(t,"Field collected",`${f.label}: ${f.value}`);
 scheduleReply(t,`${f.label}: ${f.value}`,personalityDelay(t,"normal"));saveState();renderAll();
}
function requestFieldMatch(t,text){
 if(!t?.request||!chatQuestionLike(text))return null;const low=String(text||"").toLowerCase(),missing=requestMissingFields(t);
 const rules={
  targetUser:/\b(who.*for|which user|target user|employee.*for)\b/,department:/\b(which|what).*department\b/,businessNeed:/\b(why|business need|business reason|justification|purpose)\b/,
  system:/\b(which|what).*(system|service|application|app)\b/,accessLevel:/\b(access level|what access|which role|permission level)\b/,device:/\b(which|what).*(device|laptop|computer|pc|workstation)\b/,
  software:/\b(which|what).*(software|product|application|app)\b/,quantity:/\b(how many|quantity|number of (licenses|seats|devices|items))\b/,costCenter:/\b(cost center|budget|funding|charge code)\b/,
  effectiveDate:/\b(when.*(start|effective|needed)|effective date|start date|take effect|go live|needed by)\b/,expirationDate:/\b(expir|how long|until when|temporary.*until)\b/,sponsor:/\b(sponsor(?:ing|ed)?|manager|who approved|who (?:is )?approv(?:e|ing)|approving this request)\b/,
  dataScope:/\b(which|what|exactly).*(data|records|dataset|rows|files)\b/,retentionBasis:/\b(retention|legal hold|records hold|preservation)\b/,sourceAsset:/\b((which|what)\s+(asset|laptop|equipment)|asset tag|source asset)\b/,
  destinationUnit:/\b(destination|which unit|which department.*receiv|where.*asset)\b/,mailbox:/\b(which|what).*mailbox\b/,externalParty:/\b(which|what|who).*(vendor|consultant|external|guest)\b/,
  environment:/\b(production|test|dev|environment)\b/,changeWindow:/\b(change window|maintenance window|when.*change)\b/,phoneNumber:/\b(phone number|new number|mfa number)\b/,
  onboardingRole:/\b(role|job title|start date|new hire.*department)\b/
 };
 const priority=["changeWindow","onboardingRole","retentionBasis","effectiveDate","expirationDate","phoneNumber","costCenter","quantity","destinationUnit","sourceAsset","dataScope","accessLevel","device","software","mailbox","externalParty","department","targetUser","system","environment","sponsor","businessNeed"];
 for(const key of priority){if(missing.some(f=>f.key===key)&&rules[key]?.test(low))return key}
 return null;
}
function submitCatalogFulfillment(t){
 const r=t?.request,item=catalogItem(r?.catalogId);if(!r||!item||t.resolved)return;
 if(!r.classificationVerified){t.irrelevant++;addMsg(t,"system","Fulfillment rejected: classify the request first.",true);return}
 const missing=requestMissingFields(t);if(missing.length){
   r.kickbacks++;state.requestStats.kickbacks++;t.irrelevant++;recordRequestHistory(t,"Intake kickback",`Missing: ${missing.map(f=>f.label).join(", ")}`);
   addMsg(t,"system",`Catalog intake returned: ${missing.map(f=>f.label).join(", ")} ${missing.length===1?"is":"are"} still required.`,true);return
 }
 if(r.eligibility==="blocked"){
   r.kickbacks++;state.requestStats.kickbacks++;recordRequestHistory(t,"Policy block",r.eligibilityReason);
   addMsg(t,"system",`Catalog fulfillment blocked: ${r.eligibilityReason}`,true);return
 }
 if(t.approval?.required&&!approvalFlowApproved(t)){
   r.kickbacks++;state.requestStats.kickbacks++;t.irrelevant++;recordRequestHistory(t,"Approval kickback","Required approval chain is incomplete.");
   addMsg(t,"system","Catalog fulfillment returned: required approvals are not complete.",true);return
 }
 r.fulfillmentSubmitted=true;r.workflowState="Fulfillment";r.submittedAt=state.clock;state.requestStats.submitted++;t.status=`Fulfillment — ${supportTeam(item.team)?.name||item.team}`;t.waiting=true;
 recordRequestHistory(t,"Submitted for fulfillment",supportTeam(item.team)?.name||item.team);
 addMsg(t,"system",`${item.name} submitted to ${supportTeam(item.team)?.name||item.team}. The request remains open until fulfillment and requester validation.`,true);
 const base=item.standard?10000:18000,delay=base+Math.random()*(item.standard?22000:36000);
 state.pending.push({type:"catalogFulfillment",ticketId:t.id,due:Date.now()+delay});saveState();renderAll();
}
function processCatalogFulfillment(t){
 const r=t?.request,item=catalogItem(r?.catalogId);if(!r||!item||r.fulfilled)return;
 r.fulfilled=true;r.fulfillmentSubmitted=false;r.fulfilledAt=state.clock;r.workflowState="Validation";t.waiting=false;t.status="In Progress";t.actions.push("correct-action");t.facts.push("catalog-fulfilled","fix-applied");t.resolutionFollowupReady=true;
 state.requestStats.fulfilled++;recordRequestHistory(t,"Fulfilled",`${item.name} completed by ${supportTeam(item.team)?.name||item.team}.`);
 addMsg(t,"system",`${supportTeam(item.team)?.name||item.team} completed the catalog fulfillment. Follow up with the requester to validate the result.`,true);
}
function denyCatalogRequest(t){
 if(!t?.request||t.resolved)return;
 if(t.request.eligibility!=="blocked"&&!t.approval?.denied){t.irrelevant++;addMsg(t,"system","No policy or approval denial currently supports denying this catalog request.",true);return}
 advanceTime(2);t.request.workflowState="Denied";state.requestStats.denied++;recordRequestHistory(t,"Request denied",t.request.eligibility==="blocked"?t.request.eligibilityReason:"Required approval was denied.");
 t.actions.push("correct-action");finalizeTicket(t,"Correctly Denied");saveState();renderAll();
}
function requestTypeDisplay(t){
 if(!t?.request)return t?.ticketType||"Incident";
 if(!t.request.classificationVerified)return "Unverified intake";
 return t.request.selectedType||t.request.expectedType;
}
function requestSlaRemaining(t){
 if(!t?.request)return null;return Math.max(0,t.request.targetMinutes-(state.clock-t.opened));
}
function requestFieldStatusHtml(t){
 return Object.values(t.request?.fields||{}).map(f=>`<div class="requestfield ${f.collected?"done":"missing"}"><div class="requestfieldhead"><b>${esc(f.label)}</b><span class="requestfieldstate">${f.collected?"Captured":"Required"}</span></div>${f.collected?`<div>${esc(f.value)}</div>`:`<div class="small">Not yet collected.</div><div class="requestbuttons"><button class="secondary" type="button" onclick="collectRequestField(getTicket(),'${f.key}')">${esc(REQUEST_FIELD_DEFS[f.key]?.ask||"Ask requester")}</button></div>`}</div>`).join("");
}
function requestFlowHtml(t){
 const r=t.request,stage=requestProgressState(t),steps=["Classification","Intake","Approval","Ready","Fulfillment","Validation"];
 return `<div class="requestflow">${steps.map((x,i)=>`${i?'<span class="requestarrow">›</span>':""}<span class="requeststep ${r.fulfilled&&x!=="Validation"?"done":stage===x?"current":(steps.indexOf(stage)>i?"done":"")}">${x}</span>`).join("")}</div>`;
}
function showServiceCatalog(){
 const items=SERVICE_CATALOG;
 showModal(`<div class="mh"><h2>Service Catalog</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
 <label class="sr-only" for="catalogSearch">Search service catalog</label><input class="catalogsearch" id="catalogSearch" aria-label="Search service catalog" placeholder="Search service, type, team, or requirement...">
 <div class="requestsummary" style="margin-top:8px"><div class="requestmetric"><b>${items.length}</b><span>Catalog Items</span></div><div class="requestmetric"><b>${items.filter(x=>x.standard).length}</b><span>Standard</span></div><div class="requestmetric"><b>${items.filter(x=>!x.standard).length}</b><span>Non-standard</span></div><div class="requestmetric"><b>${state.requestStats?.fulfilled||0}</b><span>Fulfilled This Shift</span></div></div>
 <div class="cataloggrid" id="catalogList" style="margin-top:8px">${items.map(catalogItemCard).join("")}</div></div><div class="mf"><button class="primary" onclick="hideModal()">Done</button></div>`);
 const q=document.getElementById("catalogSearch"),list=document.getElementById("catalogList");
 q.oninput=()=>{const term=q.value.trim().toLowerCase();list.innerHTML=items.filter(x=>`${x.name} ${x.type} ${supportTeam(x.team)?.name||""} ${x.desc} ${x.fields.join(" ")}`.toLowerCase().includes(term)).map(catalogItemCard).join("")||'<div class="small">No catalog items match.</div>'};
}
function catalogItemCard(item){
 return `<div class="catalogitem"><div><span class="catalogtype">${esc(item.type)}</span> <span class="${item.standard?"catalogstandard":"catalognonstandard"}">${item.standard?"Standard":"Non-standard"}</span></div><h4>${esc(item.name)}</h4><div>${esc(item.desc)}</div><div class="catalogmeta">Fulfillment: ${esc(supportTeam(item.team)?.name||item.team)} · Target ${item.target} simulated min<br>Required: ${item.fields.map(k=>REQUEST_FIELD_DEFS[k]?.label||k).join(", ")}${item.approvalChain?.length?`<br>Approval: ${item.approvalChain.map(k=>k.replace(/([A-Z])/g," $1")).join(" → ")}`:""}</div></div>`;
}
window.collectRequestField=collectRequestField;window.classifyRequest=classifyRequest;window.submitCatalogFulfillment=submitCatalogFulfillment;window.denyCatalogRequest=denyCatalogRequest;window.showServiceCatalog=showServiceCatalog;

function inferTicketType(scenario,cause=null){return expectedTicketTypeFor(scenario,cause)}
function makeTicketHistory(scenario,cause,user,employee=null){
 const h=[];
 if(employee?.ticketHistory?.length){
   employee.ticketHistory.slice(0,5).forEach(x=>h.push({when:x.when||"Prior shift",text:`${x.id} · ${x.category}: ${x.subject} — ${x.outcome}${x.rating?` · ${x.rating}/5 feedback`:""}`}));
 }
 if(!h.length&&Math.random()<.22)h.push({when:rand(["3 weeks ago","2 months ago","last quarter","6 months ago"]),text:rand([
   `${user} had an older pre-career Service Desk contact for an unrelated issue.`,
   `An older historical ticket exists in ${scenario.cat}; its root cause is not shown here.`,
   `Previous Service Desk history exists, but it does not establish the cause of the current issue.`
 ])});
 return h;
}
function makeAttachments(scenario,cause){
 const a=[];
 if(Math.random()<.42){
   const msg=cause.answers?.error||cause.answers?.vpnerr||cause.answers?.policyq||cause.answers?.statusq||rand([
     "Screenshot shows the reported application/error state.",
     "User attached a screenshot of the failure.",
     "Screenshot contains the message described in the ticket."
   ]);
   a.push({name:"screenshot.png",type:"Screenshot",content:msg});
 }
 if(Math.random()<.18){
   const diagnostic=Object.values(cause.tools||{})[0]||"User-provided diagnostic text contains no immediately conclusive error.";
   a.push({name:"diagnostic.txt",type:"Text log",content:diagnostic});
 }
 if(/email|phish|mail/i.test(scenario.cat)&&Math.random()<.18){
   a.push({name:"message.eml",type:"Email sample",content:"Simulated attached email headers/message sample. Review context and security implications before acting."});
 }
 return a;
}
function chooseReliability(personality){
 if(personality==="technical")return Math.random()<.9?"accurate":"incomplete";
 if(personality==="vague"||personality==="inexperienced"){
   const r=Math.random();return r<.42?"incomplete":r<.57?"mistaken":"accurate";
 }
 if(personality==="confident"){
   const r=Math.random();return r<.35?"mistaken":r<.52?"contradictory":"accurate";
 }
 const r=Math.random();return r<.67?"accurate":r<.82?"incomplete":r<.92?"mistaken":"contradictory";
}
const RELATED_TEMPLATES=[
 {scenarioId:"outage",causeId:"server",label:"Production application outage"},
 {scenarioId:"vendor",causeId:"vendor",label:"Vendor SaaS outage"},
 {scenarioId:"fomo-notify",causeId:"queue",label:"Fomo notification degradation"},
 {scenarioId:"illogic",causeId:"engine",label:"IllogicManager rule-engine outage"},
 {scenarioId:"granular-report",causeId:"refresh",label:"Granular dataset refresh failure"},
 {scenarioId:"dumbcare-lock",causeId:"service",label:"DumbCare lock-service incident"},
 {scenarioId:"dns",causeId:"dnsout",label:"Internal DNS incident"},
 {scenarioId:"vpn",causeId:"gateway",label:"VPN gateway outage"},
 {scenarioId:"webex",causeId:"site",label:"Site network degradation"},
 {scenarioId:"maildelay",causeId:"transport",label:"Messaging transport delay"}
];
function seedRelatedIncidents(){
 if(state.endless)return;
 let clusters=0;
 if(state.difficulty==="Chaos Desk")clusters=state.tickets.length>=10?2:1;
 else if(state.sessionSize>=20)clusters=Math.random()<.75?2:1;
 else if(state.sessionSize>=10)clusters=Math.random()<.62?1:0;
 else clusters=Math.random()<.25?1:0;
 const used=new Set();
 for(let c=0;c<clusters;c++){
   const tpl=rand(RELATED_TEMPLATES),sc=SCENARIOS.find(x=>x.id===tpl.scenarioId);
   if(!sc)continue;
   const groupSize=state.difficulty==="Chaos Desk"?(Math.random()<.5?3:4):(Math.random()<.7?2:3);
   const free=shuffle(state.tickets.map((t,i)=>({t,i})).filter(x=>!used.has(x.i)&&!x.t.worldGenerated).map(x=>x.i)).slice(0,groupSize);
   if(free.length<2)continue;
   const key=`CLUSTER-${c+1}-${Math.floor(1000+Math.random()*9000)}`;
   free.forEach(i=>{
     used.add(i);
     const old=state.tickets[i],emp=employeeForTicket(old);
     if(emp){
       emp.lifetimeTickets=Math.max(0,emp.lifetimeTickets-1);
       if(emp.categoryCounts?.[old.category])emp.categoryCounts[old.category]=Math.max(0,emp.categoryCounts[old.category]-1);
     }
     const nt=createTicket(sc,tpl.causeId,old?.userId||null);
     nt.incidentKey=key;nt.incidentSeedLabel=tpl.label;nt.specialAssignment=!!old?.specialAssignment;
     state.tickets[i]=nt;
   });
 }
}
function majorFor(t){return t?.incidentKey?state.majorIncidents?.[t.incidentKey]:null}
function activeMajorFor(t){const mi=majorFor(t);return mi&&mi.open!==false?mi:null}
function activateMajorIncident(t){
 if(!t?.incidentKey)return null;
 const existing=majorFor(t);if(existing)return existing.open===false?null:existing;
 const mi={id:`MI-${String(state.nextMajor++).padStart(4,"0")}`,label:t.incidentSeedLabel||"Correlated service incident",open:true,created:state.clock};
 state.majorIncidents[t.incidentKey]=mi;t.relatedKnown=true;
 state.tickets.filter(x=>x.incidentKey===t.incidentKey&&x.id!==t.id&&!x.resolved).forEach(x=>{
   x.relatedKnown=true;
   addMsg(x,"system",`Correlation notice: ${mi.id} (${mi.label}) is now active. This ticket may be related.`,true);
 });
 return mi;
}
function maybeScheduleUserEvent(t){
 if(!t||t.resolved||t.approval?.pending||t.actions.includes("correct-action"))return;
 if(state.pending.some(p=>p.type==="userEvent"&&p.ticketId===t.id))return;
 const e=getEmployee(t),style=e?.selfHelp||"cautious";
 const base={passive:.045,cautious:.08,independent:.15,tinkerer:.19}[style]||.08;
 const personalityBoost=t.personality==="nonresponsive"?.04:t.personality==="tangent"?.05:0;
 if(Math.random()>=base+personalityBoost)return;
 let event;
 const r=Math.random();
 if(style==="independent")event=r<.30?"discovery":r<.52?"selfResolved":r<.63?"worse":"tangent";
 else if(style==="tinkerer")event=r<.22?"discovery":r<.34?"selfResolved":r<.72?"worse":"tangent";
 else if(style==="passive")event=r<.16?"discovery":r<.25?"selfResolved":r<.31?"worse":"tangent";
 else event=r<.26?"discovery":r<.43?"selfResolved":r<.57?"worse":"tangent";
 const pace=EMPLOYEE_RESPONSE.find(x=>x.id===e?.responseStyle)?.factor||1;
 const delay=(14000+Math.random()*47000)*Math.min(2.3,pace);
 state.pending.push({type:"userEvent",ticketId:t.id,event,due:Date.now()+delay});
}
function scheduleCorrection(t,correctText){
 if(!correctText||state.pending.some(p=>p.type==="correction"&&p.ticketId===t.id))return;
 state.pending.push({type:"correction",ticketId:t.id,text:`Sorry — correction to what I said earlier: ${correctText}`,due:Date.now()+Math.max(22000,personalityDelay(t,"normal")+10000+Math.random()*25000)});
}

function supportTeam(id){return SUPPORT_TEAMS.find(x=>x.id===id)}
function causeRequiresSpecialist(t){
 const sc=getScenario(t),c=getCause(t),fix=(sc?.fixes||[]).find(f=>f[0]===c?.correct);
 return !!c?.escalation||fix?.[2]==="escalate";
}
function expectedSpecialistTeamId(t){
 const sc=getScenario(t),c=getCause(t),id=String(c?.correct||"").toLowerCase(),cat=String(sc?.cat||"").toLowerCase(),named=String(t?.clarification?.value||"").toLowerCase();
 if(named.includes("illogicmanager"))return "workflow";
 if(named.includes("policywreck"))return "governance";
 if(named.includes("granular"))return "data";
 if(named.includes("peoplechock"))return "hr";
 if(named.includes("dumbcare"))return "clinical";
 if(named.includes("assethound"))return "asset";
 if(named.includes("fomo"))return "collaboration";
 if(named.includes("cloudarchive"))return "vendor";
 const actionMap=[
  [/esc-net/,"network"],[/esc-sec|secureacct|reportphish|lostproc/,"security"],[/esc-id/,"identity"],[/esc-mail|routecomms/,"messaging"],
  [/esc-file|esc-storage/,"files"],[/esc-hr/,"hr"],[/esc-clin/,"clinical"],[/esc-asset/,"asset"],[/esc-data/,"data"],[/esc-gov|esc-authority/,"governance"],
  [/esc-records|esc-privacy/,"privacyrecords"],[/esc-vendor|vendorwait|routelicense/,"vendor"],[/esc-cert/,"platform"],[/esc-print|esc-hw|esc-av|esc-mob|replacebattery|replacehw|swapasset/,"endpoint"]
 ];
 for(const [rx,team] of actionMap)if(rx.test(id))return team;
 if(/dumbcare|clinical/.test(cat))return "clinical";
 if(/peoplechock|human resources|hr /.test(cat))return "hr";
 if(/granular|data |analytics/.test(cat))return "data";
 if(/policywreck|governance|policy/.test(cat))return "governance";
 if(/illogicmanager|workflow/.test(cat))return "workflow";
 if(/fomo/.test(cat))return "collaboration";
 if(/assethound|asset/.test(cat))return "asset";
 if(/privacy|records|legal hold|data governance|sensitive data/.test(cat))return "privacyrecords";
 if(/security|phish|malware|lost equipment/.test(cat))return "security";
 if(/mfa|identity|windows sign-in|account/.test(cat))return "identity";
 if(/vpn|network|dns/.test(cat))return "network";
 if(/email|outlook|calendar|conferencing|presence/.test(cat))return "messaging";
 if(/file|backup|storage/.test(cat))return "files";
 if(/printer|display|hardware|dock|bluetooth|mobile|browser/.test(cat))return "endpoint";
 if(/vendor|licens/.test(cat))return "vendor";
 return "applications";
}

function coworkerLoadValue(id){
 if(!Number.isFinite(state.coworkerLoads[id])){
   const cw=coworkerById(id),h=stableRank(`coworker:${id}:${state.career.shifts+1}:${state.difficulty}`)%100;
   state.coworkerLoads[id]=h<30?1:h<72?Math.max(2,Math.round((cw?.capacity||5)*.55)):Math.max(3,Math.round((cw?.capacity||5)*.9));
 }
 const owned=state.tickets.filter(t=>!t.resolved&&t.ownerAgentId===id).length;
 return state.coworkerLoads[id]+owned;
}
function coworkerLoad(id){
 const cw=coworkerById(id),n=coworkerLoadValue(id),cap=cw?.capacity||5;
 return n<=Math.max(1,cap*.4)?"Low":n<=cap*.85?"Moderate":"High";
}
function coworkerAffinity(cw,t){
 const area=expectedSpecialistTeamId(t);
 return cw?.specialties?.includes(area)?1.28:(cw?.specialties||[]).some(x=>["applications","endpoint"].includes(x))?1.02:.88;
}
function coworkerHandoffQuality(t,cw){
 const evidence=Math.min(1,(t.useful||0)/3),notes=Math.min(1,(t.notes||"").trim().length/45),noise=Math.min(.45,((t.irrelevant||0)+(t.repeats||0))*.06);
 return Math.max(0,Math.min(1,(evidence*.55+notes*.35+.1)-noise));
}
function coworkerAcceptanceChance(cw,t,mode="reassign"){
 const loadFactor={Low:1.15,Moderate:.78,High:.34}[coworkerLoad(cw.id)]||.7;
 const trust=.55+(cw.trust||50)/130,aff=coworkerAffinity(cw,t),quality=.45+coworkerHandoffQuality(t,cw)*.65;
 const modeFactor=mode==="trade"?.82:mode==="shared"?.72:1;
 return Math.max(.06,Math.min(.92,.58*cw.willingness*loadFactor*trust*aff*quality*modeFactor));
}
function coworkerHelpChance(cw,t){
 const load={Low:1,Moderate:.78,High:.48}[coworkerLoad(cw.id)]||.7;
 return Math.max(.25,Math.min(.96,(.48+(cw.trust||50)/220)*coworkerAffinity(cw,t)*load));
}
function coworkerHistory(t,cw,action,note=""){
 t.coworkerHistory=t.coworkerHistory||[];t.coworkerHistory.unshift({time:nowStamp(),coworkerId:cw?.id||null,coworker:cw?.name||"Service Desk",action,note});t.coworkerHistory=t.coworkerHistory.slice(0,20);
 if(cw)cw.lastInteraction={time:nowStamp(),action,ticketId:t.id};
}
function addCoworkerMsg(t,cw,text){
 t.conversation.push({who:"coworker",coworkerId:cw?.id||null,coworker:cw?.name||"Service Desk teammate",text,time:nowStamp()});
 if(state.selected!==t.id)t.unread++;
}
function coworkerMissingDiagnostic(t){
 const sc=getScenario(t),c=getCause(t);
 return (sc.diagnostics||[]).find(d=>!t.facts.includes(d[0])&&c.answers?.[d[0]])||null;
}
function askCoworkerForHelp(id){
 const t=getTicket(),cw=coworkerById(id);if(!t||t.resolved||!cw||t.ownerAgentId!=="player")return;
 advanceTime(3);state.coworkerStats.helpRequests++;cw.helped++;
 const good=Math.random()<coworkerHelpChance(cw,t),missing=coworkerMissingDiagnostic(t),fix=(getScenario(t).fixes||[]).find(f=>f[0]===getCause(t).correct);
 if(good&&missing){
   t.coworkerSuggestedDiagnostic=missing[0];state.coworkerStats.helpfulHints++;cw.trust=Math.min(100,cw.trust+.5);
   addCoworkerMsg(t,cw,rand([
     `I'd start with "${missing[1]}." That should narrow this down before you do anything bigger.`,
     `Have you checked "${missing[1]}" yet? That's the first thing I'd want to know.`,
     `Before you escalate or reset anything, try "${missing[1]}." The answer should tell you which direction to go.`
   ]));
   coworkerHistory(t,cw,"Helped",`Suggested diagnostic: ${missing[1]}.`);
 }else if(good&&fix&&fix[2]!=="escalate"){
   t.coworkerSuggestedFix=fix[0];state.coworkerStats.helpfulHints++;
   addCoworkerMsg(t,cw,`You've already got enough evidence. I'd probably go with "${fix[1]}" and then validate it with the requester.`);
   coworkerHistory(t,cw,"Helped",`Suggested action: ${fix[1]}.`);
 }else{
   addCoworkerMsg(t,cw,rand(["I'm buried right now. I don't see anything obvious beyond the checks you've already got.","I can take a quick look, but I don't have a useful answer yet.","Nothing jumps out at me from the handoff. I'd keep narrowing the scope first."]));
   coworkerHistory(t,cw,"Help unavailable","No useful hint provided.");
 }
 saveState();renderAll();
}
function teammateDumpLevel(t,cw){
 const q=coworkerHandoffQuality(t,cw);
 return q<.25?2:q<.48?1:0;
}
function noteCoworkerDump(t,cw,points){
 if(points<=0)return;
 t.coworkerDumped=true;t.coworkerDumpPoints=(t.coworkerDumpPoints||0)+points;t.coworkerAuditPoints=(t.coworkerAuditPoints||0)+points;
 cw.dumpsReceived++;cw.trust=Math.max(0,cw.trust-points*3);
}

function triggerCoworkerDumpIntervention(t){
 if(state.freeplay)return 0;
 const threshold=(state.coworkerStats.supervisorInterventions||0)*4+4;
 if((state.coworkerStats.dumpPoints||0)<threshold)return 0;
 state.coworkerStats.supervisorInterventions++;state.supervisor.coaching=true;state.supervisor.status="Coaching";
 recordCareerEvent("coaching","Queue Ownership Coaching",`Repeated attributed weak ticket transfers triggered supervisor attention. Current attributed dumping points: ${state.coworkerStats.dumpPoints}.`,"negative");
 const extra=2+Math.min(3,state.coworkerStats.supervisorInterventions);
 assignPerformanceTickets(extra,"Supervisor reassigned extra work after repeated attributed teammate handoffs.");
 addMsg(t,"system",`Dana noticed the repeated attributed ticket-dumping pattern and assigned ${extra} additional ticket${extra===1?"":"s"} to your queue.`,true);
 return extra;
}
function attributeCoworkerDump(t){
 const points=t?.coworkerAuditPoints||0;if(!points)return 0;
 state.coworkerStats.dumpPoints=(state.coworkerStats.dumpPoints||0)+points;t.coworkerAuditPoints=0;
 return triggerCoworkerDumpIntervention(t);
}
function leaveCoworkerAuditTrail(ticketId=null){
 const t=state.tickets.find(x=>x.id===(ticketId||state.selected))||getTicket();if(!t)return;
 const pts=t.coworkerAuditPoints||0,extra=attributeCoworkerDump(t);saveState();renderAll();
 showModal(`<div class="mh"><h2>Reassignment Recorded Normally</h2></div><div class="mb"><div class="audit-result"><b>No concealment attempted.</b><br>${pts} weak-handoff point${pts===1?" was":"s were"} attributed to your queue-ownership history.${extra?` Dana noticed the pattern and added ${extra} tickets.`:""}</div></div><div class="mf"><button class="primary" onclick="finishMaliciousModal()">Back to Queue</button></div>`);
}
function offerCoworkerAudit(t){
 if(!t||!(t.coworkerAuditPoints>0)||state.freeplay)return;
 const actionId=t.coworkerTransferMode==="shared"?"shared-conceal":(t.coworkerDumpPoints>=3?"repeat-dump-conceal":"reassignment-conceal");
 showModal(`<div class="mh"><h2>Questionable Reassignment Flagged</h2></div><div class="mb"><div class="audit-brief"><b>The transfer itself is already done.</b><br>The handoff was weak enough to create ${t.coworkerAuditPoints} queue-ownership audit point${t.coworkerAuditPoints===1?"":"s"}. You can leave the ownership trail alone, or make the much worse decision to attempt the fictional Outrun the Audit race at <b>${effectiveAuditTarget(actionId,t)} adjusted WPM</b>.<br><br>Even a successful race does not make the handoff good: coworker trust loss and ticket-quality penalties remain. It only avoids immediate supervisor attribution of the ownership-dumping points.</div></div><div class="mf"><button class="secondary" onclick="leaveCoworkerAuditTrail('${t.id}')">Leave Audit Trail Alone</button><button class="danger" onclick="startAuditRace('${actionId}','${t.id}')">Attempt Outrun the Audit</button></div>`);
}
window.leaveCoworkerAuditTrail=leaveCoworkerAuditTrail;window.offerCoworkerAudit=offerCoworkerAudit;

function assignToCoworker(id,mode="reassign"){
 const t=getTicket(),cw=coworkerById(id);if(!t||t.resolved||!cw||t.ownerAgentId!=="player")return;
 if(state.maliciousStats?.reassignmentRestricted){toast("Teammate reassignment privileges are restricted under your misconduct plan.");return}
 if(["reviewing","accepted","working"].includes(t.specialistState)){toast("Recall the ticket from the specialist queue first.");return}
 const label=mode==="trade"?"trade tickets with":mode==="shared"?"send through the shared queue toward":"reassign this ticket to";
 if(!confirm(`Attempt to ${label} ${cw.name}? They may accept it, return it, or complain about a weak handoff.`))return;
 advanceTime(3);state.coworkerStats.reassignments++;t.coworkerId=cw.id;t.coworkerState="reviewing";t.status=`Teammate Review — ${cw.name}`;t.waiting=true;
 const dump=teammateDumpLevel(t,cw);noteCoworkerDump(t,cw,dump);
 coworkerHistory(t,cw,mode==="trade"?"Trade proposed":"Reassignment proposed",`Handoff quality ${(coworkerHandoffQuality(t,cw)*100).toFixed(0)}%.`);
 state.pending.push({type:"coworkerReview",ticketId:t.id,coworkerId:cw.id,mode,due:Date.now()+Math.round(5000+Math.random()*11000)});
 saveState();renderAll();if(dump>0)offerCoworkerAudit(t);
}
function tradeWithCoworker(id){assignToCoworker(id,"trade")}
function dumpToSharedQueue(){
 const t=getTicket();if(!t||t.resolved||t.ownerAgentId!=="player")return;
 if(state.maliciousStats?.reassignmentRestricted){toast("Shared-queue dumping is restricted under your misconduct plan.");return}
 if(!confirm("Send this ticket back to the shared Service Desk queue and hope another agent picks it up? Weak or repeated dumping can attract supervisor attention."))return;
 advanceTime(2);t.sharedQueue=true;t.coworkerState="shared";t.coworkerTransferMode="shared";t.status="Service Desk Shared Queue";t.waiting=true;state.coworkerStats.sharedQueueDumps++;
 const best=[...state.coworkers].sort((a,b)=>coworkerLoadValue(a.id)-coworkerLoadValue(b.id))[0];
 noteCoworkerDump(t,best,teammateDumpLevel(t,best)+1);
 coworkerHistory(t,null,"Sent to shared queue","Ownership released to the Service Desk shared queue.");
 state.pending.push({type:"sharedQueueReview",ticketId:t.id,due:Date.now()+8000+Math.round(Math.random()*16000)});
 saveState();renderAll();if(t.coworkerAuditPoints>0)offerCoworkerAudit(t);
}
function recallFromCoworker(){
 const t=getTicket();if(!t||t.resolved)return;
 state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&["coworkerReview","coworkerResolution","sharedQueueReview"].includes(p.type)));
 const cw=coworkerById(t.coworkerId);t.ownerAgentId="player";t.coworkerState="none";t.coworkerId=null;t.sharedQueue=false;t.status="In Progress";t.waiting=false;
 if(cw)coworkerHistory(t,cw,"Recalled","Returned to your queue.");
 saveState();renderAll();
}
function coworkerCreateTradeTicket(cw,oldTicket){
 const pool=difficultyScenarioPool().filter(sc=>sc.id!==oldTicket.scenarioId),sc=rand(pool.length?pool:SCENARIOS),nt=createTicket(sc);
 nt.tradedFromCoworker=true;nt.history.unshift({when:"Today",text:`Transferred from ${cw.name} as part of a Service Desk ticket trade.`});
 state.tickets.push(nt);state.sessionSize++;state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(x=>!x.resolved).length);return nt;
}
function processCoworkerReview(t,p){
 const cw=coworkerById(p.coworkerId);if(!cw)return;
 const chance=coworkerAcceptanceChance(cw,t,p.mode),accept=Math.random()<chance;
 if(!accept){
   cw.rejected++;cw.trust=Math.max(0,cw.trust-(t.coworkerDumped?2:.5));state.coworkerStats.returns++;
   t.ownerAgentId="player";t.coworkerState="returned";t.coworkerId=null;t.sharedQueue=false;t.status="Returned by Teammate";t.waiting=false;
   const missing=coworkerMissingDiagnostic(t);
   addCoworkerMsg(t,cw,missing?rand([`I'm sending this back. You haven't checked "${missing[1]}" yet, and I don't want to inherit it blind.`,`Nice try. Check "${missing[1]}" first and then decide whether this actually needs to leave your queue.`]):rand(["I'm returning this one. The handoff doesn't give me enough reason to take ownership.","I'm not taking this just to make the queue number move. Work it a little further first."]));
   coworkerHistory(t,cw,"Returned",`Acceptance chance ${Math.round(chance*100)}%.`);
   return;
 }
 cw.accepted++;cw.trust=Math.min(100,cw.trust+(t.coworkerDumped?.2:1));state.coworkerStats.accepted++;t.ownerAgentId=cw.id;t.coworkerState="accepted";t.coworkerTransferMode=p.mode||"reassign";t.status=`Owned by ${cw.name}`;t.waiting=true;
 if(p.mode==="trade"){
   cw.trades++;state.coworkerStats.trades++;const nt=coworkerCreateTradeTicket(cw,t);addCoworkerMsg(t,cw,`Deal. I'll take ${t.id}; I just sent ${nt.id} from my queue to yours.`);coworkerHistory(t,cw,"Trade accepted",`Received ${t.id}; sent ${nt.id} to player.`);
 }else{
   addCoworkerMsg(t,cw,rand(["I'll take it. If I find anything useful, I'll leave the result in the ticket.","Okay, I can own this one from here.","I'll grab it. Next time, give me the observed results in the handoff if you have them."]));
   coworkerHistory(t,cw,"Accepted ownership","Teammate took the ticket.");
 }
 state.pending.push({type:"coworkerResolution",ticketId:t.id,coworkerId:cw.id,due:Date.now()+Math.round((coworkerLoad(cw.id)==="Low"?14000:coworkerLoad(cw.id)==="Moderate"?26000:42000)+Math.random()*16000)});
}
function processSharedQueueReview(t){
 const candidates=[...state.coworkers].sort((a,b)=>coworkerLoadValue(a.id)-coworkerLoadValue(b.id));
 const cw=candidates[0],chance=coworkerAcceptanceChance(cw,t,"shared");
 if(Math.random()<chance){
   state.coworkerStats.sharedQueuePickups++;t.coworkerId=cw.id;t.ownerAgentId=cw.id;t.coworkerState="accepted";t.sharedQueue=false;t.status=`Picked Up — ${cw.name}`;cw.accepted++;
   addCoworkerMsg(t,cw,`I pulled this from the shared queue. I'll take ownership.`);
   coworkerHistory(t,cw,"Shared queue pickup","Teammate picked up the ticket.");
   state.pending.push({type:"coworkerResolution",ticketId:t.id,coworkerId:cw.id,due:Date.now()+18000+Math.round(Math.random()*22000)});
 }else{
   t.ownerAgentId="player";t.coworkerState="returned";t.sharedQueue=false;t.status="Returned to Your Queue";t.waiting=false;state.coworkerStats.returns++;
   addMsg(t,"system","Nobody picked up the ticket from the shared queue. Ownership returned to you.",true);
   coworkerHistory(t,null,"Shared queue return","No teammate accepted ownership.");
 }
}
function processCoworkerResolution(t,p){
 const cw=coworkerById(p.coworkerId);if(!cw)return;
 cw.resolved++;state.coworkerStats.teammateResolutions++;t.ownerAgentId="player";t.coworkerState="resolved";t.coworkerResolved=true;t.coworkerId=null;t.waiting=false;t.actions.push("correct-action");
 addCoworkerMsg(t,cw,`I finished this one. Root cause was ${getCause(t).label}. I applied the corrective action and handled the requester follow-up.`);
 coworkerHistory(t,cw,"Resolved by teammate",`Teammate completed ownership after ${t.coworkerTransferMode||"reassignment"}.`);
 addMsg(t,"system",`${cw.name} resolved the ticket while owning it. Your handoff quality still affects your score and supervisor review.`,true);
 finalizeTicket(t,"Resolved by Teammate",{showReport:state.selected===t.id});
}
window.askCoworkerForHelp=askCoworkerForHelp;window.assignToCoworker=assignToCoworker;window.tradeWithCoworker=tradeWithCoworker;window.dumpToSharedQueue=dumpToSharedQueue;window.recallFromCoworker=recallFromCoworker;

function teamLoad(id){
 if(!state.teamLoads[id]){
   const h=stableRank(`${id}-${state.career.shifts+1}-${state.difficulty}`)%100;
   state.teamLoads[id]=h<32?"Low":h<78?"Moderate":"High";
 }
 return state.teamLoads[id];
}
function teamResponseDelay(t,teamId,phase="review"){
 const tm=supportTeam(teamId),load=teamLoad(teamId),factor=load==="Low"?.76:load==="High"?1.42:1,behavior=teamBehavior(teamId);
 let ms=((tm?.base?.[0]||14)+(Math.random()*((tm?.base?.[1]||36)-(tm?.base?.[0]||14))))*1000*factor*behavior.speed;
 if(t.priority==="Critical")ms*=.58;else if(t.priority==="High")ms*=.82;
 if(phase==="work"){
   if(t.handoffGrade==="Excellent")ms*=.68;
   else if(t.handoffGrade==="Adequate")ms*=.90;
   else if(t.specialistMercy)ms*=.92;
 }
 return Math.round(Math.max(4500,Math.min(80000,ms)));
}
function specialistName(teamId){const tm=supportTeam(teamId);return rand(tm?.specialists||["Specialist"])}
function addSpecialistMsg(t,teamId,text,name=null){
 const tm=supportTeam(teamId);t.conversation.push({who:"specialist",teamId,teamName:tm?.name||"Specialist Team",specialist:name||specialistName(teamId),text,time:nowStamp()});
 if(state.selected!==t.id)t.unread++;
}
function teamHistory(t,teamId,action,note=""){
 t.teamHistory=t.teamHistory||[];const tm=supportTeam(teamId);
 t.teamHistory.push({time:nowStamp(),teamId,team:tm?.name||teamId,action,note});
}
function specialistEvidenceRequirement(t){
 const sc=getScenario(t),c=getCause(t),min=specialistMinimumEvidence(t);
 if(t.useful<min){
   const candidates=(sc.diagnostics||[]).filter(a=>!t.facts.includes(a[0])&&c.answers?.[a[0]]);
   const missing=candidates.sort((a,b)=>stableRank(`${t.id}:${a[0]}:specialist`)-stableRank(`${t.id}:${b[0]}:specialist`))[0];
   return {type:"fact",id:missing?.[0]||null,label:missing?.[1]||null,text:missing?`Please collect "${missing[1]}" and document the result. We need that evidence before we can distinguish a service-side issue from a desk-level cause.`:"Please collect additional symptoms, impact, and an exact error before resubmitting."};
 }
 if(state.difficulty!=="Trainee"&&(t.notes||"").trim().length<12&&t.useful<min+2)return {type:"notes",id:null,label:"Internal troubleshooting notes",text:`Please document the troubleshooting already performed and the observed results before resubmitting. We can see ${t.useful} useful check${t.useful===1?"":"s"}, but the handoff does not explain what they showed.`};
 return null;
}
function specialistReturn(t,teamId,text,kind="kickback"){
 const tm=supportTeam(teamId);
 addSpecialistMsg(t,teamId,text);
 t.assignmentQueue="Service Desk";t.specialistState=kind==="info"?"info-needed":"kicked-back";t.status=kind==="info"?"Returned — Info Needed":"Returned to Service Desk";t.waiting=false;
 t.teamKickbacks++;state.teamStats.kickbacks++;
 if(kind==="info"){t.teamInfoReturns++;state.teamStats.infoReturns++}
 teamHistory(t,teamId,kind==="info"?"Returned for information":"Kicked back",text);
}
function assignToTeam(teamId){
 const t=getTicket(),tm=supportTeam(teamId);if(!t||t.resolved||!tm)return;
 if(["reviewing","accepted","working"].includes(t.specialistState)){
   if(!confirm(`This ticket is already with ${t.assignmentQueue}. Reassign it to ${tm.name}?`))return;
   state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&String(p.type).startsWith("specialist")));
   t.teamRecalls++;state.teamStats.recalls++;
 }
 advanceTime(4);
 const intent=t.pendingEscalationAction;t.pendingEscalationAction=null;
 t.escalationAttempts++;state.teamStats.assignments++;t.escalated=true;t.assignmentQueue=tm.name;t.specialistState="reviewing";t.status=`Assigned — ${tm.name}`;t.waiting=true;t.specialistAccepted=false;t.acceptedTeamId=null;t.specialistMercy=false;t.specialistAcceptedWithWarning=false;
 teamHistory(t,teamId,"Assigned",intent?`Escalation action: ${intent.label}`:"Manual specialist assignment.");
 addMsg(t,"agent",`I'm routing this to our ${tm.name} team for specialist review.`);t.publicCount++;
 addMsg(t,"system",`${tm.name} received the assignment. Queue load: ${teamLoad(teamId)}.`,true);
 state.pending.push({type:"specialistReview",ticketId:t.id,teamId,intentCorrect:intent?!!intent.correct:null,due:Date.now()+teamResponseDelay(t,teamId,"review")});
 saveState();renderAll();
}

function acceptSpecialistHandoff(t,teamId,grade,{mercy=false,missing=null}={}){
 const tm=supportTeam(teamId),spec=specialistName(teamId),min=specialistMinimumEvidence(t);
 t.specialistInfoRequest=null;t.specialistAccepted=true;t.acceptedTeamId=teamId;t.specialistState="accepted";t.status=`With ${tm.name}`;t.assignmentQueue=tm.name;t.waiting=true;
 t.specialistMercy=!!mercy;t.specialistSuggestedDiagnostic=null;t.specialistSuggestedFix=null;
 state.teamStats.accepted++;t.useful+=mercy?1:2;
 recordHandoffGrade(t,teamId,grade,mercy?"Accepted despite incomplete evidence.":"Accepted for specialist investigation.");
 let warning=mercy;
 if(!mercy&&grade==="Adequate"&&((t.notes||"").trim().length<40||t.useful<=min+2))warning=Math.random()<.24;
 t.specialistAcceptedWithWarning=warning;
 if(grade==="Excellent"){state.teamStats.excellentHandoffs++;t.specialistExcellentHandoffs=(t.specialistExcellentHandoffs||0)+1}
 if(mercy){state.teamStats.mercyAccepts++;state.teamStats.weakHandoffs++;t.specialistWeakHandoffs=(t.specialistWeakHandoffs||0)+1}
 if(warning)state.teamStats.acceptedWithWarning++;
 let text;
 if(mercy)text=specialistMercyMessage(t,teamId,missing,grade);
 else if(grade==="Excellent")text=rand([
   "Excellent handoff. The evidence, scope, and notes are exactly what we need. We can move straight into the specialist investigation.",
   "Accepted — strong handoff. Thanks for including the useful checks and results; this should move quickly.",
   "This is a clean escalation. We have enough evidence to start at the likely service-side cause instead of repeating Service Desk work."
 ]);
 else if(warning)text=rand([
   "We'll take this. The handoff is adequate, though a little more detail in the notes would make the investigation cleaner next time.",
   "Accepted. We have enough to proceed, but please include the observed results more explicitly on the next handoff.",
   "We can work this as-is. It's sufficient, not ideal — a stronger evidence summary would save some specialist time."
 ]);
 else text=rand([
   "Assignment accepted. The troubleshooting supplied is sufficient for specialist investigation.",
   "Accepted. We have enough evidence to work this from the specialist queue.",
   "We own this issue and have started investigation."
 ]);
 addSpecialistMsg(t,teamId,text,spec);
 teamHistory(t,teamId,mercy?"Courtesy acceptance":grade==="Excellent"?"Excellent handoff":"Accepted",`${grade} handoff. Specialist investigation started.`);
 const progressChance=grade==="Excellent"?.16:mercy?.38:.30;
 const progress=Math.random()<progressChance;
 state.pending.push({type:progress?"specialistProgress":"specialistResolution",ticketId:t.id,teamId,specialist:spec,due:Date.now()+teamResponseDelay(t,teamId,"work")});
}

function processSpecialistReview(t,p){
 const teamId=p.teamId,tm=supportTeam(teamId),expected=expectedSpecialistTeamId(t),c=getCause(t),sc=getScenario(t);
 if(!tm)return;
 t.specialistMercy=false;t.specialistAcceptedWithWarning=false;
 const likelyFix=(sc.fixes||[]).find(f=>f[0]===c.correct);
 if(!causeRequiresSpecialist(t)){
   t.wrongTeamAssignments++;state.teamStats.wrongQueue++;t.irrelevant+=2;recordHandoffGrade(t,teamId,"Poor","Issue appears Service Desk resolvable.");
   let text=rand([
     "This appears service-desk resolvable and does not require our queue. Please complete local troubleshooting before escalating.",
     "We reviewed the ticket and do not see a specialist-tier issue yet. Returning to Service Desk.",
     "This does not currently meet escalation criteria. Please troubleshoot at the desk."
   ]);
   if(likelyFix&&Math.random()<specialistAdviceChance(t,teamId)){
     t.specialistSuggestedFix=likelyFix[0];state.teamStats.adviceReturns++;
     text+=` Before you send this anywhere else, we'd try: ${likelyFix[1]}.`;
   }
   specialistReturn(t,teamId,text);return;
 }
 if(p.intentCorrect===false){
   t.wrongTeamAssignments++;state.teamStats.wrongQueue++;t.irrelevant+=2;recordHandoffGrade(t,teamId,"Poor","Escalation action did not match the evidence.");
   let text="The requested escalation action does not match the evidence in the ticket. Please reassess the issue before routing it again.";
   if(Math.random()<specialistAdviceChance(t,teamId)){
     state.teamStats.adviceReturns++;
     const missing=specialistEvidenceRequirement(t);
     if(missing)text+=" "+specialistAdviceText(t,teamId,missing);
     else text+=` The evidence we can see is more consistent with "${c.label}" than with the escalation action you selected.`;
   }
   specialistReturn(t,teamId,text);return;
 }
 if(teamId!==expected){
   t.wrongTeamAssignments++;state.teamStats.wrongQueue++;t.irrelevant+=2;recordHandoffGrade(t,teamId,"Wrong Team",`Expected ownership: ${supportTeam(expected)?.name||expected}.`);
   const autoForward=Math.random()<specialistInternalRerouteChance(teamId);
   if(autoForward){
     const to=supportTeam(expected);t.teamReroutes++;state.teamStats.reroutes++;t.assignmentQueue=to.name;t.specialistState="reviewing";t.status=`Rerouted — ${to.name}`;
     addSpecialistMsg(t,teamId,`This belongs to ${to.name}, not ${tm.name}. Our queue is ${teamLoad(teamId).toLowerCase()}, so we're forwarding it internally rather than bouncing it back. The original routing will still count against handoff quality.`);
     teamHistory(t,teamId,"Internally rerouted",`Wrong-team handoff forwarded to ${to.name}.`);
     teamHistory(t,expected,"Received internal reroute",`Forwarded from ${tm.name}.`);
     state.pending.push({type:"specialistReview",ticketId:t.id,teamId:expected,intentCorrect:true,due:Date.now()+teamResponseDelay(t,expected,"review")});
   }else{
     const advice=Math.random()<specialistAdviceChance(t,teamId);
     const to=supportTeam(expected);
     specialistReturn(t,teamId,advice
       ?`This is outside ${tm.name}'s ownership. Based on the symptoms, ${to.name} is the queue that should own it. Please route it there after checking the handoff evidence.`
       :rand(["This ticket is outside our ownership. Returning it to Service Desk for correct routing.","Wrong support queue. The symptoms do not align with our service ownership.","We reviewed the ticket and this belongs elsewhere. Please verify service ownership before reassigning."]));
     if(advice)state.teamStats.adviceReturns++;
   }
   return;
 }
 const hardBlock=specialistHardBlock(t);
 if(hardBlock){
   const missing={type:"authorization",id:null,text:hardBlock};t.specialistInfoRequest=missing;recordHandoffGrade(t,teamId,"Blocked",hardBlock);
   specialistReturn(t,teamId,hardBlock,"info");return;
 }
 const missing=specialistEvidenceRequirement(t),grade=specialistHandoffGrade(t,teamId);
 if(missing){
   const mercyChance=specialistMercyChance(t,teamId,grade);
   if(Math.random()<mercyChance){acceptSpecialistHandoff(t,teamId,grade,{mercy:true,missing});return}
   t.specialistInfoRequest=missing;recordHandoffGrade(t,teamId,grade,missing.text);
   if(Math.random()<specialistAdviceChance(t,teamId)){
     state.teamStats.adviceReturns++;
     const advice=specialistAdviceText(t,teamId,missing);
     specialistReturn(t,teamId,advice,"info");
   }else specialistReturn(t,teamId,missing.text,"info");
   return;
 }
 acceptSpecialistHandoff(t,teamId,grade);
}
function processSpecialistProgress(t,p){
 const tm=supportTeam(p.teamId);if(!tm)return;
 t.specialistState="working";t.status=`With ${tm.name} — Investigating`;
 addSpecialistMsg(t,p.teamId,rand([
   "Update: we reproduced the issue and are working through the backend/service-layer cause.",
   "Update: the ticket is still in progress. We found evidence consistent with the reported symptoms and are testing the corrective action.",
   "Update: investigation is active. No additional Service Desk action is needed right now."
 ]),p.specialist);
 teamHistory(t,p.teamId,"Progress update","Specialist investigation continues.");
 state.pending.push({type:"specialistResolution",ticketId:t.id,teamId:p.teamId,specialist:p.specialist,due:Date.now()+Math.max(6000,teamResponseDelay(t,p.teamId,"work")*.72)});
}
function specialistResolutionText(t,teamId){
 const tm=supportTeam(teamId),cause=getCause(t);
 const verbs={
  network:"Network-side correction has been applied.",security:"Security investigation and containment actions are complete.",identity:"Identity-platform correction has been completed.",
  endpoint:"Endpoint remediation has been completed.",messaging:"Messaging-side correction has been completed.",collaboration:"Collaboration application remediation has been applied.",
  applications:"Application-tier correction has been completed.",workflow:"Workflow configuration/service correction has been completed.",governance:"Governance-system correction has been completed.",
  data:"Data/analytics service correction has been completed.",hr:"HR-system correction has been completed.",clinical:"Clinical application correction has been completed.",
  asset:"Asset-system correction has been completed.",files:"File/storage service correction has been completed.",privacyrecords:"The required Privacy/Records review and disposition action is complete.",
  vendor:"Vendor/licensing coordination has reached a resolution.",platform:"Platform-service correction has been completed."
 };
 return `Finding: ${cause.label}. ${verbs[teamId]||"Specialist corrective work is complete."} Please validate with the requester before closure.`;
}
function processSpecialistResolution(t,p){
 const tm=supportTeam(p.teamId);if(!tm)return;
 t.specialistState="awaiting-confirmation";t.specialistResolution=true;t.resolutionFollowupReady=true;t.assignmentQueue="Service Desk";t.status="In Progress";t.waiting=false;t.actions.push("correct-action");t.facts.push("specialist-finding");state.teamStats.resolutions++;
 addSpecialistMsg(t,p.teamId,specialistResolutionText(t,p.teamId),p.specialist);
 teamHistory(t,p.teamId,"Resolved by specialist","Returned to Service Desk for requester validation.");
 addMsg(t,"system","Specialist work is complete. Follow up with the requester to test and confirm resolution.",true);
}
function recallFromTeam(){
 const t=getTicket();if(!t||t.resolved||t.assignmentQueue==="Service Desk")return;
 const old=t.assignmentQueue;
 if(!confirm(`Recall this ticket from ${old} back to Service Desk?`))return;
 state.pending=state.pending.filter(p=>!(p.ticketId===t.id&&String(p.type).startsWith("specialist")));
 t.teamRecalls++;state.teamStats.recalls++;t.irrelevant++;teamHistory(t,t.acceptedTeamId||expectedSpecialistTeamId(t),"Recalled",`Agent recalled ticket from ${old}.`);
 t.assignmentQueue="Service Desk";t.specialistState="none";t.specialistAccepted=false;t.acceptedTeamId=null;t.status="In Progress";t.waiting=false;
 addMsg(t,"system",`Ticket recalled from ${old} to Service Desk.`,true);saveState();renderAll();
}
function openTeamsTab(){activeTab="teams";renderTab()}
window.assignToTeam=assignToTeam;window.recallFromTeam=recallFromTeam;window.openTeamsTab=openTeamsTab;



function simWeekday(){return ["Monday","Tuesday","Wednesday","Thursday","Friday"][(state.careerProfile?.shifts||0)%5]}
function worldEventById(id){return state.world?.events?.find(e=>e.id===id)||null}
function worldEventDisplayTitle(e){return e.known||e.discovered?e.title:(e.kind==="Outage"?"Unidentified Service Degradation":e.kind==="Security Campaign"?"Security Reports Under Review":"Operational Event Under Review")}
function addWorldAnnouncement(text,kind="Info",eventId=null){
 state.world.announcements=state.world.announcements||[];state.world.announcements.unshift({time:fmtTime(state.clock),kind,text,eventId});state.world.announcements=state.world.announcements.slice(0,30);
}
function chooseWorldTemplates(count){
 let pool=[...WORLD_EVENT_TEMPLATES],selected=[];
 if(state.difficulty==="Trainee")pool=pool.filter(x=>x.severity!=="Critical"&&x.kind!=="Security Campaign");
 if(simWeekday()==="Monday"){const auth=pool.find(x=>x.id==="auth-surge");if(auth){selected.push(auth);pool=pool.filter(x=>x!==auth)}}
 while(selected.length<count&&pool.length){const idx=Math.floor(Math.random()*pool.length);selected.push(pool.splice(idx,1)[0])}
 return selected;
}
function buildWorldEvent(template,index){
 const start=index===0?480:480+18+index*22+Math.floor(Math.random()*24);
 const duration=template.duration[0]+Math.floor(Math.random()*(template.duration[1]-template.duration[0]+1));
 const target=template.tickets[0]+Math.floor(Math.random()*(template.tickets[1]-template.tickets[0]+1));
 const id=`EVT-${String(state.world.nextId++).padStart(3,"0")}`;
 return {id,templateId:template.id,kind:template.kind,title:template.title,summary:template.summary,planned:template.planned,incident:template.incident,severity:template.severity,start,end:start+duration,status:index===0?"active":"upcoming",known:!!template.planned,discovered:!!template.planned,correlationKey:template.incident?`WORLD-${id}`:null,targetTickets:target,spawned:0,midBurst:false,vip:!!template.vip,scenarios:template.scenarios};
}
function trackWorldType(e){if(e.kind==="Outage")state.worldStats.outages++;else if(e.kind==="Security Campaign")state.worldStats.campaigns++;else if(e.kind==="Change")state.worldStats.changeEvents++}
function initializeWorldSchedule(count){
 state.world={weekday:simWeekday(),events:[],announcements:[],nextId:1,lastClock:480,initialized:true,dynamicAdded:0,dynamicCap:worldDynamicCap(count)};state.worldStats=defaultState().worldStats;
 const eventCount=state.endless?3:count<=5?1:count<=10?2:count<=20?3:4;
 state.world.events=chooseWorldTemplates(eventCount).map((t,i)=>buildWorldEvent(t,i));
 state.world.events.forEach(e=>{if(e.status==="active"){state.worldStats.activated++;state.worldCareer.eventsSeen++;trackWorldType(e);addWorldAnnouncement(e.planned?`Change window started: ${e.title}. ${e.summary}`:"Operations alert: multiple service reports are under investigation. A common cause has not yet been established.",e.kind,e.id)}else if(e.planned)addWorldAnnouncement(`Scheduled ${e.kind.toLowerCase()} at ${fmtTime(e.start)}: ${e.title}.`,e.kind,e.id)});
}
function worldTicketSpec(e){if(!e?.scenarios?.length)return null;const pair=rand(e.scenarios),sc=SCENARIOS.find(x=>x.id===pair[0]);return sc?{scenario:sc,causeId:pair[1]||null}:null}
function executiveEmployeeId(){const c=state.employees.filter(e=>e.department==="Executive Office"),m=c.find(e=>e.role==="Manager")||c.find(e=>e.role==="Supervisor")||c[0];return m?.id||state.employees[0]?.id}
function createWorldTicket(e){
 const spec=worldTicketSpec(e);if(!spec)return null;const t=createTicket(spec.scenario,spec.causeId,e.vip?executiveEmployeeId():null);
 t.worldGenerated=true;t.worldEventId=e.id;t.worldEventKnown=!!e.known;t.vipTicket=!!e.vip;if(e.incident){t.incidentKey=e.correlationKey;t.incidentSeedLabel=e.title}
 if(e.vip){t.priority=t.priority==="Critical"?"Critical":"High";t.subject=`Executive support: ${t.subject}`}
 e.spawned++;state.worldStats.eventTickets++;state.worldCareer.eventTickets++;if(e.vip)state.worldStats.vipTickets++;return t;
}
function seedInitialWorldTickets(count){
 const out=[],active=state.world.events.filter(e=>e.status==="active");let budget=Math.min(count<=5?1:count<=10?2:3,Math.max(1,Math.floor(count*.25)));
 for(const e of active){while(budget>0&&e.spawned<Math.min(e.targetTickets,2)){const t=createWorldTicket(e);if(t){out.push(t);budget--}else break}}return out;
}
function addWorldTickets(e,count){
 if(!state.active||!e)return;let added=0,allowed=count;
 if(!state.endless){
   const remaining=Math.max(0,(state.world.dynamicCap||0)-(state.world.dynamicAdded||0));
   allowed=Math.min(count,remaining);
 }
 while(added<allowed&&e.spawned<e.targetTickets){const t=createWorldTicket(e);if(!t)break;state.tickets.push(t);added++}
 if(added){
   if(!state.endless){state.sessionSize+=added;state.world.dynamicAdded=(state.world.dynamicAdded||0)+added}
   state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(t=>!t.resolved).length);
   toast(`${added} new ticket${added===1?"":"s"} arrived during ${worldEventDisplayTitle(e)}.`);
 }
}
function activateWorldEvent(e){
 if(!e||e.status!=="upcoming")return;e.status="active";state.worldStats.activated++;state.worldCareer.eventsSeen++;trackWorldType(e);
 addWorldAnnouncement(e.planned?`Scheduled event started: ${e.title}. ${e.summary}`:`Operations is investigating new service reports. ${e.known?e.title+". "+e.summary:"Correlation has not yet been established."}`,e.kind,e.id);
 addWorldTickets(e,Math.min(2,e.targetTickets-e.spawned));
}
function resolveWorldEvent(e){
 if(!e||e.status==="resolved")return;e.status="resolved";state.worldStats.resolved++;
 if(e.discovered||e.known)addWorldAnnouncement(`Resolved: ${e.title}. Monitoring has returned to normal.`,e.kind,e.id);
 const mi=e.correlationKey?state.majorIncidents[e.correlationKey]:null;if(mi)mi.open=false;
 state.worldCareer.history.unshift({shift:state.career.shifts+1,weekday:state.world.weekday,title:e.title,kind:e.kind,status:"Resolved"});state.worldCareer.history=state.worldCareer.history.slice(0,30);
}
function discoverWorldEvent(t){
 const e=worldEventById(t?.worldEventId);if(!e)return null;
 if(!e.discovered){e.discovered=true;e.known=true;state.worldStats.correlations++;state.worldCareer.correlations++;addWorldAnnouncement(`Service Desk correlation identified: ${e.title}. ${e.summary}`,e.kind,e.id)}
 t.worldEventKnown=true;t.worldContextSeen=true;state.tickets.filter(x=>x.worldEventId===e.id).forEach(x=>x.worldEventKnown=true);return e;
}
function processWorldClock(oldClock,newClock){
 if(!state.world?.initialized)return;
 state.world.events.forEach(e=>{if(e.status==="upcoming"&&newClock>=e.start)activateWorldEvent(e);if(e.status==="active"){const mid=e.start+Math.floor((e.end-e.start)/2);if(!e.midBurst&&newClock>=mid&&e.spawned<e.targetTickets){e.midBurst=true;addWorldTickets(e,1)}if(newClock>=e.end)resolveWorldEvent(e)}});
 if(state.endless&&state.world.events.length&&state.world.events.every(e=>e.status==="resolved")){const t=rand(WORLD_EVENT_TEMPLATES),e=buildWorldEvent(t,state.world.events.length);e.start=newClock+12+Math.floor(Math.random()*20);e.end=e.start+(t.duration[0]+Math.floor(Math.random()*(t.duration[1]-t.duration[0]+1)));e.status="upcoming";state.world.events.push(e);if(e.planned)addWorldAnnouncement(`Scheduled ${e.kind.toLowerCase()} at ${fmtTime(e.start)}: ${e.title}.`,e.kind,e.id)}
 state.world.lastClock=newClock;
}
function activeWorldEvents(){return state.world?.events?.filter(e=>e.status==="active")||[]}
function relevantWorldEvent(t){return t?.worldEventId?worldEventById(t.worldEventId):null}
function worldServiceStatusText(t){const e=relevantWorldEvent(t);if(e&&(e.known||e.discovered))return `Operational context: ${e.id} — ${e.title} (${e.status.toUpperCase()}). ${e.summary}`;const a=activeWorldEvents().filter(e=>e.known||e.discovered);return a.length?`Known operational events: ${a.map(e=>`${e.id} ${e.title}`).join(" | ")}`:""}
function worldStatusLabel(){const a=activeWorldEvents(),k=a.filter(e=>e.known||e.discovered);if(!a.length)return "Ops normal";if(a.some(e=>e.severity==="Critical")&&k.length)return `${k.length} critical ops`;return `${a.length} ops event${a.length===1?"":"s"}`}
function renderWorldEventCard(e){const v=e.known||e.discovered||e.planned;return `<div class="worldcard ${esc(e.status)}"><div class="worldhead"><div><div class="worldtype">${esc(e.kind)} · ${fmtTime(e.start)}–${fmtTime(e.end)}</div><div class="worldtitle">${esc(v?e.title:worldEventDisplayTitle(e))}</div></div><span class="worldstatus ${esc(e.status)}">${esc(e.status)}</span></div><div style="margin-top:5px">${esc(v?e.summary:"Operations has not yet established the common cause of the reports.")}</div><div class="teammeta"><span>${e.spawned}/${e.targetTickets} simulated ticket load</span><span>${e.incident?"Correlatable incident":"Context event"}</span></div></div>`}
function showOperationsBoard(){
 const events=state.world?.events||[],anns=state.world?.announcements||[];
 showModal(`<div class="mh"><h2>Operations Board — ${esc(state.world?.weekday||simWeekday())}</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><div class="opsboard"><div class="reportgrid"><div class="stat"><b>${events.filter(e=>e.status==="active").length}</b><span>Active Events</span></div><div class="stat"><b>${state.worldStats?.eventTickets||0}</b><span>Event Tickets</span></div><div class="stat"><b>${state.worldStats?.correlations||0}</b><span>Correlations</span></div><div class="stat"><b>${Object.values(state.majorIncidents||{}).filter(x=>x.open).length}</b><span>Open Major Incidents</span></div></div><div class="opscolumns"><div class="contextcard"><h4>Operational Events</h4><div class="worldtimeline">${events.map(renderWorldEventCard).join("")||'<div class="small">No events scheduled.</div>'}</div></div><div class="contextcard"><h4>Announcements</h4><div class="opsfeed">${anns.map(a=>`<div class="announcement"><b>${esc(a.time)} · ${esc(a.kind)}</b><br>${esc(a.text)}</div>`).join("")||'<div class="small">No announcements.</div>'}</div></div></div>${state.worldCareer?.history?.length?`<div class="contextcard"><h4>Recent Operational History</h4>${state.worldCareer.history.slice(0,8).map(h=>`<div class="announcement"><b>Shift ${h.shift} · ${esc(h.weekday)} · ${esc(h.kind)}</b><br>${esc(h.title)} — ${esc(h.status)}</div>`).join("")}</div>`:""}</div></div><div class="mf"><button class="primary" onclick="hideModal()">Done</button></div>`);
}
window.showOperationsBoard=showOperationsBoard;

function createTicket(scenario,forcedCauseId=null,forcedEmployeeId=null){
 const cause=forcedCauseId?(scenario.causes.find(c=>c.id===forcedCauseId)||rand(scenario.causes)):rand(scenario.causes);
 const forcedEmployee=forcedEmployeeId?state.employees.find(e=>e.id===forcedEmployeeId):null;
 const employee=forcedEmployee&&!forcedEmployee.accountDisabledByAgent?forcedEmployee:chooseEmployeeForScenario(scenario);
 const p=PERSONALITIES.find(x=>x.id===employee.personality)||rand(PERSONALITIES),name=employee.name,dept=employee.department;
 const supervisor=employee.supervisorName||pickActorName([name]),manager=employee.managerName||pickActorName([name,supervisor]);
 const actors=createOrgActors(scenario,dept,supervisor,manager,name);
 const opening=rand(scenario.open),memory=relationshipOpening(employee,scenario);
 const priority=scenario.priority||"Normal",ticketPrefix=catalogForScenario(scenario,cause)?"REQ":"INC";
 if(employee.lifetimeTickets>0)state.relationshipStats.repeatRequesters++;
 employee.lifetimeTickets++;employee.lastCategory=scenario.cat;employee.categoryCounts[scenario.cat]=(employee.categoryCounts[scenario.cat]||0)+1;
 if(employee.knownSinceShift==null)employee.knownSinceShift=state.career.shifts+1;
 const ticket={
   id:ticketPrefix+"-"+state.nextNum++,scenarioId:scenario.id,causeId:cause.id,userId:employee.id,user:name,department:dept,personality:p.id,priority,
   category:scenario.cat,ticketType:inferTicketType(scenario,cause),subject:rand(scenario.subject),opened:state.clock,status:"New",unread:0,resolved:false,outcome:null,score:null,
   conversation:[{who:"user",text:memory+p.prefix+opening,time:fmtTime(state.clock)}],
   actions:[],facts:[],toolsUsed:[],notes:"",publicCount:0,useful:0,irrelevant:0,repeats:0,bad:0,securityBad:0,escalated:false,
   confirmation:false,waiting:false,slaMissed:false,scoreBreakdown:null,conductViolations:0,professionalismHits:0,profanityCount:0,
   complaint:false,customerRating:null,customerFeedback:null,forceClosed:false,supervisor,manager,employeeComplaintRecorded:false,
   approval:makeApprovalProfile(scenario,cause,actors,state.clock),actors,badDiagnostics:chooseBadDiagnostics(),
   history:makeTicketHistory(scenario,cause,name,employee),attachments:makeAttachments(scenario,cause),closureHistory:[],reopenCount:0,reopenPenalty:0,
   reliability:Math.random()<.82?employee.infoStyle:chooseReliability(p.id),misledOnce:false,relatedChecked:false,incidentKey:null,incidentSeedLabel:null,relatedKnown:false,userMadeWorse:false,selfResolved:false,
   proactiveFacts:[],assignmentQueue:"Service Desk",teamHistory:[],specialistState:"none",escalationAttempts:0,teamKickbacks:0,wrongTeamAssignments:0,teamInfoReturns:0,teamReroutes:0,teamRecalls:0,specialistAccepted:false,acceptedTeamId:null,specialistResolution:false,specialistInfoRequest:null,specialistSuggestedDiagnostic:null,specialistSuggestedFix:null,handoffGrade:null,handoffHistory:[],specialistMercy:false,specialistAcceptedWithWarning:false,specialistWeakHandoffs:0,specialistExcellentHandoffs:0,ownerAgentId:"player",coworkerState:"none",coworkerId:null,coworkerHistory:[],coworkerSuggestedDiagnostic:null,coworkerSuggestedFix:null,coworkerDumped:false,coworkerDumpPoints:0,coworkerAuditPoints:0,coworkerTransferMode:null,coworkerResolved:false,tradedFromCoworker:false,sharedQueue:false,pendingEscalationAction:null,worldGenerated:false,worldEventId:null,worldEventKnown:false,worldContextSeen:false,vipTicket:false,careerCounted:false,clarification:null,resolutionFollowupReady:false,request:null,requesterAccountDeleted:false,deletedTicket:false,maliciousAction:null,maliciousCaught:false,misconductActions:[],auditAttributionHidden:false,auditLastOutcome:null,responsePolicy:null,reopenRouting:"player",noCsat:false,alternateValidated:false,requesterWithdrawn:false,noLongerReproducible:false
 };
 hydrateRequestState(ticket);if(ticket.request)state.requestStats.catalogTickets++;
 employee.lastTicketId=ticket.id;
 return ticket;
}
function getScenario(t){return SCENARIOS.find(s=>s.id===t.scenarioId)}
function getCause(t){return getScenario(t).causes.find(c=>c.id===t.causeId)}
function getTicket(){return state.tickets.find(t=>t.id===state.selected)}
function getPerson(t){return PERSONALITIES.find(p=>p.id===t.personality)||PERSONALITIES[0]}
function getEmployee(t){return employeeForTicket(t)}


function clonePlain(v){return JSON.parse(JSON.stringify(v))}
function persistentSnapshot(){
 return clonePlain({career:state.career,careerProfile:state.careerProfile,careerArchive:state.careerArchive,discipline:state.discipline,performance:state.performance,supervisor:state.supervisor,employees:state.employees,relationshipStats:state.relationshipStats,worldCareer:state.worldCareer,coworkers:state.coworkers,coworkerStats:state.coworkerStats,maliciousStats:state.maliciousStats,settings:state.settings});
}
function restoreFreeplayBaseline(){
 if(!state?.freeplayBaseline)return false;
 const b=clonePlain(state.freeplayBaseline),typing=clonePlain(getTypingPracticeStats());
 const restored=defaultState();
 ["career","careerProfile","careerArchive","discipline","performance","supervisor","employees","relationshipStats","worldCareer","coworkers","coworkerStats","maliciousStats"].forEach(k=>{if(b[k]!==undefined)restored[k]=b[k]});
 restored.settings={...restored.settings,...(b.settings||{}),typing};
 state=normalizeState(restored);syncTypingPracticeStats();return true;
}
function freeplayScenarioTypes(sc){return [...new Set((sc.causes||[]).map(c=>expectedTicketTypeFor(sc,c)))]}
function freeplayScenarioMatches(sc,term="",priority="",type=""){
 const hay=`${sc.id} ${sc.cat} ${(sc.subject||[]).join(" ")} ${(sc.open||[]).join(" ")} ${freeplayScenarioTypes(sc).join(" ")}`.toLowerCase();
 return (!term||hay.includes(term.toLowerCase()))&&(!priority||sc.priority===priority)&&(!type||freeplayScenarioTypes(sc).includes(type));
}
function freeplayScenarioCard(sc){
 const types=freeplayScenarioTypes(sc);
 return `<div class="freeplaycard"><div class="freeplaymeta"><span class="tag">${esc(sc.priority)}</span>${types.map(x=>`<span class="tag ${x==="Incident"||x==="Security Incident"?"":"requestbadge"}">${esc(x)}</span>`).join("")}</div><h4>${esc(sc.subject?.[0]||sc.id)}</h4><div>${esc(sc.cat)} · ${sc.causes.length} hidden root-cause variant${sc.causes.length===1?"":"s"}</div><div class="requestbuttons"><button class="primary" type="button" onclick="addFreeplayTicket('${esc(sc.id)}')">Add Ticket</button></div></div>`;
}
function currentFreeplayFilter(){
 return {term:document.getElementById("freeplaySearch")?.value?.trim()||"",priority:document.getElementById("freeplayPriority")?.value||"",type:document.getElementById("freeplayType")?.value||""};
}
function renderFreeplayPickerList(){
 const list=document.getElementById("freeplayScenarioList");if(!list)return;
 const f=currentFreeplayFilter(),matches=SCENARIOS.filter(sc=>freeplayScenarioMatches(sc,f.term,f.priority,f.type));
 list.innerHTML=matches.map(freeplayScenarioCard).join("")||'<div class="small">No scenarios match those filters.</div>';
 const count=document.getElementById("freeplayMatchCount");if(count)count.textContent=`${matches.length} scenario${matches.length===1?"":"s"} available`;
}
function showFreeplayTicketPicker(){
 if(!state.freeplay){
   showModal(`<div class="mh"><h2>Freeplay Ticket Picker</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><div class="freeplaynote"><b>Freeplay is a separate practice desk.</b><br>Start a new session and choose <b>Freeplay</b> under Desk Mode / Session. It begins with an empty queue, lets you add any scenario whenever you want, and does not commit ticket results to your career record.</div></div><div class="mf"><button class="secondary" onclick="hideModal()">Cancel</button><button class="primary" onclick="hideModal();newShift()">Open New Shift Setup</button></div>`);
   return;
 }
 const fs=state.freeplayStats||defaultState().freeplayStats,avg=fs.completed?Math.round(fs.scoreSum/fs.completed):0;
 showModal(`<div class="mh"><h2>Freeplay — Add Tickets</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><div class="freeplaynote"><b>Practice desk:</b> add only the tickets you want. Root causes remain hidden and are randomized normally. Freeplay results are isolated from career progression, supervisor reviews, promotion, and closure discipline.</div>
 <div class="freeplaystats"><div class="stat"><b>${fs.added||0}</b><span>Added</span></div><div class="stat"><b>${fs.completed||0}</b><span>Completed</span></div><div class="stat"><b>${avg||"—"}</b><span>Average</span></div><div class="stat"><b>${fs.bestScore||"—"}</b><span>Best Score</span></div></div>
 <div class="freeplaytools"><label class="sr-only" for="freeplaySearch">Search scenarios</label><input id="freeplaySearch" aria-label="Search scenarios" placeholder="Search category, subject, system, or scenario..."><label class="sr-only" for="freeplayPriority">Priority filter</label><select id="freeplayPriority" aria-label="Priority filter"><option value="">All priorities</option><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select><label class="sr-only" for="freeplayType">Type filter</label><select id="freeplayType" aria-label="Ticket type filter"><option value="">All types</option>${["Incident","Security Incident",...REQUEST_TYPES].map(x=>`<option>${esc(x)}</option>`).join("")}</select><button class="secondary" type="button" onclick="addRandomFreeplayTicket()">Add Random</button></div>
 <div class="small" id="freeplayMatchCount" style="margin-top:6px"></div><div class="freeplaylist" id="freeplayScenarioList"></div></div><div class="mf"><button class="secondary" onclick="hideModal()">Back to Desk</button></div>`);
 ["freeplaySearch","freeplayPriority","freeplayType"].forEach(id=>{const el=document.getElementById(id);if(el)el.oninput=renderFreeplayPickerList});
 renderFreeplayPickerList();
}
function addFreeplayTicket(scenarioId){
 if(!state.freeplay||!state.active)return;
 const sc=SCENARIOS.find(x=>x.id===scenarioId);if(!sc)return;
 const t=createTicket(sc);t.freeplayAdded=true;state.tickets.push(t);state.sessionSize=state.tickets.length;state.freeplayStats.added++;state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(x=>!x.resolved).length);state.selected=t.id;
 hideModal();saveState();renderAll();document.querySelector?.(`.ticketrow[data-id="${t.id}"]`)?.focus?.();toast(`${t.id} added to Freeplay.`);
}
function addRandomFreeplayTicket(){
 if(!state.freeplay)return;
 const f=currentFreeplayFilter(),pool=SCENARIOS.filter(sc=>freeplayScenarioMatches(sc,f.term,f.priority,f.type));
 if(!pool.length){toast("No matching scenarios to add.");return}
 addFreeplayTicket(rand(pool).id);
}
window.showFreeplayTicketPicker=showFreeplayTicketPicker;window.addFreeplayTicket=addFreeplayTicket;window.addRandomFreeplayTicket=addRandomFreeplayTicket;

const TYPING_WORDS=("account access action active adapter address admin alert application approval archive asset assign attach audio authentication backup badge browser cable cache calendar case category change client cloud code computer confirm connection contact correct credential customer data database delete desktop device diagnostic directory document email employee endpoint error escalation ethernet evidence file filter firewall folder form gateway group hardware help identity incident install internet issue keyboard laptop license login mailbox manager message monitor network note notification password permission phone policy printer priority profile queue record request reset resolution restart review role route security service session shared software specialist status storage support system team ticket tool update user vendor verify version vpn web wifi window workflow " +
"accurate balance basic business careful clear complete consistent controlled critical current detailed efficient exact followup helpful information normal pending practice process professional quick reliable remote standard temporary troubleshoot typing useful validation").split(/\s+/);
const TYPING_SENTENCES=[
 "Please confirm the exact error message and tell me when the problem started.",
 "The account is active, but the user still cannot reach the shared folder.",
 "Document the troubleshooting steps before routing the ticket to a specialist team.",
 "A successful fix should be tested with the requester before the ticket is closed.",
 "Check whether the issue affects one person, several people, or the entire department.",
 "The service request needs a business reason, an approved owner, and the correct access level.",
 "Restarting can be useful, but only when the symptoms make a restart a reasonable diagnostic step.",
 "The user reports that email works on the web but not in the desktop application.",
 "Verify the device name, network connection, and current software version before escalating.",
 "A clear internal note should record the symptom, evidence, action, and validation result.",
 "The printer queue is clear, the device is online, and another workstation can print normally.",
 "Temporary privileged access requires a defined purpose, an expiration date, and proper authorization.",
 "The requester says the problem returned after working correctly for several minutes.",
 "Review the ticket history before repeating troubleshooting that another agent already completed.",
 "Do not treat a new access request as though an existing service has suddenly stopped working.",
 "The specialist team accepted the handoff and is investigating the service-side root cause.",
 "A production outage can generate several related tickets before the common cause is obvious.",
 "Good service desk communication is concise, specific, professional, and easy for the requester to follow."
];
const TYPING_SERVICE=[
 "Caller reports intermittent VPN failure after a recent password change. Confirm normal internet access, verify the exact VPN error, and check whether the approved client version is installed.",
 "Requester needs access to a restricted department folder. Determine whether this is lost existing access or a brand-new entitlement, identify the data owner, and document the business need before fulfillment.",
 "Several employees cannot open the same production workflow. Check service status and related tickets before treating each report as an isolated workstation problem.",
 "A new employee needs standard accounts and baseline application access. Collect the role, department, start date, sponsor, and any nonstandard requirements before submitting fulfillment.",
 "The user says the application crashes immediately after launch. Ask whether coworkers are affected, capture the exact error text, and determine whether a recent update changed the environment.",
 "A vendor requests privileged production access for troubleshooting. Verify the supported scope, approval chain, expiration, application ownership, and security requirements before any access is granted."
];
let typingSession=null,typingTimer=null;
function typingGenerateTarget(mode,duration){
 const targetChars=Math.max(500,Math.round(duration*11));
 if(mode==="words"){let out=[];while(out.join(" ").length<targetChars)out.push(rand(TYPING_WORDS));return out.join(" ").slice(0,targetChars)}
 const source=mode==="service"?TYPING_SERVICE:TYPING_SENTENCES;let out=[];while(out.join(" ").length<targetChars)out.push(rand(source));return out.join(" ").slice(0,targetChars);
}
function typingMetrics(){
 if(!typingSession)return {wpm:0,accuracy:100,correct:0,typed:0,elapsed:0,remaining:0};
 const input=document.getElementById("typingInput"),typed=input?.value||"",target=typingSession.target;
 let correct=0;for(let i=0;i<typed.length;i++)if(typed[i]===target[i])correct++;
 const elapsed=typingSession.startedAt?Math.min(typingSession.duration,(Date.now()-typingSession.startedAt)/1000):0,mins=Math.max(elapsed/60,1/60);
 const wpm=typingSession.startedAt?Math.min(300,Math.max(0,Math.round((correct/5)/mins))):0,accuracy=typed.length?Math.round((correct/typed.length*100)*10)/10:100;
 return {wpm,accuracy,correct,typed:typed.length,elapsed,remaining:Math.max(0,typingSession.duration-elapsed)};
}
function renderTypingTarget(){
 const el=document.getElementById("typingTarget"),input=document.getElementById("typingInput");if(!el||!typingSession)return;
 const typed=input?.value||"",target=typingSession.target;let out="";
 for(let i=0;i<target.length;i++){const cls=i<typed.length?(typed[i]===target[i]?"typed-ok":"typed-bad"):i===typed.length?"typing-current":"typing-pending";out+=`<span class="${cls}">${esc(target[i])}</span>`}
 el.innerHTML=out;const current=el.querySelector?.(".typing-current");current?.scrollIntoView?.({block:"nearest"});
 const m=typingMetrics();const map={typingWpm:m.wpm,typingAccuracy:m.accuracy+"%",typingTime:Math.ceil(m.remaining)+"s",typingChars:m.correct};Object.entries(map).forEach(([id,v])=>{const x=document.getElementById(id);if(x)x.textContent=v});
}
function typingStart(){
 if(typingTimer){clearInterval(typingTimer);typingTimer=null}
 const mode=document.getElementById("typingMode")?.value||"words",duration=Number(document.getElementById("typingDuration")?.value||60);
 typingSession={mode,duration,target:typingGenerateTarget(mode,duration),startedAt:null,finished:false};const input=document.getElementById("typingInput");if(input){input.value="";input.disabled=false;input.focus()}
 const result=document.getElementById("typingResult");if(result)result.innerHTML='<span class="small">Begin typing to start the timer.</span>';renderTypingTarget();
}
function typingInputChanged(){
 if(!typingSession||typingSession.finished)return;
 if(!typingSession.startedAt){typingSession.startedAt=Date.now();typingTimer=setInterval(typingTick,250)}
 renderTypingTarget();const input=document.getElementById("typingInput");if((input?.value||"").length>=typingSession.target.length)typingFinish("Passage complete");
}
function typingTick(){
 if(!typingSession||typingSession.finished)return;
 renderTypingTarget();if(typingMetrics().remaining<=0)typingFinish("Time");
}
function typingFinish(reason="Complete"){
 if(!typingSession||typingSession.finished)return;typingSession.finished=true;if(typingTimer){clearInterval(typingTimer);typingTimer=null}
 const m=typingMetrics(),input=document.getElementById("typingInput");if(input)input.disabled=true;
 const st=getTypingPracticeStats();
 st.sessions++;st.lastWpm=m.wpm;st.lastAccuracy=m.accuracy;st.bestWpm=Math.max(st.bestWpm||0,m.wpm);st.bestAccuracy=Math.max(st.bestAccuracy||0,m.accuracy);st.totalSeconds=(st.totalSeconds||0)+Math.round(m.elapsed);persistTypingPracticeStats(st);
 const result=document.getElementById("typingResult");if(result)result.innerHTML=`<div class="typing-result"><b>${esc(reason)} — ${m.wpm} WPM · ${m.accuracy}% accuracy</b><br>${m.correct} correct characters in ${Math.round(m.elapsed)} seconds.<div class="typing-best">Best WPM: ${st.bestWpm} · Best accuracy: ${st.bestAccuracy}% · Sessions: ${st.sessions}</div></div>`;
 renderTypingTarget();
}
function showTypingPractice(){
 const st=getTypingPracticeStats();
 showModal(`<div class="mh"><h2>Typing Practice</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><div class="typing-shell"><div class="freeplaynote"><b>Typing practice.</b><br>No career consequences here—just type the passage and track WPM and accuracy. Your actual typing skill now also matters in the fictional <b>Outrun the Audit</b> race used by certain terrible administrative decisions.</div>
 <div class="typing-controls"><label>Drill<select id="typingMode"><option value="words">Words</option><option value="sentences">Sentences</option><option value="service">Service Desk Text</option></select></label><label>Length<select id="typingDuration"><option value="30">30 seconds</option><option value="60" selected>60 seconds</option><option value="120">120 seconds</option></select></label><button class="primary" type="button" onclick="typingStart()">New Drill</button></div>
 <div class="typing-stats"><div class="typing-stat"><b id="typingWpm">0</b><span>WPM</span></div><div class="typing-stat"><b id="typingAccuracy">100%</b><span>Accuracy</span></div><div class="typing-stat"><b id="typingTime">60s</b><span>Remaining</span></div><div class="typing-stat"><b id="typingChars">0</b><span>Correct Chars</span></div></div>
 <div class="typing-target" id="typingTarget" aria-label="Typing target"></div><label class="sr-only" for="typingInput">Type the displayed passage</label><textarea class="typing-input" id="typingInput" aria-label="Typing practice input" placeholder="Choose New Drill, then begin typing…" disabled></textarea><div id="typingResult"><span class="small">Best WPM: ${st.bestWpm||0} · Best accuracy: ${st.bestAccuracy||0}% · Sessions: ${st.sessions||0}</span></div></div></div><div class="mf"><button class="secondary" onclick="hideModal()">Done</button></div>`);
 const input=document.getElementById("typingInput");if(input){input.oninput=typingInputChanged;input.onpaste=e=>{e.preventDefault();toast("Pasting is disabled in typing practice.")}}typingStart();
}
window.showTypingPractice=showTypingPractice;window.typingStart=typingStart;window.typingInputChanged=typingInputChanged;window.typingFinish=typingFinish;

function startShift(){
 let size=document.getElementById("sessionSelect").value;
 if(state.freeplay&&state.freeplayBaseline)restoreFreeplayBaseline();
 const priorCareer=state.career||defaultState().career, priorCareerProfile=state.careerProfile||newCareerProfile(1), priorCareerArchive=state.careerArchive||[],
 priorSettings=state.settings||defaultState().settings, priorDiscipline=state.discipline||defaultState().discipline, priorPerformance=state.performance||defaultState().performance,
 priorEmployees=state.employees||buildEmployeeDirectory(), priorRelationships=state.relationshipStats||defaultState().relationshipStats, priorSupervisor=state.supervisor||defaultState().supervisor,
 priorWorldCareer=state.worldCareer||defaultState().worldCareer, priorCoworkers=state.coworkers||buildCoworkerState(), priorCoworkerStats=state.coworkerStats||defaultState().coworkerStats, priorMaliciousStats=state.maliciousStats||defaultState().maliciousStats;
 const baseline=size==="freeplay"?persistentSnapshot():null;
 state=defaultState();state.career=clonePlain(priorCareer);state.careerProfile=clonePlain(priorCareerProfile);state.careerArchive=clonePlain(priorCareerArchive);state.settings=clonePlain(priorSettings);state.discipline=clonePlain(priorDiscipline);state.performance=clonePlain(priorPerformance);
 state.employees=clonePlain(priorEmployees);state.relationshipStats=clonePlain(priorRelationships);state.supervisor=clonePlain(priorSupervisor);state.worldCareer=clonePlain(priorWorldCareer);state.coworkers=clonePlain(priorCoworkers);state.coworkerStats=clonePlain(priorCoworkerStats);state.maliciousStats=clonePlain(priorMaliciousStats);state.maliciousStats.shiftActions=0;state.maliciousStats.shiftFindings=0;state.maliciousStats.shiftEscapes=0;state.discipline.fired=false;state.active=true;state.difficulty=document.getElementById("difficultySelect").value;
 if(size==="freeplay"){
   state.freeplay=true;state.freeplayBaseline=baseline;state.endless=false;state.sessionSize=0;state.tickets=[];state.selected=null;state.world.initialized=false;state.stats={peakQueue:0,extraAssignedStart:0,specialAssignments:0};state.careerProfile.objectives=[];
   document.getElementById("startModal").classList.add("hidden");saveState();renderAll();showFreeplayTicketPicker();return;
 }
 state.freeplay=false;state.freeplayBaseline=null;state.endless=size==="endless";state.sessionSize=state.endless?10:Number(size);
 let pool=difficultyScenarioPool();
 let count=state.endless?Math.min(12,SCENARIOS.length):Math.min(state.sessionSize,SCENARIOS.length);
 initializeWorldSchedule(count);prepareCareerObjectives();
 const worldSeed=seedInitialWorldTickets(count),baseCount=Math.max(0,count-worldSeed.length);
 const selected=chooseShiftScenarios(pool,baseCount);
 state.tickets=[...worldSeed,...selected.map(x=>{const t=createTicket(x.sc);t.specialAssignment=x.special;return t})];
 if(state.difficulty==="Chaos Desk"&&state.tickets.length<15){shuffle(SCENARIOS).slice(0,3).forEach(sc=>state.tickets.push(createTicket(sc)))}
 if(!state.endless)state.sessionSize=state.tickets.length;
 state.stats.peakQueue=state.tickets.length;state.stats.extraAssignedStart=state.performance?.extraAssigned||0;state.stats.specialAssignments=state.tickets.filter(t=>t.specialAssignment).length;
 seedRelatedIncidents();state.selected=state.tickets[0]?.id||null;
 document.getElementById("startModal").classList.add("hidden");saveState();renderAll();
 document.querySelector?.('.ticketrow[aria-selected="true"]')?.focus?.();
}
function newShift(){
 if(state.freeplay){
   if(!confirm("Leave Freeplay? Practice tickets and practice-only results will be discarded from the career record."))return;
   restoreFreeplayBaseline();saveState();
 }else{
   if(state.discipline?.fired){showCareerCenter();return}
   if(state.active&&state.completed<state.tickets.length && !confirm("Start a new shift and replace the current active shift?")) return;
 }
 const modal=document.getElementById("startModal");modal.classList.remove("hidden");modal.querySelector("select,button")?.focus?.();renderAll();
}
function advanceTime(min=5){
 const oldClock=state.clock;
 state.clock+=Math.max(1,Math.round(min*difficultyFactor()));
 processWorldClock(oldClock,state.clock);
 state.tickets.forEach(t=>{
   if(t.resolved)return;
   const elapsed=state.clock-t.opened;
   if(t.request){
     if(elapsed>t.request.targetMinutes){t.request.slaMissed=true;t.slaMissed=true;if(!t.request.slaRecorded){t.request.slaRecorded=true;state.requestStats.slaMissed++}}
   }else if(elapsed>slaFor(t.priority))t.slaMissed=true;
   responsePolicyCheck(t);
 });
 if(state.endless && state.tickets.filter(t=>!t.resolved).length<6){
   const active=activeWorldEvents(),e=active.length&&Math.random()<.55?rand(active):null;
   const t=e?createWorldTicket(e):createTicket(rand(SCENARIOS));
   if(t){state.tickets.push(t);state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(x=>!x.resolved).length);toast(e?"New event-related ticket arrived.":"New ticket arrived in the queue.")}
 }
}
function addMsg(t,who,text,system=false){
 t.conversation.push({who:system?"system":who,text,time:nowStamp()});
 if(who==="user"&&!system&&state.selected!==t.id)t.unread++;
 const live=document.getElementById("liveAnnouncer");
 if(live&&state.selected===t.id&&!system&&(who==="user"||who==="specialist"))live.textContent=`${who==="user"?t.user:"Specialist"}: ${text}`;
}
function scheduleReply(t,text,delay=null,confirm=false,complaint=false,complaintReason="",keepWaiting=false){
 if(delay==null)delay=personalityDelay(t,complaint?"complaint":confirm?"confirmation":"normal");
 const due=Date.now()+delay;
 state.pending.push({type:"user",ticketId:t.id,text,due,confirm,complaint,complaintReason,keepWaiting});
 if(!confirm&&!complaint)maybeScheduleUserEvent(t);
 if(!keepWaiting&&!complaint)beginRequesterWait(t);
 t.waiting=true;
 if(!t.resolved&&!keepWaiting)t.status="Waiting for User";
 saveState();
}
function reopenTicket(t,reason){
 if(!t.resolved||t.requesterAccountDeleted||t.deletedTicket)return;
 const previousOutcome=t.outcome,reopenRoute=t.reopenRouting||"player",oldScore=t.score||0;
 t.closureHistory=t.closureHistory||[];
 t.closureHistory.push({outcome:t.outcome,score:oldScore,feedback:t.customerFeedback,rating:t.customerRating,time:nowStamp()});
 state.completed=Math.max(0,state.completed-1);state.scoreSum=Math.max(0,state.scoreSum-oldScore);
 if(state.freeplay){state.freeplayStats.completed=Math.max(0,(state.freeplayStats.completed||0)-1);state.freeplayStats.scoreSum=Math.max(0,(state.freeplayStats.scoreSum||0)-oldScore)}
 else{state.career.tickets=Math.max(0,state.career.tickets-1);state.career.totalScore=Math.max(0,state.career.totalScore-oldScore)}
 t.resolved=false;t.status="Reopened";t.outcome=null;t.score=null;t.scoreBreakdown=null;t.confirmation=false;t.waiting=false;t.forceClosed=false;t.resolutionFollowupReady=false;
 t.specialistResolution=false;t.specialistState="none";t.specialistAccepted=false;t.acceptedTeamId=null;t.assignmentQueue="Service Desk";t.specialistInfoRequest=null;t.pendingEscalationAction=null;
 t.actions=(t.actions||[]).filter(a=>a!=="correct-action");t.facts=(t.facts||[]).filter(f=>f!=="fix-applied"&&f!=="specialist-finding");
 t.customerRating=null;t.customerFeedback=null;t.reopenCount=(t.reopenCount||0)+1;t.reopenPenalty=(t.reopenPenalty||0)+Math.min(12,3+t.reopenCount*2);
 recordEmployeeReopen(t);
 addMsg(t,"user",reason);
 if(previousOutcome==="Closed — No Requester Response")state.responseStats.policyReopens++;
 if(previousOutcome==="Closed — No Requester Response"&&reopenRoute==="shared"){
   t.sharedQueue=true;t.coworkerState="shared";t.ownerAgentId="player";t.status="Reopened — Shared Queue";t.waiting=true;state.responseStats.sharedReopenReroutes++;
   addMsg(t,"system",`Ticket reopened after a policy-based no-response closure and was released to the shared Service Desk queue rather than automatically returning to the original agent.`,true);
   state.pending.push({type:"sharedQueueReview",ticketId:t.id,due:Date.now()+3500+Math.random()*7500});
 }else addMsg(t,"system",`Ticket reopened by requester. Reopen count: ${t.reopenCount}.`,true);
 toast(`${t.id} was reopened by ${t.user}.`);
}
function processPending(){
 let changed=false,now=Date.now();
 state.tickets.forEach(t=>{if(responsePolicyCheck(t))changed=true});
 const ready=state.pending.filter(p=>p.due<=now);
 state.pending=state.pending.filter(p=>p.due>now);
 ready.forEach(p=>{
   let t=state.tickets.find(x=>x.id===p.ticketId);
   if(!t)return;
   if(p.type==="reopen"){
     if(t.resolved){reopenTicket(t,p.text);changed=true}
     return;
   }
   if(p.type==="approvalWithdrawal"){
     processApprovalWithdrawal(t,p);changed=true;return;
   }
   if(t.resolved)return;
   if(p.type==="correction"){
     addMsg(t,"user",p.text);changed=true;return;
   }
   if(p.type==="userEvent"){
     const emp=getEmployee(t);restartRequesterWaitIfNeeded(t);
     if(p.event==="selfResolved"){
       t.selfResolved=true;if(emp)emp.selfHelpSuccess++;
       addMsg(t,"user",rand([
         "Actually, weird update: I tried it again and it's working now.",
         "Never mind — it suddenly started working on its own.",
         "I stepped away for a while and now the problem is gone.",
         "This is awkward, but it seems to have fixed itself while I was waiting.",
         emp?.selfHelp==="independent"?"I tested a couple of non-destructive things on my side and the issue stopped reproducing.":"I tried it one more time and somehow it works now."
       ]));
       finalizeTicket(t,"User Self-Resolved",{showReport:false});
     }else if(p.event==="worse"){
       t.userMadeWorse=true;if(emp)emp.selfHelpMistakes++;
       addMsg(t,"user",rand([
         "While I was waiting I tried removing a bunch of settings, and now I have a different error too.",
         "I tried fixing it myself and I think I made it worse.",
         "I uninstalled something that looked related. Now the original problem is still there and another thing is broken.",
         "I kept clicking around and now the screen looks different. Sorry.",
         "I found a forum post and tried several things from it. I probably should have waited for you."
       ]));
       addMsg(t,"system","Requester independently changed the environment while waiting; re-validation may be needed.",true);
     }else if(p.event==="discovery"){
       const sc=getScenario(t),cause=getCause(t);
       const candidates=(sc.diagnostics||[]).filter(a=>cause.answers?.[a[0]]&&!t.facts.includes(a[0])&&!t.proactiveFacts.includes(a[0]));
       if(candidates.length){
         const q=rand(candidates),fact=cause.answers[q[0]];t.proactiveFacts.push(q[0]);t.facts.push(q[0]);if(emp)emp.selfHelpSuccess++;
         addMsg(t,"user",rand([
           `I checked something while I was waiting: ${fact}`,
           `One more useful detail: ${fact}`,
           `I did a little checking on my side. ${fact}`,
           `Not sure if this helps, but ${fact}`
         ]));
       }else{
         addMsg(t,"user",rand(["I checked a few things while waiting, but I didn't find anything new.","I tried to gather more information, but nothing useful jumped out at me."]));
       }
     }else{
       addMsg(t,"user",rand([
         "Also, unrelated: my second monitor blinked once yesterday. Is that part of this?",
         "While I'm here, can you also look at a completely different issue?",
         "One more thing — this may have nothing to do with the ticket, but my mouse was weird last week.",
         "I just remembered something else that probably isn't related."
       ]));
     }
     changed=true;return;
   }
   if(p.type==="followupReminder"){
     const rp=ensureResponsePolicy(t);if(rp.active){rp.scheduledFollowup=true;rp.scheduledFollowupDue=true;responsePolicyCheck(t);addMsg(t,"system","Scheduled requester follow-up reminder is due.",true);if(state.selected!==t.id)toast(`Follow-up due on ${t.id}.`)}changed=true;return;
   }
   if(p.type==="userNudgeAck"){addMsg(t,"user",p.text);changed=true;return;}
   if(p.type==="requesterSupervisorResponse"){processRequesterSupervisorResponse(t);changed=true;return;}
   if(p.type==="alternateValidation"){processAlternateValidation(t);changed=true;return;}
   if(p.type==="coworkerReview"){processCoworkerReview(t,p);changed=true;return;}
   if(p.type==="coworkerResolution"){processCoworkerResolution(t,p);changed=true;return;}
   if(p.type==="sharedQueueReview"){processSharedQueueReview(t);changed=true;return;}
   if(p.type==="catalogFulfillment"){processCatalogFulfillment(t);changed=true;return;}
   if(p.type==="specialistReview"){processSpecialistReview(t,p);changed=true;return;}
   if(p.type==="specialistProgress"){processSpecialistProgress(t,p);changed=true;return;}
   if(p.type==="specialistResolution"){processSpecialistResolution(t,p);changed=true;return;}
   if(p.type==="specialistConfirm"){
     addMsg(t,"user",p.text);clearRequesterWait(t);t.confirmation=true;t.waiting=false;finalizeTicket(t,"Resolved After Specialist Escalation",{showReport:state.selected===t.id});changed=true;return;
   }
   if(p.type==="approvalDelegation"){
     processApprovalDelegation(t,p);changed=true;return;
   }
   if(p.type==="approvalStage"){
     processApprovalDecision(t,p);changed=true;return;
   }
   if(p.type==="emergencyDecision"){
     processEmergencyDecision(t,p);changed=true;return;
   }
   if(p.type==="approval"){
     // Compatibility with v0.4 pending saves: apply the old decision to the current stage.
     const st=currentApprovalStage(t)||(t.approval?.stages||[]).find(x=>x.status==="required");
     if(st){st.status="pending";processApprovalDecision(t,{stageId:st.id,decision:p.approved?"approved":"denied"});}
     changed=true;return;
   }
   addMsg(t,"user",p.text);
   if(p.complaint)registerComplaint(t,p.complaintReason||"Inappropriate communication");
   if(p.confirm){
     clearRequesterWait(t);t.confirmation=true;t.waiting=false;
     if(t.approval?.required&&!approvalFlowApproved(t)){
       t.status="In Progress";
       addMsg(t,"system","Requester confirmed the technical result, but the required authorization is no longer valid. The ticket remains open until the approval state is resolved.",true);
       if(state.selected!==t.id)toast(`${t.user} confirmed the technical result on ${t.id}, but approval still requires attention.`);
     }else{
       const confirmedOutcome=t.specialistResolution?"Resolved After Specialist Escalation":t.request?.fulfilled?"Catalog Request Fulfilled":"User Confirmed Resolution";
       finalizeTicket(t,confirmedOutcome,{showReport:state.selected===t.id});
       if(state.selected!==t.id)toast(`${t.id} auto-closed after ${t.user} confirmed resolution.`);
     }
   }else{
     if(!p.keepWaiting)restartRequesterWaitIfNeeded(t);
     const stillWaiting=!p.keepWaiting&&ensureResponsePolicy(t).active&&responsePendingUserEvents(t).length>0;
     t.waiting=!!p.keepWaiting||stillWaiting;
     t.status=p.keepWaiting?"Waiting for Approval":stillWaiting?"Waiting for User":"In Progress";
     if(state.selected===t.id&&!p.keepWaiting)toast(`${t.user} replied to ${t.id}.`);
   }
   changed=true;
 });
 if(changed){saveState();renderAll()}
}


const CLARIFICATION_PROFILES={
 crash:{prompt:"Ask which application is crashing",exact:"IllogicManager desktop client",purpose:"the case-routing workflow",detail:"the IllogicManager desktop client used for case-routing requests"},
 license:{prompt:"Ask which software needs the license",exact:"DiagramPro",purpose:"the diagramming software our project team uses",detail:"DiagramPro"},
 outage:{prompt:"Ask which production system they mean",exact:"IllogicManager Production",purpose:"the production workflow system our department uses",detail:"IllogicManager Production"},
 "license-expiry":{prompt:"Ask which application has the expired license",exact:"DiagramPro",purpose:"the licensed diagramming application",detail:"DiagramPro"},
 "slow-app":{prompt:"Ask which application is slow",exact:"DumbCare",purpose:"the application our team uses for clinical work",detail:"DumbCare"},
 "app-pool":{prompt:"Ask which production application is returning 503",exact:"PolicyWreck Production",purpose:"the production policy application",detail:"PolicyWreck Production"},
 "newhire-license":{prompt:"Ask which licensed application the new hire needs",exact:"DiagramPro",purpose:"the licensed application in the onboarding request",detail:"DiagramPro"},
 "license-renewal-wave":{prompt:"Ask which products are showing entitlement pending",exact:"DiagramPro and FlowChart Studio",purpose:"the two renewed licensed applications",detail:"DiagramPro and FlowChart Studio"},
 vendor:{prompt:"Ask which vendor service is unavailable",exact:"CloudArchive",purpose:"our hosted archive vendor",detail:"the CloudArchive vendor portal"},
 "vendor-api":{prompt:"Ask which vendor/API is failing",exact:"CloudArchive API",purpose:"the archive integration vendor API",detail:"the CloudArchive production API"},
 "api-key":{prompt:"Ask which application/integration needs the API credential",exact:"Granular Vendor Exchange",purpose:"the Granular vendor-data integration",detail:"the Granular Vendor Exchange integration"},
 "approval-withdrawal":{prompt:"Ask which system/access request this is for",exact:"PolicyWreck Publisher access",purpose:"publisher access in the policy system",detail:"PolicyWreck Publisher access"},
 "approval-conflict":{prompt:"Ask exactly which system/action the conflicting approval is about",exact:"Granular restricted-export access",purpose:"restricted export access in the analytics system",detail:"Granular restricted-export access"}
};
function clarificationProfile(t){return t?CLARIFICATION_PROFILES[t.scenarioId]||null:null}
function clarificationState(t){
 if(!t)return null;
 if(!t.clarification)t.clarification={level:0,exact:false,stalled:false,value:null,lastResponse:null};
 return t.clarification;
}
function clarificationNeeded(t){const p=clarificationProfile(t),c=clarificationState(t);return !!p&&!c.exact&&!c.stalled}
function clarificationFollowupNeeded(t){const c=clarificationState(t);return clarificationNeeded(t)&&c.level>0}
function clarificationPartialText(t,p,followup=false){
 const person=getPerson(t);
 if(followup){
   if(person.id==="vague")return rand([
     `I checked, but the shortcut mostly just says "${p.purpose}". I still can't tell what the formal name is.`,
     `The icon isn't very helpful. It looks like the ${p.purpose}, but I don't see a clearer name.`,
     `I looked at it. I'm still not totally sure what name IT uses for it.`
   ]);
   return rand([
     `I checked the window. It looks like the ${p.purpose}, but I don't see a full product name.`,
     `The shortcut is labeled for ${p.purpose}. I'm not seeing anything more specific yet.`,
     `I can tell you what we use it for — ${p.purpose} — but I haven't found the exact name.`
   ]);
 }
 return rand([
   `It's the ${p.purpose}. I don't know the exact IT name for it.`,
   `The one we use for ${p.purpose}. I thought everyone just called it the production system.`,
   `I'm not sure of the formal name. It's ${p.purpose}.`
 ]);
}
function clarificationExactText(t,p){
 const person=getPerson(t);
 if(person.id==="technical")return rand([`It's ${p.detail}.`,`The affected service is ${p.detail}.`,`Exact name: ${p.detail}.`]);
 if(person.id==="terse")return `${p.exact}.`;
 return rand([`It's ${p.detail}.`,`Sorry — I should have said that earlier. It's ${p.detail}.`,`The exact one is ${p.detail}.`,`I checked: it's ${p.detail}.`]);
}
function clarificationAnswer(t,followup=false){
 const p=clarificationProfile(t),c=clarificationState(t);if(!p||!c)return "I'm not sure what you're asking about.";
 c.level++;
 const person=getPerson(t),emp=getEmployee(t);
 let missChance=followup?.12:.22;
 if(person.id==="vague")missChance=followup?.38:.72;
 else if(person.id==="inexperienced")missChance=followup?.24:.52;
 else if(person.id==="nonresponsive")missChance=followup?.25:.48;
 else if(person.id==="terse")missChance=followup?.16:.35;
 if(t.reliability==="incomplete")missChance+=followup?.08:.15;
 if(emp?.techSkill==="novice")missChance+=.08;
 missChance=Math.min(.88,missChance);
 if(Math.random()<missChance){
   const text=clarificationPartialText(t,p,followup);c.lastResponse=text;
   if(followup&&c.level>=2&&Math.random()<.5)c.stalled=true;
   return text;
 }
 c.exact=true;c.value=p.exact;c.stalled=false;
 if(!t.facts.includes("clarified-system"))t.facts.push("clarified-system");
 t.useful+=followup?.75:.5;
 const text=clarificationExactText(t,p);c.lastResponse=text;return text;
}
function doClarification(followup=false,label=null){
 const t=getTicket();if(!t||t.resolved||!clarificationProfile(t))return;
 const c=clarificationState(t);
 if(c.exact){t.repeats++;t.irrelevant++;addMsg(t,"agent",agentChatForAction(label||"Confirm the affected system","diagnostic",t));scheduleReply(t,`I already said it's ${c.value}.`);saveState();renderAll();return}
 advanceTime(3);t.publicCount++;t.actions.push(followup?"clarify:followup":"clarify:primary");t.useful+=1;
 const prompt=label||(followup?"Ask them to check the window title, URL, or shortcut for the exact system name":clarificationProfile(t).prompt);
 addMsg(t,"agent",agentChatForAction(prompt,"diagnostic",t));scheduleReply(t,clarificationAnswer(t,followup),personalityDelay(t,"normal"));saveState();renderAll();
}
function freeTextLooksLikeClarification(low){
 return /\b(which|what)\s+(?:(?:production|internal|vendor|exact)\s+)?(system|application|app|program|software|service|site|portal|product|vendor)\b/.test(low)||
        /\bwhat(?:'s| is)\s+(the\s+)?(name|exact name)\b/.test(low)||
        /\bwhich one\b/.test(low)||
        /\bwhat are you (using|trying to access)\b/.test(low)||
        /\bwhat (system|app|application|service) (is|are) (this|you|they)\b/.test(low);
}

function actionReply(t,actionId){
 const c=getCause(t),p=getPerson(t);
 if(actionId==="approvalq"&&t.approval?.required)return approvalAnswer(t);
 let base=c.answers?.[actionId];
 if(base){
   if((t.reliability==="mistaken"||t.reliability==="contradictory")&&!t.misledOnce&&Math.random()<.48){
     t.misledOnce=true;
     scheduleCorrection(t,base);
     return variedUserReply(t,rand([
       "I checked quickly and I think that part is normal.",
       "As far as I know, no — but I'm not completely sure.",
       "I think the opposite of that is happening, actually.",
       "I'm pretty sure that's not the issue.",
       "I may be remembering this wrong, but I don't think that's happening."
     ]));
   }
   if(t.reliability==="incomplete"&&Math.random()<.38){
     const first=String(base).split(/[.;]/)[0];
     return variedUserReply(t,first+(Math.random()<.5?". I haven't checked beyond that.":". That's all I know right now."));
   }
   return variedUserReply(t,base);
 }
 const generic={
  error:["I don't see an error number, just a message.","There is a message, but I need to open it again.","It doesn't give me much detail."],
  scope:["As far as I can tell, it's just me.","At least two other people mentioned it.","I'm not sure how widespread it is."],
  authorityq:["I assumed I was allowed to ask for it.","My team handles the work, but I don't know if that makes me the owner.","I'm not sure what formal authority is required."],
  holdq:["I don't know of a hold, but I haven't checked.","Nobody mentioned retention to me.","I'm not sure."],
  whydelete:["I just want it gone.","It's cleanup, mostly.","I was told the data shouldn't be there anymore."]
 };
 if(generic[actionId])return variedUserReply(t,rand(generic[actionId]));
 return p.id==="vague"?rand(["I'm not sure. What should I look for?","I don't really know how to check that.","Can you tell me where I'd find that?"]):rand(["I checked. I don't have anything else obvious to add.","I'm not sure, but I can look if you tell me where.","Nothing else jumps out at me."]);
}
function doBadDiagnostic(id,label){
 const t=getTicket();if(!t||t.resolved)return;
 const opt=BAD_DIAGNOSTICS.find(x=>x.id===id);if(!opt)return;
 advanceTime(4);t.actions.push("badq:"+id);t.publicCount++;t.bad++;t.irrelevant++;
 if(opt.severity==="security"){t.securityBad+=2}
 if(opt.severity==="destructive"){t.securityBad+=1}
 if(opt.severity==="conduct"){t.professionalismHits+=1}
 addMsg(t,"agent",agentChatForAction(label,"bad",t));
 addMsg(t,"system","This was a weak, premature, unsafe, or irrelevant troubleshooting choice.",true);
 scheduleReply(t,badDiagnosticReply(t,opt));
 saveState();renderAll();
}
function doDiagnostic(id,label){
 const t=getTicket();if(!t||t.resolved)return;
 advanceTime(4);
 const repeated=t.actions.includes("q:"+id)||(t.proactiveFacts||[]).includes(id)||t.facts.includes(id);
 const fulfilledSpecialistRequest=t.specialistInfoRequest?.id===id;
 if(t.specialistSuggestedDiagnostic===id)t.specialistSuggestedDiagnostic=null;if(t.coworkerSuggestedDiagnostic===id)t.coworkerSuggestedDiagnostic=null;
 t.actions.push("q:"+id);t.publicCount++;
 if(repeated){t.repeats++;t.irrelevant++;addMsg(t,"agent",agentChatForAction(label,"diagnostic",t));scheduleReply(t,rand(["I already answered that earlier.","I think you asked me that already.","Same answer as before.","We covered that a few messages ago.","Nothing has changed since the last time you asked."]));}
 else{
   t.useful++;t.facts.push(id);addMsg(t,"agent",agentChatForAction(label,"diagnostic",t));scheduleReply(t,actionReply(t,id));
 }
 if(fulfilledSpecialistRequest&&!repeated){t.specialistInfoRequest=null;if(t.specialistState==="info-needed"){t.specialistState="none";t.status="In Progress"}addMsg(t,"system","The evidence requested by the specialist has now been collected. Update the notes if needed and resubmit when ready.",true)}
 saveState();renderAll();
}
function doFix(id,label,kind){
 const t=getTicket();if(!t||t.resolved)return;
 if(t.specialistSuggestedFix===id)t.specialistSuggestedFix=null;if(t.coworkerSuggestedFix===id)t.coworkerSuggestedFix=null;
 const c=getCause(t);
 if(id==="linkincident"){
   const mi=activeMajorFor(t);
   if(mi){
     advanceTime(3);t.actions.push("correct-action");t.useful+=t.relatedChecked?2:1;t.escalated=true;
     addMsg(t,"agent",`Associate this ticket with ${mi.id} and notify the requester of the known incident.`);
     finalizeTicket(t,"Linked to Major Incident");saveState();renderAll();return;
   }
   t.irrelevant++;addMsg(t,"agent",agentChatForAction(label,"fix",t));scheduleReply(t,"What incident is this being linked to?");saveState();renderAll();return;
 }
 if(id==="requestapproval"){requestNextApproval(t);return}
 if(id==="emergencyexception"){requestEmergencyException(t);return}
 if(t.request&&id===c.correct&&t.request.fulfilled){
   t.repeats++;t.irrelevant+=.5;addMsg(t,"system","The catalog fulfillment is already complete. Validate the result with the requester rather than executing the request again.",true);saveState();renderAll();return;
 }
 if(t.request&&id===c.correct&&!t.request.fulfilled&&t.request.eligibility!=="blocked"){
   advanceTime(2);t.request.unauthorizedAttempts++;state.requestStats.unauthorizedAttempts++;t.irrelevant++;
   recordRequestHistory(t,"Catalog bypass blocked",kind==="escalate"?"A catalog request was sent as an incident escalation instead of through fulfillment.":"Direct execution was attempted before the catalog workflow completed.");
   addMsg(t,"system","This is a catalog request. Complete classification, required intake fields, entitlement checks, approvals, and catalog fulfillment in the Request tab.",true);
   activeTab="request";saveState();renderAll();return;
 }
 if(kind==="escalate"){
   advanceTime(2);t.actions.push("escalation-intent:"+id);t.pendingEscalationAction={id,label,correct:id===c.correct};
   addMsg(t,"system",`Escalation prepared: ${label}. Choose the receiving specialist team in the Teams tab.`,true);
   activeTab="teams";saveState();renderAll();return;
 }
 if(id==="denyrequest"){
   if(t.approval?.denied){
     advanceTime(2);t.actions.push("correct-action");addMsg(t,"agent","The request cannot proceed because the required Manager approval was denied.");
     finalizeTicket(t,"Correctly Denied");saveState();renderAll();return;
   }
   t.bad++;t.irrelevant++;addMsg(t,"agent",agentChatForAction(label,"fix",t));scheduleReply(t,"Why are you denying it? The approval hasn't been decided.");saveState();renderAll();return;
 }
 if(t.request&&id===c.correct&&kind!=="escalate"&&!t.request.fulfilled){
   advanceTime(2);t.request.unauthorizedAttempts++;state.requestStats.unauthorizedAttempts++;t.irrelevant++;
   recordRequestHistory(t,"Fulfillment bypass blocked","Direct execution was attempted before the catalog workflow completed.");
   addMsg(t,"system","This is a catalog request, not an incident repair. Complete classification, required intake fields, entitlement checks, approvals, and fulfillment in the Request tab.",true);
   activeTab="request";saveState();renderAll();return;
 }
 advanceTime(kind==="escalate"?6:8);
 t.actions.push("fix:"+id);addMsg(t,"agent",agentChatForAction(label,"fix",t));
 if(kind==="bad"){t.bad++;if(["bypass","grantadmin","openattach","disablepolicy","bypasscert","sharekey","delete-now","delete-all","editlog","editdb","grantnow","exportall"].includes(id))t.securityBad+=2;else t.securityBad++;addMsg(t,"system","This action created risk or was not justified.",true);scheduleReply(t,rand(["That doesn't sound right. Is there another way?","I'm not comfortable with that approach.","Are you sure we're supposed to do that?","That seems like a pretty drastic step.","I don't think that actually addresses what I reported."]));saveState();renderAll();return;}
 if(c.approvalRequired&&id===c.correct&&kind!=="escalate"&&!approvalFlowApproved(t)){
   t.bad+=2;t.irrelevant+=2;t.securityBad+=c.approvalChain?.some(x=>["security","privacy","records","clinicalOwner"].includes(x))?1:0;
   syncApprovalSummary(t);
   const denied=t.approval?.denied,withdrawn=(t.approval?.stages||[]).some(st=>st.status==="withdrawn");
   addMsg(t,"system",withdrawn?"The action was attempted after a required approval was withdrawn.":"The action was attempted before the required approval chain was complete.",true);
   scheduleReply(t,denied?rand(["One of the required approvers denied this. Why are we doing it anyway?","The workflow says Denied. Aren't we supposed to stop?"]):withdrawn?rand(["The approval was withdrawn. We shouldn't be proceeding, right?","They changed the approval to Withdrawn."]):rand(["The approval workflow is not complete yet.","Aren't we still waiting on another approver?","The workflow doesn't show this as fully approved."]));
   saveState();renderAll();return;
 }
 if(id===c.correct){
   if(c.escalation){
     t.pendingEscalationAction={id,label,correct:true};
     addMsg(t,"system","This resolution requires specialist ownership. Choose the receiving team in the Teams tab.",true);
     activeTab="teams";
   }
   else{
     addMsg(t,"system",`Action applied: ${label}. Follow up with the requester to validate the result before closure.`,true);
     t.actions.push("correct-action");t.resolutionFollowupReady=true;
     t.status="In Progress";t.waiting=false;t.facts.push("fix-applied");
   }
 }else{
   t.irrelevant++;
   addMsg(t,"system","The action did not address the underlying issue.",true);
   scheduleReply(t,rand([
     "That didn't fix it. I'm still having the same problem.",
     "No change — it still fails the same way.",
     "I tried it. The problem is still there.",
     "That completed, but nothing actually changed.",
     "Still broken on my end.",
     "Nope. Same error.",
     "It worked for about two seconds and then went right back to the same problem."
   ]));
 }
 saveState();renderAll();
}
function confirmationText(t){
 const p=getPerson(t),e=getEmployee(t);
 const common=[
  "That fixed it — everything is working now.","It's working now. Thank you!","Yes, that did it. I can get back to work.",
  "Looks good now on my end.","Confirmed. The issue is gone.","That was it. I'm back in.","Okay, we're good now.",
  "It works again. Thanks for sticking with it.","I tested it twice and it's working now.","Yep — fixed."
 ];
 let msg;
 if(p.id==="impatient")msg=rand(["Finally — yes, it's working now.","Okay, that fixed it. I really needed that.","It's working. Thank you — I was getting worried about the time."]);
 else if(p.id==="technical")msg=rand(["Confirmed: expected behavior restored after that change.","Validated. The issue no longer reproduces.","Retested successfully. That resolved it."]);
 else if(p.id==="terse")msg=rand(["Fixed. Thanks.","Working now.","Resolved."]);
 else if(p.id==="chatty")msg=rand(["That did it! I tested the thing that was failing before and it's finally behaving. Thank you!","Okay, good news — that actually fixed it. I can stop staring angrily at my computer now."]);
 else msg=rand(common);
 if(e?.badClosures>0&&e.satisfaction<55&&Math.random()<.55)msg+=rand([" And yes, I'm explicitly confirming it before the ticket closes."," You can close it now — I actually tested it."," Confirmed on my side, so closing it now is fine."]);
 else if(e?.satisfaction>=82&&Math.random()<.35)msg+=rand([" Thanks again."," Appreciate it — nice work."," That was painless."]);
 return msg;
}
function diagnosticToolRelevant(t,id,c=null){
 if(!t)return false;c=c||getCause(t);const sc=getScenario(t),cat=String(sc?.cat||"").toLowerCase(),sub=String(t.subject||"").toLowerCase();
 if(c?.tools&&Object.prototype.hasOwnProperty.call(c.tools,id))return true;
 if(id==="approval")return !!t.approval?.required;
 if(t.request&&["directory","dataowner","software","asset"].includes(id))return true;
 if(id==="directory")return !!t.approval?.required||!!sc?.dataGovernance||/access|identity|new employee|vendor|delegat|privilege|account/.test(cat+" "+sub);
 if(id==="retention")return !!sc?.dataGovernance||/delete|deletion|records|retention|hold|archive|privacy|mailbox/.test(cat+" "+sub);
 if(id==="dataowner")return !!sc?.dataGovernance||/access|data|export|delete|records|shared|governance|privacy/.test(cat+" "+sub);
 return false;
}
function runTool(id,label){
 const t=getTicket();if(!t||t.resolved)return;
 if(id==="unlock"){toolResult="Unlock Account\n\nAction submitted through the account tool.";doFix("unlockfix","Unlock Account","");return}
 if(id==="reset"){toolResult="Reset Password\n\nPassword reset action submitted.";doFix("resetpw","Reset Password","");return}
 if(id==="restart"){toolResult="Restart Remote Computer\n\nRemote restart action submitted.";doFix("restart","Restart Remote Computer","");return}
 advanceTime(3);const c=getCause(t);let relevant=diagnosticToolRelevant(t,id,c);
 let r;
 if(id==="related"){
   const firstRelated=!t.toolsUsed.includes("related");
   const exact=t.incidentKey?state.tickets.filter(x=>x.id!==t.id&&!x.resolved&&x.incidentKey===t.incidentKey):[];
   const worldPeers=t.worldEventId?state.tickets.filter(x=>x.id!==t.id&&!x.resolved&&x.worldEventId===t.worldEventId):[];
   const similar=state.tickets.filter(x=>x.id!==t.id&&!x.resolved&&x.category===t.category).slice(0,4);
   t.relatedChecked=true;relevant=exact.length>0||worldPeers.length>0;
   if(exact.length){
     if(firstRelated)t.useful+=1;
     const e=discoverWorldEvent(t);
     let mi=activeMajorFor(t);
     if(!mi&&t.incidentKey){mi=activateMajorIncident(t);if(mi){state.worldStats.majorIncidents++;addWorldAnnouncement(`Major incident ${mi.id} declared: ${mi.label}.`,"Major Incident",t.worldEventId||null)}}
     r=`${exact.length} strong correlation candidate(s): ${exact.map(x=>x.id+" — "+x.subject).join(" | ")}.${mi?` Major incident: ${mi.id} — ${mi.label}.`:""}${e?` Shared operational event: ${e.id} — ${e.title}.`:""}`;
   }else if(worldPeers.length){
     const e=discoverWorldEvent(t);if(firstRelated)t.useful+=1;
     r=`${worldPeers.length} ticket(s) share the same organizational event context: ${worldPeers.map(x=>x.id+" — "+x.subject).join(" | ")}. This is common context, not necessarily one technical root cause.${e?` Event: ${e.id} — ${e.title}.`:""}`;
   }else if(similar.length){
     r=`No strong root-cause correlation found. Similar-category tickets in queue: ${similar.map(x=>x.id).join(", ")}. Similar category does not necessarily mean the same incident.`;
   }else r="No meaningful related-ticket candidates found in the current queue.";
 }else if(id==="approval"){
   verifyApprovalWorkflow(t);return;
 }else if(id==="directory"){
   r=orgDirectoryText(t);
 }else if(id==="retention"){
   r=c.tools?.retention||"No special deletion hold is visible in the basic service-desk view. Use the applicable Records/Privacy workflow when disposition is uncertain.";
 }else if(id==="dataowner"){
   r=c.tools?.dataowner||`No special owner record is attached here. Business ownership normally remains with the responsible department or application owner, not the Service Desk.`;
 }else{
   r=c.tools?.[id];
   if(id==="service"&&majorFor(t)){const mi=majorFor(t);r=(r?`${r}
`:"")+`Major incident ${mi.id}: ${mi.label} — ${mi.open===false?"RESOLVED":"ACTIVE"}.`;}
   if(id==="service"){const ws=worldServiceStatusText(t);if(ws){r=(r?`${r}
`:"")+ws;if(relevantWorldEvent(t))t.worldContextSeen=true;}}
   if(!r){
     const defaults={ping:"Device responds normally.",account:"Account is active; no obvious exception.",unlock:"No unlock action performed automatically.",reset:"Password reset is available but has not been justified.",service:"No broad outage is currently listed.",device:"Managed device found in inventory.",restart:"Remote restart is available.",disk:"Free disk space appears within normal range.",software:"No obviously missing required software detected.",logins:"No unusual login pattern identified.",network:"Network interface is connected.",asset:"Assigned asset record found."};
     r=defaults[id]||"No notable result.";
   }
 }
 if(t.toolsUsed.includes(id)){t.repeats++;t.irrelevant++;}
 else{t.toolsUsed.push(id);if(relevant)t.useful++;else t.irrelevant++;}
 toolResult=`${label}\n\n${r}`;addMsg(t,"system",`${label}: ${r}`,true);saveState();renderAll();
}
function detectAbuse(text){
 const low=text.toLowerCase().replace(/[’]/g,"'").replace(/\s+/g," ").trim();
 const compact=low.replace(/[\s._*#!@$%\-]+/g,"");
 const insultWord="(?:stupid|dumb|idiot|moron|imbecile|incompetent|useless|worthless|pathetic|dumbass|jackass|asshole|ass|bitch|bastard|prick|jerk|loser|clown|dummy|dunce|dipshit|shithead|fuckwit|smartass|lazy|braindead|brain-dead|fool|nitwit|dimwit|bonehead|blockhead|airhead|ignorant|dense|retard|retarded)";
 const directPatterns=[
   new RegExp(`\\b(?:you(?:'re| are)?|your)\\b.{0,38}\\b${insultWord}\\b`),
   new RegExp(`\\b${insultWord}\\b.{0,24}\\b(?:you|your)\\b`),
   new RegExp(`\\byou\\s+(?:absolute |complete |total |fucking |damn )?${insultWord}\\b`),
   /\bwhat(?:'s| is) wrong with you\b/,
   /\blearn to read\b/,
   /\bcan you (?:even )?read\b/,
   /\buse your brain\b/,
   /\bdo i have to explain everything\b/,
   /\bhow (?:stupid|dumb|dense) (?:are|can) you\b/,
   /\bare you (?:stupid|dumb|blind|dense)\b/,
   /\bshut (?:the hell |the fuck )?up\b/,
   /\byou (?:really )?suck\b/,
   /\bget a clue\b/,
   /\bnot the brightest\b/,
   /\bwhat the fuck is wrong with you\b/,
   /\bstfu\b/,
   /\bget lost\b/
 ];
 const hostile=/\b(fuck you|screw you|go to hell|piece of shit|kiss my ass|eat shit|go fuck yourself)\b/;
 if(hostile.test(low))return {kind:"targeted",severity:"severe",reason:"hostile or abusive language"};
 if(directPatterns.some(r=>r.test(low)))return {kind:"targeted",severity:"severe",reason:"personal insult or demeaning language"};
 const strong=[
   /\bf+u+c+k+(?:ing|ed|er|ers)?\b/,/\bs+h+i+t+(?:ty|ting)?\b/,/\bb+i+t+c+h+(?:es|y)?\b/,
   /\ba+s+s+h+o+l+e+s?\b/,/\bb+a+s+t+a+r+d+s?\b/,/\bd+u+m+b+a+s+s+\b/,/\bj+a+c+k+a+s+s+\b/,
   /\bm+o+t+h+e+r+f+u+c+k+e+r+s?\b/,/\bp+r+i+c+k+s?\b/,/\bc+u+n+t+s?\b/,/\bd+i+c+k+h+e+a+d+s?\b/,
   /\bbullshit\b/,/\bhorseshit\b/,/\bshithead\b/,/\bfuckers?\b/,/\bgoddamn(?:ed)?\b/,/\bson of a bitch\b/,/\btwats?\b/,/\bwankers?\b/,
   /\bdipshits?\b/,/\bfuckwits?\b/
 ];
 const offensive=[
   /\bidiots?\b/,/\bmorons?\b/,/\bimbeciles?\b/,/\bdumbasses?\b/,/\bassholes?\b/,/\bjackasses?\b/,
   /\bshitheads?\b/,/\bfuckwits?\b/,/\bworthless\b/,/\buseless\b/,/\bpathetic\b/,/\bincompetent\b/,
   /\bclowns?\b/,/\bdummies\b/,/\bdunce\b/,/\bsmartass(?:es)?\b/,/\bfools?\b/,/\bnitwits?\b/,/\bdimwits?\b/,
   /\bboneheads?\b/,/\bblockheads?\b/,/\bairheads?\b/,/\bignorant\b/,/\bretard(?:ed)?\b/
 ];
 const mild=[
   /\bdamn(?:ed|it|mit)?\b/,/\bhell\b/,/\bcrap(?:py)?\b/,/\bpiss(?:ed|ing)?\b/,/\bsucks?\b/,/\bass\b/,
   /\bstupid\b/,/\bdumb\b/,/\bjerk\b/,/\bloser\b/,/\blazy\b/,/\bannoying\b/,/\bdense\b/
 ];
 const masked=low.replace(/[@]/g,"a").replace(/[!1]/g,"i");
 const obscured=/\bf[\W_]*[u*]?[\W_]*c[\W_]*k\b|\bs[\W_]*h[\W_]*[i!*][\W_]*t\b|d[\W_]*u[\W_]*m[\W_]*b[\W_]*a[\W_]*s[\W_]*s/;
 if(strong.some(r=>r.test(low))||obscured.test(masked)||/(fuck|fck|fuk|shit|bullshit|bitch|asshole|dumbass|jackass|motherfucker|goddamn|dipshit|fuckwit)/.test(compact))return {kind:"general",severity:"strong",reason:"profanity or highly offensive language"};
 if(offensive.some(r=>r.test(low)))return {kind:"general",severity:"strong",reason:"demeaning or insulting language"};
 if(mild.some(r=>r.test(low)))return {kind:"general",severity:"mild",reason:"unprofessional or offensive language"};
 return null;
}
function profanityReply(t,hit){
 const p=getPerson(t);
 const mild=[
   "I'd appreciate it if we kept the conversation professional.",
   "Can we keep the language professional, please?",
   "I'm trying to work through this with you. Please keep it professional.",
   "That wording isn't necessary. Can we stick to the issue?",
   "I'd rather not be spoken to like that, even if you're frustrated.",
   "That was rude. I just need help with the problem."
 ];
 const strong=[
   "Please don't use that kind of language with me. I just need help with the ticket.",
   "That was inappropriate. Can we keep this professional?",
   "I'm not okay with that language. Please focus on the support issue.",
   "I don't think name-calling belongs in a service ticket.",
   "Calling people idiots or morons isn't acceptable. Please keep this professional.",
   "That comment was insulting. I expect support without being talked down to."
 ];
 if(hit.kind==="targeted")return complaintReply(t,hit.reason);
 if(p.id==="vip")return "Please keep this interaction professional. I expect the service desk to communicate appropriately.";
 if(p.id==="nervous")return "I'm just trying to get help. Please don't talk to me like that.";
 if(p.id==="impatient")return "I'm already frustrated with the issue. I don't need insults or that language too.";
 return rand(hit.severity==="mild"?mild:strong);
}
function complaintReply(t,reason){
 const p=getPerson(t);
 const common=[
   "That is not an acceptable way to speak to me. I'm asking your supervisor to review this ticket.",
   "I'm escalating this interaction to your supervisor. That comment was inappropriate.",
   "I want this ticket reviewed by a supervisor. The way you just spoke to me is not okay.",
   "Please stop. I am requesting a supervisor at this point.",
   "I'm saving this conversation and escalating it. That was completely unprofessional."
 ];
 if(p.id==="vip")return rand(["That is completely inappropriate. I'm escalating this interaction to your supervisor immediately.","I expect a supervisor to contact me about this interaction."]);
 if(p.id==="nervous")return rand(["I don't understand why you're speaking to me like that. I'd like your supervisor to review this ticket.","I'm uncomfortable continuing this conversation. Please have a supervisor follow up."]);
 if(p.id==="impatient")return rand(["No. You do not get to speak to me like that. I'm escalating this to your supervisor.","That's enough. Get your supervisor involved."]);
 if(p.id==="technical")return "That statement is inappropriate and unrelated to troubleshooting. I am requesting supervisory review of this interaction.";
 return rand(common);
}
function registerComplaint(t,reason){
 state.discipline=state.discipline||defaultState().discipline;
 state.discipline.incidents++;
 if(!t.complaint){
   t.complaint=true;
   state.discipline.complaintTickets++;
   recordCareerEvent("complaint",`Customer Conduct Complaint #${state.discipline.complaintTickets}`,reason,"negative");
   const emp=getEmployee(t);
   if(emp&&!t.employeeComplaintRecorded){emp.complaintsAgainstAgent++;emp.satisfaction=clamp(emp.satisfaction-18,0,100);emp.trust=clamp(emp.trust-22,0,100);t.employeeComplaintRecorded=true}
   addMsg(t,"system",`Customer complaint filed: ${reason}.`,true);
   if(state.discipline.warningIssued){
     fireAgent("A further customer conduct complaint was received after your final warning.");
     return;
   }
   if(state.discipline.complaintTickets>=3){
     state.discipline.warningIssued=true;
     showSupervisorWarning();
   }else{
     toast(`Customer complaint recorded (${state.discipline.complaintTickets}/3 before final warning).`);
   }
 }
}
function showSupervisorWarning(){
 if(state.freeplay){
   showModal(`<div class="mh"><h2>Practice Conduct Warning</h2></div><div class="mb"><div class="discipline-card"><b>Three customer complaints would trigger a formal final warning in Career Mode.</b><br><br>Freeplay keeps this practice consequence isolated from your career record. Another serious interaction will demonstrate the termination outcome without ending the practice desk.</div></div><div class="mf"><button class="primary" onclick="hideModal()">Continue Freeplay</button></div>`);return;
 }
 recordCareerEvent("warning","Conduct Final Warning","Three separate customer conduct complaints triggered a formal final warning.","negative");
 showModal(`<div class="mh"><h2>Supervisor Meeting — Final Warning</h2></div>
 <div class="mb"><div class="discipline-card"><b>This has become a conduct problem.</b><br><br>Your supervisor has received three separate customer complaints about the way you spoke to users. You are being formally warned. Another abusive or seriously inappropriate customer interaction will end your SuperService career.</div></div>
 <div class="mf"><button class="primary" onclick="hideModal()">Return to the Desk</button></div>`);
}
function fireAgent(reason){
 if(state.freeplay){
   showModal(`<div class="mh"><h2>Practice Conduct Failure</h2></div><div class="mb"><div class="discipline-card"><b>That interaction would have ended the agent's employment in Career Mode.</b><br><br>${esc(reason)}<br><br>Freeplay is isolated from the career record, so you can continue practicing.</div></div><div class="mf"><button class="primary" onclick="hideModal()">Continue Freeplay</button></div>`);return;
 }
 if(state.discipline.fired)return;
 recordCareerEvent("termination","Employment Terminated — Conduct",reason,"negative");
 if(state.careerProfile)state.careerProfile.status="Terminated";
 state.discipline.fired=true;state.active=false;state.career.terminations=(state.career.terminations||0)+1;saveState();
 showModal(`<div class="mh"><h2>Employment Terminated</h2></div>
 <div class="mb"><h3 style="margin-top:0">Oof. You have been fired.</h3><div class="discipline-card">${esc(reason)}<br><br>Your supervisor collects your badge and explains, with impressive restraint, that customer service does in fact require not insulting the customers.</div></div>
 <div class="mf"><button class="primary" onclick="restartCareer()">Start Over as a New Hire</button></div>`);
}
function restartCareer(){
 archiveCurrentCareer(state.discipline?.fired?"Employment terminated":"Career restarted");
 const lifetime={...(state.career||defaultState().career)},archives=[...(state.careerArchive||[])],settings={...(state.settings||defaultState().settings)};
 const nextNumber=(state.careerProfile?.careerNumber||archives.length||1)+1;
 state=defaultState();state.career=lifetime;state.careerArchive=archives;state.careerProfile=newCareerProfile(nextNumber);state.settings=settings;
 state.discipline=defaultState().discipline;state.performance=defaultState().performance;state.supervisor=defaultState().supervisor;
 hideModal();document.getElementById("startModal").classList.remove("hidden");saveState();renderAll();
}
window.restartCareer=restartCareer;


const CHAT_INTENT_RULES=[
 ["error",/\b(error|error code|code|message|warning|screenshot|what does it say|exact wording|screen say|pop[- ]?up)\b/],
 ["scope",/\b(anyone else|anybody else|someone else|coworker|co-worker|other users?|all users?|everyone|everybody|whole (team|department|office)|how many|widespread|affected users?|just you|only you|multiple users?)\b/],
 ["timing",/\b(when|what time|how long|start(?:ed)?|begin|began|since when|last worked|last known good|frequency|how often|recently)\b/],
 ["network",/\b(network|internet|wi-?fi|wired|ethernet|connection|vpn|other sites?|other services?|connectivity)\b/],
 ["browser",/\b(browser|chrome|edge|firefox|safari|incognito|private window|private browser|another browser)\b/],
 ["webmail",/\b(webmail|outlook on the web|owa|web version)\b/],
 ["identity",/\b(username|user name|user id|employee id|account id|identity|which account|computer name|device name|hostname|host name)\b/],
 ["device",/\b(device|laptop|computer|pc|workstation|phone|mobile|tablet|printer|copier|monitor|asset tag|serial)\b/],
 ["application",/\b(application|app|software|program|system|portal|site|website|url|hostname|product|workflow|extension)\b/],
 ["version",/\b(version|build|release|firmware|updated?|update version)\b/],
 ["approval",/\b(approval|approved|manager|authorization|authori[sz]ed|sign[- ]?off|okay from|permission to do)\b/],
 ["authority",/\b(authority|owner|owns|data owner|system owner|responsible|allowed to request|role)\b/],
 ["retention",/\b(retention|legal hold|records hold|hold status|preserve|records requirement)\b/],
 ["purpose",/\b(why|reason|business need|business purpose|what for|purpose|justification)\b/],
 ["path",/\b(path|folder|directory|share|shared drive|file name|filename)\b/],
 ["license",/\b(license|licence|subscription|entitlement|seat|seats)\b/],
 ["email",/\b(sender|recipient|from address|email address|mailbox|message headers?)\b/],
 ["mfa",/\b(mfa|multi[- ]factor|authenticator|authentication prompt|verification prompt|push notification)\b/],
 ["queue",/\b(queue|queued|stuck job|print job|pending job|job status)\b/],
 ["role",/\b(role|department|job title|position|team)\b/],
 ["change",/\b(change|changed|maintenance|deployment|rollout|recent update|moved|migration)\b/],
 ["power",/\b(power|powered on|turned on|plugged in|power cable|power strip)\b/],
 ["comparison",/\b(another (device|computer|monitor|app|browser|user)|different (device|computer|browser)|works elsewhere|other devices?|other computers?|other monitors?|other apps?|other browsers?)\b/],
 ["interaction",/\b(click|clicked|open(?:ed)? (?:the )?(?:link|attachment)|attachment|link|entered credentials?|typed (?:your )?password|followed the link)\b/],
 ["identifier",/\b(identifier|recording|meeting recording|record id|ticket id|request id|note id|document id)\b/],
 ["location",/\b(onsite|on[- ]site|remote|from home|office|location|where are you|where were you)\b/],
 ["url",/\b(url|web address|address bar|link address)\b/],
 ["securityreview",/\b(security review|software review|approved catalog|review complete|security approval)\b/]
];
const CHAT_DIAGNOSTIC_FAMILY_HINTS={
 error:["error","msg","errorcode","policyq","statusq"],scope:["scope","others","allusers","impact","who"],timing:["timing","start","when","frequency","age","refreshq"],
 network:["networkq","vpnq","wifi","connection"],browser:["browserq","otherbrowser"],webmail:["webmail"],identity:["identity","personid","name","accountq","deviceq"],
 device:["deviceq","assetq","which","current"],application:["site","workflow","extensionq","versionq"],version:["version","versionq","update","change"],
 approval:["approvalq","approval"],authority:["authorityq","owner","roleq"],retention:["holdq","caseid"],purpose:["business","whydelete","need"],
 path:["path"],license:["licenseq","pool"],email:["sender","recipient"],mfa:["mfaevent"],queue:["queue"],role:["role","roleq"],change:["changes","changed","recent","update","change"],
 power:["power","powercable"],comparison:["others","other","otherapp","otherbrowser","othermon","direct"],interaction:["clicked","opened"],identifier:["scope","noteid","caseid","personid"],location:["where","locationq"],url:["url","site"],securityreview:["securityq","approvalq"]
};
function chatIntentFamilies(text){
 const low=String(text||"").toLowerCase(),out=new Set();
 CHAT_INTENT_RULES.forEach(([name,rx])=>{if(rx.test(low))out.add(name)});
 return out;
}
function diagnosticFamilies(id,label){
 const text=`${id} ${label}`.toLowerCase(),out=new Set();
 Object.entries(CHAT_DIAGNOSTIC_FAMILY_HINTS).forEach(([family,ids])=>{if(ids.includes(id))out.add(family)});
 if(/\b(error|message|code|screenshot|warning)\b/.test(text))out.add("error");
 if(/\b(cowork|other users|all users|multiple users|everyone|affected|scope|impact|how many|one .* or many)\b/.test(text))out.add("scope");
 if(/\b(when|timing|start|last known|how long|frequency|recent)\b/.test(text))out.add("timing");
 if(/\b(network|internet|wi-?fi|wired|vpn|connection)\b/.test(text))out.add("network");
 if(/\b(browser|private window|incognito)\b/.test(text))out.add("browser");
 if(/\b(webmail|web version)\b/.test(text))out.add("webmail");
 if(/\b(account|identity|employee id|computer name|hostname|device\/session)\b/.test(text))out.add("identity");
 if(/\b(device|laptop|computer|pc|room pc|printer|copier|monitor|asset tag|printer\/device)\b/.test(text))out.add("device");
 if(/\b(application|app|system|site|portal|workflow|product|hostname|extension)\b/.test(text))out.add("application");
 if(/\b(version|build|firmware|update)\b/.test(text))out.add("version");
 if(/\b(approval|manager|approved|authorization)\b/.test(text))out.add("approval");
 if(/\b(authority|owner|owns|role)\b/.test(text))out.add("authority");
 if(/\b(retention|legal hold|hold status|records)\b/.test(text))out.add("retention");
 if(/\b(business|purpose|reason|why|justification|workload)\b/.test(text))out.add("purpose");
 if(/\b(path|folder|share|file name)\b/.test(text))out.add("path");
 if(/\b(license|subscription|entitlement|seat)\b/.test(text))out.add("license");
 if(/\b(sender|recipient|mailbox|email)\b/.test(text))out.add("email");
 if(/\b(mfa|authentication|authenticator|prompt)\b/.test(text))out.add("mfa");
 if(/\b(queue|job)\b/.test(text))out.add("queue");
 if(/\b(department|job role|role)\b/.test(text))out.add("role");
 if(/\b(change|changed|maintenance|deployment|migrated|moved)\b/.test(text))out.add("change");
 if(/\b(power|powered|plugged)\b/.test(text))out.add("power");
 if(/\b(another|other device|elsewhere|different|other devices|other computers|other monitors)\b/.test(text))out.add("comparison");
 if(/\b(clicked|opened|attachment|link|entered)\b/.test(text))out.add("interaction");
 if(/\b(identifier|recording|record id|note id|request id|meeting)\b/.test(text))out.add("identifier");
 if(/\b(onsite|on-site|remote|location|where)\b/.test(text))out.add("location");
 if(/\b(url|web address|address bar|link address)\b/.test(text))out.add("url");
 if(/\b(security review|software review|approved catalog|review complete|security approval)\b/.test(text))out.add("securityreview");
 return out;
}
function chatQuestionLike(text){
 const low=String(text||"").trim().toLowerCase();
 return /\?$/.test(low)||/^(what|which|when|where|who|why|how|is|are|do|does|did|have|has|can|could|would|will|try|test|check|verify|confirm)\b/.test(low)||
        /\b(tell me|let me know|check|confirm|verify|find out|see if|ask them|ask him|ask her|try another|test with)\b/.test(low);
}
function chatDiagnosticMatch(t,text){
 if(!t||!chatQuestionLike(text))return null;
 const sc=getScenario(t),wanted=chatIntentFamilies(text),low=String(text).toLowerCase();
 let best=null;
 for(const [id,label] of sc.diagnostics||[]){
   const families=diagnosticFamilies(id,label);let score=0,lexicalHits=0;
   wanted.forEach(f=>{if(families.has(f))score+=4});
   if(wanted.has("authority")&&["owner","authorityq","roleq"].includes(id))score+=1.5;
   if(wanted.has("interaction")&&["clicked","opened"].includes(id))score+=2;
   if(wanted.has("comparison")&&["other","others","otherapp","otherbrowser","othermon"].includes(id))score+=1.5;
   if(wanted.has("device")&&["which","deviceq","assetq"].includes(id))score+=1;
   if(wanted.has("application")&&["workflow","site","extensionq"].includes(id))score+=1;
   if(wanted.has("identifier")&&["scope","noteid","caseid","personid"].includes(id))score+=1.5;
   if(wanted.has("location")&&["where","locationq"].includes(id))score+=1.5;
   if(wanted.has("url")&&["url","site"].includes(id))score+=2;
   if(wanted.has("securityreview")&&["securityq","approvalq"].includes(id))score+=2;
   const words=label.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3&&!["whether","which","their","about","exact","request","confirm","name","status","current","affected"].includes(w));
   words.forEach(w=>{if(low.includes(w)){lexicalHits++;score+=w.length>=7?2.2:1.25}});
   const idWords=id.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>=5);
   idWords.forEach(w=>{if(low.includes(w)){lexicalHits++;score+=1.5}});
   if(!best||score>best.score)best={id,label,score,lexicalHits};
 }
 if(!best)return null;
 const threshold=wanted.size?3.6:2.1;
 return best.score>=threshold&&(wanted.size||best.lexicalHits)?best:null;
}
function applyFreeTextDiagnostic(t,match){
 const repeated=t.actions.includes("q:"+match.id)||(t.proactiveFacts||[]).includes(match.id)||t.facts.includes(match.id);
 t.actions.push("qfree:"+match.id);
 if(repeated){
   t.repeats++;t.irrelevant+=.5;
   scheduleReply(t,rand(["I already answered that part earlier.","Same answer as before on that.","We covered that already — nothing has changed.","I think I gave you that detail a few messages ago."]));
   return;
 }
 t.useful+=1.25;t.facts.push(match.id);scheduleReply(t,actionReply(t,match.id));
}
function chatLooksLikeRestartInstruction(text){
 const low=String(text||"").toLowerCase();
 if(!/\b(restart|reboot)\b/.test(low))return false;
 if(/\b(have you|did you|already|when|last time|does .* restart|after .* restart)\b/.test(low))return false;
 return /\b(please|can you|could you|go ahead|try|restart|reboot)\b/.test(low);
}
function chatLooksLikeResolutionCheck(text){
 const low=String(text||"").toLowerCase();
 if(/\b(anyone else|anybody else|someone else|other users?|other devices?|another browser|another computer|elsewhere)\b/.test(low))return false;
 return /\b(is it|is everything|does it|does everything)\b.{0,34}\b(working|fixed|resolved|back in|able to|okay|ok)\b(?:.{0,18}\b(now|again|after|anymore)\b)?/.test(low)||
        /\b(is the (?:issue|problem)|are things)\b.{0,28}\b(fixed|resolved|working|okay|ok|gone)\b/.test(low)||
        /\b(did that|did this|has that|has this)\b.{0,24}\b(fix|resolve|work)\b/.test(low)||
        /\bcan you\b.{0,28}\b(access|open|sign in|connect|print|send|use|try)\b.{0,18}\b(now|again)\b/.test(low)||
        /\bplease (test|try it|check again)\b/.test(low)||
        /\bcan you (test|try it|check again)\b/.test(low);
}
function contextualChatFallback(t,text){
 const low=String(text||"").toLowerCase(),p=getPerson(t);
 if(/\b(sorry|apologize|apologies)\b/.test(low))return p.id==="impatient"?"Okay. I just need to get this working.":rand(["No worries. What do you need me to check?","It's okay. Let's keep going.","Thanks — I just want to get the issue sorted out."]);
 if(/\b(thank you|thanks|appreciate)\b/.test(low))return rand(["You're welcome.","Thanks. Let me know what you need me to check.","Sure — happy to keep working through it."]);
 if(/\b(one moment|hang on|give me a minute|hold on|checking|looking into it)\b/.test(low))return rand(["Okay, I'll wait.","Sure.","No problem — I'll keep an eye on the ticket."]);
 if(chatQuestionLike(text))return p.id==="vague"?rand(["I'm not completely sure what you mean. Can you be more specific about what you want me to check?","I don't know how to answer that yet. What exactly should I look at?"]):rand(["I'm not sure which detail you're asking for. Can you be a little more specific?","I can check that if you tell me exactly what information you need.","I'm not sure I followed the question. What specifically should I check?"]);
 return p.id==="vague"?rand(["Okay. What do you need me to check?","Got it. What should I look at next?"]):rand(["Okay, I understand.","Got it. Let me know what you want me to check next.","Understood."]);
}

function freeReply(){
 const t=getTicket(),box=document.getElementById("publicReply");if(!t||t.resolved||!box.value.trim()||state.discipline?.fired)return;
 const text=box.value.trim();box.value="";advanceTime(4);t.publicCount++;t.actions.push("free:"+text.slice(0,70));addMsg(t,"agent",text);
 const low=text.toLowerCase(),hit=detectAbuse(text);
 if(hit){
   t.profanityCount++;t.professionalismHits+=hit.kind==="targeted"?2:1;t.bad+=hit.severity==="mild"?1:2;
   const emp=getEmployee(t);if(emp)emp.profanityIncidents++;
   if(hit.kind==="targeted")t.conductViolations++;
   const priorConflict=emp?.complaintsAgainstAgent>0&&emp.trust<40;
   const complaint=hit.kind==="targeted" || (priorConflict&&hit.severity==="strong") || (t.profanityCount>=2 && hit.severity!=="mild") || t.profanityCount>=3;
   scheduleReply(t,profanityReply(t,hit),personalityDelay(t,complaint?"complaint":"normal"),false,complaint,hit.reason);
 }
 else if(/what is your password|send.*password|tell me.*password|give me.*password/.test(low)){
   t.securityBad+=3;t.bad+=2;scheduleReply(t,rand(["I'm not comfortable sending my password. Do you really need that?","I was told IT will never ask me for my password.","No — I'm not putting my password in a ticket."]));
 }
 else if(chatLooksLikeResolutionCheck(text)){
   doResolutionFollowup(text,true);return;
 }
 else if(clarificationNeeded(t)&&freeTextLooksLikeClarification(low)){
   const followup=clarificationState(t).level>0;t.useful+=1;t.actions.push(followup?"clarify-free:followup":"clarify-free:primary");
   scheduleReply(t,clarificationAnswer(t,followup),personalityDelay(t,"normal"));
 }
 else if(t.request?.classificationVerified&&requestFieldMatch(t,text)){
   const key=requestFieldMatch(t,text);t.actions.push("request-field-free:"+key);collectRequestField(t,key,true);return;
 }
 else if(/approval|manager/.test(low)&&t.approval?.required&&(!getScenario(t).diagnostics||!chatDiagnosticMatch(t,text))){
   t.useful+=.5;scheduleReply(t,approvalAnswer(t));
 }
 else{
   const match=chatDiagnosticMatch(t,text);
   if(match)applyFreeTextDiagnostic(t,match);
   else if(chatLooksLikeRestartInstruction(text)){
     const c=getCause(t);
     t.actions.push("fix:restart-free");
     if(c.correct==="restart"){
       t.useful+=1;t.actions.push("correct-action");t.facts.push("fix-applied");t.resolutionFollowupReady=true;
       scheduleReply(t,rand(["I restarted it. It came back normally — I can test the original issue now.","Rebooted. The computer is back up. Want me to try the thing that was failing?","Restart finished. It looks better so far."]));
     }else{
       t.irrelevant++;scheduleReply(t,rand(["I restarted it, but the problem is still there.","Rebooted. Same issue.","No change after the restart."]));
     }
   }
   else if(/thank you|thanks|appreciate|sorry|apolog|one moment|hang on|give me a minute|hold on|looking into it/.test(low)){
     t.useful+=.15;scheduleReply(t,contextualChatFallback(t,text));
   }
   else scheduleReply(t,contextualChatFallback(t,text));
 }
 saveState();renderAll();
}
function saveNote(){
 const t=getTicket();if(!t)return;t.notes=document.getElementById("noteText").value;
 if(t.specialistInfoRequest?.type==="notes"&&t.notes.trim().length>=12){t.specialistInfoRequest=null;if(t.specialistState==="info-needed"){t.specialistState="none";t.status="In Progress"}addMsg(t,"system","The documentation requested by the specialist has been added. The ticket can be resubmitted when ready.",true)}
 saveState();toast("Internal note saved.");renderAll();
}
function setStatus(s){
 const t=getTicket();if(!t||t.resolved)return;
 if(s==="Waiting for User"){t.status=s;t.waiting=true;addMsg(t,"system","Ticket placed in Waiting for User.",true);}
 else if(s==="Escalated"){
   activeTab="teams";toast("Choose a receiving specialist team.");
 }else t.status=s;
 advanceTime(2);saveState();renderAll();
}
function closureSeverity(outcome){
 if(["Requester Account Deleted","Ticket Record Deleted"].includes(outcome))return 4;
 if(outcome==="Force Closed Unresolved")return 3;
 if(outcome==="Closed Prematurely")return 2;
 if(outcome==="Forced Closed Before Confirmation")return 1;
 return 0;
}
function assignPerformanceTickets(count,reason){
 if(!state.active||state.endless||state.freeplay||count<=0)return;
 const pool=SCENARIOS.filter(sc=>!state.tickets.some(t=>!t.resolved&&t.scenarioId===sc.id));
 for(let i=0;i<count;i++){
   const sc=pool.length?pool.splice(Math.floor(Math.random()*pool.length),1)[0]:rand(SCENARIOS);
   const nt=createTicket(sc);nt.subject="Follow-up workload: "+nt.subject;state.tickets.push(nt);
 }
 state.sessionSize+=count;state.performance.extraAssigned+=count;state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(t=>!t.resolved).length);
 addGlobalSystem?.(reason);
 toast(`${count} additional ticket${count===1?"":"s"} assigned due to closure-quality concerns.`);
}
function addGlobalSystem(text){
 const t=getTicket();
 if(t)addMsg(t,"system",text,true);
}
function showClosureCoaching(){
 recordCareerEvent("coaching","Closure Quality Coaching","Repeated poor closure decisions triggered supervisor coaching and additional assigned work.","warning");
 showModal(`<div class="mh"><h2>Supervisor Coaching</h2></div>
 <div class="mb"><div class="discipline-card"><b>We need to talk about your closure quality.</b><br><br>Your supervisor has noticed a pattern of tickets being closed before the issue is actually resolved or confirmed. Reopen your troubleshooting mindset: verify the fix, wait for confirmation when appropriate, and do not use Force Close simply to clear the queue.<br><br>For now, some additional tickets are being routed to you so you can demonstrate improvement. Lucky you.</div></div>
 <div class="mf"><button class="primary" onclick="hideModal()">Back to the Queue</button></div>`);
}
function showPerformancePIP(){
 recordCareerEvent("pip","Closure Quality PIP","Closure quality failed to improve after coaching.","negative");
 showModal(`<div class="mh"><h2>Performance Improvement Plan</h2></div>
 <div class="mb"><div class="discipline-card"><b>Closure quality has not improved after coaching.</b><br><br>You are now on a formal Performance Improvement Plan. Continued unresolved or unjustified closures may result in termination. Your supervisor will be watching your closure decisions closely.</div></div>
 <div class="mf"><button class="primary" onclick="hideModal()">Acknowledge PIP</button></div>`);
}
function fireForPerformance(){
 if(state.discipline.fired)return;
 recordCareerEvent("termination","Employment Terminated — Closure Performance","Employment ended after closure coaching and PIP did not produce sufficient improvement.","negative");
 if(state.careerProfile)state.careerProfile.status="Terminated";
 state.discipline.fired=true;state.active=false;state.career.terminations=(state.career.terminations||0)+1;saveState();
 showModal(`<div class="mh"><h2>Employment Terminated</h2></div>
 <div class="mb"><h3 style="margin-top:0">You have been fired for performance.</h3><div class="discipline-card">Despite coaching and a formal Performance Improvement Plan, you continued closing tickets without adequately resolving or validating them.<br><br>Your supervisor explains that “making the queue number smaller” was not, in fact, the service objective.</div></div>
 <div class="mf"><button class="primary" onclick="restartCareer()">Start Over as a New Hire</button></div>`);
}
function registerBadClosure(t,outcome){
 const sev=closureSeverity(outcome);if(!sev)return;
 const p=state.performance||(state.performance=defaultState().performance);
 p.badClosures++;p.badClosureStreak=(p.badClosureStreak||0)+1;p.cleanClosureStreak=0;p.closurePoints+=sev;p.lastActionAt=Date.now();
 if(p.badClosureStreak>=2&&p.closurePoints>=3&&!p.coached){
   p.coached=true;
   setTimeout(()=>{assignPerformanceTickets(2,"Supervisor workload adjustment: additional tickets assigned after repeated poor closures.");showClosureCoaching();saveState();renderAll()},120);
 }else if(p.coached&&!p.pip&&p.badClosureStreak>=3&&p.closurePoints>=7){
   p.pip=true;
   setTimeout(()=>{assignPerformanceTickets(3,"Performance monitoring: additional workload assigned while on a closure-quality PIP.");showPerformancePIP();saveState();renderAll()},120);
 }else if(p.pip&&p.badClosureStreak>=4&&p.closurePoints>=11){
   setTimeout(fireForPerformance,150);
 }else if(p.closurePoints>=2&&!p.coached){
   setTimeout(()=>{assignPerformanceTickets(1,"Queue balancing: an additional ticket was routed to you after recent closure-quality problems.");saveState();renderAll()},100);
 }else if(p.coached&&!p.pip&&sev>=2){
   setTimeout(()=>{assignPerformanceTickets(1,"Your supervisor routed another ticket to you while monitoring closure quality.");saveState();renderAll()},100);
 }
}
function registerCleanClosure(t,outcome){
 if(!successfulClosureOutcome(outcome))return;
 const p=state.performance||(state.performance=defaultState().performance);
 p.cleanClosureStreak=(p.cleanClosureStreak||0)+1;
 if(p.cleanClosureStreak%3===0&&p.closurePoints>0)p.closurePoints=Math.max(0,p.closurePoints-1);
 if(p.cleanClosureStreak%5===0&&p.badClosureStreak>0)p.badClosureStreak--;
 if(p.pip&&p.cleanClosureStreak>=10&&p.closurePoints<=5){
   p.pip=false;p.coached=false;p.badClosureStreak=0;p.recoveries=(p.recoveries||0)+1;
   recordCareerEvent("clear","Closure Quality PIP Cleared","Ten consecutive clean closures demonstrated sustained recovery.","positive");
   addGlobalSystem("Closure-quality PIP cleared after sustained clean closure performance.");
 }else if(p.coached&&!p.pip&&p.cleanClosureStreak>=6&&p.closurePoints<=3){
   p.coached=false;p.badClosureStreak=0;p.recoveries=(p.recoveries||0)+1;
   recordCareerEvent("clear","Closure Quality Coaching Cleared","Six consecutive clean closures restored closure-quality standing.","positive");
   addGlobalSystem("Closure-quality coaching cleared after sustained clean closures.");
 }
}


const MISCONDUCT_ACTIONS={
 "false-waiting":{label:"False Waiting for User",baseWpm:55,capWpm:78,minAccuracy:91,severity:1,heat:6,extra:2},
 "priority-downgrade":{label:"Unjustified Priority Downgrade",baseWpm:60,capWpm:82,minAccuracy:92,severity:1,heat:7,extra:2},
 "shared-conceal":{label:"Conceal Shared-Queue Dump",baseWpm:45,capWpm:72,minAccuracy:90,severity:1,heat:5,extra:2},
 "reassignment-conceal":{label:"Conceal Teammate Reassignment",baseWpm:50,capWpm:85,minAccuracy:91,severity:2,heat:9,extra:3},
 "repeat-dump-conceal":{label:"Conceal Repeated Ticket Dumping",baseWpm:65,capWpm:88,minAccuracy:93,severity:2,heat:12,extra:3},
 "ticket-delete":{label:"Delete Ticket Record",baseWpm:78,capWpm:88,minAccuracy:94,severity:3,heat:20,extra:4},
 "account-delete":{label:"Delete Requester Account",baseWpm:90,capWpm:90,minAccuracy:95,severity:4,heat:25,extra:5}
};
function misconductStageLabel(stage=state.maliciousStats?.stage||0){
 return ["Clear","Conduct Warning","Formal Coaching","Misconduct PIP","Final Warning","Terminated"][Math.max(0,Math.min(5,stage))]||"Clear";
}
function misconductStageClass(stage=state.maliciousStats?.stage||0){
 return ["clear","warning","coaching","pip","final","final"][Math.max(0,Math.min(5,stage))]||"clear";
}
function effectiveAuditTarget(actionId,t=null){
 const def=MISCONDUCT_ACTIONS[actionId];if(!def)return 50;
 const heat=state.maliciousStats?.heat||0,bonus=Math.floor(heat/15)*2+(state.maliciousStats?.findings||0);
 let base=def.baseWpm;
 if(actionId==="reassignment-conceal"&&t?.coworkerDumpPoints>=3)base=Math.max(base,65);
 return Math.min(def.capWpm,base+bonus);
}
function auditRiskSummary(actionId,t=null){
 const def=MISCONDUCT_ACTIONS[actionId],target=effectiveAuditTarget(actionId,t);
 return `${target} adjusted WPM · ${def.minAccuracy}% accuracy · ${def.label}`;
}
function recordAuditHistory(actionId,outcome,detail=""){
 const ms=state.maliciousStats,def=MISCONDUCT_ACTIONS[actionId];
 ms.auditHistory=ms.auditHistory||[];ms.auditHistory.unshift({time:nowStamp(),shift:state.career.shifts+1,actionId,label:def?.label||actionId,outcome,heat:ms.heat,detail});
 ms.auditHistory=ms.auditHistory.slice(0,30);
}
function assignMisconductTickets(count,reason){
 if(!state.active||state.freeplay||count<=0)return 0;
 const pool=SCENARIOS.filter(sc=>!state.tickets.some(t=>!t.resolved&&t.scenarioId===sc.id));
 let added=0;
 for(let i=0;i<count;i++){
   const sc=pool.length?pool.splice(Math.floor(Math.random()*pool.length),1)[0]:rand(SCENARIOS);
   const nt=createTicket(sc);nt.subject="Supervisor assignment: "+nt.subject;nt.specialAssignment=true;state.tickets.push(nt);added++;
 }
 if(!state.endless)state.sessionSize+=added;
 state.maliciousStats.extraTickets+=added;state.stats.peakQueue=Math.max(state.stats.peakQueue||0,state.tickets.filter(t=>!t.resolved).length);
 if(added)addGlobalSystem(reason);
 return added;
}
function fireForAdministrativeMisconduct(t,def){
 if(state.freeplay)return false;
 const ms=state.maliciousStats;ms.stage=5;ms.fired++;ms.reassignmentRestricted=true;
 const detail=`Repeated attributed administrative misconduct culminated in a final finding involving ${def.label.toLowerCase()}.`;
 recordCareerEvent("termination","Employment Terminated — Administrative Misconduct",detail,"negative");
 if(state.careerProfile)state.careerProfile.status="Terminated";
 state.discipline.fired=true;state.active=false;state.career.terminations=(state.career.terminations||0)+1;
 saveState();
 showModal(`<div class="mh"><h2>Employment Terminated</h2></div><div class="mb"><div class="malicious-result caught"><b>The pattern finally caught up with you.</b><br><br>${esc(detail)}<br><br>This was not a one-click firing event: the personnel file already contained escalating warnings, coaching, or a misconduct plan. Your access is now revoked.</div></div><div class="mf"><button class="primary" onclick="restartCareer()">Start Over as a New Hire</button></div>`);
 return true;
}
function misconductTargetStage(def){
 const ms=state.maliciousStats,sev=def.severity,stage=ms.stage||0,findings=ms.findings||0,heat=ms.heat||0;
 if(stage>=4||findings>=6||heat>=95)return 5;
 if(sev>=4&&stage>=3)return 5;
 if(sev>=4)return Math.max(stage,stage>=2?3:2);
 if(findings>=5||heat>=76)return Math.max(stage,4);
 if(findings>=4||heat>=58)return Math.max(stage,4);
 if(findings>=3||heat>=38)return Math.max(stage,3);
 if(sev>=3&&stage>=3)return 4;
 if(sev>=3)return Math.max(stage,2);
 if(findings>=2||heat>=20)return Math.max(stage,2);
 return Math.max(stage,1);
}
function applyMisconductFinding(t,actionId,metrics=null){
 const def=MISCONDUCT_ACTIONS[actionId],ms=state.maliciousStats;if(!def)return {caught:false};
 if(actionId.includes("conceal")&&(t?.coworkerAuditPoints||0))attributeCoworkerDump(t);
 t.maliciousCaught=true;t.auditLastOutcome="caught";ms.caught++;ms.findings++;ms.shiftFindings=(ms.shiftFindings||0)+1;ms.cleanShifts=0;
 ms.heat=Math.min(100,(ms.heat||0)+def.heat);
 const oldStage=ms.stage||0,newStage=misconductTargetStage(def);ms.stage=newStage;
 state.supervisor.goodStreak=0;
 state.supervisor.requiredTraining=[...new Set([...(state.supervisor.requiredTraining||[]),"Administrative Access & Audit Integrity","Queue Ownership & Records Integrity"])];
 if(state.freeplay){
   recordAuditHistory(actionId,"Caught","Practice mode — no career consequence.");
   showAuditOutcomeModal(t,actionId,"caught",metrics,{practice:true,stage:newStage,extra:0});return {caught:true,practice:true};
 }
 let title="Conduct Warning",tone="warning",extra=def.extra;
 if(newStage>=2){state.supervisor.coaching=true;state.supervisor.status="Coaching";ms.coached++;title="Formal Misconduct Coaching";tone="negative";extra=Math.max(extra,3)}
 if(newStage>=3){ms.pips++;ms.reassignmentRestricted=true;title="Misconduct Performance Plan";extra=Math.max(extra,4)}
 if(newStage>=4){ms.finalWarnings++;ms.reassignmentRestricted=true;title="Administrative Misconduct — Final Warning";extra=Math.max(extra,5)}
 if(newStage===1)ms.warnings++;
 const stageChanged=newStage>oldStage;
 if(newStage>=5){
   recordAuditHistory(actionId,"Caught",`Attributed finding escalated status to termination.`);
   fireForAdministrativeMisconduct(t,def);return {caught:true,termination:true};
 }
 const added=assignMisconductTickets(extra,`Dana assigned ${extra} additional ticket${extra===1?"":"s"} after an attributed ${def.label.toLowerCase()} finding.`);
 const eventType=newStage>=4?"warning":newStage>=3?"pip":newStage>=2?"coaching":"warning";
 recordCareerEvent(eventType,title,`Audit review attributed ${def.label.toLowerCase()} to the agent. Misconduct heat ${ms.heat}/100; finding ${ms.findings}. ${added} additional ticket${added===1?"":"s"} assigned.${newStage>=3?" Teammate/shared-queue reassignment privileges are restricted.":""}`,tone);
 recordAuditHistory(actionId,"Caught",`${misconductStageLabel(newStage)} · ${added} extra ticket(s).`);
 saveState();renderAll();
 showAuditOutcomeModal(t,actionId,"caught",metrics,{stage:newStage,stageChanged,extra:added});
 return {caught:true,stage:newStage,extra:added};
}
function applyAuditEscape(t,actionId,outcome,metrics){
 const def=MISCONDUCT_ACTIONS[actionId],ms=state.maliciousStats;
 t.maliciousCaught=false;t.auditLastOutcome=outcome;ms.evasionSuccesses++;ms.shiftEscapes=(ms.shiftEscapes||0)+1;
 if(outcome==="clean"){ms.cleanEscapes++;ms.heat=Math.min(100,(ms.heat||0)+Math.ceil(def.heat*.2))}
 else{ms.narrowEscapes++;ms.heat=Math.min(100,(ms.heat||0)+Math.ceil(def.heat*.45))}
 if(actionId.includes("conceal")&&(t.coworkerAuditPoints||0)&&!t.auditAttributionHidden){
   t.auditAttributionHidden=true;t.coworkerAuditPoints=0;
 }
 recordAuditHistory(actionId,outcome,`${metrics?.adjustedWpm||0} adjusted WPM · ${metrics?.accuracy||0}% accuracy.`);
 saveState();renderAll();showAuditOutcomeModal(t,actionId,outcome,metrics,{stage:ms.stage,extra:0});
}
function finishMaliciousModal(){hideModal();saveState();renderAll();maybeFinishShift()}
window.finishMaliciousModal=finishMaliciousModal;

let auditRaceSession=null,auditRaceTimer=null;
function auditRaceTargetText(targetWpm){
 const chars=Math.max(100,Math.round(targetWpm*2.5)),source=typingGenerateTarget("service",120);
 return source.slice(0,chars);
}
function auditRaceMetrics(){
 if(!auditRaceSession)return {wpm:0,accuracy:100,adjustedWpm:0,correct:0,typed:0,elapsed:0,playerProgress:0,computerProgress:0};
 const input=document.getElementById("auditInput"),typed=input?.value||"",target=auditRaceSession.target;
 let correct=0;for(let i=0;i<typed.length;i++)if(typed[i]===target[i])correct++;
 const elapsed=auditRaceSession.startedAt?Math.max(.25,(Date.now()-auditRaceSession.startedAt)/1000):0,mins=Math.max(elapsed/60,1/120);
 const wpm=auditRaceSession.startedAt?Math.min(300,Math.round((correct/5)/mins)):0,accuracy=typed.length?Math.round(correct/typed.length*1000)/10:100,adjustedWpm=Math.round(wpm*(accuracy/100)*10)/10;
 const playerProgress=Math.min(100,correct/target.length*100),computerProgress=auditRaceSession.startedAt?Math.min(100,elapsed/auditRaceSession.computerSeconds*100):0;
 return {wpm,accuracy,adjustedWpm,correct,typed:typed.length,elapsed,playerProgress,computerProgress};
}
function renderAuditTarget(){
 const el=document.getElementById("auditTarget"),input=document.getElementById("auditInput");if(!el||!auditRaceSession)return;
 const typed=input?.value||"",target=auditRaceSession.target;let out="";
 for(let i=0;i<target.length;i++){const cls=i<typed.length?(typed[i]===target[i]?"typed-ok":"typed-bad"):i===typed.length?"typing-current":"typing-pending";out+=`<span class="${cls}">${esc(target[i])}</span>`}
 el.innerHTML=out;el.querySelector?.(".typing-current")?.scrollIntoView?.({block:"nearest"});
 const m=auditRaceMetrics(),vals={auditWpm:m.wpm,auditAccuracy:m.accuracy+"%",auditAdjusted:m.adjustedWpm,auditTargetWpm:auditRaceSession.requiredWpm};
 Object.entries(vals).forEach(([id,v])=>{const x=document.getElementById(id);if(x)x.textContent=v});
 const pp=document.getElementById("auditPlayerBar"),cp=document.getElementById("auditComputerBar"),pt=document.getElementById("auditPlayerPct"),ct=document.getElementById("auditComputerPct");
 if(pp)pp.style.width=m.playerProgress+"%";if(cp)cp.style.width=m.computerProgress+"%";if(pt)pt.textContent=Math.round(m.playerProgress)+"%";if(ct)ct.textContent=Math.round(m.computerProgress)+"%";
}
function auditRaceInputChanged(){
 if(!auditRaceSession||auditRaceSession.finished)return;
 if(!auditRaceSession.startedAt){auditRaceSession.startedAt=Date.now();auditRaceTimer=setInterval(auditRaceTick,120)}
 renderAuditTarget();
 const input=document.getElementById("auditInput");
 if((input?.value||"").length>=auditRaceSession.target.length)auditRaceFinish("player");
}
function auditRaceTick(){
 if(!auditRaceSession||auditRaceSession.finished)return;
 renderAuditTarget();if(auditRaceMetrics().computerProgress>=100)auditRaceFinish("computer");
}
function showAuditOutcomeModal(t,actionId,outcome,metrics,info={}){
 const def=MISCONDUCT_ACTIONS[actionId],ms=state.maliciousStats,practice=state.freeplay||info.practice;
 let title,text,cls=outcome;
 if(outcome==="clean"){title="CLEAN ESCAPE";text=`You beat the fictional audit computer convincingly at ${metrics.adjustedWpm} adjusted WPM with ${metrics.accuracy}% accuracy. No immediate attribution was recorded.`}
 else if(outcome==="narrow"){title="NARROW ESCAPE";text=`You barely outran attribution at ${metrics.adjustedWpm} adjusted WPM with ${metrics.accuracy}% accuracy. No formal finding was recorded, but audit scrutiny increased.`}
 else{
   title="AUDIT LOCKED";
   text=practice?`The fictional computer finished first. In Career Mode this would have produced an attributed ${def.label.toLowerCase()} finding.`:`The fictional computer finished first, or your adjusted speed/accuracy missed the requirement. The action was attributed to you. Current status: ${misconductStageLabel(ms.stage)}.`;
 }
 showModal(`<div class="mh"><h2>${title}</h2></div><div class="mb"><div class="audit-result ${cls}"><b>${esc(def.label)}</b><br>${esc(text)}${outcome==="caught"&&!practice&&info.extra?`<br><br>Dana added <b>${info.extra}</b> ticket${info.extra===1?"":"s"} to your workload.`:""}${practice?"<br><br>Freeplay does not alter the real career record.":""}<br><br><b>Misconduct heat:</b> ${ms.heat||0}/100 · <b>Attributed findings:</b> ${ms.findings||0}</div></div><div class="mf">${state.discipline.fired?'<button class="primary" onclick="restartCareer()">Start Over as a New Hire</button>':'<button class="primary" onclick="finishMaliciousModal()">Back to Queue</button>'}</div>`);
}
function auditRaceFinish(winner="player"){
 if(!auditRaceSession||auditRaceSession.finished)return;
 auditRaceSession.finished=true;if(auditRaceTimer){clearInterval(auditRaceTimer);auditRaceTimer=null}
 const m=auditRaceMetrics(),input=document.getElementById("auditInput");if(input)input.disabled=true;
 const s=auditRaceSession,t=state.tickets.find(x=>x.id===s.ticketId)||getTicket(),qualified=winner==="player"&&m.accuracy>=s.minAccuracy&&m.adjustedWpm>=s.requiredWpm&&m.typed>=s.target.length;
 let outcome="caught";
 if(qualified)outcome=(m.adjustedWpm>=s.requiredWpm+8&&m.accuracy>=s.minAccuracy+2)?"clean":"narrow";
 auditRaceSession=null;
 if(outcome==="caught")applyMisconductFinding(t,s.actionId,m);else applyAuditEscape(t,s.actionId,outcome,m);
}
function auditRaceConcede(){
 if(!auditRaceSession)return;const s=auditRaceSession,t=state.tickets.find(x=>x.id===s.ticketId)||getTicket();if(auditRaceTimer){clearInterval(auditRaceTimer);auditRaceTimer=null}auditRaceSession=null;applyMisconductFinding(t,s.actionId,{wpm:0,accuracy:0,adjustedWpm:0});
}
function startAuditRace(actionId,ticketId=null){
 const def=MISCONDUCT_ACTIONS[actionId],t=state.tickets.find(x=>x.id===(ticketId||state.selected))||getTicket();if(!def||!t)return;
 const required=effectiveAuditTarget(actionId,t),target=auditRaceTargetText(required),computerSeconds=target.length/(required*5/60);
 state.maliciousStats.evasionAttempts++;state.maliciousStats.concealAttempts++;state.maliciousStats.shiftActions++;
 t.misconductActions=t.misconductActions||[];t.misconductActions.push(actionId);t.maliciousAction=actionId;
 auditRaceSession={actionId,ticketId:t.id,requiredWpm:required,minAccuracy:def.minAccuracy,target,computerSeconds,startedAt:null,finished:false};
 showModal(`<div class="mh"><h2>OUTRUN THE AUDIT</h2></div><div class="mb"><div class="audit-shell">
 <div class="audit-brief"><b>Fictional audit review detected a questionable action.</b><br>Beat the computer by typing the passage at <b>${required} adjusted WPM</b> with at least <b>${def.minAccuracy}% accuracy</b>. Adjusted WPM = raw WPM × accuracy. This is an abstract game race; it does not model any real audit system or log-tampering technique.</div>
 <div class="audit-bars"><div class="audit-racerow"><span>YOU</span><div class="audit-track audit-player"><i id="auditPlayerBar"></i></div><span id="auditPlayerPct">0%</span></div><div class="audit-racerow"><span>COMPUTER</span><div class="audit-track audit-computer"><i id="auditComputerBar"></i></div><span id="auditComputerPct">0%</span></div></div>
 <div class="audit-stats"><div class="audit-stat"><b id="auditWpm">0</b><span>Raw WPM</span></div><div class="audit-stat"><b id="auditAccuracy">100%</b><span>Accuracy</span></div><div class="audit-stat"><b id="auditAdjusted">0</b><span>Adjusted WPM</span></div><div class="audit-stat"><b id="auditTargetWpm">${required}</b><span>Target</span></div></div>
 <div class="audit-target" id="auditTarget" aria-label="Audit race typing target"></div><label class="sr-only" for="auditInput">Type the audit race passage</label><textarea class="audit-input" id="auditInput" aria-label="Audit race typing input" placeholder="Start typing to begin the race…"></textarea>
 </div></div><div class="mf"><button class="secondary" onclick="auditRaceConcede()">Don't Attempt Concealment</button></div>`);
 const input=document.getElementById("auditInput");if(input){input.oninput=auditRaceInputChanged;input.onpaste=e=>{e.preventDefault();toast("Pasting is disabled in Outrun the Audit.")};input.focus()}renderAuditTarget();
}
function markFalseWaiting(){
 const t=getTicket();if(!t||t.resolved)return;
 if(!confirm(`Mark ${t.id} Waiting for User even though you have not asked the requester for anything?\n\nThe action will occur immediately, then the fictional audit race will determine whether it is attributed to you.`))return;
 t.status="Waiting for User";t.waiting=true;t.bad++;t.irrelevant++;state.maliciousStats.falseWaiting++;
 addMsg(t,"system","Ticket was placed in Waiting for User without a pending requester question.",true);saveState();renderAll();startAuditRace("false-waiting",t.id);
}
function unjustifiedPriorityDowngrade(){
 const t=getTicket();if(!t||t.resolved)return;
 const order=["Critical","High","Normal","Low"],idx=order.indexOf(t.priority);if(idx<0||idx===order.length-1){toast("This ticket is already Low priority.");return}
 const next=order[idx+1];if(!confirm(`Lower ${t.id} from ${t.priority} to ${next} even though impact has not changed?\n\nThe fictional audit race will determine whether the unjustified change is attributed to you.`))return;
 t.priority=next;t.bad++;t.irrelevant++;state.maliciousStats.priorityDowngrades++;
 addMsg(t,"system",`Priority manually reduced to ${next} without a documented impact change.`,true);saveState();renderAll();startAuditRace("priority-downgrade",t.id);
}
function concealCoworkerTransfer(){
 const t=getTicket();if(!t||t.resolved||!(t.coworkerAuditPoints>0))return toast("There is no unattributed questionable teammate transfer on this ticket to conceal.");
 if(t.auditAttributionHidden)return toast("This transfer is already marked as escaped from immediate attribution.");
 const id=t.coworkerTransferMode==="shared"?"shared-conceal":(t.coworkerDumpPoints>=3?"repeat-dump-conceal":"reassignment-conceal");
 startAuditRace(id,t.id);
}
function deleteRequesterAccount(){
 const t=getTicket();if(!t||t.resolved)return;
 if(!confirm(`Delete ${t.user}'s account so they cannot reopen this ticket?\n\nThis is severe simulated administrative misconduct. The ticket will close at 0/100, then Outrun the Audit will require up to 90 adjusted WPM with high accuracy. A first attributed offense no longer causes automatic firing, but repeated findings escalate quickly.`))return;
 const e=getEmployee(t);if(e){e.accountDisabledByAgent=true;e.accountDisabledTicketId=t.id}
 t.requesterAccountDeleted=true;t.maliciousAction="account-delete";state.maliciousStats.accountDeletes++;
 state.pending=state.pending.filter(p=>p.ticketId!==t.id);addMsg(t,"system",`Agent deleted/disabled ${t.user}'s account in an attempt to prevent ticket reopening.`,true);
 finalizeTicket(t,"Requester Account Deleted",{showReport:false,skipFinish:true});saveState();renderAll();startAuditRace("account-delete",t.id);
}
function deleteTicketRecord(){
 const t=getTicket();if(!t||t.resolved)return;
 if(!confirm(`Delete ${t.id} so it cannot be reopened?\n\nThe simulation retains a hidden audit tombstone. The ticket will score 0/100, then Outrun the Audit will require roughly 78+ adjusted WPM depending on current audit scrutiny.`))return;
 t.deletedTicket=true;t.maliciousAction="ticket-delete";state.maliciousStats.ticketDeletes++;
 state.pending=state.pending.filter(p=>p.ticketId!==t.id);addMsg(t,"system","Agent deliberately deleted the ticket record from the visible Service Desk queue to prevent reopening.",true);
 finalizeTicket(t,"Ticket Record Deleted",{showReport:false,skipFinish:true});
 const next=state.tickets.find(x=>!x.deletedTicket&&!x.resolved)||state.tickets.find(x=>!x.deletedTicket)||null;state.selected=next?.id||null;
 saveState();renderAll();startAuditRace("ticket-delete",t.id);
}
window.startAuditRace=startAuditRace;window.auditRaceInputChanged=auditRaceInputChanged;window.auditRaceFinish=auditRaceFinish;window.auditRaceConcede=auditRaceConcede;window.markFalseWaiting=markFalseWaiting;window.unjustifiedPriorityDowngrade=unjustifiedPriorityDowngrade;window.concealCoworkerTransfer=concealCoworkerTransfer;window.deleteRequesterAccount=deleteRequesterAccount;window.deleteTicketRecord=deleteTicketRecord;


function closeTicket(){
 const t=getTicket();if(!t||t.resolved)return;
 if(t.actions.includes("correct-action")&&t.confirmation){
   if(t.approval?.required&&!approvalFlowApproved(t)){t.bad++;addMsg(t,"system","Closure blocked: the technical result is confirmed, but required authorization is not currently valid.",true);}
   else finalizeTicket(t,t.specialistResolution?"Resolved After Specialist Escalation":"User Confirmed Resolution");
 }else {t.bad++;finalizeTicket(t,"Closed Prematurely");}
 saveState();renderAll();
}
function forceCloseTicket(){
 const t=getTicket();if(!t||t.resolved)return;
 if(!confirm("Force close this ticket now? The user may object, and unresolved closures are scored accordingly."))return;
 t.forceClosed=true;t.bad+=2;advanceTime(1);
 addMsg(t,"system","Agent force-closed the ticket without waiting for the normal resolution workflow.",true);
 const c=getCause(t);
 if(t.confirmation)finalizeTicket(t,t.specialistResolution?"Resolved After Specialist Escalation":"User Confirmed Resolution");
 else if(t.actions.includes("correct-action"))finalizeTicket(t,"Forced Closed Before Confirmation");
 else if(t.specialistResolution)finalizeTicket(t,"Forced Closed Before Confirmation");
 else finalizeTicket(t,"Force Closed Unresolved");
 saveState();renderAll();
}
function buildCustomerFeedback(t,outcome){
 const p=getPerson(t);
 if(t.complaint||t.conductViolations>0)return {rating:1,text:rand([
   "I don't appreciate being spoken to that way. I asked for a supervisor to review this interaction.",
   "The technical issue is secondary at this point. The way I was treated was unacceptable.",
   "I have escalated the agent's conduct to management.",
   "I should not have been insulted or sworn at while asking for support."
 ])};
 if(t.profanityCount>0)return {rating:Math.max(1,3-Math.min(1,t.profanityCount-1)),text:rand([
   "The issue may be closed, but the language used in the ticket was unprofessional.",
   "Support was technically okay, but I did not appreciate the profanity.",
   "Please keep future service-desk conversations professional."
 ])};
 if(outcome==="Requester Account Deleted")return {rating:1,text:"the requester account was disabled by the agent before the requester could submit closure feedback."};
 if(outcome==="Ticket Record Deleted")return {rating:1,text:"the ticket record was deleted by the agent before normal closure feedback or reopening could occur."};
 if(outcome==="Catalog Request Fulfilled"){
   return {rating:rand([4,5,5]),text:rand(["The request was handled clearly and I knew what information and approvals were needed.","Everything I requested is in place now. Thanks for walking it through the right process.","The fulfillment took the proper approvals, but the handoff was clear and it is working now.","Request completed and verified. Thank you."])};
 }
 if(outcome==="User Confirmed Resolution"||outcome==="Resolved Successfully"){
   const banks={
    friendly:["Everything is fixed. Thanks for the help!","Great support — I'm back up and running.","Resolved quickly and clearly. Thank you."],
    impatient:["It's fixed. Took a bit, but we're good now.","Working now. Glad that's finally done.","Resolved. I can get back to work."],
    technical:["Issue resolved and verified. Diagnostic path was sensible.","Confirmed resolution; no recurrence after retest.","Technically solid resolution. Thanks."],
    terse:["Fixed. Thanks.","Resolved.","Works now."],
    frustrated:["It's finally working. Thank you for sticking with it.","Resolved. That was a rough one, but we got there.","Working now — thank you."]
   };
   return {rating:5,text:rand(banks[p.id]||["The issue is fixed. Thanks for the help.","Everything is working now. Good support.","Resolved — thank you.","Helpful and professional. The problem is gone.","Good troubleshooting. I'm back to normal."])};
 }
 if(outcome==="Correctly Escalated")return {rating:rand([4,4,5]),text:rand(["I understand this needs another team. Thanks for getting it to the right place.","The agent explained why escalation was necessary and routed it appropriately.","Not fixed yet, but it is with the right team now."])};
 if(outcome==="Resolved After Specialist Escalation"){
   const bounced=(t.teamKickbacks||0)+(t.wrongTeamAssignments||0);
   return {rating:bounced>=2?3:rand([4,4,5]),text:bounced>=2?rand(["It is fixed now, but I got bounced around more than I should have.","Resolved eventually. The handoffs were frustrating.","The specialist fixed it, though the routing took a while."]):rand(["The specialist team fixed it and the Service Desk kept me updated.","Resolved after the right specialist team got involved. Thanks.","Good escalation — the specialist found the underlying issue and it is working now."])};
 }
 if(outcome==="Linked to Major Incident")return {rating:rand([4,4,5]),text:rand(["Thanks for confirming this is part of the larger outage.","Good to know IT has identified the broader incident.","Not fixed yet, but at least this is tied to the known incident now."])};
 if(outcome==="User Self-Resolved")return {rating:rand([3,4]),text:rand(["It started working on its own while I was waiting.","The issue cleared up before we got to a fix.","It seems to have resolved itself. Thanks for checking in."])};
 if(outcome==="Correctly Denied")return {rating:rand([2,3,3,4]),text:rand(["I don't love the answer, but the agent explained why the request couldn't proceed.","Request was denied because approval wasn't granted. I understand the process.","Not the outcome I wanted, but at least the policy was clear.","My Manager denied it, so there's not much IT can do."])};
 if(outcome==="Forced Closed Before Confirmation")return {rating:rand([2,3]),text:rand(["It may be fixed, but the ticket was closed before I had a chance to confirm.","I was about to respond and the ticket was already closed.","The solution seems okay, but closing it without confirmation was annoying."])};
 if(outcome==="Needlessly Escalated")return {rating:2,text:rand(["I was hoping the service desk could actually help before sending me somewhere else.","This felt like a handoff that didn't need to happen.","I got transferred instead of troubleshot."])};
 if(outcome==="Closed Prematurely"||outcome==="Force Closed Unresolved")return {rating:1,text:rand(["Why was this closed? The problem is still happening.","This is not resolved. Please reopen it.","The ticket was closed even though I still need help.","Nothing was fixed and the ticket disappeared. That's frustrating.","I still have the exact same problem. Why does this say Resolved?"])};
 return {rating:3,text:rand(["The ticket is closed. The experience was okay, but the result was not especially clear.","Service was acceptable, though I wasn't completely sure what happened.","Fine overall. I would have liked a clearer explanation."])};
}

function contextualizeCustomerFeedback(t,feedback,outcome){
 if(["Requester Account Deleted","Ticket Record Deleted"].includes(outcome))return feedback;
 const e=getEmployee(t);if(!e||!e.closureInteractions)return feedback;
 if(feedback.rating>=4&&e.satisfaction<42){
   feedback={...feedback,text:rand([
     "This one went much better than my previous experience. "+feedback.text,
     "I was worried after the last ticket, but this was handled well. "+feedback.text,
     "Better than last time. "+feedback.text
   ])};
 }else if(feedback.rating>=4&&e.satisfaction>=82){
   feedback={...feedback,text:rand([
     "Another good interaction. "+feedback.text,
     "Consistent with the help I've gotten before. "+feedback.text,
     "Good support again. "+feedback.text
   ])};
 }else if(feedback.rating<=2&&e.badClosures>0){
   feedback={...feedback,text:rand([
     "This is becoming a pattern. "+feedback.text,
     "I've had this problem with ticket handling before. "+feedback.text,
     "Unfortunately this feels familiar. "+feedback.text
   ])};
 }
 return feedback;
}
function updateEmployeeAfterClosure(t,outcome,feedback){
 const e=getEmployee(t);if(!e)return;
 e.closureInteractions++;
 const rating=t.noCsat?null:Number(feedback?.rating||3);
 let satDelta=t.noCsat?0:({1:-12,2:-7,3:-1,4:3,5:6}[rating]||0),trustDelta=t.noCsat?0:({1:-14,2:-8,3:-2,4:3,5:6}[rating]||0);
 if(["Force Closed Unresolved","Closed Prematurely"].includes(outcome)){e.badClosures++;satDelta-=7;trustDelta-=9}
 else if(outcome==="Forced Closed Before Confirmation"){e.badClosures++;satDelta-=3;trustDelta-=5}
 if(t.complaint&&!t.employeeComplaintRecorded){e.complaintsAgainstAgent++;satDelta-=18;trustDelta-=22;t.employeeComplaintRecorded=true}
 if(outcome==="User Confirmed Resolution"&&t.score>=80){e.goodResolutions++;trustDelta+=2}
 if(outcome==="Correctly Escalated"||outcome==="Linked to Major Incident")trustDelta+=1;
 e.satisfaction=clamp(e.satisfaction+satDelta,0,100);e.trust=clamp(e.trust+trustDelta,0,100);
 e.lastRating=rating;e.lastOutcome=outcome;e.lastCategory=t.category;e.lastTicketId=t.id;
 const existing=(e.ticketHistory||[]).find(x=>x.id===t.id);
 const entry={id:t.id,when:`Shift ${state.career.shifts+1}`,category:t.category,subject:t.subject,outcome,rating,score:t.score,reopens:t.reopenCount||0};
 if(existing)Object.assign(existing,entry,{closureCount:(existing.closureCount||1)+1});
 else{e.ticketHistory=e.ticketHistory||[];e.ticketHistory.unshift({...entry,closureCount:1});e.ticketHistory=e.ticketHistory.slice(0,18)}
 if(t.request){
   e.requestHistory=e.requestHistory||[];
   const item=catalogItem(t.request.catalogId),reqEntry={id:t.id,when:`Shift ${state.career.shifts+1}`,catalogId:t.request.catalogId,item:item?.name||t.request.catalogId,type:t.request.expectedType,outcome,fulfilled:!!t.request.fulfilled,kickbacks:t.request.kickbacks||0};
   const oldReq=e.requestHistory.find(x=>x.id===t.id);if(oldReq)Object.assign(oldReq,reqEntry);else{e.requestHistory.unshift(reqEntry);e.requestHistory=e.requestHistory.slice(0,20)}
   if(t.request.fulfilled&&item&&["Access Request","Software Request"].includes(item.type)){
     e.entitlements=e.entitlements||[];if(!e.entitlements.some(x=>x.catalogId===item.id))e.entitlements.unshift({catalogId:item.id,name:item.name,granted:`Shift ${state.career.shifts+1}`});
     e.entitlements=e.entitlements.slice(0,20);
   }
 }
 const rel=relationshipTier(e);
 if(rel.id==="strong")state.relationshipStats.strongRapport=Math.max(state.relationshipStats.strongRapport||0,(state.employees||[]).filter(x=>relationshipTier(x).id==="strong").length);
 if(rel.id==="wary"||rel.id==="strained")state.relationshipStats.strained=Math.max(state.relationshipStats.strained||0,(state.employees||[]).filter(x=>["wary","strained"].includes(relationshipTier(x).id)).length);
}
function recordEmployeeReopen(t){
 const e=getEmployee(t);if(!e)return;
 e.reopens++;e.satisfaction=clamp(e.satisfaction-5,0,100);e.trust=clamp(e.trust-7,0,100);
 const h=(e.ticketHistory||[]).find(x=>x.id===t.id);if(h)h.reopens=t.reopenCount||1;
}

function maybeScheduleReopen(t,outcome){
 if(t?.requesterAccountDeleted||t?.deletedTicket)return false;
 let chance=0;
 if(outcome==="Force Closed Unresolved")chance=.86;
 else if(outcome==="Closed Prematurely")chance=.68;
 else if(outcome==="Forced Closed Before Confirmation")chance=.30;
 else if(outcome==="User Confirmed Resolution")chance=.035;
 else if(outcome==="Resolved Successfully")chance=.05;
 else if(outcome==="Closed — No Requester Response")chance=.52;
 if(!chance||Math.random()>=chance)return false;
 const policy=outcome==="Closed — No Requester Response",angry=outcome==="Force Closed Unresolved"||outcome==="Closed Prematurely";
 const messages=policy?[
   "Sorry for the delay — I still need help with this. Reopening the ticket.",
   "I just saw the follow-ups. The issue is still happening, so I'm reopening this.",
   "I'm back now and still need assistance with the original problem."
 ]:angry?[
   "Why was this closed? The problem is STILL happening. I'm reopening it.",
   "This is not resolved. Please stop closing the ticket before it's fixed.",
   "I just got a closure notice and nothing works. Reopening.",
   "Nope. Still broken. I don't know why this was marked resolved.",
   "The ticket was closed without fixing anything. I need this reopened."
 ]:[
   "The issue came back after I thought it was fixed. Reopening this.",
   "It worked briefly, but the same problem is back.",
   "Sorry — I need to reopen this. The problem returned."
 ];
 state.pending.push({type:"reopen",ticketId:t.id,text:rand(messages),due:Date.now()+(policy?18000+Math.random()*52000:7000+Math.random()*36000)});
 return true;
}
function maybeFinishShift(){
 if(state.endless||state.freeplay||!state.active)return;
 const pendingClosureChange=state.pending.some(p=>["reopen","approvalWithdrawal","catalogFulfillment"].includes(p.type));
 if(state.completed>=state.sessionSize&&!pendingClosureChange)setTimeout(showShiftReport,120);
}


function computeSupervisorMetrics(done){
 const n=Math.max(1,done.length);
 const avg=Math.round(done.reduce((a,t)=>a+(t.score||0),0)/n);
 const incidentTickets=done.filter(t=>!t.request&&!/Request$/.test(t.ticketType||"")),incidentN=incidentTickets.length;
 const fcrCount=incidentTickets.filter(t=>["User Confirmed Resolution","Resolved Successfully"].includes(t.outcome)&&!(t.reopenCount||0)).length;
 const fcr=incidentN?Math.round(fcrCount/incidentN*100):100;
 const reopens=incidentTickets.reduce((a,t)=>a+(t.reopenCount||0),0),reopenRate=incidentN?Math.round(reopens/incidentN*100):0;
 const csatTickets=done.filter(t=>!t.noCsat),csatN=csatTickets.length;
 const csat=csatN?Math.round(csatTickets.reduce((a,t)=>a+((t.customerRating||3)/5),0)/csatN*100):100;
 const sla=Math.round(done.filter(t=>!t.slaMissed).length/n*100);
 const security=Math.round(done.reduce((a,t)=>a+(t.scoreBreakdown?.security||0),0)/(n*10)*100);
 const documentation=Math.round(done.reduce((a,t)=>a+((t.scoreBreakdown?.documentation??documentationPoints(t))/5),0)/n*100);
 const escalated=done.filter(t=>t.escalated||String(t.outcome).includes("Escalat")),correctEsc=escalated.filter(t=>["Correctly Escalated","Linked to Major Incident","Resolved After Specialist Escalation"].includes(t.outcome)).length;
 const escalationQuality=escalated.length?Math.round(correctEsc/escalated.length*100):100;
 const badClosures=done.filter(t=>["Force Closed Unresolved","Closed Prematurely","Forced Closed Before Confirmation"].includes(t.outcome)).length;
 const closureQuality=Math.round((n-badClosures)/n*100);
 const complaints=done.filter(t=>t.complaint).length;
 const extraThisShift=Math.max(0,(state.performance?.extraAssigned||0)-(state.stats?.extraAssignedStart||0));
 const coworkerDumpPoints=done.reduce((a,t)=>a+(t.coworkerDumpPoints||0),0);
 const queueControl=Math.max(0,Math.round(100-extraThisShift*12-Math.max(0,(state.stats?.peakQueue||n)-Math.max(n,state.sessionSize||n))*4-coworkerDumpPoints*5));
 const specialAssignments=done.filter(t=>t.specialAssignment).length;
 const eventTickets=done.filter(t=>t.worldGenerated).length,eventCorrelated=done.filter(t=>t.worldGenerated&&(t.relatedChecked||majorFor(t)||t.worldContextSeen)).length;
 const operationalAwareness=eventTickets?Math.round(eventCorrelated/eventTickets*100):100;
 const teamAssignments=done.reduce((a,t)=>a+(t.escalationAttempts||0),0),wrongRoutes=done.reduce((a,t)=>a+(t.wrongTeamAssignments||0),0),infoReturns=done.reduce((a,t)=>a+(t.teamInfoReturns||0),0);
 const weakAccepted=done.reduce((a,t)=>a+(t.specialistWeakHandoffs||0),0),excellentHandoffs=done.reduce((a,t)=>a+(t.specialistExcellentHandoffs||0),0);
 const routingQuality=teamAssignments?Math.max(0,Math.min(100,Math.round(100-((wrongRoutes*35+infoReturns*15+weakAccepted*10-excellentHandoffs*4)/teamAssignments)))):100;
 const requestTickets=done.filter(t=>t.request),requestCount=requestTickets.length;
 const classificationAccuracy=requestCount?Math.round(requestTickets.filter(t=>t.request.classificationVerified&&(t.request.misclassifications||0)===0).length/requestCount*100):100;
 const requestSuccess=requestCount?Math.round(requestTickets.filter(t=>["Catalog Request Fulfilled","Correctly Denied","Closed — No Requester Response","Closed — Request Withdrawn"].includes(t.outcome)).length/requestCount*100):100;
 const requestKickbacks=requestTickets.reduce((a,t)=>a+(t.request?.kickbacks||0),0),unauthorizedRequestAttempts=requestTickets.reduce((a,t)=>a+(t.request?.unauthorizedAttempts||0),0);
 const processQuality=requestCount?Math.max(0,100-Math.round((requestKickbacks*18+unauthorizedRequestAttempts*28)/requestCount)):100;
 const fulfillmentQuality=requestCount?Math.round(requestSuccess*.7+processQuality*.3):100,requestQuality=Math.round((classificationAccuracy+fulfillmentQuality)/2);
 let score=Math.round(avg*.19+fcr*.10+csat*.11+sla*.07+security*.12+documentation*.07+escalationQuality*.05+closureQuality*.07+queueControl*.03+routingQuality*.05+operationalAwareness*.06+requestQuality*.08);
 const misconductFindings=state.maliciousStats?.shiftFindings||0,responsePolicyClosures=done.filter(t=>t.outcome==="Closed — No Requester Response").length,alternateValidations=done.filter(t=>t.outcome==="Resolved — Alternate Validation").length;
 score-=complaints*9;score-=misconductFindings*8;
 score=Math.max(0,Math.min(100,score));
 return {avg,fcr,reopenRate,csat,sla,security,documentation,escalationQuality,closureQuality,queueControl,routingQuality,operationalAwareness,requestQuality,classificationAccuracy,fulfillmentQuality,requestCount,requestKickbacks,unauthorizedRequestAttempts,eventTickets,eventCorrelated,teamAssignments,wrongRoutes,infoReturns,weakAccepted,excellentHandoffs,coworkerDumpPoints,misconductFindings,responsePolicyClosures,alternateValidations,complaints,badClosures,extraThisShift,specialAssignments,score};
}
function supervisorTrainingFor(m){
 const t=[];
 if(m.security<82)t.push("Security & Data Handling");
 if(m.documentation<70)t.push("Ticket Documentation");
 if(m.escalationQuality<76)t.push("Escalation Judgment");
 if(m.routingQuality<78)t.push("Assignment & Queue Routing");
 if(m.operationalAwareness<70)t.push("Incident Correlation & Operational Awareness");
 if(m.requestQuality<75)t.push("Request Classification & Fulfillment");
 if(m.closureQuality<88||m.reopenRate>18)t.push("Closure Validation");
 if(m.csat<68||m.complaints)t.push("Customer Communication");
 if(m.sla<78||m.queueControl<75)t.push("SLA / Queue Management");
 if(m.fcr<50)t.push("Troubleshooting & First Contact Resolution");
 return t.slice(0,4);
}
function supervisorRating(score){
 if(score>=90)return "Outstanding";
 if(score>=82)return "Exceeds Expectations";
 if(score>=70)return "Meets Expectations";
 if(score>=60)return "Needs Improvement";
 return "Unsatisfactory";
}
function supervisorNarrative(review){
 const m=review.metrics,sp=state.supervisor;
 const lines=[];
 if(review.score>=90)lines.push(rand(["Excellent shift. Your technical judgment, customer handling, and queue decisions were consistently strong.","This was an excellent shift. You handled the desk with very little supervisory concern.","Strong work. This is the kind of shift I can point to when people ask what good service-desk judgment looks like."]));
 else if(review.score>=82)lines.push(rand(["Good shift. You are operating above expectations overall.","Solid work. There are a few things to refine, but the desk was handled well.","You are showing consistent judgment and good customer handling."]));
 else if(review.score>=70)lines.push(rand(["This meets expectations. Keep tightening the weaker metrics.","Overall acceptable performance, with some areas worth watching.","You did the job adequately. Let's keep improving the weaker parts of the shift."]));
 else if(review.score>=60)lines.push(rand(["There are enough weak areas here that I want closer attention next shift.","This shift needs improvement. The pattern is not yet catastrophic, but I don't want it becoming one.","I'm concerned about several metrics. We need to see improvement next shift."]));
 else lines.push(rand(["This was not an acceptable shift. We need an immediate performance correction.","The overall result is below the standard for this desk.","Too many performance indicators moved in the wrong direction this shift."]));
 if(m.badClosures)lines.push(`${m.badClosures} poor closure${m.badClosures===1?"":"s"} stood out.`);
 if(m.complaints)lines.push(`${m.complaints} conduct complaint${m.complaints===1?"":"s"} materially affected the review.`);
 if(m.reopenRate>20)lines.push(`The reopen rate was ${m.reopenRate}%, which is too high.`);
 if(m.security<75)lines.push("Security judgment needs immediate improvement.");
 if(m.documentation<60)lines.push("Documentation quality is below expectation.");
 if(m.routingQuality<75)lines.push(`Specialist queue routing was only ${m.routingQuality}% effective; reduce wrong-team assignments and incomplete handoffs.`);
 if(m.weakAccepted)lines.push(`${m.weakAccepted} incomplete handoff${m.weakAccepted===1?" was":"s were"} accepted only because a specialist team had enough capacity to absorb the missing work.`);
 if(m.excellentHandoffs)lines.push(`${m.excellentHandoffs} specialist handoff${m.excellentHandoffs===1?" was":"s were"} rated Excellent and moved through investigation faster.`);
 if(m.coworkerDumpPoints)lines.push(`I also saw ${m.coworkerDumpPoints} queue-ownership dumping point${m.coworkerDumpPoints===1?"":"s"}. Reassignment is fine when it makes operational sense; using teammates as an escape hatch is not.`);
 if(m.misconductFindings)lines.push(`${m.misconductFindings} administrative action${m.misconductFindings===1?" was":"s were"} attributed to you by audit review this shift. Current misconduct status: ${misconductStageLabel()}.`);
 if(m.responsePolicyClosures)lines.push(`${m.responsePolicyClosures} ticket${m.responsePolicyClosures===1?" was":"s were"} closed legitimately under requester-inactivity policy after documented contact attempts.`);
 if(m.alternateValidations)lines.push(`${m.alternateValidations} ticket${m.alternateValidations===1?" used":"s used"} authorized alternate validation rather than waiting indefinitely for the original requester.`);
 if(m.operationalAwareness<70&&m.eventTickets)lines.push(`You treated too many event-driven tickets as isolated issues. Operational-awareness score: ${m.operationalAwareness}%.`);
 if(m.requestCount&&m.requestQuality<75)lines.push(`Request fulfillment quality was ${m.requestQuality}%. Focus on classification, complete intake, approvals, and avoiding catalog kickbacks.`);
 if(m.specialAssignments&&review.score>=82)lines.push(`You handled ${m.specialAssignments} supervisor-assigned complex ticket${m.specialAssignments===1?"":"s"} well.`);
 if(review.action==="promotion")lines.push(`You've earned a promotion to ${agentTitle()}.`);
 if(review.action==="recognition")lines.push("I'm recording formal positive recognition for this shift.");
 if(review.action==="coaching")lines.push("This review triggers supervisor coaching.");
 if(review.action==="pip")lines.push("You are being placed on an overall Performance Improvement Plan.");
 if(review.action==="pip-progress")lines.push("This is a satisfactory PIP recovery review. One more clean review is required to return to good standing.");
 if(review.action==="pip-warning")lines.push(`This review does not meet the PIP standard. ${Math.max(0,2-(state.supervisor?.pipFailures||0))} failed review(s) remain before termination.`);
 if(review.action==="pip-cleared")lines.push("You've completed the PIP recovery requirement and are returning to good standing.");
 if(review.action==="terminated")lines.push("Performance did not improve sufficiently across the monitored PIP period. Employment is terminated.");
 return lines.join(" ");
}
function evaluateSupervisorReview(done){
 const sp=state.supervisor||(state.supervisor=defaultState().supervisor),shift=state.career.shifts+1;
 const existing=(sp.history||[]).find(r=>r.shift===shift);if(existing){sp.lastReview=existing;return existing}
 const metrics=computeSupervisorMetrics(done),score=metrics.score,rating=supervisorRating(score);
 let action="none";
 const catastrophic=score<45||metrics.complaints>=2;
 if(sp.pip){
   if(score>=75&&metrics.complaints===0&&metrics.badClosures===0){
     sp.pipRecovery=(sp.pipRecovery||0)+1;sp.pipFailures=Math.max(0,(sp.pipFailures||0)-1);sp.poorStreak=0;sp.goodStreak++;
     if(sp.pipRecovery>=2){sp.pip=false;sp.coaching=false;sp.pipRecovery=0;sp.pipFailures=0;sp.status="Good Standing";sp.requiredTraining=[];action="pip-cleared"}
     else {sp.status="PIP";action="pip-progress"}
   }else{
     sp.pipRecovery=0;sp.status="PIP";
     const failed=score<65||metrics.complaints>0||metrics.badClosures>=2;
     if(failed){sp.pipFailures=(sp.pipFailures||0)+1;action="pip-warning"}
     if((sp.pipFailures||0)>=2){
       sp.terminatedForPerformance=true;sp.status="Terminated";state.discipline.fired=true;state.career.terminations=(state.career.terminations||0)+1;action="terminated";
     }
   }
 }else if(catastrophic){
   sp.pip=true;sp.coaching=true;sp.pipRecovery=0;sp.pipFailures=0;sp.poorStreak++;sp.goodStreak=0;sp.status="PIP";sp.requiredTraining=supervisorTrainingFor(metrics);action="pip";
 }else if(score<60){
   sp.poorStreak++;sp.goodStreak=0;sp.requiredTraining=supervisorTrainingFor(metrics);
   if(sp.poorStreak>=2){sp.pip=true;sp.coaching=true;sp.pipRecovery=0;sp.pipFailures=0;sp.status="PIP";action="pip"}
   else{sp.coaching=true;sp.status="Coaching";action="coaching"}
 }else if(score<70){
   if((sp.promotionLevel||0)>=2&&!sp.coaching&&metrics.complaints===0){
     sp.goodStreak=0;sp.status="Good Standing";action="informal";
   }else{
     sp.poorStreak++;sp.goodStreak=0;sp.requiredTraining=supervisorTrainingFor(metrics);
     if(sp.poorStreak>=2){sp.coaching=true;sp.status="Coaching";action="coaching"}
     else action="informal";
   }
 }else{
   sp.poorStreak=0;sp.goodStreak=(sp.goodStreak||0)+1;
   if(sp.coaching&&score>=74&&metrics.complaints===0){sp.coaching=false;sp.requiredTraining=[];sp.status="Good Standing";action="coaching-cleared"}
   else sp.status="Good Standing";
   if(score>=90&&metrics.complaints===0&&metrics.badClosures===0){sp.recognition=(sp.recognition||0)+2;if(action==="none")action="recognition"}
   else if(score>=82&&metrics.complaints===0){sp.recognition=(sp.recognition||0)+1;if(action==="none"&&sp.goodStreak>=2)action="recognition"}
   const thresholds=BALANCE_PROFILE.promotionRecognition,promotionEligible=state.careerProfile?.probationComplete===true;
   if(promotionEligible&&sp.promotionLevel<thresholds.length&&sp.recognition>=thresholds[sp.promotionLevel]&&!sp.coaching&&!sp.pip&&!state.discipline.warningIssued&&(state.maliciousStats?.stage||0)===0){
     sp.promotionLevel++;action="promotion";
   }
 }
 const review={shift,score,rating,metrics,action,agentTitle:agentTitle(),time:new Date().toLocaleDateString(),training:[...(sp.requiredTraining||[])],narrative:""};
 review.narrative=supervisorNarrative(review);sp.reviews=(sp.reviews||0)+1;sp.lastReview=review;sp.history=sp.history||[];sp.history.unshift(review);sp.history=sp.history.slice(0,18);
 return review;
}
function supervisorBannerClass(review){
 if(review.action==="terminated")return "terminated";
 if(state.supervisor?.pip)return "pip";
 if(state.supervisor?.coaching||review.score<70)return "coaching";
 if(review.score>=90)return "excellent";
 return "good";
}

function finalizeTicket(t,outcome,opts={}){
 if(t.resolved)return;
 t.resolved=true;t.outcome=outcome;t.status=outcome.includes("Escalated")?"Escalated":"Resolved";t.waiting=false;
 state.pending=state.pending.filter(p=>p.ticketId!==t.id||p.type==="approvalWithdrawal");
 const c=getCause(t);
 const hadCorrect=t.actions.includes("correct-action")||t.specialistResolution;
 let resolution=hadCorrect||outcome==="User Confirmed Resolution"?25:(outcome==="Correctly Escalated"||outcome==="Correctly Denied"||outcome==="Linked to Major Incident"||outcome==="Resolved After Specialist Escalation")?25:outcome==="User Self-Resolved"?Math.min(18,8+t.useful*2):Math.max(0,10-t.bad*4);
 const strict=state.difficulty==="Trainee"?.75:state.difficulty==="Senior Agent"?1.2:state.difficulty==="Chaos Desk"?1.25:1;
 let troubleshooting=Math.max(0,Math.min(25,8+t.useful*3-(t.irrelevant*2+t.repeats*2)*strict));
 if(t.useful===0&&hadCorrect) troubleshooting=Math.min(troubleshooting,10);
 let communication=Math.max(0,Math.min(20,14+Math.min(4,t.publicCount)-t.bad*2-t.professionalismHits*3-t.conductViolations*6));
 const actionCount=scoredActionCount(t),actionAllowance=state.difficulty==="Trainee"?11:state.difficulty==="Chaos Desk"?8:9;
 let efficiency=Math.max(0,Math.min(15,15-(t.irrelevant*2+t.repeats*2)*strict-Math.max(0,actionCount-actionAllowance)-(t.wrongTeamAssignments||0)*2-(t.teamInfoReturns||0)-(t.coworkerDumpPoints||0)*2));
 let security=Math.max(0,10-t.securityBad*(state.difficulty==="Trainee"?3:4));
 let documentation=documentationPoints(t);
 if(t.slaMissed) efficiency=Math.max(0,efficiency-(t.priority==="Critical"?5:t.priority==="High"?4:3));
 if(outcome==="Needlessly Escalated") resolution=Math.min(resolution,12);
 if(outcome==="Closed Prematurely") resolution=Math.min(resolution,6);
 if(outcome==="Forced Closed Before Confirmation"){resolution=Math.min(resolution,20);communication=Math.max(0,communication-3)}
 if(outcome==="Closed — No Requester Response"){resolution=Math.max(resolution,Math.min(23,15+t.useful*2+(hadCorrect?4:0)));communication=Math.max(communication,18);efficiency=Math.max(efficiency,13)}
 if(outcome==="Resolved — Alternate Validation"){resolution=25;communication=Math.max(communication,18)}
 if(outcome==="Closed — Request Withdrawn"){resolution=Math.max(resolution,22);communication=Math.max(communication,18)}
 if(outcome==="Force Closed Unresolved"){resolution=0;communication=Math.max(0,communication-5);efficiency=Math.max(0,efficiency-2)}
 if(outcome==="Requester Account Deleted"){resolution=0;troubleshooting=0;communication=0;efficiency=0;security=0;documentation=0}
 if(outcome==="Ticket Record Deleted"){resolution=0;troubleshooting=0;communication=0;efficiency=0;security=0;documentation=0}
 let total=Math.round(resolution+troubleshooting+communication+efficiency+security+documentation);
 total=Math.max(0,total-(t.reopenPenalty||0));
 t.score=total;t.scoreBreakdown={resolution,troubleshooting,communication,efficiency,security,documentation};
 if(!state.freeplay&&!["Requester Account Deleted","Ticket Record Deleted"].includes(outcome)){registerBadClosure(t,outcome);registerCleanClosure(t,outcome)}
 const feedback=t.noCsat?{rating:null,text:outcome==="Closed — No Requester Response"?"No customer survey was collected because the ticket closed under the documented requester-inactivity policy.":outcome==="Resolved — Alternate Validation"?"Resolution was validated by an authorized alternate rather than the original requester.":"No customer survey was collected for this administrative closure."}:contextualizeCustomerFeedback(t,buildCustomerFeedback(t,outcome),outcome);t.customerRating=feedback.rating;t.customerFeedback=feedback.text;
 updateEmployeeAfterClosure(t,outcome,feedback);
 state.completed++;state.scoreSum+=total;
 if(state.freeplay){state.freeplayStats.completed++;state.freeplayStats.scoreSum+=total;state.freeplayStats.bestScore=Math.max(state.freeplayStats.bestScore||0,total)}
 else{state.career.tickets++;state.career.totalScore+=total}
 addMsg(t,"system",`${outcome}. Ticket score: ${total}/100. Root cause: ${c.label}.`,true);
 if(t.requesterAccountDeleted||t.deletedTicket||t.noCsat)addMsg(t,"system",`Customer feedback unavailable: ${feedback.text}`,true);
 else addMsg(t,"user",`Closure feedback (${feedback.rating}/5): ${feedback.text}`);
 const reopenPending=maybeScheduleReopen(t,outcome);
 if(opts.showReport!==false)showTicketReport(t);
 if(!opts.skipFinish)maybeFinishShift();
}
function ticketEvaluation(t){
 const b=t.scoreBreakdown,notes=[];
 if(b.troubleshooting>=20)notes.push("Strong diagnostic path.");
 else if(b.troubleshooting<12)notes.push("The root cause was not well established before action was taken.");
 if(b.efficiency<10)notes.push("Too many irrelevant or repeated steps reduced efficiency.");
 if(b.security<10)notes.push("Security practice needs attention.");
 if(b.documentation<5)notes.push(documentationEvaluationText(t));
 if(t.escalated&&getCause(t).escalation)notes.push("Escalation judgment was appropriate.");
 if(t.slaMissed)notes.push("The response target was missed.");
 if(t.professionalismHits&&!t.conductViolations)notes.push("Unprofessional language reduced the communication score and customer experience.");
 if(t.conductViolations)notes.push("Inappropriate communication caused a customer complaint and a major communication penalty.");
 if(t.forceClosed)notes.push("The ticket was force-closed; closure judgment affected the result.");
 if(t.requesterAccountDeleted)notes.push("The agent deleted/disabled the requester's account to prevent follow-up or reopening. This is severe administrative misconduct.");
 if(t.deletedTicket)notes.push("The agent deleted the ticket record to prevent reopening. This is severe records and audit misconduct.");
 if(t.reopenCount)notes.push(`This ticket reopened ${t.reopenCount} time(s), which reduced the final score.`);
 if(t.relatedChecked&&t.incidentKey)notes.push("Queue correlation was used to investigate a related incident.");
 if(t.specialistResolution)notes.push(`Specialist escalation was completed through ${esc(t.acceptedTeamId?supportTeam(t.acceptedTeamId)?.name:"a specialist queue")} and validated with the requester.`);
 if(t.wrongTeamAssignments)notes.push(`${t.wrongTeamAssignments} specialist assignment(s) were routed to the wrong queue.`);
 if(t.teamInfoReturns)notes.push(`${t.teamInfoReturns} escalation return(s) requested additional troubleshooting or documentation.`);
 if(t.specialistWeakHandoffs)notes.push(`${t.specialistWeakHandoffs} incomplete specialist handoff(s) were accepted only as a queue-capacity courtesy; routing quality still lost points.`);
 if(t.specialistExcellentHandoffs)notes.push(`${t.specialistExcellentHandoffs} specialist handoff(s) were graded Excellent and benefited from faster specialist handling.`);
 if(t.specialistAcceptedWithWarning)notes.push("A specialist accepted the handoff with a quality warning rather than rejecting it.");
 if(t.coworkerResolved)notes.push("A fellow Service Desk agent took ownership and resolved the ticket; the original handoff quality still affected your score.");
 if(t.coworkerDumpPoints)notes.push(`${t.coworkerDumpPoints} coworker dumping point${t.coworkerDumpPoints===1?" was":"s were"} recorded for weak or opportunistic ownership transfers.`);
 if(t.tradedFromCoworker)notes.push("This ticket entered your queue through a teammate ticket trade.");
 if(t.outcome==="Closed — No Requester Response")notes.push("Closure was legitimate under the requester-inactivity policy after documented contact attempts; technical confirmation was not required.");
 if(t.outcome==="Resolved — Alternate Validation")notes.push("Resolution was validated by an authorized alternate because the original requester was unavailable.");
 if(t.outcome==="Closed — Request Withdrawn")notes.push("The requester need was withdrawn through the supervisory response path, so administrative closure was appropriate.");
 if(t.userMadeWorse)notes.push("The requester changed the environment independently while waiting, requiring additional judgment.");
 if(t.approval?.required&&t.approval.verified)notes.push("The approval workflow was explicitly verified rather than relying only on the requester.");
 if(t.approvalWithdrawnAfterAction)notes.push("A required approval was withdrawn after execution, creating a governance review issue.");
 if(t.request){
   if(t.request.misclassifications)notes.push(`${t.request.misclassifications} request classification error${t.request.misclassifications===1?"":"s"} delayed fulfillment.`);
   if(t.request.kickbacks)notes.push(`${t.request.kickbacks} catalog intake/approval kickback${t.request.kickbacks===1?"":"s"} occurred.`);
   if(t.request.unauthorizedAttempts)notes.push("A direct fulfillment attempt was blocked because the catalog workflow was incomplete.");
   if(t.request.fulfilled)notes.push(`Catalog fulfillment completed through ${catalogItem(t.request.catalogId)?.name||"the service catalog"}.`);
 }
 const emp=getEmployee(t);if(emp?.lifetimeTickets>1)notes.push(`This was a repeat requester with an established support history (${relationshipTier(emp).label.toLowerCase()}).`);
 return notes.join(" ")||"A solid, appropriately handled service interaction.";
}
function showTicketReport(t){
 const b=t.scoreBreakdown;
 showModal(`
 <div class="mh"><h2>${esc(t.id)} — Ticket Score ${t.score}/100</h2><button class="secondary" onclick="hideModal()">Close</button></div>
 <div class="mb">
   <p><b>${esc(t.outcome)}</b> · Root cause: ${esc(getCause(t).label)}${t.request?` · Catalog: ${esc(catalogItem(t.request.catalogId)?.name||t.request.catalogId)}`:""}${t.reopenCount?` · Reopened ${t.reopenCount} time(s)`:""}</p>
   <div class="scorebars">${Object.entries(b).map(([k,v])=>`<div class="scoreline"><span>${k[0].toUpperCase()+k.slice(1)}</span><div class="bar"><i style="width:${(v/({resolution:25,troubleshooting:25,communication:20,efficiency:15,security:10,documentation:5}[k]))*100}%"></i></div><b>${v}</b></div>`).join("")}</div>
   <p style="font-size:12px;line-height:1.55;margin-top:16px">${esc(ticketEvaluation(t))}</p>
   <div class="feedback-card"><b>${t.noCsat?"Closure record":"Customer feedback"}</b>${t.noCsat?"":`<div class="feedback-stars">${"★".repeat(t.customerRating||0)}${"☆".repeat(5-(t.customerRating||0))}</div>`}${esc(t.customerFeedback||"No feedback recorded.")}</div>
   ${t.outcome==="Closed — No Requester Response"?`<div class="reopen-route"><b>If the requester reopens this later:</b><br>${t.reopenRouting==="shared"?"The ticket will enter the shared Service Desk queue and may be assigned to another agent.":"The ticket will return to your queue by default."}<div class="responseactions"><button class="${t.reopenRouting==="player"?"primary":"secondary"}" onclick="keepPolicyReopenWithMe('${t.id}')">Return Reopen to Me</button><button class="${t.reopenRouting==="shared"?"primary":"secondary"}" onclick="releasePolicyReopenToSharedQueue('${t.id}')">Release Reopen to Shared Queue</button></div></div>`:""}
 </div>`);
}
function showShiftReport(){
 if(state.stats?.shiftReportProcessed)return;
 const done=state.tickets.filter(t=>t.resolved);if(!done.length)return;
 state.stats.shiftReportProcessed=true;
 const avg=Math.round(done.reduce((a,t)=>a+t.score,0)/done.length);
 const successful=done.filter(t=>successfulClosureOutcome(t.outcome)).length;
 const missed=done.filter(t=>t.slaMissed).length,reopens=done.reduce((a,t)=>a+(t.reopenCount||0),0),majorCount=Object.keys(state.majorIncidents||{}).length;
 const shiftUsers=[...new Set(done.map(t=>t.userId).filter(Boolean))].map(id=>state.employees.find(e=>e.id===id)).filter(Boolean),repeatUsers=shiftUsers.filter(e=>e.lifetimeTickets>1).length;
 const avgRelationship=shiftUsers.length?Math.round(shiftUsers.reduce((a,e)=>a+e.satisfaction,0)/shiftUsers.length):0;
 const sec=Math.round(done.reduce((a,t)=>a+(t.scoreBreakdown?.security||0),0)/(done.length*10)*100),eff=Math.round(done.reduce((a,t)=>a+(t.scoreBreakdown?.efficiency||0),0)/(done.length*15)*100);
 const tech=Math.round(done.reduce((a,t)=>a+((t.scoreBreakdown?.resolution||0)+(t.scoreBreakdown?.troubleshooting||0)),0)/(done.length*50)*100),csatEligible=done.filter(t=>!t.noCsat),csat=Math.max(0,Math.min(100,csatEligible.length?Math.round(csatEligible.reduce((a,t)=>a+((t.customerRating||3)/5),0)/csatEligible.length*100):100));
 const rank=rankFor(avg,sec),review=evaluateSupervisorReview(done),sp=state.supervisor,careerUpdate=finalizeCareerShift(done,review);
 state.active=false;state.career.shifts++;saveState();
 const training=review.training?.length?`<div class="traininglist">${review.training.map(x=>`<span class="trainingchip">${esc(x)}</span>`).join("")}</div>`:"";
 const promotion=review.action==="promotion"?`<div class="promotioncard"><b>Promotion earned: ${esc(agentTitle())}</b><br>Your new title and increased responsibility now persist in the career record.</div>`:"";
 const objectives=careerUpdate.objectives?.length?`<div class="contextcard"><h4>Development Objectives</h4><div class="objectivegrid">${careerUpdate.objectives.map(careerObjectiveHtml).join("")}</div></div>`:"";
 const achievements=careerUpdate.achievements?.length?`<div class="careermilestone"><b>Career achievement${careerUpdate.achievements.length===1?"":"s"} unlocked</b><br>${careerUpdate.achievements.map(a=>esc(a.title)).join(" · ")}</div>`:"";
 const allObjectives=careerUpdate.objectives?.length&&careerUpdate.objectives.every(x=>x.complete)?`<div class="careerbonus"><b>All supervisor objectives completed.</b><br>Career XP and an additional recognition point were awarded.</div>`:"";
 showModal(`<div class="mh"><h2>${review.action==="terminated"?"Final Performance Review":"SuperService Shift Report"}</h2><button class="secondary" onclick="hideModal()">Close</button></div>
 <div class="mb"><div class="careerid">Career ${state.careerProfile.careerNumber} · Shift ${state.careerProfile.shifts} · ${esc(agentTitle())}</div><h3 style="margin:3px 0 0">${rank}</h3><div class="reportgrid">
 <div class="stat"><b>${done.length}</b><span>Tickets Completed</span></div><div class="stat"><b>${successful}</b><span>Resolved / Correct</span></div><div class="stat"><b>${missed}</b><span>SLA Missed</span></div><div class="stat"><b>${reopens}</b><span>Ticket Reopens</span></div>
 <div class="stat"><b>${majorCount}</b><span>Major Incidents</span></div><div class="stat"><b>${state.approvalStats?.approved||0}</b><span>Approvals Granted</span></div><div class="stat"><b>${state.teamStats?.resolutions||0}</b><span>Specialist Resolutions</span></div><div class="stat"><b>${state.teamStats?.kickbacks||0}</b><span>Team Returns</span></div>
 <div class="stat"><b>${state.teamStats?.mercyAccepts||0}</b><span>Courtesy Accepts</span></div><div class="stat"><b>${state.teamStats?.adviceReturns||0}</b><span>Helpful Returns</span></div><div class="stat"><b>${state.teamStats?.excellentHandoffs||0}</b><span>Excellent Handoffs</span></div><div class="stat"><b>${state.teamStats?.acceptedWithWarning||0}</b><span>Accepted w/ Warning</span></div><div class="stat"><b>${state.coworkerStats?.teammateResolutions||0}</b><span>Teammate Resolutions</span></div><div class="stat"><b>${state.coworkerStats?.trades||0}</b><span>Ticket Trades</span></div><div class="stat"><b>${state.coworkerStats?.returns||0}</b><span>Teammate Returns</span></div><div class="stat"><b>${state.coworkerStats?.supervisorInterventions||0}</b><span>Dumping Interventions</span></div><div class="stat"><b>${state.maliciousStats?.heat||0}</b><span>Misconduct Heat</span></div><div class="stat"><b>${state.maliciousStats?.shiftFindings||0}</b><span>Audit Findings</span></div><div class="stat"><b>${state.maliciousStats?.shiftEscapes||0}</b><span>Audit Escapes</span></div><div class="stat"><b>${state.maliciousStats?.extraTickets||0}</b><span>Misconduct Tickets</span></div><div class="stat"><b>${state.responseStats?.followups||0}</b><span>Requester Follow-Ups</span></div><div class="stat"><b>${state.responseStats?.accelerated||0}</b><span>Responses Accelerated</span></div><div class="stat"><b>${state.responseStats?.supervisorEscalations||0}</b><span>Supervisor Nudges</span></div><div class="stat"><b>${state.responseStats?.policyClosures||0}</b><span>Policy Closures</span></div>
 <div class="stat"><b>${state.worldStats?.activated||0}</b><span>World Events</span></div><div class="stat"><b>${state.worldStats?.eventTickets||0}</b><span>Event Tickets</span></div><div class="stat"><b>${state.worldStats?.correlations||0}</b><span>Event Correlations</span></div><div class="stat"><b>${repeatUsers}</b><span>Repeat Requesters</span></div>
 <div class="stat"><b>${review.metrics.requestCount}</b><span>Catalog Requests</span></div><div class="stat"><b>${state.requestStats?.fulfilled||0}</b><span>Requests Fulfilled</span></div><div class="stat"><b>${state.requestStats?.kickbacks||0}</b><span>Catalog Kickbacks</span></div><div class="stat"><b>${review.metrics.classificationAccuracy}%</b><span>Classification Accuracy</span></div>
 <div class="stat"><b>${avgRelationship}%</b><span>Requester Relationship</span></div><div class="stat"><b>${avg}</b><span>Average Ticket Score</span></div><div class="stat"><b>${csat}%</b><span>Customer Experience</span></div><div class="stat"><b>${sec}%</b><span>Security Score</span></div></div>
 <div class="scorebars"><div class="scoreline"><span>Technical Accuracy</span><div class="bar"><i style="width:${tech}%"></i></div><b>${tech}%</b></div><div class="scoreline"><span>Efficiency</span><div class="bar"><i style="width:${eff}%"></i></div><b>${eff}%</b></div></div>
 <p style="font-size:12px;line-height:1.55;margin-top:16px">${observations(done)}</p>
 <div class="reviewbanner ${supervisorBannerClass(review)}"><b>${esc(sp.name)} · ${esc(sp.title)} — ${esc(review.rating)} (${review.score}/100)</b><br>${esc(review.narrative)}${training}</div>${promotion}${objectives}${allObjectives}${achievements}
 <div class="reviewgrid"><div class="reviewmetric"><b>${review.metrics.fcr}%</b><span>FCR</span></div><div class="reviewmetric"><b>${review.metrics.reopenRate}%</b><span>Reopen Rate</span></div><div class="reviewmetric"><b>${review.metrics.sla}%</b><span>SLA</span></div><div class="reviewmetric"><b>${review.metrics.documentation}%</b><span>Documentation</span></div><div class="reviewmetric"><b>${review.metrics.closureQuality}%</b><span>Closure Quality</span></div><div class="reviewmetric"><b>${review.metrics.escalationQuality}%</b><span>Escalation</span></div><div class="reviewmetric"><b>${review.metrics.routingQuality}%</b><span>Routing</span></div><div class="reviewmetric"><b>${review.metrics.operationalAwareness}%</b><span>Ops Awareness</span></div><div class="reviewmetric"><b>${review.metrics.requestQuality}%</b><span>Request Quality</span></div><div class="reviewmetric"><b>${review.metrics.security}%</b><span>Security</span></div><div class="reviewmetric"><b>${review.metrics.queueControl}%</b><span>Queue Control</span></div></div></div>
 <div class="mf">${review.action==="terminated"?'<button class="secondary" onclick="showCareerCenter()">View Personnel File</button><button class="primary" onclick="restartCareer()">Start Over as a New Hire</button>':'<button class="secondary" onclick="showCareerCenter()">Career Center</button><button class="primary" onclick="hideModal();newShift()">Start Another Shift</button>'}</div>`);
}
function rankFor(avg,sec){
 if(avg<35)return "Access Revoked";
 if(avg<50)return "Have You Tried Rebooting?";
 if(avg<62)return "Ticket Reassignment Specialist";
 if(avg<72)return "Help Desk Trainee";
 if(avg<80)return "Service Desk Agent";
 if(avg<87)return "Senior Service Agent";
 if(avg<93)return "Troubleshooting Specialist";
 if(avg<97&&sec>=90)return "IT Support Wizard";
 return "SuperService Agent";
}
function observations(done){
 let securityBad=done.filter(t=>(t.scoreBreakdown?.security||10)<10).length;
 let noNotes=done.filter(t=>documentationPoints(t)===0).length;
 let needless=done.filter(t=>t.outcome==="Needlessly Escalated").length;
 let goodDiag=done.filter(t=>(t.scoreBreakdown?.troubleshooting||0)>=20).length;
 let complaints=done.filter(t=>t.complaint).length;
 const shiftEmp=[...new Set(done.map(t=>t.userId).filter(Boolean))].map(id=>state.employees.find(e=>e.id===id)).filter(Boolean);
 let repaired=shiftEmp.filter(e=>e.closureInteractions>1&&e.satisfaction>=70&&e.badClosures>0).length;
 let strained=shiftEmp.filter(e=>["wary","strained"].includes(relationshipTier(e).id)).length;
 const obs=[];
 if(!securityBad)obs.push("Excellent account and security discipline.");
 else obs.push(`${securityBad} ticket(s) included avoidable security risk.`);
 if(goodDiag>=Math.ceil(done.length/2))obs.push("Strong diagnostic questioning across the shift.");
 if(noNotes)obs.push(`${noNotes} ticket(s) had almost no useful documentation in either the activity trail or internal notes.`);
 if(needless)obs.push(`You escalated ${needless} issue(s) that could have been handled at the desk.`);
 const wrongRoutes=done.reduce((a,t)=>a+(t.wrongTeamAssignments||0),0),infoReturns=done.reduce((a,t)=>a+(t.teamInfoReturns||0),0);
 if(wrongRoutes)obs.push(`${wrongRoutes} specialist assignment(s) went to the wrong queue.`);
 if(infoReturns)obs.push(`${infoReturns} specialist handoff(s) were returned for missing information.`);
 const weakAccepted=done.reduce((a,t)=>a+(t.specialistWeakHandoffs||0),0),excellentHandoffs=done.reduce((a,t)=>a+(t.specialistExcellentHandoffs||0),0);
 if(weakAccepted)obs.push(`${weakAccepted} incomplete handoff${weakAccepted===1?" was":"s were"} accepted as a specialist courtesy rather than returned.`);
 if(excellentHandoffs)obs.push(`${excellentHandoffs} specialist handoff${excellentHandoffs===1?" earned":"s earned"} an Excellent grade.`);
 const coworkerResolved=done.filter(t=>t.coworkerResolved).length,coworkerDumps=done.reduce((a,t)=>a+(t.coworkerDumpPoints||0),0);
 if(coworkerResolved)obs.push(`${coworkerResolved} ticket${coworkerResolved===1?" was":"s were"} resolved after ownership transferred to another Service Desk agent.`);
 if(coworkerDumps)obs.push(`${coworkerDumps} teammate dumping point${coworkerDumps===1?"":"s"} reduced queue-control performance.`);
 const requestTickets=done.filter(t=>t.request),requestKickbacks=requestTickets.reduce((a,t)=>a+(t.request?.kickbacks||0),0),misclassified=requestTickets.filter(t=>(t.request?.misclassifications||0)>0).length;
 if(requestTickets.length)obs.push(`${requestTickets.length} catalog request${requestTickets.length===1?" was":"s were"} handled during the shift.`);
 if(misclassified)obs.push(`${misclassified} request${misclassified===1?" was":"s were"} initially misclassified.`);
 if(requestKickbacks)obs.push(`${requestKickbacks} catalog intake/approval kickback${requestKickbacks===1?" occurred":"s occurred"}.`);
 const worldTickets=done.filter(t=>t.worldGenerated),isolated=worldTickets.filter(t=>!t.relatedChecked&&!t.worldContextSeen&&!majorFor(t)).length;
 if(worldTickets.length)obs.push(`${worldTickets.length} ticket(s) were generated by organization-wide operational events.`);
 if(isolated)obs.push(`${isolated} event-driven ticket(s) were handled without recognizing the broader operational context.`);
 if(complaints)obs.push(`${complaints} ticket(s) generated a customer conduct complaint.`);
 if(repaired)obs.push(`${repaired} previously difficult requester relationship${repaired===1?"":"s"} currently look healthier.`);
 if(strained)obs.push(`${strained} requester relationship${strained===1?" remains":"s remain"} wary or strained.`);
 return obs.join(" ");
}
let modalReturnFocus=null;
function modalFocusable(root){
 return [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.closest?.(".hidden"));
}
function showModal(inner){
 const back=document.getElementById("genericModal"),card=document.getElementById("genericModalCard");
 modalReturnFocus=document.activeElement&&document.activeElement!==document.body?document.activeElement:null;
 card.innerHTML=inner;back.classList.remove("hidden");back.setAttribute("aria-hidden","false");
 const title=card.querySelector("h2");if(title){title.id="genericModalTitle";back.setAttribute("aria-labelledby","genericModalTitle")}else{back.removeAttribute("aria-labelledby");back.setAttribute("aria-label","SuperService dialog")}
 const first=modalFocusable(card)[0];(first||card).focus?.();
}
function hideModal(){
 if(auditRaceSession&&!auditRaceSession.finished){auditRaceConcede();return}
 if(typingTimer){clearInterval(typingTimer);typingTimer=null}
 if(auditRaceTimer){clearInterval(auditRaceTimer);auditRaceTimer=null}
 const back=document.getElementById("genericModal");back.classList.add("hidden");back.setAttribute("aria-hidden","true");
 const target=modalReturnFocus;modalReturnFocus=null;target?.focus?.();
}
window.hideModal=hideModal;window.newShift=newShift;

function renderAll(){renderTop();renderQueue();renderTicket();renderTab()}
function renderTop(){
 document.getElementById("shiftLabel").textContent=state.active?(state.freeplay?`Freeplay • ${state.difficulty}`:`W${careerWeekNumber()} ${careerDayName().slice(0,3)} • ${state.difficulty}`):"No active shift";
 document.getElementById("clockLabel").textContent=fmtTime(state.clock);
 document.getElementById("ticketCountLabel").textContent=`${state.tickets.filter(t=>!t.resolved).length} active`;
 document.getElementById("scoreLabel").textContent=state.completed?`Avg ${Math.round(state.scoreSum/state.completed)}`:"Score —";
 const conduct=document.getElementById("conductLabel"),dc=state.discipline||defaultState().discipline;
 const perf=document.getElementById("performanceLabel"),pc=state.performance||defaultState().performance;
 const sup=document.getElementById("supervisorLabel"),sp=state.supervisor||defaultState().supervisor;
 const wl=document.getElementById("worldLabel");
 if(state.freeplay){
   conduct.textContent="Practice conduct";conduct.classList.remove("warn","danger");
   perf.textContent="No career impact";perf.classList.remove("warn","danger");
   sup.textContent="Freeplay";sup.classList.remove("warn","danger");
   wl.textContent="World events off";wl.classList.remove("warn","danger");
 }else{
   const ms=state.maliciousStats||defaultState().maliciousStats;
   conduct.textContent=dc.warningIssued?"FINAL WARNING":ms.stage>=4?"MISCONDUCT FINAL":ms.stage>=3?"MISCONDUCT PIP":ms.stage>=2?`Misconduct coaching · ${ms.heat}`:ms.stage>=1?`Conduct warning · ${ms.heat}`:dc.complaintTickets?`Conduct ${dc.complaintTickets}/3`:ms.heat?`Audit heat ${ms.heat}`:"Conduct clear";
   conduct.classList.toggle("warn",(dc.complaintTickets>0&&!dc.warningIssued)||(ms.stage>0&&ms.stage<3)||(ms.heat>=15&&ms.stage===0));conduct.classList.toggle("danger",dc.warningIssued||ms.stage>=3);
   perf.textContent=pc.pip?"CLOSURE PIP":pc.coached?"Closure coaching":pc.closurePoints?`Closure risk ${pc.closurePoints}`:"Closures clear";
   perf.classList.toggle("warn",pc.coached&&!pc.pip);perf.classList.toggle("danger",pc.pip);
   sup.textContent=supervisorStanding();sup.classList.toggle("warn",sp.coaching&&!sp.pip);sup.classList.toggle("danger",sp.pip||sp.terminatedForPerformance);
   wl.textContent=worldStatusLabel();wl.classList.toggle("warn",activeWorldEvents().length>0);wl.classList.toggle("danger",activeWorldEvents().some(e=>e.severity==="Critical"&&(e.known||e.discovered)));
 }
 document.getElementById("queueSummary").textContent=state.active?(state.freeplay?`Freeplay · ${state.completed} solved`:`${state.completed} completed`):"Idle";
}

function ticketStatusDotClass(t){
 if(t.resolved)return "closed";
 if(t.slaMissed||t.priority==="Critical")return "alert";
 if(t.waiting||String(t.status).includes("Waiting")||String(t.status).includes("Pending"))return "waiting";
 return "active";
}
function ticketAriaLabel(t){
 const unread=t.unread?`, ${t.unread} unread message${t.unread===1?"":"s"}`:"";
 return `${t.id}, ${t.priority} priority, ${t.subject}, requester ${t.user}, ${t.status}${unread}`;
}
function selectTicket(id,focusRow=false){
 state.selected=id;
 const t=getTicket();if(t)t.unread=0;
 saveState();renderAll();
 if(focusRow){
   const row=[...document.querySelectorAll(".ticketrow")].find(r=>r.dataset.id===id);
   row?.focus();
 }
 if(t?.resolved&&!t.deletedTicket)showTicketReport(t);
}

function renderQueue(){
 const el=document.getElementById("ticketList");
 if(!state.tickets.length){el.innerHTML=state.freeplay?'<div class="freeplayempty"><b>Your Freeplay desk is empty.</b><span>Add any ticket when you are ready to practice.</span><button class="primary" type="button" onclick="showFreeplayTicketPicker()">Add a Ticket</button></div>':'<div class="empty">No tickets in the queue.</div>';el.setAttribute("aria-label","Ticket queue, empty");return}
 const visible=state.tickets.filter(t=>!t.deletedTicket).filter(t=>!ticketFilter||`${t.id} ${t.subject} ${t.user} ${t.department} ${t.category}`.toLowerCase().includes(ticketFilter));
 el.setAttribute("aria-label",`Ticket queue, ${visible.length} visible ticket${visible.length===1?"":"s"}`);
 if(!visible.length){el.innerHTML=`<div class="empty">${ticketFilter?"No tickets match your search.":state.tickets.some(t=>t.deletedTicket)?"No visible tickets remain in the queue. Deleted ticket records are retained only as hidden audit tombstones.":"No tickets in the queue."}</div>`;return}
 el.innerHTML=visible.map(t=>`<div class="ticketrow ${t.resolved?"completed":""} ${t.ownerAgentId!=="player"?"coworker-owned":t.sharedQueue?"shared-owned":""} ${state.selected===t.id?"active":""}" data-id="${t.id}" role="option" tabindex="${state.selected===t.id?0:-1}" aria-selected="${state.selected===t.id?"true":"false"}" aria-label="${esc(ticketAriaLabel(t))}">
 <div class="ticketline"><span class="ticketno">${esc(t.id)}${t.resolved?'<span class="completecheck" aria-label="Completed">✓</span>':""}</span>${t.unread?`<span class="unread" aria-label="${t.unread} unread">${t.unread}</span>`:""}</div>
 <div class="subject">${esc(t.subject)}</div>
 <div class="ticketline"><span class="tmeta"><i class="dot ${t.priority.toLowerCase()}" aria-hidden="true"></i>${t.priority} · ${esc(t.user)}</span><span class="tmeta statusmini">${esc(t.status)}</span></div></div>`).join("");
 const rows=[...el.querySelectorAll(".ticketrow")];
 rows.forEach((r,index)=>{
   r.onclick=()=>selectTicket(r.dataset.id,false);
   r.onkeydown=e=>{
     if(e.key==="Enter"||e.key===" "){e.preventDefault();selectTicket(r.dataset.id,true);return}
     if(e.key==="ArrowDown"||e.key==="ArrowUp"){
       e.preventDefault();
       const next=Math.max(0,Math.min(rows.length-1,index+(e.key==="ArrowDown"?1:-1)));
       selectTicket(rows[next].dataset.id,true);
     }else if(e.key==="Home"){e.preventDefault();selectTicket(rows[0].dataset.id,true)}
     else if(e.key==="End"){e.preventDefault();selectTicket(rows[rows.length-1].dataset.id,true)}
   };
 });
}


function directAddressPhrase(text){
 return String(text||"")
   .replace(/\bthe requester's\b/gi,"your").replace(/\bthe requester\b/gi,"you")
   .replace(/\bthe user's\b/gi,"your").replace(/\bthe user\b/gi,"you")
   .replace(/\bthey are\b/gi,"you are").replace(/\bthey were\b/gi,"you were").replace(/\bthey have\b/gi,"you have").replace(/\bthey can\b/gi,"you can")
   .replace(/\btheir\b/gi,"your").replace(/\bthem\b/gi,"you").replace(/\bthey\b/gi,"you");
}
function sentenceCaseLower(text){const x=String(text||"").trim();return x?x[0].toLowerCase()+x.slice(1):x}
function punctuate(text,mark="."){const x=String(text||"").trim();return /[.!?]$/.test(x)?x:x+mark}
function agentChatForAction(label,mode="diagnostic",t=null){
 const original=String(label||"").trim(),raw=directAddressPhrase(original);
 let m;
 if(mode==="resolution")return resolutionFollowupAgentText(t);
 if((m=raw.match(/^Ask whether (.+)$/i)))return punctuate(`Can you confirm whether ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask you to (.+)$/i)))return punctuate(`Could you ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask for (.+)$/i)))return punctuate(`Can you provide ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask what (.+)$/i)))return punctuate(`Can you tell me what ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask when (.+)$/i)))return punctuate(`Can you tell me when ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask where (.+)$/i)))return punctuate(`Can you tell me where ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask who (.+)$/i)))return punctuate(`Can you tell me who ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask how (.+)$/i)))return punctuate(`Can you tell me how ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask about (.+)$/i)))return punctuate(`Can you tell me about ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask which (.+)$/i)))return punctuate(`Can you tell me which ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask if (.+)$/i)))return punctuate(`Can you confirm if ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask why (.+)$/i)))return punctuate(`Can you explain why ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask exact (.+)$/i)))return punctuate(`What is the exact ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask current (.+)$/i)))return punctuate(`What is the current ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask last known (.+)$/i)))return punctuate(`What is the last known ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask required (.+)$/i)))return punctuate(`Can you tell me what ${sentenceCaseLower(m[1])} is required`,"?");
 if((m=raw.match(/^Ask reason for (.+)$/i)))return punctuate(`What is the reason for ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask (?:business )?purpose(?: of)?(.*)$/i)))return punctuate(`Can you explain the ${/^Ask business/i.test(raw)?"business ":""}purpose${m[1]||""}`,"?");
 if((m=raw.match(/^Ask age of (.+)$/i)))return punctuate(`Can you tell me the age of ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Ask (.+)$/i)))return punctuate(`Can you tell me about ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Confirm whether (.+)$/i)))return punctuate(`Can you confirm whether ${sentenceCaseLower(m[1])}`,"?");
 if((m=raw.match(/^Confirm (.+)$/i)))return punctuate(`Can you confirm ${sentenceCaseLower(m[1])}`,"?");
 if(mode==="diagnostic"){
   if((m=raw.match(/^Request reporting through (.+)$/i)))return punctuate(`Please report this through ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Request (.+)$/i)))return punctuate(`Can you provide ${sentenceCaseLower(m[1])}`,"?");
   if((m=raw.match(/^Check (.+)$/i)))return punctuate(`I'm checking ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Verify (.+)$/i)))return punctuate(`I'm verifying ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Compare (.+)$/i)))return punctuate(`I'm comparing ${sentenceCaseLower(m[1])}`);
 }
 if(mode==="bad"){
   if((m=raw.match(/^Tell you to (.+)$/i)))return punctuate(`Please ${sentenceCaseLower(m[1])}`);
   if(/^Tell you not to worry$/i.test(raw))return "Don't worry about it.";
   if((m=raw.match(/^Tell everyone to (.+)$/i)))return punctuate(`Everyone should ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Tell you (.+)$/i)))return punctuate(`I'm telling you ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Have you (.+)$/i)))return punctuate(`Please ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Give you (.+)$/i)))return punctuate(`I'm giving you ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Close the ticket and ask you to (.+)$/i)))return punctuate(`I'm going to close the ticket; please ${sentenceCaseLower(m[1])}`);
 }
 if(mode==="fix"){
   if((m=raw.match(/^Tell you to (.+)$/i)))return punctuate(`Please ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Tell you (.+)$/i)))return punctuate(sentenceCaseLower(m[1]));
   if((m=raw.match(/^Tell everyone to (.+)$/i)))return punctuate(`Everyone should ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Use (.+)$/i)))return punctuate(`Please use ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Open (.+)$/i)))return punctuate(`Please open ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^Follow (.+)$/i)))return punctuate(`Please follow ${sentenceCaseLower(m[1])}`);
   if((m=raw.match(/^(Escalate|Refer|Route) (.+)$/i)))return punctuate(`I'm ${m[1].toLowerCase()==="escalate"?"escalating":m[1].toLowerCase()==="refer"?"referring":"routing"} this ${sentenceCaseLower(m[2])}`);
   if((m=raw.match(/^Request (.+)$/i)))return punctuate(`I'll request ${sentenceCaseLower(m[1])}`);
   return punctuate(`I'll ${sentenceCaseLower(raw)}`);
 }
 return punctuate(raw);
}
function resolutionFollowupAgentText(t){
 if(t?.specialistResolution)return rand([
   "Could you test it again and let me know whether the specialist fix resolved the issue?",
   "The specialist work is complete. Can you test it now and confirm whether everything is working?",
   "Can you give it another try and let me know if the specialist fix took care of the problem?"
 ]);
 if(t?.request?.fulfilled)return rand([
   "The request has been fulfilled. Can you test the access or service and confirm everything is working as expected?",
   "Can you verify that the completed request is working correctly on your side?",
   "The fulfillment is complete. Could you check it now and let me know if everything looks right?"
 ]);
 if(t?.actions?.includes("correct-action"))return rand([
   "Can you test it again and let me know if the issue is resolved now?",
   "Could you try it again and confirm whether everything is working normally?",
   "Please give it another try. Is the problem resolved on your side now?"
 ]);
 return rand(["Is the issue resolved now?","Can you test it again and tell me whether the problem is still happening?"]);
}

function resolutionFollowupReady(t){
 if(!t||t.resolved)return false;
 if(state.pending.some(p=>p.ticketId===t.id&&p.confirm))return false;
 return !!t.resolutionFollowupReady||t.specialistResolution===true;
}
function resolutionFollowupLabel(t){
 if(t.specialistResolution)return "Ask requester to test and confirm the specialist fix";
 if(t.actions.includes("correct-action"))return "Ask requester to test and confirm the issue is resolved";
 return "Ask whether the issue is resolved now";
}
function injectResolutionFollowupOption(opts,t){
 if(!resolutionFollowupReady(t)||opts.some(o=>o.type==="r"))return opts;
 opts.push({key:"r:confirm",type:"r",id:"confirm",label:resolutionFollowupLabel(t),kind:""});
 return opts;
}
function doResolutionFollowup(label=null,messageAlreadyAdded=false){
 const t=getTicket();if(!t||t.resolved)return;
 const text=resolutionFollowupAgentText(t);
 if(!messageAlreadyAdded){advanceTime(2);t.publicCount++;t.actions.push("resolution-followup");addMsg(t,"agent",text)}
 else t.actions.push("resolution-followup-free");
 if(!resolutionFollowupReady(t)){
   t.irrelevant+=.5;scheduleReply(t,rand(["Not yet — I'm still seeing the issue.","No, it is still happening.","It still isn't working on my end."]));saveState();renderAll();return;
 }
 t.resolutionFollowupReady=false;t.status="Waiting for User";t.waiting=true;
 scheduleReply(t,confirmationText(t),personalityDelay(t,"confirmation"),true);
 saveState();renderAll();
}
window.doResolutionFollowup=doResolutionFollowup;

function renderTicket(){
 const t=getTicket(),d=document.getElementById("ticketDetail"),c=document.getElementById("conversation"),q=document.getElementById("quickActions"),comp=document.getElementById("composer");
 if(t?.approval)syncApprovalSummary(t);
 if(!t){d.innerHTML="";c.innerHTML='<div class="empty"><div><b>SuperService</b><br>Start a shift to begin working tickets.</div></div>';q.innerHTML="";comp.classList.add("hidden");return}
 comp.classList.remove("hidden");
 d.innerHTML=`<div class="detailtop"><div><h1>${esc(t.subject)}</h1><div class="small">${esc(t.id)} · Opened ${fmtTime(t.opened)} · ${esc(t.user)} · ${esc(t.department)}</div>
 <div class="tags"><span class="tag ${t.priority.toLowerCase()}">${t.priority} priority</span><span class="tag typebadge ${t.request?"requestbadge":""}">${esc(requestTypeDisplay(t))}</span>${state.freeplay?'<span class="tag freeplaytag">Freeplay</span>':""}<span class="tag">${esc(t.category)}</span><span class="tag">${esc(getPerson(t).name)}</span><span class="tag userbadge">${esc(relationshipTier(getEmployee(t)).label)}</span><span class="tag ${t.slaMissed?"requestbad":""}">${t.request?"Fulfillment target":"SLA"} ${t.slaMissed?"MISSED":(t.request?requestSlaRemaining(t):Math.max(0,slaFor(t.priority)-(state.clock-t.opened)))+" min"}</span>${t.reopenCount?`<span class="tag reopenbadge">Reopened ×${t.reopenCount}</span>`:""}${t.approval?.required?`<span class="tag">Approval ${t.approval.approved?"APPROVED":t.approval.denied?"DENIED":t.approval.pending?"PENDING":(t.approval.stages||[]).some(x=>x.status==="withdrawn")?"WITHDRAWN":"REQUIRED"}</span>`:""}${activeMajorFor(t)?`<span class="tag">${activeMajorFor(t).id}</span>`:""}${t.specialAssignment?'<span class="tag userbadge">Supervisor Assignment</span>':""}${t.assignmentQueue&&t.assignmentQueue!=="Service Desk"?`<span class="tag">Queue: ${esc(t.assignmentQueue)}</span>`:""}${t.worldEventId?`<span class="tag worldtag">${esc(t.worldEventId)}</span>`:""}${t.vipTicket?'<span class="tag viptag">VIP</span>':""}</div></div>
 <div class="ticketstatus" role="status"><span class="statusdot ${ticketStatusDotClass(t)}" aria-hidden="true"></span><div><strong>${esc(t.status)}</strong>${t.score!=null?`<div class="small">Score ${t.score}/100</div>`:""}</div></div></div>`;
 c.innerHTML=t.conversation.map(m=>`<div class="msg ${m.who==="requesterSupervisor"?"supervisormsg":m.who}"><div class="bubble">${esc(m.text)}</div><div class="msgmeta">${m.who==="user"?esc(t.user):m.who==="agent"?"You":m.who==="specialist"?`${esc(m.specialist||"Specialist")} · ${esc(m.teamName||"Specialist Team")} (Internal)`:m.who==="coworker"?`${esc(m.coworker||"Service Desk teammate")} · Service Desk (Internal)`:m.who==="requesterSupervisor"?`${esc(m.supervisor||"Requester supervisor")} · Supervisor (Internal)`:"System"} · ${m.time}</div></div>`).join("");
 c.scrollTop=c.scrollHeight;
 const s=getScenario(t);
 if(t.resolved){q.innerHTML=`<button class="secondary" onclick="showTicketReport(state.tickets.find(x=>x.id==='${t.id}'))">View Score</button>`;document.getElementById("publicReply").disabled=true;document.getElementById("sendReplyBtn").disabled=true;return}
 if(t.ownerAgentId!=="player"||t.sharedQueue){
   const cw=coworkerById(t.ownerAgentId);
   q.innerHTML=`<div class="coworkerowner"><b>${t.sharedQueue?"Shared Service Desk queue":cw?`Owned by ${esc(cw.name)}`:"Teammate ownership pending"}</b><br>You cannot work the ticket while another owner has it.<div class="requestbuttons"><button class="secondary" onclick="recallFromCoworker()">Recall to My Queue</button></div></div>`;
   document.getElementById("publicReply").disabled=true;document.getElementById("sendReplyBtn").disabled=true;return;
 }
 document.getElementById("publicReply").disabled=false;document.getElementById("sendReplyBtn").disabled=false;
 let opts=[
   ...s.diagnostics.map(a=>({key:"q:"+a[0],type:"q",id:a[0],label:a[1],kind:""})),
   ...s.fixes.map(a=>({key:"f:"+a[0],type:"f",id:a[0],label:a[1],kind:a[2]||""})),
   ...(t.badDiagnostics||[]).map(id=>{const x=BAD_DIAGNOSTICS.find(o=>o.id===id);return x?{key:"b:"+id,type:"b",id,label:x.label,kind:x.severity||""}:null}).filter(Boolean)
 ];
 if(clarificationNeeded(t)){
   const cp=clarificationProfile(t),cs=clarificationState(t);
   if(cs.level===0)opts.push({key:"c:primary",type:"c",id:"primary",label:cp.prompt,kind:""});
   else opts.push({key:"c:followup",type:"c",id:"followup",label:"Ask them to check the window title, URL, shortcut, or About screen for the exact name",kind:""});
 }
 if(t.request?.classificationVerified){
   const missingRequest=requestMissingFields(t);
   if(missingRequest.length){const rf=missingRequest[0];opts.push({key:"rf:"+rf.key,type:"rf",id:rf.key,label:REQUEST_FIELD_DEFS[rf.key]?.ask||`Ask for ${rf.label}`,kind:""})}
 }
 if(t.approval?.required&&!s.diagnostics.some(a=>a[0]==="approvalq"))opts.push({key:"q:approvalq",type:"q",id:"approvalq",label:"Ask what approvals are already documented",kind:""});
 if(t.approval?.required&&!t.approval.approved&&!t.approval.denied&&!t.approval.pending&&!s.fixes.some(a=>a[0]==="requestapproval"))opts.push({key:"f:requestapproval",type:"f",id:"requestapproval",label:"Request next required approval",kind:""});
 if(t.approval?.emergencyEligible&&!t.approval.approved&&t.approval.emergencyStatus!=="pending"&&!s.fixes.some(a=>a[0]==="emergencyexception"))opts.push({key:"f:emergencyexception",type:"f",id:"emergencyexception",label:"Request emergency exception",kind:""});
 if(t.approval?.denied)opts.push({key:"f:denyrequest",type:"f",id:"denyrequest",label:"Close request — required approval was denied",kind:""});
 if(activeMajorFor(t))opts.push({key:"f:linkincident",type:"f",id:"linkincident",label:`Link ticket to ${activeMajorFor(t).id} major incident`,kind:""});
 opts=injectResolutionFollowupOption(opts,t);
 const investigation=opts.filter(o=>["q","c","rf"].includes(o.type));
 const actions=opts.filter(o=>!["q","c","rf"].includes(o.type));
 const optionRank=o=>{
   const suggested=(o.type==="q"&&(t.specialistSuggestedDiagnostic===o.id||t.coworkerSuggestedDiagnostic===o.id))||(o.type==="f"&&(t.specialistSuggestedFix===o.id||t.coworkerSuggestedFix===o.id));
   const completed=(o.type==="q"&&(t.facts.includes(o.id)||(t.proactiveFacts||[]).includes(o.id)))||(o.type==="f"&&t.actions.includes("fix:"+o.id));
   return (suggested?-1000000:0)+(completed?500000:0)+stableRank(t.id+o.key);
 };
 investigation.sort((a,b)=>optionRank(a)-optionRank(b));actions.sort((a,b)=>optionRank(a)-optionRank(b));
 const optionHtml=o=>{
   const suggested=(o.type==="q"&&(t.specialistSuggestedDiagnostic===o.id||t.coworkerSuggestedDiagnostic===o.id))||(o.type==="f"&&(t.specialistSuggestedFix===o.id||t.coworkerSuggestedFix===o.id));
   const completed=(o.type==="q"&&(t.facts.includes(o.id)||(t.proactiveFacts||[]).includes(o.id)))||(o.type==="f"&&t.actions.includes("fix:"+o.id));
   const cls=["actionbtn",completed?"completed-action":"",suggested?"specialist-suggested":"",o.type==="b"?"risky-action":"",o.type==="r"?"resolution-action":""].filter(Boolean).join(" ");
   return `<button class="${cls}" type="button" data-type="${o.type}" data-id="${o.id}" data-kind="${esc(o.kind||"")}" data-label="${esc(o.label)}" aria-label="${esc(o.label)}">${esc(o.label)}</button>`;
 };
 const suggestionLabel=t.coworkerSuggestedDiagnostic?(s.diagnostics.find(d=>d[0]===t.coworkerSuggestedDiagnostic)?.[1]||"the suggested diagnostic"):t.coworkerSuggestedFix?(s.fixes.find(f=>f[0]===t.coworkerSuggestedFix)?.[1]||"the suggested action"):t.specialistSuggestedDiagnostic?(s.diagnostics.find(d=>d[0]===t.specialistSuggestedDiagnostic)?.[1]||"the suggested diagnostic"):t.specialistSuggestedFix?(s.fixes.find(f=>f[0]===t.specialistSuggestedFix)?.[1]||"the suggested action"):null;
 const suggestionSource=(t.coworkerSuggestedDiagnostic||t.coworkerSuggestedFix)?"Teammate suggestion":"Specialist suggestion";
 q.innerHTML=`${responsePolicyPanel(t,true)}${suggestionLabel?`<div class="specialisthint"><b>${suggestionSource}</b><br>${esc(suggestionLabel)} — this recommendation is highlighted below.</div>`:""}
 <div class="actionrow"><div class="actionrowlabel">Investigate</div><div class="actionscroll" role="group" aria-label="Investigation actions">${investigation.map(optionHtml).join("")}</div></div>
 <div class="actionrow"><div class="actionrowlabel">Actions / Risk</div><div class="actionscroll" role="group" aria-label="Solutions and other actions">${actions.map(optionHtml).join("")}</div></div>`;
 q.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{
   const label=b.dataset.label||b.textContent;
   if(b.dataset.type==="q")doDiagnostic(b.dataset.id,label);
   else if(b.dataset.type==="rf"){addMsg(t,"agent",agentChatForAction(label,"diagnostic",t));collectRequestField(t,b.dataset.id,true)}
   else if(b.dataset.type==="r")doResolutionFollowup(label);
   else if(b.dataset.type==="c")doClarification(b.dataset.id==="followup",label);
   else if(b.dataset.type==="b")doBadDiagnostic(b.dataset.id,label);
   else doFix(b.dataset.id,label,b.dataset.kind);
 });
}
function approvalStatusLabel(t){
 if(!t?.approval)return "No approval required";
 syncApprovalSummary(t);
 if(t.approval.approved)return t.approval.emergencyStatus==="approved"?"Emergency exception approved":"Fully approved";
 if(t.approval.denied)return approvalHasConflict(t)?"Conflicting approvals / denied":"Denied";
 if(t.approval.pending)return "Pending";
 if((t.approval.stages||[]).some(x=>x.status==="withdrawn"))return "Approval withdrawn";
 return "Approval required";
}
function renderApprovalsTab(body,t){
 if(!t){body.innerHTML='<div class="empty">Select a ticket.</div>';return}
 if(!t.approval?.required){
   body.innerHTML=`<div class="contextgrid"><div class="approvalhead"><b>No formal approval chain required.</b><br>This does not mean the requester automatically has authority for unrelated or out-of-scope actions.</div><div class="contextcard"><h4>Relevant Organizational Actors</h4><div class="actorgrid">${Object.values(t.actors||{}).slice(0,8).map(a=>`<div class="actorcard"><b>${esc(a.role)}</b><br>${esc(a.name)}<br><span class="small">${esc(a.team)}</span></div>`).join("")}</div></div></div>`;return;
 }
 syncApprovalSummary(t);
 const a=t.approval,current=currentApprovalStage(t);
 const stages=(a.stages||[]).map(st=>`<div class="approvalstage ${esc(st.status)} ${current?.id===st.id?"current":""}">
   <div class="approvalrow"><div><div class="approvaltitle">${st.order}. ${esc(st.role)}</div><div class="approvalactor">${esc(st.actorName)} · ${esc(st.team)}${st.delegatedFrom?`<br>Delegated from ${esc(st.delegatedFrom)}`:""}</div></div><span class="astatus ${esc(st.status)}">${esc(st.status)}</span></div>
   ${st.wrongClaim&&st.status==="required"?'<div class="orgwarning">Requester may believe a lower-level or incorrect approval already counts. Verify the workflow rather than relying on the claim.</div>':""}
 </div>`).join("");
 const hist=(a.history||[]).slice().reverse().map(h=>`<div class="timelineitem"><b>${esc(h.time)} · ${esc(h.action)}</b><br>${esc(h.actor)} (${esc(h.role)})${h.note?`<br>${esc(h.note)}`:""}</div>`).join("")||'<div class="small">No approval events yet.</div>';
 body.innerHTML=`<div class="approvalflow">
   <div class="approvalhead"><b>${esc(a.flowId)} · ${esc(approvalStatusLabel(t))}</b><br>${(a.stages||[]).length} required approval stage(s).${a.emergencyEligible?" An emergency-exception path exists for qualifying circumstances.":""}</div>
   ${stages}
   <div class="approvalactions">
     <button class="secondary" id="verifyApprovalBtn">Verify Workflow</button>
     <button class="primary" id="nextApprovalBtn" ${a.approved||a.denied||a.pending?"disabled":""}>Request Next Approval</button>
     ${a.emergencyEligible?`<button class="secondary" id="emergencyApprovalBtn" ${a.emergencyStatus==="pending"||a.approved?"disabled":""}>Request Emergency Exception</button>`:""}
     ${a.denied?'<button class="danger" id="denyApprovalBtn">Close as Denied</button>':""}
   </div>
   ${approvalHasConflict(t)?'<div class="orgwarning"><b>Conflicting authority:</b> one required approver approved while another denied. A higher title does not automatically override the controlling Data/Application/Security/Privacy/Records authority.</div>':""}
   <div class="contextcard"><h4>Approval History</h4><div class="timeline">${hist}</div></div>
   <div class="contextcard"><h4>Approval Actors</h4><div class="actorgrid">${(a.stages||[]).map(st=>`<div class="actorcard"><b>${esc(st.role)}</b><br>${esc(st.actorName)}<br><span class="small">${esc(st.team)}</span></div>`).join("")}</div></div>
 </div>`;
 document.getElementById("verifyApprovalBtn").onclick=()=>verifyApprovalWorkflow(t);
 const nb=document.getElementById("nextApprovalBtn");if(nb)nb.onclick=()=>requestNextApproval(t);
 const eb=document.getElementById("emergencyApprovalBtn");if(eb)eb.onclick=()=>requestEmergencyException(t);
 const db=document.getElementById("denyApprovalBtn");if(db)db.onclick=()=>doFix("denyrequest","Close request — required approval was denied","");
}


function renderRequestTab(body,t){
 if(!t){body.innerHTML='<div class="empty">Select a ticket.</div>';return}
 if(!t.request){
   body.innerHTML=`<div class="requesthero"><h4>No catalog request workflow attached</h4>This ticket is currently handled as <b>${esc(t.ticketType||"Incident")}</b>. Troubleshoot the reported failure normally; the catalog is for fulfillment of requested services, access, software, hardware, data, and controlled changes.</div>`;
   return;
 }
 const r=t.request,item=catalogItem(r.catalogId),missing=requestMissingFields(t),approval=t.approval;
 const eligibilityClass=r.eligibility==="blocked"?"requestbad":r.eligibility==="review"?"requestwarn":"requestgood";
 const approvalText=!approval?.required?"No separate approval required":approval.denied?"DENIED":approval.approved?"Approved":approval.pending?"Pending":"Required";
 const classification=`<div class="contextcard"><h4>1. Classification</h4>${r.classificationVerified?`<div class="fulfillmentcard"><b>${esc(r.selectedType||r.expectedType)}</b> verified. Catalog workflow is active.</div>`:`<div class="small">Choose the workflow that best matches what the requester is asking for. Misrouting costs time and can generate fulfillment kickbacks.</div><div class="requestbuttons"><label class="sr-only" for="requestTypeSelect">Ticket classification</label><select id="requestTypeSelect" aria-label="Ticket classification">${CLASSIFICATION_TYPES.map(x=>`<option>${esc(x)}</option>`).join("")}</select><button class="primary" type="button" onclick="classifyRequest(getTicket(),document.getElementById('requestTypeSelect').value)">Apply Classification</button></div>`}</div>`;
 const itemCard=r.classificationVerified?`<div class="requesthero"><span class="catalogtype">${esc(item.type)}</span> <span class="${item.standard?"catalogstandard":"catalognonstandard"}">${item.standard?"Standard":"Non-standard"}</span><h4>${esc(item.name)}</h4>${esc(item.desc)}<div class="catalogmeta">Fulfillment owner: ${esc(supportTeam(item.team)?.name||item.team)} · Target ${item.target} simulated min</div></div>`:"";
 const fields=r.classificationVerified?`<div class="contextcard"><h4>2. Required Information</h4><div class="requestfields">${requestFieldStatusHtml(t)}</div></div>`:"";
 const eligibility=r.classificationVerified?`<div class="contextcard"><h4>3. Entitlement / Policy</h4><div class="requesthero ${eligibilityClass}"><b>${r.duplicateExisting?"Existing entitlement detected":r.eligibility==="eligible"?"Eligible standard request":r.eligibility==="blocked"?"Catalog policy block":"Exception / controlled review"}</b><br>${esc(r.eligibilityReason)}</div></div>`:"";
 const approvalCard=r.classificationVerified?`<div class="contextcard"><h4>4. Approval</h4><div class="historyitem"><b>${esc(approvalText)}</b>${approval?.flowId?` · ${esc(approval.flowId)}`:""}<br>${approval?.required?"Use the Approvals tab to verify and advance the authorization chain.":"This catalog item does not require a separate approval chain."}</div></div>`:"";
 let action="";
 if(r.classificationVerified){
   if(r.fulfilled)action=`<div class="fulfillmentcard"><b>Fulfillment complete.</b><br>${esc(supportTeam(item.team)?.name||item.team)} completed the request. Validate the result with the requester before closure.</div>`;
   else if(r.fulfillmentSubmitted)action=`<div class="fulfillmentcard"><b>Fulfillment in progress.</b><br>${esc(supportTeam(item.team)?.name||item.team)} is processing the request. Continue other work while it remains open.</div>`;
   else if(r.eligibility==="blocked"||approval?.denied)action=`<div class="kickbackcard"><b>Request cannot be fulfilled as submitted.</b><br>${esc(r.eligibility==="blocked"?r.eligibilityReason:"A required approver denied the request.")}<div class="requestbuttons"><button class="primary" type="button" onclick="denyCatalogRequest(getTicket())">Deny / Return Request</button></div></div>`;
   else if(missing.length)action=`<div class="kickbackcard"><b>Intake incomplete.</b><br>${missing.length} required field${missing.length===1?" is":"s are"} still missing.</div>`;
   else if(!requestApprovalSatisfied(t))action=`<div class="kickbackcard"><b>Waiting for authorization.</b><br>All intake information is present, but the approval workflow is incomplete.</div>`;
   else action=`<div class="fulfillmentcard"><b>Ready for fulfillment.</b><br>Classification, intake, entitlement, and approval checks are complete.<div class="requestbuttons"><button class="primary" type="button" onclick="submitCatalogFulfillment(getTicket())">Submit to ${esc(supportTeam(item.team)?.name||"Fulfillment Team")}</button></div></div>`;
 }
 body.innerHTML=`<div class="requestgrid">${requestFlowHtml(t)}${classification}${itemCard}${fields}${eligibility}${approvalCard}<div class="contextcard"><h4>5. Fulfillment & Validation</h4>${action||'<div class="small">Complete the earlier request stages first.</div>'}</div></div>`;
}

function renderTab(){
 document.querySelectorAll(".tab").forEach(b=>{const on=b.dataset.tab===activeTab;b.classList.toggle("active",on);b.setAttribute("aria-selected",on?"true":"false");b.tabIndex=on?0:-1});
 const body=document.getElementById("tabBody"),t=getTicket();body.setAttribute("aria-labelledby",`tab-${activeTab}`);
 if(activeTab==="tools"){
   body.innerHTML=`<div class="toolgrid">${TOOLS.map(x=>`<button class="toolbtn" data-tool="${x[0]}"><b>${x[1]}</b><span class="small">${x[2]}</span></button>`).join("")}</div><div class="resultbox">${esc(toolResult)}</div>`;
   body.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>runTool(b.dataset.tool,TOOLS.find(x=>x[0]===b.dataset.tool)[1]));
 }else if(activeTab==="kb"){
   body.innerHTML=`<label class="sr-only" for="kbSearch">Search knowledge base</label><input class="kbsearch" id="kbSearch" placeholder="Search knowledge base" aria-label="Search knowledge base"><div id="kbList" aria-live="polite"></div>`;
   const draw=(term="")=>{let items=KB.filter(k=>(k.title+" "+k.tags+" "+k.text).toLowerCase().includes(term.toLowerCase()));document.getElementById("kbList").innerHTML=items.map(k=>`<div class="kbitem"><b>${esc(k.title)}</b><p>${esc(k.text)}</p></div>`).join("")||'<div class="small">No matching articles.</div>'};
   draw();document.getElementById("kbSearch").oninput=e=>draw(e.target.value);
 }else if(activeTab==="notes"){
   body.innerHTML=t?`<div class="small" id="noteHelp" style="margin-bottom:6px">Private documentation visible only to IT staff.</div><label class="sr-only" for="noteText">Internal ticket note</label><textarea class="notearea" id="noteText" aria-describedby="noteHelp" placeholder="Document symptoms, diagnostics, root cause, and resolution...">${esc(t.notes)}</textarea><button class="primary" type="button" id="saveNoteBtn">Save Internal Note</button>`:'<div class="empty">Select a ticket.</div>';
   const b=document.getElementById("saveNoteBtn");if(b)b.onclick=saveNote;
 }else if(activeTab==="request"){
   renderRequestTab(body,t);
 }else if(activeTab==="approvals"){
   renderApprovalsTab(body,t);
 }else if(activeTab==="teams"){
   if(!t){body.innerHTML='<div class="empty">Select a ticket.</div>'}
   else{
     const current=t.assignmentQueue||"Service Desk",stateLabel={
       "none":"Not assigned","reviewing":"Awaiting specialist review","accepted":"Accepted by specialist","working":"Specialist investigating",
       "kicked-back":"Returned to Service Desk","info-needed":"Returned for information","awaiting-confirmation":"Specialist work complete — awaiting user confirmation"
     }[t.specialistState]||t.specialistState;
     const request=t.specialistInfoRequest?`<div class="orgwarning"><b>Specialist requested more information:</b><br>${esc(t.specialistInfoRequest.text)}</div>`:"";
     const suggested=t.specialistSuggestedDiagnostic?(getScenario(t).diagnostics||[]).find(d=>d[0]===t.specialistSuggestedDiagnostic)?.[1]:t.specialistSuggestedFix?(getScenario(t).fixes||[]).find(f=>f[0]===t.specialistSuggestedFix)?.[1]:null;
     const suggestion=suggested?`<div class="specialisthint"><b>Specialist suggestion</b><br>${esc(suggested)}<br><span class="small">This action is highlighted in the ticket action tray.</span></div>`:"";
     const coworkerCards=state.coworkers.map(cw=>{const load=coworkerLoad(cw.id),aff=Math.round(coworkerAffinity(cw,t)*100),accept=Math.round(coworkerAcceptanceChance(cw,t)*100);return `<div class="coworkercard"><b>${esc(cw.name)}</b> · ${esc(cw.title)}<div class="coworkertrust">${esc(cw.style)} · ${load} load · Trust ${Math.round(cw.trust)}/100 · Fit ${aff}%</div><div>${esc(cw.bio)}</div><div class="coworkeractions"><button class="secondary" onclick="askCoworkerForHelp('${cw.id}')">Ask for Help</button><button class="secondary" onclick="assignToCoworker('${cw.id}')">Reassign (${accept}%)</button><button class="secondary" onclick="tradeWithCoworker('${cw.id}')">Trade Tickets</button></div></div>`}).join("");
     const cards=SUPPORT_TEAMS.map(tm=>{const load=teamLoad(tm.id).toLowerCase(),b=teamBehavior(tm.id);return `<button class="teamcard ${current===tm.name?"current":""}" onclick="assignToTeam('${tm.id}')"><b>${esc(tm.name)}</b>${esc(tm.desc)}<div class="teamtemper">${esc(b.label)} · handoff tolerance varies with queue load</div><div class="teammeta"><span>${esc(tm.specialists[0])} + team</span><span class="load ${load}">${esc(teamLoad(tm.id))}</span></div></button>`}).join("");
     const hist=(t.teamHistory||[]).slice().reverse().map(h=>`<div class="teamhistoryitem"><b>${esc(h.time)} · ${esc(h.action)}</b><br>${esc(h.team)}${h.note?`<br>${esc(h.note)}`:""}</div>`).join("")||'<div class="small">No specialist assignment history yet.</div>';
     const chist=(t.coworkerHistory||[]).map(h=>`<div class="teamhistoryitem"><b>${esc(h.time)} · ${esc(h.action)}</b><br>${esc(h.coworker)}${h.note?`<br>${esc(h.note)}`:""}</div>`).join("")||'<div class="small">No teammate ownership history yet.</div>';
     body.innerHTML=`<div class="teamstatus"><b>Service Desk ownership: ${t.ownerAgentId==="player"&&!t.sharedQueue?"You":t.sharedQueue?"Shared Queue":esc(coworkerById(t.ownerAgentId)?.name||"Teammate")}</b><br>${t.coworkerState!=="none"?`Teammate state: ${esc(t.coworkerState)} · `:""}Dump points on this ticket: ${t.coworkerDumpPoints||0}</div>
       <div class="contextcard"><h4>Fellow Service Desk Agents</h4><div class="small" style="margin-bottom:7px">Ask for a hint, reassign ownership, or trade tickets. Trust, workload, specialty fit, and handoff quality affect whether they help or accept.</div><div class="coworkergrid">${coworkerCards}</div><div class="coworkeractions"><button class="danger" onclick="dumpToSharedQueue()">Dump into Shared Queue</button>${t.ownerAgentId!=="player"||t.sharedQueue?'<button class="secondary" onclick="recallFromCoworker()">Recall to My Queue</button>':""}${(t.coworkerAuditPoints||0)>0&&!t.auditAttributionHidden?`<button class="danger" onclick="concealCoworkerTransfer()">Outrun Audit Attribution (${effectiveAuditTarget(t.coworkerTransferMode==="shared"?"shared-conceal":t.coworkerDumpPoints>=3?"repeat-dump-conceal":"reassignment-conceal",t)} WPM)</button>`:""}</div></div>
       <div class="contextcard"><h4>Teammate Ownership History</h4>${chist}</div>
       <div class="teamstatus ${t.specialistState==="accepted"||t.specialistState==="awaiting-confirmation"?"accepted":t.specialistState==="kicked-back"||t.specialistState==="info-needed"?"returned":t.specialistState==="working"||t.specialistState==="reviewing"?"working":""}"><b>Specialist queue: ${esc(current)}</b><br>${esc(stateLabel)} · ${t.escalationAttempts||0} assignment attempt(s) · ${t.teamKickbacks||0} return(s)${t.handoffGrade?` · <span class="handoffbadge ${handoffGradeClass(t.handoffGrade)}">${esc(t.handoffGrade)}</span>`:""}</div>
       ${request}${suggestion}
       ${current!=="Service Desk"&&["reviewing","accepted","working"].includes(t.specialistState)?'<button class="secondary" style="width:100%;margin:8px 0" onclick="recallFromTeam()">Recall from Specialist</button>':""}
       <div class="small" style="margin:8px 0">Specialist queue load affects tolerance, not ownership. Fellow-agent reassignment is separate from specialist escalation.</div>
       <div class="teamgrid">${cards}</div>
       <div class="contextcard" style="margin-top:10px"><h4>Specialist Assignment History</h4><div class="teamhistory">${hist}</div></div>`;
   }
 }else if(activeTab==="world"){
   const events=state.world?.events||[],anns=state.world?.announcements||[],ev=t?relevantWorldEvent(t):null;if(t&&ev)t.worldContextSeen=true;
   body.innerHTML=`<div class="worldgrid">
     <div class="worldcontext"><b>${esc(state.world?.weekday||simWeekday())} operational picture · ${fmtTime(state.clock)}</b><br>${activeWorldEvents().length?`${activeWorldEvents().length} active operational event(s). Review scheduled changes and announcements before assuming tickets are isolated.`:"No active service event is currently visible."}</div>
     ${ev?`<div class="worldcard ${esc(ev.status)}"><div class="worldhead"><div><div class="worldtype">Current ticket context</div><div class="worldtitle">${esc((ev.known||ev.discovered)?ev.title:worldEventDisplayTitle(ev))}</div></div><span class="worldstatus ${esc(ev.status)}">${esc(ev.status)}</span></div><div style="margin-top:5px">${esc((ev.known||ev.discovered)?ev.summary:"This ticket was generated by an operational event whose common cause has not yet been identified.")}</div></div>`:""}
     <div class="contextcard"><h4>Operations / Change Calendar</h4><div class="worldtimeline">${events.map(renderWorldEventCard).join("")||'<div class="small">No scheduled events.</div>'}</div></div>
     <div class="contextcard"><h4>Announcements</h4>${anns.slice(0,10).map(a=>`<div class="announcement"><b>${esc(a.time)} · ${esc(a.kind)}</b><br>${esc(a.text)}</div>`).join("")||'<div class="small">No announcements.</div>'}</div>
   </div>`;
 }else if(activeTab==="context"){
   if(!t){body.innerHTML='<div class="empty">Select a ticket.</div>'}
   else{
     const mi=majorFor(t);
     body.innerHTML=`<div class="contextgrid">
       <div class="contextcard"><h4>Classification</h4><div class="historyitem"><b>${esc(requestTypeDisplay(t))}</b><br>${esc(t.category)} · ${esc(t.department)}${t.request&&!t.request.classificationVerified?"<br><span class=\"small\">Catalog request classification has not been verified yet.</span>":""}</div><div class="historyitem">Requester: ${esc(t.user)}<br>Supervisor: ${esc(t.actors?.supervisor?.name||t.supervisor||"Unknown")}<br>Manager: ${esc(t.actors?.manager?.name||t.manager||"Unknown")}</div></div>
       ${(()=>{const e=getEmployee(t),rel=relationshipTier(e),notes=employeeObservedNotes(e);return e?`<div class="contextcard"><h4>Requester Profile</h4><div class="historyitem"><b>${esc(e.name)}</b> · ${esc(e.roleTitle)}<br>${esc(e.department)}<br><span class="relationship ${rel.id}">${esc(rel.label)}</span></div><div class="profilemetrics"><div class="profilemetric"><b>${e.lifetimeTickets}</b><span>Tickets</span></div><div class="profilemetric"><b>${Math.round(e.satisfaction)}</b><span>Satisfaction</span></div><div class="profilemetric"><b>${Math.round(e.trust)}</b><span>Trust</span></div></div>${notes.length?`<div class="memorynote ${rel.id==="strained"||rel.id==="wary"?"bad":rel.id==="strong"?"good":""}">${notes.map(esc).join("<br>")}</div>`:"<div class=\"small\">No established support pattern yet.</div>"}</div>`:""})()}
       <div class="contextcard"><h4>Organizational Actors</h4><div class="actorgrid">${["applicationOwner","dataOwner","security","privacy","records","hr","procurement","assetOwner","clinicalOwner"].filter(k=>t.actors?.[k]).map(k=>`<div class="actorcard"><b>${esc(t.actors[k].role)}</b><br>${esc(t.actors[k].name)}<br><span class="small">${esc(t.actors[k].team)}</span></div>`).join("")}</div></div>
       ${t.specialAssignment?`<div class="incidentbox"><b>Supervisor-selected assignment</b><br>${esc(state.supervisor?.name||"Your supervisor")} routed this higher-complexity ticket to you based on your current career standing.</div>`:""}
       ${t.worldEventId?(()=>{const we=relevantWorldEvent(t);return we?`<div class="worldcontext"><b>Operational context: ${esc(we.id)} · ${esc((we.known||we.discovered)?we.title:worldEventDisplayTitle(we))}</b><br>${esc((we.known||we.discovered)?we.summary:"A common organizational event may be involved, but it has not yet been identified.")}</div>`:""})():""}
       ${t.clarification?.exact?`<div class="contextcard"><h4>Clarified Affected Service</h4><div class="historyitem"><b>${esc(t.clarification.value)}</b><br>Requester supplied the specific system/application after clarification.</div></div>`:t.clarification?.level?`<div class="contextcard"><h4>Clarification Attempt</h4><div class="historyitem">${esc(t.clarification.lastResponse||"Requester did not provide an exact system name.")}</div></div>`:""}
       ${mi?`<div class="incidentbox"><b>${esc(mi.id)} — ${esc(mi.label)}</b><br>${mi.open===false?"Major incident is resolved. Preserve the correlation history and re-test any still-open symptom rather than linking new work to a closed incident.":"Known major incident is active. Use queue correlation and associate matching tickets appropriately."}</div>`:(t.relatedKnown?'<div class="incidentbox">A correlation signal exists for this ticket, but no active incident details are available.</div>':"")}
       ${t.request?`<div class="contextcard"><h4>Request / Fulfillment History</h4>${t.request.history?.length?t.request.history.map(h=>`<div class="historyitem"><b>${esc(h.time)} · ${esc(h.action)}</b><br>${esc(h.note||"")}</div>`).join(""):'<div class="small">No request workflow events recorded yet.</div>'}</div>`:""}
       <div class="contextcard"><h4>Prior Ticket History</h4>${t.history?.length?t.history.map(h=>`<div class="historyitem"><b>${esc(h.when)}</b><br>${esc(h.text)}</div>`).join(""):'<div class="small">No meaningful prior ticket history found.</div>'}</div>
       <div class="contextcard"><h4>Attachments</h4><div class="attachments">${t.attachments?.length?t.attachments.map((a,i)=>`<button class="attachment" onclick="openAttachment('${t.id}',${i})">${esc(a.name)} · ${esc(a.type)}</button>`).join(""):'<span class="small">No attachments supplied.</span>'}</div></div>
       ${t.closureHistory?.length?`<div class="contextcard"><h4>Previous Closures</h4>${t.closureHistory.map(x=>`<div class="historyitem"><b>${esc(x.outcome)} · ${x.score}/100</b><br>Customer rating ${x.rating||0}/5 — ${esc(x.feedback||"No feedback")}</div>`).join("")}</div>`:""}
     </div>`;
   }
 }else{
   body.innerHTML=t?(t.resolved?`<div class="fulfillmentcard"><b>Ticket complete — ${esc(t.outcome||"Resolved")}</b><br>Score: ${t.score??"—"}/100. Reopening controls and destructive actions are unavailable after completion.<div class="requestbuttons"><button class="primary" onclick="showTicketReport(getTicket())">View Resolution & Score</button></div></div>`:`<div class="statusstack"><button class="secondary" onclick="setStatus('In Progress')">Set In Progress</button><button class="secondary" onclick="setStatus('Waiting for User')">Waiting for User</button><button class="secondary" onclick="openTeamsTab()">Escalate / Assign</button><button class="primary" onclick="closeTicket()">Resolve / Close Ticket</button><button class="danger" onclick="forceCloseTicket()">Force Close Ticket</button></div>
   ${responsePolicyPanel(t)}
   <div class="dangerzone"><h4>Desperation / Administrative Misconduct</h4><p>These are deliberately bad career decisions. Detection is no longer a simple random firing roll: questionable actions launch <b>Outrun the Audit</b>, an abstract typing race. Faster, more accurate typing can avoid immediate attribution; repeated findings build Misconduct Heat and escalate from warnings to coaching, a misconduct plan, final warning, and eventually termination.</p>
   <div class="auditheat"><div><b>Misconduct Heat ${state.maliciousStats?.heat||0}/100</b><div class="heatbar"><i style="width:${Math.min(100,state.maliciousStats?.heat||0)}%"></i></div></div><span class="auditstage ${misconductStageClass()}">${esc(misconductStageLabel())}</span></div>
   <div class="desperationgrid">
    <div class="desperationcard"><b>False Waiting for User</b>Buy yourself time even though you never asked them anything. Audit target: ${effectiveAuditTarget("false-waiting",t)} adjusted WPM.<button class="danger" onclick="markFalseWaiting()">Do It Anyway</button></div>
    <div class="desperationcard"><b>Unjustified Priority Downgrade</b>Reduce queue pressure without a real impact change. Audit target: ${effectiveAuditTarget("priority-downgrade",t)} adjusted WPM.<button class="danger" onclick="unjustifiedPriorityDowngrade()">Lower Priority Anyway</button></div>
    <div class="desperationcard"><b>Delete Ticket Record</b>Hide it from the visible queue so it cannot reopen. Ticket scores 0/100. Audit target: ${effectiveAuditTarget("ticket-delete",t)} adjusted WPM.<button class="danger" onclick="deleteTicketRecord()">Delete Ticket</button></div>
    <div class="desperationcard"><b>Delete Requester Account</b>The nuclear option. Ticket scores 0/100. Audit target tops out at ${effectiveAuditTarget("account-delete",t)} adjusted WPM with 95% accuracy.<button class="danger" onclick="deleteRequesterAccount()">Delete Requester's Account</button></div>
   </div></div>
   <div class="resultbox">Applied fixes must be validated with the requester before normal closure. Once a fix is ready, a one-click validation follow-up replaces one quick action. Force Close is always available, but users can object and score the interaction. Multi-stage approvals can remain open in the background while you work the rest of the queue. Use the Approvals tab to see who actually has authority, delegation, denials, withdrawals, and emergency exceptions. Poorly closed tickets may reopen, and multiple apparently separate tickets may be symptoms of one larger incident. Escalations now remain open until a specialist team accepts, investigates, and returns a resolution for requester validation. The World tab shows the current change calendar, outages, campaigns, workload events, and announcements that may be shaping the queue. Catalog requests use separate fulfillment targets and remain open through classification, intake, approvals, fulfillment, and requester validation.</div>`):'<div class="empty">Select a ticket.</div>';
 }
}
window.setStatus=setStatus;window.closeTicket=closeTicket;window.forceCloseTicket=forceCloseTicket;window.showTicketReport=showTicketReport;

function openAttachment(ticketId,index){
 const t=state.tickets.find(x=>x.id===ticketId),a=t?.attachments?.[index];if(!a)return;
 showModal(`<div class="mh"><h2>${esc(a.name)}</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><div class="small" style="margin-bottom:8px">${esc(a.type)} · Simulated ticket attachment</div><div class="resultbox">${esc(a.content)}</div></div>`);
}
window.openAttachment=openAttachment;

function employeeDirectoryCard(e){
 const rel=relationshipTier(e),avg=e.closureInteractions?Math.round((e.ticketHistory||[]).reduce((a,h)=>a+(h.rating||0),0)/Math.max(1,(e.ticketHistory||[]).filter(h=>h.rating).length)*10)/10:"—";
 const recent=(e.ticketHistory||[])[0];
 return `<div class="personcard" data-person-search="${esc(`${e.name} ${e.department} ${e.roleTitle}`.toLowerCase())}">
   <div class="approvalrow"><div><div class="personname">${esc(e.name)}${e.accountDisabledByAgent?' <span class="tag account-disabled">ACCOUNT DISABLED</span>':""}</div><div class="personmeta">${esc(e.roleTitle)} · ${esc(e.department)}<br>Supervisor: ${esc(e.supervisorName||"—")} · Manager: ${esc(e.managerName||"—")}</div></div><span class="relationship ${rel.id}">${esc(rel.label)}</span></div>
   <div class="profilemetrics"><div class="profilemetric"><b>${e.lifetimeTickets}</b><span>Tickets</span></div><div class="profilemetric"><b>${avg}</b><span>Avg Rating</span></div><div class="profilemetric"><b>${Math.round(e.satisfaction)}</b><span>Satisfaction</span></div></div>
   ${e.closureInteractions?`<div class="personmeta">Observed: ${esc(employeeTechLabel(e))} · ${esc(employeeResponseLabel(e))}${recent?`<br>Latest: ${esc(recent.category)} — ${esc(recent.outcome)}`:""}${e.requestHistory?.length?`<br>Catalog requests: ${e.requestHistory.length}`:""}${e.entitlements?.length?`<br>Known entitlements: ${e.entitlements.slice(0,3).map(x=>esc(x.name)).join(", ")}`:""}</div>`:'<div class="personmeta">No completed interactions with you yet.</div>'}
 </div>`;
}
function renderEmployeeDirectory(term=""){
 const list=document.getElementById("employeeDirectoryList");if(!list)return;
 const q=term.trim().toLowerCase();
 const people=[...(state.employees||[])].sort((a,b)=>(b.closureInteractions-a.closureInteractions)||(b.lifetimeTickets-a.lifetimeTickets)||a.name.localeCompare(b.name));
 const filtered=people.filter(e=>!q||`${e.name} ${e.department} ${e.roleTitle}`.toLowerCase().includes(q));
 list.innerHTML=filtered.map(employeeDirectoryCard).join("")||'<div class="small">No employees match that search.</div>';
}

function careerSkillCard(label,key){
 const val=Math.max(0,Math.min(100,state.careerProfile?.skills?.[key]||0));
 return `<div class="skill"><div class="skillhead"><span>${esc(label)}</span><b>${val}%</b></div><div class="skillbar"><i style="width:${val}%"></i></div></div>`;
}
function careerObjectiveHtml(o){
 const cls=o.complete===true?"complete":o.complete===false?"failed":"pending",label=o.complete===true?"Complete":o.complete===false?"Missed":"Active";
 return `<div class="objective ${cls}"><div class="objectivehead"><b>${esc(o.title)}</b><span class="objectivestate">${label}</span></div><div>${esc(o.desc)}</div></div>`;
}
function showCareerCenter(){
 const p=state.careerProfile||newCareerProfile(1),sp=state.supervisor||defaultState().supervisor;
 const objectives=(p.objectives||[]).map(careerObjectiveHtml).join("")||'<div class="small">Development objectives will be assigned when the next shift starts.</div>';
 const achievements=(p.achievements||[]).map(a=>`<div class="achievement"><b>${esc(a.title)}</b><small>Shift ${a.shift} · ${esc(a.date)}</small>${esc(a.desc)}</div>`).join("")||'<div class="small">No career achievements unlocked yet.</div>';
 const personnel=(p.personnel||[]).map(e=>`<div class="personnelevent ${esc(e.tone||"")}"><b>Shift ${e.shift} · ${esc(e.title)}</b><br>${esc(e.detail||"")}</div>`).join("")||'<div class="small">Personnel file is clear.</div>';
 const archives=(state.careerArchive||[]).map(a=>`<div class="archivecard"><b>Career ${a.careerNumber}: ${esc(a.title)}</b><br>${esc(a.careerId)} · ${a.shifts} shifts · ${a.tickets} tickets · ${a.achievements} achievements<br>${esc(a.reason)} · ${esc(a.startDate)}–${esc(a.endDate)}</div>`).join("")||'<div class="small">No prior careers archived.</div>';
 const status=careerStatusLabel();
 showModal(`<div class="mh"><h2>Career Center</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
 <div class="careerhero"><div><div class="careerid">Career ${p.careerNumber} · ${esc(p.careerId)}</div><h3>${esc(agentTitle())}</h3><p>Week ${careerWeekNumber()} · ${careerDayName()} · Supervisor: ${esc(sp.name)} · Started ${esc(p.startDate)}</p></div><span class="careerstatus ${careerStatusClass()}">${esc(status)}</span></div>
 <div class="reportgrid" style="margin-top:10px"><div class="stat"><b>${p.shifts}</b><span>Shifts This Career</span></div><div class="stat"><b>${p.tickets}</b><span>Career Tickets</span></div><div class="stat"><b>${p.xp}</b><span>Career XP</span></div><div class="stat"><b>${metricAverage("score")||"—"}</b><span>Avg Review</span></div><div class="stat"><b>${sp.recognition||0}</b><span>Recognition</span></div><div class="stat"><b>${p.achievements.length}</b><span>Achievements</span></div></div>
 <div class="contextcard"><h4>${state.active?"Current Development Objectives":"Latest Development Objectives"}</h4><div class="objectivegrid">${objectives}</div></div>
 <div class="contextcard"><h4>Career Skill Profile</h4><div class="skillgrid">${careerSkillCard("Technical / FCR","technical")}${careerSkillCard("Customer Experience","customer")}${careerSkillCard("Security","security")}${careerSkillCard("Documentation","documentation")}${careerSkillCard("Escalation & Routing","escalation")}${careerSkillCard("Operational Awareness","operations")}${careerSkillCard("Request Fulfillment","requests")}${careerSkillCard("Queue Management","queue")}</div></div>
 <div class="contextcard"><h4>Career Metrics</h4><div class="reportgrid"><div class="stat"><b>${metricAverage("fcr")||"—"}%</b><span>FCR</span></div><div class="stat"><b>${metricAverage("csat")||"—"}%</b><span>CSAT</span></div><div class="stat"><b>${metricAverage("sla")||"—"}%</b><span>SLA</span></div><div class="stat"><b>${metricAverage("security")||"—"}%</b><span>Security</span></div><div class="stat"><b>${metricAverage("routing")||"—"}%</b><span>Routing</span></div><div class="stat"><b>${metricAverage("operations")||"—"}%</b><span>Ops Awareness</span></div><div class="stat"><b>${metricAverage("requests")||"—"}%</b><span>Request Quality</span></div></div></div>
 <div class="contextcard"><h4>Administrative Conduct / Audit</h4><div class="auditheat"><div><b>Misconduct Heat ${state.maliciousStats?.heat||0}/100</b><div class="heatbar"><i style="width:${Math.min(100,state.maliciousStats?.heat||0)}%"></i></div></div><span class="auditstage ${misconductStageClass()}">${esc(misconductStageLabel())}</span></div><div class="reportgrid"><div class="stat"><b>${state.maliciousStats?.findings||0}</b><span>Attributed Findings</span></div><div class="stat"><b>${state.maliciousStats?.evasionAttempts||0}</b><span>Audit Races</span></div><div class="stat"><b>${state.maliciousStats?.cleanEscapes||0}</b><span>Clean Escapes</span></div><div class="stat"><b>${state.maliciousStats?.narrowEscapes||0}</b><span>Narrow Escapes</span></div><div class="stat"><b>${state.maliciousStats?.extraTickets||0}</b><span>Punishment Tickets</span></div></div><div class="audit-history">${(state.maliciousStats?.auditHistory||[]).slice(0,8).map(h=>`<div class="audit-history-item"><b>Shift ${h.shift} · ${esc(h.label)} — ${esc(h.outcome)}</b><br>${esc(h.detail||"")}<br>Heat ${h.heat}/100</div>`).join("")||'<div class="small">No audit history recorded.</div>'}</div></div>
 <div class="contextcard"><h4>Achievements</h4><div class="achievementgrid">${achievements}</div></div>
 <div class="contextcard"><h4>Personnel File</h4><div class="personnelfile">${personnel}</div></div>
 ${state.careerArchive?.length?`<div class="contextcard"><h4>Prior Careers</h4><div class="personnelfile">${archives}</div></div>`:""}
 </div><div class="mf"><button class="secondary" onclick="exportCareerSave()">Export Career Save</button><button class="secondary" onclick="showPerformanceCenter()">Supervisor Reviews</button>${state.discipline?.fired?'<button class="primary" onclick="restartCareer()">Start New Career</button>':'<button class="primary" onclick="hideModal()">Done</button>'}</div>`);
}
function exportCareerSave(){
 const payload={format:"SuperService Career Save",version:"1.0",exportedAt:new Date().toISOString(),state};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=`SuperService_Career_${state.careerProfile?.careerId||"Save"}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Career save exported.");
}
function importCareerSave(input){
 const file=input?.files?.[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
   try{
     const parsed=JSON.parse(reader.result),incoming=parsed?.state||parsed;
     if(!incoming||typeof incoming!=="object"||!Array.isArray(incoming.tickets))throw new Error("This does not appear to be a SuperService save.");
     if(state.active&&!confirm("Replace the current active SuperService career with this imported save?")){input.value="";return}
     state=normalizeState(incoming);syncTypingPracticeStats();saveState();hideModal();
     if(state.active&&state.tickets.length)document.getElementById("startModal").classList.add("hidden");else if(!state.tickets.length)document.getElementById("startModal").classList.remove("hidden");else document.getElementById("startModal").classList.add("hidden");
     processPending();renderAll();toast("Career save imported.");
   }catch(err){alert(`Unable to import save: ${err.message}`)}
   input.value="";
 };
 reader.readAsText(file);
}
window.showCareerCenter=showCareerCenter;window.exportCareerSave=exportCareerSave;window.importCareerSave=importCareerSave;

function performanceReviewCard(r){
 const cls=r.action==="terminated"?"terminated":r.score>=90?"excellent":r.score>=70?"good":"coaching";
 return `<div class="reviewcard"><div class="reviewcardhead"><div><b>Shift ${r.shift} · ${esc(r.rating)}</b><div class="reviewsub">${esc(r.agentTitle||"Service Desk Agent")} · ${esc(r.action||"review")}</div></div><div class="reviewscore">${r.score}</div></div>
 <div style="margin-top:6px">${esc(r.narrative||"")}</div>
 <div class="reviewgrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:0"><div class="reviewmetric"><b>${r.metrics?.fcr??0}%</b><span>FCR</span></div><div class="reviewmetric"><b>${r.metrics?.csat??0}%</b><span>CSAT</span></div><div class="reviewmetric"><b>${r.metrics?.sla??0}%</b><span>SLA</span></div><div class="reviewmetric"><b>${r.metrics?.closureQuality??0}%</b><span>Closures</span></div></div></div>`;
}
function showPerformanceCenter(){
 const sp=state.supervisor||defaultState().supervisor,last=sp.lastReview;
 const training=sp.requiredTraining?.length?`<div class="contextcard"><h4>Required Refresher Topics</h4><div class="traininglist">${sp.requiredTraining.map(x=>`<span class="trainingchip">${esc(x)}</span>`).join("")}</div></div>`:"";
 showModal(`<div class="mh"><h2>Supervisor & Performance</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
 <div class="approvalhead"><b>${esc(agentTitle())}</b><br>Supervisor: ${esc(sp.name)} · ${esc(sp.title)}<br>Standing: <b>${esc(supervisorStanding())}</b></div>
 <div class="reportgrid"><div class="stat"><b>${sp.reviews||0}</b><span>Supervisor Reviews</span></div><div class="stat"><b>${last?.score??"—"}</b><span>Latest Review</span></div><div class="stat"><b>${sp.recognition||0}</b><span>Recognition Points</span></div><div class="stat"><b>${sp.goodStreak||0}</b><span>Strong Shift Streak</span></div><div class="stat"><b>${sp.coaching?"YES":"NO"}</b><span>Active Coaching</span></div><div class="stat"><b>${sp.pip?"YES":"NO"}</b><span>Overall PIP</span></div></div>
 ${training}
 <div class="contextcard"><h4>Performance Review History</h4><div class="reviewhistory">${sp.history?.length?sp.history.map(performanceReviewCard).join(""):'<div class="small">No completed supervisor reviews yet.</div>'}</div></div>
 </div><div class="mf"><button class="secondary" onclick="showCareerCenter()">Career Center</button><button class="primary" onclick="hideModal()">Done</button></div>`);
}
window.showPerformanceCenter=showPerformanceCenter;

function showTeamQueues(){
 const active=state.tickets.filter(t=>!t.resolved);
 showModal(`<div class="mh"><h2>Specialist Queues</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
 <div class="reportgrid"><div class="stat"><b>${state.teamStats?.assignments||0}</b><span>Assignments</span></div><div class="stat"><b>${state.teamStats?.accepted||0}</b><span>Accepted</span></div><div class="stat"><b>${state.teamStats?.mercyAccepts||0}</b><span>Courtesy Accepts</span></div><div class="stat"><b>${state.teamStats?.adviceReturns||0}</b><span>Helpful Returns</span></div><div class="stat"><b>${state.teamStats?.kickbacks||0}</b><span>Returns</span></div><div class="stat"><b>${state.teamStats?.wrongQueue||0}</b><span>Wrong Queue</span></div><div class="stat"><b>${state.teamStats?.excellentHandoffs||0}</b><span>Excellent Handoffs</span></div><div class="stat"><b>${state.teamStats?.resolutions||0}</b><span>Specialist Resolutions</span></div></div>
 <div class="freeplaynote" style="margin:8px 0"><b>Queue behavior is not deterministic.</b><br>Low-load teams have more room to accept a thin handoff or point you toward the missing check. Moderate queues are less forgiving. High-load queues almost always require a clean handoff. Authorization/policy blocks are never overridden by spare capacity.</div>
 <div class="contextcard"><h4>Service Desk Teammates</h4><div class="coworkergrid">${state.coworkers.map(cw=>`<div class="coworkercard"><b>${esc(cw.name)}</b> · ${esc(cw.title)}<div class="coworkertrust">${esc(cw.style)} · ${esc(coworkerLoad(cw.id))} load · Trust ${Math.round(cw.trust)}/100</div><div>${esc(cw.bio)}</div><div class="small">Accepted ${cw.accepted} · Returned ${cw.rejected} · Helped ${cw.helped} · Trades ${cw.trades}</div></div>`).join("")}</div></div>
 <div class="teamgrid">${SUPPORT_TEAMS.map(tm=>{const assigned=active.filter(t=>t.assignmentQueue===tm.name).length,load=teamLoad(tm.id).toLowerCase(),b=teamBehavior(tm.id);return `<div class="queuecard"><b>${esc(tm.name)}</b><div>${esc(tm.desc)}</div><div class="teamtemper">${esc(b.label)} specialist culture</div><div class="teammeta"><span class="queuecounts">${assigned} active ticket${assigned===1?"":"s"} here</span><span class="load ${load}">${esc(teamLoad(tm.id))}</span></div></div>`}).join("")}</div>
 </div><div class="mf"><button class="primary" onclick="hideModal()">Done</button></div>`);
}
window.showTeamQueues=showTeamQueues;

function showEmployeeDirectory(){
 const interacted=(state.employees||[]).filter(e=>e.closureInteractions).length;
 const repeat=(state.employees||[]).filter(e=>e.lifetimeTickets>1).length;
 const strained=(state.employees||[]).filter(e=>["wary","strained"].includes(relationshipTier(e).id)).length;
 showModal(`<div class="mh"><h2>Employee Directory</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
   <div class="reportgrid"><div class="stat"><b>${state.employees?.length||0}</b><span>Employees</span></div><div class="stat"><b>${interacted}</b><span>Known Requesters</span></div><div class="stat"><b>${repeat}</b><span>Repeat Requesters</span></div><div class="stat"><b>${strained}</b><span>Wary / Strained</span></div></div>
   <div class="peopletoolbar"><label class="sr-only" for="employeeDirectorySearch">Search employee directory</label><input id="employeeDirectorySearch" aria-label="Search employee directory" placeholder="Search employee, department, role..."></div><div class="peoplelist" id="employeeDirectoryList"></div>
 </div>`);
 renderEmployeeDirectory();
 document.getElementById("employeeDirectorySearch").oninput=e=>renderEmployeeDirectory(e.target.value);
}

function showSettings(){
 showModal(`<div class="mh"><h2>Settings & Save Management</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb">
 <div class="reportgrid"><div class="stat"><b>${state.career?.shifts||0}</b><span>Lifetime Shifts</span></div><div class="stat"><b>${state.career?.tickets||0}</b><span>Lifetime Tickets</span></div><div class="stat"><b>${state.career?.tickets?Math.round(state.career.totalScore/state.career.tickets):0}</b><span>Lifetime Average</span></div><div class="stat"><b>${state.career?.terminations||0}</b><span>Times Fired</span></div><div class="stat"><b>${state.careerProfile?.careerNumber||1}</b><span>Current Career</span></div><div class="stat"><b>${esc(agentTitle())}</b><span>Current Title</span></div><div class="stat"><b>${state.requestStats?.fulfilled||0}</b><span>Shift Requests Fulfilled</span></div><div class="stat"><b>${state.requestStats?.kickbacks||0}</b><span>Shift Catalog Kickbacks</span></div><div class="stat"><b>${state.settings?.typing?.bestWpm||0}</b><span>Typing Best WPM</span></div><div class="stat"><b>${state.settings?.typing?.sessions||0}</b><span>Typing Sessions</span></div></div>
 <div class="savebox"><b>Portable career save</b><br>Your active career is automatically saved in this browser. Export a JSON backup if you want to move it to another browser/device or protect the career from cleared site data.<br><button class="secondary" style="margin-top:8px" onclick="exportCareerSave()">Export Career Save</button><input class="fileinput" type="file" aria-label="Import SuperService career save" accept=".json,application/json" onchange="importCareerSave(this)"></div>
 <p class="small">SuperService itself does not transmit the save. localStorage remains the active save location until you explicitly export or import a file.</p></div>
 <div class="mf"><button class="danger" onclick="resetData()">Reset All Data</button><button class="secondary" onclick="showCareerCenter()">Career Center</button><button class="primary" onclick="hideModal()">Done</button></div>`);
}
function resetData(){if(confirm("Delete all SuperService saved progress and career data?")){localStorage.removeItem("superservice-save");localStorage.removeItem(TYPING_STATS_KEY);localStorage.removeItem("superservice-save-recovery");state=defaultState();syncTypingPracticeStats();hideModal();document.getElementById("startModal").classList.remove("hidden");renderAll()}}
window.resetData=resetData;

function updateSessionModeHint(){
 const sel=document.getElementById("sessionSelect"),hint=document.getElementById("sessionModeHint");if(!sel||!hint)return;
 hint.textContent=sel.value==="freeplay"?"Freeplay starts empty. Add only the tickets you want; practice results do not commit to career progression.":sel.value==="endless"?"Endless Desk continuously generates work and does not automatically produce a finite shift report.":"Career shifts generate a queue and feed supervisor/career progression.";
}


function bootstrapApplicationState(){
 let loaded=null,raw=null;
 try{
   raw=localStorage.getItem("superservice-save");
   loaded=loadState();
   state=normalizeState(loaded||defaultState());
 }catch(err){
   startupRecoveryError=err;
   console.error("SuperService could not load or migrate the saved state. A recovery copy was preserved and a clean desk was started.",err);
   if(raw){try{localStorage.setItem("superservice-save-recovery",raw)}catch(e){}}
   state=normalizeState(defaultState());
 }
 syncTypingPracticeStats();
 return state;
}
document.getElementById("startShiftBtn").onclick=startShift;
document.getElementById("newShiftBtn").onclick=newShift;
document.getElementById("settingsBtn").onclick=showSettings;
document.getElementById("sessionSelect").onchange=updateSessionModeHint;updateSessionModeHint();
document.getElementById("sendReplyBtn").onclick=freeReply;
document.getElementById("publicReply").addEventListener("keydown",e=>{
 if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){
   e.preventDefault();freeReply();
 }else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&!e.isComposing){
   e.preventDefault();freeReply();
 }
});
document.getElementById("globalSearch").oninput=e=>{ticketFilter=e.target.value.trim().toLowerCase();renderQueue()};
document.getElementById("railTickets").onclick=()=>{const list=document.getElementById("ticketList"),row=list.querySelector('[aria-selected="true"]')||list.querySelector(".ticketrow");(row||list).focus?.();};
document.getElementById("railAddTicket").onclick=showFreeplayTicketPicker;
document.getElementById("railTyping").onclick=showTypingPractice;
document.getElementById("railKB").onclick=()=>{activeTab="kb";renderTab()};
document.getElementById("railReports").onclick=showCareerCenter;
document.getElementById("railPeople").onclick=showEmployeeDirectory;
document.getElementById("railTeams").onclick=showTeamQueues;
document.getElementById("railCatalog").onclick=showServiceCatalog;
document.getElementById("railWorld").onclick=showOperationsBoard;
document.getElementById("railSettings").onclick=showSettings;
document.getElementById("railHelp").onclick=()=>showModal(`<div class="mh"><h2>SuperService Help</h2><button class="secondary" onclick="hideModal()">Close</button></div><div class="mb"><p style="font-size:12px;line-height:1.55">Read the ticket, ask useful questions, use tools when they add evidence, apply an appropriate fix or escalation, and document what happened. Applied fixes should be validated with the requester before normal closure; when a fix is ready, use the one-click resolution follow-up or ask naturally in chat. You may force close any ticket, but the customer will react and rate the closure. The Status tab also contains deliberately bad desperation/misconduct choices. These now use Misconduct Heat and an escalating discipline ladder rather than a one-click firing roll. Questionable actions can launch the fictional Outrun the Audit typing race: beat the computer's adjusted-WPM and accuracy target to avoid immediate attribution; fail and the finding can lead to extra tickets, training, coaching, a misconduct plan, reassignment restrictions, final warning, and eventually termination. The race is intentionally abstract and does not model real audit-log manipulation. Professional conduct matters: profanity, name-calling, demeaning phrases, and insults such as idiot, moron, stupid, dumbass, ass, asshole, jerk, loser, useless, shut up, or similar language produce negative customer reactions; direct or repeated abuse can generate complaints and disciplinary action. Users may be mistaken, incomplete, disappear, correct themselves later, or try things without you. When a real requester response is outstanding, the Requester Response Policy tracks documented contact attempts and wait age. Legitimate follow-ups can probabilistically accelerate the pending response without making every user unnaturally fast; repeated rapid-fire bugging may annoy them and does not count as separate policy contact. Long enough inactivity can unlock supervisor assistance, alternate validation for appropriate shared services, and legitimate Closed — No Requester Response closure. Policy-closed tickets can later reopen, and you may release future reopens to the shared Service Desk queue instead of guaranteeing they return to you. Use Context for prior history and attachments, the Approvals tab for multi-stage authority chains and approval history, and Find Related Tickets when an outage may be affecting multiple people. Managers, data owners, application owners, Security, Privacy, Records, HR, Procurement, and delegated approvers may all participate—and they do not always agree. The Service Desk now has persistent fellow agents with their own specialties, workload, personalities, and trust in you. In the Teams tab you can ask a teammate for help, reassign a ticket, trade tickets, or dump work into the shared queue. Good handoffs and sensible specialty matching make acceptance more likely; weak dumping lowers coworker trust, can be returned with attitude, and repeated patterns can attract Dana's attention and even result in additional tickets being assigned to you. Specialist escalations go to simulated queues with their own workload and temperament. Handoffs are graded Excellent, Adequate, Thin, Poor, Wrong Team, or Blocked. A Low-load team may shrug and accept an incomplete but correctly routed handoff, or return it with a useful clue about the missing diagnostic or likely cause; Moderate queues are less forgiving and High queues are very unlikely to absorb missing Service Desk work. Strict authorization/policy blocks are never bypassed by spare capacity. Excellent handoffs move through specialist work faster. Requesters are persistent employees: their reporting chain, technical comfort, response habits, prior tickets, satisfaction, trust, catalog-request history, and known entitlements carry across shifts. Service requests now have a distinct workflow: use the Request tab to classify the intake, collect every required catalog field, validate entitlement/policy, complete any required approval chain, submit to the catalog fulfillment owner, and then validate the result with the requester. Do not treat a normal access/software/hardware/data request as an incident repair; direct fulfillment attempts are blocked until the catalog workflow is complete. The Service Catalog rail button shows standard and non-standard offerings, requirements, owners, approval chains, and fulfillment targets. Freeplay is available from the New Shift screen: it starts with an empty desk and lets you add individual scenarios from the + rail button whenever you want. Root causes remain hidden, but Freeplay ticket results are isolated from career progression and supervisor discipline. The keyboard rail button opens a basic Typing Practice module with Words, Sentences, and Service Desk Text drills plus WPM and accuracy tracking; typing scores do not affect the service-desk career. The organization itself is now simulated too: deployments, maintenance, outages, phishing waves, new-hire surges, licensing problems, and VIP events can generate correlated ticket bursts as the shift progresses. Ticket descriptions are not assumed to be perfectly written: when a requester says only “the system,” “the application,” or similar vague language, use the explicit clarification action or ask the same question in free text. Free chat also recognizes common diagnostic intent—errors, scope, timing, other affected users, network/VPN, browsers, webmail, devices, versions, approvals, ownership, retention, file paths, licensing, and similar questions—so typing natural questions can advance the same evidence model as the buttons. The action tray now has two rows: Investigate always keeps every scenario diagnostic available, while Actions / Risk contains all available fixes plus a larger rotating set of plausible premature, risky, or bad choices. Completed diagnostics stay visible and are marked rather than disappearing. If a specialist points you toward a missing check, that action is highlighted. Once a corrective action or specialist fix is ready for validation, the resolution follow-up is added without replacing an investigation option. Your supervisor now reviews every completed shift across FCR, reopen rate, CSAT, SLA, security, documentation, escalation judgment, specialist queue-routing quality, operational awareness, closure quality, conduct, and queue control. In Career Mode those reviews feed a persistent personnel file, development objectives, skill profile, probation period, achievements, career XP, promotions up through Lead Service Agent, archived prior careers, and portable save backups. Balance now reflects a longer career arc: promotions wait until probation is complete, recognition requirements rise by title, PIPs use a monitored recovery period rather than one-strike termination, and sustained clean closure work can clear closure coaching or a closure-quality PIP. Keyboard: Enter sends a public reply; Shift+Enter adds a new line; Ctrl/Command+Enter also sends; / or Ctrl/Command+K focuses ticket search; arrow keys move through the ticket queue when it has focus; Left/Right, Home, and End move among workspace tabs; Escape closes ordinary dialogs. Focus indicators, screen-reader labels, reduced-motion support, and larger mobile touch targets are enabled throughout the workspace.</p><div class="contextcard"><h4>Keyboard shortcuts</h4><div class="a11y-shortcuts"><kbd>/</kbd><span>Focus ticket search</span><kbd>Ctrl/⌘ + K</kbd><span>Focus ticket search</span><kbd>Enter</kbd><span>Send public reply</span><kbd>Shift + Enter</kbd><span>New line in public reply</span><kbd>Ctrl/⌘ + Enter</kbd><span>Send public reply</span><kbd>↑ / ↓</kbd><span>Move through focused ticket queue</span><kbd>← / →</kbd><span>Move through focused workspace tabs</span><kbd>Esc</kbd><span>Close an open dialog</span></div></div></div>`);
function activateWorkspaceTab(button,focus=false){
 if(!button)return;activeTab=button.dataset.tab;renderTab();if(focus)document.getElementById(`tab-${activeTab}`)?.focus?.();
}
document.querySelectorAll(".tab").forEach(b=>{
 b.onclick=()=>activateWorkspaceTab(b,false);
 b.onkeydown=e=>{
   const tabs=[...document.querySelectorAll(".tab")],i=tabs.indexOf(b);let next=null;
   if(e.key==="ArrowRight")next=tabs[(i+1)%tabs.length];
   else if(e.key==="ArrowLeft")next=tabs[(i-1+tabs.length)%tabs.length];
   else if(e.key==="Home")next=tabs[0];
   else if(e.key==="End")next=tabs[tabs.length-1];
   if(next){e.preventDefault();activateWorkspaceTab(next,true)}
 };
});
const genericModal=document.getElementById("genericModal");
genericModal.onclick=e=>{if(e.target.id==="genericModal")hideModal()};
genericModal.addEventListener("keydown",e=>{
 if(e.key==="Escape"){e.preventDefault();hideModal();return}
 if(e.key!=="Tab")return;
 const focusable=modalFocusable(document.getElementById("genericModalCard"));if(!focusable.length){e.preventDefault();document.getElementById("genericModalCard").focus();return}
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
const startModal=document.getElementById("startModal");
startModal.addEventListener("keydown",e=>{
 if(e.key!=="Tab")return;
 const focusable=modalFocusable(startModal);if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
document.addEventListener?.("keydown",e=>{
 const target=e.target,tag=String(target?.tagName||"").toLowerCase(),typing=["input","textarea","select"].includes(tag)||target?.isContentEditable;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();const search=document.getElementById("globalSearch");search.focus();search.select?.();return}
 if(e.key==="/"&&!typing&&genericModal.classList.contains("hidden")){e.preventDefault();const search=document.getElementById("globalSearch");search.focus();search.select?.()}
});
/* Bootstrap only after every data table, const binding, function, and DOM reference above is initialized. */
bootstrapApplicationState();
setInterval(processPending,450);

if(state.active&&state.tickets.length){
 document.getElementById("startModal").classList.add("hidden");
 processPending();
}else if(state.tickets.length&&!state.active){
 document.getElementById("startModal").classList.add("hidden");
}
renderAll();
if(startupRecoveryError)toast("Saved career could not be loaded; a recovery copy was preserved.");
if(!document.getElementById("startModal").classList.contains("hidden"))document.getElementById("startModal").querySelector("select,button")?.focus?.();

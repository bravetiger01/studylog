import {create} from "zustand";
import {addDays,format} from "date-fns";
export type Topic={id:string;name:string;done:boolean};
export type Chapter={id:string;name:string;topics:Topic[]};
export type Subject={id:string;name:string;abbr:string;color:string;priority:string;chapters:Chapter[]};
export type Task={id:string;title:string;subjectId:string;type:string;date:string;start:string;end:string;status:"todo"|"done"|"skipped";goal:"primary"|"secondary"|"recall"};
export type Session={id:string;taskId?:string;subjectId:string;start:number;end:number;ms:number};
export type Active={subjectId:string;taskId?:string;startedAt:number;accMs:number;runningSince:number|null;targetMin:number};
export type Exam={id:string;subjectId:string;date:string};
export type Data={subjects:Subject[];exams:Exam[];tasks:Task[];sessions:Session[];active:Active|null;settings:{targetHours:number}};
export const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
export const today=()=>format(new Date(),"yyyy-MM-dd");
export const mins=(s:string,e:string)=>{const f=(x:string)=>+x.slice(0,2)*60+ +x.slice(3,5);return Math.max(0,f(e)-f(s))};
export const elapsed=(a:Active)=>a.accMs+(a.runningSince?Date.now()-a.runningSince:0);
// Bump this version string whenever the seed data changes significantly.
// If stored data has fewer tasks than the seed, it will be replaced.
const SEED_VERSION = "2026-11-23-adbms";
const db=()=>new Promise<IDBDatabase>((ok,no)=>{const r=indexedDB.open("studylog",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const load=async():Promise<Data|null>=>{const d=await db();return new Promise(ok=>{const q=d.transaction("kv").objectStore("kv").get("data");q.onsuccess=()=>ok(q.result??null);q.onerror=()=>ok(null)})};
const loadVersion=async():Promise<string|null>=>{const d=await db();return new Promise(ok=>{const q=d.transaction("kv").objectStore("kv").get("seed_version");q.onsuccess=()=>ok(q.result??null);q.onerror=()=>ok(null)})};
const save=async(v:Data)=>{const d=await db();const tx=d.transaction("kv","readwrite");const kv=tx.objectStore("kv");kv.put(v,"data");kv.put(SEED_VERSION,"seed_version")};
const S=(id:string,name:string,abbr:string,color:string,priority:string):Subject=>({id,name,abbr,color,priority,chapters:[]});

const adbmsChapters: Chapter[] = [
 {
  id: "adbms-c1",
  name: "Chapter 1 — Database Architecture",
  topics: [
   "Client–Server Database Models",
   "Concurrency Control Techniques",
   "Lock-Based Protocols",
   "Lock Granting Methods",
   "Two-Phase Locking Protocol",
   "Parallel Databases",
   "Parallel Database Architecture",
   "Types of Parallelism",
   "Parallel Database Implementation Strategies",
   "Distributed Databases",
   "Distributed Database Architecture",
   "Advantages of Distributed Databases",
   "Issues and Challenges in Distributed Database Systems",
  ].map((name, i) => ({ id: `adbms-c1-t${i + 1}`, name, done: false })),
 },
 {
  id: "adbms-c2",
  name: "Chapter 2 — Object-Based Databases and XML",
  topics: [
   "Object-Based Databases",
   "Complex Data Types",
   "Structured Types and Inheritance in SQL",
   "Table Inheritance",
   "Array and Multiset Types in SQL",
   "Object Identity (OI)",
   "Reference Types in SQL",
   "Introduction to XML",
   "Structure of XML Data",
   "XML Document Schema",
   "XPath",
   "XQuery (FLWOR Expressions)",
   "Joins",
   "Nested Queries",
   "Aggregate Functions",
   "User-Defined Functions",
  ].map((name, i) => ({ id: `adbms-c2-t${i + 1}`, name, done: false })),
 },
 {
  id: "adbms-c3",
  name: "Chapter 3 — Advanced Database Techniques",
  topics: [
   "Structured vs Unstructured Data",
   "NoSQL Database Concepts",
   "Types of NoSQL Databases",
   "NoSQL Data Modeling",
   "Advantages of NoSQL Databases",
   "SQL vs NoSQL Database Systems",
   "Introduction to MongoDB",
   "MongoDB Shell",
   "MongoDB Client",
   "MongoDB Basic Operations",
   "MongoDB Basic Data Types",
   "MongoDB Arrays and Embedded Documents",
   "Querying with MongoDB",
   "find() Function",
   "Projection of Fields",
   "Query Criteria",
   "OR Queries",
   "Type-Specific Querying",
   "Aggregation Concepts",
   "Aggregation Pipeline",
   "Aggregation Using MapReduce",
   "Single-Purpose Aggregation Operations",
  ].map((name, i) => ({ id: `adbms-c3-t${i + 1}`, name, done: false })),
 },
 {
  id: "adbms-c4",
  name: "Chapter 4 — Advanced Transaction Processing",
  topics: [
   "Basics of Transactions",
   "ACID Properties",
   "Transaction Processing Monitors",
   "Transaction Processing Monitor Architecture",
   "Transactional Workflows",
   "Workflow Architectures",
   "Recovery of Workflow",
   "Real-Time Transaction Systems",
   "Long-Duration Transactions",
   "Implementation Issues",
   "Transaction Nesting",
   "Compensating Transactions",
   "Concurrency",
  ].map((name, i) => ({ id: `adbms-c4-t${i + 1}`, name, done: false })),
 },
 {
  id: "adbms-c5",
  name: "Chapter 5 — Modern Developments in Database Technologies",
  topics: [
   "Data Mining Techniques",
   "Data Mining and Data Warehousing",
   "Association Rules",
   "Classification",
   "Clustering",
   "Applications of Data Mining",
   "Business Intelligence",
   "Features of Business Intelligence",
   "Business Intelligence Frameworks",
   "Machine Learning",
   "Types of Machine Learning",
   "Machine Learning Approaches",
   "Multimedia Databases",
   "Mobile Databases",
   "Digital Databases",
  ].map((name, i) => ({ id: `adbms-c5-t${i + 1}`, name, done: false })),
 },
];

let _id=0;
const id=()=>"t"+(_id++).toString().padStart(4,"0")+Math.random().toString(36).slice(2,5);

export const seed=():Data=>{
 const subjects=[
  S("aad","Analysis and Design of Algorithms","AAD","#276B5A","High"),
  {...S("adbms","Advanced Database Management Systems","ADBMS","#C65B55","Very High"), chapters: adbmsChapters},
  S("ds","Data Science","DS","#5685B8","High"),
  S("pm","Project Management","PM","#D89B54","Medium"),
  S("cs","Cyber Security","CS","#6F8A3D","Medium"),
  S("wad","Web Application Development","WAD","#8C6A4F","Medium"),
 ];

 const exams:Exam[]=[
  {id:"x-aad",subjectId:"aad",date:"2026-12-02"},
  {id:"x-adbms",subjectId:"adbms",date:"2026-12-04"},
  {id:"x-ds",subjectId:"ds",date:"2026-12-07"},
  {id:"x-pm",subjectId:"pm",date:"2026-12-15"},
  {id:"x-cs",subjectId:"cs",date:"2026-12-17"},
  {id:"x-wad",subjectId:"wad",date:"2026-12-22"},
 ];

 const T=(date:string,title:string,subjectId:string,type:string,start:string,end:string,goal:Task["goal"]):Task=>
  ({id:id(),title,subjectId,type,date,start,end,status:"todo",goal});

 const tasks:Task[]=[
  // ── 22 Nov (Sun) ──────────────────────────────────────
  T("2026-11-22","AAD — Algorithm definition, properties & complexity analysis","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-22","AAD — Big-O/Theta/Omega, loop analysis & loop invariants","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-22","ADBMS — Client-server architecture, two-tier & three-tier models","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-22","Active recall — AAD Unit 1 & ADBMS architecture","aad","Active recall","20:00","20:30","recall"),

  // ── 23 Nov (Mon) ──────────────────────────────────────
  T("2026-11-23","AAD — Bubble, Selection, Insertion & Heap Sort","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-23","AAD — Trace sorting algorithms, compare time & space complexities","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-23","DS — Data Science vs Engineering vs Analytics, Big Data traits","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-23","Active recall — AAD Unit 2 & DS Unit 1","aad","Active recall","20:00","20:30","recall"),

  // ── 24 Nov (Tue) ──────────────────────────────────────
  T("2026-11-24","AAD — Divide & Conquer, recurrences & recurrence-solving methods","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-24","AAD — Binary Search, Merge Sort, Quick Sort & Max-Min problems","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-24","ADBMS — Lock-based protocols, two-phase locking & parallel databases","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-24","Active recall — AAD Unit 3 & ADBMS Unit 1","aad","Active recall","20:00","20:30","recall"),

  // ── 25 Nov (Wed) ──────────────────────────────────────
  T("2026-11-25","AAD — Dynamic Programming, optimality principle & general method","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-25","AAD — Making Change, Knapsack & Matrix Chain Multiplication","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-25","DS — Python essentials, Lists, Dicts, Sets & NumPy","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-25","Active recall — AAD Unit 4 & DS Unit 2","aad","Active recall","20:00","20:30","recall"),

  // ── 26 Nov (Thu) ──────────────────────────────────────
  T("2026-11-26","AAD — Greedy algorithms & greedy strategy","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-26","AAD — Activity Selection, Fractional Knapsack, Job Scheduling & Huffman Trees","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-26","ADBMS — Object-based DBs, structured types, inheritance, array & multiset types","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-26","Active recall — AAD Unit 5 & ADBMS Unit 2","aad","Active recall","20:00","20:30","recall"),

  // ── 27 Nov (Fri) ──────────────────────────────────────
  T("2026-11-27","AAD — Graph representation, BFS, DFS, topological sort & connected components","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-27","AAD — Kruskal, Prim, Dijkstra & shortest-path problems","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-27","DS — Data types, measurement scales, quartiles, skewness, kurtosis & probability distributions","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-27","Active recall — AAD Unit 6 & DS Units 3–4","aad","Active recall","20:00","20:30","recall"),

  // ── 28 Nov (Sat) ──────────────────────────────────────
  T("2026-11-28","AAD — Backtracking & Branch and Bound","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-28","AAD — N-Queens, Sum of Subsets, Graph Coloring & TSP","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-28","ADBMS — XML structure, schema, XPath & introduction to XQuery","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-28","Active recall — AAD Unit 7 & ADBMS Unit 2 (XML)","aad","Active recall","20:00","20:30","recall"),

  // ── 29 Nov (Sun) ──────────────────────────────────────
  T("2026-11-29","AAD — P, NP, NP-Hard, NP-Complete, polynomial reduction, approximation & randomized algorithms","aad","Learn new concepts","11:00","13:00","primary"),
  T("2026-11-29","AAD — Mixed questions from Units 1–8","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-29","DS — Sampling, population parameters, sample statistics & sampling methods","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-29","Active recall — AAD Units 1–8 & DS Unit 5","aad","Active recall","20:00","20:30","recall"),

  // ── 30 Nov (Mon) ──────────────────────────────────────
  T("2026-11-30","AAD — Revision Units 1–4","aad","Revision","11:00","13:00","primary"),
  T("2026-11-30","AAD — Revision Units 5–8, algorithm traces & complexity problems","aad","Practice questions","14:00","15:30","primary"),
  T("2026-11-30","ADBMS — SQL vs NoSQL, NoSQL types, data modelling & MongoDB intro","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-11-30","Active recall — AAD full syllabus","aad","Active recall","20:00","20:30","recall"),

  // ── 1 Dec (Tue) ───────────────────────────────────────
  T("2026-12-01","AAD — Full timed question paper","aad","Mock examination","11:00","13:00","primary"),
  T("2026-12-01","AAD — Check answers, record mistakes & revise weak algorithms","aad","Review mistakes","14:00","15:30","primary"),
  T("2026-12-01","ADBMS — MongoDB CRUD, find(), projections, query criteria & aggregation","adbms","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-01","Active recall — AAD weak algorithms & ADBMS Unit 3","aad","Active recall","20:00","20:30","recall"),

  // ── 2 Dec (Wed) — AAD EXAM ────────────────────────────
  // No scheduled study tasks; exam day. Light optional revision only.
  T("2026-12-02","[Optional] ADBMS — Light revision Units 1–3","adbms","Revision","17:00","18:30","secondary"),

  // ── 3 Dec (Thu) ───────────────────────────────────────
  T("2026-12-03","ADBMS — Transactions, ACID, workflows, recovery & real-time transactions","adbms","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-03","ADBMS — Questions covering XML, MongoDB, transactions & DB architectures","adbms","Practice questions","14:00","15:30","primary"),
  T("2026-12-03","DS — CLT, sample size, estimation of mean, standard error & estimation methods","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-03","Active recall — ADBMS Units 1–5 & DS Unit 5","adbms","Active recall","20:00","20:30","recall"),

  // ── 4 Dec (Fri) — ADBMS EXAM ─────────────────────────
  T("2026-12-04","[Optional] DS — Light revision Units 5–6","ds","Revision","17:00","18:30","secondary"),

  // ── 5 Dec (Sat) ───────────────────────────────────────
  T("2026-12-05","DS — Sampling, estimation & simple linear regression (Units 5–6)","ds","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-05","DS — Estimation numericals, least squares, regression coefficients & prediction","ds","Practice questions","14:00","15:30","primary"),
  T("2026-12-05","DS — Logistic Regression, classification, decision trees & Naïve Bayes (Units 7–8)","ds","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-05","Active recall — DS Units 5–8","ds","Active recall","20:00","20:30","recall"),

  // ── 6 Dec (Sun) ───────────────────────────────────────
  T("2026-12-06","DS — Decision trees, ID3, CHAID, Random Forest & case studies (Units 8–9)","ds","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-06","DS — Full paper practice & error analysis","ds","Mock examination","14:00","15:30","primary"),
  T("2026-12-06","DS — Revision: Distributions, sampling, estimation & regression formulas","ds","Revision","16:30","18:00","secondary"),
  T("2026-12-06","Active recall — DS formulas & weak topics","ds","Active recall","20:00","20:30","recall"),

  // ── 7 Dec (Mon) — DS EXAM ────────────────────────────
  // Exam day — no study tasks

  // ── 8 Dec (Tue) ───────────────────────────────────────
  T("2026-12-08","PM — Project definition, characteristics, three goals, life cycle & selection","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-08","PM — Project formulation, portfolio process, uncertainty & key definitions","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-08","CS — Cybercrime definitions, classification, global perspectives & international cooperation","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-08","Active recall — PM Unit 1 & CS Unit 1","pm","Active recall","20:00","20:30","recall"),

  // ── 9 Dec (Wed) ───────────────────────────────────────
  T("2026-12-09","PM — Project Manager roles, responsibilities, selection & cross-functional teams","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-09","PM — Dedicated, functional & matrix organizations; advantages & disadvantages","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-09","CS — Social engineering, phishing, pretexting, baiting, quid pro quo & impersonation","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-09","Active recall — PM Unit 2 & CS Unit 2","pm","Active recall","20:00","20:30","recall"),

  // ── 10 Dec (Thu) ──────────────────────────────────────
  T("2026-12-10","PM — WBS, project planning, responsibility matrix & project plans","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-10","PM — Draw WBS, responsibility matrix & explain the planning process","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-10","CS — Cyberstalking, social media crime, botnets, attack vectors & investigation challenges","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-10","Active recall — PM Unit 2 (planning) & CS Unit 2","pm","Active recall","20:00","20:30","recall"),

  // ── 11 Dec (Fri) ──────────────────────────────────────
  T("2026-12-11","PM — Budgeting methods & cost estimation","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-11","PM — Cost estimates, budget uncertainty & risk-management questions","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-11","CS — Mobile & wireless security, credit card fraud, mobile attacks & mitigation","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-11","Active recall — PM Unit 3 & CS Unit 3","pm","Active recall","20:00","20:30","recall"),

  // ── 12 Dec (Sat) ──────────────────────────────────────
  T("2026-12-12","PM — Gantt charts, milestone charts, PERT, CPM, AON & AOA","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-12","PM — Network construction, three-time estimates & critical path calculations","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-12","CS — Proxy servers, anonymizers, Tor architecture & phishing attack lifecycle","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-12","Active recall — PM Unit 4 & CS Unit 4","pm","Active recall","20:00","20:30","recall"),

  // ── 13 Dec (Sun) ──────────────────────────────────────
  T("2026-12-13","PM — Early/late schedules, resource allocation, levelling & crashing","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-13","PM — PERT probability, resource loading, constrained scheduling & crashing numericals","pm","Practice questions","14:00","15:30","primary"),
  T("2026-12-13","CS — SQL injection, buffer overflow, phishing, identity theft & online fraud","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-13","Active recall — PM Unit 4 & CS Unit 5","pm","Active recall","20:00","20:30","recall"),

  // ── 14 Dec (Mon) ──────────────────────────────────────
  T("2026-12-14","PM — Monitoring, controlling, Earned Value Analysis & project control","pm","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-14","PM — Full paper practice & correction of mistakes","pm","Mock examination","14:00","15:30","primary"),
  T("2026-12-14","CS — Networking, firewalls, IDS/IPS, Nmap scanning & Metasploit concepts (Units 6–7)","cs","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-14","Active recall — PM Unit 5 & CS Units 6–7","pm","Active recall","20:00","20:30","recall"),

  // ── 15 Dec (Tue) — PM EXAM ───────────────────────────
  T("2026-12-15","[Optional] CS — Light revision Units 1–3","cs","Revision","17:00","18:30","secondary"),

  // ── 16 Dec (Wed) ──────────────────────────────────────
  T("2026-12-16","CS — Revision Units 1–3: Cybercrime, social engineering & mobile security","cs","Revision","11:00","13:00","primary"),
  T("2026-12-16","CS — Revision Units 4–7: Attack methods, networking, Nmap & Metasploit","cs","Revision","14:00","15:30","primary"),
  T("2026-12-16","CS — Full paper practice & mistake analysis","cs","Mock examination","16:30","18:00","secondary"),
  T("2026-12-16","Active recall — CS weak topics","cs","Active recall","20:00","20:30","recall"),

  // ── 17 Dec (Thu) — CS EXAM ───────────────────────────
  // Exam day — no study tasks

  // ── 18 Dec (Fri) ──────────────────────────────────────
  T("2026-12-18","WAD — Web technologies, client-server architecture, HTML structure, tags, forms & tables","wad","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-18","WAD — HTML/CSS exercises, semantic elements, Flexbox & responsive design","wad","Practice questions","14:00","15:30","primary"),
  T("2026-12-18","WAD — Bootstrap, media queries & responsive layouts","wad","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-18","Active recall — WAD Modules 1–2","wad","Active recall","20:00","20:30","recall"),

  // ── 19 Dec (Sat) ──────────────────────────────────────
  T("2026-12-19","WAD — JavaScript variables, data types, operators, conditions, loops, functions, arrays & objects","wad","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-19","WAD — DOM manipulation, event handling & Local Storage exercises","wad","Practice questions","14:00","15:30","primary"),
  T("2026-12-19","WAD — APIs, HTTP requests/responses, status codes, JSON & CRUD (Module 4)","wad","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-19","Active recall — WAD Modules 3–4","wad","Active recall","20:00","20:30","recall"),

  // ── 20 Dec (Sun) ──────────────────────────────────────
  T("2026-12-20","WAD — Node.js, npm, HTTP servers, Express.js & middleware (Module 5)","wad","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-20","WAD — REST API development, database connectivity, CRUD & Postman","wad","Practice questions","14:00","15:30","primary"),
  T("2026-12-20","WAD — React, JSX, components, props, state & hooks (Module 6)","wad","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-20","Active recall — WAD Modules 5–6","wad","Active recall","20:00","20:30","recall"),

  // ── 21 Dec (Mon) ──────────────────────────────────────
  T("2026-12-21","WAD — useState, useEffect, conditional/list rendering, API integration & CORS","wad","Learn new concepts","11:00","13:00","primary"),
  T("2026-12-21","WAD — Full timed paper practice & review of incorrect answers","wad","Mock examination","14:00","15:30","primary"),
  T("2026-12-21","WAD — Hosting, domains, SEO, CAPTCHA & cloud concepts (Module 7)","wad","Learn new concepts","16:30","18:00","secondary"),
  T("2026-12-21","Active recall — WAD Modules 1–7","wad","Active recall","20:00","20:30","recall"),

  // ── 22 Dec (Tue) — WAD EXAM ──────────────────────────
  // Exam day — preparation complete
 ];

 return {subjects,exams,tasks,sessions:[],active:null,settings:{targetHours:5.5}};
};

type St=Data&{ready:boolean;hydrate:()=>Promise<void>;mut:(f:(d:Data)=>Partial<Data>)=>void;replace:(d:Data)=>void;
 start:(subjectId:string,taskId?:string,targetMin?:number)=>void;pause:()=>void;resume:()=>void;finish:()=>void;discard:()=>void};
const pick=(s:St):Data=>({subjects:s.subjects,exams:s.exams,tasks:s.tasks,sessions:s.sessions,active:s.active,settings:s.settings});
export const useStore=create<St>((set,get)=>{
 const commit=(p:Partial<Data>)=>{set(p as any);save(pick(get()))};
 return {...seed(),ready:false,
 hydrate:async()=>{
  const [d,ver]=await Promise.all([load(),loadVersion()]);
  const freshSeed=seed();
  if(!d){
   set({...freshSeed,ready:true});save(freshSeed);
  } else {
   // If SEED_VERSION changed, update ADBMS chapters specifically while preserving
   // tasks, sessions, exams, other subjects (e.g. AAD), and any already checked topic states!
   const seedAdbms=freshSeed.subjects.find(s=>s.id==="adbms")!;
   const currentAdbms=d.subjects?.find(s=>s.id==="adbms");
   let updatedSubjects=d.subjects??freshSeed.subjects;

   if(!currentAdbms || currentAdbms.chapters?.length !== 5 || ver!==SEED_VERSION){
    const existingDone=new Map<string,boolean>();
    currentAdbms?.chapters?.forEach(c=>c.topics?.forEach(t=>{ if(t.done) existingDone.set(t.name,true); }));

    updatedSubjects=updatedSubjects.map(s=>{
     if(s.id==="adbms"){
      return {
       ...seedAdbms,
       chapters: seedAdbms.chapters.map(c=>({
        ...c,
        topics: c.topics.map(t=>({
         ...t,
         done: existingDone.get(t.name) ?? false
        }))
       }))
      };
     }
     return s;
    });
   }

   const merged:Data={
    ...freshSeed,
    ...d,
    subjects: updatedSubjects,
    sessions: d.sessions??[],
    active: d.active??null,
    settings: d.settings??freshSeed.settings
   };
   set({...merged,ready:true});save(merged);
  }
 },
 mut:f=>commit(f(pick(get()))),replace:d=>commit(d),
 start:(subjectId,taskId,targetMin=0)=>{if(get().active)return;const n=Date.now();commit({active:{subjectId,taskId,startedAt:n,accMs:0,runningSince:n,targetMin}})},
 pause:()=>{const a=get().active;if(a?.runningSince)commit({active:{...a,accMs:elapsed(a),runningSince:null}})},
 resume:()=>{const a=get().active;if(a&&!a.runningSince)commit({active:{...a,runningSince:Date.now()}})},
 finish:()=>{const s=get(),a=s.active;if(!a)return;const ms=elapsed(a);commit({active:null,sessions:ms>=1000?[...s.sessions,{id:uid(),taskId:a.taskId,subjectId:a.subjectId,start:a.startedAt,end:Date.now(),ms}]:s.sessions})},
 discard:()=>commit({active:null})};
});
export const tomorrow=(d:string)=>format(addDays(new Date(d+"T00:00:00"),1),"yyyy-MM-dd");

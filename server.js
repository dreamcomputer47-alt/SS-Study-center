const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let webpush = null;
try { webpush = require('web-push'); } catch {}

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SS@Admin2026';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(ROOT, 'uploads');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
fs.mkdirSync(UPLOADS, {recursive:true});
fs.mkdirSync(DATA_DIR, {recursive:true});

const defaultFaculty = [{"id":"surajit","name":"Surajit Sarkar","subjects":"Math & GK","role":"MAIN TEACHER • SCIENCE & GK SPECIALIST","desc":"NCERT Science, Physics, Chemistry, Biology এবং General Knowledge-এর exam-oriented preparation। Railway Group D, NTPC, ALP, JE ও অন্যান্য competitive government exam-এর জন্য concept clarity এবং practice-focused teaching.","tags":["Science","GK","NCERT","Railway","PYQ"],"featured":true,"image":"/uploads/surajit-sir.jpg"},{"id":"palash","name":"Palash Sir","subjects":"Math & Science","role":"FACULTY • MATH & SCIENCE","desc":"Mathematics ও Science-এর concept-based preparation.","tags":["Math","Science"],"featured":false,"image":""},{"id":"raju","name":"Raju Sir","subjects":"Math & GK","role":"FACULTY • MATH & GK","desc":"Mathematics এবং General Knowledge-এর exam-focused classes.","tags":["Math","GK"],"featured":false,"image":""},{"id":"raja","name":"Raja Sir","subjects":"Math & Reasoning","role":"FACULTY • MATH & REASONING","desc":"Mathematics ও Reasoning-এর practice এবং problem solving.","tags":["Math","Reasoning"],"featured":false,"image":""},{"id":"gopal","name":"Gopal Sir","subjects":"Math & Reasoning","role":"FACULTY • MATH & REASONING","desc":"Mathematics ও Reasoning-এর নিয়মিত practice ও shortcuts.","tags":["Math","Reasoning"],"featured":false,"image":""},{"id":"papai","name":"Papai Sir","subjects":"Math & Reasoning","role":"FACULTY • MATH & REASONING","desc":"Mathematics ও Reasoning-এর competitive exam preparation.","tags":["Math","Reasoning"],"featured":false,"image":""}];
const defaultCourses = [
  {id:'ncert-science',name:'NCERT Science',icon:'⚛',desc:'Physics, Chemistry ও Biology — সব আলাদা subject.',subjects:[['physics','Physics'],['chemistry','Chemistry'],['biology','Biology']]},
  {id:'mathematics',name:'Mathematics',icon:'➗',desc:'Math concept, shortcut ও Railway practice.',subjects:[['maths','Mathematics']]},
  {id:'railway-pyq',name:'Railway PYQ',icon:'🚆',desc:'Previous Year Questions ও pattern-based practice.',subjects:[['railway','Railway PYQ']]},
  {id:'technical',name:'Technical',icon:'⚙',desc:'Technical / ITI exam preparation.',subjects:[['technical','Technical']]},
  {id:'reasoning',name:'Reasoning',icon:'🧠',desc:'Reasoning chapter-wise practice.',subjects:[['reasoning','Reasoning']]},
  {id:'gk-gs',name:'GK / GS',icon:'🌍',desc:'General Knowledge & General Studies.',subjects:[['gk','GK / GS']]}
];
const defaultData = {videos: [], affairs: [], assets: [], achievers: [], comments: [], notifications: [], pushSubscriptions: [], students: [], purchaseRequests: [], ebookPurchaseRequests: [], ebooks: [], mockTests: [], railwayNotifications: [], faculty: defaultFaculty, settings: {courseCatalog: defaultCourses, coursePricing:{}, phone:'+91 96149 41455', youtube:'https://youtube.com/@scienceexpressbysurajit', facebook:'https://www.facebook.com/share/1F21diM9hD/', telegram:'https://t.me/+lDDwpgOh3FM4MDk1', logo:'', banner:'', live:{active:false,title:'SS Study Centre Live Class',description:'Live classes for Railway and Government Job preparation.',youtubeUrl:'',schedule:''}}};
function courseCatalog(){ return Array.isArray(db.settings?.courseCatalog)&&db.settings.courseCatalog.length ? db.settings.courseCatalog : defaultCourses; }
function courseForVideo(v){
  if(v.course) return String(v.course);
  const ch=String(v.chapter||v.subject||'').toLowerCase();
  if(['physics','chemistry','biology'].includes(ch)) return 'ncert-science';
  if(ch==='maths') return 'mathematics';
  if(ch==='railway') return 'railway-pyq';
  if(ch==='technical') return 'technical';
  if(ch==='reasoning') return 'reasoning';
  if(ch==='gk') return 'gk-gs';
  return 'ncert-science';
}
function subjectForVideo(v){
  return String(v.subject||v.chapter||'general');
}
function loadData(){ try { const saved=JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); return {...defaultData, ...saved, settings:{...defaultData.settings,...(saved.settings||{}),courseCatalog:Array.isArray(saved.settings?.courseCatalog)&&saved.settings.courseCatalog.length?saved.settings.courseCatalog:defaultCourses}, faculty:Array.isArray(saved.faculty)&&saved.faculty.length?saved.faculty:defaultFaculty.map(x=>({...x}))}; } catch { return {...defaultData, settings:{...defaultData.settings}, faculty:defaultFaculty.map(x=>({...x}))}; } }
let db = loadData();
db.pushSubscriptions = Array.isArray(db.pushSubscriptions) ? db.pushSubscriptions : [];
function getVapidKeys(){
  if(!webpush) return null;
  if(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) return {publicKey:process.env.VAPID_PUBLIC_KEY, privateKey:process.env.VAPID_PRIVATE_KEY};
  try { if(fs.existsSync(VAPID_FILE)) return JSON.parse(fs.readFileSync(VAPID_FILE,'utf8')); } catch {}
  try { const keys=webpush.generateVAPIDKeys(); fs.writeFileSync(VAPID_FILE, JSON.stringify(keys,null,2)); return keys; } catch { return null; }
}
const vapidKeys = getVapidKeys();
if(webpush && vapidKeys){ try { webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:ssstudycentre@example.com', vapidKeys.publicKey, vapidKeys.privateKey); } catch {} }
function sendPush(payload){
  if(!webpush || !vapidKeys || !db.pushSubscriptions.length) return;
  const body=JSON.stringify(payload);
  db.pushSubscriptions.slice().forEach(sub=>webpush.sendNotification(sub, body).catch(err=>{ if(err && (err.statusCode===404 || err.statusCode===410)){ db.pushSubscriptions=db.pushSubscriptions.filter(x=>x.endpoint!==sub.endpoint); saveData(); } }));
}
function addNotification({type='notice',title,message,url='#',push=true,courseId=''}){
  const item={id:id(),type,title,message,url:String(url||'#').slice(0,300),courseId:String(courseId||''),createdAt:new Date().toISOString()};
  db.notifications=db.notifications||[]; db.notifications.push(item); saveData();
  if(push) sendPush({title:item.title,body:item.message,url:item.url,tag:item.id});
  return item;
}
function saveData(){ fs.writeFileSync(DATA_FILE, JSON.stringify(db,null,2)); }
function id(){ return crypto.randomUUID(); }
function safeName(original){ return Date.now()+'-'+crypto.randomBytes(5).toString('hex')+'-'+path.basename(original).replace(/[^a-zA-Z0-9._-]/g,'_'); }
const studentSessions = new Map();
function studentToken(req){ const h=req.headers.cookie||''; const m=h.match(/ss_student=([^;]+)/); return m ? m[1] : ''; }
function hashPassword(p){ return crypto.createHash('sha256').update(String(p||'')).digest('hex'); }
function rememberToken(req){ const h=req.headers.cookie||''; const m=h.match(/ss_student_remember=([^;]+)/); return m ? m[1] : ''; }
function currentStudent(req){ const sid=studentSessions.get(studentToken(req)); if(sid) return (db.students||[]).find(s=>s.id===sid) || null; const rt=rememberToken(req); if(!rt) return null; const rh=hashPassword(rt); return (db.students||[]).find(s=>s.rememberTokenHash===rh) || null; }
function setStudentCookies(res,s){ const session=crypto.randomBytes(32).toString('hex'); const remember=crypto.randomBytes(48).toString('hex'); s.rememberTokenHash=hashPassword(remember); studentSessions.set(session,s.id); const secure=process.env.NODE_ENV==='production'?'; Secure':''; res.setHeader('Set-Cookie',[`ss_student=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`,`ss_student_remember=${remember}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure}`]); }
function studentView(s){ if(!s) return null; const {passwordHash,securityAnswerHash,rememberTokenHash,...safe}=s; return safe; }
function studentAuth(req,res,next){ const s=currentStudent(req); if(!s) return res.status(401).json({error:'login required'}); if(s.blocked) return res.status(403).json({error:'Student blocked'}); req.student=s; next(); }

function cookieToken(req){ const h=req.headers.cookie||''; const m=h.match(/ss_admin=([^;]+)/); return m ? m[1] : ''; }
const sessions = new Set();
function auth(req,res,next){ if(!sessions.has(cookieToken(req))) return res.status(401).json({error:'Unauthorized'}); next(); }

const storage = multer.diskStorage({destination: UPLOADS, filename:(req,file,cb)=>cb(null,safeName(file.originalname))});
const upload = multer({storage, limits:{fileSize: 2*1024*1024*1024}});

app.use(express.json({limit:'2mb'}));
app.use('/uploads', express.static(UPLOADS, {maxAge:'7d'}));
app.use(express.static(PUBLIC, {maxAge:'1h'}));

app.get('/api/health', (req,res)=>res.json({ok:true,service:'SS Study Centre',time:new Date().toISOString()}));
app.get('/api/public', (req,res)=>{
  const publicStudent=currentStudent(req);
  res.json({
    currentStudent: studentView(publicStudent),
    courseAccess: publicStudent ? Object.fromEntries((publicStudent.purchases||[]).map(id=>[id,true])) : {},
    ebooks: (db.ebooks||[]).map(x=>({...x,file:undefined,purchased:!!publicStudent&&(publicStudent.ebookPurchases||[]).includes(x.id)})),
    videos: db.videos.map(v=>({...v})),
    affairs: db.affairs.map(a=>({...a})),
    assets: db.assets.map(a=>({...a})),
    achievers: db.achievers.map(a=>({...a})),
    railwayNotifications: (db.railwayNotifications||[]).map(x=>({...x})),
    mockTests: (db.mockTests||[]).map(x=>({...x,questions:(x.questions||[]).map(q=>({...q,solutionImage:undefined}))})),
    comments: db.comments.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,100),
    notifications: (db.notifications||[]).filter(n=>!n.courseId || (publicStudent && (publicStudent.purchases||[]).includes(n.courseId))).slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,30),
    faculty: db.faculty || defaultFaculty,
    settings: db.settings,
    courses: courseCatalog().map(x=>({...x,price:Number(db.settings?.coursePricing?.[x.id])||0,paid:(Number(db.settings?.coursePricing?.[x.id])||0)>0})),
    push: {enabled: !!webpush && !!vapidKeys, publicKey: vapidKeys?.publicKey || '', subscribers: db.pushSubscriptions.length}
  });
});
app.get('/api/student/course/:courseId',(req,res)=>{
  const courseId=String(req.params.courseId||'');
  const course=courseCatalog().find(x=>x.id===courseId);
  if(!course) return res.status(404).json({error:'Course not found'});
  const price=Number(db.settings?.coursePricing?.[courseId])||0;
  const paid=price>0;
  const student=currentStudent(req);
  if(paid){
    if(!student) return res.status(401).json({error:'login required'});
    if(student.blocked) return res.status(403).json({error:'Student blocked'});
  }
  const purchased=!!student && Array.isArray(student.purchases)&&student.purchases.includes(courseId);
  if(paid&&!purchased) return res.status(403).json({error:'Course purchase/approval required',courseId,price,paid:true});
  const videos=(db.videos||[]).map(v=>({...v,course:courseForVideo(v),subject:subjectForVideo(v)})).filter(v=>v.course===courseId);
  res.json({course:{...course,price,paid,purchased},videos});
});
app.get('/api/student/me',(req,res)=>{ const s=currentStudent(req); if(!s) return res.status(401).json({error:'login required'}); if(s.blocked) return res.status(403).json({error:'blocked'}); res.json(studentView(s)); });
app.post('/api/student/register',(req,res)=>{
  const name=String(req.body?.name||'').trim().slice(0,100), phone=String(req.body?.phone||'').replace(/\D/g,'').slice(-10), password=String(req.body?.password||'');
  if(!name||phone.length!==10||password.length<4) return res.status(400).json({error:'Name, valid 10 digit phone and password required'});
  db.students=db.students||[]; if(db.students.some(s=>s.phone===phone)) return res.status(409).json({error:'Phone already registered'});
  const s={id:id(),name,phone,dob:String(req.body?.dob||''),gender:String(req.body?.gender||''),passwordHash:hashPassword(password),securityQuestion:String(req.body?.securityQuestion||''),securityAnswerHash:hashPassword(String(req.body?.securityAnswer||'').trim().toLowerCase()),purchases:[],ebookPurchases:[],saved:[],photo:'',blocked:false,createdAt:new Date().toISOString()};
  db.students.push(s); saveData(); const token=crypto.randomBytes(32).toString('hex'); studentSessions.set(token,s.id); res.setHeader('Set-Cookie',`ss_student=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV==='production'?'; Secure':''}`); res.json(studentView(s));
});
app.post('/api/student/login',(req,res)=>{ const phone=String(req.body?.phone||'').replace(/\D/g,'').slice(-10), password=String(req.body?.password||''); const s=(db.students||[]).find(x=>x.phone===phone); if(!s||s.passwordHash!==hashPassword(password)) return res.status(401).json({error:'Wrong phone or password'}); if(s.blocked) return res.status(403).json({error:'Student blocked'}); setStudentCookies(res,s); saveData(); res.json(studentView(s)); });
app.post('/api/student/logout',(req,res)=>{ const s=currentStudent(req); studentSessions.delete(studentToken(req)); if(s){delete s.rememberTokenHash;saveData();} const secure=process.env.NODE_ENV==='production'?'; Secure':''; res.setHeader('Set-Cookie',[`ss_student=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,`ss_student_remember=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`]); res.json({ok:true}); });
app.post('/api/student/security-question',(req,res)=>{ const phone=String(req.body?.phone||'').replace(/\D/g,'').slice(-10); const s=(db.students||[]).find(x=>x.phone===phone); if(!s) return res.status(404).json({error:'Student not found'}); res.json({question:s.securityQuestion}); });
app.post('/api/student/forgot-password',(req,res)=>{ const phone=String(req.body?.phone||'').replace(/\D/g,'').slice(-10); const s=(db.students||[]).find(x=>x.phone===phone); if(!s||s.securityAnswerHash!==hashPassword(String(req.body?.securityAnswer||'').trim().toLowerCase())) return res.status(400).json({error:'Security answer incorrect'}); const np=String(req.body?.newPassword||''); if(np.length<4)return res.status(400).json({error:'New password must be at least 4 characters'}); s.passwordHash=hashPassword(np); saveData(); res.json({ok:true}); });
app.post('/api/student/save',studentAuth,(req,res)=>{ const cid=String(req.body?.contentId||''); req.student.saved=req.student.saved||[]; req.student.saved=req.student.saved.includes(cid)?req.student.saved.filter(x=>x!==cid):[...req.student.saved,cid]; saveData(); res.json(studentView(req.student)); });
app.post('/api/student/profile',studentAuth,upload.single('photo'),(req,res)=>{ if(req.body.name!==undefined) req.student.name=String(req.body.name).trim().slice(0,100); if(req.body.dob!==undefined)req.student.dob=String(req.body.dob); if(req.body.gender!==undefined)req.student.gender=String(req.body.gender); if(req.file){if(!req.file.mimetype.startsWith('image/')){try{fs.unlinkSync(req.file.path)}catch{};return res.status(400).json({error:'Profile photo must be image'});} removeFile(req.student.photo); req.student.photo='/uploads/'+req.file.filename;} saveData(); res.json(studentView(req.student)); });
app.post('/api/student/purchase-request',studentAuth,(req,res)=>{ const courseId=String(req.body?.courseId||''); const c=courseCatalog().find(x=>x.id===courseId); if(!c)return res.status(404).json({error:'Course not found'}); const price=Number(db.settings?.coursePricing?.[courseId])||0; if(price<=0){req.student.purchases=req.student.purchases||[];if(!req.student.purchases.includes(courseId))req.student.purchases.push(courseId);saveData();return res.json({ok:true,free:true});} db.purchaseRequests=db.purchaseRequests||[]; const pending=db.purchaseRequests.find(x=>x.studentId===req.student.id&&x.courseId===courseId&&x.status==='pending'); if(pending)return res.status(409).json({error:'Purchase request already submitted'}); const item={id:id(),studentId:req.student.id,studentName:req.student.name,phone:req.student.phone,courseId,transactionId:String(req.body?.utr||'').trim(),utr:String(req.body?.utr||'').trim(),status:'pending',createdAt:new Date().toISOString()}; db.purchaseRequests.push(item);saveData();res.json(item); });
app.post('/api/student/ebook-purchase-request',studentAuth,(req,res)=>{const ebookId=String(req.body?.ebookId||'');const e=(db.ebooks||[]).find(x=>x.id===ebookId);if(!e)return res.status(404).json({error:'E-book not found'});if((req.student.ebookPurchases||[]).includes(ebookId))return res.status(409).json({error:'E-book already purchased'});db.ebookPurchaseRequests=db.ebookPurchaseRequests||[];const pending=db.ebookPurchaseRequests.find(x=>x.studentId===req.student.id&&x.ebookId===ebookId&&x.status==='pending');if(pending)return res.status(409).json({error:'Purchase request already submitted'});const utr=String(req.body?.utr||'').trim();const item={id:id(),studentId:req.student.id,studentName:req.student.name,phone:req.student.phone,ebookId,ebookTitle:e.title,price:e.price,transactionId:utr,utr,status:'pending',createdAt:new Date().toISOString()};db.ebookPurchaseRequests.push(item);saveData();res.json(item);});
app.get('/api/student/ebooks/:id/file',studentAuth,(req,res)=>{const e=(db.ebooks||[]).find(x=>x.id===req.params.id);if(!e)return res.status(404).json({error:'E-book not found'});if(!(req.student.ebookPurchases||[]).includes(e.id))return res.status(403).json({error:'E-book purchase/approval required'});const p=path.join(ROOT,String(e.file||'').replace(/^\//,''));if(!p.startsWith(UPLOADS+path.sep)||!fs.existsSync(p))return res.status(404).json({error:'E-book file unavailable'});res.setHeader('Content-Disposition','inline; filename="'+path.basename(p).replace(/"/g,'')+'"');res.sendFile(p);});
app.get('/api/student/mock-tests/:id',(req,res)=>{const x=(db.mockTests||[]).find(x=>x.id===req.params.id);if(!x)return res.status(404).json({error:'Mock test not found'});res.json(x);});
app.post('/api/student/mock-tests/:id/submit',studentAuth,(req,res)=>{
  const x=(db.mockTests||[]).find(x=>x.id===req.params.id);
  if(!x)return res.status(404).json({error:'Mock test not found'});
  const answers=Array.isArray(req.body?.answers)?req.body.answers:[];
  const questions=x.questions||[];
  let score=0;
  const resultQuestions=questions.map((q,i)=>{
    const raw=answers[i];
    const studentAnswer=(raw===null||raw===undefined||raw==='')?null:Number(raw);
    if(studentAnswer!==null && studentAnswer===Number(q.answer)) score++;
    return {q:q.q,options:q.options||[],correctAnswer:Number(q.answer),studentAnswer,solution:q.solutionImage||null};
  });
  res.json({testId:x.id,title:x.title,score,total:questions.length,questions:resultQuestions});
});


app.post('/api/admin/login',(req,res)=>{
  if(String(req.body.password||'') !== ADMIN_PASSWORD) return res.status(401).json({error:'Wrong password'});
  const token=crypto.randomBytes(32).toString('hex'); sessions.add(token);
  res.setHeader('Set-Cookie',`ss_admin=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV==='production'?'; Secure':''}`);
  res.json({ok:true});
});
app.post('/api/admin/logout',auth,(req,res)=>{sessions.delete(cookieToken(req)); res.setHeader('Set-Cookie',`ss_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`); res.json({ok:true});});
app.get('/api/admin/me',auth,(req,res)=>res.json({ok:true}));

app.post('/api/admin/faculty/:id',auth,upload.single('image'),(req,res)=>{
  const item=(db.faculty||[]).find(x=>x.id===req.params.id);
  if(!item) return res.status(404).json({error:'Faculty not found'});
  if(req.body.name!==undefined) item.name=String(req.body.name).trim().slice(0,100);
  if(req.body.subjects!==undefined) item.subjects=String(req.body.subjects).trim().slice(0,120);
  if(req.body.desc!==undefined) item.desc=String(req.body.desc).trim().slice(0,600);
  if(req.file){
    if(!req.file.mimetype.startsWith('image/')){ try{fs.unlinkSync(req.file.path)}catch{}; return res.status(400).json({error:'Faculty photo must be an image'}); }
    removeFile(item.image);
    item.image='/uploads/'+req.file.filename;
  }
  saveData(); res.json(item);
});
app.delete('/api/admin/faculty/:id/image',auth,(req,res)=>{
  const item=(db.faculty||[]).find(x=>x.id===req.params.id);
  if(!item) return res.status(404).json({error:'Faculty not found'});
  removeFile(item.image); item.image=''; saveData(); res.json(item);
});



app.get('/api/push/public-key',(req,res)=>{ if(!webpush || !vapidKeys) return res.status(503).json({enabled:false,error:'Push notifications are not configured'}); res.json({enabled:true,publicKey:vapidKeys.publicKey}); });
app.post('/api/push/subscribe',(req,res)=>{
  if(!webpush || !vapidKeys) return res.status(503).json({error:'Push notifications are not configured'});
  const sub=req.body||{};
  if(!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return res.status(400).json({error:'Invalid push subscription'});
  db.pushSubscriptions=db.pushSubscriptions||[];
  db.pushSubscriptions=db.pushSubscriptions.filter(x=>x.endpoint!==sub.endpoint);
  db.pushSubscriptions.push({endpoint:String(sub.endpoint),expirationTime:sub.expirationTime||null,keys:{p256dh:String(sub.keys.p256dh),auth:String(sub.keys.auth)}});
  saveData(); res.json({ok:true});
});
app.delete('/api/push/subscribe',(req,res)=>{ const endpoint=String(req.body?.endpoint||''); if(endpoint){ db.pushSubscriptions=(db.pushSubscriptions||[]).filter(x=>x.endpoint!==endpoint); saveData(); } res.json({ok:true}); });
app.get('/api/live', (req,res)=>res.json(db.settings?.live || defaultData.settings.live));
app.get('/api/comments', (req,res)=>res.json(db.comments.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,100)));
app.post('/api/comments',studentAuth,(req,res)=>{
  const message=String(req.body.message||'').trim().slice(0,500);
  if(!message) return res.status(400).json({error:'Comment লিখুন'});
  const item={id:id(),studentId:req.student.id,name:req.student.name,message,createdAt:new Date().toISOString()};
  db.comments.push(item); saveData(); res.json(item);
});
app.get('/api/admin/content',auth,(req,res)=>{
  const courses=courseCatalog().map(x=>({...x,price:Number(db.settings?.coursePricing?.[x.id])||0,paid:(Number(db.settings?.coursePricing?.[x.id])||0)>0}));
  res.json({...db,ebooks:db.ebooks||[],ebookPurchaseRequests:db.ebookPurchaseRequests||[],settings:{...db.settings,coursePricing:db.settings?.coursePricing||{}},courses,push:{enabled:!!webpush&&!!vapidKeys,subscribers:(db.pushSubscriptions||[]).length}});
});

app.post('/api/admin/course',auth,upload.single('cover'),(req,res)=>{
  const name=String(req.body.name||'').trim().slice(0,150);
  if(!name) return res.status(400).json({error:'Course name required'});
  if(!req.file || !req.file.mimetype.startsWith('image/')){
    if(req.file) try{fs.unlinkSync(req.file.path)}catch{}
    return res.status(400).json({error:'Course thumbnail / cover image required'});
  }
  const rawId=String(req.body.id||'').trim().toLowerCase();
  const courseId=(rawId||name).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  if(!courseId) return res.status(400).json({error:'Valid Course ID required'});
  if(courseCatalog().some(c=>c.id===courseId)){
    try{fs.unlinkSync(req.file.path)}catch{}
    return res.status(409).json({error:'Course ID already exists'});
  }
  const subjectNames=String(req.body.subjectNames||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);
  if(!subjectNames.length){ try{fs.unlinkSync(req.file.path)}catch{}; return res.status(400).json({error:'At least one subject required'}); }
  const subjects=subjectNames.map(n=>[n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''),n]);
  const item={id:courseId,name,icon:String(req.body.icon||'📚').slice(0,8),desc:String(req.body.desc||'').trim().slice(0,1000),subjects,cover:'/uploads/'+req.file.filename,createdAt:new Date().toISOString()};
  db.settings={...defaultData.settings,...db.settings,courseCatalog:[...courseCatalog(),item],coursePricing:{...(db.settings?.coursePricing||{}),[courseId]:Math.max(0,Number(req.body.price)||0)}};
  saveData();
  addNotification({title:'📚 নতুন Course publish হয়েছে',message:item.name+' — SS Study Centre-এ নতুন course যোগ হয়েছে।',url:'#courses'});
  res.json({...item,price:db.settings.coursePricing[courseId],paid:db.settings.coursePricing[courseId]>0});
});

app.post('/api/admin/course/:id',auth,(req,res)=>{
  const courseId=String(req.params.id||'');
  const item=courseCatalog().find(c=>c.id===courseId);
  if(!item) return res.status(404).json({error:'Course not found'});
  const price=Math.max(0,Number(req.body?.price)||0);
  db.settings={...defaultData.settings,...db.settings,coursePricing:{...(db.settings?.coursePricing||{}),[courseId]:price}};
  saveData(); res.json({...item,price,paid:price>0});
});

app.delete('/api/admin/course/:id',auth,(req,res)=>{
  const courseId=String(req.params.id||'');
  if(['ncert-science','mathematics','railway-pyq','technical','reasoning','gk-gs'].includes(courseId)) return res.status(400).json({error:'Default course cannot be deleted'});
  const list=courseCatalog(); const i=list.findIndex(c=>c.id===courseId);
  if(i<0) return res.status(404).json({error:'Course not found'});
  const [item]=list.splice(i,1); removeFile(item.cover);
  const pricing={...(db.settings?.coursePricing||{})}; delete pricing[courseId];
  db.settings={...defaultData.settings,...db.settings,courseCatalog:list,coursePricing:pricing};
  saveData(); res.json({ok:true});
});

app.post('/api/admin/ebook',auth,upload.fields([{name:'file',maxCount:1},{name:'cover',maxCount:1}]),(req,res)=>{const file=req.files?.file?.[0],cover=req.files?.cover?.[0];if(!file||file.mimetype!=='application/pdf'){if(file)try{fs.unlinkSync(file.path)}catch{};if(cover)try{fs.unlinkSync(cover.path)}catch{};return res.status(400).json({error:'Paid E-book PDF required'});}const item={id:id(),title:String(req.body?.title||file.originalname).trim().slice(0,180),description:String(req.body?.description||'').trim().slice(0,1200),price:Math.max(1,Number(req.body?.price)||0),file:'/uploads/'+file.filename,cover:cover?'/uploads/'+cover.filename:null,size:file.size,createdAt:new Date().toISOString()};db.ebooks=db.ebooks||[];db.ebooks.push(item);saveData();addNotification({title:'📘 নতুন Paid E-book publish হয়েছে',message:item.title+' — E-book Store-এ নতুন বই এসেছে।',url:'#ebooks'});res.json({...item,file:undefined});});
app.delete('/api/admin/ebooks/:id',auth,(req,res)=>{const i=(db.ebooks||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);const [e]=db.ebooks.splice(i,1);removeFile(e.file);removeFile(e.cover);db.ebookPurchaseRequests=(db.ebookPurchaseRequests||[]).filter(r=>r.ebookId!==e.id);saveData();res.json({ok:true});});
app.post('/api/admin/ebook-purchase-requests/:id/approve',auth,(req,res)=>{const r=(db.ebookPurchaseRequests||[]).find(x=>x.id===req.params.id);if(!r)return res.status(404).json({error:'E-book purchase request not found'});const s=(db.students||[]).find(x=>x.id===r.studentId);if(!s)return res.status(404).json({error:'Student not found'});s.ebookPurchases=s.ebookPurchases||[];if(!s.ebookPurchases.includes(r.ebookId))s.ebookPurchases.push(r.ebookId);r.status='approved';r.approvedAt=new Date().toISOString();saveData();res.json({ok:true,student:studentView(s),request:r});});
app.delete('/api/admin/ebook-purchase-requests/:id',auth,(req,res)=>{const i=(db.ebookPurchaseRequests||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);db.ebookPurchaseRequests.splice(i,1);saveData();res.json({ok:true});});
app.get('/api/admin/ebooks',auth,(req,res)=>res.json({ebooks:db.ebooks||[],ebookPurchaseRequests:db.ebookPurchaseRequests||[]}));
app.get('/api/admin/students',auth,(req,res)=>res.json({students:(db.students||[]).map(studentView),purchaseRequests:db.purchaseRequests||[]}));
app.post('/api/admin/students/:id/block',auth,(req,res)=>{const s=(db.students||[]).find(x=>x.id===req.params.id);if(!s)return res.status(404).json({error:'Student not found'});s.blocked=!!req.body?.blocked;saveData();res.json(studentView(s));});
app.post('/api/admin/students/:id/access',auth,(req,res)=>{const s=(db.students||[]).find(x=>x.id===req.params.id);if(!s)return res.status(404).json({error:'Student not found'});const c=String(req.body?.courseId||'');if(!courseCatalog().some(x=>x.id===c))return res.status(404).json({error:'Course not found'});s.purchases=s.purchases||[];if(!s.purchases.includes(c))s.purchases.push(c);saveData();res.json(studentView(s));});
app.post('/api/admin/purchase-requests/:id/approve',auth,(req,res)=>{const r=(db.purchaseRequests||[]).find(x=>x.id===req.params.id);if(!r)return res.status(404).json({error:'Purchase request not found'});const s=(db.students||[]).find(x=>x.id===r.studentId);if(!s)return res.status(404).json({error:'Student not found'});s.purchases=s.purchases||[];if(!s.purchases.includes(r.courseId))s.purchases.push(r.courseId);r.status='approved';r.approvedAt=new Date().toISOString();saveData();res.json({ok:true,student:studentView(s),request:r});});
app.delete('/api/admin/purchase-requests/:id',auth,(req,res)=>{const i=(db.purchaseRequests||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);db.purchaseRequests.splice(i,1);saveData();res.json({ok:true});});
app.post('/api/admin/settings',auth,(req,res)=>{
  const b=req.body||{};
  const wasLive=!!db.settings?.live?.active;
  const nextLive={...defaultData.settings.live,...(db.settings?.live||{}),active:!!b.liveActive,title:String(b.liveTitle ?? (db.settings.live.title || '')),description:String(b.liveDescription ?? (db.settings.live.description || '')),youtubeUrl:String(b.liveYoutubeUrl ?? (db.settings.live.youtubeUrl || '')),schedule:String(b.liveSchedule ?? (db.settings.live.schedule || ''))};
  const incomingPricing = b.coursePricing!==undefined ? (typeof b.coursePricing==='string' ? (()=>{try{return JSON.parse(b.coursePricing)}catch{return {}}})() : (b.coursePricing||{})) : null;
  db.settings={...defaultData.settings,...db.settings,
    phone:String(b.phone ?? (db.settings.phone || '')),youtube:String(b.youtube ?? (db.settings.youtube || '')),facebook:String(b.facebook ?? (db.settings.facebook || '')),telegram:String(b.telegram ?? (db.settings.telegram || '')),
    coursePricing: incomingPricing ? Object.fromEntries(Object.entries(incomingPricing).map(([k,v])=>[k,Math.max(0,Number(v)||0)])) : (db.settings.coursePricing||{}),
    live:nextLive};
  if(!wasLive && nextLive.active){
    addNotification({type:'live',title:'🔴 Live Class শুরু হয়েছে',message:nextLive.title||'SS Study Centre Live Class এখন চলছে।',url:'#live-class'});
  }
  saveData(); res.json(db.settings);
});
app.post('/api/admin/branding',auth,upload.fields([{name:'logo',maxCount:1},{name:'banner',maxCount:1},{name:'paymentQR',maxCount:1},{name:'customImage',maxCount:1}]),(req,res)=>{
  const f=req.files||{}; const logo=f.logo?.[0], banner=f.banner?.[0], paymentQR=f.paymentQR?.[0], custom=f.customImage?.[0];
  if(logo && !logo.mimetype.startsWith('image/')) return res.status(400).json({error:'Logo must be an image'});
  if(banner && !banner.mimetype.startsWith('image/')) return res.status(400).json({error:'Banner must be an image'});
  if(paymentQR && !paymentQR.mimetype.startsWith('image/')) return res.status(400).json({error:'Payment QR must be an image'});
  if(custom && !custom.mimetype.startsWith('image/')) return res.status(400).json({error:'Custom image must be an image'});
  db.settings={...defaultData.settings,...db.settings};
  if(logo){ removeFile(db.settings.logo); db.settings.logo='/uploads/'+logo.filename; }
  if(banner){ removeFile(db.settings.banner); db.settings.banner='/uploads/'+banner.filename; }
  if(paymentQR){ removeFile(db.settings.paymentQR); db.settings.paymentQR='/uploads/'+paymentQR.filename; }
  if(custom){ db.assets=db.assets||[]; db.assets.push({id:id(),type:'image',title:String(req.body.customTitle||custom.originalname),url:'/uploads/'+custom.filename,size:custom.size,mime:custom.mimetype,createdAt:new Date().toISOString()}); }
  saveData(); res.json(db.settings);
});
app.post('/api/admin/branding/remove',auth,(req,res)=>{
  const key=req.body?.key; if(!['logo','banner','paymentQR'].includes(key)) return res.status(400).json({error:'Invalid branding key'});
  db.settings={...defaultData.settings,...db.settings}; removeFile(db.settings[key]); db.settings[key]=''; saveData(); res.json(db.settings);
});
app.post('/api/admin/notification',auth,(req,res)=>{
  const title=String(req.body.title||'SS Study Centre Update').trim().slice(0,120);
  const message=String(req.body.message||'').trim().slice(0,500);
  if(!message)return res.status(400).json({error:'Notification message required'});
  const courseId=String(req.body.courseId||'');
  if(courseId && !courseCatalog().some(c=>c.id===courseId)) return res.status(400).json({error:'Invalid course'});
  const item=addNotification({type:'notice',title,message,url:req.body.url||'#',courseId}); res.json(item);
});
app.delete('/api/admin/notifications/:id',auth,(req,res)=>{const i=(db.notifications||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);db.notifications.splice(i,1);saveData();res.json({ok:true});});
app.delete('/api/admin/railway-notifications/:id',auth,(req,res)=>{const i=(db.railwayNotifications||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);const [x]=db.railwayNotifications.splice(i,1);removeFile(x.file);saveData();res.json({ok:true});});
app.delete('/api/admin/mock-tests/:id',auth,(req,res)=>{const i=(db.mockTests||[]).findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);const [x]=db.mockTests.splice(i,1);(x.questions||[]).forEach(q=>removeFile(q.solutionImage));saveData();res.json({ok:true});});

app.post('/api/admin/achiever',auth,upload.single('image'),(req,res)=>{
  if(!req.file || !req.file.mimetype.startsWith('image/')) return res.status(400).json({error:'Student photo required'});
  const item={id:id(),name:String(req.body.name||'Student'),detail:String(req.body.detail||''),year:String(req.body.year||''),url:'/uploads/'+req.file.filename,createdAt:new Date().toISOString()};
  db.achievers.push(item); saveData(); addNotification({title:'🏆 নতুন Success Story',message:item.name+' — '+(item.detail||'SS Study Centre student'),url:'#success-stories'}); res.json(item);
});
app.delete('/api/admin/achievers/:id',auth,(req,res)=>{const i=db.achievers.findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);const [a]=db.achievers.splice(i,1);removeFile(a.url);saveData();res.json({ok:true});});
app.delete('/api/admin/comments/:id',auth,(req,res)=>{const i=db.comments.findIndex(x=>x.id===req.params.id);if(i<0)return res.sendStatus(404);db.comments.splice(i,1);saveData();res.json({ok:true});});

app.post('/api/admin/railway-notification',auth,upload.single('file'),(req,res)=>{
  const file=req.file;
  if(file && !/^(application\/pdf|image\/)/.test(file.mimetype)){try{fs.unlinkSync(file.path)}catch{};return res.status(400).json({error:'File must be PDF or image'});}
  const item={id:id(),topic:String(req.body.topic||'Notice'),date:String(req.body.date||new Date().toISOString().slice(0,10)),title:String(req.body.title||'Railway Alert'),message:String(req.body.message||''),url:String(req.body.url||''),file:file?'/uploads/'+file.filename:null,createdAt:new Date().toISOString()};
  if(!item.title||!item.message)return res.status(400).json({error:'Title and details required'});
  db.railwayNotifications=db.railwayNotifications||[];db.railwayNotifications.push(item);saveData();addNotification({type:'railway',title:'🚆 '+item.title,message:item.message,url:'#railway-notifications'});res.json(item);
});
app.post('/api/admin/mock-test',auth,upload.any(),(req,res)=>{
  let questions=[];try{questions=JSON.parse(String(req.body.questions||'[]'));}catch{return res.status(400).json({error:'Invalid questions data'});}
  if(!String(req.body.title||'').trim()||!questions.length)return res.status(400).json({error:'Title and at least one question required'});
  const files=req.files||[];
  files.forEach(f=>{if(!f.mimetype.startsWith('image/')){try{fs.unlinkSync(f.path)}catch{}}});
  const clean=questions.map((q,i)=>({q:String(q.q||'').slice(0,500),options:Array.isArray(q.options)?q.options.map(x=>String(x).slice(0,250)).filter(Boolean).slice(0,4):[],answer:Math.max(0,Number(q.answer)||0),solutionImage:(files.find(f=>f.fieldname==='solution_'+i)?.mimetype||'').startsWith('image/')?'/uploads/'+files.find(f=>f.fieldname==='solution_'+i).filename:null})).filter(q=>q.q&&q.options.length>=2);
  if(!clean.length)return res.status(400).json({error:'At least one valid question required'});
  const item={id:id(),title:String(req.body.title).slice(0,150),category:String(req.body.category||'General').slice(0,80),duration:Math.max(1,Number(req.body.duration)||30),questions:clean,createdAt:new Date().toISOString()};
  db.mockTests=db.mockTests||[];db.mockTests.push(item);saveData();addNotification({title:'📝 নতুন Mock Test',message:item.title,url:'#mock-tests'});res.json(item);
});
app.post('/api/admin/youtube',auth,upload.single('pdf'),(req,res)=>{
  const {title,desc,url,id:videoId}=req.body; const vid=videoId||extractYoutubeId(url||'');
  if(!title||!vid){if(req.file)try{fs.unlinkSync(req.file.path)}catch{};return res.status(400).json({error:'Title and valid YouTube URL/ID required'});}
  const item={id:id(),kind:'youtube',title:String(title),course:String(req.body.course||'ncert-science'),subject:String(req.body.subject||'physics'),chapter:String(req.body.chapterName||req.body.chapter||''),desc:String(desc||''),youtubeId:vid,pdf:req.file?'/uploads/'+req.file.filename:null,createdAt:new Date().toISOString()};
  db.videos.push(item);saveData();addNotification({title:'🎬 নতুন class/video আপলোড হয়েছে',message:item.title,url:'#courses'});res.json(item);
});

app.post('/api/admin/video',auth,upload.fields([{name:'video',maxCount:1},{name:'pdf',maxCount:1},{name:'thumbnail',maxCount:1}]),(req,res)=>{
  const video=req.files?.video?.[0], pdf=req.files?.pdf?.[0], thumbnail=req.files?.thumbnail?.[0];
  if(!video)return res.status(400).json({error:'Video file required'});
  if(!/^video\//.test(video.mimetype)){try{fs.unlinkSync(video.path)}catch{};return res.status(400).json({error:'Please upload a video file'});}
  const item={id:id(),kind:'file',title:String(req.body.title||video.originalname),course:String(req.body.course||'ncert-science'),subject:String(req.body.subject||'physics'),chapter:String(req.body.chapterName||req.body.chapter||''),desc:String(req.body.desc||''),url:'/uploads/'+video.filename,originalName:video.originalname,size:video.size,mime:video.mimetype,pdf:pdf?'/uploads/'+pdf.filename:null,thumbnail:thumbnail?'/uploads/'+thumbnail.filename:null,createdAt:new Date().toISOString()};
  db.videos.push(item);saveData();addNotification({title:'🎬 নতুন class/video আপলোড হয়েছে',message:item.title,url:'#courses'});res.json(item);
});

app.post('/api/admin/affair',auth,upload.fields([{name:'image',maxCount:1},{name:'pdf',maxCount:1}]),(req,res)=>{
  const f=(req.files||{}); const image=f.image?.[0], pdf=f.pdf?.[0];
  const item={id:id(), date:req.body.date||new Date().toISOString().slice(0,10), title:String(req.body.title||'Daily Current Affairs'), text:String(req.body.text||''), image:image?'/uploads/'+image.filename:null, pdf:pdf?'/uploads/'+pdf.filename:null, createdAt:new Date().toISOString()};
  db.affairs.push(item); saveData(); addNotification({title:'📰 নতুন Current Affairs আপডেট',message:item.title,url:'#current-affairs'}); res.json(item);
});
app.post('/api/admin/image',auth,upload.single('image'),(req,res)=>{
  if(!req.file || !req.file.mimetype.startsWith('image/')) return res.status(400).json({error:'Image file required'});
  const item={id:id(), type:'image', title:String(req.body.title||req.file.originalname), url:'/uploads/'+req.file.filename, size:req.file.size, mime:req.file.mimetype, createdAt:new Date().toISOString()}; db.assets.push(item); saveData(); addNotification({title:'📚 নতুন study material যোগ হয়েছে',message:item.title,url:'#library'}); res.json(item);
});
app.post('/api/admin/pdf',auth,upload.single('pdf'),(req,res)=>{
  if(!req.file || req.file.mimetype!=='application/pdf') return res.status(400).json({error:'PDF file required'});
  const item={id:id(), type:'pdf', title:String(req.body.title||req.file.originalname), url:'/uploads/'+req.file.filename, size:req.file.size, mime:req.file.mimetype, createdAt:new Date().toISOString()}; db.assets.push(item); saveData(); addNotification({title:'📚 নতুন study material যোগ হয়েছে',message:item.title,url:'#library'}); res.json(item);
});

function removeFile(url){ if(!url) return; const p=path.join(ROOT,url.replace(/^\//,'')); if(p.startsWith(UPLOADS+path.sep) && fs.existsSync(p)) fs.unlinkSync(p); }
app.delete('/api/admin/videos/:id',auth,(req,res)=>{ const i=db.videos.findIndex(x=>x.id===req.params.id); if(i<0)return res.sendStatus(404); const [v]=db.videos.splice(i,1); removeFile(v.url); saveData(); res.json({ok:true}); });
app.delete('/api/admin/affairs/:id',auth,(req,res)=>{ const i=db.affairs.findIndex(x=>x.id===req.params.id); if(i<0)return res.sendStatus(404); const [a]=db.affairs.splice(i,1); removeFile(a.image); removeFile(a.pdf); saveData(); res.json({ok:true}); });
app.delete('/api/admin/assets/:id',auth,(req,res)=>{ const i=db.assets.findIndex(x=>x.id===req.params.id); if(i<0)return res.sendStatus(404); const [a]=db.assets.splice(i,1); removeFile(a.url); saveData(); res.json({ok:true}); });

function extractYoutubeId(input){ input=String(input||'').trim(); if(/^[A-Za-z0-9_-]{11}$/.test(input)) return input; try { const u=new URL(input); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1,12); const q=u.searchParams.get('v'); if(q) return q.slice(0,11); const p=u.pathname.split('/'); for(const k of ['embed','shorts','live']){const i=p.indexOf(k); if(i>=0&&p[i+1]) return p[i+1].slice(0,11);} } catch{} return null; }

app.get('/sw.js', (req,res)=>res.sendFile(path.join(PUBLIC,'sw.js'), {headers:{'Content-Type':'application/javascript','Cache-Control':'no-cache'}}));
app.get('/admin', (req,res)=>res.sendFile(path.join(PUBLIC,'admin.html')));
app.get(/.*/, (req,res)=>res.sendFile(path.join(PUBLIC,'index.html')));
app.listen(PORT,()=>console.log(`SS Study Centre running on http://localhost:${PORT}`));

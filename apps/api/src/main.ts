import express from 'express';
import fs from 'fs';
import path from 'path';
import {execFile} from 'child_process';
import {promisify} from 'util';
const execFileAsync=promisify(execFile);
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, UserStatus, ProjectStatus, TaskStatus, Priority, TicketStatus, AppRequestStatus, InvoiceStatus } from '@prisma/client';

const app=express();
const db=new PrismaClient();
const secret=process.env.JWT_SECRET;
if(!secret) throw new Error('JWT_SECRET is required in production');
app.use(cors({origin:process.env.CORS_ORIGIN?.split(',')||true}));
app.use(express.json({limit:'15mb'}));
const uploadDir=path.resolve(process.env.UPLOAD_DIR||'uploads');
fs.mkdirSync(uploadDir,{recursive:true});

const auth=async(req:any,res:any,next:any)=>{try{const token=(req.headers.authorization||'').replace(/^Bearer\s+/,''); const payload:any=jwt.verify(token,secret); const user=await db.user.findUnique({where:{id:payload.id}}); if(!user||user.status!==UserStatus.ACTIVE)return res.status(401).json({error:'Unauthorized'}); req.user=user; next();}catch{return res.status(401).json({error:'Unauthorized'});}};
const requireMaster=(req:any,res:any,next:any)=>req.user?.isMasterSuperAdmin?next():res.status(403).json({error:'Master Super Admin only'});
const requireRole=(...roles:Role[])=> (req:any,res:any,next:any)=> roles.includes(req.user?.role)||req.user?.isMasterSuperAdmin?next():res.status(403).json({error:'Forbidden'});
const requirePermission=(key:string,...fallbackRoles:Role[])=>async(req:any,res:any,next:any)=>{try{if(req.user?.isMasterSuperAdmin)return next();if(!req.user)return res.status(403).json({error:'Forbidden'});const rp=await db.rolePermission.findFirst({where:{role:req.user.role,permission:{key},userId:null}});if(rp)return rp.enabled?next():res.status(403).json({error:'Permission denied'});if(fallbackRoles.includes(req.user.role))return next();return res.status(403).json({error:'Permission denied'});}catch{return res.status(500).json({error:'Authorization check failed'});}};
const audit=async(userId:string,action:string,entity:string,entityId?:string,metadata?:any)=>{await db.auditLog.create({data:{userId,action,entity,entityId,metadata}}).catch(()=>{});};
const safeUser=(u:any)=>{if(!u)return u; const {passwordHash,...x}=u; return x;};

app.get('/api/health',async(_,res)=>res.json({ok:true,name:'Al Ghaly API',mode:'database'}));
app.post('/api/auth/login',async(req,res)=>{const {identifier,password}=req.body||{}; if(!identifier||!password)return res.status(400).json({error:'بيانات الدخول مطلوبة'}); const u=await db.user.findFirst({where:{OR:[{email:identifier},{phone:identifier}]}}); if(!u||u.status!==UserStatus.ACTIVE||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'بيانات الدخول غير صحيحة'}); const token=jwt.sign({id:u.id,role:u.role},secret,{expiresIn:'12h'}); await audit(u.id,'LOGIN','User',u.id); res.json({token,user:safeUser(u)});});
app.get('/api/me',auth,(req:any,res)=>res.json(safeUser(req.user)));

app.get('/api/dashboard',auth,async(_,res)=>{const [users,clients,projects,tasks,openTickets,leads,appRequests]=await Promise.all([db.user.count(),db.client.count(),db.project.count(),db.task.count(),db.ticket.count({where:{status:{not:TicketStatus.CLOSED}}}),db.lead.count(),db.appRequest.count()]);res.json({users,clients,projects,tasks,openTickets,leads,appRequests});});

app.get('/api/users',auth,requirePermission('users.view',Role.ADMIN),async(_,res)=>res.json(await db.user.findMany({select:{id:true,email:true,name:true,phone:true,role:true,status:true,avatarUrl:true,isMasterSuperAdmin:true,createdAt:true},orderBy:{createdAt:'desc'}})));
app.post('/api/users',auth,requirePermission('users.manage',Role.ADMIN),async(req:any,res)=>{const {email,password,name,phone,role='EMPLOYEE',avatarUrl}=req.body; if(!password||!name)return res.status(400).json({error:'name and password required'}); if(role==='SUPER_ADMIN'&&!req.user.isMasterSuperAdmin)return res.status(403).json({error:'Only Master Super Admin can create Super Admin'}); const passwordHash=await bcrypt.hash(password,12); const u=await db.user.create({data:{email:email||null,name,phone:phone||null,passwordHash,role,avatarUrl:avatarUrl||null}}); await audit(req.user.id,'CREATE','User',u.id); res.json(safeUser(u));});
app.put('/api/users/:id',auth,requirePermission('users.manage',Role.ADMIN),async(req:any,res)=>{try{const target=await db.user.findUnique({where:{id:req.params.id}}); if(!target)return res.status(404).json({error:'Not found'}); if(target.isMasterSuperAdmin&&!req.user.isMasterSuperAdmin)return res.status(403).json({error:'Master Super Admin is protected'}); const {name,email,phone,role,status,avatarUrl,password}=req.body; if(target.isMasterSuperAdmin&&(role&&role!=='SUPER_ADMIN'||status&&status!=='ACTIVE'))return res.status(403).json({error:'Master Super Admin cannot be disabled or demoted'}); if(role==='SUPER_ADMIN'&&!req.user.isMasterSuperAdmin)return res.status(403).json({error:'Only Master Super Admin can assign SUPER_ADMIN'}); const data:any={name,email:email||null,phone:phone||null,role,status,avatarUrl:avatarUrl??null}; if(password) data.passwordHash=await bcrypt.hash(password,12); const u=await db.user.update({where:{id:target.id},data}); await audit(req.user.id,'UPDATE','User',u.id); res.json(safeUser(u));}catch(e:any){res.status(400).json({error:e?.message||'User update failed'});}});
app.delete('/api/users/:id',auth,requirePermission('users.manage',Role.ADMIN),async(req:any,res)=>{const target=await db.user.findUnique({where:{id:req.params.id}}); if(!target)return res.status(404).json({error:'Not found'}); if(target.isMasterSuperAdmin)return res.status(403).json({error:'Master Super Admin cannot be deleted'}); await db.user.delete({where:{id:target.id}}); await audit(req.user.id,'DELETE','User',target.id); res.json({ok:true});});

app.get('/api/permissions',auth,requireRole(Role.ADMIN),async(_,res)=>res.json(await db.permission.findMany({include:{rolePermissions:true},orderBy:{key:'asc'}})));
app.post('/api/permissions',auth,requireMaster,async(req:any,res)=>{const p=await db.permission.create({data:{key:req.body.key,name:req.body.name||req.body.key,description:req.body.description}}); await audit(req.user.id,'CREATE','Permission',p.id); res.json(p);});
app.put('/api/role-permissions',auth,requireMaster,async(req:any,res)=>{const {role,permissionId,enabled}=req.body; const existing=await db.rolePermission.findFirst({where:{role,permissionId,userId:null}}); const rp=existing?await db.rolePermission.update({where:{id:existing.id},data:{enabled:!!enabled}}):await db.rolePermission.create({data:{role,permissionId,enabled:!!enabled}}); await audit(req.user.id,'UPDATE','RolePermission',rp.id,{role,permissionId,enabled}); res.json(rp);});

app.get('/api/clients',auth,async(_,res)=>res.json(await db.client.findMany({include:{user:true},orderBy:{createdAt:'desc'}})));
app.post('/api/clients',auth,requirePermission('clients.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{const {companyName,email,phone,whatsapp,country,city,address,website,notes,password}=req.body; if(!email&&!phone)return res.status(400).json({error:'email or phone required'}); const passwordHash=await bcrypt.hash(password||cryptoRandom(),12); const user=await db.user.create({data:{email:email||null,phone:phone||null,name:companyName||email||phone,passwordHash,role:Role.CLIENT}}); const c=await db.client.create({data:{userId:user.id,companyName,whatsapp,country,city,address,website,notes},include:{user:true}}); await audit(req.user.id,'CREATE','Client',c.id); res.json(c);});

app.get('/api/services',async(_,res)=>res.json(await db.service.findMany({where:{active:true},orderBy:{sortOrder:'asc'}})));
app.get('/api/admin/services',auth,requirePermission('services.view',Role.ADMIN),async(_,res)=>res.json(await db.service.findMany({orderBy:{sortOrder:'asc'}})));
app.post('/api/admin/services',auth,requirePermission('services.manage',Role.ADMIN),async(req:any,res)=>{const s=await db.service.create({data:req.body}); await audit(req.user.id,'CREATE','Service',s.id);res.json(s);});
app.put('/api/admin/services/:id',auth,requirePermission('services.manage',Role.ADMIN),async(req:any,res)=>{const s=await db.service.update({where:{id:req.params.id},data:req.body});await audit(req.user.id,'UPDATE','Service',s.id);res.json(s);});
app.delete('/api/admin/services/:id',auth,requirePermission('services.manage',Role.ADMIN),async(req:any,res)=>{await db.service.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Service',req.params.id);res.json({ok:true});});

app.get('/api/projects',auth,async(_,res)=>res.json(await db.project.findMany({include:{client:true,assignee:true,supervisor:true,service:true,tasks:true},orderBy:{createdAt:'desc'}})));
app.post('/api/projects',auth,requirePermission('projects.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{const p=await db.project.create({data:{...req.body,progress:Number(req.body.progress||0)}});await audit(req.user.id,'CREATE','Project',p.id);res.json(p);});
app.put('/api/projects/:id',auth,requirePermission('projects.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{const p=await db.project.update({where:{id:req.params.id},data:req.body});await audit(req.user.id,'UPDATE','Project',p.id);res.json(p);});
app.delete('/api/projects/:id',auth,requirePermission('projects.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{await db.project.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Project',req.params.id);res.json({ok:true});});

app.get('/api/tasks',auth,async(_,res)=>res.json(await db.task.findMany({include:{project:true,assignee:true},orderBy:{createdAt:'desc'}})));
app.post('/api/tasks',auth,requirePermission('tasks.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{const t=await db.task.create({data:{...req.body,progress:Number(req.body.progress||0)}});await audit(req.user.id,'CREATE','Task',t.id);res.json(t);});
app.put('/api/tasks/:id',auth,requirePermission('tasks.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR,Role.EMPLOYEE),async(req:any,res)=>{const t=await db.task.update({where:{id:req.params.id},data:req.body});await audit(req.user.id,'UPDATE','Task',t.id);res.json(t);});

app.get('/api/tickets',auth,async(_,res)=>res.json(await db.ticket.findMany({include:{client:true},orderBy:{createdAt:'desc'}})));
app.post('/api/tickets',auth,requirePermission('tickets.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR,Role.EMPLOYEE),async(req:any,res)=>{const t=await db.ticket.create({data:req.body});await audit(req.user.id,'CREATE','Ticket',t.id);res.json(t);});
app.put('/api/tickets/:id',auth,requirePermission('tickets.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR,Role.EMPLOYEE),async(req:any,res)=>res.json(await db.ticket.update({where:{id:req.params.id},data:req.body})));

app.get('/api/public/settings',async(_,res)=>{const rows=await db.setting.findMany({orderBy:{key:'asc'}});res.json(rows.reduce((a:any,x:any)=>(a[x.key]=x.value,a),{}));});
app.get('/api/public/pages',async(_,res)=>res.json(await db.page.findMany({where:{published:true},orderBy:{sortOrder:'asc'}})));
app.get('/api/settings',auth,requirePermission('settings.manage',Role.ADMIN),async(_,res)=>res.json(await db.setting.findMany({orderBy:{key:'asc'}})));
app.delete('/api/settings/:key',auth,requireMaster,async(req:any,res)=>{await db.setting.delete({where:{key:req.params.key}});res.json({ok:true})});
app.put('/api/settings/:key',auth,requirePermission('settings.manage',Role.ADMIN),async(req:any,res)=>{const s=await db.setting.upsert({where:{key:req.params.key},update:{value:String(req.body.value),type:req.body.type||'text'},create:{key:req.params.key,value:String(req.body.value),type:req.body.type||'text'}});await audit(req.user.id,'UPDATE','Setting',s.id,{key:req.params.key});res.json(s);});

app.get('/api/pages',async(_,res)=>res.json(await db.page.findMany({where:{published:true},orderBy:{sortOrder:'asc'}})));
app.get('/api/admin/pages',auth,requirePermission('pages.manage',Role.ADMIN),async(_,res)=>res.json(await db.page.findMany({orderBy:{sortOrder:'asc'}})));
app.post('/api/admin/pages',auth,requirePermission('pages.manage',Role.ADMIN),async(req:any,res)=>{const p=await db.page.create({data:req.body});await audit(req.user.id,'CREATE','Page',p.id);res.json(p);});
app.put('/api/admin/pages/:id',auth,requirePermission('pages.manage',Role.ADMIN),async(req:any,res)=>res.json(await db.page.update({where:{id:req.params.id},data:req.body})));
app.delete('/api/admin/pages/:id',auth,requirePermission('pages.manage',Role.ADMIN),async(req:any,res)=>{await db.page.delete({where:{id:req.params.id}});res.json({ok:true});});

app.get('/api/custom-fields/:entity',auth,requireRole(Role.ADMIN),async(req,res)=>res.json(await db.customField.findMany({where:{entity:req.params.entity},orderBy:{sortOrder:'asc'}})));
app.post('/api/custom-fields',auth,requireMaster,async(req:any,res)=>res.json(await db.customField.create({data:req.body})));
app.put('/api/custom-fields/:id',auth,requireMaster,async(req:any,res)=>res.json(await db.customField.update({where:{id:req.params.id},data:req.body})));
app.delete('/api/custom-fields/:id',auth,requireMaster,async(req:any,res)=>{await db.customField.delete({where:{id:req.params.id}});res.json({ok:true});});

app.get('/api/files',auth,requirePermission('files.view',Role.ADMIN),async(_,res)=>res.json(await db.fileAsset.findMany({orderBy:{createdAt:'desc'}})));
app.post('/api/files',auth,requirePermission('files.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR,Role.EMPLOYEE),async(req:any,res)=>{try{const {name,storageKey,url,mimeType,size,folder,clientId,projectId,taskId,ticketId,dataUrl}=req.body||{};let finalUrl=url||null;let finalKey=storageKey||'';let finalSize=size||null;if(dataUrl&&/^data:[^;]+;base64,/.test(String(dataUrl))){const match=String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);if(!match)return res.status(400).json({error:'Invalid data URL'});const ext=(match[1].split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'');const fileName=(storageKey||`${Date.now()}-${cryptoRandom()}.${ext}`).replace(/[^a-zA-Z0-9._-]/g,'_');const filePath=path.join(uploadDir,fileName);const buf=Buffer.from(match[2],'base64');fs.writeFileSync(filePath,buf);finalKey=fileName;finalUrl=`/uploads/${encodeURIComponent(fileName)}`;finalSize=buf.length;}if(!name||!finalKey)return res.status(400).json({error:'name and storageKey or dataUrl are required'});const f=await db.fileAsset.create({data:{name,storageKey:finalKey,url:finalUrl,mimeType:mimeType||null,size:finalSize,folder:folder||null,clientId:clientId||null,projectId:projectId||null,taskId:taskId||null,ticketId:ticketId||null,uploadedById:req.user.id}});await audit(req.user.id,'CREATE','FileAsset',f.id);res.json(f);}catch(e:any){res.status(400).json({error:e?.message||'File upload failed'})}});
app.delete('/api/files/:id',auth,requirePermission('files.manage',Role.ADMIN),async(req:any,res)=>{await db.fileAsset.delete({where:{id:req.params.id}});res.json({ok:true});});
app.get('/api/files/:id/download',auth,requireMaster,async(req:any,res)=>{const f=await db.fileAsset.findUnique({where:{id:req.params.id}});if(!f)return res.status(404).json({error:'Not found'});const filePath=path.join(uploadDir,path.basename(f.storageKey));if(!fs.existsSync(filePath))return res.status(404).json({error:'File content not found'});res.download(filePath,f.name);});


app.get('/api/conversations',auth,async(req:any,res)=>res.json(await db.conversation.findMany({where:{members:{some:{userId:req.user.id}}},include:{members:{include:{user:{select:{id:true,name:true,email:true,role:true}}}},messages:{orderBy:{createdAt:'desc'},take:1}},orderBy:{updatedAt:'desc'}})));
app.post('/api/conversations',auth,async(req:any,res)=>{const ids=[req.user.id,...(req.body.userIds||[])].filter(Boolean);const c=await db.conversation.create({data:{title:req.body.title,members:{create:ids.map((userId:string)=>({userId}))}}});res.json(c);});
app.get('/api/conversations/:id/messages',auth,async(req:any,res)=>{const m=await db.conversationMember.findFirst({where:{conversationId:req.params.id,userId:req.user.id}});if(!m&&!req.user.isMasterSuperAdmin)return res.status(403).json({error:'Forbidden'});res.json(await db.message.findMany({where:{conversationId:req.params.id},include:{sender:{select:{id:true,name:true,role:true}}},orderBy:{createdAt:'asc'}}));});
app.post('/api/conversations/:id/messages',auth,async(req:any,res)=>{const m=await db.conversationMember.findFirst({where:{conversationId:req.params.id,userId:req.user.id}});if(!m&&!req.user.isMasterSuperAdmin)return res.status(403).json({error:'Forbidden'});res.json(await db.message.create({data:{conversationId:req.params.id,senderId:req.user.id,body:req.body.body,type:req.body.type||'TEXT',fileId:req.body.fileId||null}}));});

app.get('/api/notifications',auth,async(req:any,res)=>res.json(await db.notification.findMany({where:{userId:req.user.id},orderBy:{createdAt:'desc'}})));
app.put('/api/notifications/:id/read',auth,async(req:any,res)=>res.json(await db.notification.updateMany({where:{id:req.params.id,userId:req.user.id},data:{readAt:new Date()}})));app.post('/api/notifications',auth,requireMaster,async(req:any,res)=>{const n=await db.notification.create({data:{userId:req.body.userId,title:req.body.title,body:req.body.body,channel:req.body.channel||'IN_APP',metadata:req.body.metadata||{}}});await audit(req.user.id,'CREATE','Notification',n.id);res.json(n)});
app.delete('/api/notifications/:id',auth,requireMaster,async(req:any,res)=>{await db.notification.delete({where:{id:req.params.id}});res.json({ok:true})});


app.get('/api/crm/leads',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(_,res)=>res.json(await db.lead.findMany({include:{owner:true,client:true,deals:true},orderBy:{createdAt:'desc'}})));
app.post('/api/crm/leads',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>res.json(await db.lead.create({data:{...req.body,ownerId:req.body.ownerId||req.user.id}})));
app.get('/api/crm/deals',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(_,res)=>res.json(await db.deal.findMany({include:{lead:true,client:true,owner:true},orderBy:{createdAt:'desc'}})));
app.post('/api/crm/deals',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>res.json(await db.deal.create({data:{...req.body,ownerId:req.body.ownerId||req.user.id}})));
app.get('/api/crm/activities',auth,requirePermission('crm.view',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(_,res)=>res.json(await db.cRMActivity.findMany({orderBy:{createdAt:'desc'}})));
app.post('/api/crm/activities',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>res.json(await db.cRMActivity.create({data:req.body})));app.put('/api/crm/leads/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{const x=await db.lead.update({where:{id:req.params.id},data:req.body});await audit(req.user.id,'UPDATE','Lead',x.id);res.json(x)});
app.delete('/api/crm/leads/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{await db.lead.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Lead',req.params.id);res.json({ok:true})});
app.put('/api/crm/deals/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{const x=await db.deal.update({where:{id:req.params.id},data:req.body});await audit(req.user.id,'UPDATE','Deal',x.id);res.json(x)});
app.delete('/api/crm/deals/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{await db.deal.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Deal',req.params.id);res.json({ok:true})});
app.put('/api/crm/activities/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>res.json(await db.cRMActivity.update({where:{id:req.params.id},data:req.body})));
app.delete('/api/crm/activities/:id',auth,requirePermission('crm.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{await db.cRMActivity.delete({where:{id:req.params.id}});res.json({ok:true})});


app.get('/api/app-requests',auth,async(_,res)=>res.json(await db.appRequest.findMany({include:{client:true,service:true,project:true,assignee:true},orderBy:{createdAt:'desc'}})));
app.post('/api/app-requests',auth,async(req:any,res)=>{const a=await db.appRequest.create({data:{...req.body,features:req.body.features||[],appTypes:req.body.appTypes||[]}});await audit(req.user.id,'CREATE','AppRequest',a.id);res.json(a);});
app.put('/api/app-requests/:id',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>res.json(await db.appRequest.update({where:{id:req.params.id},data:req.body})));

app.get('/api/billing/invoices',auth,requireRole(Role.ADMIN,Role.MANAGER),async(_,res)=>{const enabled=await db.setting.findUnique({where:{key:'billing_enabled'}});if(enabled?.value!=='true')return res.json([]);res.json(await db.invoice.findMany({include:{client:true,project:true,service:true},orderBy:{issuedAt:'desc'}}));});
app.post('/api/billing/invoices',auth,requireMaster,async(req:any,res)=>{const enabled=await db.setting.findUnique({where:{key:'billing_enabled'}});if(enabled?.value!=='true')return res.status(409).json({error:'Billing module is disabled'});const i=await db.invoice.create({data:{...req.body,createdById:req.user.id}});res.json(i);});

app.get('/api/audit',auth,requirePermission('audit.view',Role.ADMIN),async(_,res)=>res.json(await db.auditLog.findMany({include:{user:{select:{name:true,email:true,role:true}}},orderBy:{createdAt:'desc'},take:500})));
app.get('/api/integrations',auth,requirePermission('integrations.manage',Role.ADMIN),async(_,res)=>res.json(await db.integration.findMany({orderBy:{provider:'asc'}})));
app.put('/api/integrations/:provider',auth,requireMaster,async(req:any,res)=>{const x=await db.integration.upsert({where:{provider:req.params.provider},update:{enabled:!!req.body.enabled,config:req.body.config},create:{provider:req.params.provider,enabled:!!req.body.enabled,config:req.body.config}});await audit(req.user.id,'UPDATE','Integration',x.id,{provider:req.params.provider,enabled:x.enabled});res.json(x)});
app.post('/api/backup/run',auth,requireMaster,async(req:any,res)=>{try{const cfg=await db.backupConfig.findUnique({where:{id:'default-backup-config'}});const dir=path.resolve(cfg?.destination||path.join(process.cwd(),'backups'));fs.mkdirSync(dir,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const file=path.join(dir,`alghaly-${stamp}.sql`);const url=new URL(process.env.DATABASE_URL||'');const env={...process.env,PGPASSWORD:decodeURIComponent(url.password)};await execFileAsync('pg_dump',[`--host=${url.hostname}`,`--port=${url.port||5432}`,`--username=${decodeURIComponent(url.username)}`,`--dbname=${url.pathname.replace(/^\//,'')}`,`--file=${file}`],{env});await audit(req.user.id,'BACKUP_RUN','Database',file);res.json({ok:true,file,createdAt:new Date().toISOString()});}catch(e:any){res.status(500).json({error:e?.message||'Backup failed'})}});
app.get('/api/backup-config',auth,requireMaster,async(_,res)=>res.json(await db.backupConfig.findUnique({where:{id:'default-backup-config'}})));
app.put('/api/backup-config',auth,requireMaster,async(req:any,res)=>{const x=await db.backupConfig.upsert({where:{id:'default-backup-config'},update:req.body,create:{id:'default-backup-config',...req.body}});await audit(req.user.id,'UPDATE','BackupConfig',x.id);res.json(x)});



// --- Admin management extensions: real CRUD for the management UI ---
app.put('/api/clients/:id',auth,requirePermission('clients.manage',Role.ADMIN,Role.MANAGER),async(req:any,res)=>{try{const c=await db.client.findUnique({where:{id:req.params.id}});if(!c)return res.status(404).json({error:'Not found'});const {companyName,whatsapp,country,city,address,website,notes,name,email,phone}=req.body;const updated=await db.$transaction(async tx=>{const client=await tx.client.update({where:{id:c.id},data:{companyName,whatsapp,country,city,address,website,notes},include:{user:true}});if(c.userId) await tx.user.update({where:{id:c.userId},data:{name:name||companyName||undefined,email:email??undefined,phone:phone??undefined}});return client;});await audit(req.user.id,'UPDATE','Client',c.id);res.json(updated);}catch(e:any){res.status(400).json({error:e?.message||'Client update failed'})}});
app.delete('/api/clients/:id',auth,requireMaster,async(req:any,res)=>{const c=await db.client.findUnique({where:{id:req.params.id}});if(!c)return res.status(404).json({error:'Not found'});await db.client.delete({where:{id:c.id}});await audit(req.user.id,'DELETE','Client',c.id);res.json({ok:true});});

app.get('/api/employees',auth,requirePermission('employees.view',Role.ADMIN),async(_,res)=>res.json(await db.employee.findMany({include:{user:true,supervisor:true,projects:true},orderBy:{createdAt:'desc'}})));
app.post('/api/employees',auth,requirePermission('employees.manage',Role.ADMIN),async(req:any,res)=>{const {name,email,phone,password,employeeNumber,jobTitle,department,supervisorId,hireDate,status='ACTIVE',skills,evaluation}=req.body||{};if(!name||!employeeNumber||!password)return res.status(400).json({error:'name, employeeNumber and password are required'});const passwordHash=await bcrypt.hash(password,12);const out=await db.$transaction(async tx=>{const u=await tx.user.create({data:{name,email:email||null,phone:phone||null,passwordHash,role:Role.EMPLOYEE}});return tx.employee.create({data:{userId:u.id,employeeNumber,jobTitle,department,supervisorId:supervisorId||null,hireDate:hireDate?new Date(hireDate):null,status,skills,evaluation},include:{user:true,supervisor:true}})});await audit(req.user.id,'CREATE','Employee',out.id);res.json(out);});
app.put('/api/employees/:id',auth,requirePermission('employees.manage',Role.ADMIN),async(req:any,res)=>{const e=await db.employee.findUnique({where:{id:req.params.id}});if(!e)return res.status(404).json({error:'Not found'});const {name,email,phone,jobTitle,department,supervisorId,hireDate,status,skills,evaluation,employeeNumber}=req.body;const out=await db.$transaction(async tx=>{await tx.user.update({where:{id:e.userId},data:{name,email:email??undefined,phone:phone??undefined}});return tx.employee.update({where:{id:e.id},data:{employeeNumber,jobTitle,department,supervisorId:supervisorId||null,hireDate:hireDate?new Date(hireDate):null,status,skills,evaluation},include:{user:true,supervisor:true}})});await audit(req.user.id,'UPDATE','Employee',e.id);res.json(out);});
app.delete('/api/employees/:id',auth,requirePermission('employees.manage',Role.ADMIN),async(req:any,res)=>{const e=await db.employee.findUnique({where:{id:req.params.id}});if(!e)return res.status(404).json({error:'Not found'});await db.employee.delete({where:{id:e.id}});await db.user.delete({where:{id:e.userId}});await audit(req.user.id,'DELETE','Employee',e.id);res.json({ok:true});});

app.delete('/api/tasks/:id',auth,requirePermission('tasks.manage',Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{await db.task.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Task',req.params.id);res.json({ok:true});});
app.delete('/api/tickets/:id',auth,requireRole(Role.ADMIN,Role.MANAGER,Role.SUPERVISOR),async(req:any,res)=>{await db.ticket.delete({where:{id:req.params.id}});await audit(req.user.id,'DELETE','Ticket',req.params.id);res.json({ok:true});});

app.get('/api/reports/summary',auth,requireRole(Role.ADMIN),async(_,res)=>{const [users,clients,employees,projects,completedProjects,tasks,doneTasks,tickets,openTickets,leads,deals,services,appRequests]=await Promise.all([
 db.user.count(),db.client.count(),db.employee.count(),db.project.count(),db.project.count({where:{status:ProjectStatus.COMPLETED}}),db.task.count(),db.task.count({where:{status:TaskStatus.DONE}}),db.ticket.count(),db.ticket.count({where:{status:{not:TicketStatus.CLOSED}}}),db.lead.count(),db.deal.count(),db.service.count({where:{active:true}}),db.appRequest.count()
]);res.json({users,clients,employees,projects,completedProjects,tasks,doneTasks,tickets,openTickets,leads,deals,services,appRequests,projectCompletion:projects?Math.round(completedProjects/projects*100):0,taskCompletion:tasks?Math.round(doneTasks/tasks*100):0});});

app.get('/api/admin/roles',auth,requireMaster,async(_,res)=>res.json(Object.values(Role).map(role=>({role,permissions:[]}))));

function cryptoRandom(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`Al Ghaly API running on :${port}`));

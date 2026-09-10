import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'eslamghaly2@gmail.com';
const MASTER_PHONE = process.env.MASTER_ADMIN_PHONE || '01011039017';
const MASTER_PASSWORD = process.env.MASTER_ADMIN_PASSWORD;

const permissions = [
  'dashboard.view','users.view','users.manage','roles.manage','clients.view','clients.manage','employees.view','employees.manage',
  'services.view','services.manage','projects.view','projects.manage','tasks.view','tasks.manage','tickets.view','tickets.manage',
  'files.view','files.manage','chat.view','chat.manage','notifications.manage','crm.view','crm.manage','app_requests.view','app_requests.manage',
  'billing.view','billing.manage','reports.view','settings.manage','pages.manage','custom_fields.manage','integrations.manage','audit.view','backup.manage'
];

async function main(){
  if(!MASTER_PASSWORD) throw new Error('MASTER_ADMIN_PASSWORD is required. Set it in the environment; never hard-code a password.');
  const passwordHash = await bcrypt.hash(MASTER_PASSWORD, 12);
  const master = await db.user.upsert({
    where:{email:MASTER_EMAIL},
    update:{name:'EslamGhaly', phone:MASTER_PHONE, role:Role.SUPER_ADMIN, status:UserStatus.ACTIVE, isMasterSuperAdmin:true, passwordHash},
    create:{email:MASTER_EMAIL, name:'EslamGhaly', phone:MASTER_PHONE, role:Role.SUPER_ADMIN, status:UserStatus.ACTIVE, isMasterSuperAdmin:true, passwordHash}
  });
  for(const key of permissions){
    const p=await db.permission.upsert({where:{key},update:{name:key},create:{key,name:key}});
    const existing=await db.rolePermission.findFirst({where:{role:Role.SUPER_ADMIN,permissionId:p.id,userId:null}});
    if(existing) await db.rolePermission.update({where:{id:existing.id},data:{enabled:true}});
    else await db.rolePermission.create({data:{role:Role.SUPER_ADMIN,permissionId:p.id,enabled:true}});
  }
  const services=[['إنشاء المواقع الإلكترونية','websites'],['التسويق الرقمي','digital-marketing'],['الحملات الإعلانية','advertising'],['إدارة وسائل التواصل الاجتماعي','social-media'],['تصميم الهوية والمحتوى','branding-content'],['تحسين محركات البحث SEO','seo'],['إنشاء التطبيقات','app-development'],['المتاجر الإلكترونية','ecommerce']];
  for(let i=0;i<services.length;i++) await db.service.upsert({where:{slug:services[i][1]},update:{},create:{name:services[i][0],slug:services[i][1],sortOrder:i}});
  const settings=[['app_name','Al Ghaly','text'],['app_name_ar','الغالي','text'],['platform_description','منصة خدمات التسويق الرقمي والتسويق الإلكتروني','text'],['rtl','true','boolean'],['dark_mode','true','boolean'],['light_mode','true','boolean'],['billing_enabled','false','boolean'],['public_signup_enabled','false','boolean'],['phone_login_enabled','true','boolean'],['email_login_enabled','true','boolean'],['two_factor_master_required','true','boolean']];
  for(const [key,value,type] of settings) await db.setting.upsert({where:{key},update:{value,type},create:{key,value,type}});
  await db.backupConfig.upsert({where:{id:'default-backup-config'},update:{},create:{id:'default-backup-config'}});
  await db.auditLog.create({data:{action:'SEED_MASTER_ADMIN',entity:'User',entityId:master.id,userId:master.id,metadata:{safe:true}}});
  console.log('Seeded master:', master.email);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());

'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
const groups=[
 {title:'الرئيسية',items:[['/dashboard','لوحة التحكم','⌂']]},
 {title:'الإدارة',items:[['/admin/users','المستخدمون والصلاحيات','♙'],['/admin/roles','الأدوار والصلاحيات','⚿'],['/admin/employees','الموظفون','☻'],['/admin/settings','الإعدادات العامة','⚙'],['/admin/pages','الصفحات والمحتوى','▤'],['/admin/fields','الحقول الديناميكية','＋']]},
 {title:'العمليات',items:[['/clients','العملاء','◉'],['/admin/services','الخدمات','◆'],['/projects','المشاريع','▣'],['/tasks','المهام','✓'],['/app-requests','طلبات التطبيقات','▥'],['/tickets','التذاكر','!'],['/files','الملفات','◫']]},
 {title:'التواصل',items:[['/chat','المحادثات','◌'],['/notifications','الإشعارات','◈'],['/crm','CRM','◎']]},
 {title:'النظام',items:[['/billing','الفواتير الاختيارية','▤'],['/reports','التقارير','▥'],['/integrations','التكاملات','↗'],['/admin/backup','النسخ الاحتياطي','⟳'],['/audit','سجل التدقيق','◌']]}
];
export default function Sidebar(){const p=usePathname();return <aside className="side"><div className="logo"><span>Al</span>Ghaly</div><div className="side-title">منصة إدارة الأعمال</div><nav>{groups.map(g=><div key={g.title} className="nav-group"><div className="nav-group-title">{g.title}</div>{g.items.map(([href,label,icon])=><Link className={p===href?'active':''} href={href} key={href}><b>{icon}</b>{label}</Link>)}</div>)}</nav><button className="logout" onClick={()=>{localStorage.removeItem('alghaly_token');location.href='/login'}}>تسجيل الخروج</button></aside>}

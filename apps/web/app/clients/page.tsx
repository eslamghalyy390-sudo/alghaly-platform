'use client';
import CrudPage from '../../components/CrudPage';
export default function Clients(){return <CrudPage title="العملاء" subtitle="حسابات العملاء والشركات وبيانات التواصل" path="/clients" fields={[{key:'companyName',label:'الشركة / العميل',required:true},{key:'email',label:'البريد',required:true},{key:'phone',label:'الهاتف'},{key:'whatsapp',label:'واتساب'},{key:'country',label:'الدولة'},{key:'city',label:'المدينة'},{key:'address',label:'العنوان'},{key:'website',label:'الموقع'},{key:'notes',label:'ملاحظات',type:'textarea',full:true},{key:'password',label:'كلمة المرور عند الإنشاء'}]} columns={[{key:'companyName',label:'العميل'},{key:'user.email',label:'البريد'},{key:'user.phone',label:'الهاتف'},{key:'country',label:'الدولة'},{key:'city',label:'المدينة'}]} canDelete/>
}

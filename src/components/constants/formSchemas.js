export const globalFormSchema = {
    // 1. مخطط الباصات (مطابق لـ BusManager.jsx)
    bus: [
        { name: 'busNumber', label: 'رقم الباص', type: 'text', required: true },
        { name: 'initialMeter', label: 'عداد الميتار الحالي', type: 'number', required: true },
        { name: 'dailyRent', label: 'قيمة الإيجار اليومي', type: 'number', required: true }
    ],

    // 2. مخطط السائقين (مطابق لـ CardSlider.jsx)
    driver: [
        { name: 'name', label: 'اسم السائق', type: 'text', required: true },
        { name: 'phone', label: 'رقم الجوال', type: 'text', required: true },
        { name: 'guarantor', label: 'اسم الضمين', type: 'text', required: true },
        { name: 'receiveDate', label: 'تاريخ الاستلام', type: 'date', required: true },
        { name: 'busNumber', label: 'اختر المركبة', type: 'select', source: 'buses' },
        { name: 'currentMeter', label: 'رقم الميتار', type: 'number', required: true }
    ],

    // 3. مخطط سجل الحساب (مطابق لـ DriverLedger.jsx)
    ledger_entry: [
        { name: 'date', label: 'التاريخ', type: 'date', required: true },
        { name: 'currentMeter', label: 'رقم الميتار', type: 'number', required: true },
        { name: 'paidAmount', label: 'المبلغ المدفوع', type: 'number', required: true },
        { name: 'note', label: 'ملاحظات', type: 'text' }
    ],

    // 4. مخطط العمليات السريعة (الزر الجديد في الداشبورد)
    // ملف formSchemas.js

    quick_rent: [
        { name: 'driverId', label: 'اسم السائق', type: 'select', source: 'driversData' },
        // التعديل: التأكد من أن name هو busNumber ليتطابق مع دالة التعبئة التلقائية
        { name: 'busNumber', label: 'رقم المركبة', type: 'text', disabled: true }, 
        { name: 'currentMeter', label: 'آخر قراءة للعداد', type: 'number' },
        { name: 'paidAmount', label: 'المبلغ المدفوع', type: 'number', required: true }
    ],

    quick_oil: [
    { 
        name: 'busId', 
        label: 'اختر المركبة (الباص)', 
        type: 'select', 
        source: 'busesData' // تأكد أن المودال لديه وصول لبيانات الباصات
    },
    { name: 'currentMeter', label: 'القراءة الحالية للعداد', type: 'number', required: true },
    { name: 'paidAmount', label: 'تكلفة تغيير الزيت', type: 'number', required: true },
    { name: 'date', label: 'تاريخ التغيير', type: 'date' },
    { name: 'note', label: 'ملاحظات الصيانة', type: 'textarea' }
],

    // في ملف formSchemas.js
quick_repair: [
    { 
        name: 'busId', 
        label: 'اختر المركبة (الباص)', 
        type: 'select', 
        source: 'busesData' 
    },
    { name: 'date', label: 'تاريخ الإصلاح', type: 'date' },
    { name: 'cost', label: 'تكلفة الإصلاح', type: 'number', required: true },
    { name: 'note', label: 'تفاصيل العطل والإصلاح', type: 'textarea', required: true }
],

};

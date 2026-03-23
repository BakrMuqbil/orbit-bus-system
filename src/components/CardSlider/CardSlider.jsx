import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import styles from './CardSlider.module.css'; // تغيير الاستيراد إلى موديول
import UniversalModal from "../UniversalModal"
const CardSlider = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);

  const [newDriver, setNewDriver] = useState({
    name: '', phone: '', guarantor: '', receiveDate: '',
    busNumber: '', startMeter: '', dailyRent: '',
    status: 'نشط', badgeClass: 'badge-active'
  });

  // 1. دالة جلب البيانات (useEffect)
useEffect(() => {
  const loadData = async () => {
    try {
      // جلب السائقين مع بيانات الباص المرتبط (السيرفر الآن يعيد JOIN)
      const driversData = await smartGet('driversData');

      // تأكد أن كل سائق مرتبط بالباص الخاص به
      const formattedDrivers = driversData.map(driver => ({
        ...driver,
        busNumber: driver.busNumber || 'غير مرتبط',
        dailyRent: driver.dailyRent || 0,
        initialMeter: driver.initialMeter || 0,
      }));

      setDrivers(formattedDrivers);

      // جلب الباصات المتاحة فقط (تأكد أن الحقل موجود)
      const busesData = await smartGet('buses');
      const availableBuses = busesData.filter(bus => bus.status === 'في الخدمة' || !bus.status);
      setBuses(availableBuses);

    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
      setDrivers([]);
      setBuses([]);
    }
  };

  loadData();
}, []);

// 2. دالة فتح مودال التعديل
const handleEditClick = (driver) => {
    setEditingDriverId(driver.id);
    // نضع البيانات في الفورم مع الحفاظ على المسميات camelCase
    setNewDriver({ 
      ...driver, 
      busNumber: String(driver.busNumber || '') 
    });
    setIsModalOpen(true);
};

// 3. دالة إضافة أو تحديث السائق (المسؤولة عن الـ POST/PUT)
const handleAddDriver = async (e) => {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  // البحث عن الباص المختار من القائمة (بناءً على busNumber)
  const selectedBus = buses.find(
    b => String(b.busNumber) === String(newDriver.busNumber)
  );

  if (!editingDriverId && !selectedBus) {
    return alert("يرجى اختيار باص أولاً");
  }

  try {
    // تجهيز الكائن للإرسال بالحقول الصحيحة التي يستقبلها السيرفر
    const dataToSave = {
      name: newDriver.name || '',
      phone: newDriver.phone || '',
      guarantor: newDriver.guarantor || '',
      receiveDate: newDriver.receiveDate || new Date().toISOString(),
      busId: selectedBus ? selectedBus.id : newDriver.busId || null
    };

    // إرسال البيانات (smartSave يحدد POST أو PUT حسب وجود editingDriverId)
    await smartSave('driversData', dataToSave, editingDriverId);

    // تحديث القوائم في الواجهة
    const updatedDrivers = await smartGet('driversData');
    setDrivers(updatedDrivers);

    const updatedBuses = await smartGet('buses');
    setBuses(updatedBuses);

    handleCloseModal();
    alert(editingDriverId ? "تم التعديل بنجاح" : "تم الإضافة بنجاح");
  } catch (err) {
    console.error("خطأ في الحفظ:", err);
    alert("فشل الحفظ: " + err.message);
  }
};

// 4. دالة الحذف
const deleteDriver = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف السائق؟ سيتم إعادة الباص للخدمة تلقائياً.")) return;
    try {
      await smartDelete('driversData', id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      
      // تحديث الباصات المتاحة
      const updatedBuses = await smartGet('buses');
      setBuses(updatedBuses.filter(bus => bus.status === 'في الخدمة'));
    } catch (err) {
      alert("فشل الحذف");
    }
};

// 5. دالة إغلاق المودال وتصفير البيانات
const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDriverId(null);
    setNewDriver({
      name: '', phone: '', guarantor: '', receiveDate: '',
      busNumber: '', busId: '', startMeter: '', dailyRent: '',
      status: 'نشط'
    });
};


  return (
    <div className={styles['list-wrapper']} dir="rtl">
      <header className={styles['list-header']}>
        <h2 className={styles['title']}>إدارة السائقين</h2>
         <div> <span className={styles['count']}>{drivers.length}سائق</span>
        </div>
        <button className={styles['floating-plus-btn']} onClick={() => setIsModalOpen(true)}>+</button>
      </header>
      
      <div className={styles['cards-container']}>
        {drivers.map((driver, index) => (
          <div key={driver.id} className={styles['driver-main-card']}>
            {/* الدائرة العلوية كما في الصورة */}
            <div className={styles['avatar-top-section']}>
              <div className={styles['user-circle-icon']}>👤</div>
            </div>

            <div className={styles['card-details-body']} onClick={() => navigate(`/ledger/${driver.id}`)}>
              <h3 className={styles['driver-full-name']}>{driver.name}</h3>
              
              <div className={styles['info-grid']}>
              
                <div className={styles['info-row-item']}>
                  <span className={styles['item-label']}>باص:</span>
                  <span className={styles['item-value']}>#{driver.busNumber}</span>
                </div>
                
                <div className={styles['info-row-item']}>
                  <span className={styles['item-label']}>جوال:</span>
                  <span className={styles['item-value']}>{driver.phone}</span>
                </div>
                <div className={styles['info-row-item']}>
                  <span className={styles['item-label']}>ضمين:</span>
                  <span className={styles['item-value']}>{driver.guarantor}</span>&nbsp; 
                  &nbsp;<span className={styles['item-label']}>المبلغ:</span>
                  <span className={styles['item-value']}>{Number(driver.dailyRent).toLocaleString()}
                  </span>
                </div>
                
              </div>
              
              <div className={styles['horizontal-divider']}></div>
              
              <div className={styles['footer-date-info']}>
                <span>تاريخ الاستلام: {driver.receiveDate.split('T')[0]}</span>
              </div>
            </div>

            {/* الأزرار السفلية */}
            <div className={styles['card-footer-actions']}>
              <span className={`${styles['status-pill']} ${styles[driver.badgeClass]}`}>
                {driver.status}
              </span>
              <div className={styles['btns-group']}>
                <button className={styles['action-circle-btn-dele']} onClick={(e) => { e.stopPropagation(); deleteDriver(driver.id); }}>️<svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="35px" fill="#992B15"><path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-328 469.33h66.66v-386h-66.66v386Zm164 0h66.66v-386h-66.66v386ZM267.33-740v553.33V-740Z"/></svg>

</button>
                <button className={styles['action-circle-btn']} onClick={(e) => { e.stopPropagation(); handleEditClick(driver); }}>️
<svg xmlns="http://www.w3.org/2000/svg" width="35px" height="40px" viewBox="0 0 24 24" fill="#02a317"><title xmlns="" fill="#02a317">edit-outline-rounded</title><path fill="#02a317" d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"/></svg></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      
    <UniversalModal 
    isOpen={isModalOpen} 
    onClose={handleCloseModal}
    schemaKey="driver" 
    title={editingDriverId ? "تعديل بيانات السائق" : "إضافة سائق جديد"}
    formData={newDriver} 
    setFormData={setNewDriver}
    dynamicData={{ buses: buses }}
    onSave={handleAddDriver}
    
    />





    </div>
  );
};

export default CardSlider;

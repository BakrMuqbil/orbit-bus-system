import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCash, mdiOil, mdiWrench, mdiAccountGroup, mdiPlus } from '@mdi/js';
import { smartSave, smartGet } from '../../utils/apiService';
import './Dashboard.css';
import UniversalModal from '../../components/UniversalModal';
import { globalFormSchema } from '../../components/constants/formSchemas';

const Dashboard = () => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // الحالات (States)
  const [dateFilter, setDateFilter] = useState({
    from: getTodayDate(),
    to: getTodayDate(),
  });
  const [stats, setStats] = useState({
    todayRevenue: 0,
    oilExpenses: 0,
    maintenanceExpenses: 0,
    totalDrivers: 0,
    totalSystemDebt: 0,
  });
  const [driversList, setDriversList] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quickTask, setQuickTask] = useState('');
  const [quickFormData, setQuickFormData] = useState({
    date: getTodayDate(),
    driverId: '',
    driverName:"",
    busNumber: '',
    currentMeter: '',
    paidAmount: '',
    oilInterval: 2000,
    dailyRent:'',
    note: '',
  });


  useEffect(() => {
    
    
    fetchDashboardData();
  }, [dateFilter]);
	useEffect(() => {
  // مراقبة id السائق فقط
  if (quickFormData.driverId) {
    const selectedDriver = driversList.find(d => String(d.id) === String(quickFormData.driverId));
    
    if (selectedDriver) {
      console.log("تحديث بيانات المركبة لـ:", selectedDriver.name);
      
      setQuickFormData(prev => ({
        ...prev,
        // تأكد أن المسميات هنا تطابق مسميات الحقول في quickFormData و formSchemas
        busNumber: selectedDriver.busNumber || '',
        currentMeter: selectedDriver.lastmeter || '',
        paidAmount: selectedDriver.dailyRent || '',
        driverName: selectedDriver?.name || '',
        
      }));
    }
  }
}, [quickFormData.driverId]);
// الحذف التام لـ driversList من المراقب لمنع التكرار اللانهائي
  const fetchDashboardData = async () => {
    try {
      const [drivers, ledger,busesData] = await Promise.all([
        smartGet('driversData'),
        smartGet('ledger'),
        smartGet('buses'),
      ]);
      
      const filteredLedger = ledger.filter(
        (entry) => entry.date >= dateFilter.from && entry.date <= dateFilter.to
      );
      const periodTotal = filteredLedger.reduce(
        (acc, curr) => acc + Number(curr.paidAmount || 0),
        0
      );
      const totalDebt = ledger.reduce(
        (acc, curr) =>
          acc + (Number(curr.rentAmount || 0) - Number(curr.paidAmount || 0)),
        0
      );

      const processedDrivers = drivers.map((driver) => {
        const driverEntries = ledger.filter(
          (l) => String(l.driverId) === String(driver.id)
        );
        const currentBalance = driverEntries.reduce(
          (acc, curr) =>
            acc + (Number(curr.rentAmount || 0) - Number(curr.paidAmount || 0)),
          0
        );
        return {
          ...driver,
          balance: currentBalance,
          status: currentBalance <= 0 ? 'محاسب' : 'مديون',
        };
      });

      setStats({
        todayRevenue: periodTotal,
        oilExpenses: 0,
        maintenanceExpenses: 0,
        totalDrivers: drivers.length,
        totalSystemDebt: totalDebt,
      });
      setBuses(busesData);
      setDriversList(processedDrivers);
      setLoading(false);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setLoading(false);
    }
  };
  const closeQuickModal = () => {
    setShowModal(false);
    setQuickTask('');
    setQuickFormData({
      date: getTodayDate(),
      driverId: '',
      busId: '',
      driverName: '',
      busNumber: '',
      currentMeter: '',
      paidAmount: '',
      oilInterval: 2000,
      note: '',
    });
  };
 
  const handleQuickActionSave = async (e) => {
  if (e) e.preventDefault();
  try {
    const selectedDriver = driversList.find(
      (d) => String(d.id) === String(quickFormData.driverId)
    );
    const selectedBus = buses.find(
  b => String(b.busNumber) === String(quickFormData.busNumber)
    );

    if (quickTask === "quick_rent") {
     
     const rentData = {
  driverId: quickFormData.driverId,
  busId: selectedBus ? selectedBus.id : null,  
  date: quickFormData.date || new Date().toISOString(),
  currentMeter: Number(quickFormData.currentMeter || 0),
  paidAmount: Number(quickFormData.paidAmount || 0),
  type: quickFormData.type || "rent",
  note: quickFormData.note || ""
};
      
      console.log("🚐 بيانات الإيجار:", rentData);
      await smartSave("ledger", rentData);
    // داخل مكون الداشبورد
    } else if (quickTask === "quick_oil") {
        const oilData = {
    busId: quickFormData.busId, // المعرف الرقمي للباص المختار
    date: quickFormData.date || new Date().toISOString(),
    currentMeter: Number(quickFormData.currentMeter),
    paidAmount: Number(quickFormData.paidAmount || 0),
    note: quickFormData.note || "تغيير زيت دوري"
  };

      console.log("🛢️ إرسال سجل زيت للمركبة:", oilData);
  // إرسال للمسار الذي أنشأناه في index.js
     await smartSave("oil_changes", oilData); 

} else if (quickTask === "quick_repair") {
  const repairData = {
    busId: parseInt(quickFormData.busId), // تحويل المعرف لرقم لضمان التوافق مع قاعدة البيانات
    date: quickFormData.date || new Date().toISOString(),
    note: quickFormData.note,
    cost: Number(quickFormData.cost || 0)
  };

  console.log("🔧 إرسال سجل إصلاح للمركبة:", repairData);
  // استدعاء المسار الذي أرسلته أنت في السيرفر
  await smartSave("repairsData", repairData); 
}


    alert("تمت العملية بنجاح");
    fetchDashboardData();
    closeQuickModal();
  } catch (err) {
    console.error("خطأ في الحفظ:", err);
    alert("فشل في الحفظ، تأكد من البيانات");
  }
};
  if (loading) return <div className='loader'>جاري تحميل البيانات...</div>;

  return (
    <div className='dashboard-wrapper' dir='rtl'>
      <header className='horizon-header'>
        <div className='header-titles'>
          <h2 className='header-main-title'>لوحة التحكم الرئيسية</h2>
        </div>
        <div className='horizon-tools-container'>
          <div className='horizon-filter-pill'>
            <div className='date-input-item'>
              <span>من</span>
              <input
                type='date'
                value={dateFilter.from}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, from: e.target.value })
                }
              />
            </div>
            <div className='date-input-item'>
              <span>إلى</span>
              <input
                type='date'
                value={dateFilter.to}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, to: e.target.value })
                }
              />
            </div>
          </div>
          <button
            className='horizon-circle-add'
            onClick={() => setShowModal(true)}>
            <Icon path={mdiPlus} size={1} />
          </button>
          <button onClick={fetchDashboardData} className='refresh-icon-btn'>
            🔄
          </button>
        </div>
      </header>

      <div className='stats-grid'>
        <StatCard
          title={dateFilter.from === dateFilter.to ? 'دخل اليوم' : 'دخل الفترة'}
          value={stats.todayRevenue}
          color='success'
          iconPath={mdiCash}
        />
        <StatCard
          title='خرج الزيت'
          value={stats.oilExpenses}
          color='info'
          iconPath={mdiOil}
        />
        <StatCard
          title='خرج الإصلاحات'
          value={stats.maintenanceExpenses}
          color='warning'
          iconPath={mdiWrench}
        />
        <StatCard
          title='إجمالي السائقين'
          value={stats.totalDrivers}
          color='primary'
          iconPath={mdiAccountGroup}
        />
      </div>

      <div className='overview-section'>
        <div className='overview-card'>
          <div className='overview-content'>
            <h3>إجمالي مديونية النظام المستحقة</h3>
            <h1
              className={
                stats.totalSystemDebt > 0 ? 'text-danger' : 'text-success'
              }>
              {stats.totalSystemDebt.toLocaleString()} <small>ريال</small>
            </h1>
          </div>
        </div>
      </div>

      <div className='table-container'>
        <table className='dashboard-table'>
          <thead>
            <tr>
              <th>السائق</th>
              <th>الباص</th>
              <th>الرصيد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {driversList.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <strong>{driver.name}</strong>
                </td>
                <td>#{driver.busNumber}</td>
                <td>{driver.balance.toLocaleString()} ريال</td>
                <td>
                  <span
                    className={`pill ${driver.balance <= 0 ? 'paid' : 'debt'}`}>
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* المودال الموحد مع القائمة المنسدلة في الأعلى */}
      {showModal && (
        <UniversalModal
          isOpen={showModal}
          onClose={closeQuickModal}
          schemaKey={quickTask}
          title='مركز العمليات السريعة'
          formData={quickFormData}
          setFormData={setQuickFormData}
          onSave={handleQuickActionSave}
					dynamicData={{
    driversData: driversList, // هذا سيملاً قائمة السائقين
    busesData: buses,       // سنستخدم نفس القائمة لجلب أرقام الباصات
    
  }}>
          <div
            className='form-group'
            style={{
              marginBottom: '20px',
              borderBottom: '1px solid #eee',
              paddingBottom: '15px',
            }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}>
              نوع العملية
            </label>
            <select
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}>
              <option value=''>-- اختر العملية --</option>
              <option value='quick_rent'>💰 قبض إيجار يومي</option>
              <option value='quick_oil'>🛢️ تغيير زيت / ميتار</option>
              <option value='quick_repair'>🛠️ تسجيل إصلاحات</option>
            </select>
          </div>
          {!quickTask && (
            <p style={{ textAlign: 'center', color: '#666' }}>
              يرجى تحديد نوع العملية للمتابعة
            </p>
          )}
        </UniversalModal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color, iconPath }) => (
  <div className={`card-stat border-${color}`}>
    <div className='card-info'>
      <p className='card-label'>{title}</p>
      <h2 className='card-value'>{value.toLocaleString()}</h2>
    </div>
    <div className={`card-icon ${color}`}>
      <Icon path={iconPath} size={1.2} />
    </div>
  </div>
);

export default Dashboard;

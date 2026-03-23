import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { smartGet, smartSave } from '../../utils/apiService'; 
import styles from './BusLedger.module.css'; 
import UniversalModal from '../UniversalModal'; 

const BusLedger = () => {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [bus, setBus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("quick_oil"); 
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'oil', 'repair'

  // البيانات المعالجة
  const [oilHistory, setOilHistory] = useState([]);
  const [repairHistory, setRepairHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  const [newEntry, setNewEntry] = useState({
    busId: busId,
    date: new Date().toISOString().split("T")[0],
    currentMeter: "",
    busNumber: '',
    paidAmount: "",
    dailyRent:'',
    cost:"",
    note: ""
  });

  useEffect(() => {
    fetchBusData();
  }, [busId]);

  const fetchBusData = async () => {
    try {
      setLoading(true);
      const buses = await smartGet("buses");
      const currentBus = bus.find(b => b.id.toString() === busId.toString());
      setBus(currentBus);

      const [oilData, repairData] = await Promise.all([
        smartGet("oil_changes", `busId=${busId}`).catch(() => []),
        smartGet("repairsData", `busId=${busId}`).catch(() => [])
      ]);

      // 1. معالجة بيانات الزيت (ترتيب تصاعدي للحساب)
      const processedOil = oilData
        .map(o => ({ ...o, type: 'oil', label: 'تغيير زيت', cost: Number(o.amount || 0), meter: Number(o.totalDistance || 0), 
        date: o.changedate || o.date }))
        .sort((a, b) => a.meter - b.meter);

      // 2. معالجة بيانات الصيانة (ترتيب تصاعدي للحساب)
      const processedRepair = repairData
        .map(r => ({ ...r, type: 'repair', label: 'إصلاح/صيانة', cost: Number(r.cost || 0), meter: Number(r.currentMeter || 0),
        date: r.date }))
        .sort((a, b) => a.meter - b.meter);

      // 3. دمج البيانات وترتيبها للعرض الشامل
      const merged = [...processedOil, ...processedRepair]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOilHistory(processedOil.reverse());
      setRepairHistory(processedRepair.reverse());
      setFullHistory(merged);
      
      setLoading(false);
    } catch (err) {
      console.error("خطأ في البيانات:", err);
      setLoading(false);
    }
  };
  const handleSave = async (e) => {
  if (e) e.preventDefault();
  try {
    const isOil = modalType === "quick_oil";
    const endpoint = isOil ? "oil_changes" : "repairsData";

    // دالة الأمان لمنع NaN وتحويل الفراغ إلى 0
    const fixNum = (val) => {
      const n = parseInt(val, 10);
      return isNaN(n) ? 0 : n;
    };

    const finalCost = fixNum(newEntry.paidAmount || newEntry.cost || 0);
    const finalMeter = fixNum(newEntry.currentMeter || 0);

    const dataToSave = isOil
      ? {
          // مطابقة تماماً لما يقرأه السيرفر
          busId: parseInt(busId),
          date: newEntry.date || new Date().toISOString().split("T")[0],
          currentMeter: finalMeter,
          paidAmount: finalCost,
          note: String(newEntry.note || "تغيير زيت دوري"),
        }
      : {
          // الصيانة كما هي تعمل الآن
          busId: parseInt(busId),
          date: newEntry.date || new Date().toISOString().split("T")[0],
          cost: finalCost,
          currentMeter: finalMeter,
          note: String(newEntry.note || ""),
        };

    console.log("🚀 جاري الحفظ بالبيانات:", dataToSave);

    await smartSave(endpoint, dataToSave);
    await fetchBusData();
    setShowModal(false);

    // تنظيف الحالة
    setNewEntry({
      busId: busId,
      date: new Date().toISOString().split("T")[0],
      currentMeter: "",
      paidAmount: "",
      dailyRent: "",
      cost: "",
      note: "",
    });

    alert("تم الحفظ بنجاح");
  } catch (err) {
    console.error("❌ فشل الحفظ:", err);
    alert("فشل الحفظ: يرجى إدخال أرقام صحيحة");
  }
};
  
  if (loading) return <div className="loader">جاري التحميل...</div>;

  const totalOil = oilHistory.reduce((sum, item) => sum + item.cost, 0);
  const totalRepair = repairHistory.reduce((sum, item) => sum + item.cost, 0);

  // دالة لاختيار البيانات بناءً على التبويب النشط
  const getDisplayData = () => {
    if (activeTab === 'oil') return oilHistory;
    if (activeTab === 'repair') return repairHistory;
    return fullHistory;
  };

  return (
    <div className={styles.ledgerPage} dir="rtl">
      <header className={styles.headerCard}>
        <div className="right-side">
          <button className={styles.backLink} onClick={() => navigate('/home/buses')}>← العودة</button>
          <h1>سجل صيانة المركبة</h1>
          <h3>مركبة #{bus?.busNumber}</h3>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.actionBtn} onClick={() => { setModalType("quick_oil"); setShowModal(true); }}>🛢️ زيت جديد</button>
           <button className={styles.actionBtn} style={{background: '#ffab00'}} onClick={() => { setModalType("quick_repair"); setShowModal(true); }}>🔧 صيانة جديدة</button>
        </div>
      </header>

      {/* قسم الملخص - Stats */}
      <div className={styles.summarySection}>
        <div className={styles.statBox} onClick={() => setActiveTab('all')} style={{cursor: 'pointer', border: activeTab === 'all' ? '1px solid #4318ff' : ''}}>
          <span>إجمالي المنصرفات</span>
          <h2 className={styles.textDanger}>{(totalOil + totalRepair).toLocaleString()} ريال</h2>
        </div>
        <div className={styles.statBox} onClick={() => setActiveTab('oil')} style={{cursor: 'pointer', border: activeTab === 'oil' ? '1px solid #00b8d8' : ''}}>
          <span>إجمالي الزيت</span>
          <h2 style={{color: '#00b8d8'}}>{totalOil.toLocaleString()} ريال</h2>
        </div>
        <div className={styles.statBox} onClick={() => setActiveTab('repair')} style={{cursor: 'pointer', border: activeTab === 'repair' ? '1px solid #ffab00' : ''}}>
          <span>إجمالي الصيانة</span>
          <h2 style={{color: '#ffab00'}}>{totalRepair.toLocaleString()} ريال</h2>
        </div>
      </div>

      {/* أزرار التحويل بين الجداول */}
      <div className={styles.tabsContainer}>
        <button className={activeTab === 'all' ? styles.activeTab : ''} onClick={() => setActiveTab('all')}>السجل الشامل</button>
        <button className={activeTab === 'oil' ? styles.activeTab : ''} onClick={() => setActiveTab('oil')}>سجل الزيت</button>
        <button className={activeTab === 'repair' ? styles.activeTab : ''} onClick={() => setActiveTab('repair')}>سجل الصيانة</button>
      </div>

      {/* الجدول الديناميكي */}
      <div className={styles.tableWrapper}>
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>البيان/الملاحظة</th>
              <th>التكلفة</th>
              <th>العداد</th>
            </tr>
          </thead>
          <tbody>
            {getDisplayData().map((item, index) => (
              <tr key={index}>
                <td>{new Date(item.date).toLocaleDateString('ar-YE')}</td>
                <td>
                  <span className={`${styles.statusBadge} ${item.type === 'oil' ? styles.oilType : styles.repairType}`}>
                    {item.label}
                  </span>
                </td>
                <td>{item.note || '---'}</td>
                <td className={styles.textSuccess}>{Number(item.cost).toLocaleString()} ريال</td>
                <td>{item.meter.toLocaleString()} كم</td>
              </tr>
            ))}
            {getDisplayData().length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px'}}>لا توجد سجلات في هذا القسم</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <UniversalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        schemaKey={modalType}
        formData={newEntry} 
        setFormData={setNewEntry}
        onSave={handleSave}
      />
    </div>
  );
};

export default BusLedger;

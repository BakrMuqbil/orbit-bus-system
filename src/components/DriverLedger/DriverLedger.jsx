import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
// استيراد الدوال الذكية الجديدة
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import './DriverLedger.css';
import UniversalModal from '../UniversalModal'; 


const DriverLedger = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [isNewLedgerEntry, setIsNewLedgerEntry] = useState(false);
const [selectedDriver, setSelectedDriver] = useState(null);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    driverId: "",
    busId: "",
    currentMeter: "",
    paidAmount: "",
    note: ""
  });

  // state للزيت
  const [oilCounterVal, setOilCounterVal] = useState(0);
  const [oilInterval, setOilInterval] = useState(2000);

  // جلب البيانات
  useEffect(() => {
    
    fetchData();
  
  }, [driverId]);
  
   useEffect(() => {
  if (isNewLedgerEntry && selectedDriver) {
    console.log("Auto-fill سجل جديد للسائق:", selectedDriver);

    setNewEntry(prev => ({
      ...prev,
      driverId: selectedDriver.driver_id,
      busNumber: selectedDriver.busNumber || '',
      currentMeter: selectedDriver.lastmeter || selectedDriver.initialMeter || '',
      paidAmount: selectedDriver.dailyRent || '',
      date: new Date().toISOString().split('T')[0]
    }));

    setIsNewLedgerEntry(false); // حتى لا يعيد التنفيذ
  }
}, [isNewLedgerEntry, selectedDriver]);


  const fetchData = async () => {
    try {
      setLoading(true);

      const drivers = await smartGet("driversData");
      const currentDriver = drivers.find(
        (d) => d.id.toString() === driverId.toString()
      );
      setDriver(currentDriver);
      setSelectedDriver(currentDriver);

      const ledgerData = await smartGet("ledger", `driverId=${driverId}`);

      // تأكد أن السجلات مرتبة تصاعديًا بالميتر
      ledgerData.sort(
        (a, b) => Number(a.currentMeter) - Number(b.currentMeter)
      );

      let previousMeter = Number(currentDriver?.initialMeter || 0);
      let runningBalance = 0;

      const processedData = ledgerData.map((entry) => {
        const currentMeter = Number(entry.currentMeter || 0);
        const paidAmount = Number(entry.paidAmount || 0);

        // حساب المسافة بشكل صحيح
        const distance =
          currentMeter > previousMeter ? currentMeter - previousMeter : 0;

        const rentAmount = Number(currentDriver?.dailyRent || 0);
        runningBalance += rentAmount - paidAmount;

        const currentData = {
          ...entry,
          currentMeter,
          initialMeter: currentDriver?.initialMeter || 0,
          dailyRent: rentAmount,
          paidAmount,
          distance,
          cumulativeBalance: runningBalance
        };

        previousMeter = currentMeter;
        return currentData;
      });

      // للعرض: الأحدث أولاً
      setLedger(processedData.reverse());
      setLoading(false);
    } catch (err) {
      console.error("خطأ في جلب بيانات السجل:", err);
      setLoading(false);
    }
  };

  // حساب المسافة المجمعة للزيت
  useEffect(() => {
    if (ledger.length > 0) {
      let totalDistance = ledger.reduce((sum, entry) => {
        const distance = Number(entry.distance || 0);
        return sum + distance;
      }, 0);

      setOilCounterVal(totalDistance);
    }
    
    
    
  }, [ledger]);

  // دالة التصفير
  const handleResetOil = () => {
    const defaultInterval = 2000;

    smartSave("oil_changes", {
      busId: driver?.busId,
      changeDate: new Date().toISOString(),
      totalDistance: oilCounterVal,
      amount: 0,
      note: "تصفير عداد الزيت"
    });

    setOilCounterVal(0);
    setOilInterval(defaultInterval);

    alert("تم تصفير عداد الزيت وإعادة ضبط العداد");
  };

  // تحديد اللون
  const oilColorClass =
    oilCounterVal <= oilInterval ? "text-success" : "text-danger";

  // إضافة سجل جديد
  const handleAddEntry = async (e) => {
    if (e) e.preventDefault();

    try {
      const currentBusId = driver?.busId || driver?.bus_id;
      const dataToSave = {
        driverId: driverId,
        busId: currentBusId,
        date: newEntry.date || new Date().toISOString(),
        currentMeter: Number(newEntry.currentMeter || 0),
        paidAmount: Number(newEntry.paidAmount || 0),
        type: newEntry.type || "rent",
        note: newEntry.note || ""
      };
      
      console.log("🚐 بيانات الإيجار:", dataToSave);
      if (!dataToSave.busId) {
        throw new Error("لم يتم العثور على رقم باص مرتبط بهذا السائق. تأكد من ربط السائق بباص أولاً.");
    }

      await smartSave("ledger", dataToSave, isEditing ? currentEntryId : null);

      await fetchData();
      
      handleCloseModal();
      alert(isEditing ? "تم تعديل السجل بنجاح" : "تمت إضافة السجل بنجاح");
    } catch (err) {
      console.error("خطأ في الحفظ:", err);
      alert("حدث خطأ أثناء الحفظ: " + err.message);
    }
  };

  const handleEditClick = (entry) => {
    setIsEditing(true);
    setCurrentEntryId(entry.id);
    setNewEntry({
      date: entry.date,
      currentMeter: Number(entry.currentMeter),
      paidAmount: Number(entry.paidAmount),
      note: entry.note || ""
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentEntryId(null);
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      currentMeter: "",
      paidAmount: "",
      note: ""
    });
  };

  const deleteLedger = async (id) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف السائق؟ سيتم إعادة الباص للخدمة تلقائياً."
      )
    )
      return;
    try {
      await smartDelete("ledger", id);
      setLedger((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("فشل الحذف");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت"
    ];
    return `${days[dateObj.getDay()]}-${String(dateObj.getDate()).padStart(
      2,
      "0"
    )}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  };

  const exportPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    doc.text(`Driver Report: ${driver.name}`, 40, 50);
    autoTable(doc, {
      startY: 120,
      head: [["Date", "Meter", "Dist", "Rent", "Paid", "Balance"]],
      body: ledger.map((item) => [
        item.date,
        item.currentMeter,
        `${item.distance} KM`,
        item.dailyRent,
        item.paidAmount,
        item.cumulativeBalance
      ])
    });
    doc.save(`Report_${driver.name}.pdf`);
  };

  if (loading) return <div className="loader"> </div>;

  
    return (
  <div className="ledger-page" dir="rtl">
    <header className="ledger-header-card">
      <div className="right-side">
        <button className="back-link" onClick={() => navigate('/home/drivers')}>← العودة</button>
        <h1>سجل الحساب اليومي</h1>
        <h3>{driver.name} | مركبة #{driver.busNumber}</h3>
      </div>
      <div className="left-side">
        <button className="export-btn" onClick={exportPDF}>📤 تصدير PDF</button>
        <button className="reset-oil-btn" onClick={handleResetOil}>🔄 تصفير الزيت</button>
        <button className="add-entry-btn" onClick={() =>{setShowModal(true)
    setIsNewLedgerEntry(true);}}>+ حركة جديدة</button>
      </div>
    </header>

    <div className="summary-section">
      <div className="stat-box">
        <span>المديونية الكلية</span>
         <h2 className={ledger[0]?.cumulativeBalance > 0 ? "text-danger" : "text-success"}>
                        {Number(ledger[0]?.cumulativeBalance || 0).toLocaleString()} ريال
                    </h2>
      </div>
      <div className="stat-box">
        <span>آخر ميتار</span>
<h2>{ledger[0]?.currentMeter || driver.initialMeter}</h2>
      </div>
      <div className="stat-box">
        <span>زيت المتبقي</span>
        <h2 className={oilColorClass}>
          {oilCounterVal <= oilInterval
            ? `${oilCounterVal} كم`
            : `تجاوز ${oilCounterVal - oilInterval} كم`}
        </h2>
      </div>
    </div>

    <div className="table-wrapper">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>الميتار</th>
            <th>المسافة</th>
            <th>الإيجار</th>
            <th>المدفوع</th>
            <th>الرصيد</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDate(entry.date)}</td>
              <td>{entry.currentMeter}</td>
              <td className={entry.distance > 200 ? "balance-debt" : "balance-ok"}>
                {entry.distance} كم
              </td>
              <td>{Number(entry.dailyRent || 0).toLocaleString()} ريال</td>
              <td className="paid-val">{Number(entry.paidAmount || 0).toLocaleString()} ريال</td>
              <td className={(Number(entry.dailyRent) - Number(entry.paidAmount)) > 0 ? "balance-debt" : "balance-ok"}>
                {Number(entry.dailyRent) - Number(entry.paidAmount)} ريال
              </td>
              <td>
                <button className="edit-cell" onClick={() => handleEditClick(entry)}>✏️</button>&nbsp;
                <button className="edit-cell" onClick={(e) => { e.stopPropagation(); deleteLedger(entry.id); }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <UniversalModal 
      isOpen={showModal} 
      onClose={handleCloseModal}
      schemaKey="ledger_entry"
      title={isEditing ? "📝 تعديل سجل" : "➕ إضافة سجل جديد"}
      formData={newEntry} 
      setFormData={setNewEntry}
      onSave={handleAddEntry}
    />
  </div>
);
};

export default DriverLedger;

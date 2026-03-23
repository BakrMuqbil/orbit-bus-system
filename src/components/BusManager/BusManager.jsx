import React, { useState, useEffect } from 'react';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import { useNavigate } from 'react-router-dom';
import UniversalModal from '../UniversalModal'; 
import './BusManager.css';

const BusManager = () => {
  const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBusId, setEditingBusId] = useState(null);
    const [newBus, setNewBus] = useState({ busNumber: '', initialMeter: '', dailyRent: '', status: 'في الخدمة' });

    const loadBuses = async () => {
        try {
            const data = await smartGet('buses');
            setBuses(data);
        } catch (err) { console.error("Error:", err); }
    };

    useEffect(() => { loadBuses(); }, []);

    const handleSaveBus = async () => {
        try {
            await smartSave('buses', newBus, editingBusId);
            loadBuses();
            handleCloseModal();
        } catch (err) { alert("خطأ في الحفظ"); }
    };

    const handleEditClick = (bus) => {
        setEditingBusId(bus.id);
        setNewBus({ ...bus });
        setShowModal(true);
    };

    const handleDeleteBus = async (id) => {
        if (!window.confirm("حذف؟")) return;
        try {
            await smartDelete('buses', id);
            setBuses(prev => prev.filter(b => b.id !== id));
        } catch (err) { alert("خطأ في الحذف"); }
    };

    const toggleStatus = async (bus) => {
        const nextStatus = bus.status === 'في الخدمة' ? 'خارج الخدمة' : 'في الخدمة';
        try {
            await smartSave('buses', { ...bus, status: nextStatus }, bus.id);
            setBuses(prev => prev.map(b => b.id === bus.id ? { ...b, status: nextStatus } : b));
        } catch (err) { alert("فشل تحديث الحالة"); }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBusId(null);
        setNewBus({ busNumber: '', initialMeter: '', dailyRent: '', status: 'في الخدمة' });
    };

    return (
        <div className="list-wrapper" dir="rtl">
            <header className="list-header">
                <h2 className="title">إدارة المركبات</h2>
                <div>
                <span className="count">{buses.length} مركبة</span>
                </div>
                <button className="save-btn" onClick={() => setShowModal(true)}>+</button>
            </header>

            <div className="vertical-stack">
                {buses.map(bus => (
                    <div key={bus.id} className={`driver-row-card ${bus.status === 'خارج الخدمة' ? 'dimmed' : ''}`}
                    onClick={() => navigate(`/bus-ledger/${bus.id}`)} // الانتقال للسجل
          style={{ cursor: 'pointer' }}
                    >
                        {/* الجزء العلوي: المعلومات */}
                        <div className="card-body">
                            <h3>باص رقم: #{bus.busNumber}</h3>
                            <div className="sub-info">
                                <span>الميتار: {bus.initialMeter} كم</span>
                                <span>
                                  الإيجار: {
                    Number(bus.dailyRent).toLocaleString()} ريال</span>
                            </div>
                            <span className={`status-tag ${bus.status === 'في الخدمة' ? 'badge-active' : 'badge-inactive'}`}>
                                {bus.status}
                            </span>
                        </div>

                        {/* الجزء السفلي: الأزرار (داخل الكارد) */}
                        <div className="card-footer">
                            <div className="button-group">
                                <button className="edit-icon-btn" onClick={() => handleEditClick(bus)}><svg xmlns="http://www.w3.org/2000/svg" width="35px" height="40px" viewBox="0 0 24 24" fill="#02a317"><title xmlns="" fill="#02a317">edit-outline-rounded</title><path fill="#02a317" d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"/></svg> </button>
                                <button className="delete-icon-btn" onClick={() => handleDeleteBus(bus.id)}>️
     <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="35px" fill="#992B15"><path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-328 469.33h66.66v-386h-66.66v386Zm164 0h66.66v-386h-66.66v386ZM267.33-740v553.33V-740Z"/></svg>
     </button>
                            </div>
                            <button className="status-toggle-btn" onClick={() => toggleStatus(bus)}>
                                {bus.status === 'في الخدمة' ? 'إخراج' : 'تفعيل'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <UniversalModal 
                isOpen={showModal} 
                onClose={handleCloseModal}
                schemaKey="bus"
                title={editingBusId ? "تعديل" : "إضافة"}
                formData={newBus} 
                setFormData={setNewBus}
                onSave={handleSaveBus}
            />
        </div>
    );
};

export default BusManager;

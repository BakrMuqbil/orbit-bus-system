import React from 'react';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { globalFormSchema } from '../components/constants/formSchemas';
import './UniversalModal.css';

const UniversalModal = ({
  isOpen,
  onClose,
  schemaKey,
  formData,
  setFormData,
  onSave,
  children,
  title,
  dynamicData = {},
}) => {
  if (!isOpen) return null;

  const fields = globalFormSchema[schemaKey] || [];

  const handleChange = (name, value) => {
    console.log("🔍 فحص المودال - الحقل:", name, "القيمة:", value, "المصادر المتوفرة:", Object.keys(dynamicData));
    console.log(`تغيير في الحقل: ${name} ، القيمة الجديدة: ${value}`);
    let updatedData = { ...formData, [name]: value };

    // المنطق الخاص بالربط التلقائي عند اختيار السائق (driverId)
    // نستخدم driversData كمصدر للبيانات في الداشبورد
    if (name === 'driverId' && dynamicData.driversData) {
      const selectedDriver = dynamicData.driversData.find(
        (d) => String(d.id) === String(value)
      );

      if (selectedDriver) {
        console.log("🟢 تم العثور على السائق بنجاح:", selectedDriver);
        updatedData = {
          ...updatedData,
          busId: selectedDriver.busId || selectedDriver.bus_id,
          busNumber: selectedDriver.busNumber || '',
          currentMeter: selectedDriver.lastMeter || selectedDriver.startMeter || '',
          driverName: selectedDriver?.name ||'',
        };
      }
    }

        // 2. المنطق الخاص بالمركبة (تغيير زيت / إصلاحات)
    if (name === 'busId' && dynamicData.busesData) {
      // فحص دقيق: تحويل القيمة القادمة (001) إلى رقم (1) ليتطابق مع ID قاعدة البيانات
      const busSearchId = Number(value); 

      const selectedBus = dynamicData.busesData.find(
        (b) => Number(b.id) === busSearchId
      );

      if (selectedBus) {
        console.log("🚌 نجح الـ Auto-fill للمركبة:", selectedBus);
        updatedData = {
          ...updatedData,
          // تأكد من مسمى العداد في جدولك (initialMeter)
          currentMeter: selectedBus.initialMeter || selectedBus.initialMeter || '',
          busNumber: selectedBus.busNumber || ''
        };
      } else {
        console.log("❌ لم يتم العثور على باص برقم ID:", busSearchId);
      }
    }

    setFormData(updatedData);
  };

  return (
    <div className='universal-modal-overlay' onClick={onClose}>
      <div
        className='universal-modal-content'
        onClick={(e) => e.stopPropagation()}
        dir='rtl'>
        <div className='modal-header'>
          <h3>{title}</h3>
          <button className='close-x-btn' onClick={onClose}>
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        <div className='modal-body'>
          {/* 1. إظهار "خانة الاختيار" الممررة من الداشبورد أولاً */}
          {children}

          {/* 2. رسم الحقول القادمة من السكيما */}
          {fields.map((field) => (
            <div key={field.name} className='smart-input-group'>
              <label>{field.label}</label>

              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                >
                  <option value=''>-- اختر {field.label} --</option>
                  {dynamicData[field.source]?.map((item) => (
                    <option
                      key={item.id}
                      // حل المشكلة 1: نستخدم رقم الباص كقيمة إذا كان الحقل يطلب رقم المركبة
                      value={field.name === 'busNumber' || field.source === 'busesData' ? item.busNumber : item.id}
                    >
                      {/* حل المشكلة 2: عرض رقم الباص بدلاً من الاسم أو الـ id في قائمة المركبات */}
                      {field.name === 'busNumber' || field.source === 'busesData'
                        ? `باص رقم ${item.busNumber || item.id}`
                        : item.name}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.label}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={field.disabled}
                  placeholder={field.label}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        <div className='modal-footer'>
          <button className='confirm-btn' onClick={(e) => onSave(e)}>
            حفظ التغييرات
          </button>
          <button className='cancel-btn' onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalModal;

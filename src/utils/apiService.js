// src/services/apiService.js

// المسار النسبي ليعمل مع الـ Proxy الموجود في vite.config.js
const API_URL = '/api'; 

/**
 * المحرك الأساسي (Core Request Handler)
 * يتعامل مع كافة طرق الإرسال (GET, POST, PUT, DELETE)
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}/${endpoint}`, options);
        
        // معالجة الأخطاء إذا لم تكن الاستجابة ناجحة (مثل خطأ 500 المزعج)
        if (!response.ok) {
            let errorMessage = `Server Error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // في حال كان الرد ليس JSON
            }
            throw new Error(errorMessage);
        }
        
        // التأكد من أن الرد يحتوي على بيانات قبل محاولة تحويله لـ JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        
        return { success: true };
    } catch (error) {
        console.error(`API Error [${method}] on ${endpoint}:`, error);
        throw error;
    }
};

/**
 * دالة الجلب الذكية (smartGet)
 * تُستخدم لجلب السائقين (driversData) أو الباصات
 */
export const smartGet = async (endpoint, params = "") => {
    const query = params ? `?${params}` : "";
    return await apiRequest(`${endpoint}${query}`, 'GET');
};

/**
 * دالة الحفظ الشاملة (smartSave)
 * تقوم بعمل POST للإضافة الجديدة و PUT إذا كان هناك ID للتعديل
 */
export const smartSave = async (endpoint, data, id = null) => {
    const method = id ? 'PUT' : 'POST';
    const path = id ? `${endpoint}/${id}` : endpoint;
    return await apiRequest(path, method, data);
};

/**
 * دالة الحذف (smartDelete)
 */
export const smartDelete = async (endpoint, id) => {
    if (!id) throw new Error("ID مطلوب لعملية الحذف");
    return await apiRequest(`${endpoint}/${id}`, 'DELETE');
};

/**
 * دالة مخصصة لعمليات السجل (Ledger Operations)
 * لتسهيل تسجيل (إيجار، زيت، إصلاحات) مباشرة من الداشبورد
 */
export const recordTransaction = async (transactionData) => {
    return await apiRequest('ledger', 'POST', transactionData);
};

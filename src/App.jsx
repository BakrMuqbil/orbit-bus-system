import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import Login from './pages/Login/login';
import Home from './pages/Home/home';
import Dashboard from "./pages/Dashboard/Dashboard"
import CardSlider from './components/CardSlider/CardSlider';
import BusManager from "./components/BusManager/BusManager";
import DriverLedger from "./components/DriverLedger/DriverLedger";
import BusLedger from "./components/BusLedger/BusLedger"

function App() {
  return (
      // <div>
//         <BusLedger />
//       </div>
      <Router>
      <Routes>
        {/* 1. صفحة تسجيل الدخول */}
        <Route path="/" element={<Login />} />
        
        
        {/* 2. صفحة السجل المالي (فتحة مستقلة كاملة بدون Sidebar) */}
        <Route path="/ledger/:driverId" element={<DriverLedger />} />
        <Route path="bus-ledger/:busId" element={<BusLedger />} />

        {/* 3. مسارات النظام الرئيسية (التي تحتوي على الـ Sidebar والـ Header) */}
        <Route path="/home" element={<Home />}>
          {/* هذه المسارات تظهر داخل مكون الـ Outlet في صفحة Home */}
          <Route path="drivers" element={<CardSlider />} />
          <Route path="buses" element={<BusManager />} />
          <Route path="dashboard" element={<Dashboard />}/>
           
        
        </Route>
        
        {/* 4. إعادة توجيه أي مسار غير معروف إلى صفحة تسجيل الدخول */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

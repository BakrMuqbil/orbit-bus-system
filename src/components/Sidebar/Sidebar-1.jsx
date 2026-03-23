import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './Sidebar-1.css';
import logo from '../../assets/images/logo.png'; // تأكد من المسارات

import profileImg from "../../assets/images/profile-img.jpg"

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault(); // منع الرابط من تحديث الصفحة

    // 1. مسح أي بيانات مخزنة (إذا كنت تستخدم localStorage مستقبلاً)
     localStorage.removeItem('user'); 
    
    // 2. إظهار رسالة تأكيد (اختياري)
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
      // 3. التوجيه لصفحة الـ Login
      navigate('/'); 
    }
  };
  return (
    <aside className="sidebar">
      {/* Header القسم العلوي */}
      <div className="sidebar-header">
        <img src={logo} alt="logo" />
        <h2>CodingLab</h2>
      </div>

      {/* Links قائمة الروابط */}
      <ul className="sidebar-links">
        <h4>
          <span>Main Menu</span>
          <div className="menu-separator"></div>
        </h4>
        <li>
          <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''}><span className="material-symbols-outlined">dashboard</span>Dashboard</NavLink>
        </li>
        <li>
          <NavLink to="/home/dashboard" className={({ isActive}) => isActive ? 'active' : ''}><span className="material-symbols-outlined">overview</span>Overview</NavLink>
        </li>
        <li>
           <NavLink to="/home/buses" className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="material-symbols-outlined">directions_bus</span>Buses
    </NavLink>
        </li>

        <h4>
          <span>General</span>
          <div className="menu-separator"></div>
        </h4>
        <li>
          <a href="#"><span className="material-symbols-outlined">folder</span>Projects</a>
        </li>
        <li><NavLink to="/home/drivers" className={({ isActive }) => isActive ? 'active' : ''}>
    <span className="material-symbols-outlined">groups</span>Drivers
  </NavLink>
          
        </li>
        <li>
          <a href="#"><span className="material-symbols-outlined">move_up</span>Transfer</a>
        </li>
        
        <h4>
          <span>Account</span>
          <div className="menu-separator"></div>
        </h4>
        <li>
          <a href="#"><span className="material-symbols-outlined">account_circle</span>Profile</a>
        </li>
        <li>
          <a href="#"><span className="material-symbols-outlined">settings</span>Settings</a>
        </li>
        <li>
          <a href="#" onClick={handleLogout}><span className="material-symbols-outlined">logout</span>Logout</a>
        </li>
      </ul>

      {/* User Account حساب المستخدم */}
      <div className="user-account">
        <div className="user-profile">
          <img src={profileImg} alt="Profile" />
          <div className="user-detail">
            <h3>Eva Murphy</h3>
            <span>Web Developer</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

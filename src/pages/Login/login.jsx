
import React from 'react';
import { useNavigate } from 'react-router-dom';
import users from '@data/users.json';
import InputField from "@components/InputField/InputField";

import { useState } from "react";
import './login.css';

const Login = () => {
const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
      
      
    // البحث عن المستخدم في ملف JSON
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem('isLoggedIn', 'true'); 
  localStorage.setItem('username', user.username);
      alert("تم تسجيل الدخول بنجاح!");
      navigate('/home'); // الانتقال لصفحة الهوم
    } else {
      alert("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
     <main className="login-page">
      <div className="login-content-wrapper">
    <div className="login-container">
      <h2 className="form-title">Log in with</h2>
      

      <p className="separator"><span>or</span></p>

      <form onSubmit={handleLogin} className="login-form">
        <InputField type="text" placeholder="Email address" icon="mail" onChange={(e) => setUsername(e.target.value)}  />
        <InputField type="password" placeholder="Password" icon="lock" onChange={(e) => setPassword(e.target.value)} />

        <a href="#" className="forgot-password-link">Forgot password?</a>
        <button type="submit" className="login-button">Log In</button>
      </form>

      <p className="signup-prompt">
        Don&apos;t have an account? <a href="#" className="signup-link">Sign up</a>
      </p>
    </div>
    </div>
    </main>
  )
}

export default Login;
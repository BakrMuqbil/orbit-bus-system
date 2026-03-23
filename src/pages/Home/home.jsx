import React, { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar-1"; 
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userStatus = localStorage.getItem("isLoggedIn");
        if (userStatus !== "true") {
            navigate("/");
        }
    }, [navigate]);

    // نتحقق إذا كان المسار هو /home بالظبط لعرض الداشبورد
    const isDashboard = location.pathname === "/home" || location.pathname === "/home/";

    return (
        <div className="home-layout">
            <Sidebar />

            <main className="main-content">
                {isDashboard ? (
                    <div className="dashboard-content">
                        <header className="welcome-section">
                            <h1>Welcome Back, Bakr! 👋</h1>
                            <p>This is your dashboard overview.</p>
                        </header>

                        <section className="dashboard-cards">
                            <div className="stat-card"><h3>Active Projects</h3><p>12</p></div>
                            <div className="stat-card"><h3>Messages</h3><p>5 New</p></div>
                            <div className="stat-card"><h3>System Status</h3><p>Online</p></div>
                        </section>
                    </div>
                ) : (
                    /* هنا يظهر كود CardSlider عند الضغط على الزر */
                    <Outlet />
                )}
            </main>
        </div>
    );
};

export default Home;

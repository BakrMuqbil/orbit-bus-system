const sidebar = document.querySelector(".sidebar");
const sidebarToggler = document.querySelector(".sidebar-toggler");
const menuToggler = document.querySelector(".menu-toggler");


let collapsedSidebarHeight = "56px"; // 
let fullSidebarHeight = "calc(100vh - 32px)";


sidebar.classList.toggle("collapsed");

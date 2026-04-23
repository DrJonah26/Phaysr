@echo off
start "Backend" cmd /k "cd /d D:\Phaysr\backend && npm run dev"
start "Demo-Site" cmd /k "cd /d D:\Phaysr\demo-site && npm run dev"
start "Widget" cmd /k "cd /d D:\Phaysr\widget && npm run dev"

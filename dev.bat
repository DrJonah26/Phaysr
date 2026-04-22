@echo off
start "Backend" cmd /k "cd /d D:\Phaysr\backend && pnpm run dev"
start "Demo-Site" cmd /k "cd /d D:\Phaysr\demo-site && pnpm run dev"
start "Widget" cmd /k "cd /d D:\Phaysr\widget && pnpm run dev"

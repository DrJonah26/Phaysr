@echo off
REM Opens one console window per service (Windows).
set ROOT=%~dp0
start "Backend"   cmd /k "cd /d %ROOT%backend && pnpm run dev"
start "App"       cmd /k "cd /d %ROOT%app && pnpm run dev"
start "Demo-Site" cmd /k "cd /d %ROOT%demo-site && pnpm run dev"
start "Widget"    cmd /k "cd /d %ROOT%widget && pnpm run dev"

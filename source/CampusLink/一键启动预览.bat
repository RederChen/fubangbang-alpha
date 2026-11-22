@echo off
chcp 936 >nul
title 福帮帮前端生产预览启动器
cd /d "%~dp0"

echo ========================================================
echo        福帮帮 (CampusLink) 生产打包本地预览启动器
echo        设计基准: iPhone 18 Pro Max (440 x 956)
echo        最新状态: 登录页去AI模板化、Logo飞溅细节修复
echo ========================================================
echo.
echo [核心页面访问指引]:
echo   - 首页:     http://localhost:4173/
echo   - 登录页:   http://localhost:4173/login
echo   - 注册页:   http://localhost:4173/register
echo   - 二手闲置: http://localhost:4173/idle
echo.

:: 检查 dist 是否存在
if not exist "dist\index.html" (
    echo [*] 未检测到构建产物，正在自动执行构建...
    call npm.cmd run build
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] 未检测到 Node.js，自动切换至免安装极速预览模式...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"
    goto END
)

echo [*] 正在启动生产预览服务器 (Vite Preview)...
start "" cmd /c "timeout /t 2 >nul & start http://localhost:4173/"
call npm.cmd run preview

:END
pause

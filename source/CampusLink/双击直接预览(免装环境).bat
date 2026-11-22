@echo off
chcp 936 >nul
title 福帮帮前端免安装体验版 (iPhone 18 Pro Max 标准基准)
cd /d "%~dp0"

echo ========================================================
echo        福帮帮 (CampusLink) 前端体验版 (无需Node.js)
echo        设计基准: iPhone 18 Pro Max (440 x 956)
echo        最新状态: 登录页去AI模板化、Logo飞溅细节修复
echo ========================================================
echo.
echo 正在启动本地预览服务器，请稍候...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"

pause

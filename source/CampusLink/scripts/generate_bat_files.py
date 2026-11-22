# -*- coding: utf-8 -*-
"""
生成 Windows 根目录一键启动 bat 脚本
"""
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(ROOT_DIR)

bat_no_env = """@echo off
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

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\\server.ps1"

pause
"""

bat_dev = """@echo off
chcp 936 >nul
title 福帮帮前端开发环境启动器 (源码热更新版)
cd /d "%~dp0"

echo ========================================================
echo        福帮帮 (CampusLink) 源码开发环境启动器
echo        设计基准: iPhone 18 Pro Max (440 x 956)
echo        最新状态: 登录页去AI模板化、Logo飞溅完整修复
echo ========================================================
echo.
echo [核心页面访问指引]:
echo   - 首页:     http://localhost:5173/
echo   - 登录页:   http://localhost:5173/login
echo   - 注册页:   http://localhost:5173/register
echo   - 二手闲置: http://localhost:5173/idle
echo.

:: 1. 检查 Node.js 环境
where node >nul 2>nul
if %errorlevel% neq 0 goto NO_NODE

where npm >nul 2>nul
if %errorlevel% neq 0 goto NO_NODE

echo [√] 已检测到 Node.js 环境:
node -v
echo.

:: 2. 检查依赖
if exist "node_modules\\vite" goto START_DEV

echo [*] 未检测到依赖包，正在使用国内镜像源自动安装...
echo     (首次安装约需 10-20 秒，请耐心等待)
echo.
call npm.cmd install --registry=https://registry.npmmirror.com
if %errorlevel% neq 0 goto INSTALL_FAILED

:START_DEV
echo.
echo [*] 正在启动 Vite 开发服务器 (按 Ctrl+C 可停止)...
start "" cmd /c "timeout /t 2 >nul & start http://localhost:5173/"
call npm.cmd run dev
goto END

:NO_NODE
echo.
echo ========================================================
echo [提示] 您的电脑尚未安装 Node.js 环境！
echo ========================================================
echo.
echo 1. 如果您只想【查看和体验页面效果】：
echo    请关闭此窗口，直接双击运行目录下的：
echo    【双击直接预览(免装环境).bat】 (完全不需要安装 Node.js)
echo.
echo 2. 如果您是【前端开发人员】需要修改代码：
echo    请前往 Node.js 官网下载并安装: https://nodejs.org/
echo    安装完成后重新双击此脚本即可。
echo.
pause
exit /b

:INSTALL_FAILED
echo.
echo [错误] 依赖安装失败，请检查网络连接后重试。
pause
exit /b

:END
pause
"""

bat_preview = """@echo off
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
if not exist "dist\\index.html" (
    echo [*] 未检测到构建产物，正在自动执行构建...
    call npm.cmd run build
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] 未检测到 Node.js，自动切换至免安装极速预览模式...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\\server.ps1"
    goto END
)

echo [*] 正在启动生产预览服务器 (Vite Preview)...
start "" cmd /c "timeout /t 2 >nul & start http://localhost:4173/"
call npm.cmd run preview

:END
pause
"""

with open("双击直接预览(免装环境).bat", "w", encoding="gbk", errors="ignore") as f:
    f.write(bat_no_env)

with open("一键启动(源码开发版).bat", "w", encoding="gbk", errors="ignore") as f:
    f.write(bat_dev)

with open("一键启动预览.bat", "w", encoding="gbk", errors="ignore") as f:
    f.write(bat_preview)

print("一键启动脚本已全部重新生成完毕！")

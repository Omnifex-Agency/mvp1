
@echo off
echo Starting Highlight Agent Development Environment...

start "Backend Server" cmd /k "cd backend\src && node server.js"
start "Dashboard" cmd /k "cd dashboard && npm run dev"

echo Services started!
echo - Backend: http://localhost:3001
echo - Dashboard: http://localhost:5173

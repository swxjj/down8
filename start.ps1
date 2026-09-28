# OmniMedia Launcher Script for Windows PowerShell
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Starting OmniMedia - Global Media Downloader  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '.\.venv\Scripts\python.exe' run.py"

Start-Sleep -Seconds 2

Write-Host "`n[2/2] Starting React + Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nServices launched in separate windows!" -ForegroundColor Magenta
Write-Host "Backend API:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
Write-Host "Frontend App: http://localhost:5173"
Write-Host "================================================" -ForegroundColor Cyan

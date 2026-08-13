# PowerShell RAM Working Set Trimmer & Process Analyzer

Write-Host "⚡ EXECUTING WINDOWS WORKING SET RAM TRIM" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"

# Trim working sets of non-critical user processes
$processes = Get-Process | Where-Object { $_.WorkingSet64 -gt 20MB }

$trimmedCount = 0
foreach ($p in $processes) {
    try {
        # Setting working set limits forces Windows to release unused standby pages
        $p.MinWorkingSet = [System.IntPtr]::Zero
        $p.MaxWorkingSet = [System.IntPtr]::Zero
        $trimmedCount++
    } catch {}
}

[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "✅ Trimmed working sets of $trimmedCount active processes." -ForegroundColor Green

# Display updated Top 10 RAM consuming applications
Write-Host "`n📊 TOP MEMORY CONSUMING APPLICATIONS NOW:" -ForegroundColor Yellow
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB, 2)}} | Format-Table -AutoSize

# Display Free RAM
$totalRamGB = [math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
$freeRamGB = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2)
$usedRamGB = [math]::Round($totalRamGB - $freeRamGB, 2)
$usedPercent = [math]::Round(($usedRamGB / $totalRamGB) * 100, 1)

Write-Host "--------------------------------------------------------"
Write-Host "🧠 Total System RAM: $totalRamGB GB" -ForegroundColor White
Write-Host "📊 Used RAM:        $usedRamGB GB ($usedPercent%)" -ForegroundColor Yellow
Write-Host "🚀 Free RAM:        $freeRamGB GB" -ForegroundColor Green

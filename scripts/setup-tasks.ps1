# Create Windows Task Scheduler jobs for ANCAP automation

$ErrorActionPreference = "Stop"

# 1. Heartbeat Task (every 3 hours)
$heartbeatAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\drago\Desktop\ANCAP\scripts\heartbeat-ancap.ps1`""
$heartbeatTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 3)
$heartbeatSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$heartbeatPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName "ANCAP-Heartbeat" -Action $heartbeatAction -Trigger $heartbeatTrigger -Settings $heartbeatSettings -Principal $heartbeatPrincipal -Force
Write-Host "✅ Created task: ANCAP-Heartbeat (every 3 hours)"

# 2. Posting Task (every 3 hours, offset by 30 minutes)
$postingAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\drago\Desktop\ANCAP\scripts\post-news.ps1`""
$postingTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(30) -RepetitionInterval (New-TimeSpan -Hours 3)
$postingSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$postingPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName "ANCAP-Posting" -Action $postingAction -Trigger $postingTrigger -Settings $postingSettings -Principal $postingPrincipal -Force
Write-Host "✅ Created task: ANCAP-Posting (every 3 hours, offset +30min)"

Write-Host ""
Write-Host "Tasks created successfully!"
Write-Host "View tasks: Get-ScheduledTask | Where-Object {$_.TaskName -like 'ANCAP-*'}"
Write-Host "Run manually: Start-ScheduledTask -TaskName 'ANCAP-Heartbeat'"

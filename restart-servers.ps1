param(
    [int]$BackendPort = 3000,
    [int]$FrontendPort = 5173,
    [string]$BackendDir = $null,
    [string]$FrontendDir = $null,
    [string]$BackendCmd = "npm run dev",
    [string]$FrontendCmd = "npm run dev"
)

if (-not $BackendDir) { $BackendDir = Join-Path $PSScriptRoot 'backend' }
if (-not $FrontendDir) { $FrontendDir = Join-Path $PSScriptRoot 'frontend' }

function Get-PidsByPort($port) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        return $conns | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    } catch {
        $pids = @()
        $lines = netstat -ano -p tcp | Select-String ":$port\s" -SimpleMatch
        foreach ($l in $lines) {
            $parts = ($l -replace "\s+", " ").Trim() -split ' '
            $foundPid = $parts[-1]
            if ($foundPid -and ($foundPid -as [int])) { $pids += [int]$foundPid }
        }
        return $pids
    }
}

function Kill-Port($port) {
    $pids = Get-PidsByPort $port | Select-Object -Unique
    if ($pids -and $pids.Count -gt 0) {
        foreach ($procId in $pids) {
            $shellToKill = $null
            try {
                $cur = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
                while ($cur) {
                    $parentId = $cur.ParentProcessId
                    if (-not $parentId) { break }
                    $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $parentId" -ErrorAction SilentlyContinue
                    if (-not $parent) { break }
                    $pname = $parent.Name
                    if ($pname -match 'powershell.exe|pwsh.exe|cmd.exe') { $shellToKill = $parent.ProcessId; break }
                    $cur = $parent
                }
            } catch {
                # ignore errors finding parent processes
            }

            try {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host "Killed PID $procId on port $port"
            } catch {
                Write-Warning "Failed to kill PID $($procId): $($_)"
            }

            if ($shellToKill) {
                try {
                    $shellProc = Get-Process -Id $shellToKill -ErrorAction SilentlyContinue
                    if ($shellProc) {
                        if ($shellProc.MainWindowHandle -ne 0) {
                            $sent = $shellProc.CloseMainWindow()
                            if ($sent) {
                                Write-Host "Sent CloseMainWindow to shell PID $shellToKill; waiting up to 5s for it to exit..."
                                $wait = 0
                                while (Get-Process -Id $shellToKill -ErrorAction SilentlyContinue) {
                                    Start-Sleep -Milliseconds 500
                                    $wait += 500
                                    if ($wait -ge 5000) { break }
                                }
                                if (-not (Get-Process -Id $shellToKill -ErrorAction SilentlyContinue)) {
                                    Write-Host "Shell PID $shellToKill closed cleanly."
                                } else {
                                    Write-Warning "Shell PID $shellToKill did not exit after CloseMainWindow (safe mode: not force-killing)."
                                }
                            } else {
                                Write-Warning "Shell PID $shellToKill refused CloseMainWindow or has no interactive window (safe mode: not killing)."
                            }
                        } else {
                            Write-Host "Shell PID $shellToKill has no main window; not closing (safe mode)."
                        }
                    }
                } catch {
                    Write-Warning "Error while attempting to close shell PID $($shellToKill): $($_)"
                }
            }
        }
    } else {
        Write-Host "No process found on port $port"
    }
}

Write-Host "Killing processes on ports $BackendPort and $FrontendPort..."
Kill-Port $BackendPort
Kill-Port $FrontendPort
Start-Sleep -Seconds 1

Write-Host "Starting backend and frontend in new PowerShell windows..."
$backendCmdStr = "Set-Location -LiteralPath '$BackendDir'; $BackendCmd"
$frontendCmdStr = "Set-Location -LiteralPath '$FrontendDir'; $FrontendCmd"

Start-Process powershell -ArgumentList "-NoExit","-Command",$backendCmdStr -WorkingDirectory $BackendDir
Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendCmdStr -WorkingDirectory $FrontendDir

Write-Host "Done. Two PowerShell windows should be open running the dev servers."

Exit 0

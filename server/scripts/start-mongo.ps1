$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue) {
  Write-Output 'Port 27017 already has a listener. Reusing your running MongoDB instance.'
  exit 0
}
$installedMongo = Get-Command mongod.exe -ErrorAction SilentlyContinue
if ($installedMongo) { $mongoExecutable = $installedMongo.Source }
else {
  $portableRoot = Join-Path $projectRoot 'work\mongodb'
  $mongoExecutable = (Get-ChildItem -LiteralPath $portableRoot -Filter mongod.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
}
if (!$mongoExecutable) { throw 'Install MongoDB Community Server and put mongod on PATH, or start its Windows service. See README.md.' }
$databaseDirectory = Join-Path $projectRoot 'work\db'
New-Item -ItemType Directory -Force -Path $databaseDirectory | Out-Null
$logFile = Join-Path $projectRoot 'work\mongodb.log'
$arguments = @('--dbpath', ('"' + $databaseDirectory + '"'), '--bind_ip', '127.0.0.1', '--port', '27017', '--logpath', ('"' + $logFile + '"'), '--logappend')
$mongoProcess = Start-Process -FilePath $mongoExecutable -ArgumentList $arguments -WindowStyle Hidden -PassThru
$mongoProcess.Id | Set-Content -LiteralPath (Join-Path $projectRoot 'work\mongodb.pid')
Write-Output "MongoDB started locally (PID $($mongoProcess.Id)). Data: $databaseDirectory"

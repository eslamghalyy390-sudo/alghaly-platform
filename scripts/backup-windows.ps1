param([string]$Destination = $(if($env:BACKUP_DIR){$env:BACKUP_DIR}else{'./backups'}),[int]$RetentionDays = $(if($env:BACKUP_RETENTION_DAYS){[int]$env:BACKUP_RETENTION_DAYS}else{30}))
if(-not $env:DATABASE_URL){throw 'DATABASE_URL is required'}
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$stamp=(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH-mm-ssZ')
$file=Join-Path $Destination "alghaly-$stamp.sql"
pg_dump $env:DATABASE_URL --no-owner --no-privileges --file=$file
Get-ChildItem $Destination -Filter 'alghaly-*.sql' | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)} | Remove-Item -Force
Write-Output "Backup created: $file"

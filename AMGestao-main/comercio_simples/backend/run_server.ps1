<#
run_server.ps1

Carrega variáveis de ambiente do arquivo .env e inicia o servidor Uvicorn usando o python do venv se disponível.
Uso: .\run_server.ps1
#>

param(
    [string]$EnvFile = ".env"
)

function Load-DotEnv($path) {
    if (-not (Test-Path $path)) { return }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#')) {
            if ($line -match '^\s*([^=]+)\s*=\s*(.*)\s*$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1,$value.Length-2)
                }
                Write-Host "[env] $name=$value"
                Set-Item -Path "Env:\$name" -Value $value
            }
        }
    }
}

# Carrega .env se existir
Load-DotEnv (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) $EnvFile)

$host = $Env:HOST
$port = $Env:PORT
if (-not $host) { $host = '127.0.0.1' }
if (-not $port) { $port = '8000' }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venvPython = Join-Path $scriptDir '.venv\Scripts\python.exe'

Write-Host "Starting Uvicorn on $host:$port"

if (Test-Path $venvPython) {
    Write-Host "Using venv python: $venvPython"
    & $venvPython -m uvicorn app.main:app --reload --host $host --port $port
} else {
    Write-Host ".venv python not found; attempting to use system uvicorn (must be in PATH)"
    try {
        uvicorn app.main:app --reload --host $host --port $port
    } catch {
        Write-Error "Failed to start uvicorn. Ensure .venv exists or that 'uvicorn' is installed in PATH.";
        exit 1
    }
}

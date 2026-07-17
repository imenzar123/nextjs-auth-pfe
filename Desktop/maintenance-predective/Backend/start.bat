@echo off
REM ---------------------------------------------------------------
REM  Backend dev server — uses Scoop PHP 8.5 (has pdo_pgsql)
REM  and ensures PostgreSQL bin (libpq.dll) is in PATH.
REM ---------------------------------------------------------------

set SCOOP_PHP=C:\Users\MSI\scoop\apps\php\current\php.exe
set SCOOP_PGBIN=C:\Users\MSI\scoop\apps\postgresql\current\bin

REM Add PostgreSQL bin first so libpq.dll is resolved
set PATH=%SCOOP_PGBIN%;%PATH%

REM Start PostgreSQL if not already running
"%SCOOP_PGBIN%\pg_ctl.exe" status -D "C:\Users\MSI\scoop\apps\postgresql\current\data" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting PostgreSQL...
    "%SCOOP_PGBIN%\pg_ctl.exe" start -D "C:\Users\MSI\scoop\apps\postgresql\current\data" -l "C:\Users\MSI\scoop\apps\postgresql\current\data\postgres.log" -w
)

echo Using PHP: %SCOOP_PHP%
"%SCOOP_PHP%" artisan serve

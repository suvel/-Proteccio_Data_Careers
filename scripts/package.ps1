<#
Packages the files needed to deploy this app (Express server + built client)
into a zip, excluding node_modules, .git, and other dev-only files.

Assumes `npm run build` has already been run, so client/dist exists.
The target host must run `npm install` (not --production, ts-node is a
devDependency needed by `npm start`) and then `npm start`.
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$outZip = Join-Path $root 'deploy.zip'
$staging = Join-Path $root '.deploy-staging'

if (-not (Test-Path (Join-Path $root 'client\dist\index.html'))) {
    throw "client/dist/index.html not found. Run 'npm run build' first."
}

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$filesToCopy = @('server.ts', 'package.json', 'package-lock.json', 'tsconfig.json')
$dirsToCopy = @('middleware', 'routes', 'utility_function')

foreach ($file in $filesToCopy) {
    Copy-Item (Join-Path $root $file) -Destination $staging
}

foreach ($dir in $dirsToCopy) {
    Copy-Item (Join-Path $root $dir) -Destination (Join-Path $staging $dir) -Recurse
    Get-ChildItem (Join-Path $staging $dir) -Recurse -Include '*.test.ts', '__fixtures__' |
        Remove-Item -Recurse -Force
}

$clientDistDest = Join-Path $staging 'client\dist'
New-Item -ItemType Directory -Path $clientDistDest -Force | Out-Null
Copy-Item (Join-Path $root 'client\dist\*') -Destination $clientDistDest -Recurse

if (Test-Path $outZip) { Remove-Item $outZip -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $outZip

Remove-Item $staging -Recurse -Force

Write-Host "Created $outZip"

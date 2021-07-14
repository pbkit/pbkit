$tag = $ENV:TAG

$tag = $tag -split "v"
$tag = $tag[1]

$vdprojContent = Get-Content -path "pollapo-windows-installer.vdproj" -Raw
$newVdprojContent = $vdprojContent -replace ('"ProductVersion" = "8:[0-9]+\.[0-9]+\.[0-9]+"'), ('"ProductVersion" = "8:' + $tag + '"')
$newVdprojContent = $newVdprojContent -replace ('"ARPHELPTELEPHONE" = "8:[0-9]+\.[0-9]+\.[0-9]+"'), ('"ARPHELPTELEPHONE" = "8:' + $tag + '"')

$guid1 = [System.Guid]::NewGuid().toString().ToUpper()
$guid2 = [System.Guid]::NewGuid().toString().ToUpper()
$newVdprojContent = $newVdprojContent -replace ('"ProductCode" = "8:\{[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\}"'), ('"ProductCode" = "8:{' + $guid1 + '}"')
$newVdprojContent = $newVdprojContent -replace ('"PackageCode" = "8:\{[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\}"'), ('"PackageCode" = "8:{' + $guid2 + '}"')
Set-Content -path "pollapo-windows-installer.vdproj" -Value $newVdprojContent

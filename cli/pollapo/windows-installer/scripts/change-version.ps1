$tag = $ENV:TAG

$tag = $tag -split "v"
$tag = $tag[1]

$vdprojContent = Get-Content -path "pollapo-windows-installer.vdproj" -Raw
$newVdprojContent = $vdprojContent -replace ('"ProductVersion" = "8:[0-9]+\.[0-9]+\.[0-9]+"'), ('"ProductVersion" = "8:' + $tag + '"')
Set-Content -path "pollapo-windows-installer.vdproj" -Value $newVdprojContent

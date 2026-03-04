$src = "d:\PROJECT\KUTE\loca_clean_app\frontend\dist\img"
$dest = "d:\PROJECT\KUTE\loca_clean_app\frontend\public\img"

Copy-Item "$src\herolokacleanutama.png" -Destination $dest -Force
Copy-Item "$src\3ruangan.png" -Destination $dest -Force
Copy-Item "$src\kamartidur.png" -Destination $dest -Force
Copy-Item "$src\rumahbaru.png" -Destination $dest -Force
Copy-Item "$src\kamarmandi.png" -Destination $dest -Force

Write-Host "Images copied successfully"
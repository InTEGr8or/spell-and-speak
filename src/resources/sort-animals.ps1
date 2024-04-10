# Read JSON content from a file
Push-Location "D:\T3\Projects\self\spell-and-speak\src\resources"
$filePath = 'animals.json'
$jsonContent = Get-Content -Path "$filePath" -Raw

# Rest of the process is the same as above
$jsonObject = $jsonContent | ConvertFrom-Json
$sorted = $jsonObject | Sort-Object { $_.name.Length }
$sorted | ConvertTo-Json | Set-Content -Path $filePath
Pop-Location
$winmd = 'C:\Windows\System32\WinMetadata\Windows.Media.Ocr.winmd'
$winmdGen = 'C:\Windows\System32\WinMetadata\Windows.Foundation.winmd'
$winmdImg = 'C:\Windows\System32\WinMetadata\Windows.Graphics.winmd'
$winmdStore = 'C:\Windows\System32\WinMetadata\Windows.Storage.winmd'
$winmdGlob = 'C:\Windows\System32\WinMetadata\Windows.Globalization.winmd'
$sysRuntime = [System.IO.Path]::Combine([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory(), 'System.Runtime.WindowsRuntime.dll')

Add-Type -Path 'scripts\WinOcr.cs' -ReferencedAssemblies @($winmd, $winmdGen, $winmdImg, $winmdStore, $winmdGlob, $sysRuntime, 'System.Runtime.dll')
$ocrText = [WinOcr]::Recognize('temp_inspect\full_page_2.png')
Write-Host "RECOGNIZED LENGTH: " $ocrText.Length
Write-Host "FIRST 500 CHARACTERS:"
Write-Host $ocrText.Substring(0, [Math]::Min(500, $ocrText.Length))

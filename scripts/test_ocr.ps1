[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$filePath = (Resolve-Path "temp_inspect/full_page_2.png").Path
$file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($filePath).GetAwaiter().GetResult()
$stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
$decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
$bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("pt-BR"))
$ocrResult = $engine.RecognizeAsync($bitmap).GetAwaiter().GetResult()

Write-Host "Lines detected: " $ocrResult.Lines.Count
foreach ($line in $ocrResult.Lines | Select-Object -First 30) {
    Write-Host $line.Text
}

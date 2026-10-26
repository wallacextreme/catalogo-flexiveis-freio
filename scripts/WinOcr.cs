using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;
using Windows.Storage;

public class WinOcr {
    public static void Main(string[] args) {
        if (args.Length == 0) {
            Console.WriteLine("Usage: WinOcr <image_path>");
            return;
        }
        try {
            RecognizeAsync(args[0]).GetAwaiter().GetResult();
        } catch (Exception ex) {
            Console.Error.WriteLine("Error: " + ex.Message);
        }
    }

    private static async Task RecognizeAsync(string filePath) {
        StorageFile file = await WindowsRuntimeSystemExtensions.AsTask(StorageFile.GetFileFromPathAsync(Path.GetFullPath(filePath)));
        using (var stream = await WindowsRuntimeSystemExtensions.AsTask(file.OpenAsync(FileAccessMode.Read))) {
            var decoder = await WindowsRuntimeSystemExtensions.AsTask(BitmapDecoder.CreateAsync(stream));
            var bitmap = await WindowsRuntimeSystemExtensions.AsTask(decoder.GetSoftwareBitmapAsync());
            var engine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (engine == null) {
                engine = OcrEngine.TryCreateFromLanguage(new Windows.Globalization.Language("pt-BR"));
            }
            var result = await WindowsRuntimeSystemExtensions.AsTask(engine.RecognizeAsync(bitmap));
            foreach (var line in result.Lines) {
                Console.WriteLine(line.Text);
            }
        }
    }
}

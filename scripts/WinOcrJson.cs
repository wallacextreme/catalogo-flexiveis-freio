using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;
using Windows.Storage;

public class WinOcrJson {
    public static void Main(string[] args) {
        if (args.Length == 0) {
            Console.WriteLine("Usage: WinOcrJson <image_path>");
            return;
        }
        try {
            Console.OutputEncoding = Encoding.UTF8;
            RecognizeJsonAsync(args[0]).GetAwaiter().GetResult();
        } catch (Exception ex) {
            Console.Error.WriteLine("Error: " + ex.Message);
        }
    }

    private static async Task RecognizeJsonAsync(string filePath) {
        StorageFile file = await WindowsRuntimeSystemExtensions.AsTask(StorageFile.GetFileFromPathAsync(Path.GetFullPath(filePath)));
        using (var stream = await WindowsRuntimeSystemExtensions.AsTask(file.OpenAsync(FileAccessMode.Read))) {
            var decoder = await WindowsRuntimeSystemExtensions.AsTask(BitmapDecoder.CreateAsync(stream));
            var bitmap = await WindowsRuntimeSystemExtensions.AsTask(decoder.GetSoftwareBitmapAsync());
            var engine = OcrEngine.TryCreateFromUserProfileLanguages();
            if (engine == null) {
                engine = OcrEngine.TryCreateFromLanguage(new Windows.Globalization.Language("pt-BR"));
            }
            var result = await WindowsRuntimeSystemExtensions.AsTask(engine.RecognizeAsync(bitmap));
            
            StringBuilder sb = new StringBuilder();
            sb.Append("[");
            bool first = true;
            foreach (var line in result.Lines) {
                if (!first) sb.Append(",");
                first = false;
                
                // Escape json string
                string escapedText = line.Text.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
                
                // Calculate bounding box for line by unioning word rects or using line bounds
                double minX = double.MaxValue, minY = double.MaxValue, maxX = 0, maxY = 0;
                foreach (var w in line.Words) {
                    if (w.BoundingRect.X < minX) minX = w.BoundingRect.X;
                    if (w.BoundingRect.Y < minY) minY = w.BoundingRect.Y;
                    double r = w.BoundingRect.X + w.BoundingRect.Width;
                    double b = w.BoundingRect.Y + w.BoundingRect.Height;
                    if (r > maxX) maxX = r;
                    if (b > maxY) maxY = b;
                }
                
                sb.Append("{\"text\":\"").Append(escapedText).Append("\",")
                  .Append("\"x\":").Append(minX.ToString(System.Globalization.CultureInfo.InvariantCulture)).Append(",")
                  .Append("\"y\":").Append(minY.ToString(System.Globalization.CultureInfo.InvariantCulture)).Append(",")
                  .Append("\"w\":").Append((maxX - minX).ToString(System.Globalization.CultureInfo.InvariantCulture)).Append(",")
                  .Append("\"h\":").Append((maxY - minY).ToString(System.Globalization.CultureInfo.InvariantCulture)).Append("}");
            }
            sb.Append("]");
            Console.WriteLine(sb.ToString());
        }
    }
}

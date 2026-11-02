using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace JobBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        private static readonly string[] DocumentExtensions = { ".pdf", ".doc", ".docx" };
        private const long MaxDocumentSize = 5 * 1024 * 1024; // 5 MB

        [HttpPost("pdf")]
        public Task<IActionResult> UploadPdf(IFormFile file) =>
            SaveUpload(file, new[] { ".pdf" }, "Only PDF files are allowed.");

        [HttpPost("document")]
        [RequestSizeLimit(MaxDocumentSize + 1024 * 1024)]
        public Task<IActionResult> UploadDocument(IFormFile file) =>
            SaveUpload(file, DocumentExtensions, "Only PDF, DOC or DOCX files are allowed.");

        private async Task<IActionResult> SaveUpload(IFormFile file, string[] allowedExtensions, string invalidTypeMessage)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "No file uploaded." });
            }

            if (file.Length > MaxDocumentSize)
            {
                return BadRequest(new { Message = "File is too large. Maximum size is 5 MB." });
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (Array.IndexOf(allowedExtensions, extension) < 0)
            {
                return BadRequest(new { Message = invalidTypeMessage });
            }

            // Ensure wwwroot/uploads directory exists
            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }
            
            var uploadsDir = Path.Combine(webRoot, "uploads");
            if (!Directory.Exists(uploadsDir))
            {
                Directory.CreateDirectory(uploadsDir);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
            var filePath = Path.Combine(uploadsDir, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Construct full public URL to access the static file
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
            var fileUrl = $"{baseUrl}/uploads/{uniqueFileName}";

            return Ok(new { Url = fileUrl });
        }
    }
}

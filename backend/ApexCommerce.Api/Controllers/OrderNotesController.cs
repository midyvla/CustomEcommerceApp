using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using ApexCommerce.Api.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderNotesController : ControllerBase
    {
        private readonly AppDbContext _context;
        // Mocking user profile tracking context layer. In production, pull straight from HttpContext.User.Identity
        private const string CurrentAdminUser = "Admin_Vladimir";

        public OrderNotesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ordernotes/order/5
        [HttpGet("order/{orderId}")]
        public async Task<IActionResult> GetNotesForOrder(int orderId)
        {
            var notes = await _context.OrderNotes
                .Where(n => n.OrderId == orderId)
                .OrderByDescending(n => n.CreatedUtc)
                .ToListAsync();

            return Ok(notes);
        }

        // POST: api/ordernotes
        [HttpPost]
        public async Task<IActionResult> CreateNote([FromBody] CreateNoteDto dto)
        {
            var order = await _context.Orders.FindAsync(dto.OrderId);
            if (order == null) return NotFound(new { error = "Target order reference missing." });

            var note = new OrderNote
            {
                OrderId = dto.OrderId,
                OrderNumber = order.OrderNumber,
                ContentHtml = dto.ContentHtml,
                CreatedByAdmin = dto.IsSystemLog ? "SYSTEM_AUTOMATION" : CurrentAdminUser,
                CreatedUtc = DateTime.UtcNow,
                IsSystemLog = dto.IsSystemLog
            };

            _context.OrderNotes.Add(note);
            await _context.SaveChangesAsync();
            return Ok(note);
        }

        // PUT: api/ordernotes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateNoteDto dto)
        {
            var note = await _context.OrderNotes.FindAsync(id);
            if (note == null) return NotFound();

            // Strict Ownership Wall Validation Check
            if (note.CreatedByAdmin != CurrentAdminUser)
            {
                return StatusCode(403, new { error = "Security Breach Access Denied: You do not own authorization credentials to modify this file note record." });
            }

            note.ContentHtml = dto.ContentHtml;
            note.LastUpdatedUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(note);
        }

        // DELETE: api/ordernotes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var note = await _context.OrderNotes.FindAsync(id);
            if (note == null) return NotFound();

            // Strict Ownership Wall Validation Check
            if (note.CreatedByAdmin != CurrentAdminUser)
            {
                return StatusCode(403, new { error = "Security Breach Access Denied: Only the original note author holds permission to remove this file record entry." });
            }

            _context.OrderNotes.Remove(note);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Note record purged cleanly." });
        }
    }

    public class CreateNoteDto { public int OrderId { get; set; } public string ContentHtml { get; set; } = string.Empty; public bool IsSystemLog { get; set; } }
    public class UpdateNoteDto { public string ContentHtml { get; set; } = string.Empty; }
}
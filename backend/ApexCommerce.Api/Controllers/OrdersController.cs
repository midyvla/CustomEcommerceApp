using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using ApexCommerce.Api.Models;
using ApexCommerce.Api.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public OrdersController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders.Include(o => o.OrderItems).OrderByDescending(o => o.CreatedUtc).ToListAsync();
            return Ok(orders);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status)) return BadRequest(new { error = "Status required." });

            var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound(new { error = "Order missing." });

            string current = order.OrderStatus;
            string target = dto.Status;

            if (current == target) return Ok(new { success = true, message = "No change." });

            bool isValidTransition = (current == "Pending" && target == "Shipped") ||
                                     (current == "Shipped" && target == "Completed") ||
                                     (current == "Pending" && target == "Completed");

            if (!isValidTransition) return BadRequest(new { error = "Invalid workflow progression direction." });

            order.OrderStatus = target;
            await _context.SaveChangesAsync();

            // ⚡ AUTOMATED MILESTONE DISPATCH TRANSITION GATE
            // Automatically fire shipping notices with tracking numbers when flipped to Shipped
            if (target == "Shipped")
            {
                string trackingNumber = $"APX-{Guid.NewGuid().ToString()[..8].ToUpper()}-USPS";
                _ = _emailService.SendOrderShippedEmailAsync(order.CustomerEmail, order.OrderNumber, trackingNumber);
            }

            return Ok(new { success = true, message = $"Order status advanced to '{target}'." });
        }
    }

    public class StatusUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
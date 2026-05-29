using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            // Eagerly load (.Include) child OrderItems to prevent N+1 query execution penalties
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreatedUtc)
                .ToListAsync();

            return Ok(orders);
        }

        // PUT: api/orders/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
                return BadRequest(new { error = "An explicit lifecycle status state must be provided." });

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound(new { error = $"Order ID {id} does not exist inside system logs." });

            // --- STRATEGIC BUSINESS WORKFLOW TRANSITION RULES ---
            string current = order.OrderStatus;
            string target = dto.Status;

            if (current == target) return Ok(new { success = true, message = "Status remains unchanged." });

            // Prevent bypassing business steps or illegal backwards state degradation updates
            bool isValidTransition = (current == "Pending" && target == "Shipped") ||
                                     (current == "Shipped" && target == "Completed") ||
                                     (current == "Pending" && target == "Completed"); // Express bypass route Allowed

            if (!isValidTransition)
            {
                return BadRequest(new
                {
                    error = $"Invalid workflow transition. Cannot move order status directly from '{current}' to '{target}'."
                });
            }

            // Apply the verified status modification safely
            order.OrderStatus = target;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Order updated from '{current}' to '{target}'." });
        }

        // Inline request body helper definition contract
        public class StatusUpdateDto
        {
            public string Status { get; set; } = string.Empty;
        }


    }
}
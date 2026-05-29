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
            {
                return BadRequest(new { error = "An explicit lifecycle status state must be provided." });
            }

            // Validate that the requested status conforms to system boundaries
            var validStatuses = new[] { "Pending", "Shipped", "Completed" };
            if (!validStatuses.Contains(dto.Status))
            {
                return BadRequest(new { error = $"Status value '{dto.Status}' is invalid." });
            }

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { error = $"Order ID {id} does not exist inside system logs." });
            }

            // Apply the update
            order.OrderStatus = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Order status advanced to '{dto.Status}' successfully." });
        }

        // Inline request body helper definition contract
        public class StatusUpdateDto
        {
            public string Status { get; set; } = string.Empty;
        }


    }
}
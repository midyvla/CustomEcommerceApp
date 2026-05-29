using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using ApexCommerce.Api.Models;
using ApexCommerce.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class CheckoutController : ControllerBase
	{
		private readonly AppDbContext _context;

		public CheckoutController(AppDbContext context)
		{
			_context = context;
		}

		[HttpPost]
		public async Task<IActionResult> ProcessCheckout([FromBody] CheckoutRequestDto request)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			// 1. Open a clean execution transaction boundary across our Docker SQL instance
			using var transaction = await _context.Database.BeginTransactionAsync();

			try
			{
				// 2. Hydrate and validate the primary product entity
				// Note: Utilizing raw SQL compatibility tables or EF tables depending on context
				// For safety in this endpoint, we'll fetch prices dynamically to protect against client-side tampering.

				// Let's create a temporary mock lookup validation to calculate baseline financial metrics safely
				// In production, you will fetch these fields straight from your database tracking tables
				decimal basePrice = 49.99m;
				var lineItemsToPersist = new List<OrderItem>();

				// Add the main massager line item configuration
				lineItemsToPersist.Add(new OrderItem
				{
					ProductId = request.BaseProductId,
					ProductName = "3D Electric Smart Scalp Massager",
					UnitPrice = basePrice,
					Quantity = 1,
					IsAddon = false
				});

				decimal subtotal = basePrice;

				// 3. Process companion bundle addons if checked
				if (request.SelectedAddonProductIds != null && request.SelectedAddonProductIds.Any())
				{
					foreach (var addonId in request.SelectedAddonProductIds)
					{
						decimal addonPrice = 0m;
						string addonName = "";

						if (addonId == 2) { addonPrice = 19.99m; addonName = "Organic Rosemary & Biotin Growth Serum"; }
						else if (addonId == 3) { addonPrice = 16.14m; addonName = "Premium Jojoba Detoxifying Scalp Oil"; }
						else { return BadRequest(new { error = $"Requested addon item ID {addonId} is invalid or out of stock." }); }

						subtotal += addonPrice;
						lineItemsToPersist.Add(new OrderItem
						{
							ProductId = addonId,
							ProductName = addonName,
							UnitPrice = addonPrice,
							Quantity = 1,
							IsAddon = true
						});
					}
				}

				// 4. Calculate fixed financial rates
				decimal tax = Math.Round(subtotal * 0.0625m, 2); // Standard Massachusetts tax bounds (6.25%)
				decimal shipping = subtotal >= 75.00m ? 0.00m : 5.99m; // Free shipping threshold promotion
				decimal total = subtotal + tax + shipping;

				// 5. Generate a unique, recognizable invoice token tracking format
				string customOrderNumber = $"APEX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

				// 6. Build and stage the parent Order model instance
				var order = new Order
				{
					OrderNumber = customOrderNumber,
					CustomerEmail = request.CustomerEmail,
					Subtotal = subtotal,
					Tax = tax,
					Shipping = shipping,
					Total = total,
					OrderStatus = "Pending",
					CreatedUtc = DateTime.UtcNow,
					OrderItems = lineItemsToPersist
				};

				// 7. Persist context data blocks right to SQL Server inside Docker container memory
				_context.Orders.Add(order);
				await _context.SaveChangesAsync();

				// Commit the execution loop safely
				await transaction.CommitAsync();

				return Ok(new
				{
					success = true,
					message = "Transaction authorized and logged securely.",
					orderNumber = order.OrderNumber,
					totalCharged = order.Total
				});
			}
			catch (Exception ex)
			{
				// Roll back database changes if the connection dropped or validation timed out
				await transaction.RollbackAsync();
				return StatusCode(500, new { error = "Internal transactional processing error occurred.", details = ex.Message });
			}
		}
	}
}
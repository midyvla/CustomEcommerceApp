using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using ApexCommerce.Api.Models;
using ApexCommerce.Api.DTOs;
using ApexCommerce.Api.Services; // Ensure your services namespace is included
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
        private readonly IPaymentGatewayService _paymentService;

        // One single unified constructor injecting both infrastructure dependencies
        public CheckoutController(AppDbContext context, IPaymentGatewayService paymentService)
        {
            _context = context;
            _paymentService = paymentService;
        }

        [HttpPost]
        public async Task<IActionResult> ProcessCheckout([FromBody] CheckoutRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // 1. Calculate base items pricing layout dynamically first to establish our financial totals
                decimal basePrice = 49.99m;
                var lineItemsToPersist = new List<OrderItem>();

                lineItemsToPersist.Add(new OrderItem
                {
                    ProductId = request.BaseProductId,
                    ProductName = "3D Electric Smart Scalp Massager",
                    UnitPrice = basePrice,
                    Quantity = 1,
                    IsAddon = false
                });

                decimal subtotal = basePrice;

                // Process companion bundle addons if checked
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

                // Calculate total pricing baseline metrics
                decimal tax = Math.Round(subtotal * 0.0625m, 2); // 6.25% Massachusetts rate
                decimal shipping = subtotal >= 75.00m ? 0.00m : 5.99m;
                decimal total = subtotal + tax + shipping;

                // 2. DISPATCH PAYMENT GATEWAY AUTH LOOP
                // We run this BEFORE creating database records to protect stock tables from failed payments
                var paymentResult = await _paymentService.ProcessAuthorizationAsync(request.CustomerEmail, total);
                if (!paymentResult.IsSuccess)
                {
                    return BadRequest(new { error = paymentResult.ErrorMessage });
                }

                // 3. Open database transaction boundary across our Docker SQL instance
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    string customOrderNumber = $"APEX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

                    // Build and stage the parent Order record
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

                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();

                    // Safely commit database changes upon banking confirmation
                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        success = true,
                        message = "Transaction authorized and logged securely.",
                        orderNumber = order.OrderNumber,
                        totalCharged = order.Total,
                        transactionReference = paymentResult.TransactionReference
                    });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw; // Re-throw to hit our main controller fallback trap
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal transactional processing error occurred.", details = ex.Message });
            }
        }
    }
}
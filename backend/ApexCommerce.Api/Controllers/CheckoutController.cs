using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApexCommerce.Api.Data;
using ApexCommerce.Api.Models;
using ApexCommerce.Api.DTOs;
using ApexCommerce.Api.Services;
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
        private readonly IEmailService _emailService;

        public CheckoutController(AppDbContext context, IPaymentGatewayService paymentService, IEmailService emailService)
        {
            _context = context;
            _paymentService = paymentService;
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<IActionResult> ProcessCheckout([FromBody] CheckoutRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
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

                if (request.SelectedAddonProductIds != null && request.SelectedAddonProductIds.Any())
                {
                    foreach (var addonId in request.SelectedAddonProductIds)
                    {
                        decimal addonPrice = 0m;
                        string addonName = "";

                        if (addonId == 2) { addonPrice = 19.99m; addonName = "Organic Rosemary & Biotin Growth Serum"; }
                        else if (addonId == 3) { addonPrice = 16.14m; addonName = "Premium Jojoba Detoxifying Scalp Oil"; }
                        else { return BadRequest(new { error = $"Addon ID {addonId} invalid." }); }

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

                decimal tax = Math.Round(subtotal * 0.0625m, 2);
                decimal shipping = subtotal >= 75.00m ? 0.00m : 5.99m;
                decimal total = subtotal + tax + shipping;

                // 1. Process Bank Card Authorization
                var paymentResult = await _paymentService.ProcessAuthorizationAsync(request.CustomerEmail, total);
                if (!paymentResult.IsSuccess) return BadRequest(new { error = paymentResult.ErrorMessage });

                // 2. Commit safely within our Docker atomic execution transaction loop
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    string customOrderNumber = $"APEX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

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
                    await transaction.CommitAsync();

                    // 3. BACKGROUND NOTIFICATION DISPATCH FIRE-AND-FORGET LOOPS
                    // Fire automated milestones updates without blocking user confirmation speeds
                    _ = _emailService.SendOrderPlacedEmailAsync(order.CustomerEmail, order.OrderNumber, order.Total);
                    _ = _emailService.SendPaymentSettledEmailAsync(order.CustomerEmail, order.OrderNumber, paymentResult.TransactionReference);


                    
                    var systemLogNote = new OrderNote
                    {
                        OrderId = order.OrderId,
                        OrderNumber = order.OrderNumber,
                        ContentHtml = $"<p><strong>Automated Mail Triggered Successfully:</strong> Customer notification invoice dispatched tracking receipt reference {order.OrderNumber} total amount settled ${order.Total}.</p>",
                        CreatedByAdmin = "SYSTEM_AUTOMATION",
                        CreatedUtc = DateTime.UtcNow,
                        IsSystemLog = true
                    };
                    _context.OrderNotes.Add(systemLogNote);
                    await _context.SaveChangesAsync();


                    return Ok(new
                    {
                        success = true,
                        orderNumber = order.OrderNumber,
                        totalCharged = order.Total
                    });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal error.", details = ex.Message });
            }
        }
    }
}
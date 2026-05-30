using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Services
{
    public class MockEmailService : IEmailService
    {
        public async Task SendOrderPlacedEmailAsync(string email, string orderNumber, decimal total)
        {
            await Task.Delay(100); // Simulate background worker dispatch
            Debug.WriteLine($"[EMAIL INCOMING] To: {email} | Subject: Thank You For Your Purchase - {orderNumber}");
            Debug.WriteLine($"Body: Hi! Your transaction was captured. Order Ref: {orderNumber}. Total Charged: ${total}.");
        }

        public async Task SendPaymentSettledEmailAsync(string email, string orderNumber, string txnRef)
        {
            await Task.Delay(100);
            Debug.WriteLine($"[EMAIL INCOMING] To: {email} | Subject: Payment Settled Safely for Order {orderNumber}");
            Debug.WriteLine($"Body: Banking clearing cleared! Transaction Hash Token: {txnRef}. Your order is now heading to fulfillment scaling.");
        }

        public async Task SendOrderShippedEmailAsync(string email, string orderNumber, string trackingNumber)
        {
            await Task.Delay(100);
            Debug.WriteLine($"[EMAIL INCOMING] To: {email} | Subject: Your Apex Package Has Shipped! - {orderNumber}");
            Debug.WriteLine($"Body: Tracking assigned: {trackingNumber}. Monitored via USPS Priority Mail dispatch nodes.");
        }
    }
}
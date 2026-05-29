using System;
using System.Threading.Tasks;

namespace ApexCommerce.Api.Services
{
    public class MockPaymentGatewayService : IPaymentGatewayService
    {
        public async Task<PaymentGatewayResult> ProcessAuthorizationAsync(string email, decimal amount)
        {
            // Simulate networking transit delay over external banking switches
            await Task.Delay(400);

            // Mock fraud mitigation rule: Flag arbitrary testing simulator addresses
            if (email.Contains("fraud", StringComparison.OrdinalIgnoreCase))
            {
                return new PaymentGatewayResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Transaction declined: High-risk assessment velocity score triggered."
                };
            }

            // Normal processing flow simulation
            return new PaymentGatewayResult
            {
                IsSuccess = true,
                TransactionReference = $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}"
            };
        }
    }
}
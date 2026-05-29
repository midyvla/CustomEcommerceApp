using System.Threading.Tasks;

namespace ApexCommerce.Api.Services
{
    public interface IPaymentGatewayService
    {
        Task<PaymentGatewayResult> ProcessAuthorizationAsync(string email, decimal amount);
    }

    public class PaymentGatewayResult
    {
        public bool IsSuccess { get; set; }
        public string TransactionReference { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
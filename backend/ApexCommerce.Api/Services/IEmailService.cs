using System.Threading.Tasks;

namespace ApexCommerce.Api.Services
{
    public interface IEmailService
    {
        Task SendOrderPlacedEmailAsync(string email, string orderNumber, decimal total);
        Task SendPaymentSettledEmailAsync(string email, string orderNumber, string txnRef);
        Task SendOrderShippedEmailAsync(string email, string orderNumber, string trackingNumber);
    }
}
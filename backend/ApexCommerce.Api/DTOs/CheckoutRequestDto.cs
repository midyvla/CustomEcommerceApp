using System.ComponentModel.DataAnnotations;

namespace ApexCommerce.Api.DTOs
{
    /// <summary>
    /// Represents the payload sent from the React client when a user submits their bundle bag.
    /// </summary>
    public class CheckoutRequestDto
    {
        [Required(ErrorMessage = "Customer email address is mandatory.")]
        [EmailAddress(ErrorMessage = "Invalid email address formatting detected.")]
        public string CustomerEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Main base product identification is required.")]
        public int BaseProductId { get; set; }

        /// <summary>
        /// Collection of high-margin cross-sell addon item product IDs chosen during transaction configuration.
        /// </summary>
        public List<int> SelectedAddonProductIds { get; set; } = new();
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ApexCommerce.Api.Models
{
    [Table("OrderItems", Schema = "dbo")]
    public class OrderItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderItemId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [MaxLength(256)]
        public string ProductName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public bool IsAddon { get; set; }

        // Navigation Property back to the parent Order metadata layer
        // JsonIgnore prevents deep object nesting serialization loops during API serialization
        [ForeignKey(nameof(OrderId))]
        [JsonIgnore]
        public Order? Order { get; set; }
    }
}
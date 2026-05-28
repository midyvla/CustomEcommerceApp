namespace ApexCommerce.Api.DTOs
{
    public class ProductDetailDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public string? Description { get; set; }
        public int StockQuantity { get; set; }
        public List<CrossSellItemDto> CrossSells { get; set; } = new();
    }

    public class CrossSellItemDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal BundlePrice => OriginalPrice * (1 - (DiscountPercentage / 100));
    }
}
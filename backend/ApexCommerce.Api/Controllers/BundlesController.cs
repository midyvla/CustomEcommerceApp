using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using ApexCommerce.Api.DTOs;

namespace ApexCommerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BundlesController : ControllerBase
    {
        private readonly string _connectionString;

        // Dependency injection pulls the connection string directly from appsettings.json
        public BundlesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Database connection string missing.");
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetProductBundle(int productId)
        {
            ProductDetailDto? productDetail = null;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // 1. Fetch Primary Product and Current Inventory Levels in one read
                string mainProductQuery = @"
                    SELECT p.ProductID, p.Name, p.SKU, p.BasePrice, p.Description, ISNULL(i.StockQuantity, 0) AS StockQuantity
                    FROM Products p
                    LEFT JOIN Inventory i ON p.ProductID = i.ProductID
                    WHERE p.ProductID = @ProductId;";

                using (var cmd = new SqlCommand(mainProductQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ProductId", productId);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            productDetail = new ProductDetailDto
                            {
                                ProductId = (int)reader["ProductID"],
                                Name = reader["Name"].ToString() ?? string.Empty,
                                SKU = reader["SKU"].ToString() ?? string.Empty,
                                BasePrice = (decimal)reader["BasePrice"],
                                Description = reader["Description"]?.ToString(),
                                StockQuantity = (int)reader["StockQuantity"]
                            };
                        }
                    }
                }

                // If the primary product (e.g., Scalp Massager) doesn't exist, gracefully stop
                if (productDetail == null)
                {
                    return NotFound(new { Message = $"Product with ID {productId} not found." });
                }

                // 2. Fetch Active High-Margin Cross-Sells mapped to this item
                string crossSellQuery = @"
                    SELECT p.ProductID, p.Name, p.BasePrice, cs.DiscountPercentage
                    FROM ProductCrossSells cs
                    JOIN Products p ON cs.SuggestedProductID = p.ProductID
                    WHERE cs.ParentProductID = @ProductId AND cs.IsActive = 1;";

                using (var cmd = new SqlCommand(crossSellQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ProductId", productId);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            productDetail.CrossSells.Add(new CrossSellItemDto
                            {
                                ProductId = (int)reader["ProductID"],
                                Name = reader["Name"].ToString() ?? string.Empty,
                                OriginalPrice = (decimal)reader["BasePrice"],
                                DiscountPercentage = (decimal)reader["DiscountPercentage"]
                            });
                        }
                    }
                }
            }

            // Return clean JSON structure to the client with an HTTP 200 OK
            return Ok(productDetail);
        }
    }
}
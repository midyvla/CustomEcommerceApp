using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders; // <-- ADD THIS TO BE ABSOLUTELY SURE
using ApexCommerce.Api.Models;

namespace ApexCommerce.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(e => e.CustomerEmail)
                      .HasDatabaseName("IX_Orders_CustomerEmail"); // <-- Kept as HasDatabaseName

                entity.HasIndex(e => e.OrderNumber)
                      .IsUnique()
                      .HasDatabaseName("UQ_Orders_OrderNumber");
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasIndex(e => e.OrderId)
                      .HasDatabaseName("IX_OrderItems_OrderId");
            });
        }
    }
}
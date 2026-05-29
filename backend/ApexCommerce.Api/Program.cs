using Microsoft.EntityFrameworkCore; // <-- Confirm this is at line 1!

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Services (Dependency Injection Container)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure SQL Server context target using the explicitly imported EF Core extensions
builder.Services.AddDbContext<ApexCommerce.Api.Data.AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// 2. Configure the HTTP Request Pipeline (Middleware Assembly Line)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// CRITICAL: CORS must run first thing in the pipeline to authorize cross-origin browser headers
app.UseCors("AllowReactApp");

// Commented out to prevent the local port redirection warnings we saw earlier
// app.UseHttpsRedirection(); 

app.UseAuthorization();

app.MapControllers();

app.Run();
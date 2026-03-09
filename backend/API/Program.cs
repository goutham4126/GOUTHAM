using API.Exceptions;
using Application.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Application.Services;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using API.Hubs;

namespace API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("dbURL")
                ));
            builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
                });
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IPasswordService, PasswordService>();
            builder.Services.AddScoped<IJwtService, JwtService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IPlanRepository, PlanRepository>();
            builder.Services.AddScoped<IPolicyRepository, PolicyRepository>();
            builder.Services.AddScoped<IPolicyRequestRepository, PolicyRequestRepository>();
            builder.Services.AddScoped<IPolicyPaymentRepository, PolicyPaymentRepository>();
            builder.Services.AddScoped<IClaimRepository, ClaimRepository>();
            builder.Services.AddScoped<IPlanService, PlanService>();
            builder.Services.AddScoped<IPolicyService, PolicyService>();
            builder.Services.AddScoped<IPolicyRequestService, PolicyRequestService>();
            builder.Services.AddScoped<IClaimService, ClaimService>();

            builder.Services.AddHttpClient<IVercelBlobService, VercelBlobService>();
            builder.Services.AddHttpClient<IWebhookNotificationService, WebhookNotificationService>();
            builder.Services.AddScoped<IInvoiceGeneratorService, InvoiceGeneratorService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddSignalR();


            var key = Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"]!);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    RoleClaimType = ClaimTypes.Role,
                    NameClaimType = ClaimTypes.NameIdentifier
                };
                
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        
                        if (!string.IsNullOrEmpty(accessToken) && 
                            path.StartsWithSegments("/hubs/notifications"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(e => e.Value?.Errors.Count > 0)
                        .Select(e => new
                        {
                            Field = e.Key,
                            Errors = e.Value!.Errors.Select(x => x.ErrorMessage)
                        });

                    return new BadRequestObjectResult(new
                    {
                        StatusCode = 400,
                        Message = "Validation failed",
                        Errors = errors
                    });
                };
            });

            builder.Services.AddAuthorization();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAngular",
                    policy =>
                    {
                        policy.WithOrigins("http://localhost:4200")
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials(); // Required for SignalR WebSockets
                    });
            });

            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddProblemDetails();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();

                if (!context.Users.Any(u => u.Role == Domain.Enums.UserRole.Admin))
                {
                    context.Users.Add(new Domain.Entities.User
                    {
                        FirstName = "System",
                        LastName = "Admin",
                        Email = "admin@insurance.com",
                        PasswordHash = passwordService.HashPassword("Admin@123!"),
                        Role = Domain.Enums.UserRole.Admin,
                        Address = "System Generated",
                        Phone = "0000000000"
                    });
                    context.SaveChanges();
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowAngular");

            app.UseExceptionHandler();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<API.Hubs.NotificationHub>("/hubs/notifications");

            app.Run();
        }
    }
}
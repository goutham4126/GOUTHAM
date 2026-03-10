using Domain.Entities;
using Microsoft.EntityFrameworkCore;

using Application.Interfaces;

namespace Infrastructure.Data
{
    public class AppDbContext : DbContext, IAppDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Plan> Plans => Set<Plan>();
        public DbSet<Policy> Policies => Set<Policy>();
        public DbSet<PolicyPayment> PolicyPayments => Set<PolicyPayment>();
        public DbSet<Claim> Claims => Set<Claim>();
        public DbSet<ClaimPayment> ClaimPayments => Set<ClaimPayment>();

        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<PolicyRequest> PolicyRequests => Set<PolicyRequest>();


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            ConfigureUser(builder);
            ConfigurePlan(builder);
            ConfigurePolicy(builder);
            ConfigurePolicyPayment(builder);
            ConfigureClaim(builder);
            ConfigureClaimPayment(builder);
            ConfigurePolicyRequest(builder);
        }

        private void ConfigureUser(ModelBuilder builder)
        {
            builder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasQueryFilter(u => !u.IsDeleted);

                entity.HasIndex(u => u.Email)
                      .IsUnique();

                entity.Property(u => u.Role)
                      .HasConversion<string>();

                entity.HasMany(u => u.Policies)
                      .WithOne(p => p.User)
                      .HasForeignKey(p => p.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(u => u.Claims)
                      .WithOne(c => c.User)
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(u => u.Invoices)
                      .WithOne(i => i.User)
                      .HasForeignKey(i => i.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(u => u.Notifications)
                      .WithOne(n => n.User)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigurePlan(ModelBuilder builder)
        {
            builder.Entity<Plan>(entity =>
            {
                entity.ToTable("Plans");

                entity.Property(p => p.PremiumAmount)
                      .HasPrecision(18, 2);

                entity.Property(p => p.CoverageAmount)
                      .HasPrecision(18, 2);

                entity.HasMany(p => p.Policies)
                      .WithOne(p => p.Plan)
                      .HasForeignKey(p => p.PlanId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigurePolicy(ModelBuilder builder)
        {
            builder.Entity<Policy>(entity =>
            {
                entity.ToTable("Policies");

                entity.Property(p => p.TotalPremium)
                      .HasPrecision(18, 2);

                entity.Property(p => p.TotalPaid)
                      .HasPrecision(18, 2);

                entity.Property(p => p.CoverageAmount)
                      .HasPrecision(18, 2);

                entity.Property(p => p.PlanBaseCoverageAmount)
                      .HasPrecision(18, 2);

                entity.Property(p => p.PlanBasePremiumAmount)
                      .HasPrecision(18, 2);

                entity.Property(p => p.Status)
                      .HasConversion<string>();

                entity.Property(p => p.PaymentFrequency)
                      .HasConversion<string>();

                entity.HasMany(p => p.Payments)
                      .WithOne(pp => pp.Policy)
                      .HasForeignKey(pp => pp.PolicyId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(p => p.Claims)
                      .WithOne(c => c.Policy)
                      .HasForeignKey(c => c.PolicyId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Agent)
                      .WithMany()
                      .HasForeignKey(p => p.AgentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigurePolicyPayment(ModelBuilder builder)
        {
            builder.Entity<PolicyPayment>(entity =>
            {
                entity.ToTable("PolicyPayments");

                entity.Property(p => p.Amount)
                      .HasPrecision(18, 2);

                entity.Property(p => p.Status)
                      .HasConversion<string>();
            });
        }

        private void ConfigureClaim(ModelBuilder builder)
        {
            builder.Entity<Claim>(entity =>
            {
                entity.ToTable("Claims", t => t.HasCheckConstraint("CK_Claim_ApprovedAmount", "[ApprovedAmount] <= [ClaimAmount]"));

                entity.Property(c => c.ClaimAmount)
                      .HasPrecision(18, 2);

                entity.Property(c => c.ApprovedAmount)
                      .HasPrecision(18, 2);

                entity.Property(c => c.Status)
                      .HasConversion<string>();

                entity.Property(c => c.VideoVerificationStatus)
                      .HasConversion<string>();

                entity.HasOne(c => c.ClaimPayment)
                      .WithOne(cp => cp.Claim)
                      .HasForeignKey<ClaimPayment>(cp => cp.ClaimId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(c => c.ClaimOfficer)
                      .WithMany()
                      .HasForeignKey(c => c.ClaimOfficerId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureClaimPayment(ModelBuilder builder)
        {
            builder.Entity<ClaimPayment>(entity =>
            {
                entity.ToTable("ClaimPayments");

                entity.Property(c => c.AmountPaid)
                      .HasPrecision(18, 2);
            });
        }

        private void ConfigurePolicyRequest(ModelBuilder builder)
        {
            builder.Entity<PolicyRequest>(entity =>
            {
                entity.ToTable("PolicyRequests");

                entity.Property(p => p.RiskScore)
                      .HasPrecision(18, 2);

                entity.Property(p => p.Status)
                      .HasConversion<string>();

                entity.Property(p => p.PaymentFrequency)
                      .HasConversion<string>();

                entity.HasOne(pr => pr.User)
                      .WithMany()
                      .HasForeignKey(pr => pr.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(pr => pr.Plan)
                      .WithMany()
                      .HasForeignKey(pr => pr.PlanId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(pr => pr.Agent)
                      .WithMany()
                      .HasForeignKey(pr => pr.AgentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
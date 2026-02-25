using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.HasKey(u => u.Id);

                entity.Property(u => u.FirstName)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(u => u.LastName)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(u => u.Email)
                      .IsRequired()
                      .HasMaxLength(150);

                entity.Property(u => u.PasswordHash)
                      .IsRequired();

                entity.Property(u => u.Role)
                      .IsRequired();

                entity.Property(u => u.GovernmentId)
                      .HasMaxLength(50);

                entity.Property(u => u.Phone)
                      .HasMaxLength(20);

                entity.Property(u => u.Address)
                      .HasMaxLength(250);

                entity.HasIndex(u => u.Email)
                      .IsUnique();
            });

        }
    }
}
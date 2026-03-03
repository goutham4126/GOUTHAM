using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Interfaces
{
    public interface IAppDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Plan> Plans { get; }
        DbSet<Policy> Policies { get; }
        DbSet<PolicyPayment> PolicyPayments { get; }
        DbSet<Claim> Claims { get; }
        DbSet<ClaimPayment> ClaimPayments { get; }
        DbSet<Invoice> Invoices { get; }
        DbSet<Notification> Notifications { get; }

        Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}

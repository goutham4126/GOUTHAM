using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IAppDbContext _context;
        private readonly IHubContext<Hub> _hubContext;

        public NotificationService(
            IAppDbContext context, 
            IHubContext<Hub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task SendNotificationAsync(Guid userId, string title, string message)
        {
            var notification = new Notification 
            { 
                UserId = userId, 
                Title = title, 
                Message = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.User(userId.ToString())
                             .SendAsync("ReceiveNotification", notification);
        }
    }
}

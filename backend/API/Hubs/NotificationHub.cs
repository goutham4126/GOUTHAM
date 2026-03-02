using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub<INotificationHubClient>
    {
    }
}

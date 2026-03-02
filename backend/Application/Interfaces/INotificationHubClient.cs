using Domain.Entities;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface INotificationHubClient
    {
        Task ReceiveNotification(Notification notification);
    }
}

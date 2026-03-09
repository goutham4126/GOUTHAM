using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IWebhookNotificationService
    {
        Task SendPolicyPurchaseEmailAsync(string email, string name, string policyName);
    }
}

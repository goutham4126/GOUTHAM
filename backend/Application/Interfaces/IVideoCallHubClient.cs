namespace Application.Interfaces
{
    public interface IVideoCallHubClient
    {
        Task IncomingVideoCall(string claimId, string channelName, string callerName);
        Task CallAccepted(string claimId, string channelName);
        Task CallRejected(string claimId);
        Task CallEnded(string claimId);
    }
}

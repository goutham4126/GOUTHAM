using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Hubs
{
    [Authorize]
    public class VideoCallHub : Hub<IVideoCallHubClient>
    {
        private readonly IAppDbContext _context;

        public VideoCallHub(IAppDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task InitiateCall(string claimId)
        {
            var officerId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (officerId == null) return;

            var claim = await _context.Claims
                .Include(c => c.ClaimOfficer)
                .FirstOrDefaultAsync(c => c.Id == Guid.Parse(claimId));

            if (claim == null || claim.ClaimOfficerId?.ToString() != officerId) return;

            var channelName = $"claim-{claimId}";
            var callerName = claim.ClaimOfficer != null
                ? $"{claim.ClaimOfficer.FirstName} {claim.ClaimOfficer.LastName}"
                : "Claims Officer";

            await Clients.Group(claim.UserId.ToString())
                .IncomingVideoCall(claimId, channelName, callerName);
        }

        public async Task AcceptCall(string claimId)
        {
            var customerId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (customerId == null) return;

            var claim = await _context.Claims
                .FirstOrDefaultAsync(c => c.Id == Guid.Parse(claimId) && c.UserId.ToString() == customerId);

            if (claim?.ClaimOfficerId == null) return;

            var channelName = $"claim-{claimId}";
            await Clients.Group(claim.ClaimOfficerId.ToString()!)
                .CallAccepted(claimId, channelName);
        }

        public async Task RejectCall(string claimId)
        {
            var customerId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (customerId == null) return;

            var claim = await _context.Claims
                .FirstOrDefaultAsync(c => c.Id == Guid.Parse(claimId) && c.UserId.ToString() == customerId);

            if (claim?.ClaimOfficerId == null) return;

            await Clients.Group(claim.ClaimOfficerId.ToString()!)
                .CallRejected(claimId);
        }

        public async Task EndCall(string claimId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return;

            var claim = await _context.Claims
                .FirstOrDefaultAsync(c => c.Id == Guid.Parse(claimId));

            if (claim == null) return;

            // Notify the other party
            var targetUserId = claim.UserId.ToString() == userId
                ? claim.ClaimOfficerId?.ToString()
                : claim.UserId.ToString();

            if (targetUserId != null)
            {
                await Clients.Group(targetUserId).CallEnded(claimId);
            }
        }
    }
}

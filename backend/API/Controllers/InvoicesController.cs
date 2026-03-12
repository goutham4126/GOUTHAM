using Application.DTOs.Insurance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Infrastructure.Data;

namespace API.Controllers;

[ApiController]
[Route("api/invoices")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (id == null)
            throw new UnauthorizedAccessException("Invalid token.");

        return Guid.Parse(id);
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("my")]
    public async Task<IActionResult> MyInvoices()
    {
        var userId = GetUserId();

        var invoices = await _context.Invoices
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var policyIds = invoices.Where(i => i.Type == Domain.Enums.InvoiceType.PolicyPurchase).Select(i => i.ReferenceId).ToList();
        var claimIds = invoices.Where(i => i.Type == Domain.Enums.InvoiceType.ClaimStatus).Select(i => i.ReferenceId).ToList();
        var paymentIds = invoices.Where(i => i.Type == Domain.Enums.InvoiceType.Payment).Select(i => i.ReferenceId).ToList();

        var policies = await _context.Policies.Where(p => policyIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.TotalPremium);
        var claims = await _context.Claims.Where(c => claimIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.ClaimAmount);
        var payments = await _context.PolicyPayments.Where(p => paymentIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Amount);

        var dtos = invoices.Select(i =>
        {
            decimal? amount = null;
            if (i.Type == Domain.Enums.InvoiceType.PolicyPurchase && policies.TryGetValue(i.ReferenceId, out var pAmt))
                amount = pAmt;
            else if (i.Type == Domain.Enums.InvoiceType.ClaimStatus && claims.TryGetValue(i.ReferenceId, out var cAmt))
                amount = cAmt;
            else if (i.Type == Domain.Enums.InvoiceType.Payment && payments.TryGetValue(i.ReferenceId, out var payAmt))
                amount = payAmt;

            return new InvoiceDto(
                i.Id,
                i.ReferenceId.ToString(),
                i.Type.ToString(),
                i.FileUrl,
                i.CreatedAt,
                amount
            );
        }).ToList();

        return Ok(dtos);
    }
}

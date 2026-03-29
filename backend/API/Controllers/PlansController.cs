using Application.Interfaces;
using Application.DTOs.Insurance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController : ControllerBase
{
    private readonly IPlanService _planService;

    public PlansController(IPlanService planService)
    {
        _planService = planService;
    }

    [Authorize(Roles = "Customer,Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var plans = await _planService.GetAllAsync(includeInactive);
        return Ok(plans);
    }

    [Authorize(Roles = "Customer,Admin")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get([FromRoute] Guid id)
    {
        var plan = await _planService.GetByIdAsync(id);
        if (plan == null)
            return NotFound();

        return Ok(plan);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlanDto plan)
    {
        var created = await _planService.CreateAsync(plan);
        return Ok(created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreatePlanDto plan)
    {
        await _planService.UpdateAsync(id, plan);
        return Ok("Plan updated successfully");
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await _planService.DeactivateAsync(id);
        return Ok("Plan deactivated");
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _planService.DeleteAsync(id);
        return Ok("Plan deleted successfully");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/resume")]
    public async Task<IActionResult> Resume(Guid id)
    {
        await _planService.ResumeAsync(id);
        return Ok("Plan reactivated successfully");
    }
}
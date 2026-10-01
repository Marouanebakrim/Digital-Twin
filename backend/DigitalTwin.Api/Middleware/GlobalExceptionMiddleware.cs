using System.Net;
using System.Text.Json;
using DigitalTwin.Domain.Exceptions;
using FluentValidation;

namespace DigitalTwin.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, title, errors) = exception switch
        {
            ValidationException valEx => (
                HttpStatusCode.BadRequest,
                "Validation Error",
                valEx.Errors.Select(e => e.ErrorMessage).ToList()),

            DomainException domEx => (
                HttpStatusCode.BadRequest,
                "Business Rule Violation",
                new List<string> { domEx.Message }),

            KeyNotFoundException knfEx => (
                HttpStatusCode.NotFound,
                "Resource Not Found",
                new List<string> { knfEx.Message }),

            InvalidOperationException invEx => (
                HttpStatusCode.BadRequest,
                "Invalid Operation",
                new List<string> { invEx.Message }),

            _ => (
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                new List<string> { "An unexpected error occurred. Please try again later." })
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status = (int)statusCode,
            title,
            errors,
            timestamp = DateTime.UtcNow
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}

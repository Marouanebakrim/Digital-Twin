using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.ToTable("Alerts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Message)
            .HasMaxLength(1000);

        builder.Property(a => a.Severity)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(a => a.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.AcknowledgedBy)
            .HasMaxLength(100);

        builder.HasOne(a => a.Sensor)
            .WithMany()
            .HasForeignKey(a => a.SensorId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths in SQL Server

        // Indexes for alert filtering & monitoring dashboards
        builder.HasIndex(a => new { a.MachineId, a.IsAcknowledged, a.CreatedAt });
        builder.HasIndex(a => a.CreatedAt);
    }
}

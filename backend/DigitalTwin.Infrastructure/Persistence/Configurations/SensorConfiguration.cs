using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class SensorConfiguration : IEntityTypeConfiguration<Sensor>
{
    public void Configure(EntityTypeBuilder<Sensor> builder)
    {
        builder.ToTable("Sensors");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.Code)
            .IsUnique();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.SensorType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Unit)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasIndex(s => s.MachineId);

        builder.HasMany(s => s.Readings)
            .WithOne(r => r.Sensor)
            .HasForeignKey(r => r.SensorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

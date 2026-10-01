using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class SensorReadingConfiguration : IEntityTypeConfiguration<SensorReading>
{
    public void Configure(EntityTypeBuilder<SensorReading> builder)
    {
        builder.ToTable("SensorReadings");

        builder.HasKey(sr => sr.Id);

        builder.Property(sr => sr.Value)
            .IsRequired();

        builder.Property(sr => sr.Timestamp)
            .IsRequired();

        builder.Property(sr => sr.Quality)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(sr => sr.IsAnomaly)
            .IsRequired();

        // High-performance time-series index
        builder.HasIndex(sr => new { sr.SensorId, sr.Timestamp });

        // Fast filtering of anomalies
        builder.HasIndex(sr => sr.IsAnomaly);
    }
}

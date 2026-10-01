using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class PlantConfiguration : IEntityTypeConfiguration<Plant>
{
    public void Configure(EntityTypeBuilder<Plant> builder)
    {
        builder.ToTable("Plants");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Location)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(500);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.HasMany(p => p.ProductionLines)
            .WithOne(l => l.Plant)
            .HasForeignKey(l => l.PlantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

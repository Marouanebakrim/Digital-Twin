using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class ProductionLineConfiguration : IEntityTypeConfiguration<ProductionLine>
{
    public void Configure(EntityTypeBuilder<ProductionLine> builder)
    {
        builder.ToTable("ProductionLines");

        builder.HasKey(pl => pl.Id);

        builder.Property(pl => pl.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(pl => pl.Description)
            .HasMaxLength(500);

        builder.HasMany(pl => pl.Machines)
            .WithOne(m => m.ProductionLine)
            .HasForeignKey(m => m.ProductionLineId)
            .OnDelete(DeleteBehavior.Restrict); // Avoid broad cascade drops
    }
}

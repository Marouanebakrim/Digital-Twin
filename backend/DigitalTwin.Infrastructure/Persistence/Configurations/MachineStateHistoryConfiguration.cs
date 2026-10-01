using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class MachineStateHistoryConfiguration : IEntityTypeConfiguration<MachineStateHistory>
{
    public void Configure(EntityTypeBuilder<MachineStateHistory> builder)
    {
        builder.ToTable("MachineStateHistory");

        builder.HasKey(sh => sh.Id);

        builder.Property(sh => sh.PreviousStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(sh => sh.NewStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(sh => sh.Reason)
            .HasMaxLength(500);

        builder.Property(sh => sh.ChangedAt)
            .IsRequired();

        builder.HasIndex(sh => new { sh.MachineId, sh.ChangedAt });
    }
}

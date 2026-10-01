using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class MachineConfiguration : IEntityTypeConfiguration<Machine>
{
    public void Configure(EntityTypeBuilder<Machine> builder)
    {
        builder.ToTable("Machines");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(m => m.Code)
            .IsUnique();

        builder.Property(m => m.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(m => m.Location)
            .HasMaxLength(200);

        builder.Property(m => m.Description)
            .HasMaxLength(500);

        builder.HasMany(m => m.Sensors)
            .WithOne(s => s.Machine)
            .HasForeignKey(s => s.MachineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.Alerts)
            .WithOne(a => a.Machine)
            .HasForeignKey(a => a.MachineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.StateHistory)
            .WithOne(sh => sh.Machine)
            .HasForeignKey(sh => sh.MachineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(m => m.DomainEvents);
    }
}

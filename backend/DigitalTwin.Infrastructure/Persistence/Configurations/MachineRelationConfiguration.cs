using DigitalTwin.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DigitalTwin.Infrastructure.Persistence.Configurations;

public class MachineRelationConfiguration : IEntityTypeConfiguration<MachineRelation>
{
    public void Configure(EntityTypeBuilder<MachineRelation> builder)
    {
        builder.ToTable("MachineRelations");

        builder.HasKey(mr => mr.Id);

        builder.Property(mr => mr.RelationType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(mr => mr.Description)
            .HasMaxLength(300);

        builder.HasOne(mr => mr.SourceMachine)
            .WithMany(m => m.RelationsOut)
            .HasForeignKey(mr => mr.SourceMachineId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths in SQL Server

        builder.HasOne(mr => mr.TargetMachine)
            .WithMany(m => m.RelationsIn)
            .HasForeignKey(mr => mr.TargetMachineId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths in SQL Server

        builder.HasIndex(mr => new { mr.SourceMachineId, mr.TargetMachineId })
            .IsUnique();
    }
}

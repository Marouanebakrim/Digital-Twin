using DigitalTwin.Domain.Entities;
using DigitalTwin.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DigitalTwin.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(DigitalTwinDbContext context, ILogger logger)
    {
        logger.LogInformation("Starting database seeding check...");

        // 1. Plant
        var plant = await context.Plants
            .Include(p => p.ProductionLines)
            .FirstOrDefaultAsync(p => p.Name == "OCP Demonstration Plant");

        if (plant == null)
        {
            plant = new Plant(
                "OCP Demonstration Plant",
                "Khouribga, Morocco",
                "Phosphate mining and chemical processing digital twin plant");

            await context.Plants.AddAsync(plant);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded Plant: {PlantName}", plant.Name);
        }

        // 2. ProductionLine
        var line = await context.ProductionLines
            .FirstOrDefaultAsync(l => l.PlantId == plant.Id && l.Name == "Mining and Processing Line 01");

        if (line == null)
        {
            line = new ProductionLine(
                plant.Id,
                "Mining and Processing Line 01",
                "Primary phosphate extraction, crushing, conveying and reaction line");

            await context.ProductionLines.AddAsync(line);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded ProductionLine: {LineName}", line.Name);
        }

        // 3. Machines
        var machineDefs = new[]
        {
            (Code: "RW-001", Name: "Bucket Wheel RW-001", Type: MachineType.Excavator, Location: "Mining Extraction Site 1", Desc: "Roue-pelle d'extraction minière"),
            (Code: "CR-001", Name: "Crusher CR-001",      Type: MachineType.Crusher,   Location: "Crushing Station 1",     Desc: "Concasseur primaire de minerai"),
            (Code: "CV-001", Name: "Conveyor CV-001",     Type: MachineType.Conveyor,  Location: "Transport Corridor 1",  Desc: "Bande transporteuse principale"),
            (Code: "RE-001", Name: "Reactor RE-001",      Type: MachineType.Reactor,   Location: "Chemical Plant Bay 2",   Desc: "Réacteur d'attaque phosphorique")
        };

        var machines = new Dictionary<string, Machine>();

        foreach (var def in machineDefs)
        {
            var machine = await context.Machines.FirstOrDefaultAsync(m => m.Code == def.Code);
            if (machine == null)
            {
                machine = new Machine(
                    line.Id,
                    def.Code,
                    def.Name,
                    def.Type,
                    def.Location,
                    def.Desc);

                machine.Start("Initial Seed");
                await context.Machines.AddAsync(machine);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded Machine: {Code} ({Name})", machine.Code, machine.Name);
            }
            machines[def.Code] = machine;
        }

        // 4. Sensors definitions per Machine
        var sensorDefs = new Dictionary<string, List<(string Code, string Name, string Type, string Unit, double? MinVal, double? MaxVal)>>
        {
            ["RW-001"] = new()
            {
                ("RW-001-TEMP",  "Temperature",  "Temperature",  "°C",   20.0, 85.0),
                ("RW-001-VIB",   "Vibration",    "Vibration",    "mm/s", 0.5,  3.5),
                ("RW-001-SPD",   "Speed",        "Speed",        "RPM",  800,  1200),
                ("RW-001-FLOW",  "MaterialFlow", "MaterialFlow", "t/h",  150,  300),
                ("RW-001-PWR",   "MotorPower",   "MotorPower",   "kW",   80,   150)
            },
            ["CR-001"] = new()
            {
                ("CR-001-TEMP",  "Temperature",  "Temperature",  "°C",   20.0, 90.0),
                ("CR-001-VIB",   "Vibration",    "Vibration",    "mm/s", 0.5,  4.0),
                ("CR-001-SPD",   "Speed",        "Speed",        "RPM",  600,  1000),
                ("CR-001-INFL",  "InputFlow",    "InputFlow",    "t/h",  150,  300),
                ("CR-001-OUTFL", "OutputFlow",   "OutputFlow",   "t/h",  140,  290),
                ("CR-001-PWR",   "MotorPower",   "MotorPower",   "kW",   100,  200)
            },
            ["CV-001"] = new()
            {
                ("CV-001-BSPD",  "BeltSpeed",    "BeltSpeed",    "m/s",  1.5,  3.5),
                ("CV-001-TEMP",  "Temperature",  "Temperature",  "°C",   20.0, 75.0),
                ("CV-001-VIB",   "Vibration",    "Vibration",    "mm/s", 0.2,  2.5),
                ("CV-001-FLOW",  "MaterialFlow", "MaterialFlow", "t/h",  140,  290),
                ("CV-001-LOAD",  "BeltLoad",     "BeltLoad",     "%",    30,   85),
                ("CV-001-PWR",   "MotorPower",   "MotorPower",   "kW",   50,   110)
            },
            ["RE-001"] = new()
            {
                ("RE-001-TEMP",  "Temperature",   "Temperature",   "°C",   60.0, 95.0),
                ("RE-001-PRES",  "Pressure",      "Pressure",      "bar",  1.5,  4.5),
                ("RE-001-PH",    "PH",            "PH",            "pH",   6.0,  8.0),
                ("RE-001-LVL",   "Level",         "Level",         "%",    20,   80),
                ("RE-001-ACID",  "AcidFlow",      "AcidFlow",      "t/h",  10,   50),
                ("RE-001-PHOS",  "PhosphateFlow", "PhosphateFlow", "t/h",  100,  250),
                ("RE-001-AGIT",  "AgitatorSpeed", "AgitatorSpeed", "RPM",  100,  500)
            }
        };

        foreach (var (mCode, sList) in sensorDefs)
        {
            var machine = machines[mCode];
            foreach (var sDef in sList)
            {
                var existingSensor = await context.Sensors
                    .FirstOrDefaultAsync(s => s.MachineId == machine.Id && s.Code == sDef.Code);

                if (existingSensor == null)
                {
                    var sensor = new Sensor(
                        machine.Id,
                        sDef.Code,
                        sDef.Name,
                        sDef.Type,
                        sDef.Unit,
                        sDef.MinVal,
                        sDef.MaxVal);

                    await context.Sensors.AddAsync(sensor);
                    logger.LogInformation("Seeded Sensor: {SensorCode} on {MachineCode}", sDef.Code, mCode);
                }
            }
        }

        await context.SaveChangesAsync();

        // 5. Machine Relations (RW-001 FEEDS CR-001, CR-001 FEEDS CV-001, CV-001 FEEDS RE-001)
        var relationPairs = new[]
        {
            (Source: "RW-001", Target: "CR-001", Type: MachineRelationType.Feeds, Desc: "RW-001 feeds raw phosphate ore to crusher CR-001"),
            (Source: "CR-001", Target: "CV-001", Type: MachineRelationType.Feeds, Desc: "CR-001 feeds crushed ore onto belt conveyor CV-001"),
            (Source: "CV-001", Target: "RE-001", Type: MachineRelationType.Feeds, Desc: "CV-001 delivers ore into phosphoric acid reactor RE-001")
        };

        foreach (var rel in relationPairs)
        {
            var srcMachine = machines[rel.Source];
            var tgtMachine = machines[rel.Target];

            var existingRelation = await context.MachineRelations
                .FirstOrDefaultAsync(r => r.SourceMachineId == srcMachine.Id && r.TargetMachineId == tgtMachine.Id);

            if (existingRelation == null)
            {
                var relation = new MachineRelation(
                    srcMachine.Id,
                    tgtMachine.Id,
                    rel.Type,
                    rel.Desc);

                await context.MachineRelations.AddAsync(relation);
                logger.LogInformation("Seeded Relation: {Source} --[{Type}]--> {Target}", rel.Source, rel.Type, rel.Target);
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Database seeding check completed successfully.");
    }
}

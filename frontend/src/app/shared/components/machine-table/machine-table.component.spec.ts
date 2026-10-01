import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachineTableComponent } from './machine-table.component';
import { MachineSummary } from '../../../core/models/models';

describe('MachineTableComponent', () => {
  let component: MachineTableComponent;
  let fixture: ComponentFixture<MachineTableComponent>;

  const makeMachines = (count: number): MachineSummary[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `m${i}`, code: `M-${String(i).padStart(3, '0')}`, name: `Machine ${i}`,
      type: `Type${String.fromCharCode(65 + i)}`, status: 'Running' as const,
      activeAlerts: i % 2, sensorCount: i + 1, location: `Zone ${i}`
    }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MachineTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.machines = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render table headers', () => {
    component.machines = [];
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
    expect(headerTexts).toContain('Code');
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('Type');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Sensors');
  });

  it('should render rows for each machine', () => {
    component.machines = makeMachines(3);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('should display machine data in cells', () => {
    component.machines = [
      { id: 'm1', code: 'XY-999', name: 'Test Machine', type: 'CustomType', status: 'Warning', activeAlerts: 3, sensorCount: 7, location: 'Sector 5' }
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('XY-999');
    expect(el.textContent).toContain('Test Machine');
    expect(el.textContent).toContain('CustomType');
    expect(el.textContent).toContain('Sector 5');
    expect(el.textContent).toContain('7');
    expect(el.textContent).toContain('3');
  });

  it('should display N/A for missing location', () => {
    component.machines = [
      { id: 'm1', code: 'M-001', name: 'No Location', type: 'TypeA', status: 'Running', activeAlerts: 0, sensorCount: 1 }
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('N/A');
  });

  it('should emit selectMachine event on row click', () => {
    component.machines = makeMachines(2);
    fixture.detectChanges();

    spyOn(component.selectMachine, 'emit');
    const row = fixture.nativeElement.querySelector('tbody tr');
    row.click();

    expect(component.selectMachine.emit).toHaveBeenCalledWith('m0');
  });

  it('should render empty tbody when no machines', () => {
    component.machines = [];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });
});

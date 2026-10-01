import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertTableComponent } from './alert-table.component';
import { AlertItem } from '../../../core/models/models';

describe('AlertTableComponent', () => {
  let component: AlertTableComponent;
  let fixture: ComponentFixture<AlertTableComponent>;

  const makeAlert = (overrides: Partial<AlertItem> = {}): AlertItem => ({
    id: 'a1', machineId: 'm1', machineName: 'Machine A', machineCode: 'MA-001',
    severity: 'Warning', type: 'SensorThreshold', title: 'Alert Title',
    message: 'Alert message', isAcknowledged: false, createdAt: new Date().toISOString(),
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.alerts = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render table headers', () => {
    component.alerts = [];
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
    expect(headerTexts).toContain('Severity');
    expect(headerTexts).toContain('Machine');
    expect(headerTexts).toContain('Sensor');
  });

  it('should render rows for each alert', () => {
    component.alerts = [makeAlert({ id: 'a1' }), makeAlert({ id: 'a2' }), makeAlert({ id: 'a3' })];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('should display alert data', () => {
    component.alerts = [makeAlert({ machineCode: 'XY-001', machineName: 'Test Machine', title: 'Overheat detected', sensorName: 'TempSensor' })];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('XY-001');
    expect(el.textContent).toContain('Test Machine');
    expect(el.textContent).toContain('Overheat detected');
    expect(el.textContent).toContain('TempSensor');
  });

  it('should display "Machine" when sensorName is absent', () => {
    component.alerts = [makeAlert({ sensorName: undefined })];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Machine');
  });

  it('should show Acknowledge button for unacknowledged alerts', () => {
    component.alerts = [makeAlert({ isAcknowledged: false })];
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Acknowledge');
  });

  it('should not show Acknowledge button for acknowledged alerts', () => {
    component.alerts = [makeAlert({ isAcknowledged: true, acknowledgedBy: 'Admin' })];
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Acked by Admin');
  });

  it('should emit acknowledge event on button click', () => {
    component.alerts = [makeAlert({ id: 'alert-99', isAcknowledged: false })];
    fixture.detectChanges();

    spyOn(component.acknowledge, 'emit');
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(component.acknowledge.emit).toHaveBeenCalledWith('alert-99');
  });

  it('should show Active status for unacknowledged alerts', () => {
    component.alerts = [makeAlert({ isAcknowledged: false })];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Active');
  });
});

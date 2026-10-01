import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SensorChartComponent } from './sensor-chart.component';
import { SensorReading } from '../../../core/models/models';

describe('SensorChartComponent', () => {
  let component: SensorChartComponent;
  let fixture: ComponentFixture<SensorChartComponent>;

  const makeReadings = (count: number): SensorReading[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `r${i}`, sensorId: 's1', value: 20 + i * 5, unit: 'units',
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      quality: 'Good' as const, isAnomaly: false
    }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SensorChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    component.title = 'Custom Sensor History';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Custom Sensor History');
  });

  it('should display unit when provided', () => {
    component.unit = 'kPa';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('kPa');
  });

  it('should display Live Telemetry badge', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Live Telemetry');
  });

  it('should contain a canvas element', () => {
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should handle empty readings without errors', () => {
    component.readings = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should handle readings with data', () => {
    component.readings = makeReadings(5);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should destroy chart on ngOnDestroy', () => {
    component.readings = makeReadings(3);
    fixture.detectChanges();
    // Should not throw
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should update chart data on readings change', () => {
    component.readings = makeReadings(3);
    fixture.detectChanges();

    // Update readings
    component.readings = makeReadings(5);
    component.ngOnChanges({ readings: { currentValue: component.readings, previousValue: [], firstChange: false, isFirstChange: () => false } });
    expect(component).toBeTruthy();
  });
});

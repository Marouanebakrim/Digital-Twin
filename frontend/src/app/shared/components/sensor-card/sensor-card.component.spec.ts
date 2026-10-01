import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SensorCardComponent } from './sensor-card.component';
import { SensorCurrentValue } from '../../../core/models/models';

describe('SensorCardComponent', () => {
  let component: SensorCardComponent;
  let fixture: ComponentFixture<SensorCardComponent>;

  const makeSensor = (overrides: Partial<SensorCurrentValue> = {}): SensorCurrentValue => ({
    sensorId: 's1', sensorCode: 'S-001', sensorName: 'Sensor Alpha', sensorType: 'TypeA',
    unit: 'units', value: 50, timestamp: new Date().toISOString(), quality: 'Good',
    isAnomaly: false, minValue: 0, maxValue: 100,
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SensorCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.sensor = makeSensor();
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display sensor code and name', () => {
    component.sensor = makeSensor({ sensorCode: 'XYZ-007', sensorName: 'Custom Sensor' });
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('XYZ-007');
    expect(el.textContent).toContain('Custom Sensor');
  });

  it('should display sensor type without assumption', () => {
    component.sensor = makeSensor({ sensorType: 'Humidity' });
    component.ngOnChanges();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Humidity');
  });

  it('should display sensor value and unit', () => {
    component.sensor = makeSensor({ value: 72.5, unit: 'kPa' });
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('72.5');
    expect(el.textContent).toContain('kPa');
  });

  describe('progress calculation', () => {
    it('should calculate progress percentage correctly', () => {
      component.sensor = makeSensor({ value: 75, minValue: 0, maxValue: 100 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressPercent).toBe(75);
    });

    it('should clamp progress to 0', () => {
      component.sensor = makeSensor({ value: -10, minValue: 0, maxValue: 100 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressPercent).toBe(0);
    });

    it('should clamp progress to 100', () => {
      component.sensor = makeSensor({ value: 150, minValue: 0, maxValue: 100 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressPercent).toBe(100);
    });

    it('should default to 50 when minValue is undefined', () => {
      component.sensor = makeSensor({ minValue: undefined, maxValue: 100 });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressPercent).toBe(50);
    });

    it('should default to 50 when maxValue is undefined', () => {
      component.sensor = makeSensor({ minValue: 0, maxValue: undefined });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressPercent).toBe(50);
    });
  });

  describe('anomaly styling', () => {
    it('should show NORMAL badge when not anomaly', () => {
      component.sensor = makeSensor({ isAnomaly: false });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('NORMAL');
      expect(component.cardBorderClass).toContain('border-slate-800');
    });

    it('should show WARNING badge when anomaly with warning severity', () => {
      component.sensor = makeSensor({ isAnomaly: true, severity: 'Warning' });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.cardBorderClass).toContain('border-amber-500');
      expect(component.qualityBadgeClass).toContain('text-amber-400');
    });

    it('should show CRITICAL badge when anomaly with critical severity', () => {
      component.sensor = makeSensor({ isAnomaly: true, severity: 'Critical' });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.cardBorderClass).toContain('border-rose-500');
      expect(component.qualityBadgeClass).toContain('text-rose-400');
      expect(component.qualityBadgeClass).toContain('animate-pulse');
    });

    it('should use appropriate progress fill class for normal', () => {
      component.sensor = makeSensor({ isAnomaly: false });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressFillClass).toContain('from-emerald-500');
    });

    it('should use amber progress fill for warning anomaly', () => {
      component.sensor = makeSensor({ isAnomaly: true, severity: 'Warning' });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressFillClass).toContain('bg-amber-400');
    });

    it('should use rose gradient progress fill for critical anomaly', () => {
      component.sensor = makeSensor({ isAnomaly: true, severity: 'Critical' });
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.progressFillClass).toContain('to-rose-500');
    });
  });
});

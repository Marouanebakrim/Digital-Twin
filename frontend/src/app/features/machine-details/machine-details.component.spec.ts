import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MachineDetailsComponent } from './machine-details.component';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SensorService } from '../../core/services/sensor.service';
import { SignalrService } from '../../core/services/signalr.service';
import {
  CurrentMachineState,
  SensorCurrentValue,
  SensorReading,
  SensorReadingUpdatePayload,
  MachineStatusChangedPayload
} from '../../core/models/models';

describe('MachineDetailsComponent (Generic Dynamic Sensor Test Suite)', () => {
  let component: MachineDetailsComponent;
  let fixture: ComponentFixture<MachineDetailsComponent>;
  let mockDigitalTwinService: jasmine.SpyObj<DigitalTwinService>;
  let mockSensorService: jasmine.SpyObj<SensorService>;
  let sensorReadingSubject: Subject<SensorReadingUpdatePayload>;
  let machineStateSubject: Subject<CurrentMachineState>;
  let statusSubject: Subject<MachineStatusChangedPayload>;
  let mockSignalrService: any;

  const createMockSensors = (count: number): SensorCurrentValue[] => {
    return Array.from({ length: count }, (_, i) => ({
      sensorId: `sensor-${i + 1}`,
      sensorCode: `S-CODE-${i + 1}`,
      sensorName: `Generic Sensor ${i + 1}`,
      sensorType: `CustomType_${i + 1}`,
      unit: `unit_${i + 1}`,
      value: 10 * (i + 1),
      timestamp: new Date().toISOString(),
      quality: 'Good',
      isAnomaly: false,
      minValue: 0,
      maxValue: 100 * (i + 1)
    }));
  };

  const createMockMachineState = (sensorCount: number): CurrentMachineState => ({
    machineId: 'm-test-123',
    machineCode: 'TEST-01',
    machineName: 'Dynamic Generic Machine',
    machineType: 'CustomIndustrialType',
    status: 'Running',
    computedAt: new Date().toISOString(),
    sensorValues: createMockSensors(sensorCount),
    activeAlertCount: 0,
    criticalAlertCount: 0
  });

  beforeEach(async () => {
    mockDigitalTwinService = jasmine.createSpyObj('DigitalTwinService', ['getCurrentMachineState']);
    mockSensorService = jasmine.createSpyObj('SensorService', ['getReadings']);
    mockSensorService.getReadings.and.returnValue(of([]));

    sensorReadingSubject = new Subject<SensorReadingUpdatePayload>();
    machineStateSubject = new Subject<CurrentMachineState>();
    statusSubject = new Subject<MachineStatusChangedPayload>();

    mockSignalrService = {
      sensorReading$: sensorReadingSubject.asObservable(),
      machineState$: machineStateSubject.asObservable(),
      status$: statusSubject.asObservable(),
      joinMachineGroup: jasmine.createSpy('joinMachineGroup'),
      leaveMachineGroup: jasmine.createSpy('leaveMachineGroup')
    };

    await TestBed.configureTestingModule({
      imports: [MachineDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: DigitalTwinService, useValue: mockDigitalTwinService },
        { provide: SensorService, useValue: mockSensorService },
        { provide: SignalrService, useValue: mockSignalrService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 'm-test-123' }) }
        }
      ]
    }).compileComponents();
  });

  // Helper to initialize component with specified sensor count
  function initWithSensorCount(count: number) {
    const mockState = createMockMachineState(count);
    mockDigitalTwinService.getCurrentMachineState.and.returnValue(of(mockState));

    fixture = TestBed.createComponent(MachineDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // -------------------------------------------------------------
  // CRITICAL SCENARIO A: Machine with 0 sensors
  // -------------------------------------------------------------
  it('SCENARIO A: should render machine with 0 sensors cleanly without crashing or making assumptions', () => {
    initWithSensorCount(0);

    expect(component.state?.sensorValues.length).toBe(0);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const sensorCards = compiled.querySelectorAll('app-sensor-card');
    const sensorCharts = compiled.querySelectorAll('app-sensor-chart');

    expect(sensorCards.length).toBe(0);
    expect(sensorCharts.length).toBe(0);
    expect(compiled.textContent).toContain('Dynamic Sensor Measurements (0)');
  });

  // -------------------------------------------------------------
  // CRITICAL SCENARIO B: Machine with 1 sensor
  // -------------------------------------------------------------
  it('SCENARIO B: should render machine with 1 sensor dynamically', () => {
    initWithSensorCount(1);

    expect(component.state?.sensorValues.length).toBe(1);
    expect(component.isLoading).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const sensorCards = compiled.querySelectorAll('app-sensor-card');
    const sensorCharts = compiled.querySelectorAll('app-sensor-chart');

    expect(sensorCards.length).toBe(1);
    expect(sensorCharts.length).toBe(1);
    expect(compiled.textContent).toContain('Generic Sensor 1');
  });

  // -------------------------------------------------------------
  // CRITICAL SCENARIO C: Machine with 5 sensors
  // -------------------------------------------------------------
  it('SCENARIO C: should render machine with 5 sensors dynamically', () => {
    initWithSensorCount(5);

    expect(component.state?.sensorValues.length).toBe(5);
    expect(component.isLoading).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const sensorCards = compiled.querySelectorAll('app-sensor-card');
    const sensorCharts = compiled.querySelectorAll('app-sensor-chart');

    expect(sensorCards.length).toBe(5);
    expect(sensorCharts.length).toBe(5);
    expect(compiled.textContent).toContain('Dynamic Sensor Measurements (5)');
  });

  // -------------------------------------------------------------
  // CRITICAL SCENARIO D: Machine with 7 sensors
  // -------------------------------------------------------------
  it('SCENARIO D: should render machine with 7 sensors dynamically', () => {
    initWithSensorCount(7);

    expect(component.state?.sensorValues.length).toBe(7);
    expect(component.isLoading).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const sensorCards = compiled.querySelectorAll('app-sensor-card');
    const sensorCharts = compiled.querySelectorAll('app-sensor-chart');

    expect(sensorCards.length).toBe(7);
    expect(sensorCharts.length).toBe(7);
    expect(compiled.textContent).toContain('Dynamic Sensor Measurements (7)');
  });

  // -------------------------------------------------------------
  // LOADING & ERROR STATES
  // -------------------------------------------------------------
  it('should show loading spinner while fetching machine state', () => {
    mockDigitalTwinService.getCurrentMachineState.and.returnValue(new Subject<CurrentMachineState>());
    fixture = TestBed.createComponent(MachineDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading dynamic sensors and live state...');
  });

  it('should show error banner when state fetch fails', () => {
    mockDigitalTwinService.getCurrentMachineState.and.returnValue(throwError(() => new Error('Machine not found')));
    fixture = TestBed.createComponent(MachineDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Machine not found');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error loading machine state');
  });

  // -------------------------------------------------------------
  // BACK NAVIGATION LINK
  // -------------------------------------------------------------
  it('should render back button linking to /machines', () => {
    initWithSensorCount(2);

    const compiled = fixture.nativeElement as HTMLElement;
    const backBtn = compiled.querySelector('a[routerLink="/machines"]');
    expect(backBtn).toBeTruthy();
    expect(backBtn?.textContent).toContain('Back');
  });

  // -------------------------------------------------------------
  // SIGNALR REAL-TIME TELEMETRY UPDATES
  // -------------------------------------------------------------
  it('should update sensor value dynamically on receiving SignalR sensor update', () => {
    initWithSensorCount(2);

    expect(component.state?.sensorValues[0].value).toBe(10);

    // Emit live telemetry for sensor-1
    sensorReadingSubject.next({
      machineId: 'm-test-123',
      machineCode: 'TEST-01',
      sensorId: 'sensor-1',
      sensorType: 'CustomType_1',
      value: 88.4,
      unit: 'unit_1',
      timestamp: new Date().toISOString(),
      machineStatus: 'Running',
      alertInfo: {
        alertId: 'alt-1',
        severity: 'Warning',
        title: 'Sensor Warning'
      }
    });

    expect(component.state?.sensorValues[0].value).toBe(88.4);
    expect(component.state?.sensorValues[0].isAnomaly).toBeTrue();
    expect(component.state?.sensorValues[0].severity).toBe('Warning');

    // Verify history array updated
    expect(component.sensorHistories['sensor-1'].length).toBe(1);
    expect(component.sensorHistories['sensor-1'][0].value).toBe(88.4);
  });

  it('should update machine status when receiving SignalR status update', () => {
    initWithSensorCount(3);
    expect(component.state?.status).toBe('Running');

    statusSubject.next({
      machineId: 'm-test-123',
      machineCode: 'TEST-01',
      previousStatus: 'Running',
      newStatus: 'Critical',
      changedAt: new Date().toISOString()
    });

    expect(component.state?.status).toBe('Critical');
  });

  it('should leave SignalR machine group on destroy', () => {
    initWithSensorCount(2);
    component.ngOnDestroy();
    expect(mockSignalrService.leaveMachineGroup).toHaveBeenCalledWith('TEST-01');
  });
});

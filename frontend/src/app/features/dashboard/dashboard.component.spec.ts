import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SignalrService } from '../../core/services/signalr.service';
import { DashboardSummary, SensorReadingUpdatePayload, MachineStatusChangedPayload } from '../../core/models/models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDigitalTwinService: jasmine.SpyObj<DigitalTwinService>;
  let sensorReadingSubject: Subject<SensorReadingUpdatePayload>;
  let statusSubject: Subject<MachineStatusChangedPayload>;
  let mockSignalrService: any;

  const mockSummary: DashboardSummary = {
    totalMachines: 4,
    running: 2,
    warning: 1,
    critical: 1,
    stopped: 0,
    activeAlerts: 3,
    criticalAlerts: 1,
    machines: [
      { id: '1', code: 'RW-001', name: 'Bucket Wheel Excavator', type: 'BucketWheel', status: 'Running', activeAlerts: 0, sensorCount: 5 },
      { id: '2', code: 'CR-001', name: 'Primary Jaw Crusher', type: 'Crusher', status: 'Warning', activeAlerts: 2, sensorCount: 7 },
      { id: '3', code: 'CV-001', name: 'Main Conveyor Belt', type: 'Conveyor', status: 'Running', activeAlerts: 0, sensorCount: 3 },
      { id: '4', code: 'RE-001', name: 'Acid Reactor Unit', type: 'Reactor', status: 'Critical', activeAlerts: 1, sensorCount: 4 }
    ]
  };

  beforeEach(async () => {
    mockDigitalTwinService = jasmine.createSpyObj('DigitalTwinService', ['getDashboardSummary']);
    mockDigitalTwinService.getDashboardSummary.and.returnValue(of(mockSummary));

    sensorReadingSubject = new Subject<SensorReadingUpdatePayload>();
    statusSubject = new Subject<MachineStatusChangedPayload>();

    mockSignalrService = {
      sensorReading$: sensorReadingSubject.asObservable(),
      status$: statusSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DigitalTwinService, useValue: mockDigitalTwinService },
        { provide: SignalrService, useValue: mockSignalrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create and load data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockDigitalTwinService.getDashboardSummary).toHaveBeenCalled();
    expect(component.summary).toEqual(mockSummary);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
  });

  it('should render KPI metrics', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Total Machines');
    expect(compiled.textContent).toContain('Plant Executive Dashboard');
  });

  it('should update pipeline machines correctly', () => {
    fixture.detectChanges();
    expect(component.pipelineMachines.length).toBe(4);
    expect(component.pipelineMachines[0].code).toBe('RW-001');
    expect(component.pipelineMachines[1].code).toBe('CR-001');
  });

  it('should display loading state while loading', () => {
    mockDigitalTwinService.getDashboardSummary.and.returnValue(new Subject<DashboardSummary>());
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading digital twin state...');
  });

  it('should display error state and retry on error', () => {
    mockDigitalTwinService.getDashboardSummary.and.returnValue(throwError(() => new Error('API connection failed')));
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('API connection failed');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Failed to load dashboard telemetry');

    // Test retry
    mockDigitalTwinService.getDashboardSummary.and.returnValue(of(mockSummary));
    component.loadData();
    fixture.detectChanges();

    expect(component.errorMessage).toBeNull();
    expect(component.summary).toEqual(mockSummary);
  });

  it('should update material flow when receiving SignalR flow update', () => {
    fixture.detectChanges();
    expect(component.totalFlow).toBe(2450);

    sensorReadingSubject.next({
      machineId: '1',
      machineCode: 'RW-001',
      sensorId: 's1',
      sensorType: 'MaterialFlow',
      value: 3100.4,
      unit: 't/h',
      timestamp: new Date().toISOString(),
      machineStatus: 'Running'
    });

    expect(component.totalFlow).toBe(3100);
  });

  it('should update machine status and recalculate KPIs on SignalR status update', () => {
    fixture.detectChanges();
    expect(component.summary?.running).toBe(2);

    statusSubject.next({
      machineId: '1',
      machineCode: 'RW-001',
      previousStatus: 'Running',
      newStatus: 'Warning',
      changedAt: new Date().toISOString()
    });

    expect(component.summary?.machines.find(m => m.id === '1')?.status).toBe('Warning');
    expect(component.summary?.running).toBe(1);
    expect(component.summary?.warning).toBe(2);
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const spyUnsubscribe = spyOn((component as any).subscriptions[0], 'unsubscribe');
    component.ngOnDestroy();
    expect(spyUnsubscribe).toHaveBeenCalled();
  });
});

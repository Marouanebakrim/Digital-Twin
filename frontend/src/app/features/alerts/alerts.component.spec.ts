import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { AlertsComponent } from './alerts.component';
import { AlertService } from '../../core/services/alert.service';
import { SignalrService } from '../../core/services/signalr.service';
import { AlertItem } from '../../core/models/models';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  let alertCreatedSubject: Subject<AlertItem>;
  let mockSignalrService: any;

  const mockAlerts: AlertItem[] = [
    {
      id: 'alt-1',
      machineId: 'm1',
      machineName: 'Bucket Wheel Excavator',
      machineCode: 'RW-001',
      sensorId: 's1',
      sensorName: 'Bucket Wheel Motor Temperature',
      severity: 'Warning',
      type: 'SensorThreshold',
      title: 'High Motor Temperature',
      message: 'Temperature exceeds 75°C threshold',
      isAcknowledged: false,
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      id: 'alt-2',
      machineId: 'm2',
      machineName: 'Primary Jaw Crusher',
      machineCode: 'CR-001',
      sensorId: 's2',
      sensorName: 'Main Shaft Vibration',
      severity: 'Critical',
      type: 'SensorThreshold',
      title: 'Severe Vibration Anomaly',
      message: 'Vibration velocity exceeds 8.5 mm/s limit',
      isAcknowledged: true,
      acknowledgedBy: 'Shift Supervisor',
      acknowledgedAt: '2025-01-01T10:15:00Z',
      createdAt: '2025-01-01T09:30:00Z'
    }
  ];

  beforeEach(async () => {
    mockAlertService = jasmine.createSpyObj('AlertService', ['getAlerts', 'acknowledgeAlert']);
    mockAlertService.getAlerts.and.returnValue(of(mockAlerts));
    mockAlertService.acknowledgeAlert.and.returnValue(of({
      ...mockAlerts[0],
      isAcknowledged: true,
      acknowledgedBy: 'Shift Supervisor',
      acknowledgedAt: new Date().toISOString()
    }));

    alertCreatedSubject = new Subject<AlertItem>();
    mockSignalrService = {
      alertCreated$: alertCreatedSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [AlertsComponent],
      providers: [
        { provide: AlertService, useValue: mockAlertService },
        { provide: SignalrService, useValue: mockSignalrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load alerts on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockAlertService.getAlerts).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(component.alerts.length).toBe(2);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
  });

  it('should filter alerts by ACTIVE filter', () => {
    fixture.detectChanges();
    component.currentFilter = 'ACTIVE';
    component.loadAlerts();

    expect(mockAlertService.getAlerts).toHaveBeenCalledWith(false, undefined, undefined);
  });

  it('should filter alerts by ACKNOWLEDGED filter', () => {
    fixture.detectChanges();
    component.currentFilter = 'ACKNOWLEDGED';
    component.loadAlerts();

    expect(mockAlertService.getAlerts).toHaveBeenCalledWith(true, undefined, undefined);
  });

  it('should filter alerts by WARNING filter', () => {
    fixture.detectChanges();
    component.currentFilter = 'WARNING';
    component.loadAlerts();

    expect(mockAlertService.getAlerts).toHaveBeenCalledWith(undefined, undefined, 'Warning');
  });

  it('should filter alerts by CRITICAL filter', () => {
    fixture.detectChanges();
    component.currentFilter = 'CRITICAL';
    component.loadAlerts();

    expect(mockAlertService.getAlerts).toHaveBeenCalledWith(undefined, undefined, 'Critical');
  });

  it('should display empty state when alerts list is empty', () => {
    mockAlertService.getAlerts.and.returnValue(of([]));
    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.alerts.length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No Active Alerts');
  });

  it('should display loading state while fetching alerts', () => {
    mockAlertService.getAlerts.and.returnValue(new Subject<AlertItem[]>());
    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fetching active alerts...');
  });

  it('should display error banner when alert fetch fails', () => {
    mockAlertService.getAlerts.and.returnValue(throwError(() => new Error('Service down')));
    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Service down');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error loading alerts');
  });

  it('should acknowledge an alert when triggered', () => {
    fixture.detectChanges();
    expect(component.alerts[0].isAcknowledged).toBeFalse();

    component.onAcknowledgeAlert('alt-1');
    expect(mockAlertService.acknowledgeAlert).toHaveBeenCalledWith('alt-1', 'Shift Supervisor');
    expect(component.alerts[0].isAcknowledged).toBeTrue();
    expect(component.alerts[0].acknowledgedBy).toBe('Shift Supervisor');
  });

  it('should prepend new alert received via SignalR stream', () => {
    fixture.detectChanges();
    expect(component.alerts.length).toBe(2);

    const newAlert: AlertItem = {
      id: 'alt-3',
      machineId: 'm3',
      machineName: 'Main Conveyor Belt',
      machineCode: 'CV-001',
      severity: 'Critical',
      type: 'CommunicationLoss',
      title: 'PLC Signal Lost',
      message: 'Telemetry feed dropped',
      isAcknowledged: false,
      createdAt: new Date().toISOString()
    };

    alertCreatedSubject.next(newAlert);

    expect(component.alerts.length).toBe(3);
    expect(component.alerts[0].id).toBe('alt-3');
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MainLayoutComponent } from './main-layout.component';
import { SignalrService } from '../../core/services/signalr.service';
import { SimulatorService } from '../../core/services/simulator.service';
import { AlertItem } from '../../core/models/models';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let alertCreatedSubject: Subject<AlertItem>;
  let mockSignalrService: any;
  let mockSimulatorService: jasmine.SpyObj<SimulatorService>;

  beforeEach(async () => {
    alertCreatedSubject = new Subject<AlertItem>();
    mockSignalrService = {
      alertCreated$: alertCreatedSubject.asObservable(),
      isConnected: jasmine.createSpy('isConnected').and.returnValue(true),
      connectionState: jasmine.createSpy('connectionState').and.returnValue('Connected')
    };

    mockSimulatorService = jasmine.createSpyObj('SimulatorService', ['getStatus']);
    mockSimulatorService.getStatus.and.returnValue(of({ isRunning: true, mode: 'normal', intervalMs: 3000 }));

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: SignalrService, useValue: mockSignalrService },
        { provide: SimulatorService, useValue: mockSimulatorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create layout with header, sidebar, and router-outlet', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should show toast alert when receiving SignalR alert and auto dismiss after 7s', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.latestAlert).toBeNull();

    const alert: AlertItem = {
      id: 'toast-1',
      machineId: 'm1',
      machineName: 'Test Machine',
      machineCode: 'TM-01',
      severity: 'Critical',
      type: 'SensorThreshold',
      title: 'Critical Alarm',
      isAcknowledged: false,
      createdAt: new Date().toISOString()
    };

    alertCreatedSubject.next(alert);
    expect(component.latestAlert?.id).toBe('toast-1');

    tick(7000);
    expect(component.latestAlert).toBeNull();
  }));

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const spyUnsubscribe = spyOn((component as any).alertSub, 'unsubscribe');
    component.ngOnDestroy();
    expect(spyUnsubscribe).toHaveBeenCalled();
  });
});

import { SignalrService } from './signalr.service';
import * as signalR from '@microsoft/signalr';
import { SensorReadingUpdatePayload, CurrentMachineState, AlertItem, MachineStatusChangedPayload } from '../models/models';

describe('SignalrService', () => {
  let service: SignalrService;

  beforeEach(() => {
    // Mock HubConnectionBuilder constructor on prototype / module
    spyOn(signalR.HubConnectionBuilder.prototype, 'build').and.returnValue({
      state: signalR.HubConnectionState.Disconnected,
      start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
      stop: jasmine.createSpy('stop').and.returnValue(Promise.resolve()),
      on: jasmine.createSpy('on'),
      invoke: jasmine.createSpy('invoke').and.returnValue(Promise.resolve()),
      onreconnecting: jasmine.createSpy('onreconnecting'),
      onreconnected: jasmine.createSpy('onreconnected'),
      onclose: jasmine.createSpy('onclose')
    } as any);

    service = new SignalrService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with connection state defined', () => {
    expect(service.connectionState()).toBeDefined();
  });

  describe('Observable streams', () => {
    it('should emit sensor reading updates via sensorReading$', (done) => {
      const payload: SensorReadingUpdatePayload = {
        machineId: 'm1', machineCode: 'M-001', sensorId: 's1', sensorType: 'TypeA',
        value: 42.5, unit: 'units', timestamp: '2025-01-01T00:00:00Z', machineStatus: 'Running'
      };

      service.sensorReading$.subscribe(data => {
        expect(data.value).toBe(42.5);
        expect(data.machineId).toBe('m1');
        expect(data.sensorType).toBe('TypeA');
        done();
      });

      (service as any).sensorReadingSubject.next(payload);
    });

    it('should emit machine state updates via machineState$', (done) => {
      const state: CurrentMachineState = {
        machineId: 'm1', machineCode: 'M-001', machineName: 'Machine One',
        machineType: 'TypeA', status: 'Warning', computedAt: '2025-01-01T00:00:00Z',
        sensorValues: [], activeAlertCount: 1, criticalAlertCount: 0
      };

      service.machineState$.subscribe(data => {
        expect(data.status).toBe('Warning');
        expect(data.machineId).toBe('m1');
        done();
      });

      (service as any).machineStateSubject.next(state);
    });

    it('should emit alert created events via alertCreated$', (done) => {
      const alert: AlertItem = {
        id: 'a1', machineId: 'm1', machineName: 'Machine One', machineCode: 'M-001',
        severity: 'Critical', type: 'SensorThreshold', title: 'Overheat',
        isAcknowledged: false, createdAt: '2025-01-01T00:00:00Z'
      };

      service.alertCreated$.subscribe(data => {
        expect(data.severity).toBe('Critical');
        expect(data.title).toBe('Overheat');
        done();
      });

      (service as any).alertCreatedSubject.next(alert);
    });

    it('should emit status changes via status$', (done) => {
      const payload: MachineStatusChangedPayload = {
        machineId: 'm1', machineCode: 'M-001',
        previousStatus: 'Running', newStatus: 'Critical',
        changedAt: '2025-01-01T00:00:00Z'
      };

      service.status$.subscribe(data => {
        expect(data.previousStatus).toBe('Running');
        expect(data.newStatus).toBe('Critical');
        done();
      });

      (service as any).statusChangedSubject.next(payload);
    });

    it('should emit status changes via statusChanged$ (alias)', (done) => {
      const payload: MachineStatusChangedPayload = {
        machineId: 'm2', machineCode: 'M-002',
        previousStatus: 'Warning', newStatus: 'Running',
        changedAt: '2025-01-01T00:00:00Z'
      };

      service.statusChanged$.subscribe(data => {
        expect(data.machineCode).toBe('M-002');
        done();
      });

      (service as any).statusChangedSubject.next(payload);
    });
  });

  describe('Group methods', () => {
    it('should have joinMachineGroup method', () => {
      expect(service.joinMachineGroup).toBeDefined();
    });

    it('should have leaveMachineGroup method', () => {
      expect(service.leaveMachineGroup).toBeDefined();
    });

    it('should have joinDashboardGroup method', () => {
      expect(service.joinDashboardGroup).toBeDefined();
    });

    it('should have joinAlertsGroup method', () => {
      expect(service.joinAlertsGroup).toBeDefined();
    });

    it('should not throw when calling joinMachineGroup while disconnected', async () => {
      await expectAsync(service.joinMachineGroup('M-001')).toBeResolved();
    });

    it('should not throw when calling leaveMachineGroup while disconnected', async () => {
      await expectAsync(service.leaveMachineGroup('M-001')).toBeResolved();
    });

    it('should not throw when calling joinDashboardGroup while disconnected', async () => {
      await expectAsync(service.joinDashboardGroup()).toBeResolved();
    });

    it('should not throw when calling joinAlertsGroup while disconnected', async () => {
      await expectAsync(service.joinAlertsGroup()).toBeResolved();
    });
  });

  describe('Connection signals', () => {
    it('should expose isConnected as a signal', () => {
      expect(typeof service.isConnected).toBe('function');
    });

    it('should expose connectionState as a signal', () => {
      expect(typeof service.connectionState).toBe('function');
    });
  });
});

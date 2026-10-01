import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DigitalTwinService } from './digital-twin.service';
import { API_CONFIG } from './api.config';
import { DashboardSummary, PlantTopology, CurrentMachineState } from '../models/models';

describe('DigitalTwinService', () => {
  let service: DigitalTwinService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DigitalTwinService
      ]
    });
    service = TestBed.inject(DigitalTwinService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboardSummary', () => {
    it('should GET dashboard summary', () => {
      const mockSummary: DashboardSummary = {
        totalMachines: 4, running: 3, warning: 1, critical: 0, stopped: 0,
        activeAlerts: 2, criticalAlerts: 0, machines: []
      };

      service.getDashboardSummary().subscribe(summary => {
        expect(summary.totalMachines).toBe(4);
        expect(summary.running).toBe(3);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/digital-twin/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });

    it('should handle HTTP error', () => {
      service.getDashboardSummary().subscribe({
        next: () => fail('should have failed'),
        error: (err) => expect(err.status).toBe(503)
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/digital-twin/summary`);
      req.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('getPlantTopology', () => {
    it('should GET plant topology', () => {
      const mockTopology: PlantTopology = {
        plantId: 'p1', plantName: 'Test Plant',
        nodes: [
          { id: 'n1', code: 'N-001', name: 'Node One', type: 'TypeA', status: 'Running', activeAlerts: 0 }
        ],
        edges: []
      };

      service.getPlantTopology().subscribe(topology => {
        expect(topology.plantName).toBe('Test Plant');
        expect(topology.nodes.length).toBe(1);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/digital-twin`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopology);
    });
  });

  describe('getCurrentMachineState', () => {
    it('should GET current state for a machine', () => {
      const mockState: CurrentMachineState = {
        machineId: 'm1', machineCode: 'M-001', machineName: 'Machine One',
        machineType: 'TypeA', status: 'Running', computedAt: '2025-01-01T00:00:00Z',
        sensorValues: [], activeAlertCount: 0, criticalAlertCount: 0
      };

      service.getCurrentMachineState('m1').subscribe(state => {
        expect(state.machineId).toBe('m1');
        expect(state.sensorValues.length).toBe(0);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/digital-twin/machines/m1/current-state`);
      expect(req.request.method).toBe('GET');
      req.flush(mockState);
    });

    it('should handle 404 for unknown machine', () => {
      service.getCurrentMachineState('unknown').subscribe({
        next: () => fail('should have failed'),
        error: (err) => expect(err.status).toBe(404)
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/digital-twin/machines/unknown/current-state`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});

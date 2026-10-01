import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MachineService } from './machine.service';
import { API_CONFIG } from './api.config';
import { MachineSummary, MachineDetail, MachineRelation } from '../models/models';

describe('MachineService', () => {
  let service: MachineService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MachineService
      ]
    });
    service = TestBed.inject(MachineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMachines', () => {
    it('should GET all machines', () => {
      const mockMachines: MachineSummary[] = [
        { id: '1', code: 'M-001', name: 'Machine Alpha', type: 'CustomType', status: 'Running', activeAlerts: 0, sensorCount: 3 },
        { id: '2', code: 'M-002', name: 'Machine Beta', type: 'AnotherType', status: 'Warning', activeAlerts: 2, sensorCount: 5 }
      ];

      service.getMachines().subscribe(machines => {
        expect(machines.length).toBe(2);
        expect(machines).toEqual(mockMachines);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMachines);
    });

    it('should handle HTTP error', () => {
      service.getMachines().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getMachineById', () => {
    it('should GET a single machine by id', () => {
      const mockDetail: MachineDetail = {
        id: 'abc-123',
        code: 'M-001',
        name: 'Machine Alpha',
        type: 'CustomType',
        status: 'Running',
        installedAt: '2025-01-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        sensors: [],
        relations: []
      };

      service.getMachineById('abc-123').subscribe(detail => {
        expect(detail).toEqual(mockDetail);
        expect(detail.id).toBe('abc-123');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines/abc-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDetail);
    });

    it('should handle 404 error', () => {
      service.getMachineById('nonexistent').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines/nonexistent`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getMachineRelations', () => {
    it('should GET relations for a machine', () => {
      const mockRelations: MachineRelation[] = [
        {
          id: 'r1', sourceMachineId: '1', sourceMachineCode: 'M-001', sourceMachineName: 'Alpha',
          targetMachineId: '2', targetMachineCode: 'M-002', targetMachineName: 'Beta',
          relationType: 'FEEDS'
        }
      ];

      service.getMachineRelations('1').subscribe(relations => {
        expect(relations.length).toBe(1);
        expect(relations[0].relationType).toBe('FEEDS');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines/1/relations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRelations);
    });
  });
});

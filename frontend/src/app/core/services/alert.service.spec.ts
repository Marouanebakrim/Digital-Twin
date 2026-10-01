import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AlertService } from './alert.service';
import { API_CONFIG } from './api.config';
import { AlertItem } from '../models/models';

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AlertService
      ]
    });
    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAlerts', () => {
    const mockAlerts: AlertItem[] = [
      {
        id: 'a1', machineId: 'm1', machineName: 'Machine A', machineCode: 'MA-001',
        severity: 'Warning', type: 'SensorThreshold', title: 'High reading',
        isAcknowledged: false, createdAt: '2025-01-01T00:00:00Z'
      }
    ];

    it('should GET all alerts without filters', () => {
      service.getAlerts().subscribe(alerts => {
        expect(alerts.length).toBe(1);
        expect(alerts[0].title).toBe('High reading');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/alerts`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockAlerts);
    });

    it('should GET alerts with acknowledged filter', () => {
      service.getAlerts(false).subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_CONFIG.baseUrl}/alerts`);
      expect(req.request.params.get('acknowledged')).toBe('false');
      req.flush(mockAlerts);
    });

    it('should GET alerts with machineId filter', () => {
      service.getAlerts(undefined, 'm1').subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_CONFIG.baseUrl}/alerts`);
      expect(req.request.params.get('machineId')).toBe('m1');
      req.flush(mockAlerts);
    });

    it('should GET alerts with severity filter', () => {
      service.getAlerts(undefined, undefined, 'Critical').subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_CONFIG.baseUrl}/alerts`);
      expect(req.request.params.get('severity')).toBe('Critical');
      req.flush([]);
    });

    it('should GET alerts with all filters combined', () => {
      service.getAlerts(true, 'm2', 'Warning').subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_CONFIG.baseUrl}/alerts`);
      expect(req.request.params.get('acknowledged')).toBe('true');
      expect(req.request.params.get('machineId')).toBe('m2');
      expect(req.request.params.get('severity')).toBe('Warning');
      req.flush([]);
    });

    it('should handle HTTP error', () => {
      service.getAlerts().subscribe({
        next: () => fail('should have failed'),
        error: (err) => expect(err.status).toBe(500)
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/alerts`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAlertById', () => {
    it('should GET a single alert by id', () => {
      const mockAlert: AlertItem = {
        id: 'a1', machineId: 'm1', machineName: 'Machine A', machineCode: 'MA-001',
        severity: 'Critical', type: 'MachineOffline', title: 'Machine offline',
        isAcknowledged: false, createdAt: '2025-01-01T00:00:00Z'
      };

      service.getAlertById('a1').subscribe(alert => {
        expect(alert.id).toBe('a1');
        expect(alert.severity).toBe('Critical');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/alerts/a1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAlert);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should POST acknowledge with provided user', () => {
      const mockResponse: AlertItem = {
        id: 'a1', machineId: 'm1', machineName: 'Machine A', machineCode: 'MA-001',
        severity: 'Warning', type: 'SensorThreshold', title: 'High reading',
        isAcknowledged: true, acknowledgedBy: 'Supervisor', acknowledgedAt: '2025-01-01T01:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      };

      service.acknowledgeAlert('a1', 'Supervisor').subscribe(alert => {
        expect(alert.isAcknowledged).toBeTrue();
        expect(alert.acknowledgedBy).toBe('Supervisor');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/alerts/a1/acknowledge`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ acknowledgedBy: 'Supervisor' });
      req.flush(mockResponse);
    });

    it('should POST acknowledge with default user when not provided', () => {
      service.acknowledgeAlert('a1').subscribe();

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/alerts/a1/acknowledge`);
      expect(req.request.body).toEqual({ acknowledgedBy: 'Operator' });
      req.flush({});
    });
  });
});

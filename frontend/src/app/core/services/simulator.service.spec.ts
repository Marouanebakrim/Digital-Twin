import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SimulatorService } from './simulator.service';
import { API_CONFIG } from './api.config';
import { SimulatorStatus } from '../models/models';

describe('SimulatorService', () => {
  let service: SimulatorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SimulatorService
      ]
    });
    service = TestBed.inject(SimulatorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStatus', () => {
    it('should GET simulator status', () => {
      const mockStatus: SimulatorStatus = {
        isRunning: true, mode: 'normal', intervalMs: 3000, startedAt: '2025-01-01T00:00:00Z'
      };

      service.getStatus().subscribe(status => {
        expect(status.isRunning).toBeTrue();
        expect(status.mode).toBe('normal');
        expect(status.intervalMs).toBe(3000);
      });

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatus);
    });

    it('should handle HTTP error', () => {
      service.getStatus().subscribe({
        next: () => fail('should have failed'),
        error: (err) => expect(err.status).toBe(503)
      });

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/status`);
      req.flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('setMode', () => {
    it('should POST mode change to normal', () => {
      service.setMode('normal').subscribe(res => {
        expect(res.mode).toBe('normal');
      });

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/mode`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ mode: 'normal' });
      req.flush({ message: 'Mode changed', mode: 'normal' });
    });

    it('should POST mode change to warning', () => {
      service.setMode('warning').subscribe(res => {
        expect(res.mode).toBe('warning');
      });

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/mode`);
      expect(req.request.body).toEqual({ mode: 'warning' });
      req.flush({ message: 'Mode changed', mode: 'warning' });
    });

    it('should POST mode change to critical', () => {
      service.setMode('critical').subscribe();

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/mode`);
      expect(req.request.body).toEqual({ mode: 'critical' });
      req.flush({ message: 'Mode changed', mode: 'critical' });
    });

    it('should POST mode change to scenario', () => {
      service.setMode('scenario').subscribe();

      const req = httpMock.expectOne(`${API_CONFIG.simulatorUrl}/mode`);
      expect(req.request.body).toEqual({ mode: 'scenario' });
      req.flush({ message: 'Mode changed', mode: 'scenario' });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SensorService } from './sensor.service';
import { API_CONFIG } from './api.config';
import { Sensor, SensorReading, SubmitReadingRequest } from '../models/models';

describe('SensorService', () => {
  let service: SensorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SensorService
      ]
    });
    service = TestBed.inject(SensorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSensorsByMachineId', () => {
    it('should GET sensors for a machine', () => {
      const mockSensors: Sensor[] = [
        { id: 's1', machineId: 'm1', code: 'S-001', name: 'Sensor Alpha', sensorType: 'TypeA', unit: 'units', isActive: true },
        { id: 's2', machineId: 'm1', code: 'S-002', name: 'Sensor Beta', sensorType: 'TypeB', unit: 'other', isActive: true }
      ];

      service.getSensorsByMachineId('m1').subscribe(sensors => {
        expect(sensors.length).toBe(2);
        expect(sensors[0].code).toBe('S-001');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/machines/m1/sensors`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSensors);
    });
  });

  describe('getSensorById', () => {
    it('should GET a single sensor by id', () => {
      const mockSensor: Sensor = {
        id: 's1', machineId: 'm1', code: 'S-001', name: 'Sensor Alpha',
        sensorType: 'TypeA', unit: 'units', isActive: true
      };

      service.getSensorById('s1').subscribe(sensor => {
        expect(sensor.id).toBe('s1');
        expect(sensor.name).toBe('Sensor Alpha');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/sensors/s1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSensor);
    });
  });

  describe('getReadings', () => {
    it('should GET readings with default page size', () => {
      const mockReadings: SensorReading[] = [
        { id: 'r1', sensorId: 's1', value: 42.5, unit: 'units', timestamp: '2025-01-01T00:00:00Z', quality: 'Good', isAnomaly: false }
      ];

      service.getReadings('s1').subscribe(readings => {
        expect(readings.length).toBe(1);
        expect(readings[0].value).toBe(42.5);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/sensors/s1/readings?pageSize=50`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReadings);
    });

    it('should GET readings with custom limit', () => {
      service.getReadings('s1', undefined, undefined, 20).subscribe();

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/sensors/s1/readings?pageSize=20`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should GET readings with from/to parameters', () => {
      const from = '2025-01-01T00:00:00Z';
      const to = '2025-01-02T00:00:00Z';

      service.getReadings('s1', from, to, 10).subscribe();

      const req = httpMock.expectOne(
        `${API_CONFIG.baseUrl}/sensors/s1/readings?pageSize=10&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle HTTP error on readings', () => {
      service.getReadings('bad-id').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/sensors/bad-id/readings?pageSize=50`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('submitReading', () => {
    it('should POST a new reading', () => {
      const request: SubmitReadingRequest = { value: 99.9, timestamp: '2025-06-01T12:00:00Z' };
      const mockResponse: SensorReading = {
        id: 'new-r', sensorId: 's1', value: 99.9, unit: 'units',
        timestamp: '2025-06-01T12:00:00Z', quality: 'Good', isAnomaly: false
      };

      service.submitReading('s1', request).subscribe(reading => {
        expect(reading.value).toBe(99.9);
        expect(reading.id).toBe('new-r');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/sensors/s1/readings`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlantService } from './plant.service';
import { API_CONFIG } from './api.config';
import { Plant } from '../models/models';

describe('PlantService', () => {
  let service: PlantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PlantService
      ]
    });
    service = TestBed.inject(PlantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPlants', () => {
    it('should GET all plants', () => {
      const mockPlants: Plant[] = [
        { id: 'p1', name: 'Plant Alpha', location: 'Site A', createdAt: '2025-01-01T00:00:00Z', productionLines: [] }
      ];

      service.getPlants().subscribe(plants => {
        expect(plants.length).toBe(1);
        expect(plants[0].name).toBe('Plant Alpha');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/plants`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlants);
    });

    it('should handle HTTP error', () => {
      service.getPlants().subscribe({
        next: () => fail('should have failed'),
        error: (err) => expect(err.status).toBe(500)
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/plants`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getPlantById', () => {
    it('should GET a single plant by id', () => {
      const mockPlant: Plant = {
        id: 'p1', name: 'Plant Alpha', location: 'Site A',
        createdAt: '2025-01-01T00:00:00Z', productionLines: []
      };

      service.getPlantById('p1').subscribe(plant => {
        expect(plant.id).toBe('p1');
        expect(plant.location).toBe('Site A');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}/plants/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlant);
    });
  });
});

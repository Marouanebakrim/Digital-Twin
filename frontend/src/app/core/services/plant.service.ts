import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import { Plant } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PlantService {
  private http = inject(HttpClient);

  getPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${API_CONFIG.baseUrl}/plants`);
  }

  getPlantById(id: string): Observable<Plant> {
    return this.http.get<Plant>(`${API_CONFIG.baseUrl}/plants/${id}`);
  }
}

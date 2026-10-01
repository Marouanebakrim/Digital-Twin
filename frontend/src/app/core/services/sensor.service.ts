import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import { Sensor, SensorReading, SubmitReadingRequest } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private http = inject(HttpClient);

  getSensorsByMachineId(machineId: string): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${API_CONFIG.baseUrl}/machines/${machineId}/sensors`);
  }

  getSensorById(id: string): Observable<Sensor> {
    return this.http.get<Sensor>(`${API_CONFIG.baseUrl}/sensors/${id}`);
  }

  getReadings(sensorId: string, from?: string, to?: string, limit: number = 50): Observable<SensorReading[]> {
    let url = `${API_CONFIG.baseUrl}/sensors/${sensorId}/readings?pageSize=${limit}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    if (to) url += `&to=${encodeURIComponent(to)}`;
    return this.http.get<SensorReading[]>(url);
  }

  submitReading(sensorId: string, request: SubmitReadingRequest): Observable<SensorReading> {
    return this.http.post<SensorReading>(`${API_CONFIG.baseUrl}/sensors/${sensorId}/readings`, request);
  }
}

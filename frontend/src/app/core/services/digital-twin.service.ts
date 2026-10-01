import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import { DashboardSummary, PlantTopology, CurrentMachineState, ImpactAnalysisResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DigitalTwinService {
  private http = inject(HttpClient);

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${API_CONFIG.baseUrl}/digital-twin/summary`);
  }

  getPlantTopology(): Observable<PlantTopology> {
    return this.http.get<PlantTopology>(`${API_CONFIG.baseUrl}/digital-twin`);
  }

  getCurrentMachineState(machineId: string): Observable<CurrentMachineState> {
    return this.http.get<CurrentMachineState>(`${API_CONFIG.baseUrl}/digital-twin/machines/${machineId}/current-state`);
  }

  getImpactAnalysis(machineId: string): Observable<ImpactAnalysisResult> {
    return this.http.get<ImpactAnalysisResult>(`${API_CONFIG.baseUrl}/impact-analysis/${machineId}`);
  }

  getImpactAnalysisByCode(machineCode: string): Observable<ImpactAnalysisResult> {
    return this.http.get<ImpactAnalysisResult>(`${API_CONFIG.baseUrl}/impact-analysis/by-code/${machineCode}`);
  }
}

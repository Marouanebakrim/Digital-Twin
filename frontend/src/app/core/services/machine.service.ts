import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import { MachineSummary, MachineDetail, MachineRelation } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);

  getMachines(): Observable<MachineSummary[]> {
    return this.http.get<MachineSummary[]>(`${API_CONFIG.baseUrl}/machines`);
  }

  getMachineById(id: string): Observable<MachineDetail> {
    return this.http.get<MachineDetail>(`${API_CONFIG.baseUrl}/machines/${id}`);
  }

  getMachineRelations(id: string): Observable<MachineRelation[]> {
    return this.http.get<MachineRelation[]>(`${API_CONFIG.baseUrl}/machines/${id}/relations`);
  }
}

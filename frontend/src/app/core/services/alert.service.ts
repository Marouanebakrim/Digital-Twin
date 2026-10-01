import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';
import { AlertItem, AlertSeverity } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);

  getAlerts(acknowledged?: boolean, machineId?: string, severity?: AlertSeverity): Observable<AlertItem[]> {
    let params = new HttpParams();
    if (acknowledged !== undefined) params = params.set('acknowledged', acknowledged.toString());
    if (machineId) params = params.set('machineId', machineId);
    if (severity) params = params.set('severity', severity);

    return this.http.get<AlertItem[]>(`${API_CONFIG.baseUrl}/alerts`, { params });
  }

  getAlertById(id: string): Observable<AlertItem> {
    return this.http.get<AlertItem>(`${API_CONFIG.baseUrl}/alerts/${id}`);
  }

  acknowledgeAlert(id: string, acknowledgedBy: string = 'Operator'): Observable<AlertItem> {
    return this.http.post<AlertItem>(`${API_CONFIG.baseUrl}/alerts/${id}/acknowledge`, { acknowledgedBy });
  }
}

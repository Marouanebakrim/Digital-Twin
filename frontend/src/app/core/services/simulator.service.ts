import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from './api.config';
import { SimulatorStatus } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  private http = inject(HttpClient);

  getStatus(): Observable<SimulatorStatus> {
    return this.http.get<SimulatorStatus>(`${API_CONFIG.simulatorUrl}/status`);
  }

  setMode(mode: 'normal' | 'warning' | 'critical' | 'scenario'): Observable<{ message: string; mode: string }> {
    return this.http.post<{ message: string; mode: string }>(
      `${API_CONFIG.simulatorUrl}/mode`,
      { mode }
    ).pipe(
      tap(() => {
        // BUG FIX #3: When resetting to normal, immediately call the API reset endpoint
        // to restore all machines to Running status and resolve open alerts via SignalR.
        // This avoids waiting for the next simulator tick cycle to clean up state.
        if (mode === 'normal') {
          this.http.post(`${API_CONFIG.baseUrl}/machines/reset-scenario`, {}).subscribe({
            next: (result: any) => console.log('[SimulatorService] Scenario reset:', result?.message),
            error: (err) => console.warn('[SimulatorService] Reset-scenario call failed (non-blocking):', err)
          });
        }
      })
    );
  }
}
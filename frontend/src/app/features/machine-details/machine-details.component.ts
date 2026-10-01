import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SensorService } from '../../core/services/sensor.service';
import { AlertService } from '../../core/services/alert.service';
import { SignalrService } from '../../core/services/signalr.service';
import { CurrentMachineState, SensorReading, AlertItem } from '../../core/models/models';
import { MachineStatusBadgeComponent } from '../../shared/components/machine-status-badge/machine-status-badge.component';
import { SensorCardComponent } from '../../shared/components/sensor-card/sensor-card.component';
import { SensorChartComponent } from '../../shared/components/sensor-chart/sensor-chart.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-machine-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MachineStatusBadgeComponent,
    SensorCardComponent,
    SensorChartComponent,
    TimeAgoPipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Back Navigation & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <a
            routerLink="/machines"
            class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back
          </a>
          <div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                {{ state?.machineCode || '...' }}
              </span>
              <h2 class="text-2xl font-black text-white tracking-tight">
                {{ state?.machineName || 'Machine Telemetry' }}
              </h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Type: {{ state?.machineType }} | Dynamic Sensor & Telemetry Monitor
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3" *ngIf="state">
          <app-machine-status-badge [status]="state.status"></app-machine-status-badge>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-12 text-center glass-panel rounded-2xl">
        <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-slate-400 mt-3 font-mono">Loading dynamic sensors and live state...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
        <p class="font-bold">Error loading machine state</p>
        <p class="text-xs text-rose-300 mt-1">{{ errorMessage }}</p>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !errorMessage && state" class="space-y-6">
        <!-- Identity Banner -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-500">Active Sensors</p>
              <p class="text-xl font-bold text-white font-mono">{{ state.sensorValues.length }}</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-500">Active Alerts</p>
              <p class="text-xl font-bold" [class.text-amber-400]="state.activeAlertCount > 0" [class.text-slate-300]="state.activeAlertCount === 0">
                {{ state.activeAlertCount }}
              </p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-500">Critical Alerts</p>
              <p class="text-xl font-bold" [class.text-rose-400]="state.criticalAlertCount > 0" [class.text-slate-300]="state.criticalAlertCount === 0">
                {{ state.criticalAlertCount }}
              </p>
            </div>
          </div>

          <div class="text-right text-xs text-slate-400 font-mono">
            <span>Live Telemetry Timestamp: {{ state.computedAt | date:'HH:mm:ss' }}</span>
          </div>
        </div>

        <!-- DYNAMIC SENSOR CARDS GRID -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Dynamic Sensor Telemetry ({{ state.sensorValues.length }})
            </h3>
            <span class="text-xs text-slate-400">Purely data-driven from API</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <app-sensor-card
              *ngFor="let s of state.sensorValues"
              [sensor]="s"
            ></app-sensor-card>
          </div>
        </div>

        <!-- HISTORICAL SENSOR TREND CHARTS WITH THRESHOLDS -->
        <div>
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Real-time Sensor Telemetry Trends & Threshold Violations
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-sensor-chart
              *ngFor="let s of state.sensorValues"
              [title]="s.sensorName"
              [unit]="s.unit"
              [readings]="sensorHistories[s.sensorId] || []"
              [minValue]="s.minValue"
              [maxValue]="s.maxValue"
            ></app-sensor-chart>
          </div>
        </div>

        <!-- INCIDENT & ALERTS AUDIT TRAIL FOR THIS MACHINE -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-extrabold text-white flex items-center gap-2 font-mono uppercase">
                <span>Incident & Alerts History ({{ machineAlerts.length }})</span>
              </h3>
              <p class="text-xs text-slate-400 font-mono mt-0.5">
                Complete historical record of threshold breaches, severity levels & resolution timestamps
              </p>
            </div>
            <a routerLink="/alerts" class="text-xs text-cyan-400 hover:underline font-mono">
              Alerts Feed &rarr;
            </a>
          </div>

          <div *ngIf="machineAlerts.length === 0" class="p-6 text-center text-slate-500 text-xs font-mono border border-slate-800/80 rounded-xl bg-slate-950/40">
            No alerts recorded for this machine.
          </div>

          <div *ngIf="machineAlerts.length > 0" class="space-y-3">
            <div
              *ngFor="let a of machineAlerts"
              class="p-4 rounded-xl border transition-all duration-200 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              [ngClass]="{
                'border-rose-500/50 bg-rose-950/15': a.severity === 'Critical' && !a.resolvedAt,
                'border-amber-500/50 bg-amber-950/15': a.severity === 'Warning' && !a.resolvedAt,
                'border-slate-800/80 opacity-75': !!a.resolvedAt
              }"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase"
                    [ngClass]="{
                      'bg-rose-500 text-white': a.severity === 'Critical',
                      'bg-amber-500 text-black': a.severity === 'Warning',
                      'bg-slate-700 text-slate-200': a.severity !== 'Critical' && a.severity !== 'Warning'
                    }"
                  >
                    {{ a.severity }}
                  </span>
                  <span *ngIf="a.resolvedAt" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    RESOLVED
                  </span>
                  <span class="text-xs font-bold text-white">{{ a.title }}</span>
                </div>
                <p class="text-xs text-slate-300 font-mono">{{ a.message }}</p>
                <div class="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span>Created: {{ a.createdAt | timeAgo }} ({{ a.createdAt | date:'HH:mm:ss' }})</span>
                  <span *ngIf="a.resolvedAt" class="text-emerald-400">Resolved: {{ a.resolvedAt | date:'HH:mm:ss' }}</span>
                  <span *ngIf="a.isAcknowledged" class="text-cyan-400">Ack by: {{ a.acknowledgedBy }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MachineDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private digitalTwinService = inject(DigitalTwinService);
  private sensorService = inject(SensorService);
  private alertService = inject(AlertService);
  private signalr = inject(SignalrService);

  machineId: string = '';
  state: CurrentMachineState | null = null;
  sensorHistories: Record<string, SensorReading[]> = {};
  machineAlerts: AlertItem[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.machineId = params['id'];
      if (this.machineId) {
        this.loadMachineState();
        this.loadMachineAlerts();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.state?.machineCode) {
      this.signalr.leaveMachineGroup(this.state.machineCode);
    }
  }

  loadMachineState(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.digitalTwinService.getCurrentMachineState(this.machineId).subscribe({
      next: state => {
        this.state = state;
        this.isLoading = false;

        // Join SignalR group for real-time telemetry updates
        this.signalr.joinMachineGroup(state.machineCode);

        // Fetch history for each sensor dynamically
        state.sensorValues.forEach(sensor => {
          this.loadSensorHistory(sensor.sensorId);
        });

        this.subscribeRealtime();
      },
      error: err => {
        this.errorMessage = err?.message || 'Could not fetch machine state';
        this.isLoading = false;
      }
    });
  }

  loadMachineAlerts(): void {
    this.alertService.getAlerts(undefined, this.machineId).subscribe({
      next: alerts => {
        this.machineAlerts = alerts;
      },
      error: () => {}
    });
  }

  private loadSensorHistory(sensorId: string): void {
    this.sensorService.getReadings(sensorId, undefined, undefined, 20).subscribe({
      next: readings => {
        this.sensorHistories[sensorId] = readings;
      },
      error: () => {}
    });
  }

  private subscribeRealtime(): void {
    // Listen to SensorReadingUpdated
    const subReading = this.signalr.sensorReading$.subscribe(payload => {
      if (!this.state || payload.machineId !== this.machineId) return;

      const s = this.state.sensorValues.find(x => x.sensorId === payload.sensorId);
      if (s) {
        s.value = payload.value;
        s.timestamp = payload.timestamp;
        if (payload.alertInfo) {
          s.isAnomaly = true;
          s.severity = payload.alertInfo.severity;
        } else {
          s.isAnomaly = false;
          s.severity = undefined;
        }

        const history = this.sensorHistories[s.sensorId] || [];
        const newReading: SensorReading = {
          id: Math.random().toString(),
          sensorId: s.sensorId,
          value: s.value,
          unit: s.unit,
          timestamp: s.timestamp,
          quality: 'Good',
          isAnomaly: s.isAnomaly
        };

        this.sensorHistories[s.sensorId] = [...history.slice(-19), newReading];
      }
    });

    // Listen to MachineStateUpdated
    const subState = this.signalr.machineState$.subscribe(updatedState => {
      if (updatedState.machineId === this.machineId) {
        this.state = updatedState;
      }
    });

    // Listen to MachineStatusChanged
    const subStatus = this.signalr.status$.subscribe(payload => {
      if (this.state && payload.machineId === this.machineId) {
        this.state.status = payload.newStatus;
      }
    });

    // Listen to AlertCreated
    const subAlert = this.signalr.alertCreated$.subscribe(alert => {
      if (alert.machineId === this.machineId) {
        this.machineAlerts = [alert, ...this.machineAlerts];
      }
    });

    this.subscriptions.push(subReading, subState, subStatus, subAlert);
  }
}

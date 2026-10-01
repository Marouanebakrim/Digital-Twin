import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';
import { SignalrService } from '../../core/services/signalr.service';
import { AlertItem, AlertSeverity } from '../../core/models/models';
import { AlertTableComponent } from '../../shared/components/alert-table/alert-table.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, AlertTableComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Industrial Alerts Journal</h2>
          <p class="text-xs text-slate-400 mt-1">Real-time threshold violations & machine anomaly feed</p>
        </div>
        <button
          (click)="loadAlerts()"
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
        >
          Refresh Alerts
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="glass-panel p-2 rounded-xl border border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <button
          *ngFor="let f of filters"
          (click)="currentFilter = f.id; loadAlerts()"
          [class]="currentFilter === f.id ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'"
          class="px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-12 text-center glass-panel rounded-2xl">
        <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-slate-400 mt-3 font-mono">Fetching active alerts...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
        <p class="font-bold">Error loading alerts</p>
        <p class="text-xs text-rose-300 mt-1">{{ errorMessage }}</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !errorMessage && alerts.length === 0" class="p-12 text-center glass-panel rounded-2xl border border-slate-800">
        <svg class="w-12 h-12 text-emerald-500/60 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 class="text-base font-bold text-white mt-3">No Active Alerts</h4>
        <p class="text-xs text-slate-400 mt-1">All industrial machines and sensors are operating within normal thresholds.</p>
      </div>

      <!-- Content Table -->
      <div *ngIf="!isLoading && !errorMessage && alerts.length > 0" class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <app-alert-table
          [alerts]="alerts"
          (acknowledge)="onAcknowledgeAlert($event)"
        ></app-alert-table>
      </div>
    </div>
  `
})
export class AlertsComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private signalr = inject(SignalrService);

  alerts: AlertItem[] = [];
  currentFilter: string = 'ALL';
  isLoading: boolean = true;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  filters = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'ACTIVE', label: '● Active (Unacknowledged)' },
    { id: 'WARNING', label: 'Warning' },
    { id: 'CRITICAL', label: 'Critical' },
    { id: 'ACKNOWLEDGED', label: '✓ Acknowledged' }
  ];

  ngOnInit(): void {
    this.loadAlerts();
    this.subscribeRealtime();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadAlerts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    let ackFilter: boolean | undefined = undefined;
    let severityFilter: AlertSeverity | undefined = undefined;

    if (this.currentFilter === 'ACTIVE') ackFilter = false;
    if (this.currentFilter === 'ACKNOWLEDGED') ackFilter = true;
    if (this.currentFilter === 'WARNING') severityFilter = 'Warning';
    if (this.currentFilter === 'CRITICAL') severityFilter = 'Critical';

    this.alertService.getAlerts(ackFilter, undefined, severityFilter).subscribe({
      next: data => {
        this.alerts = data;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = err?.message || 'Failed to fetch alerts';
        this.isLoading = false;
      }
    });
  }

  onAcknowledgeAlert(alertId: string): void {
    this.alertService.acknowledgeAlert(alertId, 'Shift Supervisor').subscribe({
      next: updated => {
        const item = this.alerts.find(a => a.id === alertId);
        if (item) {
          item.isAcknowledged = true;
          item.acknowledgedBy = updated.acknowledgedBy || 'Shift Supervisor';
          item.acknowledgedAt = updated.acknowledgedAt || new Date().toISOString();
        }
      },
      error: err => console.error('Failed to acknowledge alert', err)
    });
  }

  private subscribeRealtime(): void {
    // Automatically prepend new SignalR alerts to the list
    const subAlert = this.signalr.alertCreated$.subscribe(newAlert => {
      this.alerts = [newAlert, ...this.alerts];
    });

    this.subscriptions.push(subAlert);
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertItem } from '../../../core/models/models';
import { AlertBadgeComponent } from '../alert-badge/alert-badge.component';

@Component({
  selector: 'app-alert-notification',
  standalone: true,
  imports: [CommonModule, AlertBadgeComponent],
  template: `
    <div
      *ngIf="alert"
      class="fixed bottom-6 right-6 z-50 max-w-md w-full glass-card p-4 rounded-xl border border-rose-500/50 shadow-2xl status-critical-glow animate-bounce-short transition-all duration-300"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <app-alert-badge [severity]="alert.severity"></app-alert-badge>
          <span class="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
            {{ alert.machineCode }}
          </span>
        </div>
        <button
          (click)="dismiss.emit()"
          class="text-slate-400 hover:text-white transition-colors p-1"
        >
          ✕
        </button>
      </div>

      <h5 class="text-sm font-bold text-white mt-2">{{ alert.title }}</h5>
      <p class="text-xs text-slate-300 mt-1 leading-relaxed">{{ alert.message }}</p>

      <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <span>Machine: <strong class="text-slate-200">{{ alert.machineName }}</strong></span>
        <span>Just now</span>
      </div>
    </div>
  `
})
export class AlertNotificationComponent {
  @Input() alert: AlertItem | null = null;
  @Output() dismiss = new EventEmitter<void>();
}

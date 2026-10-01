import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertItem } from '../../../core/models/models';
import { AlertBadgeComponent } from '../alert-badge/alert-badge.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-alert-table',
  standalone: true,
  imports: [CommonModule, AlertBadgeComponent, TimeAgoPipe],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300 border-collapse">
        <thead class="text-xs uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800 tracking-wider">
          <tr>
            <th class="py-3.5 px-4 font-semibold">Severity</th>
            <th class="py-3.5 px-4 font-semibold">Machine</th>
            <th class="py-3.5 px-4 font-semibold">Sensor</th>
            <th class="py-3.5 px-4 font-semibold">Title & Message</th>
            <th class="py-3.5 px-4 font-semibold">Timestamp</th>
            <th class="py-3.5 px-4 font-semibold">Resolution / Ack</th>
            <th class="py-3.5 px-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          <tr *ngFor="let a of alerts" class="hover:bg-slate-800/40 transition-colors" [class.opacity-80]="!!a.resolvedAt">
            <td class="py-3.5 px-4">
              <app-alert-badge [severity]="a.severity"></app-alert-badge>
            </td>
            <td class="py-3.5 px-4 font-mono font-bold text-cyan-400">
              {{ a.machineCode }}
              <span class="block text-xs font-sans text-slate-400 font-normal">{{ a.machineName }}</span>
            </td>
            <td class="py-3.5 px-4 font-medium text-slate-300">
              {{ a.sensorName || 'Machine Sensor' }}
            </td>
            <td class="py-3.5 px-4 max-w-md">
              <p class="font-bold text-white text-xs">{{ a.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5 line-clamp-2 font-mono">{{ a.message }}</p>
            </td>
            <td class="py-3.5 px-4 text-xs font-mono text-slate-400">
              {{ a.createdAt | timeAgo }}
              <span class="block text-[10px] text-slate-500">{{ a.createdAt | date:'HH:mm:ss' }}</span>
            </td>
            <td class="py-3.5 px-4 space-y-1">
              <span
                *ngIf="a.resolvedAt"
                class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
              >
                ✓ Resolved ({{ a.resolvedAt | date:'HH:mm:ss' }})
              </span>
              <span
                *ngIf="!a.resolvedAt && a.isAcknowledged"
                class="inline-flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20"
              >
                ✓ Ack by {{ a.acknowledgedBy || 'Operator' }}
              </span>
              <span
                *ngIf="!a.resolvedAt && !a.isAcknowledged"
                class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse"
              >
                ● Active Anomaly
              </span>
            </td>
            <td class="py-3.5 px-4 text-right">
              <button
                *ngIf="!a.isAcknowledged && !a.resolvedAt"
                (click)="acknowledge.emit(a.id)"
                class="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all shadow-sm hover:shadow-cyan-500/20"
              >
                Acknowledge
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class AlertTableComponent {
  @Input({ required: true }) alerts: AlertItem[] = [];
  @Output() acknowledge = new EventEmitter<string>();
}

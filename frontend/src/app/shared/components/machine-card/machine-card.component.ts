import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MachineSummary } from '../../../core/models/models';
import { MachineStatusBadgeComponent } from '../machine-status-badge/machine-status-badge.component';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MachineStatusBadgeComponent],
  template: `
    <div
      [routerLink]="['/machines', machine.id]"
      class="glass-card rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative"
    >
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {{ machine.code }}
            </span>
            <span class="text-xs text-slate-400 font-medium">{{ machine.type }}</span>
          </div>
          <h4 class="text-lg font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
            {{ machine.name }}
          </h4>
        </div>
        <app-machine-status-badge [status]="machine.status"></app-machine-status-badge>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>{{ machine.sensorCount }} Sensors</span>
        </div>

        <div class="flex items-center gap-1.5" [class.text-amber-400]="machine.activeAlerts > 0">
          <svg class="w-4 h-4" [class.text-amber-400]="machine.activeAlerts > 0" [class.text-slate-500]="machine.activeAlerts === 0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ machine.activeAlerts }} Alerts</span>
        </div>
      </div>
    </div>
  `
})
export class MachineCardComponent {
  @Input({ required: true }) machine!: MachineSummary;
}

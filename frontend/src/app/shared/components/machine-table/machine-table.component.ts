import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineSummary } from '../../../core/models/models';
import { MachineStatusBadgeComponent } from '../machine-status-badge/machine-status-badge.component';

@Component({
  selector: 'app-machine-table',
  standalone: true,
  imports: [CommonModule, MachineStatusBadgeComponent],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300 border-collapse">
        <thead class="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800 tracking-wider">
          <tr>
            <th class="py-3.5 px-4 font-semibold">Code</th>
            <th class="py-3.5 px-4 font-semibold">Name</th>
            <th class="py-3.5 px-4 font-semibold">Type</th>
            <th class="py-3.5 px-4 font-semibold">Status</th>
            <th class="py-3.5 px-4 font-semibold">Location</th>
            <th class="py-3.5 px-4 font-semibold">Sensors</th>
            <th class="py-3.5 px-4 font-semibold">Active Alerts</th>
            <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          <tr
            *ngFor="let m of machines"
            (click)="selectMachine.emit(m.id)"
            class="hover:bg-slate-800/40 transition-colors cursor-pointer group"
          >
            <td class="py-3.5 px-4 font-mono font-bold text-cyan-400">
              {{ m.code }}
            </td>
            <td class="py-3.5 px-4 font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {{ m.name }}
            </td>
            <td class="py-3.5 px-4 text-slate-400">
              {{ m.type }}
            </td>
            <td class="py-3.5 px-4">
              <app-machine-status-badge [status]="m.status"></app-machine-status-badge>
            </td>
            <td class="py-3.5 px-4 text-slate-400">
              {{ m.location || 'N/A' }}
            </td>
            <td class="py-3.5 px-4 text-slate-400">
              {{ m.sensorCount }}
            </td>
            <td class="py-3.5 px-4">
              <span
                class="px-2 py-0.5 rounded text-xs font-bold"
                [class]="m.activeAlerts > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500'"
              >
                {{ m.activeAlerts }}
              </span>
            </td>
            <td class="py-3.5 px-4 text-right">
              <span class="text-xs font-semibold text-cyan-400 group-hover:underline">
                View Details &rarr;
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class MachineTableComponent {
  @Input({ required: true }) machines: MachineSummary[] = [];
  @Output() selectMachine = new EventEmitter<string>();
}

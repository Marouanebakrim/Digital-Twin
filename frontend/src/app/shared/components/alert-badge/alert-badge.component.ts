import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertSeverity } from '../../../core/models/models';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      {{ severity }}
    </span>
  `
})
export class AlertBadgeComponent {
  @Input({ required: true }) severity: AlertSeverity = 'Info';

  get badgeClass(): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ';
    switch (this.severity) {
      case 'Critical':
        return base + 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
      case 'Warning':
        return base + 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      default:
        return base + 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
    }
  }
}

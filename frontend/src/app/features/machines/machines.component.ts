import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MachineService } from '../../core/services/machine.service';
import { MachineSummary, MachineStatus } from '../../core/models/models';
import { MachineTableComponent } from '../../shared/components/machine-table/machine-table.component';
import { MachineCardComponent } from '../../shared/components/machine-card/machine-card.component';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MachineTableComponent,
    MachineCardComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header & Search/Filter Controls -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight">Machine Fleet Inventory</h2>
          <p class="text-xs text-slate-400 mt-1">Comprehensive catalogue of active mining & processing machinery</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center">
            <button
              (click)="viewMode = 'table'"
              [class]="viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded text-xs font-semibold transition-all"
            >
              Table
            </button>
            <button
              (click)="viewMode = 'grid'"
              [class]="viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded text-xs font-semibold transition-all"
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        <!-- Search Input -->
        <div class="relative flex-1 w-full">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by code, name, or location..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <svg class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter Selects -->
        <div class="flex items-center gap-3 w-full md:w-auto">
          <!-- Status Filter -->
          <select
            [(ngModel)]="selectedStatus"
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
            <option value="Stopped">Stopped</option>
          </select>

          <!-- Type Filter -->
          <select
            [(ngModel)]="selectedType"
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            <option value="BucketWheel">BucketWheel</option>
            <option value="Crusher">Crusher</option>
            <option value="Conveyor">Conveyor</option>
            <option value="Reactor">Reactor</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-12 text-center glass-panel rounded-2xl">
        <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-slate-400 mt-3 font-mono">Loading machines list...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
        <p class="font-bold">Error loading machines</p>
        <p class="text-xs text-rose-300 mt-1">{{ errorMessage }}</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !errorMessage && filteredMachines.length === 0" class="p-12 text-center glass-panel rounded-2xl border border-slate-800">
        <svg class="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.428 1.428l-.4 1.6a2 2 0 001.428 2.372l11.4 1.9a2 2 0 002.372-1.428l.456-1.824zM12 4a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
        <h4 class="text-base font-bold text-white mt-3">No machines match criteria</h4>
        <p class="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
      </div>

      <!-- Content Table / Grid -->
      <div *ngIf="!isLoading && !errorMessage && filteredMachines.length > 0">
        <div *ngIf="viewMode === 'table'" class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <app-machine-table
            [machines]="filteredMachines"
            (selectMachine)="onSelectMachine($event)"
          ></app-machine-table>
        </div>

        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-machine-card
            *ngFor="let m of filteredMachines"
            [machine]="m"
          ></app-machine-card>
        </div>
      </div>
    </div>
  `
})
export class MachinesComponent implements OnInit {
  private machineService = inject(MachineService);
  private router = inject(Router);

  machines: MachineSummary[] = [];
  searchQuery: string = '';
  selectedStatus: string = 'ALL';
  selectedType: string = 'ALL';
  viewMode: 'table' | 'grid' = 'table';
  isLoading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadMachines();
  }

  loadMachines(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.machineService.getMachines().subscribe({
      next: data => {
        this.machines = data;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = err?.message || 'Failed to fetch machines from backend';
        this.isLoading = false;
      }
    });
  }

  get filteredMachines(): MachineSummary[] {
    return this.machines.filter(m => {
      const matchSearch = !this.searchQuery ||
        m.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (m.location && m.location.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchStatus = this.selectedStatus === 'ALL' || m.status === this.selectedStatus;
      const matchType = this.selectedType === 'ALL' || m.type === this.selectedType;

      return matchSearch && matchStatus && matchType;
    });
  }

  onSelectMachine(id: string): void {
    this.router.navigate(['/machines', id]);
  }
}

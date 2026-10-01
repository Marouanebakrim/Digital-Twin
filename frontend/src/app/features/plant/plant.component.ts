import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data/standalone';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SignalrService } from '../../core/services/signalr.service';
import { PlantTopology, MachineNode, MachineRelation, MachineStatus } from '../../core/models/models';
import { MachineStatusBadgeComponent } from '../../shared/components/machine-status-badge/machine-status-badge.component';
import { Subscription } from 'rxjs';

export interface VisNodeData {
  id: string;
  label: string;
  title: string;
  shape: string;
  margin?: { top: number; bottom: number; left: number; right: number };
  color: {
    background: string;
    border: string;
    highlight: { background: string; border: string };
    hover: { background: string; border: string };
  };
  font: {
    color: string;
    size: number;
    face: string;
    multi: string;
    bold?: { color: string; size: number; face: string };
  };
  borderWidth: number;
  borderWidthSelected: number;
  shadow: { enabled: boolean; color: string; size: number; x: number; y: number };
  shapeProperties: { borderRadius: number };
  level?: number;
}

export interface VisEdgeData {
  id: string;
  from: string;
  to: string;
  label: string;
  arrows: { to: { enabled: boolean; scaleFactor: number; type: string } };
  color: { color: string; highlight: string; hover: string };
  font: { color: string; size: number; face: string; background: string; strokeWidth: number };
  smooth: { enabled?: boolean; type: string; roundness: number };
  width: number;
  title?: string;
  shadow?: { enabled: boolean; color: string; size: number };
}

@Component({
  selector: 'app-plant',
  standalone: true,
  imports: [CommonModule, MachineStatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Digital Twin Map
            </span>
            <span *ngIf="topology" class="text-xs text-slate-500 font-mono">
              Plant ID: {{ topology.plantId }}
            </span>
          </div>
          <h2 class="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Plant Topology Graph</span>
            <span *ngIf="topology" class="text-lg font-normal text-slate-400">({{ topology.plantName }})</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Dynamic Node-Edge relational map showing material FEEDS pipeline, machine statuses & telemetry health.
          </p>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              (click)="setLayout('hierarchical')"
              [ngClass]="activeLayout === 'hierarchical' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:text-white"
              title="Directed Process Pipeline Flow (FEEDS)"
            >
              Process Flow
            </button>
            <button
              (click)="setLayout('tree')"
              [ngClass]="activeLayout === 'tree' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:text-white"
              title="Plant Hierarchy Tree"
            >
              Hierarchy
            </button>
            <button
              (click)="setLayout('physics')"
              [ngClass]="activeLayout === 'physics' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:text-white"
              title="Organic Force-Directed Graph"
            >
              Free Layout
            </button>
          </div>

          <!-- Zoom & Fit Controls -->
          <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              (click)="zoomIn()"
              class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom In"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              (click)="zoomOut()"
              class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom Out"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
              </svg>
            </button>
            <button
              (click)="fitGraph()"
              class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Fit to Screen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          <button
            (click)="loadTopology()"
            [disabled]="isLoading"
            class="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" [class.animate-spin]="isLoading" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reload</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-16 text-center glass-panel rounded-2xl border border-slate-800">
        <div class="inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-semibold text-white mt-4">Building dynamic plant topology graph...</p>
        <p class="text-xs text-slate-400 mt-1 font-mono">Fetching latest nodes, machine relations & real-time telemetry from API</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm flex items-start gap-4">
        <div class="p-2 bg-rose-500/20 rounded-xl mt-0.5">
          <svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-bold text-rose-300">Error loading plant topology</p>
          <p class="text-xs text-rose-400/90 mt-1">{{ errorMessage }}</p>
          <button
            (click)="loadTopology()"
            class="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs font-semibold text-rose-200 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>

      <!-- Graph Main Container -->
      <div *ngIf="!isLoading && !errorMessage && topology" class="space-y-4">
        <!-- Interactive Vis Network Canvas Card -->
        <div class="glass-panel rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col min-h-[580px] shadow-2xl">
          <!-- Top Info Banner -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Plant: {{ topology.plantName }}
                  </span>
                  <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {{ topology.nodes.length }} Nodes • {{ topology.edges.length }} Dataflow Edges
                  </span>
                </div>
                <h3 class="text-sm font-semibold text-slate-200 mt-0.5">
                  Live Production Stream & Material Flow Pipeline
                </h3>
              </div>
            </div>

            <!-- Quick Instructions -->
            <div class="hidden md:flex items-center gap-3 text-xs text-slate-400">
              <span class="inline-flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click node to open Machine Details (<strong>/machines/:id</strong>)
              </span>
            </div>
          </div>

          <!-- Canvas Container Element -->
          <div class="relative flex-1 w-full min-h-[500px] bg-[#0b0f19] select-none">
            <!-- Background Radial Glow -->
            <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
            
            <div
              #networkContainer
              class="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing"
              style="outline: none;"
            ></div>
          </div>

          <!-- Footer Status Bar & Legend -->
          <div class="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <!-- Legend Indicators -->
            <div class="flex items-center gap-5 flex-wrap">
              <span class="font-bold text-slate-300 font-mono text-[11px]">MACHINE STATUS:</span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20"></span>
                <span class="text-emerald-400 font-medium">RUNNING</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20"></span>
                <span class="text-amber-400 font-medium">WARNING</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-rose-500/20"></span>
                <span class="text-rose-400 font-medium">CRITICAL</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-500 ring-4 ring-slate-600/20"></span>
                <span class="text-slate-400 font-medium">STOPPED</span>
              </span>
            </div>

            <!-- Edge Relationship Note -->
            <div class="flex items-center gap-2 font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Relation: <strong>FEEDS</strong> (Material transfer pipeline)</span>
            </div>
          </div>
        </div>

        <!-- Node Cards Grid for fast direct access -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Pipeline Machines ({{ topology.nodes.length }})
            </h4>
            <span class="text-xs text-slate-400 font-mono">Click card to navigate</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              *ngFor="let node of topology.nodes"
              (click)="onNodeClick(node.id)"
              class="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group hover:-translate-y-1"
              [ngClass]="{
                'status-running-glow': node.status.toLowerCase() === 'running',
                'status-warning-glow': node.status.toLowerCase() === 'warning',
                'status-critical-glow': node.status.toLowerCase() === 'critical'
              }"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                  {{ node.code }}
                </span>
                <app-machine-status-badge [status]="node.status"></app-machine-status-badge>
              </div>

              <h5 class="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
                {{ node.name }}
              </h5>
              <p class="text-xs text-slate-400 mt-0.5">{{ node.type }}</p>

              <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Alerts</span>
                <span
                  class="px-1.5 py-0.2 rounded font-bold"
                  [ngClass]="node.activeAlerts > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500'"
                >
                  {{ node.activeAlerts }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlantComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer?: ElementRef<HTMLDivElement>;

  private digitalTwinService = inject(DigitalTwinService);
  private signalr = inject(SignalrService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  topology: PlantTopology | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  activeLayout: 'hierarchical' | 'tree' | 'physics' = 'hierarchical';

  private network: Network | null = null;
  private nodesDataSet: DataSet<VisNodeData> = new DataSet<VisNodeData>();
  private edgesDataSet: DataSet<VisEdgeData> = new DataSet<VisEdgeData>();
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadTopology();
    this.subscribeRealtime();
  }

  ngAfterViewInit(): void {
    if (this.topology && this.networkContainer) {
      this.initNetwork();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }

  loadTopology(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.digitalTwinService.getPlantTopology().subscribe({
      next: data => {
        this.topology = data;
        this.isLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.initNetwork();
        }, 50);
      },
      error: err => {
        this.errorMessage = err?.message || 'Failed to load plant topology graph';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setLayout(layout: 'hierarchical' | 'tree' | 'physics'): void {
    this.activeLayout = layout;
    if (this.network && this.topology) {
      this.buildGraphData();
      this.applyNetworkOptions();
    }
  }

  zoomIn(): void {
    if (this.network) {
      const scale = this.network.getScale();
      this.network.moveTo({ scale: scale * 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
    }
  }

  zoomOut(): void {
    if (this.network) {
      const scale = this.network.getScale();
      this.network.moveTo({ scale: scale * 0.7, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
    }
  }

  fitGraph(): void {
    if (this.network) {
      this.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  }

  onNodeClick(machineId: string): void {
    if (!machineId) return;
    this.router.navigate(['/machines', machineId]);
  }

  private initNetwork(): void {
    if (!this.networkContainer?.nativeElement || !this.topology) {
      return;
    }

    if (this.network) {
      this.network.destroy();
      this.network = null;
    }

    this.buildGraphData();

    const data: any = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet
    };

    const options = this.getNetworkOptions();
    this.network = new Network(this.networkContainer.nativeElement, data, options);

    // Event listener for node clicks
    this.network.on('click', (params: { nodes: string[] }) => {
      if (params.nodes && params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        // Only navigate if it's a machine node
        const isMachineNode = this.topology?.nodes.some(n => n.id === clickedId);
        if (isMachineNode) {
          this.onNodeClick(clickedId);
        }
      }
    });

    // Hover styling
    this.network.on('hoverNode', () => {
      if (this.networkContainer?.nativeElement) {
        this.networkContainer.nativeElement.style.cursor = 'pointer';
      }
    });

    this.network.on('blurNode', () => {
      if (this.networkContainer?.nativeElement) {
        this.networkContainer.nativeElement.style.cursor = 'default';
      }
    });

    // Fit once stabilized
    this.network.once('stabilizationIterationsDone', () => {
      this.fitGraph();
    });
  }

  private buildGraphData(): void {
    if (!this.topology) return;

    this.nodesDataSet.clear();
    this.edgesDataSet.clear();

    const visNodes: VisNodeData[] = [];
    const visEdges: VisEdgeData[] = [];

    if (this.activeLayout === 'tree') {
      // 1. Plant Root Node
      const plantNodeId = `plant-${this.topology.plantId}`;
      visNodes.push({
        id: plantNodeId,
        label: `🏭 <b>PLANT</b>\n${this.topology.plantName}`,
        title: `Plant: ${this.topology.plantName}`,
        shape: 'box',
        margin: { top: 12, bottom: 12, left: 18, right: 18 },
        color: {
          background: '#0f172a',
          border: '#06b6d4',
          highlight: { background: '#164e63', border: '#22d3ee' },
          hover: { background: '#164e63', border: '#22d3ee' }
        },
        font: {
          color: '#ffffff',
          size: 14,
          face: 'Inter, system-ui, sans-serif',
          multi: 'html',
          bold: { color: '#38bdf8', size: 15, face: 'Inter, monospace' }
        },
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: { enabled: true, color: 'rgba(6,182,212,0.4)', size: 10, x: 0, y: 4 },
        shapeProperties: { borderRadius: 12 },
        level: 1
      });

      // 2. Production Line nodes
      const lineMap = new Map<string, string>();
      this.topology.nodes.forEach(n => {
        const lineId = n.productionLineId || 'default-line';
        const lineName = n.productionLineName || 'Production Line 01';
        lineMap.set(lineId, lineName);
      });

      lineMap.forEach((lineName, lineId) => {
        const fullLineId = `line-${lineId}`;
        visNodes.push({
          id: fullLineId,
          label: `⚙️ <b>PRODUCTION LINE</b>\n${lineName}`,
          title: `Line: ${lineName}`,
          shape: 'box',
          margin: { top: 10, bottom: 10, left: 16, right: 16 },
          color: {
            background: '#1e1b4b',
            border: '#818cf8',
            highlight: { background: '#312e81', border: '#a5b4fc' },
            hover: { background: '#312e81', border: '#a5b4fc' }
          },
          font: {
            color: '#ffffff',
            size: 13,
            face: 'Inter, system-ui, sans-serif',
            multi: 'html',
            bold: { color: '#a5b4fc', size: 13, face: 'Inter, monospace' }
          },
          borderWidth: 2,
          borderWidthSelected: 3,
          shadow: { enabled: true, color: 'rgba(99,102,241,0.3)', size: 8, x: 0, y: 3 },
          shapeProperties: { borderRadius: 10 },
          level: 2
        });

        // Edge Plant -> Line
        visEdges.push({
          id: `edge-${plantNodeId}-${fullLineId}`,
          from: plantNodeId,
          to: fullLineId,
          label: 'CONTAINS',
          arrows: { to: { enabled: true, scaleFactor: 1, type: 'arrow' } },
          color: { color: '#818cf8', highlight: '#a5b4fc', hover: '#c7d2fe' },
          font: { color: '#c7d2fe', size: 10, face: 'monospace', background: '#0f172a', strokeWidth: 0 },
          smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 },
          width: 2
        });
      });

      // 3. Machine Nodes in Tree layout
      this.topology.nodes.forEach(node => {
        const lineNodeId = `line-${node.productionLineId || 'default-line'}`;
        const nodeStyling = this.getNodeColors(node.status);

        visNodes.push({
          id: node.id,
          label: `<b>${node.code}</b>\n${node.name}\n[${node.status.toUpperCase()}]` +
                 (node.activeAlerts > 0 ? `\n⚠️ Alerts: ${node.activeAlerts}` : ''),
          title: `<b>${node.code} - ${node.name}</b><br/>Type: ${node.type}<br/>Status: ${node.status}<br/>Alerts: ${node.activeAlerts}<br/><i>Click to open details</i>`,
          shape: 'box',
          margin: { top: 10, bottom: 10, left: 14, right: 14 },
          color: nodeStyling.color,
          font: {
            color: nodeStyling.textColor,
            size: 12,
            face: 'Inter, system-ui, sans-serif',
            multi: 'html',
            bold: { color: '#ffffff', size: 13, face: 'Inter, monospace' }
          },
          borderWidth: 2,
          borderWidthSelected: 4,
          shadow: { enabled: true, color: nodeStyling.shadowColor, size: 8, x: 0, y: 3 },
          shapeProperties: { borderRadius: 8 },
          level: 3
        });

        // Edge Line -> Machine
        visEdges.push({
          id: `edge-${lineNodeId}-${node.id}`,
          from: lineNodeId,
          to: node.id,
          label: 'INCLUDES',
          arrows: { to: { enabled: true, scaleFactor: 1, type: 'arrow' } },
          color: { color: '#64748b', highlight: '#94a3b8', hover: '#cbd5e1' },
          font: { color: '#94a3b8', size: 9, face: 'monospace', background: '#0f172a', strokeWidth: 0 },
          smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 },
          width: 1.5
        });
      });
    } else {
      // Process Flow or Physics Layout
      this.topology.nodes.forEach((node, index) => {
        const nodeStyling = this.getNodeColors(node.status);

        visNodes.push({
          id: node.id,
          label: `<b>${node.code}</b>\n${node.name}\n[${node.status.toUpperCase()}]` +
                 (node.activeAlerts > 0 ? `\n⚠️ Alerts: ${node.activeAlerts}` : ''),
          title: `<b>${node.code} - ${node.name}</b><br/>Type: ${node.type}<br/>Status: ${node.status}<br/>Active Alerts: ${node.activeAlerts}<br/><i>Click to open details (/machines/${node.id})</i>`,
          shape: 'box',
          margin: { top: 12, bottom: 12, left: 16, right: 16 },
          color: nodeStyling.color,
          font: {
            color: nodeStyling.textColor,
            size: 12,
            face: 'Inter, system-ui, sans-serif',
            multi: 'html',
            bold: { color: '#ffffff', size: 14, face: 'Inter, monospace' }
          },
          borderWidth: 2,
          borderWidthSelected: 4,
          shadow: { enabled: true, color: nodeStyling.shadowColor, size: 10, x: 0, y: 4 },
          shapeProperties: { borderRadius: 10 },
          level: index + 1
        });
      });

      // Add FEEDS & other relations from API
      this.topology.edges.forEach(edge => {
        visEdges.push({
          id: edge.id,
          from: edge.sourceMachineId,
          to: edge.targetMachineId,
          label: edge.relationType || 'FEEDS',
          arrows: {
            to: { enabled: true, scaleFactor: 1.2, type: 'arrow' }
          },
          color: {
            color: '#06b6d4',
            highlight: '#38bdf8',
            hover: '#67e8f9'
          },
          font: {
            color: '#22d3ee',
            size: 11,
            face: 'monospace',
            background: '#0f172a',
            strokeWidth: 0
          },
          smooth: {
            enabled: true,
            type: 'cubicBezier',
            roundness: 0.4
          },
          width: 3,
          title: edge.description || `${edge.sourceMachineCode} ${edge.relationType} ${edge.targetMachineCode}`,
          shadow: { enabled: true, color: 'rgba(6,182,212,0.3)', size: 6 }
        });
      });
    }

    this.nodesDataSet.add(visNodes);
    this.edgesDataSet.add(visEdges);
  }

  private getNodeColors(status: MachineStatus | string): {
    color: VisNodeData['color'];
    textColor: string;
    shadowColor: string;
  } {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'running':
        return {
          color: {
            background: '#064e3b',
            border: '#10b981',
            highlight: { background: '#065f46', border: '#34d399' },
            hover: { background: '#065f46', border: '#34d399' }
          },
          textColor: '#ecfdf5',
          shadowColor: 'rgba(16,185,129,0.35)'
        };
      case 'warning':
        return {
          color: {
            background: '#78350f',
            border: '#f59e0b',
            highlight: { background: '#92400e', border: '#fbbf24' },
            hover: { background: '#92400e', border: '#fbbf24' }
          },
          textColor: '#fffbeb',
          shadowColor: 'rgba(245,158,11,0.35)'
        };
      case 'critical':
        return {
          color: {
            background: '#881337',
            border: '#f43f5e',
            highlight: { background: '#9f1239', border: '#fb7185' },
            hover: { background: '#9f1239', border: '#fb7185' }
          },
          textColor: '#fff1f2',
          shadowColor: 'rgba(244,63,94,0.45)'
        };
      case 'stopped':
      default:
        return {
          color: {
            background: '#1e293b',
            border: '#64748b',
            highlight: { background: '#334155', border: '#94a3b8' },
            hover: { background: '#334155', border: '#94a3b8' }
          },
          textColor: '#f8fafc',
          shadowColor: 'rgba(100,116,139,0.25)'
        };
    }
  }

  private applyNetworkOptions(): void {
    if (!this.network) return;
    const options = this.getNetworkOptions();
    this.network.setOptions(options);
    setTimeout(() => {
      this.fitGraph();
    }, 100);
  }

  private getNetworkOptions(): any {
    if (this.activeLayout === 'hierarchical') {
      return {
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'LR',
            sortMethod: 'directed',
            levelSeparation: 260,
            nodeSpacing: 160,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true
          }
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          zoomView: true,
          dragView: true,
          selectConnectedEdges: true
        }
      };
    } else if (this.activeLayout === 'tree') {
      return {
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 150,
            nodeSpacing: 200,
            treeSpacing: 250
          }
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          zoomView: true,
          dragView: true,
          selectConnectedEdges: true
        }
      };
    } else {
      return {
        layout: {
          hierarchical: { enabled: false }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 160,
            springConstant: 0.08,
            damping: 0.4
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          zoomView: true,
          dragView: true
        }
      };
    }
  }

  private subscribeRealtime(): void {
    const subStatus = this.signalr.status$.subscribe(payload => {
      if (this.topology) {
        const node = this.topology.nodes.find(n => n.id === payload.machineId);
        if (node) {
          node.status = payload.newStatus as any;

          // Update Vis node in DataSet dynamically
          const styling = this.getNodeColors(payload.newStatus);
          try {
            const existing = this.nodesDataSet.get(node.id);
            if (existing) {
              this.nodesDataSet.update({
                id: node.id,
                label: `<b>${node.code}</b>\n${node.name}\n[${payload.newStatus.toUpperCase()}]` +
                       (node.activeAlerts > 0 ? `\n⚠️ Alerts: ${node.activeAlerts}` : ''),
                color: styling.color,
                shadow: { enabled: true, color: styling.shadowColor, size: 10, x: 0, y: 4 }
              } as VisNodeData);
            }
          } catch {
            // DataSet update safe fallback
          }

          this.cdr.markForCheck();
        }
      }
    });

    const subMachineState = this.signalr.machineState$.subscribe(state => {
      if (this.topology) {
        const node = this.topology.nodes.find(n => n.id === state.machineId);
        if (node) {
          node.status = state.status as any;
          node.activeAlerts = state.activeAlertCount;
          const styling = this.getNodeColors(state.status);
          try {
            const existing = this.nodesDataSet.get(node.id);
            if (existing) {
              this.nodesDataSet.update({
                id: node.id,
                label: `<b>${node.code}</b>\n${node.name}\n[${state.status.toUpperCase()}]` +
                       (state.activeAlertCount > 0 ? `\n⚠️ Alerts: ${state.activeAlertCount}` : ''),
                color: styling.color,
                shadow: { enabled: true, color: styling.shadowColor, size: 10, x: 0, y: 4 }
              } as VisNodeData);
            }
          } catch {}
          this.cdr.markForCheck();
        }
      }
    });

    this.subscriptions.push(subStatus, subMachineState);
  }
}

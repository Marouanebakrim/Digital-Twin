import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { PlantComponent } from './plant.component';
import { DigitalTwinService } from '../../core/services/digital-twin.service';
import { SignalrService } from '../../core/services/signalr.service';
import { PlantTopology, MachineStatusChangedPayload } from '../../core/models/models';

describe('PlantComponent', () => {
  let component: PlantComponent;
  let fixture: ComponentFixture<PlantComponent>;
  let mockDigitalTwinService: jasmine.SpyObj<DigitalTwinService>;
  let statusSubject: Subject<MachineStatusChangedPayload>;
  let mockSignalrService: any;
  let router: Router;

  const mockTopology: PlantTopology = {
    plantId: 'plant-01',
    plantName: 'Gantour Phosphate Complex',
    nodes: [
      { id: 'node-101', code: 'CUSTOM-101', name: 'Primary Excavator Node', type: 'ExcavatorType', status: 'Running', activeAlerts: 0, productionLineId: 'line-01', productionLineName: 'Line 01' },
      { id: 'node-102', code: 'CUSTOM-102', name: 'Secondary Crusher Node', type: 'CrusherType', status: 'Warning', activeAlerts: 1, productionLineId: 'line-01', productionLineName: 'Line 01' },
      { id: 'node-103', code: 'CUSTOM-103', name: 'Tertiary Reactor Node', type: 'ReactorType', status: 'Critical', activeAlerts: 3, productionLineId: 'line-01', productionLineName: 'Line 01' }
    ],
    edges: [
      { id: 'e1', sourceMachineId: 'node-101', sourceMachineCode: 'CUSTOM-101', sourceMachineName: 'Primary Excavator Node', targetMachineId: 'node-102', targetMachineCode: 'CUSTOM-102', targetMachineName: 'Secondary Crusher Node', relationType: 'FEEDS' },
      { id: 'e2', sourceMachineId: 'node-102', sourceMachineCode: 'CUSTOM-102', sourceMachineName: 'Secondary Crusher Node', targetMachineId: 'node-103', targetMachineCode: 'CUSTOM-103', targetMachineName: 'Tertiary Reactor Node', relationType: 'FEEDS' }
    ]
  };

  beforeEach(async () => {
    mockDigitalTwinService = jasmine.createSpyObj('DigitalTwinService', ['getPlantTopology']);
    mockDigitalTwinService.getPlantTopology.and.returnValue(of(mockTopology));

    statusSubject = new Subject<MachineStatusChangedPayload>();
    mockSignalrService = {
      status$: statusSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [PlantComponent],
      providers: [
        provideRouter([]),
        { provide: DigitalTwinService, useValue: mockDigitalTwinService },
        { provide: SignalrService, useValue: mockSignalrService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PlantComponent);
    component = fixture.componentInstance;
  });

  it('should create and load topology on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockDigitalTwinService.getPlantTopology).toHaveBeenCalled();
    expect(component.topology).toEqual(mockTopology);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
  });

  it('should dynamically render nodes and edges provided by API without hardcoding', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Gantour Phosphate Complex');
    expect(compiled.textContent).toContain('CUSTOM-101');
    expect(compiled.textContent).toContain('CUSTOM-102');
    expect(compiled.textContent).toContain('CUSTOM-103');
    expect(compiled.textContent).toContain('3 Nodes • 2 Dataflow Edges');

    const nodeCards = compiled.querySelectorAll('.glass-card');
    expect(nodeCards.length).toBe(3);
  });

  it('should display loading state while topology graph is building', () => {
    mockDigitalTwinService.getPlantTopology.and.returnValue(new Subject<PlantTopology>());
    fixture = TestBed.createComponent(PlantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Building dynamic plant topology graph...');
  });

  it('should display error state when topology fetch fails', () => {
    mockDigitalTwinService.getPlantTopology.and.returnValue(throwError(() => new Error('Graph service unavailable')));
    fixture = TestBed.createComponent(PlantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Graph service unavailable');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error loading plant topology');
  });

  it('should navigate to machine details on node click', () => {
    fixture.detectChanges();
    const spyNavigate = spyOn(router, 'navigate');

    component.onNodeClick('node-102');
    expect(spyNavigate).toHaveBeenCalledWith(['/machines', 'node-102']);
  });

  it('should update node status on SignalR status changed event', () => {
    fixture.detectChanges();
    expect(component.topology?.nodes[0].status).toBe('Running');

    statusSubject.next({
      machineId: 'node-101',
      machineCode: 'CUSTOM-101',
      previousStatus: 'Running',
      newStatus: 'Critical',
      changedAt: new Date().toISOString()
    });

    expect(component.topology?.nodes[0].status).toBe('Critical');
  });

  it('should allow switching between graph layouts (hierarchical, tree, physics)', () => {
    fixture.detectChanges();
    expect(component.activeLayout).toBe('hierarchical');

    component.setLayout('tree');
    expect(component.activeLayout).toBe('tree');

    component.setLayout('physics');
    expect(component.activeLayout).toBe('physics');
  });

  it('should safely execute zoom and fit methods', () => {
    fixture.detectChanges();
    expect(() => component.zoomIn()).not.toThrow();
    expect(() => component.zoomOut()).not.toThrow();
    expect(() => component.fitGraph()).not.toThrow();
  });
});

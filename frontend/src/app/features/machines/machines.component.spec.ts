import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MachinesComponent } from './machines.component';
import { MachineService } from '../../core/services/machine.service';
import { MachineSummary } from '../../core/models/models';

describe('MachinesComponent', () => {
  let component: MachinesComponent;
  let fixture: ComponentFixture<MachinesComponent>;
  let mockMachineService: jasmine.SpyObj<MachineService>;
  let router: Router;

  const mockMachines: MachineSummary[] = [
    { id: '1', code: 'RW-001', name: 'Bucket Wheel Excavator', type: 'BucketWheel', status: 'Running', activeAlerts: 0, sensorCount: 5, location: 'Khouribga Mine Site A' },
    { id: '2', code: 'CR-001', name: 'Primary Jaw Crusher', type: 'Crusher', status: 'Warning', activeAlerts: 2, sensorCount: 7, location: 'Processing Plant 01' },
    { id: '3', code: 'CV-001', name: 'Main Conveyor Belt', type: 'Conveyor', status: 'Stopped', activeAlerts: 0, sensorCount: 1, location: 'Transfer Point B' },
    { id: '4', code: 'RE-001', name: 'Acid Reactor Unit', type: 'Reactor', status: 'Critical', activeAlerts: 1, sensorCount: 0, location: 'Chemical Reaction Bay' }
  ];

  beforeEach(async () => {
    mockMachineService = jasmine.createSpyObj('MachineService', ['getMachines']);
    mockMachineService.getMachines.and.returnValue(of(mockMachines));

    await TestBed.configureTestingModule({
      imports: [MachinesComponent],
      providers: [
        provideRouter([]),
        { provide: MachineService, useValue: mockMachineService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(MachinesComponent);
    component = fixture.componentInstance;
  });

  it('should create and load machines on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockMachineService.getMachines).toHaveBeenCalled();
    expect(component.machines.length).toBe(4);
    expect(component.isLoading).toBeFalse();
  });

  it('should toggle between table and grid views', () => {
    fixture.detectChanges();
    expect(component.viewMode).toBe('table');

    component.viewMode = 'grid';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-machine-card')).toBeTruthy();

    component.viewMode = 'table';
    fixture.detectChanges();
    expect(compiled.querySelector('app-machine-table')).toBeTruthy();
  });

  it('should filter machines by search query (code, name, location)', () => {
    fixture.detectChanges();

    // Search by code
    component.searchQuery = 'RW-001';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].id).toBe('1');

    // Search by name
    component.searchQuery = 'Crusher';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].id).toBe('2');

    // Search by location
    component.searchQuery = 'Chemical';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].id).toBe('4');
  });

  it('should filter machines by status', () => {
    fixture.detectChanges();

    component.selectedStatus = 'Running';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].code).toBe('RW-001');

    component.selectedStatus = 'Critical';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].code).toBe('RE-001');

    component.selectedStatus = 'ALL';
    expect(component.filteredMachines.length).toBe(4);
  });

  it('should filter machines by type', () => {
    fixture.detectChanges();

    component.selectedType = 'Conveyor';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].code).toBe('CV-001');

    component.selectedType = 'BucketWheel';
    expect(component.filteredMachines.length).toBe(1);
    expect(component.filteredMachines[0].code).toBe('RW-001');
  });

  it('should display empty state when filter matches no machine', () => {
    fixture.detectChanges();
    component.searchQuery = 'NonExistentQueryXYZ';
    fixture.detectChanges();

    expect(component.filteredMachines.length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No machines match criteria');
  });

  it('should display loading state while loading', () => {
    mockMachineService.getMachines.and.returnValue(new Subject<MachineSummary[]>());
    fixture = TestBed.createComponent(MachinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading machines list...');
  });

  it('should display error state when backend fetch fails', () => {
    mockMachineService.getMachines.and.returnValue(throwError(() => new Error('Backend offline')));
    fixture = TestBed.createComponent(MachinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Backend offline');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error loading machines');
  });

  it('should navigate to machine details on selectMachine event', () => {
    fixture.detectChanges();
    const spyNavigate = spyOn(router, 'navigate');

    component.onSelectMachine('2');
    expect(spyNavigate).toHaveBeenCalledWith(['/machines', '2']);
  });
});

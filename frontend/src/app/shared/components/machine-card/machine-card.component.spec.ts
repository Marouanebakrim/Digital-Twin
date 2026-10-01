import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MachineCardComponent } from './machine-card.component';
import { MachineSummary } from '../../../core/models/models';

describe('MachineCardComponent', () => {
  let component: MachineCardComponent;
  let fixture: ComponentFixture<MachineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MachineCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.machine = {
      id: 'm1', code: 'M-001', name: 'Machine One', type: 'TypeA',
      status: 'Running', activeAlerts: 0, sensorCount: 3
    };
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display machine code, name, and type', () => {
    component.machine = {
      id: 'm1', code: 'AB-123', name: 'Custom Machine', type: 'SpecialType',
      status: 'Warning', activeAlerts: 2, sensorCount: 5
    };
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AB-123');
    expect(el.textContent).toContain('Custom Machine');
    expect(el.textContent).toContain('SpecialType');
  });

  it('should display sensor count and alert count', () => {
    component.machine = {
      id: 'm1', code: 'M-001', name: 'Machine One', type: 'TypeA',
      status: 'Running', activeAlerts: 4, sensorCount: 7
    };
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('7 Sensors');
    expect(el.textContent).toContain('4 Alerts');
  });

  it('should render router link to machine details', () => {
    component.machine = {
      id: 'xyz-789', code: 'M-001', name: 'Machine One', type: 'TypeA',
      status: 'Running', activeAlerts: 0, sensorCount: 1
    };
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('[ng-reflect-router-link]');
    // The routerLink should point to /machines/xyz-789
    expect(link).toBeTruthy();
  });

  it('should display zero sensors without error', () => {
    component.machine = {
      id: 'm1', code: 'M-001', name: 'No Sensors', type: 'TypeA',
      status: 'Stopped', activeAlerts: 0, sensorCount: 0
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0 Sensors');
  });
});

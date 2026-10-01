import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HeaderComponent } from './header.component';
import { SignalrService } from '../../core/services/signalr.service';
import { SimulatorService } from '../../core/services/simulator.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockSimulatorService: jasmine.SpyObj<SimulatorService>;
  let mockSignalrService: any;

  beforeEach(async () => {
    mockSimulatorService = jasmine.createSpyObj('SimulatorService', ['getStatus', 'setMode']);
    mockSimulatorService.getStatus.and.returnValue(of({ isRunning: true, mode: 'normal', intervalMs: 3000 }));
    mockSimulatorService.setMode.and.returnValue(of({ message: 'Mode set', mode: 'warning' }));

    mockSignalrService = {
      isConnected: jasmine.createSpy('isConnected').and.returnValue(true),
      connectionState: jasmine.createSpy('connectionState').and.returnValue('Connected')
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: SimulatorService, useValue: mockSimulatorService },
        { provide: SignalrService, useValue: mockSignalrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create and load simulator status', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockSimulatorService.getStatus).toHaveBeenCalled();
    expect(component.currentMode).toBe('normal');
  });

  it('should call setMode when user clicks mode buttons', () => {
    fixture.detectChanges();

    component.setMode('warning');
    expect(component.currentMode).toBe('warning');
    expect(mockSimulatorService.setMode).toHaveBeenCalledWith('warning' as any);
  });

  it('should display SignalR connection state indicator', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connected');
  });
});

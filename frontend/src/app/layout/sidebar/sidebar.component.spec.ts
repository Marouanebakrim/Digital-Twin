import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create and render navigation links', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Plant Overview');
    expect(compiled.textContent).toContain('Machines');
    expect(compiled.textContent).toContain('Alerts Feed');
  });
});

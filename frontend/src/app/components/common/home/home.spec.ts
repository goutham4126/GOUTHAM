import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { CommonModule } from '@angular/common';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Home, CommonModule] }).compileComponents();
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should start with activeTab = home', () => { expect(component.activeTab()).toBe('home'); });
  it('should have 4 packages', () => { expect(component.packages.length).toBe(4); });
  it('should update activeTab via setTab', () => { component.setTab('features'); expect(component.activeTab()).toBe('features'); });
  it('should have one active package (Personal Casualty)', () => {
    const active = component.packages.filter(p => p.active);
    expect(active.length).toBe(1);
    expect(active[0].title).toBe('Personal Casualty');
  });
});

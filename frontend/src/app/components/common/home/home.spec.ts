import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ 
      imports: [Home, CommonModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should have 6 workflow steps', () => { expect(component.workflowSteps.length).toBe(6); });
  it('should have 4 system roles', () => { expect(component.systemRoles.length).toBe(4); });
  it('should have 3 insurance plans', () => { expect(component.insurancePlans.length).toBe(3); });
  it('should have 5 platform benefits', () => { expect(component.platformBenefits.length).toBe(5); });
});

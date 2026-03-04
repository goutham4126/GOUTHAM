import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorComponent } from './error';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;
  let mockRouter: any;

  beforeEach(async () => {
    mockRouter = { navigate: jasmine.createSpy(), getCurrentNavigation: jasmine.createSpy().and.returnValue(null) };
    await TestBed.configureTestingModule({
      imports: [ErrorComponent, CommonModule, RouterModule.forRoot([])],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParams: of({ status: '404', message: 'Not found' }) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should set errorCode from queryParams', () => { expect(component.errorCode).toBe('404'); });
  it('should set errorMessage from queryParams', () => { expect(component.errorMessage).toBe('Not found'); });
  it('should navigate to / on goHome()', () => {
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});

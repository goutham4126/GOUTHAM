import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClaimsOfficerDashboard } from './claims-officer-dashboard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../../services/claim/claim';
import { ToastService } from '../../../services/toast/toast';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('ClaimsOfficerDashboard', () => {
  let component: ClaimsOfficerDashboard;
  let fixture: ComponentFixture<ClaimsOfficerDashboard>;
  let mockClaimService: any;
  let mockToastService: any;
  const mockClaims: any = [
    { id: 'c1', claimAmount: 5000, status: 'Pending', documentUrl: 'doc.pdf', customerName: 'Alice', dateFiled: '2023-01-01', policy: { plan: { name: 'Auto Plan' } } },
    { id: 'c2', claimAmount: 2000, status: 'Pending', documentUrl: 'img.jpg', customerName: 'Bob', dateFiled: '2023-01-02', policy: { plan: { name: 'Home Plan' } } }
  ];

  beforeEach(async () => {
    mockClaimService = { getAssignedClaims: jasmine.createSpy().and.returnValue(of(mockClaims)), approveClaim: jasmine.createSpy(), rejectClaim: jasmine.createSpy() };
    mockToastService = { success: jasmine.createSpy(), error: jasmine.createSpy(), confirm: jasmine.createSpy() };
    await TestBed.configureTestingModule({
      imports: [ClaimsOfficerDashboard, CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: ClaimService, useValue: mockClaimService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ClaimsOfficerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });
  it('should load assigned claims on init', () => {
    expect(mockClaimService.getAssignedClaims).toHaveBeenCalled();
    expect(component.assignedClaims.length).toBe(2);
    expect(component.loading).toBe(false);
  });
  it('should toggle expand', () => {
    component.toggleExpand('c1');
    expect(component.expandedClaimId).toBe('c1');
    component.toggleExpand('c1');
    expect(component.expandedClaimId).toBeNull();
  });
  it('should set selectedClaimId on promptApprove', () => {
    component.promptApprove(mockClaims[0]);
    expect(component.selectedClaimId).toBe('c1');
    expect(component.approvalAmount).toBe(5000);
  });
  it('should clear on cancelApprove', () => {
    component.selectedClaimId = 'c1';
    component.approvalAmount = 5000;
    component.cancelApprove();
    expect(component.selectedClaimId).toBeNull();
    expect(component.approvalAmount).toBe(0);
  });
  it('should show success dialog on confirmApprove', () => {
    mockClaimService.approveClaim.and.returnValue(of('Approved'));
    component.selectedClaimId = 'c1';
    component.approvalAmount = 4000;
    component.confirmApprove();
    expect(component.successDialogVisible).toBe(true);
    expect(component.approvedClaimAmount).toBe(4000);
  });
  it('should show error toast on approve failure', () => {
    spyOn(console, 'error');
    mockClaimService.approveClaim.and.returnValue(throwError(() => new Error('Test error')));
    component.selectedClaimId = 'c1';
    component.approvalAmount = 4000;
    component.confirmApprove();
    expect(mockToastService.error).toHaveBeenCalled();
  });
  it('should call confirm on rejectClaim', () => {
    component.rejectClaim('c1');
    expect(mockToastService.confirm).toHaveBeenCalled();
  });
  it('should call openDocument without error', async () => {
    spyOn(window, 'open');
    spyOn(window, 'fetch').and.returnValue(Promise.reject('CORS'));
    await component.openDocument('http://example.com/doc.pdf');
    expect(window.open).toHaveBeenCalled();
  });
});

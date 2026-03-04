import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerPolicyDetail } from './customer-policy-detail';

describe('CustomerPolicyDetail', () => {
    let component: CustomerPolicyDetail;
    let fixture: ComponentFixture<CustomerPolicyDetail>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerPolicyDetail]
        }).compileComponents();

        fixture = TestBed.createComponent(CustomerPolicyDetail);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

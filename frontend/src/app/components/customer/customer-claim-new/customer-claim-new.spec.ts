import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerClaimNew } from './customer-claim-new';

describe('CustomerClaimNew', () => {
    let component: CustomerClaimNew;
    let fixture: ComponentFixture<CustomerClaimNew>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerClaimNew]
        }).compileComponents();

        fixture = TestBed.createComponent(CustomerClaimNew);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

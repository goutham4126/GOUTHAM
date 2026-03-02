import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerClaimNew } from './customer-claim-new';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CustomerClaimNew', () => {
    let component: CustomerClaimNew;
    let fixture: ComponentFixture<CustomerClaimNew>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerClaimNew],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerClaimNew);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

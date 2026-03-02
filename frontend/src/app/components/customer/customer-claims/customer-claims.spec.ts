import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerClaims } from './customer-claims';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CustomerClaims', () => {
    let component: CustomerClaims;
    let fixture: ComponentFixture<CustomerClaims>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerClaims],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerClaims);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPolicyDetail } from './customer-policy-detail';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

describe('CustomerPolicyDetail', () => {
    let component: CustomerPolicyDetail;
    let fixture: ComponentFixture<CustomerPolicyDetail>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerPolicyDetail],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: { get: () => '1' } }
                    }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerPolicyDetail);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

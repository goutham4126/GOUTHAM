import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminClaims } from './admin-claims';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminClaims', () => {
    let component: AdminClaims;
    let fixture: ComponentFixture<AdminClaims>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminClaims],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminClaims);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

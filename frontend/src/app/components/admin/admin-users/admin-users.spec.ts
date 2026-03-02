import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsers } from './admin-users';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminUsersComponent', () => {
    let component: AdminUsers;
    let fixture: ComponentFixture<AdminUsers>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUsers],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminUsers);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/user/user';
import { of, throwError } from 'rxjs';

describe('Profile', () => {
    let component: Profile;
    let fixture: ComponentFixture<Profile>;
    let mockUserService: { getMe: jasmine.Spy; updateMyProfile: jasmine.Spy };

    const mockUser: any = {
        id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        role: 'Customer', phone: '1234567890', address: '123 Street',
        governmentId: 'GOV123', dateOfBirth: '1990-01-15'
    };

    beforeEach(async () => {
        mockUserService = { getMe: jasmine.createSpy().and.returnValue(of(mockUser)), updateMyProfile: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [Profile, ReactiveFormsModule],
            providers: [{ provide: UserService, useValue: mockUserService }]
        }).compileComponents();
        fixture = TestBed.createComponent(Profile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load user on init', () => {
        expect(mockUserService.getMe).toHaveBeenCalled();
        expect(component.user).toEqual(mockUser);
        expect(component.loading).toBe(false);
    });
    it('should set error on load failure', () => {
        mockUserService.getMe.and.returnValue(throwError(() => new Error()));
        component.ngOnInit();
        expect(component.error).toBe('Failed to load profile. Please try again.');
    });
    it('should return correct initials', () => { expect(component.getInitials()).toBe('JD'); });
    it('should return ? when user is null', () => { component.user = null; expect(component.getInitials()).toBe('?'); });
    it('should open edit mode with user data', () => {
        component.openEdit();
        expect(component.editMode).toBe(true);
        expect(component.editForm.controls['firstName'].value).toBe('John');
    });
    it('should cancel edit mode', () => {
        component.editMode = true;
        component.cancelEdit();
        expect(component.editMode).toBe(false);
    });
    it('should return — for null date', () => { expect(component.formatDate(null)).toBe('—'); });
    it('should format date correctly', () => {
        const result = component.formatDate('1990-01-15');
        expect(result).not.toBe('—');
    });
    it('should save profile successfully', () => {
        mockUserService.updateMyProfile.and.returnValue(of({ ...mockUser, firstName: 'Jane' }));
        component.openEdit();
        component.saveProfile();
        expect(component.saveSuccess).toBe(true);
        expect(component.editMode).toBe(false);
    });
    it('should set saveError on save failure', () => {
        mockUserService.updateMyProfile.and.returnValue(throwError(() => ({ error: { title: 'Save failed' } })));
        component.openEdit();
        component.saveProfile();
        expect(component.saveError).toBe('Save failed');
    });
});

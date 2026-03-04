import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => { expect(service).toBeTruthy(); });
  it('should start with empty toasts', () => { expect(service.toasts()).toEqual([]); });

  it('should add a success toast', () => {
    service.success('Operation succeeded');
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Operation succeeded');
  });

  it('should add an error toast', () => {
    service.error('Something went wrong');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add an info toast', () => {
    service.info('Info');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add a warning toast', () => {
    service.warning('Warning');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should remove a toast by id', () => {
    service.success('Hello');
    const id = service.toasts()[0].id;
    service.remove(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should auto-remove toast after duration', () => {
    service.success('Auto remove', 1000);
    expect(service.toasts().length).toBe(1);
    jasmine.clock().tick(1000);
    expect(service.toasts().length).toBe(0);
  });

  it('should open confirm dialog', () => {
    const onConfirm = jasmine.createSpy();
    service.confirm('Title', 'Message?', onConfirm);
    expect(service.confirmDialog()).not.toBeNull();
    expect(service.confirmDialog()!.title).toBe('Title');
  });

  it('should call onConfirm when resolveConfirm is called', () => {
    const onConfirm = jasmine.createSpy();
    service.confirm('T', 'M', onConfirm);
    service.resolveConfirm();
    expect(onConfirm).toHaveBeenCalled();
    expect(service.confirmDialog()).toBeNull();
  });

  it('should call onCancel when rejectConfirm is called', () => {
    const onCancel = jasmine.createSpy();
    service.confirm('T', 'M', jasmine.createSpy(), onCancel);
    service.rejectConfirm();
    expect(onCancel).toHaveBeenCalled();
    expect(service.confirmDialog()).toBeNull();
  });

  it('should handle multiple toasts', () => {
    service.success('First');
    service.error('Second');
    service.info('Third');
    expect(service.toasts().length).toBe(3);
  });
});

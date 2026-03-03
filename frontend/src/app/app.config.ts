import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { errorInterceptor } from './interceptors/error-interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { GlobalErrorHandler } from './utils/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideCharts(withDefaultRegisterables())
  ]
};

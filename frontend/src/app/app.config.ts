import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth/auth-interceptor';
import { errorInterceptor } from './interceptors/error/error-interceptor';
import { utcDateInterceptor } from './interceptors/utc-date/utc-date-interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { GlobalErrorHandler } from './utils/global-error-handler';
import { provideAnimations } from '@angular/platform-browser/animations';
import localeIn from '@angular/common/locales/en-IN';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeIn);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'en-IN' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, utcDateInterceptor])),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(MarkdownModule.forRoot())
  ]
};

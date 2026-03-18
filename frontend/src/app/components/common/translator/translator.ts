import { Component, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

const LANGUAGES = [
  { code: "en", label: "English", alias: "english" },
  { code: "hi", label: "हिन्दी", alias: "hindi" },
  { code: "te", label: "తెలుగు", alias: "telugu" },
  { code: "ta", label: "தமிழ்", alias: "tamil" },
  { code: "kn", label: "ಕನ್ನಡ", alias: "kannada" },
  { code: "ml", label: "മലയാളം", alias: "malayalam" },
  { code: "bn", label: "বাংলা", alias: "bengali" },
  { code: "mr", label: "मराठी", alias: "marathi" },
  { code: "gu", label: "ગુજરાતી", alias: "gujarati" },
  { code: "pa", label: "ਪੰਜਾਬੀ", alias: "punjabi" },
  { code: "ur", label: "اردو", alias: "urdu" },
  { code: "or", label: "ଓଡ଼ିଆ", alias: "odia" },
  { code: "as", label: "অসমীয়া", alias: "assamese" },
  { code: "ne", label: "नेपाली", alias: "nepali" },
  { code: "si", label: "සිංහල", alias: "sinhala" },
  { code: "fr", label: "Français", alias: "french" },
  { code: "es", label: "Español", alias: "spanish" },
  { code: "de", label: "Deutsch", alias: "german" },
  { code: "it", label: "Italiano", alias: "italian" },
  { code: "nl", label: "Nederlands", alias: "dutch" },
  { code: "pt", label: "Português", alias: "portuguese" },
  { code: "ru", label: "Русский", alias: "russian" },
  { code: "zh-CN", label: "中文 (简体)", alias: "chinese" },
  { code: "ja", label: "日本語", alias: "japanese" },
  { code: "ko", label: "한국어", alias: "korean" },
  { code: "ar", label: "العربية", alias: "arabic" },
  { code: "tr", label: "Türkçe", alias: "turkish" },
  { code: "pl", label: "Polski", alias: "polish" },
  { code: "vi", label: "Tiếng Việt", alias: "vietnamese" },
  { code: "th", label: "ไทย", alias: "thai" },
  { code: "id", label: "Bahasa Indonesia", alias: "indonesian" },
  { code: "ms", label: "Bahasa Melayu", alias: "malay" },
  { code: "sv", label: "Svenska", alias: "swedish" },
  { code: "fi", label: "Suomi", alias: "finnish" },
  { code: "da", label: "Dansk", alias: "danish" },
  { code: "no", label: "Norsk", alias: "norwegian" },
  { code: "el", label: "Ελληνικά", alias: "greek" },
  { code: "cs", label: "Čeština", alias: "czech" },
  { code: "ro", label: "Română", alias: "romanian" },
  { code: "hu", label: "Magyar", alias: "hungarian" },
  { code: "uk", label: "Українська", alias: "ukrainian" },
  { code: "he", label: "עברית", alias: "hebrew" },
];

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="google_translate_container" style="display: none;"></div>
    
    <div class="relative inline-block text-left relative-translator-dropdown">
      <button 
        type="button" 
        (click)="toggleDropdown()"
        [disabled]="!isLoaded()"
        class="inline-flex items-center justify-between gap-3 w-auto rounded-[10px] border border-border/80 bg-surface/90 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-base hover:border-border hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]"
      >
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-text-muted transition-colors group-hover:text-primary">
            <path d="m5 8 6 6"/>
            <path d="m4 14 6-6 2-3"/>
            <path d="M2 5h12"/>
            <path d="M7 2h1"/>
            <path d="m22 22-5-10-5 10"/>
            <path d="M14 18h6"/>
          </svg>
          <span class="hidden sm:inline">Language</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-text-muted transition-transform duration-300" [class.rotate-180]="isOpen()">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-3 w-[18rem] sm:w-[24rem] rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] bg-surface/95 backdrop-blur-xl border border-border/80 focus:outline-none z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-300 ease-out flex flex-col ring-1 ring-black/5">
          <!-- Search Bar -->
          <div class="p-3 border-b border-border/50 bg-bg-base/30">
            <div class="relative group/search">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within/search:text-primary transition-colors">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search languages..." 
                (input)="updateSearch($event)"
                [value]="searchQuery()"
                class="w-full pl-9 pr-3 py-2 text-sm bg-surface/80 border border-border/60 rounded-[10px] focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-text-primary placeholder:text-text-muted/70 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]"
              />
            </div>
          </div>
          
          <div class="max-h-[22rem] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
            @if (filteredLanguages().length === 0) {
              <div class="px-4 py-8 text-center text-sm text-text-muted">No languages found.</div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                @for (lang of filteredLanguages(); track lang.code) {
                  <button
                    (click)="handleLanguageChange(lang.code)"
                    class="flex items-center justify-between w-full text-left px-3 py-2 text-sm font-medium text-text-secondary rounded-[10px] hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer group/item"
                    role="menuitem"
                  >
                    <span class="truncate transition-transform duration-200 group-hover/item:translate-x-0.5">{{ lang.label }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 20px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.5);
      }
    </style>
  `
})
export class TranslatorComponent implements OnInit, OnDestroy {
  languages = LANGUAGES;
  isLoaded = signal(false);
  isOpen = signal(false);
  searchQuery = signal('');
  private observer: MutationObserver | null = null;

  filteredLanguages = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.languages;
    return this.languages.filter(l => 
      l.label.toLowerCase().includes(query) || 
      (l.alias && l.alias.toLowerCase().includes(query))
    );
  });

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  ngOnInit() {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }

    (window as any).googleTranslateElementInit = () => {
      const google = (window as any).google;
      if (!google || !google.translate) return;
      new google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: this.languages.map((l) => l.code).join(','),
          autoDisplay: false,
        },
        'google_translate_container'
      );
      this.isLoaded.set(true);
    };

    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      .goog-te-gadget-icon { display: none !important; }
      .goog-te-menu-frame.skiptranslate { display: none !important; }
      .goog-te-menu-value span { display: none !important; }
      body { top: 0px !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
      .goog-logo-link, .goog-te-gadget span, .goog-te-banner { display: none !important; }
      #google_translate_container select {
        background: transparent !important;
        color: inherit !important;
        border: none !important;
        font-size: 14px !important;
        outline: none !important;
      }
      iframe[id^=":"] { display: none !important; }
    `;
    document.head.appendChild(style);

    this.observer = new MutationObserver(() => {
      const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement;
      if (banner) banner.style.display = 'none';
      document.body.style.top = '0px';
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.isOpen() && !targetElement.closest('.relative-translator-dropdown')) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  handleLanguageChange(code: string) {
    this.isOpen.set(false);

    if (code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/en;';

      try {
        localStorage.removeItem('googtrans');
        sessionStorage.removeItem('googtrans');
      } catch (err) {
        console.warn("Couldn't clear googtrans from storage:", err);
      }

      window.location.reload();
      return;
    }

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  }
}

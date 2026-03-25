import { Component, Input, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VertexAiService } from '../../../services/vertex-ai/vertex-ai.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-ai-claim-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-summary-card mb-6 bg-gradient-to-br from-[#f8faff] to-white border border-blue-100 rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <div class="absolute top-0 right-0 p-4">
        <div class="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100 flex items-center gap-1.5">
           <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
           Vertex AI Gemini
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="ai-icon w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
           <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </div>
        
        <div class="flex-1 pr-12">
          <h5 class="text-[11px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            Intelligent Claim Analysis
          </h5>
          
          <div class="relative min-h-[60px]">
            @if (loading) {
              <div class="flex items-center gap-3 py-2">
                <div class="animate-pulse w-full space-y-2">
                   <div class="h-3 bg-blue-100 rounded-full w-3/4"></div>
                   <div class="h-3 bg-blue-50 rounded-full w-5/6"></div>
                   <div class="h-3 bg-blue-50/50 rounded-full w-1/2"></div>
                </div>
              </div>
            } @else if (error) {
              <p class="text-[13px] text-red-500 font-medium italic py-2">{{ error }}</p>
            } @else {
              <p class="text-[13px] text-slate-700 font-medium leading-[1.6] py-2 animate-in fade-in slide-in-from-left-2 duration-500">
                {{ summary }}
              </p>
            }
          </div>
          
          <div class="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
            <span class="text-[10px] font-semibold text-slate-400">Generated automatically for Claim Evaluation</span>
            <button (click)="loadSummary(true)" class="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-summary-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ai-summary-card:hover {
      border-color: #bfdbfe;
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
      transform: translateY(-1px);
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class AiClaimSummaryComponent implements OnInit {
  @Input({ required: true }) claimId!: string;
  
  private vertexAiService = inject(VertexAiService);
  private cdr = inject(ChangeDetectorRef);
  private readonly CACHE_PREFIX = 'claim_summary_';
  
  summary = '';
  loading = false;
  error = '';

  ngOnInit() {
    const cachedSummary = localStorage.getItem(this.CACHE_PREFIX + this.claimId);
    if (cachedSummary) {
      this.summary = cachedSummary;
      this.loading = false;
    } else {
      this.loadSummary();
    }
  }

  loadSummary(force: boolean = false) {
    if (!force && this.summary) return;

    this.loading = true;
    this.error = '';
    this.vertexAiService.getClaimSummary(this.claimId)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.summary = res;
          localStorage.setItem(this.CACHE_PREFIX + this.claimId, res);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to load AI insights. Please check connection.';
          this.cdr.detectChanges();
        }
      });
  }
}

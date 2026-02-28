import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="md:flex md:items-center md:justify-between">
          <div class="flex justify-center md:justify-start space-x-6 md:order-2 text-sm text-gray-500">
            <a href="#" class="hover:text-gray-900 transition">About</a>
            <a href="#" class="hover:text-gray-900 transition">Privacy Policy</a>
            <a href="#" class="hover:text-gray-900 transition">Terms of Service</a>
            <a href="#" class="hover:text-gray-900 transition">Contact</a>
          </div>
          <div class="mt-8 md:mt-0 md:order-1">
            <p class="text-center text-sm text-gray-500">
              &copy; 2026 Casualty & Disaster Insurance Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class Footer { }

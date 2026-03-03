import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './error.html',
  styleUrls: ['./error.css']
})
export class ErrorComponent implements OnInit {
  errorMessage: string = 'An unexpected error occurred.';
  errorCode: string = '500';

  constructor(private router: Router, private route: ActivatedRoute) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['errorStatus']) {
      this.errorCode = navigation.extras.state?.['errorStatus'];
    }
    if (navigation?.extras.state?.['errorMessage']) {
      this.errorMessage = navigation.extras.state?.['errorMessage'];
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.errorCode = params['status'];
      }
      if (params['message']) {
        this.errorMessage = params['message'];
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}

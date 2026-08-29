import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() user: any;
  @Input() role: string | null = '';
  @Input() activeTab = 'overview';
  @Input() isMobileOpen = false;

  @Output() menuSelect = new EventEmitter<string>();
  @Output() mobileClose = new EventEmitter<void>();

  isDarkMode = false; // Light mode is the default
  isDesktop = true;

  get currentRole(): string {
    return this.role || this.auth.getRole() || (this.user ? this.user.role : '') || '';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreen();
  }

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.checkScreen();
    if (!this.user) {
      this.user = this.auth.getCurrentUser();
    }
    if (!this.role) {
      this.role = this.auth.getRole();
    }

    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.user = u;
        this.role = u.role;
      }
    });

    // Always start in light mode — remove dark class on load
    document.documentElement.classList.remove('dark');
    this.isDarkMode = false;
  }

  checkScreen(): void {
    if (typeof window !== 'undefined') {
      this.isDesktop = window.innerWidth >= 1024;
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.menuSelect.emit(tab);
    this.mobileClose.emit();
  }

  closeSidebar(): void {
    this.mobileClose.emit();
  }

  logout(): void {
    this.auth.logout();
  }
}

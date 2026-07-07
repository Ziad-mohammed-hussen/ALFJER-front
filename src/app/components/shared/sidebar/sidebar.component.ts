import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  user: any;
  role: string | null = '';

  isDarkMode = false; // Light mode is the default
  activeTab = 'overview';

  @Output() menuSelect = new EventEmitter<string>();

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.role = this.auth.getRole();

    // Always start in light mode — remove dark class on load
    document.documentElement.classList.remove('dark');
    this.isDarkMode = false;
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
  }

  logout(): void {
    this.auth.logout();
  }
}

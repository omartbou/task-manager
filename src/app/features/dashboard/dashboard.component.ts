import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../shared/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);  // ✅ add this
  private ngZone = inject(NgZone);          // ✅ add this

  tasks: Task[] = [];
  loading = false;                          // ✅ start as false, not true
  currentUser = this.authService.getCurrentUser();
  errorMessage = '';

  stats = { total: 0, completed: 0, pending: 0 };

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.ngZone.run(() => {               // ✅ ensure runs inside Angular zone
      this.loading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();           // ✅ force spinner to show

      this.taskService.getTasks().subscribe({
        next: (response: any) => {
          let tasksArray: Task[] = [];

          if (Array.isArray(response)) {
            tasksArray = response;
          } else if (response?.data && Array.isArray(response.data)) {
            tasksArray = response.data;
          } else if (response?.tasks && Array.isArray(response.tasks)) {
            tasksArray = response.tasks;
          } else {
            this.errorMessage = 'Invalid data format from server';
          }

          this.tasks = tasksArray;
          this.calculateStats();
          this.loading = false;
          this.cdr.detectChanges();       // ✅ force table to render
        },
        error: (error) => {
          this.errorMessage = error.error?.detail || 'Failed to load tasks';
          this.loading = false;
          this.cdr.detectChanges();       // ✅ force error state to render
        }
      });
    });
  }

  calculateStats() {
    this.stats.total = this.tasks.length;
    this.stats.completed = this.tasks.filter(t => t.completed === true).length;
    this.stats.pending = this.tasks.filter(t => t.completed === false).length;
  }

  toggleComplete(task: Task): void {
    const updatedTask = { ...task, completed: !task.completed };
    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        task.completed = !task.completed;
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Dashboard: Error updating task', error);
        alert('Failed to update task');
      }
    });
  }

  deleteTask(id: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== id);
          this.calculateStats();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Dashboard: Error deleting task', error);
          alert('Failed to delete task');
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}

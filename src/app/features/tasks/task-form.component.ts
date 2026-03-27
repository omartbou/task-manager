import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  taskForm: FormGroup;
  loading = false;
  isEditMode = false;
  taskId?: number;
  errorMessage = '';

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      completed: [false],
      due_date: ['']
    });
  }

  // Helper getters - defined outside the constructor
  get title() { return this.taskForm.get('title'); }
  get description() { return this.taskForm.get('description'); }
  get completed() { return this.taskForm.get('completed'); }
  get due_date() { return this.taskForm.get('due_date'); }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.taskId = +params['id'];
        this.loadTask();
      }
    });
  }

  loadTask() {
    if (!this.taskId) return;

    this.loading = true;
    this.taskService.getTask(this.taskId).subscribe({
      next: (task) => {
        const dueDate = task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';

        this.taskForm.patchValue({
          title: task.title,
          description: task.description || '',
          completed: task.completed || false,
          due_date: dueDate
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.errorMessage = 'Failed to load task';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.taskForm.value;

    if (this.isEditMode && this.taskId) {
      this.taskService.updateTask(this.taskId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.errorMessage = error.error?.detail || 'Failed to update task';
          this.loading = false;
        }
      });
    } else {
      this.taskService.createTask(formValue).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.errorMessage = error.error?.detail || 'Failed to create task';
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}

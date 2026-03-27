import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { LoginRequest, LoginResponse, User, UserCreate } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = 'http://localhost:8000/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isInitialized = false;
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from localStorage on initialization
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
      this.isInitialized = true;
    }
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    console.log('AuthService: Loading stored user', { tokenExists: !!token, userExists: !!storedUser });

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        console.log('AuthService: User restored', user);
      } catch (error) {
        console.error('AuthService: Error parsing stored user', error);
        this.clearStorage();
        this.currentUserSubject.next(null);
      }
    } else {
      console.log('AuthService: No stored user found');
      this.currentUserSubject.next(null);
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('AuthService: Attempting login');
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        console.log('AuthService: Login response', response);

        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.access_token);
          const user: User = {
            id: response.user_id,
            username: response.username,
            email: response.username,
            is_admin: response.is_admin
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          console.log('AuthService: User stored in localStorage');
        }
      }),
      catchError(this.handleError)
    );
  }

  register(userData: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.clearStorage();
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      return token;
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    const loggedIn = !!token && !!user;
    console.log('AuthService: isLoggedIn =', loggedIn);
    return loggedIn;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_admin || false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // New method to check if auth is initialized
  isAuthInitialized(): boolean {
    return this.isInitialized;
  }

  private handleError(error: any): Observable<never> {
    console.error('AuthService: API Error', error);
    return throwError(() => error);
  }
}

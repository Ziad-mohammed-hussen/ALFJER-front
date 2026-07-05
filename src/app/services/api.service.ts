import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // في حالة الإنتاج (Production)، قم بتغيير هذا الرابط إلى رابط سيرفر الـ Backend الخاص بك بعد رفعه
  // e.g. private baseUrl = 'https://alfjr-backend.vercel.app/api';
  private baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://alfjer-back.vercel.app/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  get(path: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${path}`, { headers: this.getHeaders() });
  }

  post(path: string, body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${path}`, body, { headers: this.getHeaders() });
  }

  put(path: string, body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${path}`, body, { headers: this.getHeaders() });
  }

  delete(path: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${path}`, { headers: this.getHeaders() });
  }
}

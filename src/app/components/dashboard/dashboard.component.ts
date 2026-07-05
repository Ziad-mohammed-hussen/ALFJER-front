import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  role: string | null = '';
  user: any;
  isDarkMode = true;
  activeTab = 'overview';

  // Modals & Forms
  pricingForm!: FormGroup;
  invoiceForm!: FormGroup;
  salaryForm!: FormGroup;
  reportForm!: FormGroup;
  makeupForm!: FormGroup;
  pauseForm!: FormGroup;
  difficultyForm!: FormGroup;
  leadForm!: FormGroup;
  lockMonthForm!: FormGroup;
  bulkInvoiceForm!: FormGroup;

  studentForm!: FormGroup;
  showStudentModal = false;

  editSessionForm!: FormGroup;
  requestEditForm!: FormGroup;

  showPricingModal = false;
  showInvoiceModal = false;
  showSalaryModal = false;
  showReportModal = false;
  showMakeupModal = false;
  showPauseModal = false;
  showPaymentModal = false;
  showLogModal = false;
  showDifficultyModal = false;
  showLeadModal = false;
  showStaffModal = false;
  showLockMonthModal = false;
  showBulkInvoiceModal = false;
  showEditSessionModal = false;
  showRequestEditModal = false;
  staffForm!: FormGroup;

  // New properties
  selectedSessionForDifficulty: any = null;
  teacherPerformanceList: any[] = [];
  leadsList: any[] = [];
  editRequestsList: any[] = [];
  supervisorsList: any[] = [];
  teacherSchedule: any[] = [];
  showScheduleModal = false;
  scheduleForm!: FormGroup;
  seasonalAnalyticsList: any[] = [];
  analyticsYear: number = new Date().getFullYear();

  // Logged sessions for teacher
  teacherSessions: any[] = [];
  selectedSessionForEdit: any = null;
  selectedSessionForRequest: any = null;

  selectedPaymentMethod = 'PayPal';

  // Shared Data
  studentsList: any[] = [];
  teachersList: any[] = [];
  parentsList: any[] = [];

  // Admin Data
  adminStats = { totalRevenue: 0, pendingSalaries: 0, activeStudents: 0 };
  invoices: any[] = [];
  salaries: any[] = [];
  exchangeRate: number = 50.0;

  // Supervisor Data
  pendingSessions: any[] = [];
  supervisedStudents: any[] = [];
  activePauses: any[] = [];
  selectedStudentForPause: any = null;
  supervisorMakeups: any[] = [];

  // Teacher Data
  teacherStudents: any[] = [];
  teacherHours = 0;
  teacherExpectedSalary = 0;
  sessionForm!: FormGroup;
  pendingMakeups: any[] = [];
  selectedMakeupSession: any = null;

  // Parent Data
  parentChildren: any[] = [];
  parentInvoices: any[] = [];
  reports: any[] = [];
  selectedInvoiceForPayment: any = null;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getRole();
    this.user = this.auth.getCurrentUser();

    if (this.role === 'Admin') {
      this.loadAdminDashboard();
      this.initAdminForms();
    } else if (this.role === 'Supervisor' || this.role === 'GlobalSup') {
      this.loadSupervisorDashboard();
      this.initSupervisorForms();
    } else if (this.role === 'Teacher') {
      this.loadTeacherDashboard();
      this.initTeacherForms();
    } else if (this.role === 'Parent') {
      this.loadParentDashboard();
    }
  }

  // --- Forms Initialization ---
  initAdminForms(): void {
    this.pricingForm = this.fb.group({
      studentId: ['', Validators.required],
      teacherId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required],
      hourlyRate: [15, [Validators.required, Validators.min(0)]],
      currency: ['USD', Validators.required],
      teacherRate: [200, [Validators.required, Validators.min(0)]],
      teacherCurrency: ['EGP', Validators.required]
    });

    this.invoiceForm = this.fb.group({
      parentId: ['', Validators.required],
      monthStr: [new Date().toISOString().substring(0, 7), Validators.required],
      applyPaypalFee: [true]
    });

    this.salaryForm = this.fb.group({
      teacherId: ['', Validators.required],
      monthStr: [new Date().toISOString().substring(0, 7), Validators.required],
      exchangeRate: [50.0, [Validators.required, Validators.min(1)]]
    });

    this.leadForm = this.fb.group({
      leadName: ['', Validators.required],
      sourceType: ['parent_referral', Validators.required],
      notes: ['']
    });

    this.lockMonthForm = this.fb.group({
      monthStr: [new Date().toISOString().substring(0, 7), Validators.required]
    });

    this.bulkInvoiceForm = this.fb.group({
      monthStr: [new Date().toISOString().substring(0, 7), Validators.required]
    });

    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required, Validators.minLength(6)]],
      role: ['Teacher', Validators.required],
      phone: [''],
      supervisorId: ['']
    });

    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      parentId: ['', Validators.required],
      teacherIds: [[]]
    });
  }

  initSupervisorForms(): void {
    this.pauseForm = this.fb.group({
      type: ['temporary', Validators.required],
      reason: ['', Validators.required],
      expectedReturnAt: ['']
    });

    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      parentId: ['', Validators.required],
      teacherIds: [[]]
    });
  }

  initTeacherForms(): void {
    this.sessionForm = this.fb.group({
      studentId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      durationHours: [1, [Validators.required, Validators.min(0.5)]],
      status: ['Present', Validators.required],
      teacherNote: ['']
    });

    this.makeupForm = this.fb.group({
      makeupDate: [new Date().toISOString().substring(0, 10), Validators.required],
      durationHours: [1, [Validators.required, Validators.min(0.5)]],
      notes: ['']
    });

    this.reportForm = this.fb.group({
      studentId: ['', Validators.required],
      monthStr: [new Date().toISOString().substring(0, 7), Validators.required],
      startingLevelRating: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      currentProgressRating: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      textEvaluation: ['', Validators.required],
      attendancePercentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      initialTrialSummary: ['']
    });

    this.difficultyForm = this.fb.group({
      difficultyNote: ['', Validators.required]
    });

    this.editSessionForm = this.fb.group({
      subject: ['القرآن الكريم والتجويد', Validators.required],
      date: ['', Validators.required],
      durationHours: [1, [Validators.required, Validators.min(0.5)]],
      status: ['Present', Validators.required],
      teacherNote: ['']
    });

    this.requestEditForm = this.fb.group({
      reason: ['', Validators.required],
      proposedStatus: ['Present', Validators.required],
      proposedDurationHours: [1, [Validators.required, Validators.min(0.5)]],
      proposedDate: ['', Validators.required],
      proposedSubject: ['القرآن الكريم والتجويد', Validators.required],
      proposedTeacherNote: ['']
    });

    this.scheduleForm = this.fb.group({
      dayOfWeek: ['Sunday', Validators.required],
      timeSlot: ['', Validators.required],
      studentId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required]
    });
  }

  // --- Admin Logic ---
  loadAdminDashboard(): void {
    this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data);
    this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data);
    this.api.get('students').subscribe(res => {
      this.studentsList = res.data;
      this.adminStats.activeStudents = this.studentsList.filter(s => s.status === 'Active').length;
    });

    this.api.get('invoices').subscribe((res) => {
      this.invoices = res.data;
      this.adminStats.totalRevenue = this.invoices
        .filter(inv => inv.paymentStatus === 'Paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
    });

    this.api.get('salaries').subscribe((res) => {
      this.salaries = res.data;
      this.adminStats.pendingSalaries = this.salaries
        .filter(sal => sal.payoutStatus === 'Unpaid')
        .reduce((sum, sal) => sum + sal.finalPayoutEgp, 0);
    });

    this.loadLeads();
    this.loadEditRequests();
    this.loadTeacherPerformance();
    this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
    this.loadSeasonalAnalytics();
  }

  submitPricing(): void {
    alert('بدأ عملية حفظ التسعيرة...');
    if (this.pricingForm.invalid) {
      alert('فشل الحفظ: بيانات النموذج غير مكتملة أو غير صالحة!');
      return;
    }
    this.api.post('students/pricing', this.pricingForm.value).subscribe({
      next: () => {
        this.showPricingModal = false;
        this.pricingForm.reset({ subject: 'القرآن الكريم والتجويد', currency: 'USD', teacherCurrency: 'EGP', hourlyRate: 15, teacherRate: 200 });
        alert('تم حفظ خطة التسعير بنجاح!');
      },
      error: (err) => {
        console.error('Error saving pricing:', err);
        alert(err.error?.message || 'حدث خطأ أثناء حفظ التسعيرة. يرجى مراجعة الصلاحيات وقاعدة البيانات.');
      }
    });
  }

  submitGenerateInvoice(): void {
    if (this.invoiceForm.invalid) return;
    this.api.post('invoices/generate', this.invoiceForm.value).subscribe({
      next: () => {
        this.showInvoiceModal = false;
        this.loadAdminDashboard();
        alert('تم توليد الفاتورة بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء توليد الفاتورة')
    });
  }

  submitGenerateSalary(): void {
    if (this.salaryForm.invalid) return;
    this.api.post('salaries/generate', this.salaryForm.value).subscribe({
      next: () => {
        this.showSalaryModal = false;
        this.loadAdminDashboard();
        alert('تم توليد مسير الراتب بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء توليد مسير الراتب')
    });
  }

  payInvoiceAdmin(invoiceId: string): void {
    this.api.put(`invoices/${invoiceId}/pay`, {}).subscribe(() => {
      this.loadAdminDashboard();
    });
  }

  paySalaryAdmin(salaryId: string): void {
    this.api.put(`salaries/${salaryId}/pay`, {}).subscribe(() => {
      this.loadAdminDashboard();
    });
  }

  submitLockMonth(): void {
    if (this.lockMonthForm.invalid) return;
    this.api.post('sessions/lock-month', this.lockMonthForm.value).subscribe({
      next: () => {
        this.showLockMonthModal = false;
        this.loadAdminDashboard();
        alert('تم قفل الشهر المالي المحدد بنجاح.');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء قفل الشهر')
    });
  }

  submitBulkApproveInvoices(): void {
    if (this.bulkInvoiceForm.invalid) return;
    this.api.put('invoices/approve-all', this.bulkInvoiceForm.value).subscribe({
      next: (res) => {
        this.showBulkInvoiceModal = false;
        this.loadAdminDashboard();
        alert(res.message || 'تم اعتماد فواتير الشهر بالكامل بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء اعتماد الفواتير')
    });
  }

  // --- Supervisor Logic ---
  loadSupervisorDashboard(): void {
    this.api.get('sessions').subscribe((res) => {
      this.pendingSessions = res.data.filter((s: any) => !s.isApprovedBySupervisor);
    });

    this.api.get('students').subscribe((res) => {
      this.supervisedStudents = res.data;
    });

    this.api.get('pauses').subscribe((res) => {
      this.activePauses = res.data;
    });

    this.api.get('sessions/makeups').subscribe((res) => {
      this.supervisorMakeups = res.data;
    });

    this.loadEditRequests();
  }

  openPauseModal(student: any): void {
    this.selectedStudentForPause = student;
    this.showPauseModal = true;
  }

  submitPause(): void {
    if (this.pauseForm.invalid) return;
    const body = {
      studentId: this.selectedStudentForPause._id,
      ...this.pauseForm.value
    };
    this.api.post('pauses', body).subscribe(() => {
      this.showPauseModal = false;
      this.pauseForm.reset({ type: 'temporary' });
      this.loadSupervisorDashboard();
      alert('تم تسجيل إيقاف الطالب بنجاح!');
    });
  }

  resumeStudent(pauseId: string): void {
    this.api.post(`pauses/${pauseId}/resume`, {}).subscribe(() => {
      this.loadSupervisorDashboard();
      alert('تم إعادة تفعيل الطالب بنجاح!');
    });
  }

  approveSession(sessionId: string): void {
    this.api.post(`sessions/${sessionId}/approve`, {}).subscribe(() => {
      this.loadSupervisorDashboard();
      alert('تم اعتماد الحصة بنجاح!');
    });
  }

  cancelMakeupSupervisor(sessionId: string): void {
    if (confirm('هل أنت متأكد من إلغاء وإيقاف طلب التعويض لهذه الحصة ماليًا وتشغيليًا؟')) {
      this.api.post(`sessions/${sessionId}/cancel-makeup`, {}).subscribe(() => {
        if (this.role === 'Admin') {
          this.loadAdminDashboard();
        } else {
          this.loadSupervisorDashboard();
        }
        alert('تم إلغاء التعويض بنجاح.');
      });
    }
  }

  // --- Teacher Logic ---
  loadTeacherDashboard(): void {
    this.api.get('students').subscribe((res) => {
      this.teacherStudents = res.data;
    });

    this.api.get('sessions/makeups').subscribe((res) => {
      this.pendingMakeups = res.data;
    });

    this.api.get('sessions').subscribe((res) => {
      this.teacherSessions = res.data;
    });

    this.api.get('salaries').subscribe((res) => {
      const currentSalary = res.data[0];
      if (currentSalary) {
        this.teacherHours = currentSalary.hoursTaught;
        this.teacherExpectedSalary = currentSalary.finalPayoutEgp;
      }
    });

    this.loadTeacherSchedule();
  }

  submitSession(): void {
    if (this.sessionForm.invalid) return;
    this.api.post('sessions', this.sessionForm.value).subscribe({
      next: (res) => {
        this.showLogModal = false;
        this.sessionForm.reset({
          subject: 'القرآن الكريم والتجويد',
          date: new Date().toISOString().substring(0, 10),
          durationHours: 1,
          status: 'Present'
        });
        this.loadTeacherDashboard();
        if (res.consecutiveAbsenceAlert) {
          alert(res.message);
        } else {
          alert('تم تسجيل الحصة بنجاح!');
        }
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء تسجيل الحصة')
    });
  }

  openMakeupModal(session: any): void {
    this.selectedMakeupSession = session;
    this.showMakeupModal = true;
    this.makeupForm.patchValue({
      durationHours: session.durationHours
    });
  }

  submitMakeup(): void {
    if (this.makeupForm.invalid) return;
    this.api.post(`sessions/${this.selectedMakeupSession._id}/makeup`, this.makeupForm.value).subscribe(() => {
      this.showMakeupModal = false;
      this.makeupForm.reset({
        makeupDate: new Date().toISOString().substring(0, 10),
        durationHours: 1
      });
      this.loadTeacherDashboard();
      alert('تم جدولة وإكمال الحصة التعويضية بنجاح!');
    });
  }

  submitReport(): void {
    if (this.reportForm.invalid) return;
    this.api.post('reports', this.reportForm.value).subscribe(() => {
      this.showReportModal = false;
      this.reportForm.reset({ startingLevelRating: 1, currentProgressRating: 1, attendancePercentage: 100 });
      alert('تم إرسال التقرير الشهري بنجاح!');
    });
  }

  openEditSessionModal(session: any): void {
    this.selectedSessionForEdit = session;
    this.showEditSessionModal = true;
    this.editSessionForm.patchValue({
      subject: session.subject,
      date: session.date.substring(0, 10),
      durationHours: session.durationHours,
      status: session.status,
      teacherNote: session.teacherNote
    });
  }

  submitEditSessionDirect(): void {
    if (this.editSessionForm.invalid) return;
    this.api.put(`sessions/${this.selectedSessionForEdit._id}`, this.editSessionForm.value).subscribe({
      next: () => {
        this.showEditSessionModal = false;
        this.loadTeacherDashboard();
        alert('تم تعديل الحصة بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء تعديل الحصة')
    });
  }

  openRequestEditModal(session: any): void {
    this.selectedSessionForRequest = session;
    this.showRequestEditModal = true;
    this.requestEditForm.patchValue({
      proposedSubject: session.subject,
      proposedDate: session.date.substring(0, 10),
      proposedDurationHours: session.durationHours,
      proposedStatus: session.status,
      proposedTeacherNote: session.teacherNote
    });
  }

  submitRequestEdit(): void {
    if (this.requestEditForm.invalid) return;
    const body = {
      reason: this.requestEditForm.value.reason,
      proposedChanges: {
        status: this.requestEditForm.value.proposedStatus,
        durationHours: this.requestEditForm.value.proposedDurationHours,
        date: this.requestEditForm.value.proposedDate,
        subject: this.requestEditForm.value.proposedSubject,
        teacherNote: this.requestEditForm.value.proposedTeacherNote
      }
    };
    this.api.post(`sessions/${this.selectedSessionForRequest._id}/request-edit`, body).subscribe({
      next: () => {
        this.showRequestEditModal = false;
        this.requestEditForm.reset({ proposedStatus: 'Present', proposedDurationHours: 1, proposedSubject: 'القرآن الكريم والتجويد' });
        this.loadTeacherDashboard();
        alert('تم تقديم طلب التعديل للمراجعة بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء تقديم طلب التعديل')
    });
  }

  // --- Parent Logic ---
  loadParentDashboard(): void {
    this.api.get('students').subscribe((res) => {
      this.parentChildren = res.data;
    });

    this.api.get('invoices').subscribe((res) => {
      this.parentInvoices = res.data;
    });

    this.api.get('reports').subscribe((res) => {
      this.reports = res.data;
    });
  }

  openPaymentModal(invoice: any): void {
    this.selectedInvoiceForPayment = invoice;
    this.showPaymentModal = true;
  }

  confirmPayment(): void {
    this.api.put(`invoices/${this.selectedInvoiceForPayment._id}/pay`, {}).subscribe(() => {
      this.showPaymentModal = false;
      this.loadParentDashboard();
      alert('Payment completed successfully via PayPal!');
    });
  }

  openDifficultyModal(session: any): void {
    this.selectedSessionForDifficulty = session;
    this.showDifficultyModal = true;
  }

  submitDifficulty(): void {
    if (this.difficultyForm.invalid) return;
    this.api.post(`sessions/${this.selectedSessionForDifficulty._id}/difficulty`, this.difficultyForm.value).subscribe(() => {
      this.showDifficultyModal = false;
      this.difficultyForm.reset();
      this.loadTeacherDashboard();
      alert('تم إرسال ملاحظة الصعوبة للمشرف بنجاح!');
    });
  }

  loadTeacherPerformance(): void {
    this.api.get('analytics/teachers').subscribe((res) => {
      this.teacherPerformanceList = res.data;
    });
  }

  loadLeads(): void {
    this.api.get('leads').subscribe((res) => {
      this.leadsList = res.data;
    });
  }

  submitLead(): void {
    if (this.leadForm.invalid) return;
    this.api.post('leads', this.leadForm.value).subscribe(() => {
      this.showLeadModal = false;
      this.leadForm.reset({ sourceType: 'parent_referral' });
      this.loadLeads();
      alert('تم حفظ مصدر الطالب الجديد بنجاح!');
    });
  }

  loadEditRequests(): void {
    this.api.get('sessions/edit-requests').subscribe((res) => {
      this.editRequestsList = res.data;
    });
  }

  resolveEditRequest(requestId: string, status: 'Approved' | 'Rejected'): void {
    this.api.post(`sessions/edit-requests/${requestId}/resolve`, { status }).subscribe(() => {
      this.loadEditRequests();
      if (this.role === 'Admin') {
        this.loadAdminDashboard();
      } else {
        this.loadSupervisorDashboard();
      }
      alert(`تم ${status === 'Approved' ? 'الموافقة على' : 'رفض'} طلب تعديل الحصة بنجاح.`);
    });
  }

  loadTeacherSchedule(): void {
    this.api.get('schedule').subscribe(res => this.teacherSchedule = res.data);
  }

  submitAddScheduleSlot(): void {
    if (this.scheduleForm.invalid) return;
    this.api.post('schedule', this.scheduleForm.value).subscribe(() => {
      this.showScheduleModal = false;
      this.scheduleForm.reset({ dayOfWeek: 'Sunday', subject: 'القرآن الكريم والتجويد' });
      this.loadTeacherSchedule();
      alert('تم إضافة موعد أسبوعي جديد بنجاح!');
    });
  }

  deleteScheduleSlot(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد الأسبوعي؟')) {
      this.api.delete(`schedule/${id}`).subscribe(() => {
        this.loadTeacherSchedule();
        alert('تم حذف الموعد الأسبوعي بنجاح.');
      });
    }
  }

  loadSeasonalAnalytics(): void {
    this.api.get(`analytics/seasonal?year=${this.analyticsYear}`).subscribe(res => {
      this.seasonalAnalyticsList = res.data;
    });
  }

  transferTeacherSupervisor(teacherId: string, supervisorId: string): void {
    this.api.post('auth/transfer-teacher', { teacherId, newSupervisorId: supervisorId }).subscribe({
      next: (res: any) => {
        this.loadAdminDashboard();
        alert(res.message || 'تم نقل المعلم للمشرف بنجاح!');
      },
      error: (err) => alert(err.error?.message || 'خطأ أثناء نقل المعلم')
    });
  }

  selectScheduleSlot(slot: any): void {
    this.sessionForm.patchValue({
      studentId: slot.student?._id,
      subject: slot.subject
    });
  }

  submitStudent(): void {
    if (this.studentForm.invalid) return;
    this.api.post('students', this.studentForm.value).subscribe({
      next: () => {
        alert('تمت إضافة الطالب بنجاح!');
        this.showStudentModal = false;
        this.studentForm.reset({ teacherIds: [] });
        if (this.role === 'Admin') this.loadAdminDashboard();
        if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
      },
      error: (err) => alert('خطأ: ' + (err.error?.message || 'فشل في الإضافة'))
    });
  }

  submitStaff(): void {
    if (this.staffForm.invalid) return;
    const payload = {
      ...this.staffForm.value,
      supervisor: this.staffForm.value.role === 'Teacher' ? this.staffForm.value.supervisorId : undefined
    };
    this.api.post('auth/register', payload).subscribe({
      next: () => {
        alert('تمت إضافة المعلم/المشرف بنجاح!');
        this.showStaffModal = false;
        this.staffForm.reset({ role: 'Teacher', password: 'password123' });
        this.loadAdminDashboard();
      },
      error: (err) => alert('خطأ: ' + (err.error?.message || 'فشل في الإضافة'))
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';


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

  // Timeline Data
  studentTimeline: any[] = [];
  selectedStudentForTimeline: any = null;
  showTimelineModal = false;

  // Teacher Monthly Performance
  teacherMonthlyPerf: any = null;
  teacherPerfMonthStr: string = new Date().toISOString().substring(0, 7);
  teacherPerfLoading = false;

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
  filterStudentId = '';
  invoiceFilterMonth = '';
  invoiceFilterMethod = '';
  invoiceFilterStatus = '';

  get filteredInvoices(): any[] {
    return this.invoices.filter(inv => {
      if (this.invoiceFilterMonth) {
        const invMonth = inv.month ? new Date(inv.month).toISOString().substring(0, 7) : '';
        if (invMonth !== this.invoiceFilterMonth) return false;
      }
      if (this.invoiceFilterMethod) {
        const method = inv.paymentMethod || 'PayPal';
        if (method !== this.invoiceFilterMethod) return false;
      }
      if (this.invoiceFilterStatus) {
        if (inv.paymentStatus !== this.invoiceFilterStatus) return false;
      }
      return true;
    });
  }

  get filteredSessions(): any[] {
    if (!this.filterStudentId) {
      return this.teacherSessions;
    }
    return this.teacherSessions.filter(s => s.student?._id === this.filterStudentId);
  }

  get avgTimelineAttendance(): string {
    if (!this.studentTimeline || this.studentTimeline.length === 0) return '—';
    const sum = this.studentTimeline.reduce((acc, r) => acc + (r.attendancePercentage || 0), 0);
    return (sum / this.studentTimeline.length).toFixed(0);
  }

  // timezone conversion helpers
  getSelectedStudentTimezone(studentId: string): string | null {
    const student = this.teacherStudents.find(s => s._id === studentId);
    return student ? student.timezone : null;
  }

  convertToStudentTime(timeSlot: string, studentId: string): string {
    if (!timeSlot || !studentId) return '';
    const timezone = this.getSelectedStudentTimezone(studentId);
    if (!timezone) return '';

    try {
      const [hours, minutes] = timeSlot.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);

      return new Intl.DateTimeFormat('ar-EG', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  getStudentLocalTime(timeSlot: string, studentTimezone: string): string {
    if (!timeSlot || !studentTimezone) return '';
    try {
      const [hours, minutes] = timeSlot.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);

      return new Intl.DateTimeFormat('ar-EG', {
        timeZone: studentTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return '';
    }
  }

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private fb: FormBuilder,
    private toast: ToastService
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
      teacherIds: [[]],
      timezone: ['Africa/Cairo', Validators.required]
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
      teacherIds: [[]],
      timezone: ['Africa/Cairo', Validators.required]
    });
  }

  initTeacherForms(): void {
    this.sessionForm = this.fb.group({
      studentId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      status: ['Present', Validators.required],
      teacherNote: ['']
    });

    this.makeupForm = this.fb.group({
      makeupDate: [new Date().toISOString().substring(0, 10), Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
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
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      status: ['Present', Validators.required],
      teacherNote: ['']
    });

    this.requestEditForm = this.fb.group({
      reason: ['', Validators.required],
      proposedStatus: ['Present', Validators.required],
      proposedDurationMinutes: [60, [Validators.required, Validators.min(1)]],
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
    
    if (this.pricingForm.invalid) {
      this.toast.error('بيانات النموذج غير مكتملة أو غير صالحة!'); return;
      return;
    }
    this.api.post('students/pricing', this.pricingForm.value).subscribe({
      next: () => {
        this.showPricingModal = false;
        this.pricingForm.reset({ subject: 'القرآن الكريم والتجويد', currency: 'USD', teacherCurrency: 'EGP', hourlyRate: 15, teacherRate: 200 });
        this.toast.success('تم حفظ خطة التسعير بنجاح!');
      },
      error: (err) => {
        console.error('Error saving pricing:', err);
        this.toast.error(err.error?.message || 'حدث خطأ أثناء حفظ التسعيرة');
      }
    });
  }

  submitGenerateInvoice(): void {
    if (this.invoiceForm.invalid) return;
    this.api.post('invoices/generate', this.invoiceForm.value).subscribe({
      next: () => {
        this.showInvoiceModal = false;
        this.loadAdminDashboard();
        this.toast.success('تم توليد الفاتورة بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء توليد الفاتورة')
    });
  }

  submitGenerateSalary(): void {
    if (this.salaryForm.invalid) return;
    this.api.post('salaries/generate', this.salaryForm.value).subscribe({
      next: () => {
        this.showSalaryModal = false;
        this.loadAdminDashboard();
        this.toast.success('تم توليد مسير الراتب بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء توليد مسير الراتب')
    });
  }

  payInvoiceAdmin(invoiceId: string): void {
    this.api.put(`invoices/${invoiceId}/pay`, {}).subscribe(() => {
      this.loadAdminDashboard();
    });
  }

  updateInvoiceStatus(invoiceId: string, status: string): void {
    this.api.put(`invoices/${invoiceId}/admin-update`, { paymentStatus: status }).subscribe({
      next: () => {
        this.loadAdminDashboard();
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تحديث حالة الفاتورة')
    });
  }

  updateInvoiceMethod(invoiceId: string, method: string): void {
    this.api.put(`invoices/${invoiceId}/admin-update`, { paymentMethod: method }).subscribe({
      next: () => {
        this.loadAdminDashboard();
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تحديث طريقة الدفع')
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
        this.toast.success('تم قفل الشهر المالي المحدد بنجاح.');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء قفل الشهر')
    });
  }

  submitBulkApproveInvoices(): void {
    if (this.bulkInvoiceForm.invalid) return;
    this.api.put('invoices/approve-all', this.bulkInvoiceForm.value).subscribe({
      next: (res) => {
        this.showBulkInvoiceModal = false;
        this.loadAdminDashboard();
        this.toast.success(res.message || 'تم اعتماد فواتير الشهر بالكامل بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء اعتماد الفواتير')
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

    if (this.role === 'GlobalSup') {
      this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
      this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data);
    }
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
      this.toast.success('تم تسجيل إيقاف الطالب بنجاح!');
    });
  }

  resumeStudent(pauseId: string): void {
    this.api.post(`pauses/${pauseId}/resume`, {}).subscribe(() => {
      this.loadSupervisorDashboard();
      this.toast.success('تم إعادة تفعيل الطالب بنجاح!');
    });
  }

  approveSession(sessionId: string): void {
    this.api.post(`sessions/${sessionId}/approve`, {}).subscribe(() => {
      this.loadSupervisorDashboard();
      this.toast.success('تم اعتماد الحصة بنجاح!');
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
        this.toast.success('تم إلغاء التعويض بنجاح.');
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

    this.loadTeacherMonthlyPerf();

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

    // Check if a session already exists for this student on this day
    const studentId = this.sessionForm.value.studentId;
    const dateVal = this.sessionForm.value.date; // format "YYYY-MM-DD"
    const hasExisting = this.teacherSessions.some(s => {
      const sDate = s.date ? s.date.substring(0, 10) : '';
      return s.student?._id === studentId && sDate === dateVal;
    });

    if (hasExisting) {
      const studentName = this.teacherStudents.find(s => s._id === studentId)?.name || 'الطالب';
      const confirmMsg = `تنبيه: الطالب (${studentName}) لديه حصة مسجلة بالفعل في هذا اليوم (${dateVal}). هل أنت متأكد من رغبتك في تسجيل حصة أخرى له في نفس اليوم؟`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    this.api.post('sessions', this.sessionForm.value).subscribe({
      next: (res) => {
        this.showLogModal = false;
        this.sessionForm.reset({
          subject: 'القرآن الكريم والتجويد',
          date: new Date().toISOString().substring(0, 10),
          durationMinutes: 60,
          status: 'Present'
        });
        this.loadTeacherDashboard();
        if (res.consecutiveAbsenceAlert) {
          this.toast.warning(res.message);
        } else {
          this.toast.success('تم تسجيل الحصة بنجاح!');
        }
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تسجيل الحصة')
    });
  }

  openMakeupModal(session: any): void {
    this.selectedMakeupSession = session;
    this.showMakeupModal = true;
    this.makeupForm.patchValue({
      durationMinutes: session.durationMinutes
    });
  }

  submitMakeup(): void {
    if (this.makeupForm.invalid) return;

    const studentId = this.selectedMakeupSession.student?._id;
    const dateVal = this.makeupForm.value.makeupDate;
    const hasExisting = this.teacherSessions.some(s => {
      const sDate = s.date ? s.date.substring(0, 10) : '';
      return s.student?._id === studentId && sDate === dateVal;
    });

    if (hasExisting) {
      const studentName = this.selectedMakeupSession.student?.name || 'الطالب';
      const confirmMsg = `تنبيه: الطالب (${studentName}) لديه حصة مسجلة بالفعل في هذا اليوم (${dateVal}). هل أنت متأكد من رغبتك في تسجيل حصة تعويضية أخرى له في نفس اليوم؟`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    this.api.post(`sessions/${this.selectedMakeupSession._id}/makeup`, this.makeupForm.value).subscribe(() => {
      this.showMakeupModal = false;
      this.makeupForm.reset({
        makeupDate: new Date().toISOString().substring(0, 10),
        durationMinutes: 60
      });
      this.loadTeacherDashboard();
      this.toast.success('تم جدولة وإكمال الحصة التعويضية بنجاح!');
    });
  }

  submitReport(): void {
    if (this.reportForm.invalid) return;
    this.api.post('reports', this.reportForm.value).subscribe(() => {
      this.showReportModal = false;
      this.reportForm.reset({ startingLevelRating: 1, currentProgressRating: 1, attendancePercentage: 100 });
      this.toast.success('تم إرسال التقرير الشهري بنجاح!');
    });
  }

  openEditSessionModal(session: any): void {
    this.selectedSessionForEdit = session;
    this.showEditSessionModal = true;
    this.editSessionForm.patchValue({
      subject: session.subject,
      date: session.date.substring(0, 10),
      durationMinutes: session.durationMinutes,
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
        this.toast.success('تم تعديل الحصة بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تعديل الحصة')
    });
  }

  openRequestEditModal(session: any): void {
    this.selectedSessionForRequest = session;
    this.showRequestEditModal = true;
    this.requestEditForm.patchValue({
      proposedSubject: session.subject,
      proposedDate: session.date.substring(0, 10),
      proposedDurationMinutes: session.durationMinutes,
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
        durationMinutes: this.requestEditForm.value.proposedDurationMinutes,
        date: this.requestEditForm.value.proposedDate,
        subject: this.requestEditForm.value.proposedSubject,
        teacherNote: this.requestEditForm.value.proposedTeacherNote
      }
    };
    this.api.post(`sessions/${this.selectedSessionForRequest._id}/request-edit`, body).subscribe({
      next: () => {
        this.showRequestEditModal = false;
        this.requestEditForm.reset({ proposedStatus: 'Present', proposedDurationMinutes: 60, proposedSubject: 'القرآن الكريم والتجويد' });
        this.loadTeacherDashboard();
        this.toast.success('تم تقديم طلب التعديل للمراجعة بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تقديم طلب التعديل')
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
      this.toast.success('تم الدفع بنجاح عبر PayPal!');
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
      this.toast.success('تم إرسال ملاحظة الصعوبة للمشرف بنجاح!');
    });
  }

  loadTeacherPerformance(monthStr?: string): void {
    const query = monthStr ? `analytics/teachers?monthStr=${monthStr}` : 'analytics/teachers';
    this.api.get(query).subscribe((res) => {
      this.teacherPerformanceList = res.data;
    });
  }

  openStudentTimeline(student: any): void {
    this.selectedStudentForTimeline = student;
    this.studentTimeline = [];
    this.showTimelineModal = true;
    this.loadStudentTimeline(student._id);
  }

  loadStudentTimeline(studentId: string): void {
    this.api.get(`reports/student/${studentId}/timeline`).subscribe({
      next: (res) => {
        this.studentTimeline = res.data;
      },
      error: () => {
        this.studentTimeline = [];
      }
    });
  }

  loadTeacherMonthlyPerf(): void {
    this.teacherPerfLoading = true;
    const monthStr = this.teacherPerfMonthStr;
    const endpoint = `reports/teacher-performance${monthStr ? '?monthStr=' + monthStr : ''}`;
    this.api.get(endpoint).subscribe({
      next: (res) => {
        this.teacherMonthlyPerf = res.data;
        this.teacherPerfLoading = false;
      },
      error: () => {
        this.teacherPerfLoading = false;
      }
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
      this.toast.success('تم حفظ مصدر الطالب الجديد بنجاح!');
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
      this.toast.success(`تم ${status === 'Approved' ? 'الموافقة على' : 'رفض'} طلب تعديل الحصة بنجاح.`);
    });
  }

  loadTeacherSchedule(): void {
    this.api.get('schedule').subscribe(res => this.teacherSchedule = res.data);
  }

  getDayNameAr(day: string): string {
    const days: any = {
      'Sunday': 'الأحد',
      'Monday': 'الاثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت'
    };
    return days[day] || day;
  }

  submitAddScheduleSlot(): void {
    if (this.scheduleForm.invalid) return;

    const dayOfWeek = this.scheduleForm.value.dayOfWeek;
    const studentId = this.scheduleForm.value.studentId;

    const hasExisting = this.teacherSchedule.some(slot => {
      return slot.dayOfWeek === dayOfWeek && slot.student?._id === studentId;
    });

    if (hasExisting) {
      const studentName = this.teacherStudents.find(s => s._id === studentId)?.name || 'الطالب';
      const dayNameAr = this.getDayNameAr(dayOfWeek);
      const confirmMsg = `تنبيه: الطالب (${studentName}) لديه موعد ثابت مسجل بالفعل في يوم (${dayNameAr}). هل أنت متأكد من رغبتك في إضافة موعد آخر له في نفس اليوم؟`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    this.api.post('schedule', this.scheduleForm.value).subscribe(() => {
      this.showScheduleModal = false;
      this.scheduleForm.reset({ dayOfWeek: 'Sunday', subject: 'القرآن الكريم والتجويد' });
      this.loadTeacherSchedule();
      this.toast.success('تم إضافة موعد أسبوعي جديد بنجاح!');
    });
  }

  deleteScheduleSlot(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد الأسبوعي؟')) {
      this.api.delete(`schedule/${id}`).subscribe(() => {
        this.loadTeacherSchedule();
        this.toast.success('تم حذف الموعد الأسبوعي بنجاح.');
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
        this.toast.success(res.message || 'تم نقل المعلم للمشرف بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء نقل المعلم')
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
        this.toast.success('تمت إضافة الطالب بنجاح!');
        this.showStudentModal = false;
        this.studentForm.reset({ teacherIds: [], timezone: 'Africa/Cairo' });
        if (this.role === 'Admin') this.loadAdminDashboard();
        if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
      },
      error: (err) => this.toast.error(err.error?.message || 'فشل في الإضافة')
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
        this.toast.success('تمت إضافة المعلم/المشرف بنجاح!');
        this.showStaffModal = false;
        this.staffForm.reset({ role: 'Teacher', password: 'password123' });
        this.loadAdminDashboard();
      },
      error: (err) => this.toast.error(err.error?.message || 'فشل في الإضافة')
    });
  }
}

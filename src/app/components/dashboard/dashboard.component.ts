import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
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
  @ViewChild('teacherAvailabilityBlock') teacherAvailabilityBlock!: TemplateRef<any>;
  @ViewChild('availabilitySearchBlock') availabilitySearchBlock!: TemplateRef<any>;

  role: string | null = '';
  user: any;
  isDarkMode = true;
  activeTab = 'overview';
  isSidebarOpen = false;

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
  isSubmittingStudent = false;  // ← إصلاح double-submit
  editingStudentId: string | null = null;
  addingStudentForTeacher: any = null;
  editingStaffId: string | null = null;

  // Parent Modal (Admin + Supervisor)
  parentForm!: FormGroup;
  showParentModal = false;
  isSubmittingParent = false;

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
  showTeacherRateModal = false;
  teacherRateForm!: FormGroup;
  selectedTeacherForRateModal: any = null;
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
  selectedScheduleDays: string[] = ['Sunday'];
  scheduleStudentMode: 'existing' | 'new' = 'existing';
  newStudentName: string = '';
  newStudentAge: number | null = null;
  newStudentCountry: string = '';
  newStudentTimezone: string = 'US-EST';

  showEditStudentScheduleModal: boolean = false;
  selectedStudentForScheduleEdit: any = null;
  editingStudentScheduleSlots: { _id?: string; dayOfWeek: string; timeSlot: string; durationMinutes: number }[] = [];
  editingStudentTimezone: string = 'US-EST';
  editingStudentCountry: string = '';
  scheduleForm!: FormGroup;

  // Task 2: Timezone display toggle and schedule edit request state
  displayTimezoneMode: 'Student' | 'Teacher' = 'Student';
  scheduleEditRequestsList: any[] = [];

  format12Hour(time24: string): string {
    if (!time24) return '';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return time24;
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }

  toggleDisplayTimezoneMode(): void {
    this.displayTimezoneMode = this.displayTimezoneMode === 'Student' ? 'Teacher' : 'Student';
  }

  loadScheduleEditRequests(): void {
    this.api.get('schedule/edit-requests').subscribe({
      next: (res: any) => {
        this.scheduleEditRequestsList = res.data || [];
      }
    });
  }

  // Enhanced Session Form Properties
  studentSearchQuery: string = '';
  approvedProgramsList = [
    'القرآن الكريم والتجويد',
    'اللغة العربية والإملاء',
    'الدراسات الإسلامية والفقه',
    'القاعدة النورانية والرشيدية',
    'حصة مدمجة',
    'برنامج مخصص'
  ];

  sessionStatusesList = [
    { key: 'Present', ar: 'حضر', desc: 'حضور الطالب في الموعد' },
    { key: 'Unexcused', ar: 'غياب بدون عذر', desc: 'غياب الطالب بدون إخطار مسبق' },
    { key: 'Excused', ar: 'غياب بعذر', desc: 'غياب الطالب بعذر مقبول وتحديد تعويض' },
    { key: 'TeacherAbs', ar: 'غياب المعلم', desc: 'إلغاء الحصة من قبل المعلم وتحديد تعويض' },
    { key: 'Trial', ar: 'حصة تجريبية', desc: 'حصة تقييم وتجربة للطالب الجديد' },
    { key: 'TeacherMakeup', ar: 'حصة تعويض عن غياب المعلم', desc: 'حصة تعويضية لتسديد غياب سابق للمعلم' },
    { key: 'StudentMakeup', ar: 'حصة تعويض عن غياب الطالب', desc: 'حصة تعويضية لتسديد غياب سابق للطالب' }
  ];

  selectedDurationMode: string = '60';
  customDurationMinutes: number = 60;
  hasDeterminedMakeupDate: boolean = false;
  scheduledMakeupDateStr: string = '';
  scheduledMakeupTimeSlotStr: string = '17:00';
  selectedOriginalSessionId: string = '';
  latenessRemarkStr: string = '';
  notifiedOnGroupBool: boolean = false;
  preNotifiedTwoHoursBool: boolean = false;

  studentPendingAbsences: any[] = [];
  makeupDashboardSessions: any[] = [];
  makeupDashboardLoading: boolean = false;

  get sortedAndFilteredStudents(): any[] {
    if (!this.teacherStudents) return [];
    let list = [...this.teacherStudents].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    if (this.studentSearchQuery && this.studentSearchQuery.trim()) {
      const q = this.studentSearchQuery.trim().toLowerCase();
      list = list.filter(s => (s.name || '').toLowerCase().includes(q));
    }
    return list;
  }

  onLogStudentChange(studentId: string): void {
    if (!studentId) {
      this.studentPendingAbsences = [];
      return;
    }
    this.api.get('sessions/makeups').subscribe({
      next: (res: any) => {
        const makeups = res.data || [];
        this.studentPendingAbsences = makeups.filter((m: any) => 
          (m.student?._id === studentId || m.student === studentId) && m.makeupStatus !== 'Completed'
        );
      }
    });
  }

  getDateBadgeLabel(dateStr: string): { label: string; class: string } {
    if (!dateStr) return { label: '', class: '' };
    const today = new Date().toISOString().substring(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().substring(0, 10);

    if (dateStr === today) {
      return { label: 'اليوم 🟢', class: 'badge-success' };
    } else if (dateStr === yesterday) {
      return { label: 'أمس 🟡', class: 'badge-warning' };
    } else {
      const d1 = new Date(today).getTime();
      const d2 = new Date(dateStr).getTime();
      const diffDays = Math.round((d1 - d2) / (1000 * 3600 * 24));
      return { label: `تاريخ سابق (قبل ${diffDays} يوم) ⚠️`, class: 'badge-rose' };
    }
  }

  loadMakeupDashboardStats(): void {
    this.makeupDashboardLoading = true;
    this.api.get('sessions/makeups/dashboard').subscribe({
      next: (res: any) => {
        this.makeupDashboardSessions = res.data || [];
        this.makeupDashboardLoading = false;
      },
      error: () => { this.makeupDashboardLoading = false; }
    });
  }
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

  durationMinuteOptions: number[] = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
    65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
  ];

  // Admin Data
  adminStats = { totalRevenue: 0, pendingSalaries: 0, activeStudents: 0 };
  invoices: any[] = [];
  salaries: any[] = [];
  globalSupervisorsList: any[] = [];
  exchangeRate: number = 50.0;
  pricingsList: any[] = [];
  managementAlerts: any[] = [];
  showInvoiceDetailsModal = false;
  selectedInvoiceForDetails: any = null;
  parentlessStudents: any[] = [];
  selectedStudentIdsForNewParent: string[] = [];
  parentlessStudentSearchQuery: string = '';

  get filteredParentlessStudents(): any[] {
    if (!this.parentlessStudents || this.parentlessStudents.length === 0) return [];
    if (!this.parentlessStudentSearchQuery.trim()) return this.parentlessStudents;
    const q = this.parentlessStudentSearchQuery.trim().toLowerCase();
    return this.parentlessStudents.filter(s => s.name && s.name.toLowerCase().includes(q));
  }

  // Supervisor Data
  pendingSessions: any[] = [];
  supervisedStudents: any[] = [];
  activePauses: any[] = [];
  selectedStudentForPause: any = null;
  supervisorMakeups: any[] = [];
  supervisorSessionChecklist: { [sessionId: string]: any } = {};

  get groupedPendingSessions(): { teacher: any, sessions: any[] }[] {
    if (!this.pendingSessions || this.pendingSessions.length === 0) return [];
    const map = new Map<string, { teacher: any, sessions: any[] }>();

    for (const session of this.pendingSessions) {
      const t = session.teacher || { _id: 'unassigned', name: 'معلم غير محدد' };
      const tid = t._id || 'unassigned';

      if (!map.has(tid)) {
        map.set(tid, { teacher: t, sessions: [] });
      }
      map.get(tid)!.sessions.push(session);
    }
    return Array.from(map.values());
  }

  getChecklistState(sessionId: string): any {
    if (!this.supervisorSessionChecklist[sessionId]) {
      this.supervisorSessionChecklist[sessionId] = {
        teacherOnTime: false,
        teacherLateAskedParents: false,
        sentSessionReport: false,
        sentReportAfterRemind: false,
        evaluatedQuality: false,
        sentInteractiveActivity: false
      };
    }
    return this.supervisorSessionChecklist[sessionId];
  }

  toggleChecklistOption(sessionId: string, optionKey: string): void {
    const state = this.getChecklistState(sessionId);
    state[optionKey] = !state[optionKey];
  }

  // My Group Students
  myGroupSearchQuery = '';
  myGroupSelectedTeacher = '';

  get myGroupTeachers() {
    const teachersMap = new Map<string, any>();
    for (const student of this.supervisedStudents) {
      const studentTeachers = Array.isArray(student.teachers) && student.teachers.length > 0 
        ? student.teachers 
        : student.teacher ? [student.teacher] : [];
      for (const t of studentTeachers) {
        if (t && t._id) {
          teachersMap.set(t._id, t);
        }
      }
    }
    return Array.from(teachersMap.values());
  }

  get myGroupStudentsGrouped() {
    const groups = new Map<string, { teacher: any, students: any[] }>();
    
    let students = this.supervisedStudents;
    if (this.myGroupSearchQuery) {
      const q = this.myGroupSearchQuery.toLowerCase();
      students = students.filter(s => s.name?.toLowerCase().includes(q));
    }

    for (const s of students) {
      const studentTeachers = Array.isArray(s.teachers) && s.teachers.length > 0 
        ? s.teachers 
        : s.teacher ? [s.teacher] : [];
        
      if (studentTeachers.length === 0) {
        if (!groups.has('unassigned')) {
          groups.set('unassigned', { teacher: { _id: 'unassigned', name: 'بدون معلم' }, students: [] });
        }
        groups.get('unassigned')!.students.push(s);
      } else {
        for (const t of studentTeachers) {
          if (!t || !t._id) continue;
          if (!groups.has(t._id)) {
            groups.set(t._id, { teacher: t, students: [] });
          }
          groups.get(t._id)!.students.push(s);
        }
      }
    }

    let result = Array.from(groups.values());
    if (this.myGroupSelectedTeacher) {
       result = result.filter(g => g.teacher._id === this.myGroupSelectedTeacher);
    }
    
    return result;
  }

  // --- Grouping by Teacher for Deficit Panels ---
  collapsedTeachers: { [teacherId: string]: boolean } = {};

  toggleTeacherCollapse(teacherId: string): void {
    this.collapsedTeachers[teacherId] = !this.collapsedTeachers[teacherId];
  }

  isTeacherCollapsed(teacherId: string): boolean {
    return !!this.collapsedTeachers[teacherId];
  }

  get adminStudentsGroupedByTeacher() {
    const groups = new Map<string, { teacher: any, students: any[] }>();
    for (const s of this.studentsList) {
      const studentTeachers = Array.isArray(s.teachers) && s.teachers.length > 0 
        ? s.teachers 
        : s.teacher ? [s.teacher] : [];
        
      if (studentTeachers.length === 0) {
        if (!groups.has('unassigned')) {
          groups.set('unassigned', { teacher: { _id: 'unassigned', name: 'طلاب بدون معلم' }, students: [] });
        }
        groups.get('unassigned')!.students.push(s);
      } else {
        for (const t of studentTeachers) {
          if (!t || !t._id) continue;
          if (!groups.has(t._id)) {
            groups.set(t._id, { teacher: t, students: [] });
          }
          groups.get(t._id)!.students.push(s);
        }
      }
    }
    return Array.from(groups.values());
  }

  get supervisorStudentsGroupedByTeacher() {
    const groups = new Map<string, { teacher: any, students: any[] }>();
    for (const s of this.supervisedStudents) {
      const studentTeachers = Array.isArray(s.teachers) && s.teachers.length > 0 
        ? s.teachers 
        : s.teacher ? [s.teacher] : [];
        
      if (studentTeachers.length === 0) {
        if (!groups.has('unassigned')) {
          groups.set('unassigned', { teacher: { _id: 'unassigned', name: 'طلاب بدون معلم' }, students: [] });
        }
        groups.get('unassigned')!.students.push(s);
      } else {
        for (const t of studentTeachers) {
          if (!t || !t._id) continue;
          if (!groups.has(t._id)) {
            groups.set(t._id, { teacher: t, students: [] });
          }
          groups.get(t._id)!.students.push(s);
        }
      }
    }
    return Array.from(groups.values());
  }

  // --- Weekly Schedule Spreadsheet ---
  weeklyScheduleData: any = null;
  weeklyScheduleLoading = false;
  selectedWeeklyScheduleTeacherId = '';

  loadWeeklySchedule(teacherId: string): void {
    if (!teacherId) return;
    this.weeklyScheduleLoading = true;
    this.selectedWeeklyScheduleTeacherId = teacherId;
    this.api.get(`reports/weekly-schedule/${teacherId}`).subscribe({
      next: (res) => {
        this.weeklyScheduleData = res.data;
        this.weeklyScheduleLoading = false;
      },
      error: (err) => {
        console.error('Error fetching weekly schedule:', err);
        this.weeklyScheduleLoading = false;
      }
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  }

  // --- Teachers Deficit Matrix (العجز العام للساعات للمعلمين) ---
  deficitMatrixData: any = null;
  deficitMatrixLoading = false;
  deficitMatrixMonth: string = new Date().toISOString().substring(0, 7);
  selectedDeficitTeacherId: string = '';
  expandedTeacherIds: Set<string> = new Set<string>();

  loadDeficitMatrix(): void {
    this.deficitMatrixLoading = true;
    let path = `reports/teachers-deficit-matrix?month=${this.deficitMatrixMonth}`;
    if (this.selectedDeficitTeacherId) {
      path += `&teacherId=${this.selectedDeficitTeacherId}`;
    }
    this.api.get(path).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.deficitMatrixData = res;
        }
        this.deficitMatrixLoading = false;
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'تعذر تحميل مصفوفة العجز العام');
        this.deficitMatrixLoading = false;
      }
    });
  }

  toggleExpandTeacher(teacherId: string): void {
    if (this.expandedTeacherIds.has(teacherId)) {
      this.expandedTeacherIds.delete(teacherId);
    } else {
      this.expandedTeacherIds.add(teacherId);
    }
  }

  isTeacherExpanded(teacherId: string): boolean {
    return this.expandedTeacherIds.has(teacherId);
  }

  exportDeficitToExcel(): void {
    if (!this.deficitMatrixData || !this.deficitMatrixData.data || this.deficitMatrixData.data.length === 0) {
      this.toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Arabic text in Excel
    csvContent += 'المعلم,اسم الطالب,حالة الطالب,الساعات المتوقعة,الساعات الفعلية,العجز (ساعة),أسباب العجز والتفاصيل\n';

    this.deficitMatrixData.data.forEach((tRow: any) => {
      const teacherName = `"${tRow.teacher?.name || ''}"`;
      if (tRow.students && tRow.students.length > 0) {
        tRow.students.forEach((sRow: any) => {
          const causesText = sRow.causes && sRow.causes.length > 0
            ? sRow.causes.map((c: any) => `${c.badge}: ${c.details}`).join(' | ')
            : 'منتظم (لا يوجد عجز)';
          
          const studentName = `"${sRow.studentName || ''}"`;
          const status = `"${sRow.status || ''}"`;
          const expected = sRow.expectedHours;
          const actual = sRow.actualHours;
          const deficit = sRow.deficitHours;
          const causeEscaped = `"${causesText.replace(/"/g, '""')}"`;

          csvContent += `${teacherName},${studentName},${status},${expected},${actual},${deficit},${causeEscaped}\n`;
        });
      } else {
        csvContent += `${teacherName},"لا يوجد طلاب","—",${tRow.expectedHours},${tRow.actualHours},${tRow.deficitHours},"—"\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_العجز_العام_للمعلمين_${this.deficitMatrixMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('تم تصدير ملف الإكسيل بنجاح');
  }

  // --- Teacher Availability & Smart Timezone Matcher ---
  teacherAvailabilityList: any[] = [];
  availabilityLoading = false;
  isAvailableForNewStudents = true;
  availabilityStatusNote = '';
  selectedAvailabilityTeacherId = '';

  // Form for adding slot
  newSlotDay = 'Sunday';
  newSlotTime = '17:00';
  newSlotDuration = 60;
  newSlotIsPermanent = true;
  newSlotDate = '';
  newSlotNotes = '';

  // Smart Search for Admin / Supervisor
  searchTimezoneKey = 'US-EST';
  searchDayOfWeek = 'Sunday';
  searchTimeStudent = '10:00';
  searchMatchingLoading = false;
  searchMatchingResults: any = null;

  availableTimezonesList = [
    // 🇺🇸 المناطق الزمنية للولايات الأمريكية (US States Timezones)
    { key: 'America/New_York', name: '🇺🇸 التوقيت الشرقي (EST) - نيويورك، فلوريدا، جورجيا، فرجينيا، بنسلفانيا، أوهايو، ميتشيجان، نيوجيرسي، ماساتشوستس، كارولاينا، إنديانا، ماريلاند (فرق -7س)', offset: -7 },
    { key: 'America/Chicago', name: '🇺🇸 التوقيت المركزي (CST) - تكساس، شيكاغو/إلينوي، ميزوري، مينيسوتا، لويزيانا، ألاباما، تينيسي، ويسكونسن، أيوا، كانساس، أوكلاهوما (فرق -8س)', offset: -8 },
    { key: 'America/Denver', name: '🇺🇸 التوقيت الجبلي (MST) - كولورادو/دنفر، يوتا، نيو مكسيكو، وايومنغ، مونتانا، أيداهو (فرق -9س)', offset: -9 },
    { key: 'America/Phoenix', name: '🇺🇸 توقيت أريزونا الجبلي الثابت (MST - Arizona) - ولاية أريزونا / فينيكس (فرق -10س ثابت بدون صيفي)', offset: -10 },
    { key: 'America/Los_Angeles', name: '🇺🇸 توقيت المحيط الهادئ (PST) - كاليفورنيا/لوس أنجلوس، واشنطن/سياتل، أوريغون، نيفادا/لاس فيغاس (فرق -10س)', offset: -10 },
    { key: 'America/Anchorage', name: '🇺🇸 توقيت ألاسكا (AKST) - ولاية ألاسكا (فرق -11س)', offset: -11 },
    { key: 'Pacific/Honolulu', name: '🇺🇸 توقيت هاواي (HST) - ولاية هاواي / هونولولو (فرق -13س)', offset: -13 },

    // 🇨🇦 كندا (Canada Timezones)
    { key: 'America/Toronto', name: '🇨🇦 كندا الشرقي (EST) - تورونتو، أوتوا، مونتريال، أونتاريو، كيبك (فرق -7س)', offset: -7 },
    { key: 'America/Vancouver', name: '🇨🇦 كندا الهادئ (PST) - فانكوفر، فكتوريا، بريتيش كولومبيا (فرق -10س)', offset: -10 },

    // 🌍 الدول العربية والخليج العربي (Arab & Gulf Countries)
    { key: 'Africa/Cairo', name: '🇪🇬 مصر - القاهرة، الإسكندرية (EET / UTC+3)', offset: 0 },
    { key: 'Asia/Riyadh', name: '🇸🇦 السعودية - الرياض، مكة، جدة، الدمام (AST / UTC+3)', offset: 0 },
    { key: 'Asia/Dubai', name: '🇦🇪 الإمارات - دبي، أبوظبي، الشارقة (GST / UTC+4)', offset: 1 },
    { key: 'Asia/Kuwait', name: '🇰🇼 الكويت - العاصمة (AST / UTC+3)', offset: 0 },
    { key: 'Asia/Qatar', name: '🇶🇦 قطر - الدوحة (AST / UTC+3)', offset: 0 },
    { key: 'Asia/Bahrain', name: '🇧🇭 البحرين - المنامة (AST / UTC+3)', offset: 0 },
    { key: 'Asia/Muscat', name: '🇴🇲 عُمان - مسقط (GST / UTC+4)', offset: 1 },
    { key: 'Asia/Amman', name: '🇯🇴 الأردن - عمّان (EET / UTC+3)', offset: 0 },
    { key: 'Asia/Beirut', name: '🇱🇧 لبنان - بيروت (EET / UTC+3)', offset: 0 },
    { key: 'Asia/Baghdad', name: '🇮🇶 العراق - بغداد (AST / UTC+3)', offset: 0 },
    { key: 'Africa/Khartoum', name: '🇸🇩 السودان - الخرطوم (CAT / UTC+2)', offset: -1 },
    { key: 'Africa/Tripoli', name: '🇱🇾 ليبيا - طرابلس (EET / UTC+2)', offset: -1 },
    { key: 'Africa/Tunis', name: '🇹🇳 تونس - العاصمة (CET / UTC+1)', offset: -2 },
    { key: 'Africa/Algiers', name: '🇩🇿 الجزائر - العاصمة (CET / UTC+1)', offset: -2 },
    { key: 'Africa/Casablanca', name: '🇲🇦 المغرب - الدار البيضاء، الرباط (WET / UTC+1)', offset: -2 },

    // 🇪🇺 أوروبا وباقي العالم (Europe & International)
    { key: 'Europe/London', name: '🇬🇧 بريطانيا - لندن، مانشستر (GMT/BST / UTC+1)', offset: -2 },
    { key: 'Europe/Paris', name: '🇫🇷 🇩🇪 فرنسا، ألمانيا، إيطاليا، إسبانيا، هولندا (CET / UTC+2)', offset: -1 },
    { key: 'Europe/Istanbul', name: '🇹🇷 تركيا - إسطنبول، أنقرة (TRT / UTC+3)', offset: 0 },
    { key: 'Europe/Moscow', name: '🇷🇺 روسيا - موسكو (MSK / UTC+3)', offset: 0 },
    { key: 'Australia/Sydney', name: '🇦🇺 أستراليا - سيدني، ملبورن (AEST / UTC+10)', offset: 7 },
    { key: 'Australia/Perth', name: '🇦🇺 أستراليا - بيرث (AWST / UTC+8)', offset: 5 },
    { key: 'Asia/Kuala_Lumpur', name: '🇲🇾 🇸🇬 ماليزيا / سنغافورة (SGT / UTC+8)', offset: 5 }
  ];

  // Day filter & grouping for availability
  selectedAvailabilityDayFilter: string = 'ALL';
  availabilityViewMode: 'grouped' | 'grid' = 'grouped';

  daysOfWeekList = [
    { key: 'Sunday', ar: 'الأحد', shortAr: 'أحد' },
    { key: 'Monday', ar: 'الاثنين', shortAr: 'اتنين' },
    { key: 'Tuesday', ar: 'الثلاثاء', shortAr: 'ثلاثاء' },
    { key: 'Wednesday', ar: 'الأربعاء', shortAr: 'أربعاء' },
    { key: 'Thursday', ar: 'الخميس', shortAr: 'خميس' },
    { key: 'Friday', ar: 'الجمعة', shortAr: 'جمعة' },
    { key: 'Saturday', ar: 'السبت', shortAr: 'سبت' }
  ];

  getSlotCountForDay(dayKey: string): number {
    if (!this.teacherAvailabilityList) return 0;
    return this.teacherAvailabilityList.filter(slot => slot.dayOfWeek === dayKey).length;
  }

  getDayArName(dayKey: string): string {
    const found = this.daysOfWeekList.find(d => d.key === dayKey);
    return found ? found.ar : dayKey;
  }

  get filteredAvailabilityList(): any[] {
    if (!this.teacherAvailabilityList) return [];
    let list = [...this.teacherAvailabilityList];

    if (this.selectedAvailabilityDayFilter !== 'ALL') {
      list = list.filter(slot => slot.dayOfWeek === this.selectedAvailabilityDayFilter);
    }

    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return list.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });
  }

  get groupedAvailabilityList(): { dayKey: string; dayAr: string; slots: any[] }[] {
    if (!this.teacherAvailabilityList || this.teacherAvailabilityList.length === 0) return [];

    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const groupedMap = new Map<string, any[]>();
    dayOrder.forEach(day => groupedMap.set(day, []));

    this.teacherAvailabilityList.forEach(slot => {
      const day = slot.dayOfWeek || 'Sunday';
      if (groupedMap.has(day)) {
        groupedMap.get(day)!.push(slot);
      } else {
        groupedMap.set(day, [slot]);
      }
    });

    const result: { dayKey: string; dayAr: string; slots: any[] }[] = [];

    dayOrder.forEach(dayKey => {
      const slots = groupedMap.get(dayKey) || [];
      slots.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

      if (this.selectedAvailabilityDayFilter !== 'ALL' && this.selectedAvailabilityDayFilter !== dayKey) {
        return;
      }

      if (slots.length > 0) {
        const dayInfo = this.daysOfWeekList.find(d => d.key === dayKey);
        result.push({
          dayKey,
          dayAr: dayInfo ? dayInfo.ar : dayKey,
          slots
        });
      }
    });

    return result;
  }

  loadTeacherAvailability(): void {
    this.availabilityLoading = true;
    let path = 'availability';
    if (['Admin', 'GlobalSup', 'Supervisor'].includes(this.role || '') && this.selectedAvailabilityTeacherId) {
      path += `?teacherId=${this.selectedAvailabilityTeacherId}`;
    }
    this.api.get(path).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.teacherAvailabilityList = res.data;
          if (res.teacher) {
            this.isAvailableForNewStudents = res.teacher.isAvailableForNewStudents !== undefined ? res.teacher.isAvailableForNewStudents : true;
            this.availabilityStatusNote = res.teacher.availabilityStatusNote || '';
          }
        }
        this.availabilityLoading = false;
      },
      error: () => { this.availabilityLoading = false; }
    });
  }

  submitAddAvailability(): void {
    if (!this.newSlotDay || !this.newSlotTime) {
      this.toast.error('يرجى اختيار اليوم والساعة بتوقيت مصر!');
      return;
    }

    const payload = {
      dayOfWeek: this.newSlotDay,
      timeSlot: this.newSlotTime,
      durationMinutes: this.newSlotDuration,
      isPermanent: this.newSlotIsPermanent,
      specificDate: !this.newSlotIsPermanent && this.newSlotDate ? this.newSlotDate : null,
      notes: this.newSlotNotes,
      teacherId: this.selectedAvailabilityTeacherId || undefined
    };

    this.api.post('availability', payload).subscribe({
      next: () => {
        this.toast.success('تمت إضافة موعد التفرغ بنجاح!');
        this.newSlotNotes = '';
        this.loadTeacherAvailability();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'تعذر إضافة موعد التفرغ')
    });
  }

  deleteAvailability(slotId: string): void {
    if (!confirm('هل أنت متأكد من حذف موعد التفرغ هذا؟')) return;
    this.api.delete(`availability/${slotId}`).subscribe({
      next: () => {
        this.toast.success('تم حذف موعد التفرغ بنجاح!');
        this.loadTeacherAvailability();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'تعذر حذف موعد التفرغ')
    });
  }

  toggleTeacherAvailableStatus(): void {
    const payload = {
      isAvailableForNewStudents: this.isAvailableForNewStudents,
      availabilityStatusNote: this.availabilityStatusNote,
      teacherId: this.selectedAvailabilityTeacherId || undefined
    };
    this.api.put('availability/status', payload).subscribe({
      next: () => {
        this.toast.success('تم تحديث حالة تفرغ المعلم بنجاح!');
      },
      error: (err: any) => this.toast.error(err.error?.message || 'تعذر تحديث الحالة')
    });
  }

  searchMatchingTeachersForStudent(): void {
    this.searchMatchingLoading = true;
    const path = `availability/search-matching?timezoneKey=${this.searchTimezoneKey}&dayOfWeek=${this.searchDayOfWeek}&timeSlotStudent=${this.searchTimeStudent}`;
    this.api.get(path).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.searchMatchingResults = res;
        }
        this.searchMatchingLoading = false;
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'تعذر جلب المعلمين المتفرغين');
        this.searchMatchingLoading = false;
      }
    });
  }




  // Comprehensive View (Supervisor / GlobalSup)
  showComprehensiveView = false;
  comprehensiveFilterType: 'teacher' | 'student' | '' = '';  // الفيلتر الأول: نوع البحث
  comprehensiveFilterId = '';                                 // الفيلتر الثاني: المعلم أو الطالب المحدد
  comprehensiveFilter = { teacherId: '', status: '' };        // يُحتفظ به للتوافق مع كود إعادة الضبط
  comprehensiveStudents: any[] = [];

  // ── Hierarchy (Org Tree) ────────────────────────────────────
  hierarchyData: any[] = [];           // المشرفون العامون → المشرفون → المعلمون → الطلاب
  hierarchyLoading = false;
  hierarchyDrillLevel: 'globalSup' | 'supervisor' | 'teacher' | 'student' = 'globalSup';
  selectedHierarchyGS: any = null;    // المشرف العام المختار
  selectedHierarchySup: any = null;   // المشرف العادي المختار
  selectedHierarchyTeacher: any = null; // المعلم المختار
  hierarchySearchQuery = '';

  // Student photo upload
  studentPhotoPreview: string = '';

  // Teacher Data
  teacherStudents: any[] = [];
  teacherHours = 0;
  teacherExpectedSalary = 0;
  teacherSalaryEstimate: any = null;
  teacherSalaryMonthStr: string = new Date().toISOString().substring(0, 7);
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

  // البرامج الجديدة
  availablePrograms = [
    'القرآن حفظ وضبط التلاوة',
    'القرآن حفظ مع التلاوة والتفسير المبسط',
    'برنامج التجويد والتلاوة',
    'اللغة العربية محادثة',
    'اللغة العربية قرائية',
    'برنامج التربية الإسلامية',
    'برنامج صعوبات التعلم',
    'برنامج البرمجة',
    'برامج الماث',
    'أخرى'
  ];

  // مستويات كل برنامج
  programLevelsMap: Record<string, string[]> = {
    'القرآن حفظ وضبط التلاوة': ['مبتدئ (لا يحفظ)', 'حافظ لقصار السور', 'حافظ جزء وأكثر', 'حافظ بدون ضبط تلاوة'],
    'القرآن حفظ مع التلاوة والتفسير المبسط': ['مبتدئ (من البداية)', 'حافظ لقصار السور', 'حافظ جزء أو أكثر', 'حافظ ولكن بحاجة للمراجعة', 'حافظ ويريد تفسير متقدم'],
    'برنامج التجويد والتلاوة': ['مبتدئ تماماً', 'بحاجة لضبط التلاوة فقط', 'بحاجة لتعلم قواعد التجويد', 'متقدم وبحاجة للمراجعة'],
    'اللغة العربية محادثة': ['من البداية', 'يعرف كلمات وجمل بسيطة', 'ممارسة لهجة معينة'],
    'اللغة العربية قرائية': ['من الأحرف', 'من الحركات القصيرة', 'من الحركات الطويلة', 'مراجعة وتمكين'],
    'برنامج التربية الإسلامية': ['مبتدئ تماماً', 'يعرف الأساسيات', 'متوسط', 'متقدم'],
    'برنامج صعوبات التعلم': ['صعوبات قراءة وكتابة', 'تعديل سلوك', 'تخاطب', 'أخرى'],
    'برنامج البرمجة': ['مبتدئ', 'متوسط', 'متقدم'],
    'برامج الماث': ['حساب ذهني ومهارات', 'دروس خصوصية'],
    'أخرى': []
  };

  // الكتب المقترحة لكل برنامج
  programBooksMap: Record<string, string[]> = {
    'القرآن حفظ وضبط التلاوة': ['القرآن الكريم', 'كتب التجويد', 'كتب القرائية'],
    'القرآن حفظ مع التلاوة والتفسير المبسط': ['المصحف', 'كتب التجويد', 'كتب التفسير', 'كتب الأكاديمية', 'كتب القرائية'],
    'برنامج التجويد والتلاوة': ['المصحف', 'كتب القرائية', 'كتب التجويد'],
    'اللغة العربية محادثة': ['العربية بين يديك', 'كتب محادثة متخصصة (لهجة معينة)', 'كتب القرائية', 'فجر الأحرف', 'فجر القراءة', 'فجر الطلاقة'],
    'اللغة العربية قرائية': ['نور البيان / كتب القرائية', 'فجر الأحرف', 'فجر القراءة', 'فجر الطلاقة'],
    'برنامج التربية الإسلامية': ['كتب الأكاديمية', 'كتب خارجية', 'منهج معد خصيصاً للطالب'],
    'برنامج صعوبات التعلم': [],
    'برنامج البرمجة': ['Outsource', 'منهج الأكاديمية'],
    'برامج الماث': [],
    'أخرى': []
  };

  // حالة نماذج البيانات لكل برنامج (مستوى وكتب)
  selectedProgramLevels: Record<string, string> = {};
  selectedProgramBooks: Record<string, string[]> = {};
  customProgramText = '';

  // جدول المواعيد المتعددة
  scheduleSlots: Array<{day: string, time: string, durationMinutes: number}> = [];

  // فيلتر النص في النظرة الشاملة
  comprehensiveNameFilter = '';

  // Supervisor hierarchy - mini drill
  supHierarchySelectedTeacher: any = null;
  supHierarchySelectedStudent: any = null;

  availableDays = [
    { value: 'Sunday', label: 'الأحد' },
    { value: 'Monday', label: 'الاثنين' },
    { value: 'Tuesday', label: 'الثلاثاء' },
    { value: 'Wednesday', label: 'الأربعاء' },
    { value: 'Thursday', label: 'الخميس' },
    { value: 'Friday', label: 'الجمعة' },
    { value: 'Saturday', label: 'السبت' }
  ];

  getDayLabel(val: string): string {
    return this.availableDays.find(d => d.value === val)?.label || val;
  }

  // ── قائمة الدول ─────────────────────────────────────────────
  countriesList = [
    'أستراليا', 'الأرجنتين', 'إثيوبيا', 'الإكوادور',
    'الإمارات', 'إسبانيا', 'إيران', 'إيطاليا',
    'أفغانستان', 'أوروغواي', 'أوغندا', 'البحرين', 'باراغواي',
    'باكستان', 'البرازيل', 'البرتغال', 'بلجيكا', 'بنغلاديش',
    'بوركينا فاسو', 'بوليفيا', 'تايلاند', 'تركيا', 'تشاد',
    'تشيلي', 'تنزانيا', 'سنغافورة',
    'سويسرا', 'زامبيا', 'زيمبابوي', 'ساحل العاج',
    'السعودية', 'السنغال', 'الصين', 'فرنسا',
    'فنزويلا', 'فنلندا', 'فيتنام', 'الفلبين', 'قطر',
    'كندا', 'كوت ديفوار', 'كوريا الجنوبية', 'كولومبيا', 'كوبا',
    'كينيا', 'الكاميرون', 'الكويت', 'مالي', 'ماليزيا',
    'المكسيك', 'المملكة المتحدة', 'موزمبيق', 'النرويج',
    'نيجيريا', 'نيوزيلندا', 'النيجر', 'النمسا', 'هولندا', 'الهند',
    'الولايات المتحدة الأمريكية', 'اليابان', 'اليونان',
    'عُمان', 'غانا', 'إندونيسيا', 'السويد', 'الدنمارك', 'بولندا', 'بيرو',
  ].sort((a, b) => a.localeCompare(b, 'ar'));



  // ── قائمة المناطق الزمنية الشاملة ────────────────────────────
  timezonesList = [
    // ─── أفريقيا / الشرق الأوسط ───
    { value: 'Africa/Cairo',        label: '🇪🇬 مصر — Cairo (UTC+2/+3)' },
    { value: 'Asia/Riyadh',         label: '🇸🇦 السعودية — Riyadh (UTC+3)' },
    { value: 'Asia/Dubai',          label: '🇦🇪 الإمارات — Dubai (UTC+4)' },
    { value: 'Asia/Kuwait',         label: '🇰🇼 الكويت — Kuwait (UTC+3)' },
    { value: 'Asia/Qatar',          label: '🇶🇦 قطر — Qatar (UTC+3)' },
    { value: 'Asia/Bahrain',        label: '🇧🇭 البحرين — Bahrain (UTC+3)' },
    { value: 'Asia/Muscat',         label: '🇴🇲 عُمان — Muscat (UTC+4)' },
    { value: 'Asia/Aden',           label: '🇾🇪 اليمن — Aden (UTC+3)' },
    { value: 'Asia/Baghdad',        label: '🇮🇶 العراق — Baghdad (UTC+3)' },
    { value: 'Asia/Amman',          label: '🇯🇴 الأردن — Amman (UTC+2/+3)' },
    { value: 'Asia/Beirut',         label: '🇱🇧 لبنان — Beirut (UTC+2/+3)' },
    { value: 'Asia/Damascus',       label: '🇸🇾 سوريا — Damascus (UTC+2/+3)' },
    { value: 'Asia/Gaza',           label: '🇵🇸 فلسطين — Gaza (UTC+2/+3)' },
    { value: 'Africa/Tripoli',      label: '🇱🇾 ليبيا — Tripoli (UTC+2)' },
    { value: 'Africa/Tunis',        label: '🇹🇳 تونس — Tunis (UTC+1)' },
    { value: 'Africa/Algiers',      label: '🇩🇿 الجزائر — Algiers (UTC+1)' },
    { value: 'Africa/Casablanca',   label: '🇲🇦 المغرب — Casablanca (UTC+1)' },
    { value: 'Africa/Khartoum',     label: '🇸🇩 السودان — Khartoum (UTC+3)' },
    { value: 'Africa/Mogadishu',    label: '🇸🇴 الصومال — Mogadishu (UTC+3)' },
    { value: 'Africa/Nairobi',      label: '🇰🇪 كينيا — Nairobi (UTC+3)' },
    { value: 'Africa/Lagos',        label: '🇳🇬 نيجيريا — Lagos (UTC+1)' },
    { value: 'Africa/Accra',        label: '🇬🇭 غانا — Accra (UTC+0)' },
    { value: 'Africa/Abidjan',      label: '🇨🇮 ساحل العاج — Abidjan (UTC+0)' },
    { value: 'Africa/Dakar',        label: '🇸🇳 السنغال — Dakar (UTC+0)' },
    { value: 'Africa/Addis_Ababa',  label: '🇪🇹 إثيوبيا — Addis Ababa (UTC+3)' },
    // ─── أوروبا ───
    { value: 'Europe/London',       label: '🇬🇧 المملكة المتحدة — London (UTC+0/+1)' },
    { value: 'Europe/Paris',        label: '🇫🇷 فرنسا — Paris (UTC+1/+2)' },
    { value: 'Europe/Berlin',       label: '🇩🇪 ألمانيا — Berlin (UTC+1/+2)' },
    { value: 'Europe/Madrid',       label: '🇪🇸 إسبانيا — Madrid (UTC+1/+2)' },
    { value: 'Europe/Rome',         label: '🇮🇹 إيطاليا — Rome (UTC+1/+2)' },
    { value: 'Europe/Amsterdam',    label: '🇳🇱 هولندا — Amsterdam (UTC+1/+2)' },
    { value: 'Europe/Brussels',     label: '🇧🇪 بلجيكا — Brussels (UTC+1/+2)' },
    { value: 'Europe/Zurich',       label: '🇨🇭 سويسرا — Zurich (UTC+1/+2)' },
    { value: 'Europe/Vienna',       label: '🇦🇹 النمسا — Vienna (UTC+1/+2)' },
    { value: 'Europe/Stockholm',    label: '🇸🇪 السويد — Stockholm (UTC+1/+2)' },
    { value: 'Europe/Oslo',         label: '🇳🇴 النرويج — Oslo (UTC+1/+2)' },
    { value: 'Europe/Copenhagen',   label: '🇩🇰 الدنمارك — Copenhagen (UTC+1/+2)' },
    { value: 'Europe/Helsinki',     label: '🇫🇮 فنلندا — Helsinki (UTC+2/+3)' },
    { value: 'Europe/Lisbon',       label: '🇵🇹 البرتغال — Lisbon (UTC+0/+1)' },
    { value: 'Europe/Athens',       label: '🇬🇷 اليونان — Athens (UTC+2/+3)' },
    { value: 'Europe/Warsaw',       label: '🇵🇱 بولندا — Warsaw (UTC+1/+2)' },
    { value: 'Europe/Istanbul',     label: '🇹🇷 تركيا — Istanbul (UTC+3)' },
    { value: 'Europe/Moscow',       label: '🇷🇺 روسيا — Moscow (UTC+3)' },
    // ─── آسيا ───
    { value: 'Asia/Tehran',         label: '🇮🇷 إيران — Tehran (UTC+3.5/+4.5)' },
    { value: 'Asia/Kabul',          label: '🇦🇫 أفغانستان — Kabul (UTC+4.5)' },
    { value: 'Asia/Karachi',        label: '🇵🇰 باكستان — Karachi (UTC+5)' },
    { value: 'Asia/Kolkata',        label: '🇮🇳 الهند — Kolkata (UTC+5.5)' },
    { value: 'Asia/Dhaka',          label: '🇧🇩 بنغلاديش — Dhaka (UTC+6)' },
    { value: 'Asia/Yangon',         label: '🇲🇲 ميانمار — Yangon (UTC+6.5)' },
    { value: 'Asia/Bangkok',        label: '🇹🇭 تايلاند — Bangkok (UTC+7)' },
    { value: 'Asia/Jakarta',        label: '🇮🇩 إندونيسيا — Jakarta (UTC+7)' },
    { value: 'Asia/Kuala_Lumpur',   label: '🇲🇾 ماليزيا — Kuala Lumpur (UTC+8)' },
    { value: 'Asia/Singapore',      label: '🇸🇬 سنغافورة — Singapore (UTC+8)' },
    { value: 'Asia/Manila',         label: '🇵🇭 الفلبين — Manila (UTC+8)' },
    { value: 'Asia/Shanghai',       label: '🇨🇳 الصين — Shanghai (UTC+8)' },
    { value: 'Asia/Tokyo',          label: '🇯🇵 اليابان — Tokyo (UTC+9)' },
    { value: 'Asia/Seoul',          label: '🇰🇷 كوريا — Seoul (UTC+9)' },
    // ─── أمريكا الشمالية ───
    { value: 'America/New_York',    label: '🇺🇸 نيويورك — Eastern (UTC-5/-4)' },
    { value: 'America/Chicago',     label: '🇺🇸 شيكاغو — Central (UTC-6/-5)' },
    { value: 'America/Denver',      label: '🇺🇸 دنفر — Mountain (UTC-7/-6)' },
    { value: 'America/Los_Angeles', label: '🇺🇸 لوس أنجلوس — Pacific (UTC-8/-7)' },
    { value: 'America/Anchorage',   label: '🇺🇸 ألاسكا — Anchorage (UTC-9/-8)' },
    { value: 'Pacific/Honolulu',    label: '🇺🇸 هاواي — Honolulu (UTC-10)' },
    { value: 'America/Toronto',     label: '🇨🇦 كندا — Toronto (UTC-5/-4)' },
    { value: 'America/Vancouver',   label: '🇨🇦 كندا — Vancouver (UTC-8/-7)' },
    { value: 'America/Winnipeg',    label: '🇨🇦 كندا — Winnipeg (UTC-6/-5)' },
    { value: 'America/Mexico_City', label: '🇲🇽 المكسيك — Mexico City (UTC-6/-5)' },
    // ─── أمريكا اللاتينية ───
    { value: 'America/Sao_Paulo',   label: '🇧🇷 البرازيل — São Paulo (UTC-3)' },
    { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷 الأرجنتين — Buenos Aires (UTC-3)' },
    { value: 'America/Bogota',      label: '🇨🇴 كولومبيا — Bogotá (UTC-5)' },
    { value: 'America/Lima',        label: '🇵🇪 بيرو — Lima (UTC-5)' },
    { value: 'America/Santiago',    label: '🇨🇱 تشيلي — Santiago (UTC-4/-3)' },
    { value: 'America/Caracas',     label: '🇻🇪 فنزويلا — Caracas (UTC-4)' },
    // ─── أستراليا ───
    { value: 'Australia/Sydney',    label: '🇦🇺 أستراليا — Sydney (UTC+10/+11)' },
    { value: 'Australia/Melbourne', label: '🇦🇺 أستراليا — Melbourne (UTC+10/+11)' },
    { value: 'Australia/Brisbane',  label: '🇦🇺 أستراليا — Brisbane (UTC+10)' },
    { value: 'Australia/Perth',     label: '🇦🇺 أستراليا — Perth (UTC+8)' },
    { value: 'Pacific/Auckland',    label: '🇳🇿 نيوزيلندا — Auckland (UTC+12/+13)' },
  ];

  // ── 52 ولاية أمريكية ─────────────────────────────────────────
  usStatesList = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'Washington D.C.', 'Puerto Rico'
  ];

  // ── 13 مقاطعة وإقليم كندي ──────────────────────────────────────
  canadaProvincesList = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec',
    'Saskatchewan', 'Yukon'
  ];

  // الولاية الأمريكية المختارة (منفصلة عن الـ form لأنها مشروطة)
  selectedUsState = '';

  // المقاطعة الكندية المختارة (منفصلة عن الـ form لأنها مشروطة)
  selectedCanadaProvince = '';

  // Computed time display for student timezone
  studentTimePreview = '';

  // ── Mapping: دولة → منطقة زمنية ──────────────────────────────
  countryTimezoneMap: { [key: string]: string } = {
    'أستراليا':                    'Australia/Sydney',
    'الأرجنتين':                   'America/Argentina/Buenos_Aires',
    'إثيوبيا':                     'Africa/Addis_Ababa',
    'الإكوادور':                   'America/Lima',
    'الإمارات':                    'Asia/Dubai',
    'إسبانيا':                     'Europe/Madrid',
    'إيران':                       'Asia/Tehran',
    'إيطاليا':                     'Europe/Rome',
    'أفغانستان':                   'Asia/Kabul',
    'أوروغواي':                    'America/Montevideo',
    'أوغندا':                      'Africa/Nairobi',
    'البحرين':                     'Asia/Bahrain',
    'باراغواي':                    'America/Asuncion',
    'باكستان':                     'Asia/Karachi',
    'البرازيل':                    'America/Sao_Paulo',
    'البرتغال':                    'Europe/Lisbon',
    'بلجيكا':                      'Europe/Brussels',
    'بنغلاديش':                    'Asia/Dhaka',
    'بوركينا فاسو':                'Africa/Abidjan',
    'بوليفيا':                     'America/La_Paz',
    'تايلاند':                     'Asia/Bangkok',
    'تركيا':                       'Europe/Istanbul',
    'تشاد':                        'Africa/Ndjamena',
    'تشيلي':                      'America/Santiago',
    'تنزانيا':                     'Africa/Nairobi',
    'سنغافورة':                    'Asia/Singapore',
    'السعودية':                    'Asia/Riyadh',
    'السنغال':                     'Africa/Dakar',
    'سويسرا':                      'Europe/Zurich',
    'زامبيا':                      'Africa/Lusaka',
    'زيمبابوي':                    'Africa/Harare',
    'ساحل العاج':                  'Africa/Abidjan',
    'الصين':                       'Asia/Shanghai',
    'فرنسا':                       'Europe/Paris',
    'فنزويلا':                     'America/Caracas',
    'فنلندا':                      'Europe/Helsinki',
    'فيتنام':                      'Asia/Ho_Chi_Minh',
    'الفلبين':                     'Asia/Manila',
    'قطر':                         'Asia/Qatar',
    'كندا':                        'America/Toronto',
    'كوت ديفوار':                  'Africa/Abidjan',
    'كوريا الجنوبية':              'Asia/Seoul',
    'كولومبيا':                    'America/Bogota',
    'كوبا':                        'America/Havana',
    'كينيا':                       'Africa/Nairobi',
    'الكاميرون':                   'Africa/Lagos',
    'الكويت':                      'Asia/Kuwait',
    'مالي':                        'Africa/Bamako',
    'ماليزيا':                     'Asia/Kuala_Lumpur',
    'المكسيك':                     'America/Mexico_City',
    'المملكة المتحدة':             'Europe/London',
    'موزمبيق':                     'Africa/Maputo',
    'النرويج':                     'Europe/Oslo',
    'نيجيريا':                     'Africa/Lagos',
    'نيوزيلندا':                   'Pacific/Auckland',
    'النيجر':                      'Africa/Niamey',
    'النمسا':                      'Europe/Vienna',
    'هولندا':                      'Europe/Amsterdam',
    'الهند':                       'Asia/Kolkata',
    'الولايات المتحدة الأمريكية': 'America/New_York',
    'اليابان':                     'Asia/Tokyo',
    'اليونان':                     'Europe/Athens',
    'عُمان':                       'Asia/Muscat',
    'غانا':                        'Africa/Accra',
    'إندونيسيا':                   'Asia/Jakarta',
    'السويد':                      'Europe/Stockholm',
    'الدنمارك':                    'Europe/Copenhagen',
    'بولندا':                      'Europe/Warsaw',
    'بيرو':                        'America/Lima',
  };

  // ── Mapping: مقاطعة كندية → منطقة زمنية ─────────────────────
  canadaProvinceTimezoneMap: { [key: string]: string } = {
    // Eastern (UTC-5/-4)
    'Ontario':                     'America/Toronto',
    'Quebec':                      'America/Toronto',
    'New Brunswick':               'America/Halifax',
    'Nova Scotia':                 'America/Halifax',
    'Prince Edward Island':        'America/Halifax',
    'Newfoundland and Labrador':   'America/St_Johns',
    // Central (UTC-6/-5)
    'Manitoba':                    'America/Winnipeg',
    'Saskatchewan':                'America/Regina',
    // Mountain (UTC-7/-6)
    'Alberta':                     'America/Edmonton',
    'Northwest Territories':       'America/Edmonton',
    // Pacific (UTC-8/-7)
    'British Columbia':            'America/Vancouver',
    'Yukon':                       'America/Whitehorse',
    // Special
    'Nunavut':                     'America/Iqaluit',
  };

  // ── Mapping: ولاية أمريكية → منطقة زمنية ─────────────────────
  usStateTimezoneMap: { [key: string]: string } = {
    // Eastern (UTC-5/-4)
    'New York': 'America/New_York', 'Florida': 'America/New_York',
    'Georgia': 'America/New_York', 'Pennsylvania': 'America/New_York',
    'Ohio': 'America/New_York', 'Michigan': 'America/New_York',
    'North Carolina': 'America/New_York', 'Virginia': 'America/New_York',
    'Massachusetts': 'America/New_York', 'Maryland': 'America/New_York',
    'Connecticut': 'America/New_York', 'New Jersey': 'America/New_York',
    'South Carolina': 'America/New_York', 'Indiana': 'America/New_York',
    'Tennessee': 'America/New_York', 'Kentucky': 'America/New_York',
    'Maine': 'America/New_York', 'New Hampshire': 'America/New_York',
    'Vermont': 'America/New_York', 'Rhode Island': 'America/New_York',
    'Delaware': 'America/New_York', 'West Virginia': 'America/New_York',
    'Washington D.C.': 'America/New_York',
    // Central (UTC-6/-5)
    'Texas': 'America/Chicago', 'Illinois': 'America/Chicago',
    'Minnesota': 'America/Chicago', 'Wisconsin': 'America/Chicago',
    'Missouri': 'America/Chicago', 'Iowa': 'America/Chicago',
    'Kansas': 'America/Chicago', 'Nebraska': 'America/Chicago',
    'Oklahoma': 'America/Chicago', 'Arkansas': 'America/Chicago',
    'Louisiana': 'America/Chicago', 'Mississippi': 'America/Chicago',
    'Alabama': 'America/Chicago', 'South Dakota': 'America/Chicago',
    'North Dakota': 'America/Chicago',
    // Mountain (UTC-7/-6)
    'Colorado': 'America/Denver', 'Utah': 'America/Denver',
    'New Mexico': 'America/Denver', 'Wyoming': 'America/Denver',
    'Montana': 'America/Denver', 'Idaho': 'America/Denver',
    'Arizona': 'America/Phoenix',
    // Pacific (UTC-8/-7)
    'California': 'America/Los_Angeles', 'Washington': 'America/Los_Angeles',
    'Oregon': 'America/Los_Angeles', 'Nevada': 'America/Los_Angeles',
    // Special
    'Alaska': 'America/Anchorage',
    'Hawaii': 'Pacific/Honolulu',
    'Puerto Rico': 'America/Puerto_Rico',
  };

  // عند تغيير الدولة → يضبط التوقيت تلقائياً
  onCountryChange(): void {
    this.selectedUsState = '';
    this.selectedCanadaProvince = '';
    const country = this.studentForm.get('country')?.value;
    const tz = this.countryTimezoneMap[country];
    if (tz) {
      this.studentForm.patchValue({ timezone: tz });
      this.studentTimePreview = this.computeStudentTime();
    }
  }

  // عند تغيير الولاية الأمريكية → يضبط التوقيت تلقائياً
  onUsStateChange(): void {
    const tz = this.usStateTimezoneMap[this.selectedUsState];
    if (tz) {
      this.studentForm.patchValue({ timezone: tz });
      this.studentTimePreview = this.computeStudentTime();
    }
  }

  // عند تغيير المقاطعة الكندية → يضبط التوقيت تلقائياً
  onCanadaProvinceChange(): void {
    const tz = this.canadaProvinceTimezoneMap[this.selectedCanadaProvince];
    if (tz) {
      this.studentForm.patchValue({ timezone: tz });
      this.studentTimePreview = this.computeStudentTime();
    }
  }



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



  // ── Comprehensive View Filter ──────────────────────────────────
  get comprehensiveFiltered(): any[] {
    let list = [...this.comprehensiveStudents];
    // ترتيب أبجدي
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    // فيلتر نصي بالاسم
    if (this.comprehensiveNameFilter.trim()) {
      const q = this.comprehensiveNameFilter.trim().toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q));
    }
    // فيلتر بالمعلم أو الطالب
    if (this.comprehensiveFilterType && this.comprehensiveFilterId) {
      if (this.comprehensiveFilterType === 'teacher') {
        list = list.filter(s =>
          s.teachers?.some((t: any) => (t._id || t) === this.comprehensiveFilterId)
        );
      }
      if (this.comprehensiveFilterType === 'student') {
        list = list.filter(s => s._id === this.comprehensiveFilterId);
      }
    }
    return list;
  }

  resetComprehensiveFilter(): void {
    this.comprehensiveFilterType = '';
    this.comprehensiveFilterId = '';
    this.comprehensiveNameFilter = '';
    this.comprehensiveFilter = { teacherId: '', status: '' };
  }

  // Expected monthly sessions for student
  getExpectedMonthlyHours(student: any): number {
    if (!student.sessionDurationMinutes || !student.sessionDays?.length) return 0;
    // Average weeks in month = 4.33
    const sessionsPerMonth = student.sessionDays.length * 4.33;
    return Math.round((sessionsPerMonth * student.sessionDurationMinutes) / 60 * 10) / 10;
  }

  // timezone conversion helpers
  getSelectedStudentTimezone(studentId: string): string | null {
    const student = this.teacherStudents.find(s => s._id === studentId);
    return student ? student.timezone : null;
  }

  getIANATimezone(tzInput: string): string {
    if (!tzInput) return 'America/New_York';
    const clean = tzInput.trim();

    // 1. Direct valid IANA timezone string e.g. "America/Chicago", "Africa/Cairo"
    if (clean.includes('/') && (
      clean.startsWith('America/') || clean.startsWith('Africa/') || clean.startsWith('Asia/') || 
      clean.startsWith('Europe/') || clean.startsWith('Australia/') || clean.startsWith('Pacific/')
    )) {
      return clean;
    }

    const lower = clean.toLowerCase();

    // 2. 🌵 Arizona (MST - No DST -> America/Phoenix = -10h from Cairo)
    if (clean.includes('أريزونا') || lower.includes('arizona') || lower.includes('phoenix') || lower.includes('tucson') || lower === 'az' || lower === 'us-az' || lower === 'us-mst-az') {
      return 'America/Phoenix';
    }

    // 3. 🌺 Hawaii (HST - No DST -> Pacific/Honolulu = -13h from Cairo)
    if (clean.includes('هاواي') || lower.includes('hawaii') || lower.includes('honolulu') || lower === 'hi' || lower === 'us-hi' || lower === 'us-hst') {
      return 'Pacific/Honolulu';
    }

    // 4. ❄️ Alaska (AKDT/AKST -> America/Anchorage = -11h from Cairo in summer)
    if (clean.includes('ألاسكا') || lower.includes('alaska') || lower.includes('anchorage') || lower === 'ak' || lower === 'us-ak' || lower === 'us-akst') {
      return 'America/Anchorage';
    }

    // 5. 🏖️ Pacific Time (PDT/PST -> America/Los_Angeles = -10h from Cairo in summer)
    // States: California (CA), Nevada (NV), Oregon (OR), Washington State (WA)
    if (
      clean.includes('كاليفورنيا') || lower.includes('california') || lower.includes('los angeles') || lower.includes('san francisco') || lower.includes('san diego') || lower === 'ca' || lower === 'us-ca' ||
      clean.includes('نيفادا') || lower.includes('nevada') || lower.includes('las vegas') || lower === 'nv' || lower === 'us-nv' ||
      clean.includes('أوريغون') || clean.includes('أوريجون') || lower.includes('oregon') || lower.includes('portland') || lower === 'or' || lower === 'us-or' ||
      clean.includes('سياتل') || lower.includes('seattle') || lower === 'wa' || lower === 'us-wa' ||
      lower.includes('pst') || lower.includes('pdt') || clean === 'US-PST'
    ) {
      return 'America/Los_Angeles';
    }

    // 6. 🏔️ Mountain Time with DST (MDT/MST -> America/Denver = -9h from Cairo in summer)
    // States: Colorado (CO), Utah (UT), New Mexico (NM), Wyoming (WY), Montana (MT), Idaho (ID)
    if (
      clean.includes('كولورادو') || lower.includes('colorado') || clean.includes('دنفر') || lower.includes('denver') || lower === 'co' || lower === 'us-co' ||
      clean.includes('يوتا') || lower.includes('utah') || lower.includes('salt lake') || lower === 'ut' || lower === 'us-ut' ||
      clean.includes('نيو مكسيكو') || lower.includes('new mexico') || lower === 'nm' || lower === 'us-nm' ||
      clean.includes('وايومنغ') || lower.includes('wyoming') || lower === 'wy' || lower === 'us-wy' ||
      clean.includes('مونتانا') || lower.includes('montana') || lower === 'mt' || lower === 'us-mt' ||
      clean.includes('أيداهو') || lower.includes('idaho') || lower === 'id' || lower === 'us-id' ||
      lower.includes('mdt') || clean === 'US-MST'
    ) {
      return 'America/Denver';
    }

    // 7. 🤠 Central Time (CDT/CST -> America/Chicago = -8h from Cairo in summer)
    // States: Texas (TX), Illinois/Chicago (IL), Missouri (MO), Minnesota (MN), Louisiana (LA), Alabama (AL), Tennessee (TN), Wisconsin (WI), Iowa (IA), Kansas (KS), Nebraska (NE), Oklahoma (OK), Arkansas (AR), Mississippi (MS), North/South Dakota (ND/SD)
    if (
      clean.includes('تكساس') || lower.includes('texas') || lower.includes('houston') || lower.includes('dallas') || lower.includes('austin') || lower === 'tx' || lower === 'us-tx' ||
      clean.includes('شيكاغو') || lower.includes('chicago') || clean.includes('إلينوي') || lower.includes('illinois') || lower === 'il' || lower === 'us-il' ||
      clean.includes('ميزوري') || lower.includes('missouri') || lower === 'mo' || lower === 'us-mo' ||
      clean.includes('مينيسوتا') || lower.includes('minnesota') || lower.includes('minneapolis') || lower === 'mn' || lower === 'us-mn' ||
      clean.includes('لويزيانا') || lower.includes('louisiana') || lower.includes('new orleans') || lower === 'la' || lower === 'us-la' ||
      clean.includes('ألاباما') || lower.includes('alabama') || lower === 'al' || lower === 'us-al' ||
      clean.includes('تينيسي') || lower.includes('tennessee') || lower.includes('nashville') || lower === 'tn' || lower === 'us-tn' ||
      clean.includes('ويسكونسن') || lower.includes('wisconsin') || lower === 'wi' || lower === 'us-wi' ||
      clean.includes('أيوا') || lower.includes('iowa') || lower === 'ia' || lower === 'us-ia' ||
      clean.includes('كانساس') || lower.includes('kansas') || lower === 'ks' || lower === 'us-ks' ||
      clean.includes('نيبروسكا') || lower.includes('nebraska') || lower === 'ne' || lower === 'us-ne' ||
      clean.includes('أوكلاهوما') || lower.includes('oklahoma') || lower === 'ok' || lower === 'us-ok' ||
      clean.includes('أركنساس') || clean.includes('آركانساس') || lower.includes('arkansas') || lower === 'ar' || lower === 'us-ar' ||
      clean.includes('مسيسيبي') || lower.includes('mississippi') || lower === 'ms' || lower === 'us-ms' ||
      clean.includes('داكوتا') || lower.includes('dakota') || lower === 'nd' || lower === 'sd' ||
      lower.includes('cst') || lower.includes('cdt') || clean === 'US-CST'
    ) {
      return 'America/Chicago';
    }

    // 8. 🏙️ Eastern Time (EDT/EST -> America/New_York = -7h from Cairo in summer)
    // States: New York (NY), Florida (FL), Georgia (GA), Virginia (VA), North Carolina (NC), South Carolina (SC), Pennsylvania (PA), Ohio (OH), New Jersey (NJ), Massachusetts (MA), Michigan (MI), Indiana (IN), Maryland (MD), Connecticut (CT), Kentucky (KY), Washington DC (DC), Delaware (DE), Maine (ME), New Hampshire (NH), Vermont (VT), Rhode Island (RI), West Virginia (WV)
    if (
      clean.includes('نيويورك') || lower.includes('new york') || lower === 'ny' || lower === 'us-ny' ||
      clean.includes('فلوريدا') || lower.includes('florida') || lower.includes('miami') || lower.includes('orlando') || lower === 'fl' || lower === 'us-fl' ||
      clean.includes('جورجيا') || lower.includes('georgia') || lower.includes('atlanta') || lower === 'ga' || lower === 'us-ga' ||
      clean.includes('فرجينيا') || lower.includes('virginia') || lower === 'va' || lower === 'us-va' ||
      clean.includes('كارولاينا') || lower.includes('carolina') || lower === 'nc' || lower === 'sc' ||
      clean.includes('بنسلفانيا') || lower.includes('pennsylvania') || lower.includes('philadelphia') || lower === 'pa' || lower === 'us-pa' ||
      clean.includes('أوهايو') || lower.includes('ohio') || lower === 'oh' || lower === 'us-oh' ||
      clean.includes('نيوجيرسي') || lower.includes('new jersey') || lower === 'nj' || lower === 'us-nj' ||
      clean.includes('ماساتشوستس') || lower.includes('massachusetts') || lower.includes('boston') || lower === 'ma' || lower === 'us-ma' ||
      clean.includes('ميتشيجان') || clean.includes('ميشيغان') || lower.includes('michigan') || lower.includes('detroit') || lower === 'mi' || lower === 'us-mi' ||
      clean.includes('إنديانا') || lower.includes('indiana') || lower === 'in' || lower === 'us-in' ||
      clean.includes('ماريلاند') || lower.includes('maryland') || lower.includes('baltimore') || lower === 'md' || lower === 'us-md' ||
      clean.includes('كونيتيكت') || lower.includes('connecticut') || lower === 'ct' || lower === 'us-ct' ||
      clean.includes('كنتاكي') || lower.includes('kentucky') || lower === 'ky' || lower === 'us-ky' ||
      clean.includes('واشنطن العاصمة') || lower.includes('washington dc') || lower.includes('district of columbia') || lower === 'dc' ||
      clean.includes('ديلاوير') || lower.includes('delaware') || lower === 'de' ||
      clean.includes('مين') || lower.includes('maine') || lower === 'me' ||
      clean.includes('هامبشاير') || lower.includes('hampshire') || lower === 'nh' ||
      clean.includes('فيرمونت') || lower.includes('vermont') || lower === 'vt' ||
      clean.includes('رود آيلاند') || lower.includes('rhode island') || lower === 'ri' ||
      lower.includes('est') || lower.includes('edt') || clean === 'US-EST'
    ) {
      return 'America/New_York';
    }

    // 9. 🇨🇦 Canada
    if (lower.includes('vancouver') || lower.includes('british columbia') || lower === 'bc') {
      return 'America/Vancouver';
    }
    if (lower.includes('toronto') || lower.includes('ontario') || lower.includes('ottawa') || lower.includes('quebec') || lower.includes('montreal') || lower.includes('canada') || clean.includes('كندا')) {
      return 'America/Toronto';
    }

    // 10. 🌍 Arab World & Gulf
    if (clean.includes('السعودية') || clean.includes('الرياض') || lower.includes('saudi') || lower.includes('riyadh') || clean === 'SAUDI-AST') {
      return 'Asia/Riyadh';
    }
    if (clean.includes('الإمارات') || clean.includes('دبي') || lower.includes('uae') || lower.includes('dubai') || clean === 'UAE-GST') {
      return 'Asia/Dubai';
    }
    if (clean.includes('الكويت') || lower.includes('kuwait')) {
      return 'Asia/Kuwait';
    }
    if (clean.includes('قطر') || lower.includes('qatar')) {
      return 'Asia/Qatar';
    }
    if (clean.includes('عُمان') || clean.includes('عمان') || lower.includes('oman')) {
      return 'Asia/Muscat';
    }
    if (clean.includes('الأردن') || lower.includes('jordan') || lower.includes('amman')) {
      return 'Asia/Amman';
    }

    // 11. 🇪🇺 Europe
    if (clean.includes('بريطانيا') || clean.includes('لندن') || lower.includes('london') || lower.includes('uk') || clean === 'UK-GMT') {
      return 'Europe/London';
    }
    if (clean.includes('فرنسا') || clean.includes('ألمانيا') || lower.includes('france') || lower.includes('germany') || lower.includes('italy') || lower.includes('spain') || clean === 'EU-CET') {
      return 'Europe/Paris';
    }

    // 12. 🇪🇬 Egypt
    if (clean.includes('مصر') || clean.includes('القاهرة') || lower.includes('egypt') || lower.includes('cairo') || clean === 'EGY-EET') {
      return 'Africa/Cairo';
    }

    return 'America/New_York';
  }

  convertToStudentTime(timeSlot: string, studentId: string): string {
    if (!timeSlot || !studentId) return '';
    const timezone = this.getSelectedStudentTimezone(studentId);
    if (!timezone) return '';
    return this.getStudentLocalTime(timeSlot, timezone);
  }

  getStudentLocalTime(timeSlot: string, studentTimezone: string): string {
    if (!timeSlot) return '';
    try {
      const ianaTz = this.getIANATimezone(studentTimezone);
      const parts = timeSlot.split(':');
      let hours = parseInt(parts[0], 10);
      let minutes = parseInt(parts[1], 10);
      if (isNaN(hours)) return timeSlot;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');

      // Teacher timeSlot is in Cairo Time (+03:00)
      const cairoDate = new Date(`${year}-${month}-${day}T${hh}:${mm}:00+03:00`);

      return new Intl.DateTimeFormat('en-US', {
        timeZone: ianaTz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }).format(cairoDate);
    } catch (e) {
      console.error('Timezone calculation error:', e);
      return this.format12Hour(timeSlot);
    }
  }

  // Compute student local time from teacher time & student timezone
  computeStudentTime(): string {
    const timeVal = this.studentForm?.get('sessionTimeTeacher')?.value;
    const timezone = this.studentForm?.get('timezone')?.value;
    if (!timeVal || !timezone) return '';
    return this.getStudentLocalTime(timeVal, timezone);
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
    this.loadDeficitMatrix();
  }

  // --- Forms Initialization ---
  initAdminForms(): void {
    this.pricingForm = this.fb.group({
      studentId: ['', Validators.required],
      teacherId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required],
      hourlyRate: ['', [Validators.required, Validators.min(0)]],
      currency: ['USD', Validators.required],
      teacherRate: ['', [Validators.required, Validators.min(0)]],
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
      specialty: [''],
      supervisorId: ['']
    });

    this.teacherRateForm = this.fb.group({
      defaultHourlyRate: ['', [Validators.required, Validators.min(1)]],
      defaultCurrency: ['EGP', Validators.required]
    });

    this._initSharedStudentParentForms();
  }

  initSupervisorForms(): void {
    this._initSharedStudentParentForms();
  }

  // Shared between Admin & Supervisor
  private _initSharedStudentParentForms(): void {
    this.pauseForm = this.fb.group({
      type: ['temporary', Validators.required],
      reason: [''],
      expectedReturnAt: ['']
    });

    this.studentForm = this.fb.group({
      // ── أساسيات ──
      name: ['', Validators.required],
      parentId: ['', Validators.required],
      teacherIds: [[]],
      photoUrl: [''],
      parentSocialMediaConsent: [false],
      status: ['Active'],
      // ── قسم 1: إحصائية ──
      age: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      language: [''],
      country: [''],
      timezone: ['Africa/Cairo', Validators.required],
      // ── قسم 2: كمية ──
      startDate: [''],
      programs: [[]],
      initialLevel: [''],
      levelPerProgram: [''],
      booksUsed: [''],         // نص مفصول بفواصل
      // ── قسم 3: جدول المعلم ──
      sessionDurationMinutes: [60, [Validators.required, Validators.min(15)]],
      sessionDays: [[]],
      sessionTimeTeacher: ['']
    });

    this.parentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['parent123', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      notes: [''],
      defaultHourlyRate: [null, [Validators.min(0)]],
      defaultCurrency: ['']
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
      timeSlot: ['', Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      studentId: ['', Validators.required]
    });

    // Teacher also needs pauseForm to be able to pause/resume students
    this._initSharedStudentParentForms();
  }

  loadAdminDashboard(): void {
    this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data);
    this.api.get('auth/users?role=Teacher').subscribe(res => {
      this.teachersList = res.data;
      this.computeManagementAlerts();
      if (this.teachersList.length > 0 && !this.selectedWeeklyScheduleTeacherId) {
        this.loadWeeklySchedule(this.teachersList[0]._id);
      }
    });
    
    this.api.get('students/pricing/all').subscribe(res => {
      this.pricingsList = res.data;
      this.computeManagementAlerts();
    });

    this.api.get('students').subscribe(res => {
      this.studentsList = res.data;
      this.adminStats.activeStudents = this.studentsList.filter(s => s.status === 'Active').length;
      this.computeManagementAlerts();
      this.loadAllDeficits(this.studentsList);
    });

    this.api.get('invoices').subscribe((res) => {
      this.invoices = res.data;
      this.adminStats.totalRevenue = this.invoices
        .filter(inv => inv.paymentStatus === 'Paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
    });

    this.api.get('salaries').subscribe((res) => {
      this.salaries = res.data;
      const unpaidSalaries = this.salaries
        .filter(sal => sal.payoutStatus === 'Unpaid')
        .reduce((sum, sal) => sum + sal.finalPayoutEgp, 0);

      if (unpaidSalaries > 0) {
        this.adminStats.pendingSalaries = unpaidSalaries;
      } else {
        this.api.get('salaries/estimate').subscribe((estRes) => {
          if (estRes.data && Array.isArray(estRes.data)) {
            this.adminStats.pendingSalaries = estRes.data.reduce((sum: number, item: any) => sum + (item.estimatedPayoutEgp || 0), 0);
          }
        });
      }
    });

    this.loadLeads();
    this.loadEditRequests();
    this.loadTeacherPerformance();
    this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
    this.api.get('auth/users?role=GlobalSup').subscribe(res => this.globalSupervisorsList = res.data);
    this.loadSeasonalAnalytics();
    this.loadHierarchy();
  }

  computeManagementAlerts(): void {
    this.managementAlerts = [];
    this.parentlessStudents = [];

    // 1. Students without parent
    if (this.studentsList && this.studentsList.length > 0) {
      const noParent = this.studentsList.filter(s => !s.parent);
      this.parentlessStudents = noParent;

      noParent.forEach(student => {
        this.managementAlerts.push({
          type: 'no_parent',
          student: student,
          message: `الطالب "${student.name}" بانتظار تعيين ولي الأمر له لتفعيل الحساب وتنظيم الفواتير.`
        });
      });

      // 2. Students without pricing
      this.studentsList.forEach(student => {
        if (student.teachers && student.teachers.length > 0) {
          student.teachers.forEach((teacher: any) => {
            const teacherId = teacher._id || teacher;
            const teacherName = teacher.name || 'معين';
            
            const hasPricing = this.pricingsList && this.pricingsList.some(p => 
              p.student?._id === student._id && 
              p.teacher?._id === teacherId
            );

            if (!hasPricing) {
              this.managementAlerts.push({
                type: 'no_pricing',
                student: student,
                teacherId: teacherId,
                teacherName: teacherName,
                message: `الطالب "${student.name}" مع المعلم "${teacherName}" بانتظار اعتماد وتحديد تسعيرة الحصة.`
              });
            }
          });
        }
      });
    }

    // 3. Teachers without default hourly rate / pricing (e.g. newly added by supervisor)
    if (this.teachersList && this.teachersList.length > 0) {
      this.teachersList.forEach(teacher => {
        const hasRate = teacher.defaultHourlyRate !== undefined && teacher.defaultHourlyRate !== null && Number(teacher.defaultHourlyRate) > 0;
        const hasPricing = this.pricingsList && this.pricingsList.some(p => (p.teacher?._id || p.teacher) === teacher._id);
        
        if (!hasRate && !hasPricing) {
          const supervisorName = teacher.supervisor?.name ? `(المشرف: ${teacher.supervisor.name})` : '';
          this.managementAlerts.push({
            type: 'no_teacher_hourly_rate',
            teacher: teacher,
            message: `المعلم الجديد "${teacher.name}" ${supervisorName} تم إضافته وبانتظار تحديد واعتماد سعر الساعة له من الإدارة.`
          });
        }
      });
    }
  }

  openSetTeacherRateModal(teacher: any): void {
    if (!teacher) return;
    this.selectedTeacherForRateModal = teacher;
    this.teacherRateForm.reset({
      defaultHourlyRate: teacher.defaultHourlyRate || '',
      defaultCurrency: teacher.defaultCurrency || 'EGP'
    });
    this.showTeacherRateModal = true;
  }

  submitTeacherRate(): void {
    if (this.teacherRateForm.invalid || !this.selectedTeacherForRateModal) {
      this.toast.error('يرجى إدخال سعر ساعة صحيح للمعلم!');
      return;
    }
    const val = this.teacherRateForm.value;
    this.api.put(`auth/users/${this.selectedTeacherForRateModal._id}`, {
      defaultHourlyRate: Number(val.defaultHourlyRate),
      defaultCurrency: val.defaultCurrency
    }).subscribe({
      next: () => {
        this.toast.success(`تم تحديد سعر ساعة المعلم "${this.selectedTeacherForRateModal.name}" بنجاح!`);
        this.showTeacherRateModal = false;
        this.selectedTeacherForRateModal = null;
        this.loadAdminDashboard();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'فشل في حفظ سعر ساعة المعلم');
      }
    });
  }

  scrollToAlerts(): void {
    const el = document.getElementById('management-alerts-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  get filteredPricingStudents(): any[] {
    const selectedTeacherId = this.pricingForm?.get('teacherId')?.value;
    if (!selectedTeacherId) {
      return this.studentsList || [];
    }
    return (this.studentsList || []).filter(s => {
      if (Array.isArray(s.teachers) && s.teachers.length > 0) {
        return s.teachers.some((t: any) => (t._id || t) === selectedTeacherId);
      }
      if (s.teacher) {
        return (s.teacher._id || s.teacher) === selectedTeacherId;
      }
      return false;
    });
  }

  onPricingTeacherChange(): void {
    const selectedTeacherId = this.pricingForm.get('teacherId')?.value;
    const currentStudentId = this.pricingForm.get('studentId')?.value;
    if (!selectedTeacherId) return;

    if (currentStudentId) {
      const isStillValid = this.filteredPricingStudents.some(s => s._id === currentStudentId);
      if (!isStillValid) {
        this.pricingForm.patchValue({ studentId: '' });
      }
    }
  }

  onPricingStudentChange(): void {
    const currentStudentId = this.pricingForm.get('studentId')?.value;
    if (!currentStudentId) return;

    const student = this.studentsList?.find(s => s._id === currentStudentId);
    if (student) {
      const studentTeachers = Array.isArray(student.teachers) && student.teachers.length > 0
        ? student.teachers
        : (student.teacher ? [student.teacher] : []);

      const currentTeacherId = this.pricingForm.get('teacherId')?.value;
      if (studentTeachers.length === 1) {
        const tId = studentTeachers[0]._id || studentTeachers[0];
        if (currentTeacherId !== tId) {
          this.pricingForm.patchValue({ teacherId: tId });
        }
      }
    }
  }

  submitPricing(): void {
    if (this.pricingForm.invalid) {
      this.toast.error('بيانات النموذج غير مكتملة أو غير صالحة!'); return;
    }
    this.api.post('students/pricing', this.pricingForm.value).subscribe({
      next: () => {
        this.showPricingModal = false;
        this.pricingForm.reset({ subject: 'القرآن الكريم والتجويد', currency: 'USD', teacherCurrency: 'EGP' });
        this.toast.success('تم حفظ خطة التسعير بنجاح!');
        if (this.role === 'Admin') this.loadAdminDashboard();
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
      next: () => { this.loadAdminDashboard(); },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء تحديث حالة الفاتورة')
    });
  }

  updateInvoiceMethod(invoiceId: string, method: string): void {
    this.api.put(`invoices/${invoiceId}/admin-update`, { paymentMethod: method }).subscribe({
      next: () => { this.loadAdminDashboard(); },
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

  loadSupervisorDashboard(): void {
    this.api.get('sessions').subscribe((res) => {
      this.pendingSessions = res.data.filter((s: any) => !s.isApprovedBySupervisor);
    });

    this.api.get('students').subscribe((res) => {
      this.supervisedStudents = res.data;
      this.comprehensiveStudents = res.data;
      this.loadAllDeficits(this.supervisedStudents);
      if (this.myGroupTeachers.length > 0 && !this.selectedWeeklyScheduleTeacherId) {
        this.loadWeeklySchedule(this.myGroupTeachers[0]._id);
      }
    });

    this.api.get('pauses').subscribe((res) => {
      this.activePauses = res.data;
    });

    this.api.get('sessions/makeups').subscribe((res) => {
      this.supervisorMakeups = res.data;
    });

    this.loadEditRequests();
    this.loadTeacherPerformance();

    // Load teachers & parents for student/parent forms
    this.api.get('auth/users?role=Teacher').subscribe(res => {
      this.teachersList = res.data;
      if (this.teachersList.length > 0 && !this.selectedWeeklyScheduleTeacherId) {
        this.loadWeeklySchedule(this.teachersList[0]._id);
      }
    });
    this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data);

    if (this.role === 'GlobalSup') {
      this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
      this.api.get('auth/users?role=GlobalSup').subscribe(res => this.globalSupervisorsList = res.data);
    }

    // Load hierarchy for org tree tab
    this.loadHierarchy();
  }

  // ── Hierarchy Methods ──────────────────────────────────────
  loadHierarchy(): void {
    this.hierarchyLoading = true;
    const currentGSId = this.selectedHierarchyGS?._id;
    const currentSupId = this.selectedHierarchySup?._id;
    const currentTeacherId = this.selectedHierarchyTeacher?._id;
    const currentDrillLevel = this.hierarchyDrillLevel;

    this.api.get('auth/hierarchy').subscribe({
      next: (res) => {
        this.hierarchyData = res.data || [];
        this.hierarchyLoading = false;

        // ── FIX: Supervisor role — البيانات تعود كـ { role:'Supervisor', teachers:[...] }
        // لذا يجب الانتقال مباشرةً لمستوى supervisor وضبط selectedHierarchySup
        if (this.role === 'Supervisor' && res.data && res.data.length > 0) {
          const sup = res.data[0];
          this.selectedHierarchySup = sup;
          this.selectedHierarchyGS = null;
          if (currentDrillLevel === 'teacher' && currentTeacherId) {
            this.selectedHierarchyTeacher = sup.teachers?.find((t: any) => t._id === currentTeacherId) || null;
            this.hierarchyDrillLevel = this.selectedHierarchyTeacher ? 'teacher' : 'supervisor';
          } else {
            this.hierarchyDrillLevel = 'supervisor';
            this.selectedHierarchyTeacher = null;
          }
        } else {
          // Admin / GlobalSup — Preserve active drill-down if possible
          if (currentDrillLevel === 'teacher' && currentTeacherId) {
            let foundGS: any = null;
            let foundSup: any = null;
            let foundTeacher: any = null;
            for (const gs of this.hierarchyData) {
              for (const sup of (gs.supervisors || [])) {
                for (const t of (sup.teachers || [])) {
                  if (t._id === currentTeacherId) {
                    foundGS = gs;
                    foundSup = sup;
                    foundTeacher = t;
                    break;
                  }
                }
                if (foundTeacher) break;
              }
              if (foundTeacher) break;
            }
            if (foundTeacher) {
              this.selectedHierarchyGS = foundGS;
              this.selectedHierarchySup = foundSup;
              this.selectedHierarchyTeacher = foundTeacher;
              this.hierarchyDrillLevel = 'teacher';
            } else {
              this.hierarchyDrillLevel = 'globalSup';
              this.selectedHierarchyGS = null;
              this.selectedHierarchySup = null;
              this.selectedHierarchyTeacher = null;
            }
          } else if (currentDrillLevel === 'supervisor' && currentSupId) {
            let foundGS: any = null;
            let foundSup: any = null;
            for (const gs of this.hierarchyData) {
              for (const sup of (gs.supervisors || [])) {
                if (sup._id === currentSupId) {
                  foundGS = gs;
                  foundSup = sup;
                  break;
                }
              }
              if (foundSup) break;
            }
            if (foundSup) {
              this.selectedHierarchyGS = foundGS;
              this.selectedHierarchySup = foundSup;
              this.hierarchyDrillLevel = 'supervisor';
              this.selectedHierarchyTeacher = null;
            } else {
              this.hierarchyDrillLevel = 'globalSup';
              this.selectedHierarchyGS = null;
              this.selectedHierarchySup = null;
              this.selectedHierarchyTeacher = null;
            }
          } else {
            this.hierarchyDrillLevel = 'globalSup';
            this.selectedHierarchyGS = null;
            this.selectedHierarchySup = null;
            this.selectedHierarchyTeacher = null;
          }
        }
      },
      error: () => { this.hierarchyLoading = false; }
    });
  }

  hierarchyDrillIntoGS(gs: any): void {
    this.selectedHierarchyGS = gs;
    this.hierarchyDrillLevel = 'supervisor';
    this.hierarchySearchQuery = '';
  }

  hierarchyDrillIntoSup(gs: any, sup: any): void {
    this.selectedHierarchyGS = gs;
    this.selectedHierarchySup = sup;
    this.hierarchyDrillLevel = 'supervisor';
    this.hierarchySearchQuery = '';
  }

  hierarchyDrillIntoTeacher(teacher: any): void {
    this.selectedHierarchyTeacher = teacher;
    this.hierarchyDrillLevel = 'teacher';
    this.hierarchySearchQuery = '';
  }

  hierarchyGoBack(): void {
    this.hierarchySearchQuery = '';
    if (this.hierarchyDrillLevel === 'teacher') {
      this.hierarchyDrillLevel = 'supervisor';
      this.selectedHierarchyTeacher = null;
    } else if (this.hierarchyDrillLevel === 'supervisor') {
      // إذا كان المشرف العادي، لا يوجد مستوى globalSup ليرجع إليه
      if (this.role === 'Supervisor') return;
      this.hierarchyDrillLevel = 'globalSup';
      this.selectedHierarchySup = null;
    }
  }

  // ── Deep Linking: قفز مباشر لكارد المعلم من أي مؤشر تحذيري ─────────
  hierarchyJumpToTeacher(gs: any, sup: any, teacher: any): void {
    this.activeTab = 'hierarchy';
    this.selectedHierarchyGS = gs;
    this.selectedHierarchySup = sup;
    this.selectedHierarchyTeacher = teacher;
    this.hierarchyDrillLevel = 'teacher';
    this.hierarchySearchQuery = '';
  }

  // ── Deep Linking: قفز مباشر لكارد المشرف العادي من مؤشر المشرف العام ─
  hierarchyJumpToSup(gs: any, sup: any): void {
    this.activeTab = 'hierarchy';
    this.selectedHierarchyGS = gs;
    this.selectedHierarchySup = sup;
    this.hierarchyDrillLevel = 'supervisor';
    this.hierarchySearchQuery = '';
  }

  // ── مساعد: أكثر معلم لديه تعويضات معلقة في المشرف ──────────────────
  getTeacherWithMostMakeups(sup: any): any {
    if (!sup?.teachers?.length) return null;
    return sup.teachers.reduce((max: any, t: any) =>
      (t.kpis?.pendingMakeups || 0) > (max?.kpis?.pendingMakeups || 0) ? t : max
    , sup.teachers[0]);
  }

  getKpiColor(value: number, thresholdWarn: number, thresholdDanger: number): string {
    if (value === 0) return 'text-primary';
    if (value >= thresholdDanger) return 'text-red-400';
    if (value >= thresholdWarn) return 'text-amber-400';
    return 'text-primary';
  }

  getHierarchyFilteredItems(items: any[]): any[] {
    if (!this.hierarchySearchQuery.trim()) return items;
    const q = this.hierarchySearchQuery.toLowerCase();
    return items.filter(i => i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q));
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
    this.api.post('pauses', body).subscribe({
      next: () => {
        this.showPauseModal = false;
        this.pauseForm.reset({ type: 'temporary' });
        
        if (this.role === 'Admin') this.loadAdminDashboard();
        else if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
        else if (this.role === 'Teacher') this.loadTeacherDashboard();
        
        if (this.selectedWeeklyScheduleTeacherId) {
          this.loadWeeklySchedule(this.selectedWeeklyScheduleTeacherId);
        } else if (this.role === 'Teacher' && this.user?._id) {
          this.loadWeeklySchedule(this.user._id);
        }

        this.loadDeficitMatrix();
        this.toast.success('تم تسجيل إيقاف/إجازة الطالب بنجاح!');
      },
      error: (err) => {
        console.error('Error logging pause:', err);
        this.toast.error(err.error?.message || 'خطأ أثناء تسجيل الإيقاف');
      }
    });
  }

  resumeStudent(pauseId: string): void {
    if (!pauseId) return;
    this.api.post(`pauses/${pauseId}/resume`, {}).subscribe({
      next: () => {
        if (this.role === 'Admin') this.loadAdminDashboard();
        else if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
        else if (this.role === 'Teacher') this.loadTeacherDashboard();
        
        if (this.selectedWeeklyScheduleTeacherId) {
          this.loadWeeklySchedule(this.selectedWeeklyScheduleTeacherId);
        } else if (this.role === 'Teacher' && this.user?._id) {
          this.loadWeeklySchedule(this.user._id);
        }

        this.loadDeficitMatrix();
        this.toast.success('تم إعادة تفعيل الطالب بنجاح!');
      },
      error: (err) => {
        console.error('Error resuming student:', err);
        this.toast.error(err.error?.message || 'خطأ أثناء تفعيل الطالب');
      }
    });
  }

  resumeStudentByStudentId(studentId: string): void {
    if (!studentId) return;
    this.api.post(`pauses/student/${studentId}/resume`, {}).subscribe({
      next: () => {
        if (this.role === 'Admin') this.loadAdminDashboard();
        else if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
        else if (this.role === 'Teacher') this.loadTeacherDashboard();
        
        if (this.selectedWeeklyScheduleTeacherId) {
          this.loadWeeklySchedule(this.selectedWeeklyScheduleTeacherId);
        } else if (this.role === 'Teacher' && this.user?._id) {
          this.loadWeeklySchedule(this.user._id);
        }
        
        this.loadDeficitMatrix();
        this.toast.success('تم إعادة تفعيل الطالب بنجاح!');
      },
      error: (err) => this.toast.error(err.error?.message || 'خطأ أثناء إعادة تفعيل الطالب')
    });
  }

  approveSession(sessionId: string): void {
    const checklist = this.getChecklistState(sessionId);
    this.api.post(`sessions/${sessionId}/approve`, { supervisorChecklist: checklist }).subscribe(() => {
      this.loadSupervisorDashboard();
      this.toast.success('تم اعتماد الحصة وتسجيل ملاحظات وتقييم المشرف بنجاح! ✅');
    });
  }

  approveAllTeacherPendingSessions(teacherId: string): void {
    const group = this.groupedPendingSessions.find(g => (g.teacher._id || g.teacher) === teacherId);
    if (!group || group.sessions.length === 0) return;

    if (confirm(`هل أنت متأكد من اعتماد جميع الحصص المعلقة (${group.sessions.length} حصة) للمعلم (${group.teacher.name}) دفعة واحدة؟`)) {
      const promises = group.sessions.map(s => 
        this.api.post(`sessions/${s._id}/approve`, { supervisorChecklist: this.getChecklistState(s._id) }).toPromise()
      );
      Promise.all(promises).then(() => {
        this.loadSupervisorDashboard();
        this.toast.success(`تم اعتماد جميع حصص المعلم (${group.teacher.name}) بنجاح! 🎉`);
      });
    }
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
      this.loadAllDeficits(this.teacherStudents);
    });

    this.api.get('sessions/makeups').subscribe((res) => {
      this.pendingMakeups = res.data;
    });

    this.api.get('sessions').subscribe((res) => {
      this.teacherSessions = res.data;
    });

    this.loadTeacherMonthlyPerf();

    this.loadTeacherSalaryEstimate(this.teacherSalaryMonthStr);

    this.api.get('salaries').subscribe((res) => {
      this.salaries = res.data || [];
    });

    this.loadTeacherSchedule();
    this.loadTeacherAvailability();
    if (this.user && this.user._id) {
      this.loadWeeklySchedule(this.user._id);
    }
  }

  onTeacherSalaryMonthChange(monthStr: string): void {
    if (!monthStr) return;
    this.teacherSalaryMonthStr = monthStr;
    this.loadTeacherSalaryEstimate(monthStr);
  }

  loadTeacherSalaryEstimate(monthStr?: string): void {
    const mStr = monthStr || this.teacherSalaryMonthStr || new Date().toISOString().substring(0, 7);
    this.api.get(`salaries/estimate?monthStr=${mStr}`).subscribe((res) => {
      if (res.data) {
        this.teacherSalaryEstimate = res.data;
        this.teacherHours = res.data.hoursTaught || 0;
        this.teacherExpectedSalary = res.data.estimatedPayoutEgp || 0;
      }
    });
  }

  submitSession(): void {
    if (this.sessionForm.invalid) return;

    const studentId = this.sessionForm.value.studentId;
    const dateVal = this.sessionForm.value.date;
    const duration = this.selectedDurationMode === 'OTHER' ? Number(this.customDurationMinutes) : Number(this.selectedDurationMode);

    const statusVal = this.sessionForm.value.status;
    const programVal = this.sessionForm.value.subject;

    // Strict Procedure Validation: Cannot log Unexcused absence without verifying group call or last-minute excuse
    if (statusVal === 'Unexcused') {
      if (!this.notifiedOnGroupBool && !this.preNotifiedTwoHoursBool) {
        this.toast.error('لا يمكن تسجيل غياب بدون عذر (ولن تُحسب الحصة ماليّاً) إلا بعد تحديد خيار واحد على الأقل من الإيضاحات: (تم الرن على جروب الطالب ولا توجد استجابة) أو (اعتذار خلال/قبل الحصة بدقائق معدودة)!');
        return;
      }
    }

    const payload = {
      studentId,
      program: programVal,
      subject: programVal,
      isCombinedProgram: programVal === 'حصة مدمجة',
      date: dateVal,
      durationMinutes: duration || 60,
      status: statusVal,
      teacherNote: this.sessionForm.value.teacherNote,
      scheduledMakeupDate: (['Excused', 'TeacherAbs'].includes(statusVal) && this.hasDeterminedMakeupDate) ? this.scheduledMakeupDateStr : null,
      scheduledMakeupTimeSlot: (['Excused', 'TeacherAbs'].includes(statusVal) && this.hasDeterminedMakeupDate) ? this.scheduledMakeupTimeSlotStr : '',
      originalSessionId: (['TeacherMakeup', 'StudentMakeup'].includes(statusVal)) ? this.selectedOriginalSessionId : undefined,
      latenessRemark: this.latenessRemarkStr,
      notifiedOnGroup: this.notifiedOnGroupBool,
      preNotifiedTwoHours: this.preNotifiedTwoHoursBool
    };

    this.api.post('sessions', payload).subscribe({
      next: (res: any) => {
        this.showLogModal = false;
        this.sessionForm.reset({
          subject: 'القرآن الكريم والتجويد',
          date: new Date().toISOString().substring(0, 10),
          durationMinutes: 60,
          status: 'Present'
        });
        this.selectedDurationMode = '60';
        this.hasDeterminedMakeupDate = false;
        this.scheduledMakeupDateStr = '';
        this.selectedOriginalSessionId = '';
        this.latenessRemarkStr = '';
        this.notifiedOnGroupBool = false;
        this.preNotifiedTwoHoursBool = false;

        this.loadTeacherDashboard();
        this.loadDeficitMatrix();
        this.loadMakeupDashboardStats();
        if (res.consecutiveAbsenceAlert) {
          this.toast.warning(res.message);
        } else {
          this.toast.success('تم تسجيل الحصة والربط الآلي بنجاح!');
        }
      },
      error: (err: any) => this.toast.error(err.error?.message || 'خطأ أثناء تسجيل الحصة')
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
      this.loadAllDeficits(this.parentChildren);
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
      'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت'
    };
    return days[day] || day;
  }

  toggleScheduleDay(dayKey: string): void {
    const index = this.selectedScheduleDays.indexOf(dayKey);
    if (index > -1) {
      if (this.selectedScheduleDays.length > 1) {
        this.selectedScheduleDays.splice(index, 1);
      } else {
        this.toast.warning('يجب اختيار يوم واحد على الأقل');
      }
    } else {
      this.selectedScheduleDays.push(dayKey);
    }
  }

  selectAllScheduleDays(): void {
    if (this.selectedScheduleDays.length === 7) {
      this.selectedScheduleDays = ['Sunday'];
    } else {
      this.selectedScheduleDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
  }

  isScheduleDaySelected(dayKey: string): boolean {
    return this.selectedScheduleDays.includes(dayKey);
  }

  submitAddScheduleSlot(): void {
    if (this.scheduleStudentMode === 'existing') {
      if (this.scheduleForm.invalid) return;

      if (!this.selectedScheduleDays || this.selectedScheduleDays.length === 0) {
        this.toast.error('يرجى اختيار يوم واحد على الأقل!');
        return;
      }

      const payload = {
        daysOfWeek: this.selectedScheduleDays,
        timeSlot: this.scheduleForm.value.timeSlot,
        durationMinutes: Number(this.scheduleForm.value.durationMinutes) || 60,
        studentId: this.scheduleForm.value.studentId
      };

      this.api.post('schedule', payload).subscribe({
        next: () => {
          this.showScheduleModal = false;
          this.scheduleForm.reset({ durationMinutes: 60 });
          this.selectedScheduleDays = ['Sunday'];
          this.loadTeacherSchedule();
          this.refreshWeeklySchedule();
          this.toast.success('تم إضافة المواعيد الأسبوعية بنجاح!');
        },
        error: (err: any) => this.toast.error(err.error?.message || 'تعذر إضافة الموعد')
      });
    } else {
      // NEW STUDENT CREATION MODE
      if (!this.newStudentName || !this.newStudentName.trim()) {
        this.toast.error('يرجى كتابة اسم الطالب الجديد!');
        return;
      }
      if (!this.newStudentAge || isNaN(Number(this.newStudentAge)) || Number(this.newStudentAge) <= 0 || Number(this.newStudentAge) > 120) {
        this.toast.error('يرجى تحديد عمر الطالب الجديد بشكل صحيح (إجباري بين 1 و 120 سنة)!');
        return;
      }
      if (!this.selectedScheduleDays || this.selectedScheduleDays.length === 0) {
        this.toast.error('يرجى اختيار يوم واحد على الأقل!');
        return;
      }
      if (!this.scheduleForm.value.timeSlot) {
        this.toast.error('يرجى تحديد وقت الحصة!');
        return;
      }

      const targetTeacherId = this.selectedWeeklyScheduleTeacherId || (this.role === 'Teacher' ? this.user?._id : undefined);

      const studentPayload = {
        name: this.newStudentName.trim(),
        age: Number(this.newStudentAge),
        country: this.newStudentCountry,
        timezone: this.newStudentTimezone,
        teacherIds: targetTeacherId ? [targetTeacherId] : []
      };

      this.api.post('students', studentPayload).subscribe({
        next: (res: any) => {
          const newStudent = res.data;
          const schedulePayload = {
            daysOfWeek: this.selectedScheduleDays,
            timeSlot: this.scheduleForm.value.timeSlot,
            durationMinutes: Number(this.scheduleForm.value.durationMinutes) || 60,
            studentId: newStudent._id
          };

          this.api.post('schedule', schedulePayload).subscribe({
            next: () => {
              this.showScheduleModal = false;
              this.newStudentName = '';
              this.newStudentAge = null;
              this.newStudentCountry = '';
              this.scheduleStudentMode = 'existing';
              this.scheduleForm.reset({ durationMinutes: 60 });
              this.selectedScheduleDays = ['Sunday'];

              if (this.role === 'Teacher') {
                this.api.get('students').subscribe(sRes => this.teacherStudents = sRes.data || []);
              }
              this.loadTeacherSchedule();
              this.refreshWeeklySchedule();
              this.toast.success(`تم تسجيل الطالب (${newStudent.name}) إضافة مواعيده بنجاح!`);
            },
            error: (err: any) => this.toast.error(err.error?.message || 'تعذر تسجيل مواعيد الطالب الجديد')
          });
        },
        error: (err: any) => this.toast.error(err.error?.message || 'تعذر إضافة الطالب الجديد')
      });
    }
  }

  openEditStudentSchedule(studentRow: any): void {
    this.selectedStudentForScheduleEdit = studentRow;
    this.editingStudentCountry = studentRow.country || '';
    this.editingStudentTimezone = studentRow.timezone || 'US-EST';

    const existingSlots: any[] = [];
    const dayKeys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sId = studentRow.id || studentRow._id;

    const studentSlots = (this.teacherSchedule || []).filter(slot => slot.student?._id === sId);

    if (studentSlots.length > 0) {
      studentSlots.forEach(slot => {
        existingSlots.push({
          _id: slot._id,
          dayOfWeek: slot.dayOfWeek,
          timeSlot: slot.timeSlot,
          durationMinutes: slot.durationMinutes || studentRow.lessonDuration || 60
        });
      });
    } else {
      dayKeys.forEach(day => {
        if (studentRow.slots && studentRow.slots[day]) {
          existingSlots.push({
            dayOfWeek: day,
            timeSlot: studentRow.slots[day],
            durationMinutes: studentRow.lessonDuration || 60
          });
        }
      });
    }

    if (existingSlots.length === 0) {
      existingSlots.push({ dayOfWeek: 'Sunday', timeSlot: '17:00', durationMinutes: 60 });
    }

    this.editingStudentScheduleSlots = existingSlots;
    this.showEditStudentScheduleModal = true;
  }

  addSlotToEditingSchedule(): void {
    this.editingStudentScheduleSlots.push({
      dayOfWeek: 'Sunday',
      timeSlot: '17:00',
      durationMinutes: 60
    });
  }

  removeSlotFromEditingSchedule(index: number): void {
    this.editingStudentScheduleSlots.splice(index, 1);
  }

  saveStudentScheduleEdits(): void {
    if (!this.selectedStudentForScheduleEdit) return;
    const studentId = this.selectedStudentForScheduleEdit.id || this.selectedStudentForScheduleEdit._id;
    const studentName = this.selectedStudentForScheduleEdit.name || 'الطالب';

    const slotsSummary = this.editingStudentScheduleSlots
      .map(s => `${s.dayOfWeek} (${this.format12Hour(s.timeSlot)} - ${s.durationMinutes} دقيقة)`)
      .join(' | ');

    const confirmMsg = `هل أنت متأكد من تعديل موعد الطالب (${studentName}) ليصبح:\n\n${slotsSummary}؟`;
    if (!confirm(confirmMsg)) return;

    const payload = {
      studentId: studentId,
      slots: this.editingStudentScheduleSlots,
      newStudentTimezone: this.editingStudentTimezone,
      newStudentCountry: this.editingStudentCountry
    };

    this.api.post('schedule/request-edit', payload).subscribe({
      next: (res: any) => {
        this.showEditStudentScheduleModal = false;
        if (res.autoApproved) {
          this.toast.success('تم تعديل وتحديث جدول الطالب رسمياً!');
        } else {
          this.toast.info('تم إرسال طلب تعديل جدول الطالب إلى المشرف المسؤول للمراجعة والموافقة ⏳');
        }
        if (this.user && this.user._id) {
          this.loadWeeklySchedule(this.user._id);
        }
        this.loadTeacherSchedule();
        this.loadScheduleEditRequests();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'خطأ أثناء إرسال طلب تعديل الجدول')
    });
  }

  resolveScheduleEditRequest(reqId: string, status: 'Approved' | 'Rejected'): void {
    let rejectionReason = '';
    if (status === 'Rejected') {
      rejectionReason = prompt('يرجى كتابة سبب رفض التعديل (اختياري):') || '';
    }

    this.api.post(`schedule/edit-requests/${reqId}/resolve`, { status, rejectionReason }).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'تم تحديث حالة الطلب بنجاح');
        this.loadScheduleEditRequests();
        if (this.user && this.user._id) {
          this.loadWeeklySchedule(this.user._id);
        }
        this.loadTeacherSchedule();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'خطأ أثناء البت في الطلب')
    });
  }

  deleteScheduleSlot(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد الأسبوعي؟')) {
      this.api.delete(`schedule/${id}`).subscribe(() => {
        this.loadTeacherSchedule();
        this.refreshWeeklySchedule();
        this.toast.success('تم حذف الموعد الأسبوعي بنجاح.');
      });
    }
  }

  refreshWeeklySchedule(): void {
    if (this.selectedWeeklyScheduleTeacherId) {
      this.loadWeeklySchedule(this.selectedWeeklyScheduleTeacherId);
    } else if (this.role === 'Teacher' && this.user?._id) {
      this.loadWeeklySchedule(this.user._id);
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

  // Handle student photo upload — uploads to Cloudinary and stores URL
  onStudentPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      this.toast.warning('حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => { this.studentPhotoPreview = reader.result as string; };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('photo', file);
    this.api.postFormData('upload/student-photo', formData).subscribe({
      next: (res: any) => {
        this.studentForm.patchValue({ photoUrl: res.url });
        this.toast.success('تم رفع الصورة بنجاح!');
      },
      error: (err: any) => {
        this.studentPhotoPreview = '';
        this.studentForm.patchValue({ photoUrl: '' });
        this.toast.error(err.error?.message || 'فشل رفع الصورة، حاول مرة أخرى');
      }
    });
  }

  // Toggle program selection
  toggleProgram(prog: string): void {
    const current: string[] = this.studentForm.get('programs')?.value || [];
    const idx = current.indexOf(prog);
    if (idx === -1) {
      this.studentForm.patchValue({ programs: [...current, prog] });
      // init level and books for this program
      if (!this.selectedProgramLevels[prog]) this.selectedProgramLevels[prog] = '';
      if (!this.selectedProgramBooks[prog]) this.selectedProgramBooks[prog] = [];
    } else {
      this.studentForm.patchValue({ programs: current.filter(p => p !== prog) });
      delete this.selectedProgramLevels[prog];
      delete this.selectedProgramBooks[prog];
    }
  }

  isProgramSelected(prog: string): boolean {
    return (this.studentForm.get('programs')?.value || []).includes(prog);
  }

  getLevelsForProgram(prog: string): string[] {
    return this.programLevelsMap[prog] || [];
  }

  getBooksForProgram(prog: string): string[] {
    return this.programBooksMap[prog] || [];
  }

  toggleBookForProgram(prog: string, book: string): void {
    if (!this.selectedProgramBooks[prog]) this.selectedProgramBooks[prog] = [];
    const idx = this.selectedProgramBooks[prog].indexOf(book);
    if (idx === -1) this.selectedProgramBooks[prog].push(book);
    else this.selectedProgramBooks[prog].splice(idx, 1);
  }

  isBookSelected(prog: string, book: string): boolean {
    return (this.selectedProgramBooks[prog] || []).includes(book);
  }

  // ── Schedule Slots ─────────────────────────────────────────────
  addScheduleSlot(): void {
    this.scheduleSlots.push({ day: 'Sunday', time: '10:00', durationMinutes: 60 });
  }

  removeScheduleSlot(idx: number): void {
    this.scheduleSlots.splice(idx, 1);
  }

  getTotalScheduleDuration(): number {
    return this.scheduleSlots.reduce((acc, slot) => acc + (Number(slot.durationMinutes) || 0), 0);
  }

  // Toggle day selection (legacy - kept for backward compat)
  toggleDay(day: string): void {
    const current: string[] = this.studentForm.get('sessionDays')?.value || [];
    const idx = current.indexOf(day);
    if (idx === -1) {
      this.studentForm.patchValue({ sessionDays: [...current, day] });
    } else {
      this.studentForm.patchValue({ sessionDays: current.filter(d => d !== day) });
    }
  }

  isDaySelected(day: string): boolean {
    return (this.studentForm.get('sessionDays')?.value || []).includes(day);
  }

  // ── Delete Student ─────────────────────────────────────────────
  deleteStudent(student: any): void {
    if (!confirm(`هل أنت متأكد من حذف الطالب "${student.name}"؟\nسيتم حذف جميع حصصه بشكل نهائي ولا يمكن التراجع.`)) return;
    this.api.delete(`students/${student._id}`).subscribe({
      next: () => {
        this.toast.success(`تم حذف الطالب "${student.name}" بنجاح.`);
        // تحديث القوائم
        this.comprehensiveStudents = this.comprehensiveStudents.filter(s => s._id !== student._id);
        if (this.role === 'Admin') this.loadAdminDashboard();
        else this.loadSupervisorDashboard();
      },
      error: (err) => this.toast.error(err.error?.message || 'فشل في الحذف')
    });
  }

  // Supervisor hierarchy mini-drill
  supSelectTeacher(teacher: any): void {
    this.supHierarchySelectedTeacher = teacher;
    this.supHierarchySelectedStudent = null;
  }

  supSelectStudent(student: any): void {
    this.supHierarchySelectedStudent = student;
  }

  supHierarchyGoBack(): void {
    if (this.supHierarchySelectedStudent) {
      this.supHierarchySelectedStudent = null;
    } else {
      this.supHierarchySelectedTeacher = null;
    }
  }

  // ── Submit Student (with double-submit guard) ─────────────────
  openAddStudentModal(): void {
    this.editingStudentId = null;
    this.addingStudentForTeacher = null;
    this.studentPhotoPreview = '';
    this.scheduleSlots = [];
    this.selectedProgramLevels = {};
    this.selectedProgramBooks = {};
    this.customProgramText = '';
    this.studentForm.reset({
      teacherIds: [], timezone: 'Africa/Cairo', photoUrl: '',
      parentSocialMediaConsent: false,
      programs: [], sessionDays: [], sessionDurationMinutes: 60, status: 'Active'
    });
    this.selectedUsState = '';
    this.selectedCanadaProvince = '';
    this.showStudentModal = true;
  }

  openAddStudentForTeacherModal(teacher: any): void {
    if (!teacher) return;
    const teacherId = teacher._id || teacher;
    this.editingStudentId = null;
    this.addingStudentForTeacher = teacher;
    this.studentPhotoPreview = '';
    this.scheduleSlots = [];
    this.selectedProgramLevels = {};
    this.selectedProgramBooks = {};
    this.customProgramText = '';

    // Ensure teachers and parents lists are loaded for form dropdowns
    if (!this.teachersList || this.teachersList.length === 0) {
      this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data || []);
    }
    if (!this.parentsList || this.parentsList.length === 0) {
      this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data || []);
    }

    this.studentForm.reset({
      teacherIds: [teacherId],
      timezone: 'Africa/Cairo',
      photoUrl: '',
      parentSocialMediaConsent: false,
      programs: [],
      sessionDays: [],
      sessionDurationMinutes: 60,
      status: 'Active'
    });
    this.selectedUsState = '';
    this.selectedCanadaProvince = '';
    this.showStudentModal = true;
  }

  editStudent(studentOrId: any): void {
    if (!studentOrId) return;
    this.addingStudentForTeacher = null;

    // Ensure teachers and parents lists are loaded for form dropdowns
    if (!this.teachersList || this.teachersList.length === 0) {
      this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data || []);
    }
    if (!this.parentsList || this.parentsList.length === 0) {
      this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data || []);
    }

    const studentId = typeof studentOrId === 'string' ? studentOrId : (studentOrId._id || studentOrId.id);
    if (!studentId) return;

    // Check if full student object was passed or exists in local lists
    let fullStudent: any = null;
    if (typeof studentOrId === 'object' && (studentOrId.age !== undefined || studentOrId.country !== undefined || studentOrId.scheduleSlots !== undefined)) {
      fullStudent = studentOrId;
    } else {
      fullStudent = this.studentsList?.find(s => s._id === studentId)
        || this.supervisedStudents?.find(s => s._id === studentId);
    }

    if (fullStudent && (fullStudent.age !== undefined || fullStudent.country !== undefined)) {
      this.populateStudentFormForEdit(fullStudent);
    } else {
      // Fetch full student from backend
      this.api.get(`students/${studentId}`).subscribe({
        next: (res: any) => {
          if (res && res.data) {
            this.populateStudentFormForEdit(res.data);
          } else {
            this.populateStudentFormForEdit(studentOrId);
          }
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'تعذر تحميل بيانات الطالب للتعديل');
        }
      });
    }
  }

  populateStudentFormForEdit(student: any): void {
    if (!student) return;
    this.editingStudentId = student._id || student.id;
    this.studentPhotoPreview = student.photoUrl || '';

    // parse country and states
    let formCountry = student.country || '';
    this.selectedUsState = '';
    this.selectedCanadaProvince = '';

    if (formCountry.startsWith('الولايات المتحدة — ')) {
      this.selectedUsState = formCountry.replace('الولايات المتحدة — ', '');
      formCountry = 'الولايات المتحدة الأمريكية';
    } else if (formCountry.startsWith('كندا — ')) {
      this.selectedCanadaProvince = formCountry.replace('كندا — ', '');
      formCountry = 'كندا';
    }

    // استعادة scheduleSlots
    this.scheduleSlots = student.scheduleSlots?.length
      ? [...student.scheduleSlots]
      : (student.sessionDays || []).map((day: string) => ({
          day,
          time: student.sessionTimeTeacher || '',
          durationMinutes: student.sessionDurationMinutes || 60
        }));

    // استعادة programLevels وprogramBooks
    try {
      this.selectedProgramLevels = typeof student.programLevels === 'string'
        ? JSON.parse(student.programLevels || '{}') : (student.programLevels || {});
    } catch { this.selectedProgramLevels = {}; }
    try {
      this.selectedProgramBooks = typeof student.programBooks === 'string'
        ? JSON.parse(student.programBooks || '{}') : (student.programBooks || {});
    } catch { this.selectedProgramBooks = {}; }

    this.customProgramText = student.customProgram || '';

    const parentId = student.parent?._id || student.parent || '';
    const teacherIds = (student.teachers || []).map((t: any) => t._id || t);

    this.studentForm.patchValue({
      name: student.name || '',
      parentId: parentId,
      teacherIds: teacherIds,
      photoUrl: student.photoUrl || '',
      parentSocialMediaConsent: !!student.parentSocialMediaConsent,
      status: student.status || 'Active',
      age: student.age !== undefined && student.age !== null ? student.age : null,
      language: student.language || '',
      country: formCountry,
      timezone: student.timezone || 'Africa/Cairo',
      startDate: student.startDate ? new Date(student.startDate).toISOString().substring(0, 10) : '',
      programs: student.programs || [],
      levelPerProgram: student.levelPerProgram || '',
      booksUsed: (student.booksUsed || []).join(', '),
      sessionDurationMinutes: student.sessionDurationMinutes || 60,
      sessionDays: student.sessionDays || [],
      sessionTimeTeacher: student.sessionTimeTeacher || ''
    });

    this.showStudentModal = true;
  }

  submitStudent(): void {
    const ageVal = this.studentForm.get('age')?.value;
    if (ageVal === null || ageVal === undefined || ageVal === '' || isNaN(Number(ageVal)) || Number(ageVal) <= 0 || Number(ageVal) > 120) {
      this.studentForm.get('age')?.markAsTouched();
      this.toast.error('يرجى تحديد عمر الطالب بشكل صحيح (حقل إجباري بين 1 و 120 سنة)!');
      return;
    }

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      this.toast.error('يرجى استكمال جميع الحقول الإلزامية المطلوبة بشكل صحيح!');
      return;
    }

    if (this.isSubmittingStudent) return;
    this.isSubmittingStudent = true;

    const rawBooks = this.studentForm.get('booksUsed')?.value || '';
    const booksArray = typeof rawBooks === 'string'
      ? rawBooks.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0)
      : rawBooks;

    const countryValue = this.studentForm.get('country')?.value || '';
    let finalCountry = countryValue;
    if (countryValue === 'الولايات المتحدة الأمريكية' && this.selectedUsState) {
      finalCountry = `الولايات المتحدة — ${this.selectedUsState}`;
    } else if (countryValue === 'كندا' && this.selectedCanadaProvince) {
      finalCountry = `كندا — ${this.selectedCanadaProvince}`;
    }

    // إعداد scheduleSlots — أو تحويل الأيام القديمة إذا لم تكن موجودة
    const finalSlots = this.scheduleSlots.length > 0
      ? this.scheduleSlots
      : [];

    const rawForm = this.studentForm.getRawValue();
    const teacherIds = this.addingStudentForTeacher
      ? [this.addingStudentForTeacher._id || this.addingStudentForTeacher]
      : (rawForm.teacherIds || []);

    const payload = {
      ...rawForm,
      teacherIds: teacherIds,
      parentId: rawForm.parentId === 'none' ? null : rawForm.parentId,
      country: finalCountry,
      booksUsed: booksArray,
      scheduleSlots: finalSlots,
      programLevels: this.selectedProgramLevels,
      programBooks: this.selectedProgramBooks,
      customProgram: this.customProgramText
    };

    const resetForm = () => {
      this.showStudentModal = false;
      this.isSubmittingStudent = false;
      this.editingStudentId = null;
      this.addingStudentForTeacher = null;
      this.studentPhotoPreview = '';
      this.scheduleSlots = [];
      this.selectedProgramLevels = {};
      this.selectedProgramBooks = {};
      this.customProgramText = '';
      this.studentForm.reset({
        teacherIds: [], timezone: 'Africa/Cairo', photoUrl: '',
        parentSocialMediaConsent: false,
        programs: [], sessionDays: [], sessionDurationMinutes: 60, status: 'Active'
      });
      if (this.role === 'Admin') this.loadAdminDashboard();
      if (this.role === 'Supervisor' || this.role === 'GlobalSup') this.loadSupervisorDashboard();
    };

    if (this.editingStudentId) {
      this.api.put(`students/${this.editingStudentId}`, payload).subscribe({
        next: () => { this.toast.success('تم تحديث بيانات الطالب بنجاح!'); resetForm(); },
        error: (err) => { this.isSubmittingStudent = false; this.toast.error(err.error?.message || err.message || 'فشل في التعديل'); }
      });
    } else {
      this.api.post('students', payload).subscribe({
        next: () => { this.toast.success('تمت إضافة الطالب بنجاح!'); resetForm(); },
        error: (err) => { this.isSubmittingStudent = false; this.toast.error(err.error?.message || err.message || 'فشل في الإضافة'); }
      });
    }
  }

  // ── Submit Parent (Admin + Supervisor) ───────────────────────
  submitParent(): void {
    if (this.parentForm.invalid || this.isSubmittingParent) return;

    this.isSubmittingParent = true;
    const body = {
      ...this.parentForm.value,
      studentIds: this.selectedStudentIdsForNewParent
    };

    this.api.post('auth/register-parent', body).subscribe({
      next: (res: any) => {
        this.isSubmittingParent = false;
        this.toast.success(res.message || 'تم إنشاء حساب ولي الأمر بنجاح!');
        this.showParentModal = false;
        this.selectedStudentIdsForNewParent = [];
        this.parentForm.reset({ password: 'parent123', defaultHourlyRate: null, defaultCurrency: '' });
        
        // Reload dashboard and parent lists
        if (this.role === 'Admin') {
          this.loadAdminDashboard();
        } else {
          this.loadSupervisorDashboard();
        }
      },
      error: (err) => {
        this.isSubmittingParent = false;
        this.toast.error(err.error?.message || 'فشل في إنشاء الحساب');
      }
    });
  }

  initStaffFormIfNeeded(): void {
    if (!this.staffForm) {
      this.staffForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['password123', [Validators.required, Validators.minLength(6)]],
        role: ['Teacher', Validators.required],
        phone: [''],
        specialty: [''],
        supervisorId: ['']
      });
    }
  }

  openAddStaffModal(): void {
    this.initStaffFormIfNeeded();
    this.editingStaffId = null;
    this.staffForm.reset({ role: 'Teacher', password: 'password123' });
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showStaffModal = true;
  }

  openAddSupervisorModal(): void {
    this.initStaffFormIfNeeded();
    this.editingStaffId = null;
    this.staffForm.reset({ role: 'Supervisor', password: 'password123' });
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showStaffModal = true;
  }

  openAddTeacherModal(): void {
    this.initStaffFormIfNeeded();
    this.editingStaffId = null;
    this.staffForm.reset({ role: 'Teacher', password: 'password123' });
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showStaffModal = true;
  }

  openAddGlobalSupervisorModal(): void {
    this.initStaffFormIfNeeded();
    this.editingStaffId = null;
    this.staffForm.reset({ role: 'GlobalSup', password: 'password123' });
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showStaffModal = true;
  }

  deleteUserAccount(userId: string, name: string): void {
    if (!userId) return;
    if (confirm(`هل أنت متأكد من حذف الحساب الإداري لـ (${name}) نهائياً من المنظومة؟`)) {
      this.api.delete(`auth/users/${userId}`).subscribe({
        next: () => {
          this.toast.success(`تم حذف الحساب (${name}) بنجاح!`);
          if (this.role === 'Admin') this.loadAdminDashboard();
          else if (this.role === 'GlobalSup' || this.role === 'Supervisor') this.loadSupervisorDashboard();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'فشل في حذف الحساب');
        }
      });
    }
  }

  editStaff(user: any): void {
    this.initStaffFormIfNeeded();
    this.editingStaffId = user._id;
    this.staffForm.reset();
    this.staffForm.get('password')?.clearValidators();
    this.staffForm.get('password')?.updateValueAndValidity();

    this.staffForm.patchValue({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Teacher',
      phone: user.phone || '',
      specialty: user.specialty || '',
      supervisorId: user.supervisor?._id || user.supervisor || ''
    });
    this.showStaffModal = true;
  }

  submitStaff(): void {
    if (this.staffForm.invalid) return;
    
    const payload: any = {
      name: this.staffForm.value.name,
      email: this.staffForm.value.email,
      role: this.staffForm.value.role,
      phone: this.staffForm.value.phone,
      specialty: this.staffForm.value.specialty || '',
      supervisor: (this.staffForm.value.role === 'Teacher' || this.staffForm.value.role === 'Supervisor') ? this.staffForm.value.supervisorId : undefined
    };

    if (this.staffForm.value.password) {
      payload.password = this.staffForm.value.password;
    }

    const refreshDashboard = () => {
      if (this.role === 'Admin') this.loadAdminDashboard();
      else if (this.role === 'GlobalSup' || this.role === 'Supervisor') this.loadSupervisorDashboard();
    };

    if (this.editingStaffId) {
      this.api.put(`auth/users/${this.editingStaffId}`, payload).subscribe({
        next: () => {
          this.toast.success('تم تحديث بيانات العضو بنجاح!');
          this.showStaffModal = false;
          this.editingStaffId = null;
          this.staffForm.reset({ role: 'Teacher', password: 'password123' });
          refreshDashboard();
        },
        error: (err) => this.toast.error(err.error?.message || 'فشل في التحديث')
      });
    } else {
      payload.password = this.staffForm.value.password || 'password123';
      this.api.post('auth/register', payload).subscribe({
        next: () => {
          this.toast.success('تم تسجيل العضو الجديد بنجاح!');
          this.showStaffModal = false;
          this.staffForm.reset({ role: 'Teacher', password: 'password123' });
          refreshDashboard();
        },
        error: (err) => this.toast.error(err.error?.message || 'فشل في التسجيل')
      });
    }
  }

  // ── Comprehensive View ────────────────────────────────────────
  openComprehensiveView(): void {
    this.showComprehensiveView = true;
    this.comprehensiveFilter = { teacherId: '', status: '' };
    // Ensure data is loaded
    if (this.comprehensiveStudents.length === 0) {
      this.api.get('students').subscribe(res => {
        this.comprehensiveStudents = res.data;
      });
    }
  }

  // ── Grouped Students for Admin ──
  studentTabSearchQuery = '';

  getGroupedStudents(): any[] {
    const groups: { [key: string]: { parent: any, students: any[] } } = {};
    
    const query = this.studentTabSearchQuery.trim().toLowerCase();
    const filtered = this.studentsList.filter(student => {
      if (!query) return true;
      const studentName = (student.name || '').toLowerCase();
      const parentName = (student.parent?.name || '').toLowerCase();
      return studentName.includes(query) || parentName.includes(query);
    });

    filtered.forEach(student => {
      const parentId = student.parent?._id || 'unassigned';
      if (!groups[parentId]) {
        groups[parentId] = {
          parent: student.parent || { name: 'غير محدد' },
          students: []
        };
      }
      groups[parentId].students.push(student);
    });
    
    return Object.values(groups);
  }

  getTeachersNames(student: any): string {
    if (!student.teachers || student.teachers.length === 0) return 'غير معين';
    return student.teachers.map((t: any) => t.name).join(', ');
  }

  toggleStudentSelectionForNewParent(studentId: string): void {
    const idx = this.selectedStudentIdsForNewParent.indexOf(studentId);
    if (idx > -1) {
      this.selectedStudentIdsForNewParent.splice(idx, 1);
    } else {
      this.selectedStudentIdsForNewParent.push(studentId);
    }
  }

  openPricingForStudent(studentId: string, teacherId?: string): void {
    let resolvedTeacherId = teacherId || '';
    if (!resolvedTeacherId && studentId) {
      const st = this.studentsList?.find(s => s._id === studentId);
      if (st) {
        const studentTeachers = Array.isArray(st.teachers) && st.teachers.length > 0
          ? st.teachers
          : (st.teacher ? [st.teacher] : []);
        if (studentTeachers.length === 1) {
          resolvedTeacherId = studentTeachers[0]._id || studentTeachers[0];
        }
      }
    }

    this.pricingForm.reset({
      studentId: studentId || '',
      teacherId: resolvedTeacherId,
      subject: 'القرآن الكريم والتجويد',
      hourlyRate: '',
      currency: 'USD',
      teacherRate: '',
      teacherCurrency: 'EGP'
    });
    this.showPricingModal = true;
  }

  openInvoiceDetailsModal(invoice: any): void {
    this.selectedInvoiceForDetails = invoice;
    this.showInvoiceDetailsModal = true;
  }

  closeInvoiceDetailsModal(): void {
    this.selectedInvoiceForDetails = null;
    this.showInvoiceDetailsModal = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── TIMEZONE CONVERSION ──────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Convert a schedule slot time (stored in Cairo timezone = Africa/Cairo)
   * to the student's local timezone using the browser Intl API (no external libs).
   * @param timeStr  "HH:MM" in Cairo time
   * @param dayOfWeek  e.g. "Sunday"
   * @param studentTimezone  IANA timezone string e.g. "America/New_York"
   */
  convertToStudentTimezone(timeStr: string, dayOfWeek: string, studentTimezone: string): string {
    if (!timeStr || !dayOfWeek || !studentTimezone || studentTimezone === 'Africa/Cairo') {
      return timeStr || '—';
    }
    try {
      const dayIndex = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(dayOfWeek);
      if (dayIndex === -1) return timeStr;
      const [h, m] = timeStr.split(':').map(Number);

      // Build a reference date for this coming weekday in Cairo time
      const now = new Date();
      const currentDayIndex = now.getDay();
      const diffDays = ((dayIndex - currentDayIndex) + 7) % 7;
      const cairoRef = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffDays,
        0, 0, 0
      ));
      // Interpret as Cairo local time: shift by Cairo UTC offset
      // Africa/Cairo is UTC+2 (UTC+3 during DST, but Egypt stopped DST in 2011 → always UTC+2)
      const cairoOffsetMinutes = -120; // UTC+2
      cairoRef.setMinutes(cairoRef.getMinutes() + cairoOffsetMinutes + h * 60 + m);

      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: studentTimezone
      }).format(cairoRef);
    } catch {
      return timeStr;
    }
  }

  /** Returns the student timezone abbreviation string e.g. "EST" */
  getTimezoneLabel(timezone: string): string {
    if (!timezone || timezone === 'Africa/Cairo') return 'Cairo';
    try {
      const abbr = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: timezone })
        .formatToParts(new Date())
        .find(p => p.type === 'timeZoneName')?.value || timezone;
      return abbr;
    } catch {
      return timezone;
    }
  }

  getTimezoneOffsetDifference(studentTz: string, countryStr?: string): string {
    let rawInput = studentTz || '';
    if (countryStr && countryStr !== '—') {
      const countryTz = this.getIANATimezone(countryStr);
      if (countryTz && countryTz !== 'America/New_York') {
        rawInput = countryTz;
      } else if (!rawInput) {
        rawInput = countryStr;
      }
    } else if (studentTz) {
      rawInput = this.getIANATimezone(studentTz);
    }
    if (!rawInput || rawInput === 'Africa/Cairo') return '0';
    try {
      const iana = this.getIANATimezone(rawInput);
      const date = new Date();
      const format = (tz: string) => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour12: false,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        }).formatToParts(date);
        
        const map = new Map(parts.map(p => [p.type, p.value]));
        return new Date(
          Number(map.get('year')),
          Number(map.get('month')) - 1,
          Number(map.get('day')),
          Number(map.get('hour')),
          Number(map.get('minute')),
          Number(map.get('second'))
        ).getTime();
      };
      
      const cairoMs = format('Africa/Cairo');
      const studentMs = format(iana);
      const diffHours = Math.round((studentMs - cairoMs) / (1000 * 60 * 60));
      if (diffHours === 0) return '0';
      return diffHours > 0 ? `+${diffHours} س` : `${diffHours} س`;
    } catch (e) {
      return '—';
    }
  }

  getDayLabelAr(day: string): string {
    const map: Record<string, string> = {
      Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء',
      Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت'
    };
    return map[day] || day;
  }

  /** Extract region/state from country string like "الولايات المتحدة — Delaware" → "Delaware" */
  extractRegion(country: string): string {
    if (!country) return '—';
    const parts = country.split('—');
    return parts.length > 1 ? parts[1].trim() : country.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── MONTHLY DEFICIT / SURPLUS ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  // Map: studentId → deficit data
  studentDeficitMap: Record<string, any> = {};
  // Currently selected month for deficit view (YYYY-MM)
  deficitMonth: string = new Date().toISOString().substring(0, 7);
  deficitLoadingMap: Record<string, boolean> = {};

  /** Load deficit/surplus for a single student */
  loadStudentDeficit(studentId: string, month?: string): void {
    const m = month || this.deficitMonth;
    this.deficitLoadingMap[studentId] = true;
    this.api.get(`reports/monthly-deficit/${studentId}?month=${m}`).subscribe({
      next: (res) => {
        this.studentDeficitMap[studentId] = res.data;
        this.deficitLoadingMap[studentId] = false;
      },
      error: () => { this.deficitLoadingMap[studentId] = false; }
    });
  }

  /** Load deficit for all students in a list */
  loadAllDeficits(students: any[], month?: string): void {
    students.forEach(s => this.loadStudentDeficit(s._id, month));
  }

  /** Called when admin/supervisor/teacher changes the deficit month */
  onDeficitMonthChange(month: string): void {
    this.deficitMonth = month;
    if (this.role === 'Admin' || this.role === 'GlobalSup') {
      this.loadAllDeficits(this.studentsList);
    } else if (this.role === 'Supervisor') {
      this.loadAllDeficits(this.supervisedStudents);
    } else if (this.role === 'Teacher') {
      this.loadAllDeficits(this.teacherStudents);
    } else if (this.role === 'Parent') {
      this.loadAllDeficits(this.parentChildren);
    }
  }

  /** Helper: CSS class for deficit badge */
  deficitClass(status: string): string {
    if (status === 'deficit') return 'deficit-badge deficit';
    if (status === 'surplus') return 'deficit-badge surplus';
    return 'deficit-badge on-track';
  }

  /** Helper: icon for deficit badge */
  deficitIcon(status: string): string {
    if (status === 'deficit') return 'trending_down';
    if (status === 'surplus') return 'trending_up';
    return 'check_circle';
  }

  /** Helper: arabic label */
  deficitLabel(hours: number, status: string): string {
    const abs = Math.abs(hours);
    const hStr = abs % 1 === 0 ? `${abs} ساعة` : `${abs} ساعة`;
    if (status === 'deficit') return `عجز ${hStr}`;
    if (status === 'surplus') return `زيادة ${hStr}`;
    return 'مكتمل';
  }
}


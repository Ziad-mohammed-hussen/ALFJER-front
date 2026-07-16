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
  pricingsList: any[] = [];
  managementAlerts: any[] = [];
  showInvoiceDetailsModal = false;
  selectedInvoiceForDetails: any = null;
  parentlessStudents: any[] = [];
  selectedStudentIdsForNewParent: string[] = [];

  // Supervisor Data
  pendingSessions: any[] = [];
  supervisedStudents: any[] = [];
  activePauses: any[] = [];
  selectedStudentForPause: any = null;
  supervisorMakeups: any[] = [];

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
      specialty: [''],
      supervisorId: ['']
    });

    this._initSharedStudentParentForms();
  }

  initSupervisorForms(): void {
    this.pauseForm = this.fb.group({
      type: ['temporary', Validators.required],
      reason: ['', Validators.required],
      expectedReturnAt: ['']
    });

    this._initSharedStudentParentForms();
  }

  // Shared between Admin & Supervisor
  private _initSharedStudentParentForms(): void {
    this.studentForm = this.fb.group({
      // ── أساسيات ──
      name: ['', Validators.required],
      parentId: ['', Validators.required],
      teacherIds: [[]],
      photoUrl: [''],
      parentSocialMediaConsent: [false],
      status: ['Active'],
      // ── قسم 1: إحصائية ──
      age: [null],
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
      dayOfWeek: ['Sunday', Validators.required],
      timeSlot: ['', Validators.required],
      studentId: ['', Validators.required],
      subject: ['القرآن الكريم والتجويد', Validators.required]
    });
  }

  loadAdminDashboard(): void {
    this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data);
    this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data);
    
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
      this.adminStats.pendingSalaries = this.salaries
        .filter(sal => sal.payoutStatus === 'Unpaid')
        .reduce((sum, sal) => sum + sal.finalPayoutEgp, 0);
    });

    this.loadLeads();
    this.loadEditRequests();
    this.loadTeacherPerformance();
    this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
    this.loadSeasonalAnalytics();
    this.loadHierarchy();
  }

  computeManagementAlerts(): void {
    this.managementAlerts = [];
    this.parentlessStudents = [];

    if (!this.studentsList.length) return;

    // 1. Students without parent
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
          
          const hasPricing = this.pricingsList.some(p => 
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

  submitPricing(): void {
    if (this.pricingForm.invalid) {
      this.toast.error('بيانات النموذج غير مكتملة أو غير صالحة!'); return;
    }
    this.api.post('students/pricing', this.pricingForm.value).subscribe({
      next: () => {
        this.showPricingModal = false;
        this.pricingForm.reset({ subject: 'القرآن الكريم والتجويد', currency: 'USD', teacherCurrency: 'EGP', hourlyRate: 15, teacherRate: 200 });
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
    });

    this.api.get('pauses').subscribe((res) => {
      this.activePauses = res.data;
    });

    this.api.get('sessions/makeups').subscribe((res) => {
      this.supervisorMakeups = res.data;
    });

    this.loadEditRequests();

    // Load teachers & parents for student/parent forms
    this.api.get('auth/users?role=Teacher').subscribe(res => this.teachersList = res.data);
    this.api.get('auth/users?role=Parent').subscribe(res => this.parentsList = res.data);

    if (this.role === 'GlobalSup') {
      this.api.get('auth/users?role=Supervisor').subscribe(res => this.supervisorsList = res.data);
    }

    // Load hierarchy for org tree tab
    this.loadHierarchy();
  }

  // ── Hierarchy Methods ──────────────────────────────────────
  loadHierarchy(): void {
    this.hierarchyLoading = true;
    this.api.get('auth/hierarchy').subscribe({
      next: (res) => {
        this.hierarchyData = res.data;
        this.hierarchyLoading = false;

        // ── FIX: Supervisor role — البيانات تعود كـ { role:'Supervisor', teachers:[...] }
        // لذا يجب الانتقال مباشرةً لمستوى supervisor وضبط selectedHierarchySup
        if (this.role === 'Supervisor' && res.data && res.data.length > 0) {
          this.selectedHierarchySup = res.data[0];
          this.selectedHierarchyGS = null;
          this.hierarchyDrillLevel = 'supervisor';
          this.selectedHierarchyTeacher = null;
        } else {
          // Admin / GlobalSup — Reset drill-down
          this.hierarchyDrillLevel = 'globalSup';
          this.selectedHierarchyGS = null;
          this.selectedHierarchySup = null;
          this.selectedHierarchyTeacher = null;
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
      this.loadAllDeficits(this.teacherStudents);
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
    const dateVal = this.sessionForm.value.date;
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
    return this.scheduleSlots.reduce((acc, slot) => acc + (slot.durationMinutes || 0), 0);
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

  editStudent(student: any): void {
    this.editingStudentId = student._id;
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
      age: student.age || null,
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
    if (this.studentForm.invalid || this.isSubmittingStudent) return;
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

    const payload = {
      ...this.studentForm.value,
      parentId: this.studentForm.value.parentId === 'none' ? null : this.studentForm.value.parentId,
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
        error: (err) => { this.isSubmittingStudent = false; this.toast.error(err.error?.message || 'فشل في التعديل'); }
      });
    } else {
      this.api.post('students', payload).subscribe({
        next: () => { this.toast.success('تمت إضافة الطالب بنجاح!'); resetForm(); },
        error: (err) => { this.isSubmittingStudent = false; this.toast.error(err.error?.message || 'فشل في الإضافة'); }
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

  openAddStaffModal(): void {
    this.editingStaffId = null;
    this.staffForm.reset({ role: 'Teacher', password: 'password123' });
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showStaffModal = true;
  }

  editStaff(user: any): void {
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
      supervisor: this.staffForm.value.role === 'Teacher' ? this.staffForm.value.supervisorId : undefined
    };

    if (this.staffForm.value.password) {
      payload.password = this.staffForm.value.password;
    }

    if (this.editingStaffId) {
      this.api.put(`auth/users/${this.editingStaffId}`, payload).subscribe({
        next: () => {
          this.toast.success('تم تحديث بيانات العضو بنجاح!');
          this.showStaffModal = false;
          this.editingStaffId = null;
          this.staffForm.reset({ role: 'Teacher', password: 'password123' });
          this.loadAdminDashboard();
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
          this.loadAdminDashboard();
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
    this.pricingForm.reset({
      studentId: studentId,
      teacherId: teacherId || '',
      subject: 'القرآن الكريم والتجويد',
      hourlyRate: 15,
      currency: 'USD',
      teacherRate: 200,
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

  getDayLabelAr(day: string): string {
    const map: Record<string, string> = {
      Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء',
      Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت'
    };
    return map[day] || day;
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


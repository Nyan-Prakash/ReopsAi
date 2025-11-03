/**
 * i18n Translation System
 * Aligned with SPEC §5.5
 */

export type Locale = 'en' | 'ar';

export const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.kb': 'Knowledge Base',
    'nav.catalog': 'Service Catalog',
    'nav.chat': 'Chat',
    'nav.myRequests': 'My Requests',
    'nav.language': 'Language',

    // Search
    'search.placeholder': 'Search for help...',
    'search.noResults': 'No results found',
    'search.results': '{count} results found',
    'search.searching': 'Searching...',

    // Home/Landing
    'home.hero.title': 'How can we help you?',
    'home.hero.subtitle': 'Search our knowledge base or browse services',
    'home.featured.title': 'Popular Articles',
    'home.quickLinks.title': 'Quick Links',
    'home.announcements.title': 'Announcements',

    // Knowledge Base
    'kb.title': 'Knowledge Base',
    'kb.browse': 'Browse Articles',
    'kb.filters.category': 'Category',
    'kb.filters.department': 'Department',
    'kb.filters.clear': 'Clear Filters',
    'kb.sort.relevance': 'Relevance',
    'kb.sort.date': 'Date',
    'kb.sort.views': 'Views',
    'kb.pagination.showing': 'Showing {start}-{end} of {total}',
    'kb.pagination.page': 'Page {page} of {pages}',

    // Article
    'article.breadcrumb.home': 'Home',
    'article.breadcrumb.kb': 'Knowledge Base',
    'article.helpful.title': 'Was this helpful?',
    'article.helpful.yes': 'Yes',
    'article.helpful.no': 'No',
    'article.helpful.thanks': 'Thank you for your feedback!',
    'article.related.title': 'Related Articles',
    'article.stillNeedHelp': 'Still need help?',
    'article.contactSupport': 'Contact Support',
    'article.views': '{count} views',
    'article.updated': 'Updated {date}',

    // Service Catalog
    'catalog.title': 'Service Catalog',
    'catalog.subtitle': 'Browse services by department',
    'catalog.dept.admissions': 'Admissions',
    'catalog.dept.finance': 'Finance',
    'catalog.dept.registrar': 'Registrar',
    'catalog.dept.it': 'IT Support',
    'catalog.dept.student_affairs': 'Student Affairs',
    'catalog.dept.other': 'Other',
    'catalog.service.requestTime': 'Est. Response: {time}',
    'catalog.service.request': 'Submit Request',

    // Request Form
    'form.name': 'Full Name',
    'form.name.placeholder': 'Enter your full name',
    'form.email': 'Email Address',
    'form.email.placeholder': 'your.email@example.com',
    'form.studentId': 'Student ID',
    'form.studentId.placeholder': 'S2024-0001',
    'form.department': 'Department',
    'form.service': 'Service',
    'form.description': 'Description',
    'form.description.placeholder': 'Please describe your request in detail...',
    'form.attachments': 'Attachments',
    'form.attachments.hint': 'Max 3 files, 10MB each',
    'form.consent': 'I agree to the terms and conditions',
    'form.submit': 'Submit Request',
    'form.submitting': 'Submitting...',
    'form.cancel': 'Cancel',
    'form.required': 'Required field',
    'form.invalid.email': 'Invalid email address',
    'form.invalid.studentId': 'Format: S2024-0001',
    'form.invalid.minLength': 'Minimum {min} characters required',
    'form.invalid.maxLength': 'Maximum {max} characters allowed',
    'form.invalid.maxFiles': 'Maximum {max} files allowed',

    // Request Status
    'request.title': 'Request Status',
    'request.ticketNumber': 'Ticket #{number}',
    'request.status.submitted': 'Submitted',
    'request.status.open': 'Open',
    'request.status.inProgress': 'In Progress',
    'request.status.pending': 'Pending',
    'request.status.resolved': 'Resolved',
    'request.status.closed': 'Closed',
    'request.timeline.title': 'Timeline',
    'request.details.title': 'Request Details',
    'request.reopen': 'Reopen Request',
    'request.reopen.confirm': 'Are you sure you want to reopen this request?',
    'request.reopen.success': 'Request reopened successfully',
    'request.cannotReopen': 'This request cannot be reopened (resolved more than 7 days ago)',

    // Chat
    'chat.title': 'Student Assistant',
    'chat.comingSoon': 'Chat assistant coming soon',
    'chat.disclaimer': 'For immediate help, visit our Knowledge Base or Service Catalog',
    'chat.escalate': 'Create Ticket Instead',
    'chat.escalated': 'Escalated from chat',

    // Success/Error Messages
    'success.submitted': 'Request submitted successfully!',
    'success.feedback': 'Thank you for your feedback',
    'error.network': 'Network error. Please try again.',
    'error.unknown': 'An error occurred. Please try again.',
    'error.notFound': 'Page not found',
    'error.serverError': 'Server error. Please try again later.',

    // Common
    'common.loading': 'Loading...',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.viewAll': 'View All',

    // Inbox
    'inbox.title': 'Inbox',
    'inbox.search.placeholder': 'Search cases...',
    'inbox.filter.department': 'Department',
    'inbox.filter.status': 'Status',
    'inbox.filter.priority': 'Priority',
    'inbox.filter.sla': 'SLA Risk',
    'inbox.filter.channel': 'Channel',
    'inbox.filter.tags': 'Tags',
    'inbox.filter.owner': 'Owner',
    'inbox.filter.dateRange': 'Date Range',
    'inbox.filter.clear': 'Clear Filters',
    'inbox.view.new': 'New View',
    'inbox.view.save': 'Save Current View',
    'inbox.view.delete': 'Delete View',
    'inbox.view.setDefault': 'Set as Default',
    'inbox.bulk.selected': '{count} selected',
    'inbox.bulk.assign': 'Assign',
    'inbox.bulk.setStatus': 'Set Status',
    'inbox.bulk.setPriority': 'Set Priority',
    'inbox.bulk.addTag': 'Add Tag',
    'inbox.bulk.merge': 'Merge Cases',
    'inbox.bulk.split': 'Split Thread',
    'inbox.bulk.requestInfo': 'Request Missing Info',
    'inbox.table.dept': 'Dept',
    'inbox.table.subject': 'Subject',
    'inbox.table.student': 'Student',
    'inbox.table.priority': 'Priority',
    'inbox.table.slaDue': 'SLA Due',
    'inbox.table.status': 'Status',
    'inbox.table.assignee': 'Assignee',
    'inbox.table.updated': 'Updated',
    'inbox.table.selectCase': 'Select case {ticketNumber}',
    'inbox.empty.title': 'No cases found',
    'inbox.empty.description': 'Try adjusting your filters or search terms.',
    'inbox.empty.clearFilters': 'Clear Filters',
    'inbox.empty.inbox.title': 'Your inbox is empty',
    'inbox.empty.inbox.description': 'New cases will appear here when assigned to you or your queues.',
    'inbox.error.title': 'Failed to load cases',
    'inbox.error.retry': 'Retry',
    'inbox.sla.overdue': 'OVERDUE',
    'inbox.sla.atRisk': 'At Risk',
    'inbox.sla.tooltip.firstResponse': 'First Response Due: {date}',
    'inbox.sla.tooltip.resolution': 'Resolution Due: {date}',
    'inbox.sla.tooltip.policy': 'Policy: {policy}',
    'inbox.sla.tooltip.risk': 'Risk: {risk} ({percent}% elapsed)',
    'inbox.pagination.showing': 'Showing {start}-{end} of {total}',
    'inbox.keyboard.help': 'Keyboard Shortcuts',
    'inbox.merge.title': 'Merge Cases',
    'inbox.merge.selectPrimary': 'Select Source of Truth',
    'inbox.merge.preview': 'Preview Timeline',
    'inbox.merge.confirm': 'Confirm Merge',
    'inbox.merge.success': '{count} cases merged successfully',
    'inbox.merge.undo': 'Undo',
    'inbox.split.title': 'Split Thread',
    'inbox.split.selectMessages': 'Select message range to split',
    'inbox.split.confirm': 'Confirm Split',
    'inbox.owner.all': 'All',
    'inbox.owner.me': 'Me',
    'inbox.owner.unassigned': 'Unassigned',
    'inbox.view.edit': 'Edit View',
    'inbox.view.unsetDefault': 'Unset as Default',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.kb': 'قاعدة المعرفة',
    'nav.catalog': 'كتالوج الخدمات',
    'nav.chat': 'المحادثة',
    'nav.myRequests': 'طلباتي',
    'nav.language': 'اللغة',

    // Search
    'search.placeholder': 'ابحث عن مساعدة...',
    'search.noResults': 'لا توجد نتائج',
    'search.results': 'تم العثور على {count} نتيجة',
    'search.searching': 'جاري البحث...',

    // Home/Landing
    'home.hero.title': 'كيف يمكننا مساعدتك؟',
    'home.hero.subtitle': 'ابحث في قاعدة المعرفة أو تصفح الخدمات',
    'home.featured.title': 'المقالات الشائعة',
    'home.quickLinks.title': 'روابط سريعة',
    'home.announcements.title': 'الإعلانات',

    // Knowledge Base
    'kb.title': 'قاعدة المعرفة',
    'kb.browse': 'تصفح المقالات',
    'kb.filters.category': 'التصنيف',
    'kb.filters.department': 'القسم',
    'kb.filters.clear': 'مسح الفلاتر',
    'kb.sort.relevance': 'الصلة',
    'kb.sort.date': 'التاريخ',
    'kb.sort.views': 'المشاهدات',
    'kb.pagination.showing': 'عرض {start}-{end} من {total}',
    'kb.pagination.page': 'صفحة {page} من {pages}',

    // Article
    'article.breadcrumb.home': 'الرئيسية',
    'article.breadcrumb.kb': 'قاعدة المعرفة',
    'article.helpful.title': 'هل كان هذا مفيداً؟',
    'article.helpful.yes': 'نعم',
    'article.helpful.no': 'لا',
    'article.helpful.thanks': 'شكراً لملاحظاتك!',
    'article.related.title': 'مقالات ذات صلة',
    'article.stillNeedHelp': 'لا تزال بحاجة إلى مساعدة؟',
    'article.contactSupport': 'اتصل بالدعم',
    'article.views': '{count} مشاهدة',
    'article.updated': 'آخر تحديث {date}',

    // Service Catalog
    'catalog.title': 'كتالوج الخدمات',
    'catalog.subtitle': 'تصفح الخدمات حسب القسم',
    'catalog.dept.admissions': 'القبول',
    'catalog.dept.finance': 'المالية',
    'catalog.dept.registrar': 'المسجل',
    'catalog.dept.it': 'الدعم التقني',
    'catalog.dept.student_affairs': 'شؤون الطلاب',
    'catalog.dept.other': 'أخرى',
    'catalog.service.requestTime': 'وقت الاستجابة: {time}',
    'catalog.service.request': 'إرسال طلب',

    // Request Form
    'form.name': 'الاسم الكامل',
    'form.name.placeholder': 'أدخل اسمك الكامل',
    'form.email': 'عنوان البريد الإلكتروني',
    'form.email.placeholder': 'your.email@example.com',
    'form.studentId': 'الرقم الجامعي',
    'form.studentId.placeholder': 'S2024-0001',
    'form.department': 'القسم',
    'form.service': 'الخدمة',
    'form.description': 'الوصف',
    'form.description.placeholder': 'يرجى وصف طلبك بالتفصيل...',
    'form.attachments': 'المرفقات',
    'form.attachments.hint': 'حد أقصى 3 ملفات، 10 ميجابايت لكل منها',
    'form.consent': 'أوافق على الشروط والأحكام',
    'form.submit': 'إرسال الطلب',
    'form.submitting': 'جاري الإرسال...',
    'form.cancel': 'إلغاء',
    'form.required': 'حقل مطلوب',
    'form.invalid.email': 'عنوان بريد إلكتروني غير صالح',
    'form.invalid.studentId': 'التنسيق: S2024-0001',
    'form.invalid.minLength': 'الحد الأدنى {min} أحرف مطلوب',
    'form.invalid.maxLength': 'الحد الأقصى {max} حرف مسموح',
    'form.invalid.maxFiles': 'الحد الأقصى {max} ملفات مسموح',

    // Request Status
    'request.title': 'حالة الطلب',
    'request.ticketNumber': 'تذكرة #{number}',
    'request.status.submitted': 'تم الإرسال',
    'request.status.open': 'مفتوح',
    'request.status.inProgress': 'قيد المعالجة',
    'request.status.pending': 'معلق',
    'request.status.resolved': 'تم الحل',
    'request.status.closed': 'مغلق',
    'request.timeline.title': 'الجدول الزمني',
    'request.details.title': 'تفاصيل الطلب',
    'request.reopen': 'إعادة فتح الطلب',
    'request.reopen.confirm': 'هل أنت متأكد من رغبتك في إعادة فتح هذا الطلب؟',
    'request.reopen.success': 'تم إعادة فتح الطلب بنجاح',
    'request.cannotReopen': 'لا يمكن إعادة فتح هذا الطلب (تم حله منذ أكثر من 7 أيام)',

    // Chat
    'chat.title': 'مساعد الطالب',
    'chat.comingSoon': 'مساعد المحادثة قريباً',
    'chat.disclaimer': 'للمساعدة الفورية، تفضل بزيارة قاعدة المعرفة أو كتالوج الخدمات',
    'chat.escalate': 'إنشاء تذكرة بدلاً من ذلك',
    'chat.escalated': 'تم التصعيد من المحادثة',

    // Success/Error Messages
    'success.submitted': 'تم إرسال الطلب بنجاح!',
    'success.feedback': 'شكراً لملاحظاتك',
    'error.network': 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.',
    'error.unknown': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'error.notFound': 'الصفحة غير موجودة',
    'error.serverError': 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.viewAll': 'عرض الكل',

    // Inbox
    'inbox.title': 'صندوق الوارد',
    'inbox.search.placeholder': 'البحث في الحالات...',
    'inbox.filter.department': 'القسم',
    'inbox.filter.status': 'الحالة',
    'inbox.filter.priority': 'الأولوية',
    'inbox.filter.sla': 'مخاطر اتفاقية مستوى الخدمة',
    'inbox.filter.channel': 'القناة',
    'inbox.filter.tags': 'الوسوم',
    'inbox.filter.owner': 'المالك',
    'inbox.filter.dateRange': 'نطاق التاريخ',
    'inbox.filter.clear': 'مسح الفلاتر',
    'inbox.view.new': 'عرض جديد',
    'inbox.view.save': 'حفظ العرض الحالي',
    'inbox.view.delete': 'حذف العرض',
    'inbox.view.setDefault': 'تعيين كافتراضي',
    'inbox.bulk.selected': '{count} محدد',
    'inbox.bulk.assign': 'تعيين',
    'inbox.bulk.setStatus': 'تعيين الحالة',
    'inbox.bulk.setPriority': 'تعيين الأولوية',
    'inbox.bulk.addTag': 'إضافة وسم',
    'inbox.bulk.merge': 'دمج الحالات',
    'inbox.bulk.split': 'تقسيم الموضوع',
    'inbox.bulk.requestInfo': 'طلب معلومات مفقودة',
    'inbox.table.dept': 'القسم',
    'inbox.table.subject': 'الموضوع',
    'inbox.table.student': 'الطالب',
    'inbox.table.priority': 'الأولوية',
    'inbox.table.slaDue': 'موعد الاستحقاق',
    'inbox.table.status': 'الحالة',
    'inbox.table.assignee': 'المعين',
    'inbox.table.updated': 'التحديث',
    'inbox.table.selectCase': 'تحديد الحالة {ticketNumber}',
    'inbox.empty.title': 'لم يتم العثور على حالات',
    'inbox.empty.description': 'حاول تعديل الفلاتر أو مصطلحات البحث.',
    'inbox.empty.clearFilters': 'مسح الفلاتر',
    'inbox.empty.inbox.title': 'صندوق الوارد فارغ',
    'inbox.empty.inbox.description': 'ستظهر الحالات الجديدة هنا عند تعيينها لك أو لقوائم الانتظار الخاصة بك.',
    'inbox.error.title': 'فشل تحميل الحالات',
    'inbox.error.retry': 'إعادة المحاولة',
    'inbox.sla.overdue': 'متأخر',
    'inbox.sla.atRisk': 'في خطر',
    'inbox.sla.tooltip.firstResponse': 'الاستجابة الأولى: {date}',
    'inbox.sla.tooltip.resolution': 'الحل المستحق: {date}',
    'inbox.sla.tooltip.policy': 'السياسة: {policy}',
    'inbox.sla.tooltip.risk': 'الخطر: {risk} ({percent}٪ منقضي)',
    'inbox.pagination.showing': 'عرض {start}-{end} من {total}',
    'inbox.keyboard.help': 'اختصارات لوحة المفاتيح',
    'inbox.merge.title': 'دمج الحالات',
    'inbox.merge.selectPrimary': 'اختر مصدر الحقيقة',
    'inbox.merge.preview': 'معاينة الجدول الزمني',
    'inbox.merge.confirm': 'تأكيد الدمج',
    'inbox.merge.success': 'تم دمج {count} حالة بنجاح',
    'inbox.merge.undo': 'تراجع',
    'inbox.split.title': 'تقسيم الموضوع',
    'inbox.split.selectMessages': 'حدد نطاق الرسائل للتقسيم',
    'inbox.split.confirm': 'تأكيد التقسيم',
    'inbox.owner.all': 'الكل',
    'inbox.owner.me': 'أنا',
    'inbox.owner.unassigned': 'غير معين',
    'inbox.view.edit': 'تعديل العرض',
    'inbox.view.unsetDefault': 'إلغاء التعيين كافتراضي',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

/**
 * Get translation for a key
 */
export function t(key: TranslationKey, locale: Locale = 'en', params?: Record<string, string | number>): string {
  let text: string = translations[locale][key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }

  return text;
}

/**
 * Hook to use translations with locale context
 */
export function useTranslation(locale: Locale = 'en') {
  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, locale, params),
    locale,
  };
}

/**
 * Get direction for locale
 */
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

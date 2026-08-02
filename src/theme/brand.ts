// FILE: src/theme/brand.ts
// Single source of truth for brand + UI copy. All shipped strings live here.

const BRAND = {
  appName: 'JobMesh',
  tagline: 'Tech jobs in India — without the fluff',
  fullName: 'JobMesh',
  description: 'Fresh tech jobs from top Indian companies, updated daily. Direct apply links, no middlemen.',
  twitter: '',
  contact: '/legal',
} as const;

const BRAND_SPLIT = { first: 'Job', accent: 'Mesh' } as const;

const SKETCH_FONT = "'Source Serif 4', 'Iowan Old Style', Georgia, ui-serif, serif";

const PALETTE = {
  primary: '#2D6A4F',
  primarySoft: 'rgba(45,106,79,0.10)',
  success: '#0F7B5A',
  danger: '#C5380F',
  warning: '#B66B0A',
  info: '#0A6CC7',
} as const;

const COPY = {
  nav: {
    today: 'Today',
    companies: 'Companies',
    browseJobs: 'Jobs',
    myProgress: 'Progress',
    hiring: 'Hiring',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
  },
  home: {
    heroLabel: 'Tech jobs in India — without the fluff',
    heroTitle1: 'Find your next',
    heroTitle2: 'tech role in India',
    heroSubtitle: 'Fresh roles from top Indian tech companies, updated daily. Direct apply links, no middlemen.',
    heroCTA: 'Browse jobs',
    heroSecondaryCTA: 'View companies',
    stat1Value: '50+',
    stat1Label: 'Companies',
    stat2Value: 'Daily',
    stat2Label: 'Fresh updates',
    companiesSectionLabel: 'Hiring now',
    companiesSectionTitle1: 'Top companies in',
    companiesSectionTitle2: 'India',
    scrollLeft: 'Scroll left',
    scrollRight: 'Scroll right',
    fullDirectory: 'Full directory',
    jobsSectionLabel: 'Fresh picks',
    jobsSectionTitle: 'Latest opportunities',
    viewAll: 'View all',
    loadMore: 'Load more',

    // ── Guest landing page ──────────────────────────────────────────
    // Section 1 — ticker. `newRolesToday` is used when at least one role landed
    // in the last 24h; `rolesAddedDaily` is the evergreen zero-state fallback.
    newRolesToday: 'new roles added today',
    tickerDaily: 'Roles added daily',
    tickerHiring: 'are hiring',
    tickerActivePrefix: 'active positions across',
    tickerCompaniesSuffix: 'companies',
    tickerSuffix: 'No account needed to apply',

    // Section 2 — hero
    rolesAddedToday: 'roles added today',
    rolesAddedDaily: 'New roles daily',
    heroHeadPrefix: 'Find your next',
    heroHeadAccent: 'tech role',
    heroHeadSuffix: 'in India',
    heroSubtitleBase:
      'Fresh roles from top Indian tech companies, updated daily. Direct apply links, no middlemen',
    noAccountRequired: 'no account required',
    searchPlaceholder: 'Job title, skill, or company…',
    searchAriaLabel: 'Search tech jobs',
    searchButton: 'Search',
    locationDefault: 'All India',
    locationAriaLabel: 'Change location — currently all of India',
    quickFiltersLabel: 'Try',
    quickFilters: ['React', 'Python', 'Data analyst', 'Remote', 'Fresher / Entry', 'DevOps', 'Backend'],

    // Section 3 — trust metrics
    trustHeading: 'JobMesh at a glance',
    metricRolesLabel: 'Active roles',
    metricCompaniesLabel: 'Companies',
    metricFreshValue: 'Daily',
    metricFreshLabel: 'Fresh updates',
    metricDirectValue: 'Direct',
    metricDirectLabel: 'Apply links',

    // Section 4 — logo strip
    logoStripLabel: 'Trusted by teams at',

    // Section 5 — how it works
    howItWorksLabel: 'How it works',
    step1Title: 'Browse or search',
    step1Desc: 'Filter by skill, location, experience, or company. No signup wall.',
    step2Title: 'Read the details',
    step2Desc: 'Full job description, salary when listed, workplace type and department.',
    step3Title: 'Apply directly',
    step3Desc: "Every link goes to the company's career page. No middlemen, ever.",

    // Sections 6 + 7 — headings and the feed's trailing CTA
    companiesHeading: 'Top companies',
    jobsHeading: 'Latest opportunities',
    openRole: 'open role',
    openRoles: 'open roles',
    browseAllPrefix: 'Browse all',
    browseAllSuffix: 'roles',

    // Section 8 — employer cross-sell
    employerCTATitle: 'Hiring for your team?',
    employerCTASubtitle: 'Post jobs, manage applicants, and schedule interviews — free.',
    employerCTAButton: 'Employer portal',
  },
  jobs: {
    pageLabel: 'Opportunities',
    pageTitle: 'All tech jobs',
    rolesAvailable: 'roles available',
    noJobsTitle: 'No jobs found',
    noJobsBody: 'Try a different company or view all roles.',
    noEntryJobsBody: 'No entry-level roles found. Try turning off the fresher filter.',
    clearFilters: 'Clear filters',
    allJobs: 'All jobs',
    allCompanies: 'All companies',
    experienceLabel: 'Experience',
    companiesLabel: 'Companies',
    entryLevel: 'Entry level / Fresher',
    allLevels: 'All experience levels',
    applyNow: 'Apply now',
    readMore: 'Read more',
    showLess: 'Show less',
    postedPrefix: 'Posted',
    postedNA: 'No date',
    feedTitle: 'Job feed',
    rolesLabel: 'roles',
    filterLabel: 'Filter',
  },
  progress: {
    pageLabel: 'Tracking',
    pageTitle: 'My progress',
    backToJobs: 'Back to jobs',
    todayLabel: 'Today',
    noStreak: 'No streak yet',
    historyLabel: 'Recent applications',
    historySubtitle: 'Your latest applied jobs, useful for follow-ups and interview prep.',
    emptyTitle: 'No applications tracked yet',
    emptyBody: 'Start applying from the jobs feed and your recent history will appear here.',
  },
  directory: {
    pageLabel: 'Company directory',
    pageTitle1: 'Tech companies',
    pageTitle2: 'hiring in India',
    subtitle: 'Companies actively hiring across India — updated daily.',
    searchPlaceholder: 'Search companies…',
    searchAriaLabel: 'Search companies',
    sortAriaLabel: 'Sort companies',
    noCompaniesTitle: 'No companies found',
    noCompaniesBody: 'Try a different search term or clear your filters.',
    sortAZ: 'A → Z',
    sortZA: 'Z → A',
    sortMostHiring: 'Most hiring',
    documentTitle: 'Tech companies hiring in India · JobMesh',
  },
  footer: {
    navigateTitle: 'Navigate',
    jobFeedLink: 'Job feed',
    companiesLink: 'Companies',
    legalTitle: 'Legal',
    legalInfoLink: 'Legal info',
    privacyLink: 'Privacy',
    contactLink: 'Contact',
    disclaimer: 'A non-commercial aggregator. Job details are collected automatically — verify directly with employers.',
  },
  legal: {
    pageLabel: 'Legal',
    pageTitle: 'Legal information',
    lastUpdated: 'Last updated: March 2026',
    contactTitle: 'Contact',
    contactBody: 'For questions, data deletion requests, or legal enquiries, reach out at layer3studios.team@gmail.com.',
    sections: [],
  },
  site: {
    documentTitleJobs: 'Browse tech jobs in India · JobMesh',
    documentTitleProgress: 'My progress · JobMesh',
  },
  trends: {
    pageLabel: 'Market signal',
    pageTitle: 'Hiring trends in',
    pageTitleAccent: 'India',
    subtitle: 'How tech hiring is moving — posting momentum, role demand, and who is ramping up.',
    shareButtonLabel: 'Share',
    shareTitle: 'Hiring trends in India · JobMesh',
    documentTitle: 'Hiring trends in India · JobMesh',
    errorTitle: "Couldn't load trends",
    errorBody: 'Something went wrong. Try refreshing.',
    emptyTitle: 'Not enough data yet',
    emptyBody: 'Trend signals will appear here as more roles come in.',
    updatedPrefix: 'Updated',
    summaryTotalRoles: 'Open roles',
    summaryNewThisWeek: 'New this week',
    summaryMomentum: 'Week over week',
    summaryCompanies: 'Companies tracked',
    momentumTitle: 'Posting momentum',
    momentumSub: 'New roles added per day over the last 60 days',
    categoriesTitle: 'Role demand',
    categoriesSub: 'Share of open roles by category, with week-over-week shift',
    splitExperienceTitle: 'By experience',
    splitWorkplaceTitle: 'By workplace',
    moversTitle: 'Movers this week',
    moversGaining: 'Ramping up',
    moversCooling: 'Slowing down',
  },
} as const;

export { BRAND, BRAND_SPLIT, SKETCH_FONT, PALETTE, COPY };

export default { BRAND, BRAND_SPLIT, SKETCH_FONT, PALETTE, COPY };

/**
 * English locale
 */
export default {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    clear: 'Clear',
    refresh: 'Refresh',
    loading: 'Loading...',
    noData: 'No data',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    all: 'All',
    done: 'Done'
  },

  // Navigation
  nav: {
    overview: 'Overview',
    calendar: 'Calendar',
    reports: 'Reports',
    newEntry: 'New Entry',
    settings: 'Settings'
  },

  // App info
  app: {
    name: 'Qingzhang',
    subtitle: 'Finance Tracker',
    description: 'A cross-platform personal finance management app built with Vue 3 + Tauri.',
    version: 'Version'
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    currentBalance: 'Current Balance',
    monthlyIncome: 'Monthly Income',
    monthlySpending: 'Monthly Spending',
    monthlyTransactions: 'Monthly Transactions',
    noTransactions: 'No transactions this month'
  },

  // Entry
  entry: {
    title: 'New Entry',
    subtitle: 'Add a new transaction',
    expense: 'Expense',
    income: 'Income',
    amount: 'Amount',
    category: 'Category',
    description: 'Description',
    descriptionPlaceholder: 'Add note...',
    date: 'Date',
    save: 'Save',
    manageCategories: 'Manage Categories',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    categoryName: 'Category name',
    selectIcon: 'Select icon',
    quickTags: 'Quick tags',
    exchangeRate: 'Exchange rate',
    convertedAmount: 'Converted amount'
  },

  // Calendar
  calendar: {
    title: 'Calendar',
    today: 'Today',
    income: 'Income',
    expense: 'Expense',
    noTransactions: 'No transactions on this day'
  },

  // Reports
  reports: {
    title: 'Statistical Report',
    month: 'Month',
    year: 'Year',
    expense: 'Expense',
    income: 'Income',
    balance: 'Balance',
    avgDailyExpense: 'Avg. Daily Expense',
    dailyStatistics: 'Daily Statistics',
    monthlyStatistics: 'Monthly Statistics',
    categorizedReport: 'Categorized Report',
    dailyReport: 'Daily Report',
    monthlyReport: 'Monthly Report',
    vsLast: 'vs last',
    surplus: 'Surplus',
    needsAttention: 'Needs attention',
    steadySpending: 'Steady spending',
    incomeLogged: 'Income logged',
    noIncomeLogged: 'No income logged'
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Customize your app experience',
    
    // Appearance
    appearance: 'Appearance',
    themeColor: 'Theme Color',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Language
    language: 'Language',
    languageDesc: 'App display language',
    english: 'English',
    chinese: '中文',
    
    // Currency
    currency: 'Currency',
    primaryCurrency: 'Primary Currency',
    primaryCurrencyDesc: 'All transactions will be converted to this currency for reports',
    exchangeRates: 'Exchange Rates',
    exchangeRatesDesc: 'Powered by Frankfurter API (ECB rates)',
    lastUpdated: 'Last Updated',
    lastUpdatedDesc: 'Exchange rate data timestamp',
    notUpdated: 'Not updated',
    updating: 'Updating...',
    updated: 'Updated',
    recalculateTransactions: 'Recalculate Transactions',
    recalculateDesc: 'Update all amounts using historical exchange rates',
    recalculate: 'Recalculate',
    processing: 'Processing...',
    recalculateDialog: {
      title: 'Recalculate Transactions?',
      content: 'You\'ve changed your primary currency from {old} to {new}. Would you like to recalculate all transaction amounts using historical exchange rates? This ensures accurate reports based on the exchange rate at the time of each transaction.',
      confirm: 'Recalculate',
      skip: 'Skip',
      skipMessage: 'You can recalculate later using the button below'
    },
    
    // General
    general: 'General',
    
    // Data
    data: 'Data',
    exportData: 'Export Data',
    exportDesc: 'Download your transaction history',
    importData: 'Import Data',
    importDesc: 'Import from JSON or CSV file',
    import: 'Import',
    
    // Cloud sync
    cloudSync: 'Cloud Sync (WebDAV)',
    serviceProvider: 'Service Provider',
    serviceProviderDesc: 'Select your WebDAV provider or use custom',
    jianguoyun: 'Jianguoyun',
    nextcloud: 'Nextcloud',
    owncloud: 'ownCloud',
    custom: 'Custom',
    serverUrl: 'Server URL',
    serverUrlDesc: 'WebDAV server address',
    username: 'Username',
    usernameDesc: 'Your account username',
    password: 'Password',
    passwordDesc: 'App-specific password recommended',
    remotePath: 'Remote Path',
    remotePathDesc: 'Folder path on server',
    configuration: 'Configuration',
    configurationDesc: 'Test connection and save settings',
    test: 'Test',
    clearConfig: 'Clear WebDAV Configuration',
    clearConfigContent: 'This will remove all WebDAV settings. Continue?',
    configCleared: 'Configuration cleared',
    syncActions: 'Sync Actions',
    lastSync: 'Last sync',
    neverSynced: 'Never synced',
    upload: 'Upload',
    download: 'Download',
    
    // Backup
    selectBackup: 'Select Backup to Restore',
    loadingBackups: 'Loading backup list...',
    noBackups: 'No backups found on server',
    selectBackupLabel: 'Select backup',
    restoreMode: 'Restore Mode',
    mergeMode: 'Merge',
    mergeModeDesc: 'Add new records to existing data',
    overwriteMode: 'Overwrite',
    overwriteModeDesc: 'Replace all existing data',
    restore: 'Restore',
    overwriteDialog: {
      title: 'Overwrite Data',
      content: 'This will replace all your current data with {transactions} transactions and {categories} categories. Continue?',
      confirm: 'Overwrite'
    },
    mergeDialog: {
      title: 'Merge Data',
      content: 'Found {transactions} transactions and {categories} categories. New records will be added to your existing data.',
      confirm: 'Merge'
    },
    deleteBackup: 'Delete Backup',
    deleteBackupContent: 'Are you sure you want to delete this backup?',
    
    // About
    about: 'About'
  },

  // Months
  months: {
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec'
  },

  // Chart
  chart: {
    thisWeek: 'This Week',
    last7Days: 'Last 7 Days',
    last15Days: 'Last 15 Days',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    date: 'Date',
    month: 'Month'
  },

  // Theme names
  themes: {
    defaultGreen: 'Default Green',
    oceanBlue: 'Ocean Blue',
    sunsetOrange: 'Sunset Orange',
    forestGreen: 'Forest Green',
    lavenderPurple: 'Lavender Purple'
  },

  // Transaction
  transaction: {
    edit: 'Edit Transaction',
    type: 'Type',
    enterAmount: 'Enter amount',
    enterDescription: 'Enter description',
    fetchRate: 'Fetch latest rate',
    saveChanges: 'Save Changes',
    deleteTitle: 'Delete Transaction',
    deleteConfirm: 'Are you sure you want to delete "{name}"?',
    noTransactions: 'No transactions'
  },

  // Messages
  messages: {
    saveSuccess: 'Saved successfully',
    saveFailed: 'Failed to save',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    importSuccess: 'Imported {count} records',
    importFailed: 'Import failed',
    exportSuccess: 'Export successful',
    exportFailed: 'Export failed',
    connectionSuccess: 'Connection successful',
    connectionFailed: 'Connection failed',
    uploadSuccess: 'Upload successful',
    uploadFailed: 'Upload failed',
    downloadSuccess: 'Download successful',
    downloadFailed: 'Download failed',
    configSaved: 'WebDAV configuration saved',
    fillRequired: 'Please fill in required fields',
    unsupportedFormat: 'Unsupported file format. Please use .json or .csv files.',
    updated: 'Updated successfully',
    updateFailed: 'Update failed',
    enterValidAmount: 'Please enter a valid amount',
    selectCategory: 'Please select a category'
  }
}

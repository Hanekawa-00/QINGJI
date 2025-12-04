/**
 * 简体中文语言包
 */
export default {
  // 通用
  common: {
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    confirm: '确认',
    clear: '清除',
    refresh: '刷新',
    loading: '加载中...',
    noData: '暂无数据',
    success: '成功',
    error: '错误',
    warning: '警告',
    all: '全部',
    done: '完成'
  },

  // 导航
  nav: {
    overview: '概览',
    calendar: '日历',
    reports: '报表',
    newEntry: '记一笔',
    settings: '设置'
  },

  // 应用信息
  app: {
    name: '青账',
    subtitle: '个人记账',
    description: '跨平台个人财务管理应用，基于 Vue 3 + Tauri 构建。',
    version: '版本'
  },

  // 仪表盘
  dashboard: {
    title: '仪表盘',
    currentBalance: '当前余额',
    monthlyIncome: '本月收入',
    monthlySpending: '本月支出',
    monthlyTransactions: '本月交易',
    noTransactions: '本月暂无交易记录'
  },

  // 记账
  entry: {
    title: '记一笔',
    subtitle: '添加新交易',
    expense: '支出',
    income: '收入',
    amount: '金额',
    category: '分类',
    description: '备注',
    descriptionPlaceholder: '添加备注...',
    date: '日期',
    save: '保存',
    manageCategories: '管理分类',
    addCategory: '添加分类',
    editCategory: '编辑分类',
    categoryName: '分类名称',
    selectIcon: '选择图标',
    quickTags: '快捷标签',
    exchangeRate: '汇率',
    convertedAmount: '换算金额'
  },

  // 日历
  calendar: {
    title: '日历',
    today: '今天',
    income: '收入',
    expense: '支出',
    noTransactions: '当日无交易记录'
  },

  // 报表
  reports: {
    title: '统计报表',
    month: '月',
    year: '年',
    expense: '支出',
    income: '收入',
    balance: '结余',
    avgDailyExpense: '日均支出',
    dailyStatistics: '每日统计',
    monthlyStatistics: '每月统计',
    categorizedReport: '分类报告',
    dailyReport: '每日报告',
    monthlyReport: '每月报告',
    vsLast: '相比上',
    surplus: '有结余',
    needsAttention: '需关注',
    steadySpending: '消费稳定',
    incomeLogged: '已记录收入',
    noIncomeLogged: '未记录收入'
  },

  // 设置
  settings: {
    title: '设置',
    subtitle: '自定义您的应用体验',
    
    // 外观
    appearance: '外观',
    themeColor: '主题色',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    
    // 语言
    language: '语言',
    languageDesc: '应用显示语言',
    english: 'English',
    chinese: '中文',
    
    // 币种
    currency: '货币',
    primaryCurrency: '主币种',
    primaryCurrencyDesc: '所有交易将换算为此币种进行统计',
    exchangeRates: '汇率',
    exchangeRatesDesc: '由 Frankfurter API 提供（欧洲央行汇率）',
    lastUpdated: '最后更新',
    lastUpdatedDesc: '汇率数据时间戳',
    notUpdated: '未更新',
    updating: '更新中...',
    updated: '已更新',
    recalculateTransactions: '重新计算交易',
    recalculateDesc: '使用历史汇率更新所有交易金额',
    recalculate: '重新计算',
    processing: '处理中...',
    recalculateDialog: {
      title: '重新计算交易？',
      content: '您已将主币种从 {old} 更改为 {new}。是否使用历史汇率重新计算所有交易金额？这可以确保报表基于每笔交易发生时的汇率进行准确统计。',
      confirm: '重新计算',
      skip: '跳过',
      skipMessage: '您可以稍后使用下方按钮重新计算'
    },
    
    // 通用
    general: '通用',
    
    // 数据
    data: '数据',
    exportData: '导出数据',
    exportDesc: '下载您的交易记录',
    importData: '导入数据',
    importDesc: '从 JSON 或 CSV 文件导入',
    import: '导入',
    importJSONTitle: '导入 JSON 数据',
    importCSVTitle: '导入 CSV 数据',
    
    // 云同步
    cloudSync: '云同步 (WebDAV)',
    serviceProvider: '服务商',
    serviceProviderDesc: '选择您的 WebDAV 服务商或使用自定义',
    jianguoyun: '坚果云',
    nextcloud: 'Nextcloud',
    owncloud: 'ownCloud',
    custom: '自定义',
    serverUrl: '服务器地址',
    serverUrlDesc: 'WebDAV 服务器地址',
    username: '用户名',
    usernameDesc: '您的账户用户名',
    password: '密码',
    passwordDesc: '建议使用应用专用密码',
    remotePath: '远程路径',
    remotePathDesc: '服务器上的文件夹路径',
    configuration: '配置',
    configurationDesc: '测试连接并保存设置',
    test: '测试',
    clearConfig: '清除 WebDAV 配置',
    clearConfigContent: '这将删除所有 WebDAV 设置。是否继续？',
    configCleared: '配置已清除',
    syncActions: '同步操作',
    lastSync: '上次同步',
    neverSynced: '从未同步',
    upload: '上传',
    download: '下载',
    
    // 备份
    selectBackup: '选择要恢复的备份',
    loadingBackups: '正在加载备份列表...',
    noBackups: '服务器上没有找到备份',
    selectBackupLabel: '选择备份',
    restoreMode: '恢复模式',
    mergeMode: '合并',
    mergeModeDesc: '将新记录添加到现有数据',
    overwriteMode: '覆盖',
    overwriteModeDesc: '替换所有现有数据',
    restore: '恢复',
    overwriteDialog: {
      title: '覆盖数据',
      content: '这将用 {transactions} 条交易记录和 {categories} 个分类替换您当前的所有数据。是否继续？',
      confirm: '覆盖'
    },
    mergeDialog: {
      title: '合并数据',
      content: '找到 {transactions} 条交易记录和 {categories} 个分类。新记录将添加到您现有的数据中。',
      confirm: '合并'
    },
    deleteBackup: '删除备份',
    deleteBackupContent: '确定要删除此备份吗？',
    
    // 关于
    about: '关于'
  },

  // 月份
  months: {
    jan: '1月',
    feb: '2月',
    mar: '3月',
    apr: '4月',
    may: '5月',
    jun: '6月',
    jul: '7月',
    aug: '8月',
    sep: '9月',
    oct: '10月',
    nov: '11月',
    dec: '12月'
  },

  // 图表
  chart: {
    thisWeek: '本周',
    last7Days: '近7天',
    last15Days: '近15天',
    sun: '日',
    mon: '一',
    tue: '二',
    wed: '三',
    thu: '四',
    fri: '五',
    sat: '六',
    date: '日期',
    month: '月份'
  },

  // 主题名称
  themes: {
    defaultGreen: '默认绿',
    oceanBlue: '海洋蓝',
    sunsetOrange: '日落橙',
    forestGreen: '森林绿',
    lavenderPurple: '薰衣草紫'
  },

  // 交易
  transaction: {
    edit: '编辑交易',
    type: '类型',
    enterAmount: '输入金额',
    enterDescription: '输入描述',
    fetchRate: '获取最新汇率',
    saveChanges: '保存修改',
    deleteTitle: '删除交易',
    deleteConfirm: '确定要删除 "{name}" 吗？',
    noTransactions: '暂无交易记录'
  },

  // 消息
  messages: {
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    importSuccess: '已导入 {count} 条记录',
    importFailed: '导入失败',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    connectionSuccess: '连接成功',
    connectionFailed: '连接失败',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    downloadSuccess: '下载成功',
    downloadFailed: '下载失败',
    configSaved: 'WebDAV 配置已保存',
    configCleared: '配置已清除',
    fillRequired: '请填写必填项',
    fillServerAndUsername: '请填写服务器地址和用户名',
    unsupportedFormat: '不支持的文件格式，请使用 .json 或 .csv 文件。',
    parseError: '无法解析导入文件，请检查文件格式。',
    updated: '更新成功',
    updateFailed: '更新失败',
    enterValidAmount: '请输入有效金额',
    selectCategory: '请选择分类',
    enterCategoryName: '请输入分类名称',
    categoryAdded: '分类已添加！',
    categoryNameEmpty: '分类名称不能为空',
    categoryUpdated: '分类已更新！',
    categoryDeleted: '分类已删除！',
    cannotDeleteCategory: '无法删除有交易记录的分类',
    // 导出/导入
    exportedTo: '已导出至：{path}',
    exportedTransactions: '已导出 {transactions} 条交易和 {categories} 个分类',
    exportedToCSV: '已导出 {count} 条交易到 CSV',
    // 重新计算
    recalculateSuccess: '已成功重新计算 {count} 条交易',
    recalculatePartial: '已重新计算 {success} 条交易，{fallback} 条使用了当前汇率（历史汇率不可用）',
    recalculateFailed: '已重新计算 {success} 条交易，{failed} 条失败',
    // 导入对话框
    importPreview: '发现 {transactions} 条交易和 {categories} 个分类。',
    importDateRange: '日期范围：{start} 至 {end}',
    importSkipExisting: '相同 ID 的数据将被跳过，是否继续？',
    importedResult: '已导入 {transactions} 条交易和 {categories} 个分类',
    importedWithSkip: '（跳过 {skipped} 条）',
    // CSV 导入
    csvPreview: '从 CSV 发现 {count} 条交易。',
    csvSkipped: '跳过了 {count} 行无效数据。',
    csvErrors: '遇到 {count} 个错误。',
    csvContinue: '是否继续导入？',
    csvImportResult: '已导入 {success} 条交易',
    csvDuplicatesSkipped: '，跳过 {count} 条重复',
    csvImportPartial: '，{failed} 条失败',
    csvImportFailed: 'CSV 导入失败：{error}',
    noValidTransactions: '未找到有效的交易记录',
    // WebDAV
    configureWebDAVFirst: '请先配置 WebDAV',
    noBackupsFound: '服务器上未找到备份文件',
    loadBackupsFailed: '加载备份列表失败',
    selectBackupFirst: '请选择一个备份',
    dataRestored: '数据已成功恢复',
    dataMerged: '数据已成功合并',
    restoreFailed: '恢复失败',
    backupDeleted: '备份已删除',
    backupDeleteFailed: '删除备份失败',
    testFailed: '连接测试失败'
  }
}

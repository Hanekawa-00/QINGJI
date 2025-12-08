/**
 * 组合式函数导出
 * 可跨平台复用（桌面端/移动端）
 */

// 格式化工具
export {
  formatCurrency,
  formatWithCurrency,
  formatDate,
  formatDateISO,
  formatTransactionAmount,
  getAmountColor,
  useFormatters,
  useCurrencyFormat
} from './useFormatters'

// 图表数据
export {
  useChartData,
  type ChartPeriod,
  type ChartDisplayType,
  type ChartBarData
} from './useChartData'

// 交易数据
export {
  useMonthlyTransactions,
  useGroupedTransactions,
  useTransactions,
  type GroupedTransactions
} from './useTransactions'

// 日历
export {
  useCalendar,
  type UseCalendarOptions
} from './useCalendar'

// 数字键盘/计算器
export {
  useKeypad,
  type UseKeypadOptions
} from './useKeypad'

// 期间导航
export {
  usePeriodNavigation,
  type UsePeriodNavigationOptions
} from './usePeriodNavigation'

// Android 返回手势
export { useAndroidBack } from './useAndroidBack'

/**
 * 图标配置
 * 使用 Google Material Symbols Outlined
 */

// 分类图标（按用途分组）
export const CATEGORY_ICONS = {
  // 餐饮
  food: [
    'restaurant', 'local_cafe', 'fastfood', 'local_bar', 
    'bakery_dining', 'ramen_dining', 'lunch_dining', 'local_dining',
    'coffee', 'icecream', 'liquor', 'set_meal'
  ],
  // 购物
  shopping: [
    'shopping_bag', 'shopping_cart', 'storefront', 'local_mall', 
    'redeem', 'checkroom', 'diamond', 'watch'
  ],
  // 交通
  transport: [
    'directions_car', 'directions_bus', 'directions_subway', 'local_taxi',
    'two_wheeler', 'flight', 'train', 'directions_bike',
    'electric_scooter', 'sailing', 'directions_boat', 'local_shipping'
  ],
  // 居住
  housing: [
    'home', 'apartment', 'house', 'cottage',
    'water_drop', 'bolt', 'local_gas_station', 'propane_tank',
    'cleaning_services', 'bed', 'chair', 'weekend'
  ],
  // 娱乐
  entertainment: [
    'sports_esports', 'movie', 'music_note', 'sports_soccer',
    'fitness_center', 'pool', 'casino', 'nightlife',
    'theaters', 'attractions', 'festival', 'stadium'
  ],
  // 生活服务
  lifestyle: [
    'pets', 'child_care', 'local_laundry_service', 'dry_cleaning',
    'spa', 'content_cut', 'face', 'self_improvement',
    'family_restroom', 'baby_changing_station'
  ],
  // 医疗健康
  health: [
    'medical_services', 'local_pharmacy', 'healing', 'vaccines',
    'monitor_heart', 'health_and_safety', 'medication', 'emergency',
    'local_hospital', 'psychology'
  ],
  // 教育学习
  education: [
    'school', 'menu_book', 'auto_stories', 'library_books',
    'science', 'biotech', 'calculate', 'translate',
    'history_edu', 'architecture'
  ],
  // 工作办公
  work: [
    'work', 'business_center', 'corporate_fare', 'meeting_room',
    'laptop', 'print', 'headphones', 'mic'
  ],
  // 财务金融
  finance: [
    'attach_money', 'savings', 'payments', 'credit_card',
    'account_balance', 'wallet', 'currency_exchange', 'paid',
    'price_check', 'request_quote', 'receipt', 'money'
  ],
  // 礼物社交
  social: [
    'card_giftcard', 'volunteer_activism', 'celebration', 'cake',
    'favorite', 'handshake', 'diversity_3', 'group'
  ],
  // 通讯
  communication: [
    'phone', 'smartphone', 'wifi', 'router',
    'email', 'chat', 'sms', 'call'
  ],
  // 其他
  other: [
    'more_horiz', 'category', 'receipt_long', 'local_atm',
    'label', 'bookmark', 'flag', 'star'
  ]
} as const

// 所有图标的扁平列表
export const ALL_CATEGORY_ICONS = Object.values(CATEGORY_ICONS).flat()

// 图标分组名称（中文）
export const ICON_GROUP_NAMES: Record<keyof typeof CATEGORY_ICONS, string> = {
  food: '餐饮',
  shopping: '购物',
  transport: '交通',
  housing: '居住',
  entertainment: '娱乐',
  lifestyle: '生活服务',
  health: '医疗健康',
  education: '教育学习',
  work: '工作办公',
  finance: '财务金融',
  social: '礼物社交',
  communication: '通讯',
  other: '其他'
}

// 常用导航图标
export const NAV_ICONS = {
  dashboard: 'dashboard',
  calendar: 'calendar_today',
  add: 'add_circle',
  reports: 'bar_chart',
  settings: 'settings',
  menu: 'menu',
  close: 'close',
  back: 'arrow_back',
  forward: 'arrow_forward',
  refresh: 'refresh',
  search: 'search',
  filter: 'filter_list',
  sort: 'sort',
  edit: 'edit',
  delete: 'delete',
  save: 'save',
  check: 'check',
  expand: 'expand_more',
  collapse: 'expand_less'
} as const

// 交易类型图标
export const TRANSACTION_ICONS = {
  expense: 'remove_circle',
  income: 'add_circle',
  transfer: 'swap_horiz'
} as const

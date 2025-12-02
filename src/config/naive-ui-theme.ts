/**
 * NaiveUI 主题配置
 * 匹配 tokens.css 中的设计令牌，确保跨平台 UI 一致性
 */

import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * 深色主题覆盖
 * 品牌绿色 #2bd776 作为主色
 */
export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    // 品牌色彩
    primaryColor: '#2bd776',
    primaryColorHover: '#25c269',
    primaryColorPressed: '#1fad5c',
    primaryColorSuppl: '#2bd776',
    
    // 成功色（与 primary 一致）
    successColor: '#2bd776',
    successColorHover: '#25c269',
    successColorPressed: '#1fad5c',
    
    // 警告色
    warningColor: '#f0b429',
    warningColorHover: '#f5c142',
    warningColorPressed: '#d9a224',
    
    // 错误色
    errorColor: '#ef4444',
    errorColorHover: '#f16464',
    errorColorPressed: '#d93d3d',
    
    // 信息色
    infoColor: '#3b82f6',
    infoColorHover: '#5b9af7',
    infoColorPressed: '#2563eb',
    
    // 背景色
    bodyColor: '#0b1210',
    cardColor: '#111a16',
    modalColor: '#111a16',
    popoverColor: '#111a16',
    tableColor: '#111a16',
    inputColor: 'rgba(11, 18, 16, 0.6)',
    codeColor: '#111a16',
    tagColor: 'rgba(43, 215, 118, 0.1)',
    avatarColor: 'rgba(43, 215, 118, 0.2)',
    
    // 边框色
    borderColor: '#1a2b24',
    dividerColor: '#1a2b24',
    
    // 文本色
    textColorBase: '#e8f1ec',
    textColor1: '#e8f1ec',
    textColor2: '#b8c7be',
    textColor3: '#7b8c82',
    textColorDisabled: '#4a5a52',
    placeholderColor: '#7b8c82',
    
    // 圆角
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    
    // 字体
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyMono: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontWeightStrong: '600',
    
    // 阴影
    boxShadow1: '0 2px 4px rgba(0, 0, 0, 0.2)',
    boxShadow2: '0 4px 8px rgba(0, 0, 0, 0.25)',
    boxShadow3: '0 10px 20px rgba(0, 0, 0, 0.3)',
    
    // Hover 状态
    hoverColor: 'rgba(43, 215, 118, 0.08)',
    pressedColor: 'rgba(43, 215, 118, 0.12)',
  },
  
  // 按钮组件
  Button: {
    textColorPrimary: '#0b1210',
    textColorHoverPrimary: '#0b1210',
    textColorPressedPrimary: '#0b1210',
    textColorFocusPrimary: '#0b1210',
    colorPrimary: '#2bd776',
    colorHoverPrimary: '#25c269',
    colorPressedPrimary: '#1fad5c',
    colorFocusPrimary: '#2bd776',
    borderPrimary: '1px solid #2bd776',
    borderHoverPrimary: '1px solid #25c269',
    borderPressedPrimary: '1px solid #1fad5c',
    
    // 默认按钮
    textColor: '#e8f1ec',
    color: 'transparent',
    colorHover: 'rgba(43, 215, 118, 0.1)',
    colorPressed: 'rgba(43, 215, 118, 0.15)',
    border: '1px solid rgba(43, 215, 118, 0.2)',
    borderHover: '1px solid rgba(43, 215, 118, 0.4)',
    borderPressed: '1px solid rgba(43, 215, 118, 0.5)',
    
    // 圆形按钮
    borderRadiusMedium: '9999px',
    borderRadiusSmall: '9999px',
    borderRadiusLarge: '9999px',
    borderRadiusTiny: '9999px',
  },
  
  // 卡片组件
  Card: {
    color: '#111a16',
    colorEmbedded: '#0b1210',
    borderColor: 'rgba(43, 215, 118, 0.2)',
    borderRadius: '16px',
    titleTextColor: '#e8f1ec',
    textColor: '#e8f1ec',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
  },
  
  // 菜单组件
  Menu: {
    color: 'transparent',
    itemTextColor: '#e8f1ec',
    itemTextColorHover: '#e8f1ec',
    itemTextColorActive: '#0b1210',
    itemTextColorActiveHover: '#0b1210',
    itemTextColorChildActive: '#2bd776',
    itemColorHover: 'rgba(255, 255, 255, 0.05)',
    itemColorActive: '#2bd776',
    itemColorActiveHover: '#25c269',
    borderRadius: '8px',
    itemIconColor: '#e8f1ec',
    itemIconColorHover: '#e8f1ec',
    itemIconColorActive: '#0b1210',
    itemIconColorActiveHover: '#0b1210',
    itemIconColorChildActive: '#2bd776',
  },
  
  // 输入框组件
  Input: {
    color: 'rgba(11, 18, 16, 0.6)',
    colorFocus: 'rgba(11, 18, 16, 0.8)',
    border: '1px solid rgba(43, 215, 118, 0.2)',
    borderHover: '1px solid rgba(43, 215, 118, 0.4)',
    borderFocus: '1px solid #2bd776',
    textColor: '#e8f1ec',
    placeholderColor: '#7b8c82',
    caretColor: '#2bd776',
    borderRadius: '8px',
  },
  
  // 单选框组件
  Radio: {
    buttonTextColor: '#7b8c82',
    buttonTextColorActive: '#0b1210',
    buttonColorActive: '#2bd776',
    buttonBorderColor: 'rgba(43, 215, 118, 0.2)',
    buttonBorderColorActive: '#2bd776',
    buttonBorderColorHover: 'rgba(43, 215, 118, 0.4)',
    boxShadowFocus: '0 0 12px rgba(43, 215, 118, 0.4)',
    buttonBoxShadowFocus: '0 0 12px rgba(43, 215, 118, 0.4)',
    dotColorActive: '#2bd776',
  },
  
  // 标签页组件
  Tabs: {
    tabTextColorLine: '#7b8c82',
    tabTextColorActiveLine: '#e8f1ec',
    tabTextColorHoverLine: '#e8f1ec',
    barColor: '#2bd776',
    tabBorderColor: '#1a2b24',
    tabColorSegment: '#111a16',
    tabTextColorSegment: '#7b8c82',
    tabTextColorActiveSegment: '#e8f1ec',
    colorSegment: 'rgba(43, 215, 118, 0.1)',
    tabColorActiveSegment: '#2bd776',
  },
  
  // 数据表格组件
  DataTable: {
    thColor: '#111a16',
    thTextColor: '#7b8c82',
    tdColor: '#111a16',
    tdTextColor: '#e8f1ec',
    borderColor: '#1a2b24',
    thColorHover: '#111a16',
    tdColorHover: 'rgba(43, 215, 118, 0.05)',
  },
  
  // 统计组件
  Statistic: {
    valueTextColor: '#e8f1ec',
    labelTextColor: '#7b8c82',
  },
  
  // 列表组件
  List: {
    color: 'transparent',
    colorHover: 'rgba(43, 215, 118, 0.05)',
    textColor: '#e8f1ec',
    borderColor: '#1a2b24',
  },
  
  // 日期选择器
  DatePicker: {
    itemBorderRadius: '8px',
    itemColorActive: '#2bd776',
    itemTextColorActive: '#0b1210',
    panelColor: '#111a16',
    calendarTitleTextColor: '#e8f1ec',
  },
  
  // 布局组件
  Layout: {
    color: '#0b1210',
    siderColor: 'rgba(17, 26, 22, 0.7)',
    siderBorderColor: 'rgba(26, 43, 36, 0.8)',
    headerColor: '#111a16',
    headerBorderColor: '#1a2b24',
  },
  
  // 分割线
  Divider: {
    color: '#1a2b24',
    textColor: '#7b8c82',
  },
  
  // 标签
  Tag: {
    colorBordered: 'rgba(43, 215, 118, 0.1)',
    borderPrimary: '1px solid rgba(43, 215, 118, 0.5)',
    textColorPrimary: '#2bd776',
  },
  
  // 图标
  Icon: {
    color: '#e8f1ec',
  },
  
  // 滚动条
  Scrollbar: {
    color: 'rgba(43, 215, 118, 0.3)',
    colorHover: 'rgba(43, 215, 118, 0.5)',
  },
}

/**
 * 浅色主题覆盖
 */
export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    // 品牌色彩（保持一致）
    primaryColor: '#2bd776',
    primaryColorHover: '#25c269',
    primaryColorPressed: '#1fad5c',
    primaryColorSuppl: '#2bd776',
    
    // 成功色
    successColor: '#2bd776',
    successColorHover: '#25c269',
    successColorPressed: '#1fad5c',
    
    // 警告色
    warningColor: '#f0b429',
    warningColorHover: '#f5c142',
    warningColorPressed: '#d9a224',
    
    // 错误色
    errorColor: '#ef4444',
    errorColorHover: '#f16464',
    errorColorPressed: '#d93d3d',
    
    // 信息色
    infoColor: '#3b82f6',
    infoColorHover: '#5b9af7',
    infoColorPressed: '#2563eb',
    
    // 背景色
    bodyColor: '#ffffff',
    cardColor: '#f9fafb',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    
    // 边框色
    borderColor: '#e5e7eb',
    dividerColor: '#e5e7eb',
    
    // 文本色
    textColorBase: '#0f0f0f',
    textColor1: '#0f0f0f',
    textColor2: '#4b5563',
    textColor3: '#6b7280',
    textColorDisabled: '#9ca3af',
    placeholderColor: '#9ca3af',
    
    // 圆角
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    
    // 字体
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyMono: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontWeightStrong: '600',
  },
  
  Button: {
    textColorPrimary: '#ffffff',
    colorPrimary: '#2bd776',
    colorHoverPrimary: '#25c269',
    colorPressedPrimary: '#1fad5c',
  },
  
  Card: {
    color: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
}

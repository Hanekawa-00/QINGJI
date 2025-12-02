/**
 * NaiveUI 主题配置
 * 匹配 tokens.css 中的设计令牌，确保跨平台 UI 一致性
 */

import type { GlobalThemeOverrides } from 'naive-ui'
import type { ThemeColors } from '@/types'

/**
 * 根据主题颜色生成 NaiveUI 深色主题覆盖
 */
export function createDarkThemeOverrides(colors: ThemeColors): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: colors.primary,
      primaryColorHover: colors.primaryHover,
      primaryColorPressed: colors.primaryPressed,
      primaryColorSuppl: colors.primary,
      
      successColor: colors.primary,
      successColorHover: colors.primaryHover,
      successColorPressed: colors.primaryPressed,
      
      warningColor: '#f0b429',
      warningColorHover: '#f5c142',
      warningColorPressed: '#d9a224',
      
      errorColor: '#ef4444',
      errorColorHover: '#f16464',
      errorColorPressed: '#d93d3d',
      
      infoColor: '#3b82f6',
      infoColorHover: '#5b9af7',
      infoColorPressed: '#2563eb',
      
      bodyColor: colors.backgroundDark,
      cardColor: colors.surface,
      modalColor: colors.surface,
      popoverColor: colors.surface,
      tableColor: colors.surface,
      inputColor: `${colors.backgroundDark}99`,
      codeColor: colors.surface,
      tagColor: `${colors.primary}1a`,
      avatarColor: `${colors.primary}33`,
      
      borderColor: colors.border,
      dividerColor: colors.border,
      
      textColorBase: colors.textStrong,
      textColor1: colors.textStrong,
      textColor2: colors.textMuted,
      textColor3: colors.textMuted,
      textColorDisabled: `${colors.textMuted}80`,
      placeholderColor: colors.textMuted,
      
      borderRadius: '6px',
      borderRadiusSmall: '4px',
      
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontFamilyMono: "'Consolas', 'Monaco', 'Courier New', monospace",
      fontWeightStrong: '600',
      
      boxShadow1: '0 2px 4px rgba(0, 0, 0, 0.2)',
      boxShadow2: '0 4px 8px rgba(0, 0, 0, 0.25)',
      boxShadow3: '0 10px 20px rgba(0, 0, 0, 0.3)',
      
      hoverColor: `${colors.primary}14`,
      pressedColor: `${colors.primary}1f`,
    },
    
    Button: {
      textColorPrimary: colors.backgroundDark,
      textColorHoverPrimary: colors.backgroundDark,
      textColorPressedPrimary: colors.backgroundDark,
      textColorFocusPrimary: colors.backgroundDark,
      colorPrimary: colors.primary,
      colorHoverPrimary: colors.primaryHover,
      colorPressedPrimary: colors.primaryPressed,
      colorFocusPrimary: colors.primary,
      borderPrimary: `1px solid ${colors.primary}`,
      borderHoverPrimary: `1px solid ${colors.primaryHover}`,
      borderPressedPrimary: `1px solid ${colors.primaryPressed}`,
      
      textColor: colors.textStrong,
      color: 'transparent',
      colorHover: `${colors.primary}1a`,
      colorPressed: `${colors.primary}26`,
      border: `1px solid ${colors.primary}33`,
      borderHover: `1px solid ${colors.primary}66`,
      borderPressed: `1px solid ${colors.primary}80`,
      
      borderRadiusMedium: '9999px',
      borderRadiusSmall: '9999px',
      borderRadiusLarge: '9999px',
      borderRadiusTiny: '9999px',
    },
    
    Card: {
      color: colors.surface,
      colorEmbedded: colors.backgroundDark,
      borderColor: `${colors.primary}33`,
      borderRadius: '16px',
      titleTextColor: colors.textStrong,
      textColor: colors.textStrong,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
    },
    
    Menu: {
      color: 'transparent',
      itemTextColor: colors.textStrong,
      itemTextColorHover: colors.textStrong,
      itemTextColorActive: colors.backgroundDark,
      itemTextColorActiveHover: colors.backgroundDark,
      itemTextColorChildActive: colors.primary,
      itemColorHover: 'rgba(255, 255, 255, 0.05)',
      itemColorActive: colors.primary,
      itemColorActiveHover: colors.primaryHover,
      borderRadius: '8px',
      itemIconColor: colors.textStrong,
      itemIconColorHover: colors.textStrong,
      itemIconColorActive: colors.backgroundDark,
      itemIconColorActiveHover: colors.backgroundDark,
      itemIconColorChildActive: colors.primary,
    },
    
    Input: {
      color: `${colors.backgroundDark}99`,
      colorFocus: `${colors.backgroundDark}cc`,
      border: `1px solid ${colors.primary}33`,
      borderHover: `1px solid ${colors.primary}66`,
      borderFocus: `1px solid ${colors.primary}`,
      textColor: colors.textStrong,
      placeholderColor: colors.textMuted,
      caretColor: colors.primary,
      borderRadius: '8px',
    },
    
    Radio: {
      buttonTextColor: colors.textMuted,
      buttonTextColorActive: colors.backgroundDark,
      buttonColorActive: colors.primary,
      buttonBorderColor: `${colors.primary}33`,
      buttonBorderColorActive: colors.primary,
      buttonBorderColorHover: `${colors.primary}66`,
      boxShadowFocus: `0 0 12px ${colors.primary}66`,
      buttonBoxShadowFocus: `0 0 12px ${colors.primary}66`,
      dotColorActive: colors.primary,
    },
    
    Tabs: {
      tabTextColorLine: colors.textMuted,
      tabTextColorActiveLine: colors.textStrong,
      tabTextColorHoverLine: colors.textStrong,
      barColor: colors.primary,
      tabBorderColor: colors.border,
      tabColorSegment: colors.surface,
      tabTextColorSegment: colors.textMuted,
      tabTextColorActiveSegment: colors.textStrong,
      colorSegment: `${colors.primary}1a`,
      tabColorActiveSegment: colors.primary,
    },
    
    DataTable: {
      thColor: colors.surface,
      thTextColor: colors.textMuted,
      tdColor: colors.surface,
      tdTextColor: colors.textStrong,
      borderColor: colors.border,
      thColorHover: colors.surface,
      tdColorHover: `${colors.primary}0d`,
    },
    
    Statistic: {
      valueTextColor: colors.textStrong,
      labelTextColor: colors.textMuted,
    },
    
    List: {
      color: 'transparent',
      colorHover: `${colors.primary}0d`,
      textColor: colors.textStrong,
      borderColor: colors.border,
    },
    
    DatePicker: {
      itemBorderRadius: '8px',
      itemColorActive: colors.primary,
      itemTextColorActive: colors.backgroundDark,
      panelColor: colors.surface,
      calendarTitleTextColor: colors.textStrong,
    },
    
    Layout: {
      color: colors.backgroundDark,
      siderColor: `${colors.surface}b3`,
      siderBorderColor: `${colors.border}cc`,
      headerColor: colors.surface,
      headerBorderColor: colors.border,
    },
    
    Divider: {
      color: colors.border,
      textColor: colors.textMuted,
    },
    
    Tag: {
      colorBordered: `${colors.primary}1a`,
      borderPrimary: `1px solid ${colors.primary}80`,
      textColorPrimary: colors.primary,
    },
    
    Icon: {
      color: colors.textStrong,
    },
    
    Scrollbar: {
      color: `${colors.primary}4d`,
      colorHover: `${colors.primary}80`,
    },
  }
}

/**
 * 根据主题颜色生成 NaiveUI 浅色主题覆盖
 */
export function createLightThemeOverrides(colors: ThemeColors): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: colors.primary,
      primaryColorHover: colors.primaryHover,
      primaryColorPressed: colors.primaryPressed,
      primaryColorSuppl: colors.primary,
      
      successColor: colors.primary,
      successColorHover: colors.primaryHover,
      successColorPressed: colors.primaryPressed,
      
      warningColor: '#f0b429',
      warningColorHover: '#f5c142',
      warningColorPressed: '#d9a224',
      
      errorColor: '#ef4444',
      errorColorHover: '#f16464',
      errorColorPressed: '#d93d3d',
      
      infoColor: '#3b82f6',
      infoColorHover: '#5b9af7',
      infoColorPressed: '#2563eb',
      
      bodyColor: colors.background,
      cardColor: colors.surface,
      modalColor: colors.surface,
      popoverColor: colors.surface,
      
      borderColor: colors.border,
      dividerColor: colors.border,
      
      textColorBase: colors.textStrong,
      textColor1: colors.textStrong,
      textColor2: colors.textMuted,
      textColor3: colors.textMuted,
      textColorDisabled: `${colors.textMuted}80`,
      placeholderColor: colors.textMuted,
      
      borderRadius: '6px',
      borderRadiusSmall: '4px',
      
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontFamilyMono: "'Consolas', 'Monaco', 'Courier New', monospace",
      fontWeightStrong: '600',
    },
    
    Button: {
      textColorPrimary: '#ffffff',
      colorPrimary: colors.primary,
      colorHoverPrimary: colors.primaryHover,
      colorPressedPrimary: colors.primaryPressed,
    },
    
    Card: {
      color: colors.surface,
      borderColor: colors.border,
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    },
    
    Menu: {
      color: 'transparent',
      itemTextColor: colors.textStrong,
      itemTextColorHover: colors.textStrong,
      itemTextColorActive: '#ffffff',
      itemTextColorActiveHover: '#ffffff',
      itemTextColorChildActive: colors.primary,
      itemIconColor: colors.textMuted,
      itemIconColorHover: colors.textStrong,
      itemIconColorActive: '#ffffff',
      itemIconColorActiveHover: '#ffffff',
      itemIconColorCollapsed: colors.textMuted,
      itemColorHover: `${colors.primary}0d`,
      itemColorActive: colors.primary,
      itemColorActiveHover: colors.primaryHover,
      borderRadius: '8px',
    },
    
    Input: {
      border: `1px solid ${colors.border}`,
      borderHover: `1px solid ${colors.primary}`,
      borderFocus: `1px solid ${colors.primary}`,
      caretColor: colors.primary,
      borderRadius: '8px',
    },
    
    Radio: {
      buttonTextColorActive: '#ffffff',
      buttonColorActive: colors.primary,
      buttonBorderColorActive: colors.primary,
      dotColorActive: colors.primary,
    },
  }
}

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

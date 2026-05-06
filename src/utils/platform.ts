/**
 * 平台检测工具
 * 基于 Tauri OS API 检测平台类型
 */

import { platform, type } from '@tauri-apps/plugin-os'

export type PlatformType = 'desktop' | 'mobile'
export type OSType = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown'

export interface PlatformInfo {
  platformType: PlatformType
  osType: OSType
  osVersion: string
  isDesktop: boolean
  isMobile: boolean
}

function getPlatformOverride(): PlatformType | null {
  const override = import.meta.env.VITE_QINGJI_PLATFORM
  return override === 'desktop' || override === 'mobile' ? override : null
}

/**
 * 检测平台类型
 */
export function detectPlatform(): PlatformType {
  const override = getPlatformOverride()
  if (override) return override

  try {
    const os = platform()
    
    // 桌面端平台
    if (os === 'windows' || os === 'macos' || os === 'linux') {
      return 'desktop'
    }
    
    // 移动端平台
    if (os === 'ios' || os === 'android') {
      return 'mobile'
    }
    
    // 默认返回桌面端（开发环境）
    return 'desktop'
  } catch (error) {
    console.warn('Platform detection failed, defaulting to desktop:', error)
    return 'desktop'
  }
}

/**
 * 是否为桌面端
 */
export function isDesktop(): boolean {
  return detectPlatform() === 'desktop'
}

/**
 * 是否为移动端
 */
export function isMobile(): boolean {
  return detectPlatform() === 'mobile'
}

/**
 * 获取操作系统类型
 */
export function getOSType(): OSType {
  const override = getPlatformOverride()
  if (override === 'desktop') return 'unknown'
  if (override === 'mobile') return 'android'

  try {
    const os = platform()
    
    switch (os) {
      case 'windows':
        return 'windows'
      case 'macos':
        return 'macos'
      case 'linux':
        return 'linux'
      case 'ios':
        return 'ios'
      case 'android':
        return 'android'
      default:
        return 'unknown'
    }
  } catch (error) {
    console.warn('OS type detection failed:', error)
    return 'unknown'
  }
}

/**
 * 获取完整平台信息
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  const override = getPlatformOverride()
  if (override) {
    const osType = override === 'mobile' ? 'android' : 'unknown'
    return {
      platformType: override,
      osType,
      osVersion: 'test',
      isDesktop: override === 'desktop',
      isMobile: override === 'mobile'
    }
  }

  try {
    const osType = getOSType()
    const platformType = detectPlatform()
    const osVersion = await type()
    
    return {
      platformType,
      osType,
      osVersion,
      isDesktop: platformType === 'desktop',
      isMobile: platformType === 'mobile'
    }
  } catch (error) {
    console.warn('Failed to get platform info:', error)
    
    // 返回默认值
    return {
      platformType: 'desktop',
      osType: 'unknown',
      osVersion: 'unknown',
      isDesktop: true,
      isMobile: false
    }
  }
}

/**
 * 是否为 Windows
 */
export function isWindows(): boolean {
  return getOSType() === 'windows'
}

/**
 * 是否为 macOS
 */
export function isMacOS(): boolean {
  return getOSType() === 'macos'
}

/**
 * 是否为 Linux
 */
export function isLinux(): boolean {
  return getOSType() === 'linux'
}

/**
 * 是否为 iOS
 */
export function isIOS(): boolean {
  return getOSType() === 'ios'
}

/**
 * 是否为 Android
 */
export function isAndroid(): boolean {
  return getOSType() === 'android'
}

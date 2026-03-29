/**
 * WebDAV 同步服务
 * 支持将数据备份到 WebDAV 服务器（如坚果云、Nextcloud 等）
 */

import { generateExportData, exportToJSON, validateImportData, type ExportData } from './data-transfer'
import type { Transaction, Category, CurrencyCode } from '@/types'

// ==================== 类型定义 ====================

export interface WebDAVConfig {
  serverUrl: string      // WebDAV 服务器地址
  username: string       // 用户名
  password: string       // 密码（加密存储）
  remotePath: string     // 远程备份路径
  autoSync: boolean      // 是否自动同步
  syncInterval: number   // 同步间隔（分钟）
}

export interface SyncResult {
  success: boolean
  action: 'upload' | 'download' | 'none'
  message: string
  timestamp?: string
  error?: string
}

export interface SyncStatus {
  lastSyncTime: string | null
  lastSyncResult: 'success' | 'failed' | null
  isSyncing: boolean
}

export interface BackupFileInfo {
  filename: string
  displayName: string
  timestamp: string
  lastModified?: string
  size?: number
}

// ==================== 常量 ====================

const BACKUP_PREFIX = 'qingji-backup-'
const LEGACY_BACKUP_PREFIX = 'qingzhang-backup-'
const BACKUP_EXT = '.json'
const CONFIG_KEY = 'webdav_config'
const SYNC_STATUS_KEY = 'webdav_sync_status'

// ==================== 配置管理 ====================

// Store 单例
let storeInstance: Awaited<ReturnType<typeof import('@tauri-apps/plugin-store').load>> | null = null

async function getStore() {
  if (!storeInstance) {
    const { load } = await import('@tauri-apps/plugin-store')
    storeInstance = await load('settings.json')
  }
  return storeInstance
}

/**
 * 保存 WebDAV 配置
 */
export async function saveWebDAVConfig(config: WebDAVConfig): Promise<void> {
  try {
    const store = await getStore()
    
    // 加密敏感信息（简单 base64，生产环境应使用更安全的加密）
    const secureConfig = {
      ...config,
      password: btoa(config.password)
    }
    
    await store.set(CONFIG_KEY, secureConfig)
  } catch (error) {
    console.error('Failed to save WebDAV config:', error)
    throw error
  }
}

/**
 * 加载 WebDAV 配置
 */
export async function loadWebDAVConfig(): Promise<WebDAVConfig | null> {
  try {
    const store = await getStore()
    const config = await store.get<WebDAVConfig>(CONFIG_KEY)
    
    if (config) {
      // 解密密码
      return {
        ...config,
        password: config.password ? atob(config.password) : ''
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to load WebDAV config:', error)
    return null
  }
}

/**
 * 清除 WebDAV 配置
 */
export async function clearWebDAVConfig(): Promise<void> {
  try {
    const store = await getStore()
    await store.delete(CONFIG_KEY)
    await store.delete(SYNC_STATUS_KEY)
  } catch (error) {
    console.error('Failed to clear WebDAV config:', error)
  }
}

// ==================== 同步状态 ====================

/**
 * 保存同步状态
 */
export async function saveSyncStatus(status: Partial<SyncStatus>): Promise<void> {
  try {
    const store = await getStore()
    const current = await store.get<SyncStatus>(SYNC_STATUS_KEY) || {
      lastSyncTime: null,
      lastSyncResult: null,
      isSyncing: false
    }
    
    await store.set(SYNC_STATUS_KEY, { ...current, ...status })
  } catch (error) {
    console.error('Failed to save sync status:', error)
  }
}

/**
 * 加载同步状态
 */
export async function loadSyncStatus(): Promise<SyncStatus> {
  try {
    const store = await getStore()
    return await store.get<SyncStatus>(SYNC_STATUS_KEY) || {
      lastSyncTime: null,
      lastSyncResult: null,
      isSyncing: false
    }
  } catch (error) {
    console.error('Failed to load sync status:', error)
    return { lastSyncTime: null, lastSyncResult: null, isSyncing: false }
  }
}

// ==================== WebDAV 操作 ====================

/**
 * 构建 WebDAV 请求头
 */
function buildAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`
}

/**
 * 规范化 WebDAV 目录 URL
 */
function normalizeDirUrl(serverUrl: string, remotePath: string): string {
  let base = serverUrl.replace(/\/+$/, '')
  let path = remotePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return `${base}/${path}`
}

/**
 * 生成带时间戳的备份文件名（使用本地时间）
 */
function generateBackupFilename(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
  return `${BACKUP_PREFIX}${timestamp}${BACKUP_EXT}`
}

/**
 * 从文件名解析时间戳
 */
function parseBackupFilename(filename: string): { timestamp: string; displayName: string } | null {
  const match = filename.match(/(?:qingji|qingzhang)-backup-(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json/)
  if (match) {
    const dateStr = match[1]
    const timeStr = match[2].replace(/-/g, ':')
    const timestamp = `${dateStr}T${timeStr}`
    const date = new Date(timestamp)
    const displayName = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    return { timestamp, displayName }
  }
  return null
}

/**
 * 测试 WebDAV 连接
 */
export async function testConnection(config: WebDAVConfig): Promise<{ success: boolean; message: string }> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    
    const url = config.serverUrl.replace(/\/+$/, '') + '/' + config.remotePath.replace(/^\/+/, '')
    
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Depth': '0',
        'Content-Type': 'application/xml'
      }
    })
    
    if (response.status === 207 || response.status === 200) {
      return { success: true, message: 'Connection successful' }
    } else if (response.status === 401) {
      return { success: false, message: 'Authentication failed. Check username and password.' }
    } else if (response.status === 404) {
      return { success: false, message: 'Path not found. Check remote path.' }
    } else {
      return { success: false, message: `Server returned status ${response.status}` }
    }
  } catch (error) {
    console.error('Connection test failed:', error)
    return { success: false, message: `Connection failed: ${String(error)}` }
  }
}

/**
 * 确保远程目录存在
 */
async function ensureRemoteDir(config: WebDAVConfig): Promise<boolean> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    const dirUrl = normalizeDirUrl(config.serverUrl, config.remotePath)
    
    // 尝试创建目录（如果已存在会返回 405 或成功）
    const response = await fetch(dirUrl + '/', {
      method: 'MKCOL',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      }
    })
    
    // 201 Created, 405 Already exists, 301/302 Redirect
    return response.status === 201 || response.status === 405 || 
           response.status === 301 || response.status === 302 ||
           response.status === 200
  } catch {
    return false
  }
}

/**
 * 上传数据到 WebDAV（带时间戳版本）
 */
export async function uploadToWebDAV(
  config: WebDAVConfig,
  transactions: Transaction[],
  categories: Category[],
  primaryCurrency: CurrencyCode
): Promise<SyncResult> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    
    // 确保目录存在
    await ensureRemoteDir(config)
    
    // 生成备份数据
    const data = generateExportData(transactions, categories, primaryCurrency)
    const json = exportToJSON(data)
    
    // 使用时间戳文件名
    const filename = generateBackupFilename()
    const dirUrl = normalizeDirUrl(config.serverUrl, config.remotePath)
    const url = `${dirUrl}/${filename}`
    
    // 上传文件
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Content-Type': 'application/json'
      },
      body: json
    })
    
    if (response.status === 201 || response.status === 204 || response.status === 200) {
      const timestamp = new Date().toISOString()
      await saveSyncStatus({ 
        lastSyncTime: timestamp, 
        lastSyncResult: 'success',
        isSyncing: false 
      })
      
      return {
        success: true,
        action: 'upload',
        message: `Uploaded ${transactions.length} transactions and ${categories.length} categories`,
        timestamp
      }
    } else {
      throw new Error(`Upload failed with status ${response.status}`)
    }
  } catch (error) {
    await saveSyncStatus({ lastSyncResult: 'failed', isSyncing: false })
    return {
      success: false,
      action: 'upload',
      message: 'Upload failed',
      error: String(error)
    }
  }
}

/**
 * 列出所有备份文件
 */
export async function listBackupFiles(config: WebDAVConfig): Promise<BackupFileInfo[]> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    const dirUrl = normalizeDirUrl(config.serverUrl, config.remotePath)
    
    const response = await fetch(dirUrl + '/', {
      method: 'PROPFIND',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Depth': '1',
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getlastmodified/>
    <D:getcontentlength/>
  </D:prop>
</D:propfind>`
    })
    
    if (response.status !== 207 && response.status !== 200) {
      return []
    }
    
    const text = await response.text()
    const backups: BackupFileInfo[] = []
    
    // 解析 XML 响应，提取备份文件
    const hrefMatches = text.matchAll(/<D:href[^>]*>([^<]+)<\/D:href>/gi)
    
    for (const match of hrefMatches) {
      const href = decodeURIComponent(match[1])
      const filename = href.split('/').filter(Boolean).pop() || ''
      
      const hasSupportedPrefix = filename.startsWith(BACKUP_PREFIX) || filename.startsWith(LEGACY_BACKUP_PREFIX)
      if (hasSupportedPrefix && filename.endsWith(BACKUP_EXT)) {
        const parsed = parseBackupFilename(filename)
        if (parsed) {
          backups.push({
            filename,
            displayName: parsed.displayName,
            timestamp: parsed.timestamp
          })
        }
      }
    }
    
    // 按时间倒序排列
    backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    
    return backups
  } catch (error) {
    console.error('Failed to list backup files:', error)
    return []
  }
}

/**
 * 下载指定的备份文件
 */
export async function downloadBackupFile(
  config: WebDAVConfig,
  filename: string
): Promise<{ success: boolean; data?: ExportData; error?: string }> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    
    const dirUrl = normalizeDirUrl(config.serverUrl, config.remotePath)
    const url = `${dirUrl}/${filename}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      }
    })
    
    if (response.status === 200) {
      const text = await response.text()
      const parsed = JSON.parse(text)
      const validation = validateImportData(parsed)
      
      if (validation.valid && validation.data) {
        return { success: true, data: validation.data }
      } else {
        return { success: false, error: validation.error || 'Invalid data format' }
      }
    } else if (response.status === 404) {
      return { success: false, error: 'Backup file not found' }
    } else {
      return { success: false, error: `Download failed with status ${response.status}` }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * 删除指定的备份文件
 */
export async function deleteBackupFile(
  config: WebDAVConfig,
  filename: string
): Promise<boolean> {
  try {
    const { fetch } = await import('@tauri-apps/plugin-http')
    
    const dirUrl = normalizeDirUrl(config.serverUrl, config.remotePath)
    const url = `${dirUrl}/${filename}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      }
    })
    
    return response.status === 204 || response.status === 200
  } catch {
    return false
  }
}

// ==================== 常用 WebDAV 服务预设 ====================

export const WEBDAV_PRESETS = {
  jianguoyun: {
    name: '坚果云',
    serverUrl: 'https://dav.jianguoyun.com/dav',
    defaultPath: '/QINGJI'
  },
  nextcloud: {
    name: 'Nextcloud',
    serverUrl: '', // 需要用户填写
    defaultPath: '/QINGJI'
  },
  owncloud: {
    name: 'ownCloud',
    serverUrl: '', // 需要用户填写
    defaultPath: '/QINGJI'
  },
  custom: {
    name: '自定义',
    serverUrl: '',
    defaultPath: '/QINGJI'
  }
}

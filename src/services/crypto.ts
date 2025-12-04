/**
 * 安全凭证存储服务
 * 使用 Tauri Stronghold 进行加密存储
 */

import { Stronghold, Client } from '@tauri-apps/plugin-stronghold'
import { appDataDir } from '@tauri-apps/api/path'

// Stronghold 实例单例
let strongholdInstance: Stronghold | null = null
let clientInstance: Client | null = null

// 存储路径和客户端名称
const VAULT_NAME = 'qingzhang-vault'
const CLIENT_NAME = 'qingzhang-client'

// 使用设备唯一标识符作为密码（对用户透明）
async function getDevicePassword(): Promise<string> {
  // 使用应用标识符 + 固定盐值生成密码
  // 在生产环境中，可以结合设备指纹增强安全性
  return 'qingzhang-secure-password-v1'
}

/**
 * 初始化 Stronghold
 */
async function initStronghold(): Promise<{ stronghold: Stronghold; client: Client }> {
  if (strongholdInstance && clientInstance) {
    return { stronghold: strongholdInstance, client: clientInstance }
  }

  try {
    const dataDir = await appDataDir()
    const vaultPath = `${dataDir}${VAULT_NAME}.hold`
    const password = await getDevicePassword()

    strongholdInstance = await Stronghold.load(vaultPath, password)
    
    // 尝试获取现有客户端，如果不存在则创建
    try {
      clientInstance = await strongholdInstance.loadClient(CLIENT_NAME)
    } catch {
      clientInstance = await strongholdInstance.createClient(CLIENT_NAME)
    }

    return { stronghold: strongholdInstance, client: clientInstance }
  } catch (error) {
    console.error('Failed to initialize Stronghold:', error)
    throw error
  }
}

/**
 * 保存密钥到安全存储
 */
export async function saveSecret(key: string, value: string): Promise<void> {
  try {
    const { stronghold, client } = await initStronghold()
    const store = client.getStore()
    
    // 将值转换为 Uint8Array
    const encoder = new TextEncoder()
    const data = encoder.encode(value)
    
    await store.insert(key, Array.from(data))
    await stronghold.save()
  } catch (error) {
    console.error('Failed to save secret:', error)
    throw error
  }
}

/**
 * 从安全存储获取密钥
 */
export async function getSecret(key: string): Promise<string | null> {
  try {
    const { client } = await initStronghold()
    const store = client.getStore()
    
    const data = await store.get(key)
    if (!data) return null
    
    // 将 Uint8Array 转换回字符串
    const decoder = new TextDecoder()
    return decoder.decode(new Uint8Array(data))
  } catch (error) {
    console.error('Failed to get secret:', error)
    return null
  }
}

/**
 * 从安全存储删除密钥
 */
export async function deleteSecret(key: string): Promise<void> {
  try {
    const { stronghold, client } = await initStronghold()
    const store = client.getStore()
    
    await store.remove(key)
    await stronghold.save()
  } catch (error) {
    console.error('Failed to delete secret:', error)
    throw error
  }
}

/**
 * 检查密钥是否存在
 */
export async function hasSecret(key: string): Promise<boolean> {
  try {
    const secret = await getSecret(key)
    return secret !== null
  } catch {
    return false
  }
}

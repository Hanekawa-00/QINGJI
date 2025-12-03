use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 数据库迁移定义
fn get_migrations() -> Vec<Migration> {
    vec![
        // 版本 1：创建分类表
        Migration {
            version: 1,
            description: "create_categories_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    icon TEXT NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                    color TEXT,
                    sort_order INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 插入默认支出分类
                INSERT OR IGNORE INTO categories (id, name, icon, type, color, sort_order) VALUES
                    ('cat-1', 'Food & Drink', 'local_cafe', 'expense', '#36a2e8', 1),
                    ('cat-2', 'Shopping', 'shopping_cart', 'expense', '#f6b756', 2),
                    ('cat-3', 'Transport', 'directions_car', 'expense', '#ef5f9a', 3),
                    ('cat-4', 'Entertainment', 'sports_esports', 'expense', '#9966ff', 4),
                    ('cat-5', 'Bills', 'receipt_long', 'expense', '#ff6b6b', 5),
                    ('cat-6', 'Health', 'medical_services', 'expense', '#4ecdc4', 6);
                
                -- 插入默认收入分类
                INSERT OR IGNORE INTO categories (id, name, icon, type, color, sort_order) VALUES
                    ('cat-income-1', 'Salary', 'payments', 'income', '#2bd776', 1),
                    ('cat-income-2', 'Bonus', 'card_giftcard', 'income', '#4de6a5', 2),
                    ('cat-income-3', 'Investment', 'trending_up', 'income', '#36a2e8', 3),
                    ('cat-income-4', 'Other', 'attach_money', 'income', '#f6b756', 4);
            "#,
            kind: MigrationKind::Up,
        },
        // 版本 2：创建交易表
        Migration {
            version: 2,
            description: "create_transactions_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    category_icon TEXT,
                    description TEXT,
                    date TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 创建索引以优化查询性能
                CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
                CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
                CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
            "#,
            kind: MigrationKind::Up,
        },
        // 版本 3：创建设置表
        Migration {
            version: 3,
            description: "create_settings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                
                -- 插入默认设置
                INSERT OR IGNORE INTO settings (key, value) VALUES
                    ('currency', 'USD'),
                    ('language', 'en'),
                    ('date_format', 'YYYY-MM-DD');
            "#,
            kind: MigrationKind::Up,
        },
        // 版本 4：添加多币种支持
        Migration {
            version: 4,
            description: "add_currency_support",
            sql: r#"
                -- 为交易表添加币种相关字段
                ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD';
                ALTER TABLE transactions ADD COLUMN converted_amount REAL;
                ALTER TABLE transactions ADD COLUMN exchange_rate REAL DEFAULT 1.0;
                
                -- 更新现有记录：设置 converted_amount 等于原始 amount（因为之前都是主币种）
                UPDATE transactions SET 
                    converted_amount = amount,
                    exchange_rate = 1.0
                WHERE converted_amount IS NULL;
                
                -- 更新设置表，添加主币种设置
                INSERT OR IGNORE INTO settings (key, value) VALUES
                    ('primary_currency', 'USD');
            "#,
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = get_migrations();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // SQLite 数据库插件（带迁移）
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:account.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        // Logging for debugging
        .plugin(tauri_plugin_log::Builder::new().targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: Some("account-app.log".to_string()) }),
        ]).build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

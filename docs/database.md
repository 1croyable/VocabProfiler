# 数据库设计

## 单词表

```sql
CREATE TABLE IF NOT EXISTS words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL,                 -- 允许重复，支持多义词原子化录入
    explanation TEXT NOT NULL,                  -- 卡片背面
    type ENUM('passive', 'active') NOT NULL,    -- 认知词 vs. 掌握词
    level INT DEFAULT 0,                        -- 当前等级 (0-5)
    next_review_date DATE,                      -- 下次复习日期 (核心索引字段)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    word_group INT NOT NULL,                        -- 分组机制，代表不同的背诵计划

    INDEX idx_next_review (next_review_date) -- 为复习查询添加索引，提高筛选效率
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


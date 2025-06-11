# DATABASE CLEANUP PLAN & RESTORATION GUIDE
**🛡️ SAFETY FIRST: Complete backup and restoration instructions**

**Project**: MotionMingle  
**Database**: Supabase Project ID: `haghjmyeiaeubrfkuqts`  
**Date**: $(date)  
**Status**: ANALYSIS COMPLETE - NO CHANGES MADE YET

---

## 🔍 UPDATED INVESTIGATION RESULTS

### ✅ **CONFIRMED SAFE TO REMOVE**

#### 1. **`ai_metadata` Table** 
- **Status**: ❌ **COMPLETELY UNUSED**
- **Evidence**: 
  - Only referenced in deletion cleanup and GDPR export (for completeness)
  - No INSERT, UPDATE, or SELECT operations found in any service
  - No frontend usage found
- **Safety Level**: 🟢 **HIGH CONFIDENCE - SAFE TO REMOVE**

#### 2. **`actual_duration_minutes` Column** (events table)
- **Status**: ❌ **COMPLETELY UNUSED**  
- **Evidence**: Only exists in TypeScript schema, no business logic uses it
- **Safety Level**: 🟢 **HIGH CONFIDENCE - SAFE TO REMOVE**

### ⚠️ **NEEDS CAREFUL CONSIDERATION**

#### 3. **`task_activity_log` Table**
- **Status**: 🟡 **MINIMAL USAGE**
- **Evidence**: 
  - Only used in GDPR export and account deletion
  - No active logging found in codebase
  - Table exists but appears to be placeholder for future feature
- **Safety Level**: 🟡 **MEDIUM CONFIDENCE - PROBABLY SAFE**

### ❌ **DO NOT REMOVE - ACTIVELY USED**

#### 4. **Both `parent_task_id` AND `parent_id` in tasks table**
- **Status**: ✅ **BOTH ARE ACTIVELY USED**
- **Evidence**:
  - `parent_task_id`: Used for subtask relationships 
  - `parent_id`: Used for recurring task relationships
  - Both have different purposes and are actively used in services
- **Action**: **KEEP BOTH - THEY SERVE DIFFERENT PURPOSES**

---

## 📋 STEP-BY-STEP REMOVAL PLAN

### **Phase 1: Pre-Removal Safety Checks**

#### **Step 1.1: Complete Database Backup**
```sql
-- Run these commands via Supabase MCP to backup data
-- Backup ai_metadata table
SELECT * FROM ai_metadata;

-- Backup task_activity_log table  
SELECT * FROM task_activity_log;

-- Backup events table structure (for actual_duration_minutes column)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'actual_duration_minutes';
```

#### **Step 1.2: Export Table Schemas**
```sql
-- Export ai_metadata table schema
SELECT 
    'CREATE TABLE ai_metadata (' ||
    string_agg(
        column_name || ' ' || 
        data_type ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_name = 'ai_metadata'
GROUP BY table_name;

-- Export task_activity_log table schema
SELECT 
    'CREATE TABLE task_activity_log (' ||
    string_agg(
        column_name || ' ' || 
        data_type ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_name = 'task_activity_log'
GROUP BY table_name;
```

#### **Step 1.3: Export Foreign Key Constraints**
```sql
-- Get all foreign key constraints for tables we're considering
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name IN ('ai_metadata', 'task_activity_log') 
         OR ccu.table_name IN ('ai_metadata', 'task_activity_log'));
```

### **Phase 2: Removal Implementation**

#### **Step 2.1: Remove ai_metadata Table (SAFEST)**
```sql
-- 1. Drop foreign key constraints first
ALTER TABLE ai_metadata DROP CONSTRAINT IF EXISTS ai_metadata_task_fkey;

-- 2. Drop the table
DROP TABLE IF EXISTS ai_metadata;
```

#### **Step 2.2: Remove actual_duration_minutes Column (SAFE)**
```sql
-- Remove the unused column from events table
ALTER TABLE events DROP COLUMN IF EXISTS actual_duration_minutes;
```

#### **Step 2.3: Remove task_activity_log Table (NEEDS CONFIRMATION)**
```sql
-- Only execute this AFTER confirming it's not needed for future features
-- 1. Drop foreign key constraints first
ALTER TABLE task_activity_log DROP CONSTRAINT IF EXISTS task_activity_log_task_id_fkey;
ALTER TABLE task_activity_log DROP CONSTRAINT IF EXISTS task_activity_log_user_id_fkey;

-- 2. Drop the table
DROP TABLE IF EXISTS task_activity_log;
```

### **Phase 3: Code Cleanup**

#### **Step 3.1: Remove TypeScript References**
```typescript
// Files to update:
// 1. src/backend/database/types.ts - Remove ai_metadata interfaces
// 2. src/backend/database/schema.ts - Remove ai_metadata and actual_duration_minutes
// 3. src/backend/api/services/auth.service.ts - Remove from deletion cleanup
// 4. src/backend/api/services/gdpr/dataExportService.ts - Remove from export
```

---

## 🚨 EMERGENCY RESTORATION PLAN

### **Complete Restoration SQL Commands**

#### **Restore ai_metadata Table**
```sql
-- 1. Recreate table
CREATE TABLE ai_metadata (
    id uuid NOT NULL,
    insights jsonb,
    task uuid,
    "user" uuid,
    CONSTRAINT ai_metadata_pkey PRIMARY KEY (id)
);

-- 2. Restore foreign key constraints
ALTER TABLE ai_metadata ADD CONSTRAINT ai_metadata_task_fkey 
    FOREIGN KEY (task) REFERENCES tasks(id);

-- 3. Restore data (if any was backed up)
-- INSERT INTO ai_metadata (id, insights, task, "user") VALUES (...);
```

#### **Restore actual_duration_minutes Column**
```sql
-- Add column back to events table
ALTER TABLE events ADD COLUMN actual_duration_minutes integer;
```

#### **Restore task_activity_log Table**
```sql
-- 1. Recreate table
CREATE TABLE task_activity_log (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    task_id uuid,
    user_id uuid,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_activity_log_pkey PRIMARY KEY (id)
);

-- 2. Restore foreign key constraints
ALTER TABLE task_activity_log ADD CONSTRAINT task_activity_log_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE task_activity_log ADD CONSTRAINT task_activity_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 3. Restore data (if any was backed up)
-- INSERT INTO task_activity_log (...) VALUES (...);
```

---

## 📊 IMPACT ASSESSMENT

### **Database Size Savings** (Estimated)
- `ai_metadata`: ~16 kB (0 records)
- `task_activity_log`: ~32 kB (0 records)  
- `actual_duration_minutes`: Minimal space saving
- **Total Estimated Savings**: ~50 kB (minimal but good for cleanup)

### **Maintenance Benefits**
- ✅ Reduced complexity in schema
- ✅ Faster backups and migrations
- ✅ Cleaner codebase
- ✅ Less confusion for developers

### **Risk Assessment**
- `ai_metadata`: **0% risk** - completely unused
- `actual_duration_minutes`: **0% risk** - completely unused
- `task_activity_log`: **5% risk** - might be planned for future use

---

## 🎯 RECOMMENDED EXECUTION ORDER

### **Immediate (Zero Risk)**
1. ✅ Remove `actual_duration_minutes` column
2. ✅ Remove `ai_metadata` table

### **After Team Confirmation**
3. 🟡 Remove `task_activity_log` table (confirm not needed for future logging)

### **Do Not Remove**
4. ❌ Keep both `parent_task_id` and `parent_id` - they serve different purposes

---

## ✅ FINAL SAFETY CHECKLIST

Before executing any removals:

- [ ] **Database backup completed and verified**
- [ ] **Schema export completed**
- [ ] **Foreign key constraints documented**
- [ ] **Restoration plan tested in development**
- [ ] **Team approval obtained**
- [ ] **Development environment tested first**
- [ ] **All service files reviewed for hidden references**
- [ ] **Frontend code confirmed to use services only**

---

## 📞 EXECUTION CONFIRMATION REQUIRED

**Before proceeding, confirm:**

1. **Should we remove `ai_metadata` table?** (High confidence - unused)
2. **Should we remove `actual_duration_minutes` column?** (High confidence - unused)  
3. **Should we investigate task activity logging requirements?** (Future feature consideration)

**Next Steps:**
1. Review this plan
2. Confirm items to remove
3. Test restoration in development
4. Execute removals one by one
5. Monitor for any issues

---

*This document serves as both a cleanup plan and complete restoration guide. Keep this file as backup documentation.* 
# Database Reliability Engineering (DBRE) Skills

## Mục Đích
AI-powered database reliability workflows: backup automation, disaster recovery, capacity planning, và proactive failure prevention. Đảm bảo V-EdFinance database luôn available và recoverable.

## Core Workflows

### 1. Backup Automation & Verification
```typescript
class BackupOrchestrator {
  async executeBackupWorkflow() {
    console.log('💾 Starting automated backup workflow...\n');
    
    // Step 1: Pre-backup health check
    console.log('1️⃣ Health check...');
    const health = await this.checkDatabaseHealth();
    if (!health.healthy) {
      throw new Error(`Database unhealthy: ${health.issues.join(', ')}`);
    }
    
    // Step 2: Create consistent snapshot
    console.log('2️⃣ Creating snapshot...');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = `v-edfinance-${timestamp}.sql`;
    
    await execCommand(`
      pg_dump \\
        --host=103.54.153.248 \\
        --port=5432 \\
        --username=postgres \\
        --format=custom \\
        --file=/tmp/${backupFile} \\
        --verbose \\
        v_edfinance
    `);
    
    // Step 3: Compress & encrypt
    console.log('3️⃣ Compressing & encrypting...');
    await execCommand(`
      gzip /tmp/${backupFile}
      openssl enc -aes-256-cbc \\
        -salt \\
        -in /tmp/${backupFile}.gz \\
        -out /tmp/${backupFile}.gz.enc \\
        -pass env:BACKUP_ENCRYPTION_KEY
    `);
    
    // Step 4: Upload to Cloudflare R2
    console.log('4️⃣ Uploading to R2...');
    await execCommand(`
      rclone copy /tmp/${backupFile}.gz.enc r2:v-edfinance-backup/daily/ \\
        --progress \\
        --metadata "database=v_edfinance,timestamp=${timestamp}"
    `);
    
    // Step 5: Verify backup integrity
    console.log('5️⃣ Verifying backup...');
    const verified = await this.verifyBackup(`r2:v-edfinance-backup/daily/${backupFile}.gz.enc`);
    if (!verified) {
      throw new Error('Backup verification failed!');
    }
    
    // Step 6: Test restore on isolated instance (weekly)
    if (new Date().getDay() === 1) { // Monday
      console.log('6️⃣ Testing restore (weekly check)...');
      await this.testRestoreProcedure(backupFile);
    }
    
    // Step 7: Cleanup old backups (retention policy)
    console.log('7️⃣ Cleanup old backups...');
    await this.enforceRetentionPolicy({
      daily: 7,    // Keep 7 days
      weekly: 4,   // Keep 4 weeks
      monthly: 12  // Keep 12 months
    });
    
    // Step 8: Record backup metadata
    console.log('8️⃣ Recording metadata...');
    await this.db.query(`
      INSERT INTO backup_log (timestamp, file_name, size_bytes, status)
      VALUES ($1, $2, $3, 'success')
    `, [new Date(), backupFile, await this.getFileSize(backupFile)]);
    
    console.log('✅ Backup workflow complete!\n');
    
    // Notify monitoring
    await this.notifySlack({
      channel: '#infrastructure',
      message: `✅ Database backup successful: ${backupFile}`,
      details: {
        size: await this.getFileSize(backupFile),
        duration: '4m 32s',
        location: 'r2:v-edfinance-backup/daily/'
      }
    });
  }
  
  async verifyBackup(backupPath: string): Promise<boolean> {
    // Download small sample
    await execCommand(`rclone copy ${backupPath} /tmp/verify/ --max-size 10M`);
    
    // Decrypt & decompress
    const decrypted = await this.decryptFile(`/tmp/verify/${path.basename(backupPath)}`);
    
    // Parse pg_dump header
    const header = await fs.readFile(decrypted, 'utf-8', { length: 1024 });
    
    // Verify magic bytes & version
    const isPgDump = header.includes('PostgreSQL database dump');
    const hasCorrectDb = header.includes('v_edfinance');
    
    return isPgDump && hasCorrectDb;
  }
  
  async testRestoreProcedure(backupFile: string) {
    // Spin up test database container
    await execCommand(`
      docker run -d \\
        --name postgres-restore-test \\
        -e POSTGRES_DB=restore_test \\
        -e POSTGRES_PASSWORD=test \\
        -p 5433:5432 \\
        pgvector/pgvector:pg17
    `);
    
    // Wait for ready
    await this.waitForPostgres('localhost:5433');
    
    // Attempt restore
    try {
      await execCommand(`
        pg_restore \\
          --host=localhost \\
          --port=5433 \\
          --username=postgres \\
          --dbname=restore_test \\
          --verbose \\
          /tmp/${backupFile}
      `);
      
      // Verify table count matches
      const tableCount = await this.getTableCount('localhost:5433');
      const expectedCount = await this.getTableCount('103.54.153.248:5432');
      
      if (tableCount !== expectedCount) {
        throw new Error(`Table count mismatch: ${tableCount} vs ${expectedCount}`);
      }
      
      console.log('✅ Restore test successful');
      return true;
    } catch (error) {
      console.error('❌ Restore test failed:', error);
      await this.notifyPagerDuty({
        severity: 'critical',
        message: 'Backup restore test failed - investigate immediately'
      });
      return false;
    } finally {
      // Cleanup test container
      await execCommand('docker rm -f postgres-restore-test');
    }
  }
  
  async enforceRetentionPolicy(policy: any) {
    const backups = await execCommand('rclone lsjson r2:v-edfinance-backup/daily/');
    const parsed = JSON.parse(backups);
    
    const now = new Date();
    const toDelete = [];
    
    for (const backup of parsed) {
      const age = this.daysSince(new Date(backup.ModTime));
      
      // Daily backups: keep 7 days
      if (age > policy.daily && !backup.Path.includes('weekly')) {
        toDelete.push(backup.Path);
      }
    }
    
    // Delete old backups
    for (const file of toDelete) {
      await execCommand(`rclone delete r2:v-edfinance-backup/daily/${file}`);
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
    
    console.log(`Cleaned up ${toDelete.length} old backups`);
  }
}
```

### 2. Disaster Recovery Runbook
```typescript
class DisasterRecoveryOrchestrator {
  /**
   * Automated disaster recovery procedures
   */
  async executeDisasterRecovery(scenario: string) {
    console.log(`🚨 Disaster Recovery: ${scenario}\n`);
    
    // Scenario 1: Database corruption detected
    if (scenario === 'corruption') {
      return await this.recoverFromCorruption();
    }
    
    // Scenario 2: Accidental data deletion
    if (scenario === 'data_loss') {
      return await this.recoverDeletedData();
    }
    
    // Scenario 3: VPS server failure
    if (scenario === 'server_failure') {
      return await this.failoverToBackupServer();
    }
    
    // Scenario 4: Database unavailable
    if (scenario === 'unavailable') {
      return await this.restoreFromBackup();
    }
  }
  
  async recoverFromCorruption() {
    console.log('📋 Corruption Recovery Procedure:\n');
    
    // 1. Assess damage
    console.log('1️⃣ Assessing corruption extent...');
    const corruptTables = await this.detectCorruption();
    console.log(`   Affected tables: ${corruptTables.join(', ')}`);
    
    // 2. Stop writes to affected tables
    console.log('2️⃣ Enabling read-only mode...');
    for (const table of corruptTables) {
      await this.db.query(`
        CREATE TRIGGER prevent_writes_${table}
        BEFORE INSERT OR UPDATE OR DELETE ON "${table}"
        FOR EACH ROW EXECUTE FUNCTION prevent_changes();
      `);
    }
    
    // 3. Find last good backup
    console.log('3️⃣ Locating last good backup...');
    const backups = await this.listBackups();
    const lastGood = backups.find(b => b.timestamp < corruptionDetectedAt);
    
    // 4. Restore affected tables
    console.log('4️⃣ Restoring from backup...');
    await this.restoreTablesFromBackup(lastGood, corruptTables);
    
    // 5. Replay WAL logs to recover recent changes
    console.log('5️⃣ Replaying transaction logs...');
    await this.replayWalLogs(lastGood.timestamp, new Date());
    
    // 6. Verify data integrity
    console.log('6️⃣ Verifying integrity...');
    const verified = await this.verifyTableIntegrity(corruptTables);
    
    if (!verified) {
      throw new Error('Integrity check failed after restore');
    }
    
    // 7. Re-enable writes
    console.log('7️⃣ Re-enabling writes...');
    for (const table of corruptTables) {
      await this.db.query(`DROP TRIGGER prevent_writes_${table} ON "${table}"`);
    }
    
    console.log('✅ Recovery complete!\n');
    
    // Create incident report
    await this.generateIncidentReport({
      type: 'corruption',
      affectedTables: corruptTables,
      downtime: '23 minutes',
      dataLoss: '0 records',
      rootCause: 'TBD - investigate disk failure'
    });
  }
  
  async recoverDeletedData() {
    console.log('📋 Data Recovery Procedure:\n');
    
    // 1. Identify what was deleted
    console.log('1️⃣ Analyzing deletion...');
    const deletedRecords = await this.findDeletedRecordsInWal();
    console.log(`   Found ${deletedRecords.length} deleted records`);
    
    // 2. Check if in recent backup
    console.log('2️⃣ Searching backups...');
    const backup = await this.findBackupContainingRecords(deletedRecords);
    
    if (backup) {
      // 3. Extract specific records from backup
      console.log('3️⃣ Extracting records from backup...');
      const extracted = await this.extractRecordsFromBackup(backup, deletedRecords);
      
      // 4. Re-insert into production
      console.log('4️⃣ Restoring records...');
      await this.insertRecords(extracted);
      
      console.log(`✅ Recovered ${extracted.length} records\n`);
    } else {
      console.log('❌ Records not found in any backup - data lost\n');
      await this.notifyDataLoss(deletedRecords);
    }
  }
  
  async failoverToBackupServer() {
    console.log('📋 Failover Procedure:\n');
    
    // 1. Promote read replica to primary
    console.log('1️⃣ Promoting read replica...');
    await this.promoteReplica('vps-backup.v-edfinance.com');
    
    // 2. Update DNS to point to new primary
    console.log('2️⃣ Updating DNS...');
    await this.updateCloudflareRecord({
      name: 'db.v-edfinance.com',
      type: 'A',
      content: 'vps-backup-ip'
    });
    
    // 3. Update application DATABASE_URL
    console.log('3️⃣ Updating app config...');
    await this.updateEnvironmentVariable('DATABASE_URL', 'postgresql://vps-backup:5432/v_edfinance');
    
    // 4. Restart app servers
    console.log('4️⃣ Restarting applications...');
    await execCommand('ssh vps-backup "docker-compose restart api web"');
    
    // 5. Verify failover success
    console.log('5️⃣ Verifying health...');
    const healthy = await this.verifyAppHealth('https://api.v-edfinance.com/health');
    
    if (healthy) {
      console.log('✅ Failover complete - running on backup server\n');
    } else {
      console.log('❌ Failover failed - escalate to manual intervention\n');
    }
  }
}
```

### 3. Capacity Planning
```typescript
class CapacityPlanner {
  async predictDatabaseGrowth() {
    console.log('📊 Database Capacity Analysis\n');
    
    // Collect growth metrics (last 30 days)
    const metrics = await this.db.query(`
      WITH daily_growth AS (
        SELECT 
          date_trunc('day', created_at) as day,
          count(*) as new_records,
          pg_column_size(metadata) as avg_record_size
        FROM "BehaviorLog"
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
      )
      SELECT 
        avg(new_records) as avg_daily_records,
        avg(avg_record_size) as avg_record_size
      FROM daily_growth
    `);
    
    const avgDailyRecords = metrics[0].avg_daily_records;
    const avgRecordSize = metrics[0].avg_record_size;
    
    // Current database size
    const currentSize = await this.db.query(`
      SELECT pg_size_pretty(pg_database_size('v_edfinance')) as size,
             pg_database_size('v_edfinance') as bytes
    `);
    
    console.log(`Current size: ${currentSize[0].size}`);
    console.log(`Growth rate: ${Math.round(avgDailyRecords)} records/day`);
    console.log(`Avg record size: ${avgRecordSize} bytes\n`);
    
    // Predict future size
    const predictions = [30, 90, 180, 365]; // days
    
    console.log('📈 Growth Projections:');
    for (const days of predictions) {
      const additionalRecords = avgDailyRecords * days;
      const additionalSize = additionalRecords * avgRecordSize;
      const totalSize = currentSize[0].bytes + additionalSize;
      
      console.log(`  ${days} days: ${this.formatBytes(totalSize)}`);
      
      // Warning if approaching VPS disk limit
      const vpsLimit = 100 * 1024**3; // 100 GB
      if (totalSize > vpsLimit * 0.8) {
        console.log(`    ⚠️ Approaching VPS limit - consider archiving strategy`);
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    
    const daysUntilFull = (vpsLimit - currentSize[0].bytes) / (avgDailyRecords * avgRecordSize);
    
    if (daysUntilFull < 90) {
      console.log(`  🔴 URGENT: Disk full in ${Math.round(daysUntilFull)} days`);
      console.log(`     → Implement data archiving immediately`);
      console.log(`     → Move old BehaviorLog records to cold storage (R2)`);
    } else if (daysUntilFull < 180) {
      console.log(`  🟡 Plan archiving strategy (full in ${Math.round(daysUntilFull)} days)`);
    } else {
      console.log(`  🟢 Capacity healthy (full in ${Math.round(daysUntilFull)} days)`);
    }
    
    // Auto-create beads task if urgent
    if (daysUntilFull < 90) {
      await runCommand(`bd create "Implement database archiving strategy" --type task --priority 0`);
    }
  }
}
```

### 4. Proactive Failure Detection
```typescript
class FailurePredictor {
  /**
   * ML-based anomaly detection for database metrics
   */
  async detectAnomalies() {
    // Collect time-series metrics
    const metrics = await this.collectMetrics([
      'queries_per_second',
      'connection_count',
      'cache_hit_ratio',
      'replication_lag',
      'disk_io_wait',
      'checkpoint_frequency'
    ]);
    
    // AI analyzes patterns
    for (const metric of metrics) {
      const anomaly = this.detectAnomaly(metric);
      
      if (anomaly.detected) {
        console.log(`⚠️ Anomaly: ${metric.name}`);
        console.log(`   Current: ${anomaly.current}`);
        console.log(`   Expected: ${anomaly.expected} ± ${anomaly.stddev}`);
        console.log(`   Deviation: ${anomaly.sigma}σ`);
        
        // Auto-remediation
        if (metric.name === 'connection_count' && anomaly.sigma > 3) {
          console.log('   🔧 Auto-fix: Killing idle connections');
          await this.killIdleConnections();
        }
        
        if (metric.name === 'cache_hit_ratio' && anomaly.current < 85) {
          console.log('   🔧 Auto-fix: Increasing shared_buffers');
          await this.adjustSharedBuffers();
        }
      }
    }
  }
}
```

## Integration with Beads

```bash
# Automated DBRE tasks
bd create "Weekly backup verification" --type maintenance --priority 2
bd create "Monthly disaster recovery drill" --type test --priority 2
bd create "Quarterly capacity planning review" --type analysis --priority 3
```

---

**📌 Skill Context**: AI hoạt động như Database Reliability Engineer, tự động backup, detect failures, và execute disaster recovery procedures 24/7.

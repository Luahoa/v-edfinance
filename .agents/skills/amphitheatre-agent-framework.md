# Amphitheatre DevOps Agent Framework

## Mục Đích
Multi-agent orchestration framework cho DevOps, cho phép nhiều AI agents làm việc song song trên các tasks khác nhau với coordination tự động. Giải quyết vấn đề "100 Agent Orchestration" của V-EdFinance.

## Core Concepts

### 1. Agent Roles Definition
```yaml
agents:
  - name: BuildMaster
    role: Build & Compilation
    responsibilities:
      - TypeScript compilation
      - Bundle optimization
      - Asset generation
    skills: [typescript, webpack, vite]
  
  - name: TestGuardian
    role: Quality Assurance
    responsibilities:
      - Unit test execution
      - Integration test orchestration
      - Coverage reporting
    skills: [vitest, ava, playwright]
  
  - name: DeployCommander
    role: Deployment Orchestration
    responsibilities:
      - VPS deployment
      - Cloudflare Pages publish
      - Health verification
    skills: [docker, ssh, cloudflare-api]
  
  - name: DatabaseArchitect
    role: Schema & Optimization
    responsibilities:
      - Prisma migrations
      - Triple-ORM sync (Drizzle + Kysely)
      - Query optimization
    skills: [prisma, drizzle, kysely, postgresql]
  
  - name: MonitoringSentinel
    role: Observability
    responsibilities:
      - Grafana dashboard management
      - Alert rule updates
      - Incident detection
    skills: [prometheus, grafana, alerting]
  
  - name: BackupKeeper
    role: Data Protection
    responsibilities:
      - R2 backup orchestration
      - Recovery testing
      - Retention policy enforcement
    skills: [rclone, pg_dump, cloudflare-r2]
```

### 2. Multi-Agent Coordination

```typescript
// Amphitheatre orchestration engine
class AgentOrchestrator {
  async executeEpic(epic: string) {
    // Epic: "Deploy v2.0.0 to production"
    
    // Phase 1: Parallel Build (NO dependencies)
    await Promise.all([
      BuildMaster.compileApi(),
      BuildMaster.compileWeb(),
      TestGuardian.runUnitTests()
    ]);
    
    // Phase 2: Sequential Quality Gates (DEPENDENCIES exist)
    await TestGuardian.runIntegrationTests(); // After builds
    await TestGuardian.verifyE2ETests();      // After integration
    
    // Phase 3: Parallel Deployment Preparation
    await Promise.all([
      DatabaseArchitect.prepMigration(),
      BackupKeeper.createSnapshot(),
      DeployCommander.validateVpsHealth()
    ]);
    
    // Phase 4: Coordinated Deployment
    await DatabaseArchitect.applyMigration();  // First (schema lock)
    await DeployCommander.deployApi();         // Then (use new schema)
    await DeployCommander.deployWeb();         // Finally (consume new API)
    
    // Phase 5: Verification & Monitoring
    await Promise.all([
      MonitoringSentinel.verifyMetrics(),
      TestGuardian.runSmokeTests(),
      BackupKeeper.finalizeBackup()
    ]);
  }
}
```

### 3. Agent Communication Protocol

```typescript
// Agents communicate via message bus
interface AgentMessage {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: 'task_complete' | 'error' | 'request_help' | 'status_update';
  payload: any;
  beadsTaskId?: string;
}

// Example: DatabaseArchitect → DeployCommander
{
  from: 'DatabaseArchitect',
  to: 'DeployCommander',
  type: 'task_complete',
  payload: {
    migration: 'add_pgvector_extension',
    status: 'success',
    newSchemaHash: 'abc123'
  },
  beadsTaskId: 'ved-9d0'
}
```

### 4. Conflict Resolution

```yaml
# When multiple agents modify same resource
conflict_resolution:
  strategy: lock-based
  
  locks:
    - resource: database_schema
      holder: DatabaseArchitect
      duration: 5 minutes
      auto_release: on_task_complete
    
    - resource: docker-compose.yml
      holder: DeployCommander
      allow_concurrent_reads: true
      write_queue: FIFO
    
    - resource: package.json
      holder: BuildMaster
      notify_on_change:
        - TestGuardian (re-run tests)
        - DeployCommander (rebuild containers)
```

## V-EdFinance Multi-Agent Scenarios

### Scenario 1: Database Optimization Epic (12 Tasks)
```typescript
// Coordinator distributes tasks to specialist agents
async function executeDbOptimizationEpic() {
  // Parallel Phase 1: Analysis (3 agents)
  const [schemaAnalysis, queryAnalysis, indexAnalysis] = await Promise.all([
    DatabaseArchitect.analyzeSchema(),           // ved-296
    DatabaseArchitect.analyzePgStatStatements(), // ved-xyz
    DatabaseArchitect.findMissingIndexes()       // ved-abc
  ]);
  
  // Sequential Phase 2: Implementation (dependencies exist)
  await DatabaseArchitect.implementDrizzleORM();  // ved-aor (base layer)
  await DatabaseArchitect.migrateToTripleORM();   // ved-def (uses Drizzle)
  
  // Parallel Phase 3: Testing (independent tests)
  await Promise.all([
    TestGuardian.testDrizzleQueries(),
    TestGuardian.benchmarkQuerySpeed(),
    TestGuardian.verifyDataIntegrity()
  ]);
  
  // Coordinated Phase 4: Deployment
  await DeployCommander.deployToVpsStaging();     // ved-9d0
  await MonitoringSentinel.setupQueryMonitoring(); // ved-ghi
  
  // Verification Phase 5
  await DatabaseArchitect.validateOptimizations(); // Metrics check
}
```

### Scenario 2: Emergency Incident Response
```typescript
// MonitoringSentinel detects alert → broadcasts to team
async function handleProductionIncident(alert: Alert) {
  // Broadcast to all agents
  MessageBus.broadcast({
    from: 'MonitoringSentinel',
    type: 'emergency',
    payload: { alert, severity: 'P0' }
  });
  
  // Agents auto-respond in parallel
  await Promise.all([
    DeployCommander.checkDeploymentStatus(),      // Recent deploy?
    DatabaseArchitect.checkSlowQueries(),         // DB bottleneck?
    BuildMaster.verifyAssetIntegrity(),           // Build corruption?
    BackupKeeper.prepareRollbackSnapshot()        // Ready to rollback
  ]);
  
  // Coordinator decides remediation based on findings
  const diagnosis = await AgentOrchestrator.diagnose();
  
  if (diagnosis.cause === 'bad_migration') {
    await DatabaseArchitect.rollbackMigration();
  } else if (diagnosis.cause === 'memory_leak') {
    await DeployCommander.restartContainers();
  }
  
  // Post-incident
  await MonitoringSentinel.generateIncidentReport();
  await BeadsIntegration.createPostMortemTask();
}
```

### Scenario 3: 100-Agent Stress Testing
```typescript
// Wave-based agent deployment (from ZERO_DEBT_100_AGENT_ROADMAP.md)
async function deployTestingWaves() {
  // Wave 1: 20 agents (Unit tests)
  const wave1Results = await Promise.all(
    Array(20).fill(null).map((_, i) => 
      TestGuardian.spawnWorker(`unit-test-${i}`).runTests()
    )
  );
  
  // Wave 2: 30 agents (Service tests) - only if Wave 1 passes
  if (wave1Results.every(r => r.success)) {
    const wave2Results = await Promise.all(
      Array(30).fill(null).map((_, i) =>
        TestGuardian.spawnWorker(`service-test-${i}`).runTests()
      )
    );
  }
  
  // Wave 3-5: Integration, E2E, Quality gates (sequential waves)
  // Total: 100 agents coordinated by Amphitheatre
}
```

## Agent Health Monitoring

```yaml
health_checks:
  interval: 30 seconds
  
  metrics:
    - agent_task_completion_rate
    - agent_error_frequency
    - agent_response_latency
    - agent_resource_usage (CPU/RAM)
  
  auto_recovery:
    - stuck_agent: restart after 5 min timeout
    - failed_agent: retry task with different agent
    - resource_exhaustion: scale down concurrent agents
```

## Beads Integration

```typescript
// Amphitheatre tự động sync với Beads
class BeadsIntegration {
  async onTaskStart(agentRole: string, taskId: string) {
    await runCommand(`bd update ${taskId} --status in_progress`);
    await addComment(`Started by ${agentRole} agent`);
  }
  
  async onTaskComplete(agentRole: string, taskId: string, result: any) {
    await runCommand(`bd close ${taskId} --reason "${result.summary}"`);
    await tagTask(taskId, [`agent:${agentRole}`, 'automated']);
  }
  
  async onTaskFailed(agentRole: string, taskId: string, error: Error) {
    await runCommand(`bd update ${taskId} --priority 0`); // Escalate to P0
    await addComment(`Failed by ${agentRole}: ${error.message}`);
    await notifyHuman();
  }
}
```

## Workflow Visualization

```typescript
// Real-time agent activity dashboard
interface AgentDashboard {
  active_agents: {
    BuildMaster: { status: 'busy', task: 'ved-abc', progress: 75 },
    TestGuardian: { status: 'idle', last_task: 'ved-def' },
    DeployCommander: { status: 'waiting', blocked_by: 'DatabaseArchitect' },
    DatabaseArchitect: { status: 'busy', task: 'ved-9d0', progress: 40 },
    MonitoringSentinel: { status: 'monitoring', alerts: 0 },
    BackupKeeper: { status: 'scheduled', next_run: '2025-12-23 00:00' }
  };
  
  task_queue: [
    { id: 'ved-ghi', assigned_to: null, priority: 2 },
    { id: 'ved-jkl', assigned_to: 'BuildMaster', priority: 1 }
  ];
  
  coordination_graph: {
    edges: [
      ['DatabaseArchitect', 'DeployCommander'], // Deploy depends on schema
      ['BuildMaster', 'TestGuardian'],          // Tests depend on builds
      ['DeployCommander', 'MonitoringSentinel'] // Monitoring after deploy
    ]
  };
}
```

## Anti-Patterns Prevention

```yaml
# Amphitheatre enforces coordination rules:
rules:
  - NO two agents modify same file simultaneously
  - NO deployment without quality gate approval
  - NO schema changes without backup
  - NO agent works on P0 task for >15 min (escalate to human)
  - NO cross-agent cyclic dependencies (deadlock prevention)
```

## Success Metrics

- **Coordination Overhead**: <5% (agent idle time)
- **Task Completion Rate**: 95%+ (automated resolution)
- **Human Escalations**: <10% of tasks
- **Parallel Efficiency**: 8x faster than sequential execution
- **Agent Utilization**: 70-85% (optimal range)

---

**📌 Framework Context**: AI agents hoạt động như một DevOps team với 6 specialist roles, tự phối hợp tasks phức tạp qua message bus và dependency graph.

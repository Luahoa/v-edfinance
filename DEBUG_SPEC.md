# Specialized Debug & Diagnostic System (Sandbox)

## 1. Overview
The Debug & Diagnostic Module is an isolated sub-system within V-EdFinance designed for automated testing, performance profiling, and system health monitoring.

## 2. Core Components
- **Diagnostic Engine**: Real-time status checking of DB, AI, and Network.
- **Data Sandbox**: Generator for mock user behaviors and financial events.
- **Stress Tester**: Load testing for Gemini AI context windows and WebSocket broadcasting.
- **Log Tracer**: Correlating `ErrorId` across API and UI logs.

## 3. Technical Requirements
- **Endpoints**: `/api/debug/*` (Protected by Admin/Dev guard).
- **Triggers**: Cron jobs for hourly health checks + Manual triggers for on-demand diagnostics.
- **Visuals**: Admin Dashboard (Frontend) for real-time diagnostic results.

## 4. Maintenance Protocol
1. **Pre-Deployment Check**: Run `Full Diagnostics` before any major release.
2. **Post-Incident Audit**: Use `ErrorId` to trace the root cause in the Diagnostic Hub.
3. **Data Integrity**: Regularly run the `JSONB Validator` to ensure no schema drift.

# Spike: Content Availability Monitoring

**Type:** task  
**Priority:** 0  
**Status:** open  
**Blocks:** ved-spk-yt-epic  
**Created:** 2026-01-04

## Question

Webhook vs Cron for detecting deleted/private YouTube videos? Which is more reliable?

## Time-box

1 hour

## Output Location

`.spikes/youtube/monitoring/`

## Success Criteria

- [ ] Compare webhook vs cron approaches
- [ ] Test YouTube API 404 detection
- [ ] Estimate cost/quota usage
- [ ] Document recommendation

## Investigation Steps

1. Check if YouTube Data API supports webhooks
2. Test video status check endpoint (quotas)
3. Design cron job logic (frequency, batching)
4. Compare cost/latency tradeoffs
5. Recommend approach with rationale

## On Completion

Close with: `bd close ved-spk-yt3 --reason "YES: <approach>" or "NO: <blocker>"`

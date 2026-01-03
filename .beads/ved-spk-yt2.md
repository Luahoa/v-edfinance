# Spike: Ad Blocker Detection

**Type:** task  
**Priority:** 0  
**Status:** open  
**Blocks:** ved-spk-yt-epic  
**Created:** 2026-01-04

## Question

How to detect YouTube embed failure (ad blockers) and show graceful fallback UI?

## Time-box

1 hour

## Output Location

`.spikes/youtube/ad-blocker/`

## Success Criteria

- [ ] Working error boundary component
- [ ] Test with uBlock Origin enabled
- [ ] Fallback message UI design
- [ ] Document detection method

## Investigation Steps

1. Test YouTube embed with uBlock Origin
2. Identify error signature (iframe load failure)
3. Create error boundary with fallback
4. Test error recovery behavior
5. Measure detection accuracy

## On Completion

Close with: `bd close ved-spk-yt2 --reason "YES: <approach>" or "NO: <blocker>"`

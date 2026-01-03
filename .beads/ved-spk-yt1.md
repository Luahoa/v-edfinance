# Spike: Anti-cheat Progress Validation

**Type:** task  
**Priority:** 0  
**Status:** open  
**Blocks:** ved-spk-yt-epic  
**Created:** 2026-01-04

## Question

Can we reliably detect 90% video completion without client-side manipulation (console injection, fast-forward hacks)?

## Time-box

2 hours

## Output Location

`.spikes/youtube/anti-cheat/`

## Success Criteria

- [ ] Working throwaway code with react-player
- [ ] Test console injection attack vectors
- [ ] Server-side duration validation logic
- [ ] Document YES/NO answer with approach

## Investigation Steps

1. Test react-player `onProgress` event reliability
2. Simulate browser tab switching behavior
3. Test console manipulation (e.g., `player.seekTo(999)`)
4. Implement server-side duration comparison
5. Measure false positive/negative rates

## On Completion

Close with: `bd close ved-spk-yt1 --reason "YES: <approach>" or "NO: <blocker>"`

# Lovable Suggestion Template

> **For Lovable AI**: Use this format when suggesting implementations. Antigravity will follow this structure.

---

## Suggestion Format

```markdown
## Feature: [Feature Name]

### Priority
[HIGH / MEDIUM / LOW]

### Module Affected
[Orchestrator / Courses / Project Studio / Interview / DSA / Career Tracker]

### Problem Being Solved
[1-2 sentences on what gap this fills]

### Implementation Approach

#### Files to Create
| File Path | Purpose |
|-----------|---------|
| `path/to/file.ts` | Description |

#### Files to Modify
| File Path | Changes |
|-----------|---------|
| `path/to/existing.py` | What to change |

#### Key Code Logic
```python
# Pseudo-code or real code snippet
def example():
    pass
```

### Expected Behavior
1. When user does X
2. System should Y
3. Result should be Z

### Test Criteria
- [ ] Test case 1: [description]
- [ ] Test case 2: [description]

### Dependencies
- [ ] Pattern: [which pattern file to reference]
- [ ] API: [any external APIs needed]
- [ ] Package: [any new packages]

### Estimated Complexity
[1-10 scale, where 10 = most complex]

### Verification Steps
1. Run: `command to test`
2. Check: [what to verify]
3. Expected: [expected output]
```

---

## Example Suggestion

```markdown
## Feature: Interview Clarification Detection

### Priority
HIGH

### Module Affected
Interview

### Problem Being Solved
Users jump to solutions without asking clarifying questions. Need to detect this and penalize.

### Implementation Approach

#### Files to Modify
| File Path | Changes |
|-----------|---------|
| `backend/agents/interview-coach/main.py` | Add clarification analysis |

#### Key Code Logic
```python
def analyze_clarification(question: str, answer: str) -> dict:
    # Check if answer contains clarifying questions
    clarification_indicators = ["what if", "can you clarify", "do you mean"]
    has_clarification = any(ind in answer.lower() for ind in clarification_indicators)
    return {"has_clarification": has_clarification, "penalty": 0 if has_clarification else -10}
```

### Expected Behavior
1. User receives interview question
2. If user answers without asking clarification → penalty applied
3. If user asks clarifying questions first → bonus applied

### Test Criteria
- [ ] User who jumps to solution gets lower score
- [ ] User who asks "What if..." gets higher score

### Dependencies
- [ ] Pattern: `parlant_journey_pattern.md`

### Estimated Complexity
4

### Verification Steps
1. Run: `curl -X POST localhost:8002/submit_answer -d '{"answer": "I would..."}'`
2. Check: Response includes `clarification_score`
3. Expected: Score < 50 for non-clarifying answer
```

---

## Rules for Lovable

1. **Always check CURRENT_STATE.md** before suggesting
2. **Reference pattern files** when suggesting implementations
3. **One feature per suggestion** - don't bundle
4. **Include test criteria** - Antigravity needs verification steps
5. **Check Git commits** after each session to see what was implemented

# .rules Folder Documentation

## Purpose

This folder contains **rules and guidance for AI coding agents** working on the RFQ Buddy project. These files guide agents to write **production-ready, well-engineered code** following industry best practices while maintaining consistency across the project.

---

## Folder Structure

```
.rules/
├── README.md                    # This file - explains the folder
├── AGENT_RULES.md               # Strict coding rules for AI agents
├── PROJECT_STRUCTURE.md         # Complete project file/folder structure
├── TASK_PLAN_PHASE1.md          # Phase 1 micro-tasks (Backend setup)
├── TASK_PLAN_PHASE2.md          # Phase 2 micro-tasks (Tender core)
├── TASK_PLAN_PHASE3.md          # Phase 3 micro-tasks (Vendor & Bid)
├── TASK_PLAN_PHASE4.md          # Phase 4 micro-tasks (Evaluation)
├── TASK_PLAN_PHASE5.md          # Phase 5 micro-tasks (Notifications)
├── TASK_PLAN_PHASE6.md          # Phase 6 micro-tasks (Export & Polish)
├── TASK_PLAN_PHASE7.md          # Phase 7 micro-tasks (Frontend)
│
└── [Svelte Documentation Files]
    ├── llms.txt                 # SvelteKit documentation
    ├── svelte-llms.txt          # Svelte documentation
    ├── kit-llms.txt             # SvelteKit specific
    ├── cli-llms.txt             # Svelte CLI documentation
    ├── mcp-llms.txt             # Svelte MCP documentation
    └── llms-full.txt            # Complete Svelte docs
```

---

## How to Use These Files

### For Supervisors (You)

1. **Start each session** by copying the SYSTEM PROMPT from the task plan file to the AI agent
2. **Give ONE task at a time** - copy the exact PROMPT TO AGENT section
3. **Verify completion** using the checklist after each task
4. **Mark status** in the task plan (⬜ → ✅ or ❌)
5. **Move to next task** only after verification passes

### For AI Coding Agents

The agents should:
1. Read `AGENT_RULES.md` first (included in system prompt)
2. Apply **better engineering practices** over strict copying
3. Follow code patterns as **production-ready templates**
4. Create files at specified paths with proper structure
5. Choose superior technologies when they provide clear benefits
6. Document engineering decisions and trade-offs
7. Ensure code compiles, passes linting, and is production-ready
8. Respond "✅ DONE" with summary or "❌ BLOCKED: [reason]"

---

## File Descriptions

### AGENT_RULES.md
Contains:
- Core principles (better engineering over strict copying)
- Production tech stack with justifications
- File naming conventions
- Production-ready code templates
- Security best practices
- Error handling patterns
- Import order rules
- Code quality requirements
- Testing approaches
- Task completion checklist

**Usage:** Include this in every agent's system prompt. This defines the **engineering philosophy** of the project.

### PROJECT_STRUCTURE.md
Contains:
- Complete directory tree for frontend & backend
- Key file purposes
- Route → Page mapping
- API endpoint list
- Store structure definitions
- Environment variable templates

**Usage:** Reference when agent needs to know where files go.

### TASK_PLAN_PHASE*.md
Contains:
- System prompt for that phase
- Numbered micro-tasks (1.1, 1.2, etc.)
- Each task has:
  - Status tracking (⬜/✅/❌)
  - Task description and goals
  - Expected output and functionality
  - Verification checklist
  - Engineering decisions documentation
  - Remarks section for notes
- Phase completion checklist
- Verification commands

**Usage:** Work through tasks sequentially. Never skip.

---

## Workflow Example

### Starting Phase 1

1. Open `TASK_PLAN_PHASE1.md`
2. Ensure agent has read `AGENT_RULES.md` (better engineering philosophy)
3. Provide task goals and requirements to agent
4. Agent implements with production-ready code
5. Wait for "✅ DONE" response with engineering decisions
6. Verify using the checklist (build, lint, functionality)
7. Mark status: ⬜ → ✅
8. Review and document any deviations with justifications
9. Move to next task
10. Run final verification commands after phase complete

### If Agent Gets Stuck

If agent responds "❌ BLOCKED":
1. Read the reason and what was attempted
2. Provide clarification or additional context
3. If it's an engineering decision, discuss alternatives
4. Re-issue with guidance
5. If persistent issue, mark ❌ and document in REMARKS

### If Agent Makes Mistakes

1. Review what was implemented vs expected
2. Check if the approach is actually better engineering
3. If genuinely wrong, provide specific corrections
4. If it's a superior approach, update expectations
5. Document the decision and reasoning
6. Mark task with engineering notes

---

## Task Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed successfully |
| ❌ | Failed - needs retry |
| ⏸️ | Blocked - waiting for clarification |

---

## Svelte Documentation Files

These `.txt` files contain official Svelte/SvelteKit documentation optimized for LLMs:

| File | Content | Size |
|------|---------|------|
| `llms.txt` | Abridged SvelteKit docs | Medium |
| `svelte-llms.txt` | Core Svelte docs | Medium |
| `kit-llms.txt` | SvelteKit specific | Medium |
| `llms-full.txt` | Complete documentation | Large |
| `cli-llms.txt` | CLI tools | Small |
| `mcp-llms.txt` | MCP documentation | Small |

**Usage:** Include relevant sections when agent needs Svelte guidance.

---

## Important Notes

1. **Production-ready code** - agents apply best practices and engineering judgment
2. **Better over exact** - superior technologies/patterns are encouraged
3. **Verify comprehensively** - build, lint, functionality, security
4. **Document decisions** - especially when deviating from original specs
5. **Don't skip phases** - each builds on the previous
6. **Keep files in sync** - update plans to reflect actual implementation
7. **Engineering evolution** - plans may be updated as better approaches are discovered

---

## Updating These Files

If you need to modify the plans:
1. Update the specific task in the phase file
2. Document why the change improves engineering quality
3. Reset status to ⬜ if re-execution needed
4. Update related tasks that depend on this change
5. Ensure downstream tasks are compatible
6. Add notes explaining the engineering decision

---

## Contact

For questions about this system, refer to:
- `Instructions/RFQ_Developer_Coding_Plan.md` - Full development plan
- `Instructions/RFQ_Tendering_Platform_Technical_PRD_v3.md` - Product requirements
- `Instructions/README.md` - Project overview
#!/usr/bin/env python3
"""
Kilo Mode → Zed Profile Converter
Reads .kilocode/Modes/*.yaml and generates Zed settings.json profiles section
"""

import json
import yaml
from pathlib import Path
from typing import Dict, List, Any

# Project root (adjust if needed)
PROJECT_ROOT = Path(__file__).parent.parent

# Model mapping: Kilo → Zed
MODEL_MAP = {
    # DeepSeek
    ("deepseek", "deepseek-reasoner"): {
        "provider": "deepseek",
        "model": "deepseek-reasoner"
    },
    
    # Anthropic (via Copilot or direct)
    ("vscode-lm", "claude-opus-4.6"): {
        "provider": "anthropic",
        "model": "claude-opus-4-6-20251101"
    },
    ("vscode-lm", "claude-opus-4.5"): {
        "provider": "anthropic",
        "model": "claude-opus-4-5-20251101"
    },
    ("vscode-lm", "claude-sonnet-4.5"): {
        "provider": "anthropic",
        "model": "claude-sonnet-4-5-20250929"
    },
    ("vscode-lm", "claude-haiku-4.5"): {
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001"
    },
    
    # OpenRouter models
    ("openrouter", "qwen/qwen3-coder-next"): {
        "provider": "openrouter",
        "model": "qwen/qwen3-coder-next"
    },
    ("openrouter", "minimax/minimax-m2.1"): {
        "provider": "openrouter",
        "model": "minimax/minimax-m2.1"
    },
    ("openrouter", "minimax/minimax-m2"): {
        "provider": "openrouter",
        "model": "minimax/minimax-m2"
    },
    
    # Moonshot
    ("moonshot", "kimi-k2-0905-preview"): {
        "provider": "openai_compatible/MoonShot",
        "model": "kimi-k2.5"
    },
    
    # Fallback to GLM-4.7 (your default)
    ("unknown", "unknown"): {
        "provider": "openai_compatible/Z.AI",
        "model": "glm-4.7"
    }
}

# Tool group translation
def translate_groups(groups: List) -> Dict[str, bool]:
    """Convert Kilo tool groups to Zed tool flags"""
    tools = {
        "read_file": False,
        "edit_file": False,
        "fetch": False,
        "diagnostics": False,
        "terminal": False,
        "create_directory": False,
        "delete_path": False,
        "move_path": False
    }
    
    for item in groups:
        if isinstance(item, str):
            group = item
            options = None
        elif isinstance(item, list) and len(item) >= 2:
            group = item[0]
            options = item[1] if isinstance(item[1], dict) else None
        else:
            continue
            
        if group == "read":
            tools["read_file"] = True
            tools["diagnostics"] = True
        elif group == "edit":
            tools["edit_file"] = True
            if not options or "fileRegex" not in options:
                # Full edit permissions
                tools["create_directory"] = True
                tools["delete_path"] = True
                tools["move_path"] = True
            # else: fileRegex restriction (handled via tool_permissions)
        elif group == "command":
            tools["terminal"] = True
        elif group == "browser":
            tools["fetch"] = True
        elif group == "mcp":
            # Handled separately via enable_all_context_servers
            pass
    
    return tools

def get_model_for_mode(mode_slug: str, kilo_settings: Dict) -> Dict[str, str]:
    """Look up model config for a mode from kilo-code-settings.json"""
    try:
        provider_profiles = kilo_settings.get("providerProfiles", {})
        mode_configs = provider_profiles.get("modeApiConfigs", {})
        api_configs = provider_profiles.get("apiConfigs", {})
        
        config_id = mode_configs.get(mode_slug)
        if not config_id:
            return MODEL_MAP[("unknown", "unknown")]
        
        config = api_configs.get(config_id, {})
        provider = config.get("apiProvider", "unknown")
        
        if provider == "vscode-lm":
            selector = config.get("vsCodeLmModelSelector", {})
            model = selector.get("family", "unknown")
        elif provider == "deepseek":
            model = config.get("apiModelId", "unknown")
        elif provider == "openrouter":
            model = config.get("openRouterModelId", "unknown")
        elif provider == "moonshot":
            model = config.get("apiModelId", "unknown")
        else:
            model = "unknown"
        
        return MODEL_MAP.get((provider, model), MODEL_MAP[("unknown", "unknown")])
    
    except Exception as e:
        print(f"Warning: Could not determine model for {mode_slug}: {e}")
        return MODEL_MAP[("unknown", "unknown")]

def add_rfq_buddy_rules(instructions: str) -> str:
    """Append RFQ Buddy-specific rules to instructions"""
    # Try to read the auto-context file
    context_file = PROJECT_ROOT / "AGENT_AUTO_CONTEXT.md"
    if context_file.exists():
        try:
            with open(context_file, 'r', encoding='utf-8') as f:
                rules_content = f.read().strip()
            # Add a header to distinguish from existing instructions
            rules_appendix = f"""

### RFQ Buddy Project Rules (MANDATORY - Auto-loaded from AGENT_AUTO_CONTEXT.md)

{rules_content}
"""
            return (instructions or "").strip() + rules_appendix
        except Exception as e:
            print(f"Warning: Could not read AGENT_AUTO_CONTEXT.md: {e}")
            # Fall back to hardcoded rules
            pass
    
    # Fallback to hardcoded rules if file not found or error
    rules_appendix = """

### RFQ Buddy Project Rules (MANDATORY)

BEFORE starting any task:
1. Read /rules.md (generic multi-agent rules)
2. Read /rfq-buddy-rules.md (project-specific rules)
3. Read /skills/README.md (skills system)

### Critical Facts
- Database spelling: ALWAYS `organizations` (American), NEVER `organisations` (British)
- Architecture: Routes → Middleware → Controllers → Services → Database (no shortcuts)
- Frontend: +page.svelte → $lib/stores → $lib/utils/api.ts → Backend
- Next migration: 015 (migrations 001–014 exist)
- Protected: tenderTypeSelector.service.ts (extend only, never rewrite)

### Verification (after every change)
```
cd backend && npm run build && npm run lint && npm test
cd frontend && npm run build && npm run check
```
"""
    return (instructions or "").strip() + rules_appendix

def convert_mode_to_profile(mode_data: Dict, kilo_settings: Dict) -> Dict[str, Any]:
    """Convert a single Kilo mode to Zed profile format"""
    mode = mode_data["customModes"][0]  # YAML has single mode per file
    slug = mode["slug"]
    
    profile = {
        "name": mode["name"],
        "model": get_model_for_mode(slug, kilo_settings),
        "tools": translate_groups(mode.get("groups", [])),
        "enable_all_context_servers": "mcp" in str(mode.get("groups", [])),
        "context_servers": {},
        "role": mode.get("roleDefinition", ""),
        "instructions": add_rfq_buddy_rules(mode.get("customInstructions", ""))
    }
    
    # Add tool_permissions for file-regex edit restrictions
    for item in mode.get("groups", []):
        if isinstance(item, list) and len(item) >= 2:
            group, options = item[0], item[1]
            if group == "edit" and isinstance(options, dict) and "fileRegex" in options:
                # Invert the regex: deny everything EXCEPT the pattern
                file_regex = options["fileRegex"]
                profile["tool_permissions"] = {
                    "edit_file": {
                        "always_deny": [
                            {"pattern": f"^(?!.*{file_regex}).*$"}
                        ]
                    }
                }
    
    return profile

def main():
    """Main conversion function"""
    modes_dir = PROJECT_ROOT / ".kilocode" / "Modes"
    settings_file = modes_dir / "kilo-code-settings.json"
    
    # Load Kilo settings for model mappings
    with open(settings_file) as f:
        kilo_settings = json.load(f)
    
    # Convert all mode YAML files
    profiles = {}
    for yaml_file in modes_dir.glob("*-export.yaml"):
        if yaml_file.name == "kilo-code-settings.json":
            continue
        
        print(f"Converting {yaml_file.name}...")
        with open(yaml_file) as f:
            mode_data = yaml.safe_load(f)
        
        if not mode_data or "customModes" not in mode_data:
            print(f"  Skipping (no customModes)")
            continue
        
        mode = mode_data["customModes"][0]
        slug = mode["slug"]
        
        profile = convert_mode_to_profile(mode_data, kilo_settings)
        profiles[slug] = profile
        print(f"  [OK] Converted {slug}")
    
    # Output JSON for Zed settings.json
    output = {
        "agent": {
            "profiles": profiles
        }
    }
    
    output_file = PROJECT_ROOT / ".zed" / "generated-profiles.json"
    output_file.parent.mkdir(exist_ok=True)
    
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n[SUCCESS] Generated {len(profiles)} profiles")
    print(f"[FILE] Output: {output_file}")
    print("\nNext steps:")
    print("1. Copy the 'profiles' section from generated-profiles.json")
    print("2. Merge into your ~/.config/zed/settings.json under agent.profiles")
    print("3. Restart Zed")

if __name__ == "__main__":
    main()

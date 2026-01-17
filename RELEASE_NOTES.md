# Release Notes

## [0.5.0] - 2026-01-17

### 🚀 New Features

#### **Smart Hero Injection (Auto-Consistency)**
- **Intelligent Context Awareness**: The Studio now automatically detects when your prompt conflicts with the active Hero character (e.g., asking for a "Sloth Couple" while "Joe" is the active hero).
- **Auto-Exclusion**: If a conflict is found, the system intelligently excludes the Hero to respect your specific subject request.
- **Ambiguity Handling**: For generic prompts like "Walking in the park", the Hero is still automatically included.
- **Manual Override**: You can still force the Hero into any scene by setting "Hero Presence" to 100% in the toolbar.

#### **Hero Lab & Vault Integration**
- **Direct Transfer**: Seamlessly send Hero Reference Cards from Hero Lab to the Coloring Studio.
- **Vault Storage**: Projects are now saved to the Supabase Vault with full metadata (Character DNA, Style Lock).
- **Style Locking**: Heroes now carry their visual style preference (DNA) into the Studio.

### ✨ Improvements
- **Magic Edit Popup**: Enhanced image editing experience with a dedicated popup and chat interface.
- **UI Polish**: Updated Dashboard icons, renamed "Paint by Numbers" to "Color by Numbers", and refined various UI elements.
- **Logo Update**: New "myjoe" brand logo integrated across the application.

### 🐛 Bug Fixes
- **Sloth/Human Hybrid Fix**: Resolved issue where "Hero" mode was overriding specific subject prompts (like Sloths).
- **Transfer Errors**: Fixed 400/406 errors when transferring images between Lab and Studio.
- **Supabase Connectivity**: Resolved RLS recursion issues and missing `dna` columns.

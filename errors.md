
# 1. What we did last time (The "Junior" Mistake)
In V1, we simply wrote this inside `page.tsx`:
```tsx
import Editor from "@monaco-editor/react"; // 🚨 THE TRAP
```
**What happened:** 
Next.js tried to be "helpful." It said, *"I'll turn this page into HTML on my Server (Node.js) before I send it to the user."*

When the Server reached that `import` line, the **Monaco Library** woke up and immediately screamed: *"Where is the screen? Where is the mouse? I need the `window` object!"*

Since the Server has no `window`, the app crashed with: 
**`ReferenceError: window is not defined`**

---

# 2. How we fixed it last time (The "Hotfix")
We realized that `"use client"` was not enough. (Even with `"use client"`, Next.js still *tries* to run a little bit of the code on the server to make the initial HTML).

We had to use **Dynamic Imports**. We wrote:
```tsx
const Editor = dynamic(() => import("./Editor"), { ssr: false });
```
This was like a "Do Not Disturb" sign for the Server. It told the server to skip that line entirely.

---

### 3. How we are doing it NOW (The "Senior" Architecture)
In **Coda 2.0**, we are creating a **Modular Shield**. We aren't just putting a fix in `page.tsx`. We are creating a **Feature Folder**.

**The New Structure:**
1.  **`CodeEditor.tsx` (The Worker):** This file contains the actual Monaco logic. It is marked `"use client"`.
2.  **`EditorWrapper.tsx` (The Shield):** This file's **only job** is to import the "Worker" using `ssr: false`.
3.  **`page.tsx` (The Manager):** This file only talks to the "Shield." It never even sees the "Worker."



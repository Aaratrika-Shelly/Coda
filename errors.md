
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

---
---


### Fault 1: The Race Condition (Timing)
**What happened in V1:** We tried to initialize the sync logic inside a standard React `useEffect`. 
**The Problem:** Monaco Editor is a massive library. React might say "The component is ready," but Monaco hasn't finished drawing the text area yet. 
**The Crash:** You saw `TypeError: Cannot read properties of null (reading 'getModel')`. You were trying to grab the "Hands" (Monaco) before the "Body" was finished growing.
**The V2 Fix:** We split the logic. We start the **Network** in `useEffect`, but we wait for the **`onMount`** callback to start the **Binding**. This ensures the editor is 100% ready before we touch it.

---

### Fault 2: The Stale Closure (Memory)
**What happened in V1:** We used React `useState` to track the code and the socket.
**The Problem:** React hooks "capture" the value of variables at the moment they are created. If you have a socket listener waiting for code updates, it might be looking at an old version of your variables from 5 minutes ago.
**The Result:** You saw text duplicating or disappearing because the listener was "frozen in time."
**The V2 Fix:** We use **`useRef`**. A Ref is like a "Magic Box." Even if the component re-renders, the box stays the same, and the contents inside are always the absolute latest version.

---

### Fault 3: The Cursor Dance (Sync Strategy)
**What happened in V1:** We used `socket.emit("update", fullCodeString)`. 
**The Problem:** Every time a user typed a single letter, you sent the **entire file** over the internet. When the other user received it, you called `editor.setValue()`. 
**The Result:** `setValue()` wipes the editor clean and replaces it. This resets the cursor to the top of the file and destroys the "Undo" (Ctrl+Z) history.
**The V2 Fix:** We use **Yjs (CRDTs)**. Instead of strings, we send **Binary Deltas** (instructions like "Insert 'A' after ID #105"). Yjs uses Monaco's `applyEdits` API, which surgically inserts characters without touching the rest of the file. Your cursor stays put because its "neighbor" characters didn't move.

---
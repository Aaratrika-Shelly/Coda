"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { KeyCode, KeyMod } from "monaco-editor";

type CodeEditorProps = {
  roomId: string;
  onStatusChange: (status: "connecting" | "connected" | "disconnected"|"synced") => void;
};

export function CodeEditor({ roomId, onStatusChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null); // Holds Monaco editor
  const docRef = useRef<Y.Doc | null>(null); // Holds Y.Doc
  const providerRef = useRef<WebsocketProvider | null>(null); // Holds WebSocket provider
  const isApplyingRemoteChange = useRef(false);
  const undoManagerRef = useRef<Y.UndoManager | null>(null)



  useEffect(() => {
    const ydoc = new Y.Doc();

    const yText = ydoc.getText("monaco");

    const undoManager = new Y.UndoManager(yText, {
      trackedOrigins: new Set(["monaco"])
    });
    undoManagerRef.current = undoManager;

        

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    );

    const statusHandler = (event: any) => {
      onStatusChange(event.status);
    };
    provider.on("status", statusHandler);

    docRef.current = ydoc;
    providerRef.current = provider;

    return () => {
      if(providerRef.current) {
        provider.off("status", statusHandler); 
        undoManagerRef.current?.destroy();
        provider.destroy();
        ydoc.destroy();
      }
    };
  }, [roomId, onStatusChange]);
    
  const handleEditorDidMount = (editor: any) => {

    // Save the Monaco editor instance
    editorRef.current = editor;

    if (docRef.current && providerRef.current) {
      // Get the shared text from the Y.Doc
      const yText = docRef.current.getText("monaco");
      const provider = providerRef.current;
      const model = editor.getModel();

      if (!model) return;

    const syncEditor = () => {
      const contentFromDB = yText.toString();
      if (contentFromDB && editor.getValue() !== contentFromDB) {
        isApplyingRemoteChange.current = true;
        editor.setValue(contentFromDB);
        isApplyingRemoteChange.current = false;
      }
    };

    // 1. If it's already synced (missed the event), catch up now
    if (provider.synced) {
      syncEditor();
    } else {
      // 2. Otherwise, wait for the event
      provider.once("sync", syncEditor);
    }

      // -------------------------------
      // Local (Monaco) -> Remote (Yjs)
      // -------------------------------

      // Listen for local edits in Monaco
      editor.onDidChangeModelContent((event: any) => {
        // Ignore edits that originated from a remote update
        if (isApplyingRemoteChange.current) {
          return;
        }

        docRef.current?.transact(() => {
          event.changes.forEach((change: any) => {
            // Delete replaced/removed text
            if (change.rangeLength > 0) {
              yText.delete(change.rangeOffset, change.rangeLength);
            }

            // Insert newly typed text
            if (change.text.length > 0) {
              yText.insert(change.rangeOffset, change.text);
            }
          });
        }, "monaco");
      });

      // ---------------------------------
      // Remote (Yjs) -> Local (Monaco)
      // ---------------------------------


      yText.observe((event) => {

        if (event.transaction.origin === "monaco") {
          return;
        }

        isApplyingRemoteChange.current = true;

        
        try {
          let offset = 0;
          const edits: any[] = [];

          event.delta.forEach((op: any) => {
          // Skip retained characters
          if (op.retain) {
            offset += op.retain;
          }

          // Handle insert
          if (op.insert) {
            const pos = model.getPositionAt(offset);

            edits.push({
              range: {
                startLineNumber: pos.lineNumber,
                startColumn: pos.column,
                endLineNumber: pos.lineNumber,
                endColumn: pos.column,
              },
              text: op.insert,
            });

            offset += op.insert.length;
          }
          // Handle delete
          if (op.delete) {
            const start = model.getPositionAt(offset);
            const end = model.getPositionAt(offset + op.delete);

            edits.push({
              range: {
                startLineNumber: start.lineNumber,
                startColumn: start.column,
                endLineNumber: end.lineNumber,
                endColumn: end.column,
              },
              text: "",
            });
          }
        });



          if (edits.length > 0) {
            editor.executeEdits("yjs", edits);
          }
        }
          finally {
          isApplyingRemoteChange.current = false;
        }
      });

      // -----------------------------
      // Undo (Ctrl+Z / Cmd+Z)
      // -----------------------------
      const undoCommand = editor.addCommand(
        KeyMod.CtrlCmd | KeyCode.KeyZ,
        () => {
          undoManagerRef.current?.undo();
        }
      );

      // -----------------------------
      // Redo (Ctrl+Y / Cmd+Y)
      // -----------------------------
      editor.addCommand(
        KeyMod.CtrlCmd | KeyCode.KeyY,
        () => {
          undoManagerRef.current?.redo();
        }
      );

      editor.addCommand(
        KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ,
        () => {
          undoManagerRef.current?.redo();
        }
      );


      // -----------------------------
      // User Awareness
      // -----------------------------
      const colors = [
        "#30bced",
        "#6eeb83",
        "#ffbc42",
        "#ecd444",
        "#ee6352",
        "#9ac2c9",
      ];

      const randomColor =
        colors[Math.floor(Math.random() * colors.length)];

      provider.awareness.setLocalStateField("user", {
        name: `User ${Math.floor(Math.random() * 100)}`,
        color: randomColor,
      });

      // -----------------------------
      // Broadcast cursor position
      // -----------------------------
      editor.onDidChangeCursorPosition(() => {
        const position = editor.getPosition();
        if (!position) return;

        const offset = model.getOffsetAt(position);

        provider.awareness.setLocalStateField("cursor", {
          offset,
        });
      });

      // -----------------------------
      // Draw remote cursors
      // -----------------------------
      let decorationIds: string[] = [];

      provider.awareness.on("change", () => {
        const decorations: any[] = [];

        provider.awareness.getStates().forEach((state: any, clientId: number) => {
          // Ignore ourselves
          if (clientId === provider.awareness.clientID) return;

          if (!state.cursor) return;

          const position = model.getPositionAt(state.cursor.offset);

          decorations.push({
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            options: {
              className: "remote-cursor",
            },
          });
        });

        decorationIds = editor.deltaDecorations(
          decorationIds,
          decorations
        );
      });
    }
  };

  return (
    <div className="h-full w-full">

    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage="javascript"
      onMount={handleEditorDidMount}
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        automaticLayout:true,
      }}
    />
    </div>
  );
}
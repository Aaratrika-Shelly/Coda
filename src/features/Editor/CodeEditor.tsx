"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

type CodeEditorProps = {
  roomId: string;
};

export function CodeEditor({ roomId }: CodeEditorProps) {
  const editorRef = useRef<any>(null); // Holds Monaco editor
  const docRef = useRef<Y.Doc | null>(null); // Holds Y.Doc
  const providerRef = useRef<WebsocketProvider | null>(null); // Holds WebSocket provider
  const bindingRef = useRef<MonacoBinding | null>(null); // binds Monaco and Yjs


  useEffect(() => {
    const ydoc = new Y.Doc();
    

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    );

    docRef.current = ydoc;
    providerRef.current = provider;

    return () => {
        bindingRef.current?.destroy();
        providerRef.current?.destroy();
        docRef.current?.destroy();
    };
  }, [roomId]);
    const handleEditorDidMount = (editor: any) => {
    // Save the Monaco editor instance
    editorRef.current = editor;
    
    if (docRef.current && providerRef.current) {

        // Get the shared text from the Y.Doc
        const yText = docRef.current!.getText("monaco");

        // Bind Monaco <-> Yjs
        bindingRef.current = new MonacoBinding(
            yText,
            editor.getModel()!,
            new Set([editor]),
            providerRef.current!.awareness
        );

        // Pick random color
        const colors = ['#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352', '#9ac2c9'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        providerRef.current.awareness.setLocalStateField('user', {
        name: 'User ' + Math.floor(Math.random() * 100),
        color: randomColor });

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
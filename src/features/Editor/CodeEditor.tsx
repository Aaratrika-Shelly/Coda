"use client";

import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  roomId: string;
};

export function CodeEditor({ roomId }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage="javascript"
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 14,
      }}
    />
  );
}
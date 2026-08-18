import dynamic from "next/dynamic";

const CodeEditor = dynamic(
  () =>
    import("./CodeEditor").then((mod) => ({
      default: mod.CodeEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-400">
        Loading Editor...
      </div>
    ),
  }
);

type EditorWrapperProps = {
  roomId: string;
  onStatusChange: (status: string) => void;
};

export function EditorWrapper({ roomId, onStatusChange }: EditorWrapperProps) {
  return <CodeEditor roomId={roomId} onStatusChange={onStatusChange} />; // prop forwarding
}
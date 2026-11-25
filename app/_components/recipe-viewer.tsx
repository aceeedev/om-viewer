"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { readPhotoMetadata } from "@/lib/exif";
import { buildRecipe, type Recipe } from "@/lib/recipe";
import { DropZone } from "./drop-zone";
import { FullView } from "./full-view";
import { exposureSummary } from "./sections";
import { SimpleView } from "./simple-view";

type ViewerState =
  | { status: "idle" }
  | { status: "reading"; fileName: string }
  | { status: "error"; fileName: string; message: string }
  | { status: "ready"; fileName: string; recipe: Recipe; previewUrl: string };

type View = "simple" | "full";

/**
 * Upload a photo and show its recipe. Everything happens in the browser: the file is read
 * with the File API and never sent anywhere.
 */
export function RecipeViewer() {
  const [state, setState] = useState<ViewerState>({ status: "idle" });
  const [view, setView] = useState<View>("simple");
  const [dragging, setDragging] = useState(false);
  const latestRequest = useRef(0);

  // Free the preview's object URL when it's replaced or the viewer unmounts.
  const previewUrl = state.status === "ready" ? state.previewUrl : null;
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const openFile = useCallback(async (file: File) => {
    const request = ++latestRequest.current;
    setState({ status: "reading", fileName: file.name });
    try {
      const result = await readPhotoMetadata(file);
      if (request !== latestRequest.current) return; // a newer file was chosen meanwhile
      if (!result.ok) {
        setState({ status: "error", fileName: file.name, message: result.error.message });
        return;
      }
      const recipe = buildRecipe(result.metadata);
      setState({ status: "ready", fileName: file.name, recipe, previewUrl: URL.createObjectURL(file) });
    } catch {
      if (request !== latestRequest.current) return;
      setState({ status: "error", fileName: file.name, message: "Something went wrong reading this photo." });
    }
  }, []);

  // Accept files dropped anywhere on the page (and stop the browser from opening them).
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) void openFile(file);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [openFile]);

  if (state.status !== "ready") {
    return (
      <div className="flex flex-col gap-4">
        <DropZone onFile={openFile} dragging={dragging} busy={state.status === "reading"} />
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            <span className="font-medium">{state.fileName}:</span> {state.message}
          </p>
        )}
      </div>
    );
  }

  const { recipe, fileName } = state;
  const cameraLine = [recipe.camera.model, recipe.lens.model].filter(Boolean).join(" · ");
  const summary = exposureSummary(recipe);

  return (
    // Wide screens: the photo and its details on the left, staying in view while the recipe on the
    // right scrolls. Narrow screens: the photo on top, the recipe below.
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
        {/* A local blob: URL, so next/image's optimizer has nothing to do here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.previewUrl}
          alt={`Preview of ${fileName}`}
          className="max-h-[70vh] w-full rounded-lg bg-zinc-100 object-contain dark:bg-zinc-900"
        />
        <header className="flex flex-col gap-1">
          <p className="break-all font-mono text-sm text-zinc-500 dark:text-zinc-400">{fileName}</p>
          {cameraLine && <p className="font-medium">{cameraLine}</p>}
          {summary && <p className="text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>}
        </header>
        <DropZone onFile={openFile} dragging={dragging} compact />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div role="group" aria-label="View" className="inline-flex self-start rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
          <ViewButton current={view} value="simple" onSelect={setView}>
            Simple
          </ViewButton>
          <ViewButton current={view} value="full" onSelect={setView}>
            Full details
          </ViewButton>
        </div>

        {view === "simple" ? <SimpleView recipe={recipe} /> : <FullView recipe={recipe} />}
      </div>
    </div>
  );
}

function ViewButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: View;
  value: View;
  onSelect: (view: View) => void;
  children: ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
      }
    >
      {children}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Recipe } from "@/lib/recipe";
import { DropZone } from "./drop-zone";
import { FullView } from "./full-view";
import { loadPhotoFile, loadPhotoUrl, type LoadResult } from "./load-photo";
import { exposureSummary } from "./sections";
import { SimpleView } from "./simple-view";

type ViewerState =
  | { status: "idle" }
  | { status: "reading"; fileName: string }
  | { status: "error"; fileName: string; message: string }
  | { status: "ready"; fileName: string; recipe: Recipe; previewUrl: string };

type View = "simple" | "full";

/**
 * Open a photo and show its recipe. Everything happens in the browser: a file is read with the
 * File API, a pasted link is downloaded by the browser itself, and the photo is never sent anywhere.
 */
export function RecipeViewer() {
  const [state, setState] = useState<ViewerState>({ status: "idle" });
  const [view, setView] = useState<View>("simple");
  const [dragging, setDragging] = useState(false);
  /** The photo being opened. Aborted when another one replaces it, so stale results are dropped. */
  const inFlight = useRef<AbortController | null>(null);

  // Free the preview's object URL when it's replaced or the viewer unmounts.
  const previewUrl = state.status === "ready" ? state.previewUrl : null;
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const open = useCallback(async (label: string, load: (signal: AbortSignal) => Promise<LoadResult>) => {
    inFlight.current?.abort(); // stops a link that's still downloading
    const controller = new AbortController();
    inFlight.current = controller;
    setState({ status: "reading", fileName: label });
    const result = await load(controller.signal);
    if (controller.signal.aborted) return; // a newer photo was opened meanwhile, or the viewer unmounted
    setState(
      result.ok
        ? { status: "ready", fileName: result.fileName, recipe: result.recipe, previewUrl: URL.createObjectURL(result.file) }
        : { status: "error", fileName: result.fileName, message: result.message },
    );
  }, []);

  const openFile = useCallback((file: File) => open(file.name, () => loadPhotoFile(file)), [open]);
  const openUrl = useCallback((url: string) => open(url.trim(), (signal) => loadPhotoUrl(url, signal)), [open]);

  useEffect(() => () => inFlight.current?.abort(), []);

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
        <DropZone onFile={openFile} onUrl={openUrl} dragging={dragging} busy={state.status === "reading"} />
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-md border-[1.5px] border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {/* wrap-anywhere: a pasted link has no spaces to break at. */}
            <span className="font-medium wrap-anywhere">{state.fileName}:</span> {state.message}
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
          className="max-h-[70vh] w-full rounded-md bg-zinc-100 object-contain"
        />
        <header className="flex flex-col gap-1">
          <p className="break-all font-mono text-sm text-zinc-500">{fileName}</p>
          {cameraLine && <p className="font-medium">{cameraLine}</p>}
          {summary && <p className="text-sm text-zinc-600">{summary}</p>}
        </header>
        <DropZone onFile={openFile} onUrl={openUrl} dragging={dragging} compact />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div role="group" aria-label="View" className="flex gap-8 border-b border-zinc-200">
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
        // Tabs, as on OM System's pages: bold names, a bar under the one that's showing.
        "-mb-px border-b-[3px] pt-1 pb-2.5 font-bold transition-colors " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black " +
        (active ? "border-black text-black" : "border-transparent text-zinc-500 hover:text-black")
      }
    >
      {children}
    </button>
  );
}

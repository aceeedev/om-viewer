"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Recipe } from "@/lib/recipe";
import { randomSample, samplePath, type SamplePhoto } from "@/lib/sample-photos";
import { DROP_WORDING, DropZone, PHONE_WORDING } from "./drop-zone";
import { FullView } from "./full-view";
import { loadPhotoFile, loadPhotoUrl, type LoadResult } from "./load-photo";
import { SampleCredit, SampleSourceNote, TrySampleButton } from "./samples";
import { exposureSummary } from "./sections";
import { SimpleView } from "./simple-view";

/** Where a photo came from, besides a file: a pasted link (shown again in the link field) or a sample. */
interface Origin {
  url?: string;
  sample?: SamplePhoto;
}

type ViewerState =
  | { status: "idle" }
  | ({ status: "reading"; fileName: string } & Origin)
  | ({ status: "error"; fileName: string; message: string; phoneMessage?: string } & Origin)
  | ({ status: "ready"; fileName: string; recipe: Recipe; previewUrl: string } & Origin);

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

  const open = useCallback(
    async (label: string, load: (signal: AbortSignal) => Promise<LoadResult>, origin: Origin = {}) => {
      inFlight.current?.abort(); // stops a link that's still downloading
      const controller = new AbortController();
      inFlight.current = controller;
      setState({ status: "reading", fileName: label, ...origin });
      const result = await load(controller.signal);
      if (controller.signal.aborted) return; // a newer photo was opened meanwhile, or the viewer unmounted
      setState(
        result.ok
          ? {
              status: "ready",
              fileName: result.fileName,
              recipe: result.recipe,
              previewUrl: URL.createObjectURL(result.file),
              ...origin,
            }
          : {
              status: "error",
              fileName: result.fileName,
              message: result.message,
              phoneMessage: result.phoneMessage,
              ...origin,
            },
      );
    },
    [],
  );

  const openFile = useCallback((file: File) => open(file.name, () => loadPhotoFile(file)), [open]);
  const openUrl = useCallback(
    (url: string) => open(url.trim(), (signal) => loadPhotoUrl(url, signal), { url: url.trim() }),
    [open],
  );

  // A sample is fetched like a pasted link, from this site's own /samples/ folder.
  const currentSample = state.status === "idle" ? undefined : state.sample?.name;
  const openSample = useCallback(() => {
    const sample = randomSample(currentSample);
    const url = new URL(samplePath(sample), window.location.href).href;
    return open(
      sample.name,
      async (signal) => {
        const result = await loadPhotoUrl(url, signal);
        return result.ok ? result : { ...result, fileName: sample.name };
      },
      { sample },
    );
  }, [open, currentSample]);

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
        <DropZone
          onFile={openFile}
          onUrl={openUrl}
          dragging={dragging}
          busy={state.status === "reading"}
          initialUrl={state.status === "idle" ? undefined : state.url}
        />
        {state.status === "error" && (
          <LoadError fileName={state.fileName} message={state.message} phoneMessage={state.phoneMessage} />
        )}
        <div className="flex flex-col items-center gap-3 pt-4 text-center">
          <div className="flex flex-col items-center gap-x-4 gap-y-2 sm:flex-row">
            <span className="text-sm text-zinc-600">No OM System photo at hand?</span>
            <TrySampleButton onTry={openSample} busy={state.status === "reading"} />
          </div>
          <SampleSourceNote />
        </div>
      </div>
    );
  }

  const { recipe, fileName, sample } = state;
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
          alt={sample ? `Sample photo “${sample.title}” by ${sample.artist}` : `Preview of ${fileName}`}
          className="max-h-[70vh] w-full rounded-md bg-zinc-100 object-contain"
        />
        <header className="flex flex-col gap-1">
          <p className="break-all font-mono text-sm text-zinc-500">{fileName}</p>
          {cameraLine && <p className="font-medium">{cameraLine}</p>}
          {summary && <p className="text-sm text-zinc-600">{summary}</p>}
          {sample && (
            <div className="pt-1">
              <SampleCredit photo={sample} />
            </div>
          )}
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

/**
 * Why a photo didn't open, after its file name or link. Both wordings are in the page when phones
 * get their own (see `DROP_WORDING`), and only the one showing is read out.
 */
export function LoadError({ fileName, message, phoneMessage }: { fileName: string; message: string; phoneMessage?: string }) {
  return (
    <p role="alert" className="rounded-md border-[1.5px] border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
      {/* wrap-anywhere: a pasted link has no spaces to break at. */}
      <span className="font-medium wrap-anywhere">{fileName}:</span>{" "}
      {phoneMessage ? (
        <>
          <span className={DROP_WORDING}>{message}</span>
          <span className={PHONE_WORDING}>{phoneMessage}</span>
        </>
      ) : (
        message
      )}
    </p>
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

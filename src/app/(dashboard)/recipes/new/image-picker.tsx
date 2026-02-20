"use client";

import { useState, useEffect, useRef } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UnsplashPhoto } from "@/app/api/unsplash/search/route";

interface ImagePickerProps {
  value?: string;
  attribution?: string;
  onChange: (url: string | undefined, attribution: string | undefined) => void;
  defaultQuery?: string;
}

export function ImagePicker({
  value,
  onChange,
  defaultQuery,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initializedRef = useRef(false);

  // Pre-fill query with defaultQuery when dialog first opens
  useEffect(() => {
    if (open && !initializedRef.current && defaultQuery) {
      setQuery(defaultQuery);
      initializedRef.current = true;
    }
  }, [open, defaultQuery]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/unsplash/search?query=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          setError("Image search is not available.");
          setResults([]);
        } else {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch {
        setError("Failed to search images.");
        setResults([]);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  function handleSelect(photo: UnsplashPhoto) {
    onChange(
      photo.regularUrl,
      `${photo.photographerName}|${photo.photographerProfileUrl}`
    );
    setOpen(false);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined, undefined);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {value ? (
          <div className="relative aspect-video w-full cursor-pointer rounded-lg overflow-hidden group">
            <img
              src={value}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Change
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">Pick a cover image</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Cover Image</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search photos..."
          autoFocus
        />
        {loading && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {results.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className="rounded overflow-hidden hover:ring-2 hover:ring-primary transition-shadow cursor-pointer"
                onClick={() => handleSelect(photo)}
              >
                <img
                  src={photo.smallUrl}
                  alt={photo.altDescription ?? "Photo"}
                  className="aspect-video w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {!loading && query.length >= 2 && results.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No photos found.</p>
        )}
        {results.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Photos from{" "}
            <a
              href="https://unsplash.com/?utm_source=recipe_manager&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Unsplash
            </a>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

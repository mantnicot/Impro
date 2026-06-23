"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { WordList } from "@/types";
import {
  createList,
  updateList,
  deleteList,
  exportListsData,
  importListsData,
  parseWordsInput,
} from "@/lib/storage";
import { FAVORITES_LIST_ID } from "@/lib/default-words";

interface ListManagerProps {
  lists: WordList[];
  onRefresh: () => void;
  onClose: () => void;
  onPlayList: (list: WordList) => void;
}

export function ListManager({ lists, onRefresh, onClose, onPlayList }: ListManagerProps) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [wordsText, setWordsText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const customLists = lists.filter((l) => l.id !== FAVORITES_LIST_ID);
  const previewWords = parseWordsInput(wordsText);

  const startCreate = () => {
    setName("");
    setWordsText("");
    setMode("create");
  };

  const startEdit = (list: WordList) => {
    setEditId(list.id);
    setName(list.name);
    setWordsText(list.words.join(", "));
    setMode("edit");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const words = parseWordsInput(wordsText);
    if (words.length === 0) return;

    if (mode === "create") {
      await createList(name.trim(), wordsText);
    } else if (mode === "edit" && editId) {
      await updateList(editId, { name: name.trim(), words });
    }
    setMode("view");
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (id === FAVORITES_LIST_ID) return;
    await deleteList(id);
    setConfirmDelete(null);
    onRefresh();
  };

  const handleExport = () => {
    const data = exportListsData(customLists);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tava-listas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      await importListsData(text);
      onRefresh();
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-tava-purple/20 bg-white p-6 sm:max-w-lg sm:rounded-2xl sm:border sm:shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-tava-purple">
            {mode === "view" ? "Mis Listas" : mode === "create" ? "Nueva Lista" : "Editar Lista"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {mode === "view" ? (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={startCreate}
                className="flex-1 rounded-xl bg-tava-purple px-4 py-2 text-sm font-medium text-white hover:bg-tava-purple-light"
              >
                + Crear Lista
              </button>
              <button onClick={handleExport} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
                Exportar
              </button>
              <button onClick={handleImport} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
                Importar
              </button>
            </div>

            <div className="space-y-2">
              {customLists.length === 0 && (
                <p className="py-8 text-center text-gray-400">No hay listas personalizadas aún</p>
              )}
              {customLists.map((list) => (
                <div
                  key={list.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{list.name}</p>
                      <p className="text-xs text-gray-400">
                        {list.words.length} palabras · {new Date(list.createdAt).toLocaleDateString("es")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPlayList(list)}
                        className="rounded-lg bg-purple-100 px-3 py-1 text-sm text-tava-purple hover:bg-purple-200"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => startEdit(list)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600"
                      >
                        ✎
                      </button>
                      {confirmDelete === list.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(list.id)}
                            className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(list.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-400"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                  {list.words.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      {list.words.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-500">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-800 outline-none focus:border-tava-purple"
                placeholder="Ej: Objetos de cocina"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">
                Palabras (comas o una por línea)
              </label>
              <textarea
                value={wordsText}
                onChange={(e) => setWordsText(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-800 outline-none focus:border-tava-purple"
                placeholder={"Mesa, Silla, Pan\nQueso\nGuitarra"}
              />
              {previewWords.length > 0 && (
                <p className="mt-1 text-sm text-tava-purple">
                  {previewWords.length} palabra{previewWords.length !== 1 ? "s" : ""} detectada
                  {previewWords.length !== 1 ? "s" : ""}: {previewWords.join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={previewWords.length === 0 || !name.trim()}
                className="flex-1 rounded-xl bg-tava-purple py-2 font-medium text-white disabled:opacity-40"
              >
                Guardar
              </button>
              <button
                onClick={() => setMode("view")}
                className="rounded-xl border border-gray-200 px-4 py-2 text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

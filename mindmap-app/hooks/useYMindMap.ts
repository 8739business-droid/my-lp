"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import { Awareness } from "y-protocols/awareness";
import {
  docAddComment,
  docAddNode,
  docDeleteComment,
  docDeleteNode,
  docSetCommentResolved,
  docSetMeta,
  docUpdateNode,
  docToData,
  hydrateDoc,
  isDocEmpty,
  pickUserColor,
  readComments,
} from "@/lib/collab";
import { addChild, addSibling, createEmptyMap, resolveNodeColor, uid } from "@/lib/mindmap";
import type {
  CollabUser,
  Comment,
  MindMapData,
  MindNode,
  NodeId,
  ThemeId,
} from "@/lib/types";
import { STORAGE_KEY, USER_KEY } from "@/lib/types";

export type CollabMode = "local" | "collab";
export type ViewMode = "edit" | "view";

type Options = {
  roomId: string | null;
  viewMode: ViewMode;
};

export function useYMindMap({ roomId, viewMode }: Options) {
  const [data, setData] = useState<MindMapData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [peers, setPeers] = useState<CollabUser[]>([]);
  const [me, setMe] = useState<CollabUser>(() => loadUser());
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const docRef = useRef<Y.Doc | null>(null);
  const idbRef = useRef<IndexeddbPersistence | null>(null);
  const rtcRef = useRef<WebrtcProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  const mode: CollabMode = roomId ? "collab" : "local";

  // Init.
  useEffect(() => {
    const docName = roomId ? `mindmap:${roomId}` : "mindmap:local";
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    const idb = new IndexeddbPersistence(docName, ydoc);
    idbRef.current = idb;

    let rtc: WebrtcProvider | null = null;
    let awareness: Awareness | null = null;

    const refreshData = () => {
      const d = docToData(ydoc);
      if (d) setData(d);
      setComments(readComments(ydoc));
    };

    const refreshPeers = () => {
      if (!awareness) return;
      const states = awareness.getStates();
      const list: CollabUser[] = [];
      states.forEach((s, clientID) => {
        if (clientID === awareness!.clientID) return;
        if (s && s.user) {
          const u = s.user as Omit<CollabUser, "id">;
          list.push({ id: clientID, ...u });
        }
      });
      setPeers(list);
    };

    idb.on("synced", () => {
      if (isDocEmpty(ydoc)) {
        // Try migrating from legacy localStorage.
        try {
          const raw =
            typeof localStorage !== "undefined"
              ? localStorage.getItem(STORAGE_KEY)
              : null;
          if (raw) {
            const parsed = JSON.parse(raw) as MindMapData;
            if (parsed && parsed.nodes && parsed.rootId) {
              hydrateDoc(ydoc, migrate(parsed));
            }
          }
        } catch {
          // ignore
        }
        if (isDocEmpty(ydoc)) {
          hydrateDoc(ydoc, createEmptyMap());
        }
      }

      // Start WebRTC after seeding (ensures we have something to share).
      if (roomId) {
        try {
          rtc = new WebrtcProvider(roomId, ydoc, {
            signaling: [
              "wss://signaling.yjs.dev",
              "wss://y-webrtc-signaling-eu.herokuapp.com",
              "wss://y-webrtc-signaling-us.herokuapp.com",
            ],
          });
          rtcRef.current = rtc;
          awareness = rtc.awareness;
          awarenessRef.current = awareness;
          awareness.setLocalStateField("user", {
            name: me.name,
            color: me.color,
            selectedId: null,
          });
          awareness.on("change", refreshPeers);
        } catch (e) {
          console.warn("WebRTC provider failed", e);
        }
      }

      refreshData();
      setStatus("ready");
    });

    ydoc.on("update", refreshData);

    return () => {
      ydoc.off("update", refreshData);
      awareness?.off("change", refreshPeers);
      rtc?.destroy();
      idb.destroy();
      ydoc.destroy();
      docRef.current = null;
      idbRef.current = null;
      rtcRef.current = null;
      awarenessRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Keep awareness user info in sync when `me` changes.
  useEffect(() => {
    saveUser(me);
    const a = awarenessRef.current;
    if (a) {
      a.setLocalStateField("user", {
        name: me.name,
        color: me.color,
        selectedId: me.selectedId ?? null,
      });
    }
  }, [me]);

  const canEdit = viewMode === "edit";

  // Actions (guarded by canEdit).
  const guard = useCallback(
    <T,>(fn: () => T): T | undefined => {
      if (!canEdit) return undefined;
      return fn();
    },
    [canEdit],
  );

  const setTitle = (title: string) =>
    guard(() => docRef.current && docSetMeta(docRef.current, "title", title));

  const setTheme = (themeId: ThemeId) =>
    guard(() => docRef.current && docSetMeta(docRef.current, "themeId", themeId));

  const updateNode = (id: NodeId, patch: Partial<MindNode>) =>
    guard(() => docRef.current && docUpdateNode(docRef.current, id, patch));

  const removeNode = (id: NodeId) =>
    guard(() => docRef.current && docDeleteNode(docRef.current, id));

  const createChild = (parentId: NodeId): NodeId | undefined => {
    if (!canEdit || !data || !docRef.current) return undefined;
    const { data: next, newId } = addChild(data, parentId);
    const node = next.nodes[newId];
    docAddNode(docRef.current, node);
    return newId;
  };

  const createSibling = (nodeId: NodeId): NodeId | undefined => {
    if (!canEdit || !data || !docRef.current) return undefined;
    const { data: next, newId } = addSibling(data, nodeId);
    const node = next.nodes[newId];
    docAddNode(docRef.current, node);
    return newId;
  };

  const replaceMap = (next: MindMapData) =>
    guard(() => docRef.current && hydrateDoc(docRef.current, next));

  const addComment = (nodeId: NodeId, text: string) => {
    if (!canEdit || !docRef.current) return;
    const comment: Comment = {
      id: uid(),
      nodeId,
      author: me.name,
      text,
      createdAt: Date.now(),
    };
    docAddComment(docRef.current, comment);
  };

  const removeComment = (id: string) =>
    guard(() => docRef.current && docDeleteComment(docRef.current, id));

  const resolveComment = (id: string, resolved: boolean) =>
    guard(
      () => docRef.current && docSetCommentResolved(docRef.current, id, resolved),
    );

  const setSelectedForAwareness = (id: NodeId | null) => {
    const a = awarenessRef.current;
    if (!a) return;
    a.setLocalStateField("user", {
      name: me.name,
      color: me.color,
      selectedId: id,
    });
  };

  const updateMe = (patch: Partial<CollabUser>) =>
    setMe((prev) => ({ ...prev, ...patch }));

  return {
    data,
    comments,
    status,
    mode,
    canEdit,
    me,
    peers,
    actions: {
      setTitle,
      setTheme,
      updateNode,
      removeNode,
      createChild,
      createSibling,
      replaceMap,
      addComment,
      removeComment,
      resolveComment,
      setSelectedForAwareness,
      updateMe,
    },
  };
}

function loadUser(): CollabUser {
  if (typeof localStorage === "undefined") {
    return { id: 0, name: "匿名", color: pickUserColor() };
  }
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CollabUser;
      if (parsed.name && parsed.color) return parsed;
    }
  } catch {
    // ignore
  }
  const u: CollabUser = {
    id: 0,
    name: `ユーザー${Math.floor(Math.random() * 100)}`,
    color: pickUserColor(),
  };
  saveUser(u);
  return u;
}

function saveUser(u: CollabUser) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ name: u.name, color: u.color }));
  } catch {
    // ignore
  }
}

function migrate(d: MindMapData): MindMapData {
  if (!d.themeId) {
    return { ...d, version: 2, themeId: "default" };
  }
  return d;
}

// Re-export helper for consumers.
export { resolveNodeColor };

"use client";
import { useEffect } from "react";
import { forgetInviteAction, rememberInviteAction } from "./actions";

/** remember : garde le jeton le temps de se connecter. forget : invitation inutilisable, on l'oublie. */
export function RememberInvite({ token, forget = false }: { token: string; forget?: boolean }) {
  useEffect(() => { if (forget) forgetInviteAction(); else rememberInviteAction(token); }, [token, forget]);
  return null;
}

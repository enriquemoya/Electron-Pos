"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@pos/ui";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TerminalState = {
  activated: boolean;
  terminalId: string | null;
  branchId: string | null;
  status: "not_activated" | "active" | "offline" | "revoked";
  activatedAt: string | null;
  lastVerifiedAt: string | null;
  messageCode: string | null;
};

type RotateResult = {
  status: "active" | "offline" | "revoked" | "not_activated";
  state: TerminalState;
};

type ActivationCopy = {
  appName: string;
  sidebarEyebrow: string;
  sidebarActiveBadge: string;
  sidebarInactiveBadge: string;
  sidebarFooter: string;
  nav: Array<{ href: string; label: string }>;
  activationTitle: string;
  activationDescription: string;
  activationLabel: string;
  activationPlaceholder: string;
  activateAction: string;
  activatingAction: string;
  activatedMessage: string;
  notActivatedMessage: string;
  offlineMessage: string;
  revokedMessage: string;
  genericError: string;
  invalidKeyError: string;
  rateLimitedError: string;
};

declare global {
  interface Window {
    koyote?: {
      terminalAuth?: {
        getState: () => Promise<TerminalState>;
        activate: (
          activationApiKey: string
        ) => Promise<{ ok: true; state: TerminalState } | { ok: false; error: string; code: string }>;
        rotate: () => Promise<RotateResult>;
        clear: () => Promise<TerminalState>;
        onStateChanged: (handler: (state: TerminalState) => void) => () => void;
      };
    };
  }
}

function formatLastVerified(value: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mapError(copy: ActivationCopy, code?: string) {
  switch (code) {
    case "POS_INVALID_ACTIVATION_KEY":
      return copy.invalidKeyError;
    case "POS_RATE_LIMITED":
      return copy.rateLimitedError;
    default:
      return copy.genericError;
  }
}

export function ActivationGate({ copy, children }: { copy: ActivationCopy; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<TerminalState | null>(null);
  const [activationKey, setActivationKey] = useState("");
  const [statusMessage, setStatusMessage] = useState<string>(copy.notActivatedMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const terminalApi = typeof window !== "undefined" ? window.koyote?.terminalAuth : undefined;

  const applyState = useCallback(
    (nextState: TerminalState) => {
      setState(nextState);
      if (nextState.status === "offline") {
        setStatusMessage(`${copy.offlineMessage} ${formatLastVerified(nextState.lastVerifiedAt)}`);
        return;
      }
      if (nextState.status === "revoked") {
        setStatusMessage(copy.revokedMessage);
        return;
      }
      if (nextState.activated) {
        setStatusMessage(copy.activatedMessage);
        return;
      }
      setStatusMessage(copy.notActivatedMessage);
    },
    [copy.activatedMessage, copy.notActivatedMessage, copy.offlineMessage, copy.revokedMessage]
  );

  const bootstrap = useCallback(async () => {
    if (!terminalApi) {
      setReady(true);
      setState({
        activated: true,
        terminalId: null,
        branchId: null,
        status: "active",
        activatedAt: null,
        lastVerifiedAt: null,
        messageCode: null
      });
      setStatusMessage(copy.activatedMessage);
      return;
    }

    const currentState = await terminalApi.getState();
    applyState(currentState);

    if (currentState.activated) {
      const rotation = await terminalApi.rotate();
      applyState(rotation.state);
    }

    setReady(true);
  }, [applyState, copy.activatedMessage, terminalApi]);

  useEffect(() => {
    bootstrap().catch(() => {
      setReady(true);
      setErrorMessage(copy.genericError);
    });
  }, [bootstrap, copy.genericError]);

  useEffect(() => {
    if (!terminalApi?.onStateChanged) {
      return;
    }

    const unsubscribe = terminalApi.onStateChanged((nextState) => {
      applyState(nextState);
      if (!nextState.activated) {
        setActivationKey("");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [applyState, terminalApi]);

  const handleActivate = async () => {
    if (!terminalApi) {
      return;
    }

    const trimmed = activationKey.trim();
    if (!trimmed) {
      setErrorMessage(copy.invalidKeyError);
      return;
    }

    setActivating(true);
    setErrorMessage(null);

    try {
      const activated = await terminalApi.activate(trimmed);
      if (!activated.ok) {
        setErrorMessage(mapError(copy, activated.code));
        return;
      }
      applyState(activated.state);
      setActivationKey("");
    } finally {
      setActivating(false);
    }
  };

  const showActivation = useMemo(() => {
    if (!state) {
      return true;
    }
    return !state.activated || state.status === "revoked";
  }, [state]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-lg font-semibold text-zinc-100">{copy.activationTitle}</h1>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">{copy.notActivatedMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showActivation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-900 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-2xl font-semibold text-zinc-100">{copy.activationTitle}</h1>
            <p className="text-sm text-zinc-300">{copy.activationDescription}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">{copy.activationLabel}</label>
              <Input
                value={activationKey}
                onChange={(event) => setActivationKey(event.target.value)}
                placeholder={copy.activationPlaceholder}
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-zinc-400">{statusMessage}</p>
            {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
            <Button type="button" onClick={handleActivate} disabled={activating} className="w-full">
              {activating ? copy.activatingAction : copy.activateAction}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        appName={copy.appName}
        eyebrow={copy.sidebarEyebrow}
        activeBadge={copy.sidebarActiveBadge}
        inactiveBadge={copy.sidebarInactiveBadge}
        footerText={statusMessage}
        items={copy.nav}
      />
      <main className="flex-1 bg-base-800 p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}

export type { ActivationCopy };

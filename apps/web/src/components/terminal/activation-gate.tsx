"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@pos/ui";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PinDisplay } from "@/components/terminal/pin-display";
import { PinKeypad } from "@/components/terminal/pin-keypad";

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
  terminalAlreadyActivatedError: string;
  terminalRevokedError: string;
  terminalFingerprintMismatchError: string;
  pinTitle: string;
  pinDescription: string;
  pinLabel: string;
  pinPlaceholder: string;
  pinClear: string;
  pinBackspace: string;
  pinSubmit: string;
  pinSubmitting: string;
  pinInvalidError: string;
  pinForbiddenError: string;
  pinBranchError: string;
  sessionExpiredError: string;
  permissionDeniedTitle: string;
  permissionDeniedDescription: string;
};

type PosSessionState = {
  authenticated: boolean;
  status: "active" | "expired" | "not_authenticated";
  user: {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    branchId: string | null;
    displayName: string;
    expiresAt: string;
  } | null;
};

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
    case "TERMINAL_ALREADY_ACTIVATED":
      return copy.terminalAlreadyActivatedError;
    case "TERMINAL_REVOKED":
      return copy.terminalRevokedError;
    case "TERMINAL_FINGERPRINT_MISMATCH":
      return copy.terminalFingerprintMismatchError;
    default:
      return copy.genericError;
  }
}

function isRendererReload() {
  if (typeof window === "undefined") {
    return false;
  }
  const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry?.type === "reload") {
    return true;
  }
  // Fallback for older navigation API.
  return typeof window.performance.navigation !== "undefined" && window.performance.navigation.type === 1;
}

export function ActivationGate({ copy, children }: { copy: ActivationCopy; children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<TerminalState | null>(null);
  const [session, setSession] = useState<PosSessionState | null>(null);
  const [activationKey, setActivationKey] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string>(copy.notActivatedMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const terminalApi = typeof window !== "undefined" ? window.koyote?.terminalAuth : undefined;
  const posUserAuthApi = typeof window !== "undefined" ? window.koyotePosUserAuth : undefined;

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
    if (!terminalApi || !posUserAuthApi) {
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
      setSession({
        authenticated: true,
        status: "active",
        user: {
          id: "desktop-dev",
          role: "ADMIN",
          branchId: null,
          displayName: "Desktop Admin",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString()
        }
      });
      return;
    }

    const currentState = await terminalApi.getState();
    applyState(currentState);

    if (currentState.activated) {
      const rotation = await terminalApi.rotate();
      applyState(rotation.state);
      if (isRendererReload()) {
        await posUserAuthApi.logout();
      }
      const currentSession = await posUserAuthApi.getSession();
      setSession(currentSession);
    } else {
      setSession({ authenticated: false, status: "not_authenticated", user: null });
    }

    setReady(true);
  }, [applyState, copy.activatedMessage, posUserAuthApi, terminalApi]);

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

  const appendPinDigit = useCallback((digit: string) => {
    if (!/^\d$/.test(digit)) {
      return;
    }
    setPinValue((current) => (current.length >= 6 ? current : `${current}${digit}`));
  }, []);

  const removePinDigit = useCallback(() => {
    setPinValue((current) => current.slice(0, -1));
  }, []);

  const clearPinDigits = useCallback(() => {
    setPinValue("");
  }, []);

  const handlePinLogin = async () => {
    if (!posUserAuthApi) {
      return;
    }
    if (!/^\d{6}$/.test(pinValue)) {
      setErrorMessage(copy.pinInvalidError);
      return;
    }
    setPinLoading(true);
    setErrorMessage(null);
    try {
      const result = await posUserAuthApi.loginWithPin(pinValue);
      if (!result.ok) {
        if (result.code === "AUTH_INVALID_CREDENTIALS") {
          setErrorMessage(copy.pinInvalidError);
        } else if (result.code === "AUTH_FORBIDDEN") {
          setErrorMessage(copy.pinForbiddenError);
        } else if (result.code === "AUTH_SESSION_EXPIRED") {
          setErrorMessage(copy.sessionExpiredError);
        } else if (result.code === "BRANCH_FORBIDDEN") {
          setErrorMessage(copy.pinBranchError);
        } else {
          setErrorMessage(copy.genericError);
        }
        return;
      }
      const currentSession = await posUserAuthApi.getSession();
      setSession(currentSession);
      setPinValue("");
    } finally {
      setPinLoading(false);
    }
  };

  const showActivation = useMemo(() => {
    if (!state) {
      return true;
    }
    return !state.activated || state.status === "revoked";
  }, [state]);

  const showPinLogin = useMemo(() => {
    if (showActivation) {
      return false;
    }
    return !session?.authenticated;
  }, [session?.authenticated, showActivation]);

  useEffect(() => {
    if (!showPinLogin) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        appendPinDigit(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        removePinDigit();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        clearPinDigits();
        return;
      }
      if (event.key === "Enter" && pinValue.length === 6 && !pinLoading) {
        event.preventDefault();
        void handlePinLogin();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appendPinDigit, clearPinDigits, handlePinLogin, pinLoading, pinValue.length, removePinDigit, showPinLogin]);

  const isEmployee = session?.user?.role === "EMPLOYEE";
  const navItems = useMemo(() => {
    if (!isEmployee) {
      return copy.nav;
    }
    const allowed = new Set(["/dashboard", "/new-sale", "/inventory", "/sales", "/tournaments", "/settings/cash-register"]);
    return copy.nav.filter((item) => allowed.has(item.href));
  }, [copy.nav, isEmployee]);

  const routeForbiddenForEmployee = useMemo(() => {
    if (!isEmployee || !pathname) {
      return false;
    }
    const forbidden = [
      "/products",
      "/reports",
      "/customers",
      "/settings/expansions",
      "/settings/game-types",
      "/settings/integrations"
    ];
    return forbidden.some((prefix) => pathname.startsWith(prefix));
  }, [isEmployee, pathname]);

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
            {errorMessage ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
            <Button type="button" onClick={handleActivate} disabled={activating} className="w-full">
              {activating ? copy.activatingAction : copy.activateAction}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPinLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-900 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-2xl font-semibold text-zinc-100">{copy.pinTitle}</h1>
            <p className="text-sm text-zinc-300">{copy.pinDescription}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">{copy.pinLabel}</label>
              <PinDisplay valueLength={pinValue.length} />
            </div>
            <PinKeypad
              disabled={pinLoading}
              onDigit={appendPinDigit}
              onBackspace={removePinDigit}
              onClear={clearPinDigits}
              clearLabel={copy.pinClear}
              backspaceLabel={copy.pinBackspace}
            />
            {errorMessage ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
            {session?.status === "expired" ? <p className="text-xs text-amber-300">{copy.sessionExpiredError}</p> : null}
            <Button
              type="button"
              onClick={handlePinLogin}
              disabled={pinLoading || pinValue.length !== 6}
              className="w-full"
            >
              {pinLoading ? copy.pinSubmitting : copy.pinSubmit}
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
        items={navItems}
      />
      <main className="flex-1 bg-base-800 p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {routeForbiddenForEmployee ? (
            <Card>
              <CardHeader>
                <h1 className="text-xl font-semibold text-zinc-100">{copy.permissionDeniedTitle}</h1>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">{copy.permissionDeniedDescription}</p>
              </CardContent>
            </Card>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

export type { ActivationCopy };

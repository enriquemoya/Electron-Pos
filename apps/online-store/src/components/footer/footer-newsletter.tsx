"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function FooterNewsletter() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState("");
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white">{t("footer.newsletter.title")}</h3>
          <p className="text-sm text-white/60">{t("footer.newsletter.subtitle")}</p>
        </div>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmed = email.trim();
            if (!trimmed || !emailRegex.test(trimmed)) {
              toast.error(t("footer.newsletter.error"));
              return;
            }
            if (trimmed.toLowerCase() === lastSubmitted.toLowerCase()) {
              toast.info(t("footer.newsletter.duplicate"));
              return;
            }
            try {
              setIsLoading(true);
              await new Promise((resolve) => setTimeout(resolve, 600));
              toast.success(t("footer.newsletter.success"));
              setLastSubmitted(trimmed);
              setEmail("");
            } catch {
              toast.error(t("footer.newsletter.error"));
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <label className="sr-only" htmlFor="footer-newsletter-email">
            {t("footer.newsletter.label")}
          </label>
          <Input
            id="footer-newsletter-email"
            type="email"
            placeholder={t("footer.newsletter.placeholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1 bg-base-900/60 text-white"
            aria-describedby="footer-newsletter-help"
            aria-invalid={Boolean(email) && !emailRegex.test(email)}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("footer.newsletter.loading") : t("footer.newsletter.cta")}
          </Button>
        </form>
        <p id="footer-newsletter-help" className="mt-2 text-xs text-white/40">
          {t("footer.newsletter.help")}
        </p>
      </CardContent>
    </Card>
  );
}

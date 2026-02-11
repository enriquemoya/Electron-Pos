 "use client";

 import { useEffect } from "react";

 type EnvCheckPayload = {
   cloudApiUrl: string | null;
   nextPublicApiUrl: string | null;
   hasCloudSecret: boolean;
   hasJwtSecret: boolean;
 };

 async function safeReadBody(response: Response) {
   try {
     return await response.text();
   } catch {
     return "<unreadable>";
   }
 }

 export function ApiDebugger() {
   useEffect(() => {
     const run = async () => {
       try {
         console.log("[deploy-test] ApiDebugger boot", new Date().toISOString());
         const envRes = await fetch("/api/env-check", { cache: "no-store" });
         const envText = await safeReadBody(envRes);
         let env: EnvCheckPayload | null = null;
         try {
           env = JSON.parse(envText) as EnvCheckPayload;
         } catch {
           console.error("[api-debug] env-check invalid json", envText);
         }

         console.error("[api-debug] env-check", {
           status: envRes.status,
           body: env ?? envText
         });

         const apiUrl = env?.cloudApiUrl || env?.nextPublicApiUrl;
         if (!apiUrl) {
           console.error("[api-debug] Missing API URL in env.");
           return;
         }

         const target = `${apiUrl.replace(/\/$/, "")}/api/cloud/catalog/featured`;

         const res = await fetch(target, { method: "GET" });
         const body = await safeReadBody(res);
         console.error("[api-debug] api response", {
           url: target,
           status: res.status,
           ok: res.ok,
           body
         });
       } catch (error) {
         console.error("[api-debug] failed", error);
       }
     };

     void run();
   }, []);

   return null;
 }

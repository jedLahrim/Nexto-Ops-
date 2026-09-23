'use client';

import { useTranslation } from "react-i18next";
import { UserType } from "@/services/auth.service";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import {
  ArrowRight,
  Clock,
  Loader2,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/services/api";

type Step = "form" | "code" | "waiting";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPanel({
  redirectAfterAuth,
  showAccessRequest = false,
  onToggleAccessRequest,
}: {
  redirectAfterAuth?: string;
  showAccessRequest?: boolean;
  onToggleAccessRequest?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [otpStep, setOtpStep] = useState<{ email: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Access-request flow state.
  const [reqStep, setReqStep] = useState<Step>("form");
  const [reqForm, setReqForm] = useState({ name: "", email: "", department: "" });
  const [reqCode, setReqCode] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await api.post('/user/admin/login', { email, password });
      
      const user = response.data;
      // if (user.type !== UserType.SUPER_USER) {
      //   setError(t('auth.access_denied', 'access denied for this place'));
      //   setIsLoading(false);
      //   return;
      // }

      localStorage.setItem('access_token', user.access || response.data.access_token);
      
      router.push(redirectAfterAuth ?? "/dashboard");
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
         setError(t('auth.access_denied', 'access denied for this place'));
      } else if (err.response?.status === 409 || err.response?.data?.code === 'ERR_EMAIL_OR_PASSWORD_IS_INCORRECT') {
         setError(t('auth.invalid_credentials', 'Invalid email or password.'));
      } else {
         setError(err.response?.data?.message || "Sign-in failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      
      // If we want to check ADMINS before sending code, we could.
      // But we can just check it on verify-email step.
      await api.post('/user/login', { email });
      
      setOtpStep({ email });
      setIsLoading(false);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
         setError(t('auth.access_denied', 'access denied for this place'));
      } else {
         setError(err.response?.data?.message || "Failed to send verification code. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/user/verify-email', {
        email: otpStep?.email,
        code: otp
      });
      
      const user = response.data;
      // if (user.type !== UserType.SUPER_USER) {
      //   setError(t('auth.access_denied', 'access denied for this place'));
      //   setIsLoading(false);
      //   setOtp("");
      //   return;
      // }

      localStorage.setItem('access_token', user.access || response.data.access_token);
      
      router.push(redirectAfterAuth ?? "/dashboard");
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
         setError(t('auth.access_denied', 'access denied for this place'));
      } else {
         setError(err.response?.data?.message || "The verification code you entered is incorrect.");
      }
      setIsLoading(false);
      setOtp("");
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    if (!EMAIL_RE.test(reqForm.email.trim())) {
      setReqError("Enter a valid email address.");
      return;
    }
    setReqBusy(true);
    try {
      await api.post('/user/register/guest', {
        email: reqForm.email.trim(),
        name: reqForm.name.trim() || undefined,
        department: reqForm.department.trim() || undefined,
      });
      setReqEmail(reqForm.email.trim());
      setReqStep("code");
    } catch (err: any) {
      setReqError(err.response?.data?.message || "Could not send the code.");
    } finally {
      setReqBusy(false);
    }
  };

  const submitReqCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    setReqBusy(true);
    try {
      await api.post('/user/verify-email', { email: reqEmail, code: reqCode });
      setReqStep("waiting");
    } catch (err: any) {
      setReqError(err.response?.data?.message || "Code verification failed.");
    } finally {
      setReqBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-md border shadow-md">
      <CardHeader className="text-center relative">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="flex justify-center mt-2">
          <Image
            src={logo}
            alt="NextoOps logo"
            width={56}
            height={56}
            className="mb-3 mt-1 rounded-lg"
          />
        </div>
        <CardTitle className="text-xl">{t('auth.title')}</CardTitle>
        <CardDescription>
          {t('auth.subtitle')}
        </CardDescription>
      </CardHeader>

      {showAccessRequest ? (
        <>
          {reqStep === "form" && (
            <form onSubmit={submitRequest}>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="req-name">{t('auth.req_name')}</Label>
                  <Input
                    id="req-name"
                    value={reqForm.name}
                    onChange={(e) => setReqForm({ ...reqForm, name: e.target.value })}
                    placeholder={t('auth.req_name_placeholder')}
                    disabled={reqBusy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req-email">{t('auth.req_email')}</Label>
                  <Input
                    id="req-email"
                    type="email"
                    value={reqForm.email}
                    onChange={(e) => setReqForm({ ...reqForm, email: e.target.value })}
                    placeholder={t('auth.req_email_placeholder')}
                    required
                    disabled={reqBusy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req-dept">{t('auth.req_dept')}</Label>
                  <Input
                    id="req-dept"
                    value={reqForm.department}
                    onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                    placeholder={t('auth.req_dept_placeholder')}
                    disabled={reqBusy}
                  />
                </div>
                {reqError && <p className="text-center text-sm text-red-500">{reqError}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={reqBusy}>
                  {reqBusy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 size-4" /> {t('auth.req_submit')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onToggleAccessRequest}
                >
                  {t('auth.req_back')}
                </Button>
              </CardFooter>
            </form>
          )}

          {reqStep === "code" && (
            <form onSubmit={submitReqCode}>
              <CardHeader className="text-center">
                <CardTitle className="text-base">{t('auth.verify_title')}</CardTitle>
                <CardDescription>
                  {t('auth.verify_subtitle', { email: reqEmail })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex justify-center">
                  <InputOTP value={reqCode} onChange={setReqCode} maxLength={6} disabled={reqBusy}>
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {reqError && <p className="mt-3 text-center text-sm text-red-500">{reqError}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={reqBusy || reqCode.length !== 6}>
                  {reqBusy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {t('auth.verify_confirm')} <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setReqStep("form");
                    setReqError(null);
                  }}
                >
                  {t('auth.verify_different_email')}
                </Button>
              </CardFooter>
            </form>
          )}

          {reqStep === "waiting" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                  <Clock className="size-6 text-amber-600" />
                </div>
                <CardTitle className="text-base">{t('auth.waiting_title')}</CardTitle>
                <CardDescription>
                  {t('auth.waiting_subtitle')}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={onToggleAccessRequest}>
                  {t('auth.req_back')}
                </Button>
              </CardFooter>
            </>
          )}
        </>
      ) : otpStep ? (
        <>
          <CardHeader className="text-center">
            <CardTitle className="text-base">{t('auth.verify_title')}</CardTitle>
            <CardDescription>{t('auth.verify_subtitle', { email: otpStep.email })}</CardDescription>
          </CardHeader>
          <form onSubmit={handleOtpSubmit}>
            <CardContent className="pb-4">
              <input type="hidden" name="email" value={otpStep.email} />
              <input type="hidden" name="code" value={otp} />
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                      const form = (e.target as HTMLElement).closest("form");
                      form?.requestSubmit();
                    }
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> {t('common.loading')}
                  </>
                ) : (
                  <>
                    {t('auth.verify_confirm')} <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpStep(null);
                  setError(null);
                }}
              >
                {t('auth.verify_different_email')}
              </Button>
            </CardFooter>
          </form>
        </>
      ) : (
        <CardContent className="pb-6">
          <Tabs defaultValue="password">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="gap-1.5">
                <Lock className="size-3.5" /> {t('auth.tab_password')}
              </TabsTrigger>
              <TabsTrigger value="otp" className="gap-1.5">
                <Mail className="size-3.5" /> {t('auth.tab_email_code')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">{t('auth.username_label')}</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="text"
                    inputMode="email"
                    placeholder={t('auth.username_placeholder')}
                    autoComplete="username"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">{t('auth.password_label')}</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder={t('auth.password_placeholder')}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('auth.signing_in')}
                    </>
                  ) : (
                    <>
                      {t('auth.sign_in_button')} <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="mt-4">
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email">{t('auth.email_label')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="otp-email"
                      name="email"
                      placeholder={t('auth.email_placeholder')}
                      type="email"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> {t('auth.sending_code')}
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 size-4" /> {t('auth.send_code_button')}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

          <div className="mt-5 rounded-lg border border-dashed p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t('auth.no_account')}{" "}
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                onClick={onToggleAccessRequest}
              >
                <UserPlus className="size-3.5" /> {t('auth.request_access')}
              </button>
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3" />
              {t('auth.request_access_desc')}
            </p>
          </div>
        </CardContent>
      )}

      <div className="rounded-b-lg border-t bg-muted px-6 py-3 text-center text-xs text-muted-foreground">
        {t('auth.footer_note')}
      </div>
    </Card>
  );
}

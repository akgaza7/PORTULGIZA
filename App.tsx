import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LessonDetail from "@/pages/LessonDetail";
import Onboarding from "@/components/Onboarding";
import AuthScreen from "@/components/AuthScreen";
import { useOnboarding } from "@/store/onboarding";
import type { Level } from "@/store/onboarding";
import { AuthProvider, useAuth } from "@/store/authContext";
import { logoutUser, loadUser, activateSubscription } from "@/store/auth";
import { CheckCircle, Loader2 } from "lucide-react";
import { PT } from "@/lib/colors";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lesson/:id" component={LessonDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

type CheckoutState = "idle" | "verifying" | "success" | "cancel" | "error";

function CheckoutSuccessScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: PT.greenBg }}
        >
          <CheckCircle size={32} style={{ color: PT.green }} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment confirmed!</h2>
        <p className="text-slate-500 text-sm mb-1">Your subscription is now active.</p>
        <p className="text-slate-400 text-xs">You have full access to all lessons and quizzes.</p>
        <button
          onClick={onDone}
          className="mt-6 w-full py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ backgroundColor: PT.green }}
        >
          Start learning →
        </button>
      </div>
    </div>
  );
}

function CheckoutVerifying() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
        <Loader2 size={36} className="animate-spin mx-auto mb-4 text-blue-500" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Confirming your payment…</h2>
        <p className="text-slate-500 text-sm">Just a moment while we activate your subscription.</p>
      </div>
    </div>
  );
}

function AppGate() {
  const { user, refresh } = useAuth();
  const { onboarding, complete } = useOnboarding();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");

    if (!checkout) return;

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    };

    if (checkout === "success" && sessionId) {
      setCheckoutState("verifying");
      cleanUrl();

      fetch(`/api/verify-checkout?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data: any) => {
          if (data.status === "paid" || data.subscriptionId) {
            const u = loadUser();
            if (u) {
              activateSubscription(u);
              refresh();
            }
            setCheckoutState("success");
          } else {
            setCheckoutState("error");
          }
        })
        .catch(() => setCheckoutState("error"));
    } else if (checkout === "cancel") {
      cleanUrl();
      setCheckoutState("idle");
    }
  }, [refresh]);

  const handleCheckoutDone = () => {
    setCheckoutState("idle");
    refresh();
  };

  if (checkoutState === "verifying") return <CheckoutVerifying />;
  if (checkoutState === "success") return <CheckoutSuccessScreen onDone={handleCheckoutDone} />;

  if (!user) {
    return <AuthScreen onComplete={refresh} />;
  }

  if (!onboarding.completed) {
    return (
      <Onboarding
        onComplete={(level: Level) => { complete(level); }}
        onBack={() => { logoutUser(); refresh(); }}
      />
    );
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

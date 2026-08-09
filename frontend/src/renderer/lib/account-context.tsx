import { createContext, type FormEvent, type ReactNode, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import aicoderoomLogo from "../../../assets/aicoderoom-logo.svg";
import {
	type AccountUser,
	ControlPlaneError,
	currentUser,
	register as registerAccount,
	signIn as signInAccount,
	signOut as signOutAccount,
} from "./control-plane-client";

type AccountContextValue = {
	user: AccountUser;
	signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function useAccount(): AccountContextValue {
	const value = useContext(AccountContext);
	if (!value) throw new Error("useAccount must be used inside AccountGate");
	return value;
}

export function useAccountMaybe(): AccountContextValue | null {
	return useContext(AccountContext);
}

export function AccountGate({ children }: { children: ReactNode }) {
	const testMode = import.meta.env.MODE === "test";
	const [state, setState] = useState<{ status: "loading" | "guest" | "ready"; user?: AccountUser }>(
		testMode
			? { status: "ready", user: { id: "test-user", email: "test@aicoderoom.local", displayName: "Test User" } }
			: { status: "loading" },
	);

	useEffect(() => {
		if (testMode) return;
		void currentUser()
			.then((user) => setState(user ? { status: "ready", user } : { status: "guest" }))
			.catch(() => setState({ status: "guest" }));
	}, [testMode]);

	if (state.status === "loading") return <AccountLoading />;
	if (state.status === "guest" || !state.user) return <AccountLogin onAuthenticated={(user) => setState({ status: "ready", user })} />;

	return (
		<AccountContext.Provider
			value={{
				user: state.user,
				signOut: async () => {
					await signOutAccount();
					setState({ status: "guest" });
				},
			}}
		>
			{children}
		</AccountContext.Provider>
	);
}

function AccountLoading() {
	const { t } = useTranslation();
	return (
		<div className="grid h-screen place-items-center bg-background text-foreground">
			<Loader2 className="size-6 animate-spin text-muted-foreground" aria-label={t("account.loading")} />
		</div>
	);
}

function AccountLogin({ onAuthenticated }: { onAuthenticated: (user: AccountUser) => void }) {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"login" | "register">("login");
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string>();

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setError(undefined);
		try {
			const user = mode === "login" ? await signInAccount(email, password) : await registerAccount(displayName, email, password);
			onAuthenticated(user);
		} catch (failure) {
			setError(
				failure instanceof ControlPlaneError && failure.code === "server_unavailable"
					? t("account.serverUnavailable")
					: failure instanceof Error
						? failure.message
						: t("account.failed"),
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
			<div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-xl">
				<div className="mb-6 flex items-center gap-3">
					<img src={aicoderoomLogo} alt="" className="size-11 rounded-xl" />
					<div>
						<h1 className="text-xl font-semibold">{t("account.productName")}</h1>
						<p className="text-sm text-muted-foreground">{t("account.subtitle")}</p>
					</div>
				</div>
				<div className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-1">
					{(["login", "register"] as const).map((item) => (
						<button
							className={`rounded-md px-3 py-2 text-sm ${mode === item ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
							key={item}
							onClick={() => {
								setMode(item);
								setError(undefined);
							}}
							type="button"
						>
							{t(`account.${item}`)}
						</button>
					))}
				</div>
				<form className="space-y-4" onSubmit={(event) => void submit(event)}>
					{mode === "register" ? (
						<label className="block text-sm">
							<span className="mb-1.5 block text-muted-foreground">{t("account.displayName")}</span>
							<input className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} />
						</label>
					) : null}
					<label className="block text-sm">
						<span className="mb-1.5 block text-muted-foreground">{t("account.email")}</span>
						<input autoComplete="email" className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
					</label>
					<label className="block text-sm">
						<span className="mb-1.5 block text-muted-foreground">{t("account.password")}</span>
						<input autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" minLength={mode === "register" ? 10 : 1} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
						{mode === "register" ? <span className="mt-1 block text-xs text-muted-foreground">{t("account.passwordHint")}</span> : null}
					</label>
					{error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
					<button className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={submitting} type="submit">
						{submitting ? <Loader2 className="size-4 animate-spin" /> : t(mode === "login" ? "account.loginAction" : "account.registerAction")}
					</button>
				</form>
			</div>
		</div>
	);
}

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { getErrorMessage, useResetPassword } from "@/hooks/useAuth";
import { LoadingButton } from "@/components/common/LoadingButton";
const schema = z
    .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z
        .string()
        .min(1, "Please confirm your password"),
})
    .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
});
export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "demo-reset-token";
    const email = searchParams.get("email") ?? "alex@finova.app";
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState(null);
    const resetPassword = useResetPassword();
    const { register, handleSubmit, formState: { errors }, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = async (data) => {
        setServerError(null);
        try {
            await resetPassword.mutateAsync({ ...data, token, email });
        }
        catch (err) {
            setServerError(getErrorMessage(err));
        }
    };
    return (<div className="finova-card auth-glow animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
                    <ShieldCheck size={28} className="text-white"/>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                    Reset your password
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Enter your new password below.
                </p>
            </div>

            {serverError && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                    {serverError}
                </div>)}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                    <label htmlFor="reset-password" className="finova-label">
                        New password
                    </label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <input id="reset-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min. 8 characters" className={`finova-input pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} {...register("password")}/>
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                            {showPassword ? (<EyeOff size={18}/>) : (<Eye size={18}/>)}
                        </button>
                    </div>
                    {errors.password && (<p className="text-destructive text-xs mt-1">
                            {errors.password.message}
                        </p>)}
                </div>

                <div>
                    <label htmlFor="reset-confirm" className="finova-label">
                        Confirm new password
                    </label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <input id="reset-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your new password" className={`finova-input pl-10 pr-10 ${errors.password_confirmation ? "border-destructive" : ""}`} {...register("password_confirmation")}/>
                        <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                            {showConfirm ? (<EyeOff size={18}/>) : (<Eye size={18}/>)}
                        </button>
                    </div>
                    {errors.password_confirmation && (<p className="text-destructive text-xs mt-1">
                            {errors.password_confirmation.message}
                        </p>)}
                </div>

                <LoadingButton type="submit" loading={resetPassword.isPending} fullWidth className="h-11 text-base">
                    Reset Password
                </LoadingButton>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
                    ← Back to Login
                </Link>
            </p>
        </div>);
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CameraOff,
  Globe2,
  Crown,
  LogOut,
  Menu,
  Radio,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { COUNTRIES, countryLabel } from "@/lib/constants";
import { toast } from "sonner";

type SiteHeaderProps = {
  onDisableDevices?: () => Promise<void> | void;
  matchCountry?: string;
  onMatchCountryChange?: (country: string) => void;
};

export function SiteHeader({ onDisableDevices, matchCountry, onMatchCountryChange }: SiteHeaderProps) {
  const { user, profile, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeAccount = useServerFn(deleteMyAccount);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleDisableDevices() {
    await onDisableDevices?.();
    toast.success("Camera and microphone access is off in the app.");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await removeAccount({ data: undefined });
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the account");
      setDeleting(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Radio className="size-4" />
          </span>
          <span className="font-display text-base font-bold sm:text-lg">CHAT STATION</span>
        </Link>

        <nav className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/pricing">Pricing</Link>
          </Button>
          {isStaff && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <Shield className="size-4" /> Admin
              </Link>
            </Button>
          )}
          {loading ? null : user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/chat">Chat</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open account menu">
                    <Menu className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="px-2 py-2">
                    <span className="block truncate text-sm">{profile?.display_name ?? "My account"}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {profile?.is_premium ? "Premium plan" : "Free plan"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="h-10 cursor-pointer">
                    <Link to="/profile"><UserRound /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="h-10 cursor-pointer">
                    <Link to="/pricing"><Crown /> Upgrade subscription</Link>
                  </DropdownMenuItem>
                  {onMatchCountryChange && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="h-10 cursor-pointer">
                        <Globe2 /> Country: {matchCountry === "__any__" ? "Anywhere" : countryLabel(matchCountry)}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
                        <DropdownMenuRadioGroup value={matchCountry} onValueChange={onMatchCountryChange}>
                          <DropdownMenuRadioItem value="__any__">Anywhere</DropdownMenuRadioItem>
                          {COUNTRIES.filter((country) => country.value !== "XX").map((country) => (
                            <DropdownMenuRadioItem key={country.value} value={country.value}>
                              {country.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuItem
                    className="h-10 cursor-pointer"
                    onSelect={() => void handleDisableDevices()}
                  >
                    <CameraOff /> Turn off camera &amp; mic
                  </DropdownMenuItem>
                  {isStaff && (
                    <DropdownMenuItem asChild className="h-10 cursor-pointer">
                      <Link to="/admin"><Shield /> Moderation</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="h-10 cursor-pointer" onSelect={() => void handleSignOut()}>
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="h-10 cursor-pointer text-destructive focus:text-destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <Trash2 /> Delete account permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile, chat history and sign-in will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteAccount();
              }}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

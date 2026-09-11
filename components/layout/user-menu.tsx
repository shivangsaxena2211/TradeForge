import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  user: SessionUser;
};

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className="hidden text-right sm:block"
        aria-label={`Signed in as ${user.username}`}
      >
        <p className="text-xs font-medium leading-none">{user.username}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </div>
  );
}

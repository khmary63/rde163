import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/proxy-client";
import { useAuth } from "@/hooks/use-auth";

export function useStaffRole() {
  const { user, loading } = useAuth();
  const { data: isStaff, isLoading } = useQuery({
    queryKey: ["is-staff", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin" || r.role === "manager");
    },
  });
  return { isStaff: !!isStaff, loading: loading || isLoading };
}

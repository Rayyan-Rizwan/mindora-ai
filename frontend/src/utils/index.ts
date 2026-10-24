export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function classNames(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function roleHomePath(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "professional") return "/professional/dashboard";
  return "/dashboard";
}
